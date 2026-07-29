const test = require('node:test');
const assert = require('node:assert');
const { createPage } = require('./harness');

/* 注意：斷言只驗屬性與值，不驗 !important。
   jsdom 對部分 longhand（display、overflow-y）會在序列化時吃掉 !important，
   跨版本行為還不一致。實際程式碼一律用 setProperty(..., 'important')，
   這點要靠實機截圖驗證。 */

const TALL = { left: 40, top: 120, width: 900, height: 4200, bottom: 4320, right: 940 };

/* 一般頁面：外層有真的在捲的容器，內層有純裝飾的 overflow:hidden */
function simplePage() {
  return createPage({
    html: `<!DOCTYPE html><body>
      <div id="topbar" style="position:fixed;top:0">nav</div>
      <div id="scroller" style="overflow:auto;height:400px">
        <div id="decor" style="overflow:hidden;border-radius:8px">
          <div id="target">form
            <div id="actions" style="position:sticky;bottom:0">建立 取消</div>
          </div>
        </div>
      </div>
    </body>`,
    dims: { scroller: [2000, 400], decor: [300, 300] },
    rects: { target: TALL },
  });
}

test('只展開真的把內容切掉的容器，裝飾用的 overflow:hidden 不動', async () => {
  const page = simplePage();
  page.pick('target');

  const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  assert.match(page.style('scroller'), /height: auto !important/);
  assert.equal(page.style('decor'), 'overflow:hidden;border-radius:8px');
  assert.ok(res.expanded >= 1);
});

test('預設不動 overflow，寬度才不會跑掉', async () => {
  const page = simplePage();
  page.pick('target');

  await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });
  assert.doesNotMatch(page.style('scroller'), /overflow: visible/);

  await page.send({ type: 'ncclip:cleanup' });
  await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: true });
  assert.match(page.style('scroller'), /overflow: visible !important/);
});

test('floatMode 三種模式對 sticky 子孫的處理', async () => {
  const expected = {
    hide: /display: none/,
    static: /position: static/,
    keep: /^position:sticky;bottom:0$/,
  };

  for (const [mode, pattern] of Object.entries(expected)) {
    const page = simplePage();
    page.pick('target');
    await page.send({ type: 'ncclip:prepare', floatMode: mode, wide: false });
    assert.match(page.style('actions'), pattern, `floatMode=${mode}`);
    // 目標外部的浮動元素在 hide / static 兩種模式下都要藏起來
    if (mode !== 'keep') assert.match(page.style('topbar'), /display: none/);
  }
});

test('展開後還原，inline style 必須逐字回到原狀', async () => {
  for (const mode of ['hide', 'static', 'keep']) {
    const page = simplePage();
    const before = page.snapshot();

    page.pick('target');
    await page.send({ type: 'ncclip:prepare', floatMode: mode, wide: false });
    await page.send({ type: 'ncclip:cleanup' });

    assert.equal(page.snapshot(), before, `floatMode=${mode} 還原不一致`);
  }
});

test('原本沒有 inline style 的節點還原後不能留下空的 style=""', async () => {
  const page = simplePage();
  page.pick('target');
  await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });
  await page.send({ type: 'ncclip:cleanup' });

  assert.equal(page.document.getElementById('target').getAttribute('style'), null);
});

test('app shell 的 html / body 也要展開，否則文件被切在視窗高度', async () => {
  const page = createPage({
    html: `<!DOCTYPE html><html style="overflow:hidden;height:100%"><body style="overflow:hidden;height:100%">
      <div id="scroller" style="overflow:auto"><div id="target">content</div></div>
    </body></html>`,
    dims: { scroller: [2000, 400], BODY: [2000, 768], HTML: [2000, 768] },
    rects: { target: TALL },
  });
  page.pick('target');

  const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  assert.equal(res.expanded, 3, 'html / body / scroller 三層都要處理到');
  // 根層的 overflow 控制整個 viewport 能不能捲，hidden 會直接截斷文件高度
  assert.match(page.document.body.getAttribute('style'), /overflow-y: visible/);
  assert.match(page.document.documentElement.getAttribute('style'), /overflow-y: visible/);
});

test('選取範圍內部的捲動容器（子孫、不在祖先鏈上）也要展開', async () => {
  // 選整個 top layer 面板：真正在裁切的捲軸是子孫。彈窗（<dialog> / 側欄）常是這種結構
  const page = createPage({
    html: `<!DOCTYPE html><body>
      <dialog id="panel" open>
        <header id="head">開機磁碟</header>
        <div id="body" style="overflow-y:auto;height:600px">
          <div id="content">很長的表單…</div>
        </div>
        <footer id="foot">選取 取消</footer>
      </dialog>
    </body>`,
    dims: { body: [3000, 600] },
    rects: { panel: TALL },
  });
  page.pick('panel');

  const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  assert.match(page.style('body'), /height: auto !important/, '內層捲動容器要被撐高');
  assert.ok(res.expanded >= 1);

  await page.send({ type: 'ncclip:cleanup' });
  assert.equal(page.document.getElementById('body').getAttribute('style'), 'overflow-y:auto;height:600px');
});

test('上下釘死的定位面板，放掉 bottom 後真的長高才保留（試了再量）', async () => {
  // 面板 top+bottom 兩邊釘死 → height:auto 仍被夾在視窗高度。放掉 bottom 才會依內容往下長高。
  // 這裡用 rects（夾住時的視窗高度）+ grown（放掉後長高）模擬真頁面的 reflow：長高了 → 保留。
  const CLAMPED = { left: 0, top: 0, width: 900, height: 800, bottom: 800, right: 900 };
  const style = 'position:fixed;top:0;bottom:0;right:0;height:100%;overflow:hidden';
  const page = createPage({
    html: `<!DOCTYPE html><body>
      <div id="panel" style="${style}">
        <div id="body" style="overflow-y:auto;height:100%"><div id="content">很長的表單…</div></div>
      </div>
    </body>`,
    dims: { body: [3000, 800] },
    rects: { panel: CLAMPED },
    grown: { panel: TALL },
  });
  page.pick('panel');

  const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  assert.match(page.style('panel'), /bottom: auto/, '上下釘死的面板要放掉 bottom');
  assert.match(page.style('panel'), /height: auto !important/);
  assert.match(page.style('body'), /height: auto !important/, '內層捲軸也要撐開');
  assert.ok(res.expanded >= 2);

  await page.send({ type: 'ncclip:cleanup' });
  assert.equal(page.document.getElementById('panel').getAttribute('style'), style, '還原要逐字回到原狀');
});

test('放掉 bottom 後反而塌陷的容器要整個還原（app shell，避免截出全白）', async () => {
  // GCP 主內容常見結構：捲動主區是 absolute inset:0 的 div，子孫多是絕對定位、沒有 in-flow 高度。
  // 對它放掉 bottom 會整塊塌成 0、截出全白。tryUncap 撐開後量到沒長高（沒給 grown）→ 整個還原。
  const shellStyle = 'position:absolute;top:0;bottom:0;left:0;right:0';
  const page = createPage({
    html: `<!DOCTYPE html><body>
      <div id="shell" style="${shellStyle}">
        <div id="scroll" style="overflow-y:auto;height:100%"><div id="panel">內容</div></div>
      </div>
    </body>`,
    dims: { scroll: [3000, 800] },
    rects: { panel: TALL, shell: { left: 0, top: 0, width: 900, height: 800, bottom: 800, right: 900 } },
    // 故意不給 shell 的 grown：撐開後量到沒長高 → tryUncap 判定塌陷、還原
  });
  page.pick('panel');

  await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  // 捲軸照撐高，但撐不高的 app shell 容器必須逐字還原、不留 bottom:auto
  assert.match(page.style('scroll'), /height: auto !important/, '捲動主區要撐高');
  assert.equal(page.style('shell'), shellStyle, '撐不高的容器不能被解夾，要逐字保持原狀');
});

test('沒有上下釘死就不當作可解夾的面板（保守，不亂改版面）', async () => {
  const style = 'position:fixed;top:0;right:0'; // 只釘上緣、bottom 為 auto，不是被夾住的面板
  const page = createPage({
    html: `<!DOCTYPE html><body>
      <div id="panel" style="${style}"><div id="content">短內容</div></div>
    </body>`,
    rects: { panel: TALL },
  });
  page.pick('panel');

  await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });
  assert.equal(page.style('panel'), style, '沒有上下釘死就不要動面板');
});

test('shadow DOM 裡的浮動元素也要找得到', async () => {
  const page = createPage({
    html: `<!DOCTYPE html><body>
      <div id="scroller" style="overflow:auto"><div id="target">content</div></div>
      <shadow-host id="sh"></shadow-host>
    </body>`,
    dims: { scroller: [2000, 400] },
    rects: { target: TALL },
  });

  const shadow = page.document.getElementById('sh').attachShadow({ mode: 'open' });
  shadow.innerHTML = `<div id="footer" style="position:fixed;bottom:0">建立</div>`;

  const before = page.snapshot([shadow]);
  page.pick('target');

  const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });
  assert.match(shadow.getElementById('footer').getAttribute('style'), /display: none/);
  assert.equal(res.floated, 1);

  await page.send({ type: 'ncclip:cleanup' });
  assert.equal(page.snapshot([shadow]), before, 'shadow DOM 的改動也要還原');
});

test('檔名符合 downloads API 的限制', async () => {
  const page = createPage({
    html: `<!DOCTYPE html><body><div id="scroller" style="overflow:auto">
      <div id="target" class="cfc-steplist-step">x</div></div></body>`,
    dims: { scroller: [2000, 400] },
    rects: { target: TALL },
    url: 'https://console.cloud.google.com/compute/instancesAdd',
  });
  page.pick('target');

  const { filename } = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  assert.match(filename, /^[\w.-]+\.png$/, '不能有路徑分隔符或特殊字元');
  assert.ok(!filename.includes('..'), '不能有相對路徑片段');
  assert.ok(filename.startsWith('console.cloud.google.com-'));
});

test('元素過大時降低 deviceScaleFactor，避免超過貼圖上限', async () => {
  const cases = [
    { height: 4200, expected: 2 },
    { height: 12000, expected: 1 },
  ];

  for (const { height, expected } of cases) {
    const page = createPage({
      html: `<!DOCTYPE html><body><div id="scroller" style="overflow:auto">
        <div id="target">x</div></div></body>`,
      dims: { scroller: [2000, 400] },
      rects: { target: { left: 0, top: 0, width: 900, height, bottom: height, right: 900 } },
    });
    page.pick('target');

    const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });
    assert.equal(res.scale, expected, `height=${height}`);
    assert.ok(res.clip.width * res.scale <= 16000 && res.clip.height * res.scale <= 16000);
  }
});

test('沒有可見尺寸時要回報錯誤，而且要先把改動還原', async () => {
  const page = createPage({
    html: `<!DOCTYPE html><body><div id="scroller" style="overflow:auto">
      <div id="target">x</div></div></body>`,
    dims: { scroller: [2000, 400] },
    rects: { target: { left: 0, top: 0, width: 0, height: 0, bottom: 0, right: 0 } },
  });
  const before = page.snapshot();
  page.pick('target');

  const res = await page.send({ type: 'ncclip:prepare', floatMode: 'hide', wide: false });

  assert.equal(res.ok, false);
  assert.equal(page.snapshot(), before, '失敗路徑也要還原');
});
