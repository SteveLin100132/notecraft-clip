const PROTOCOL = '1.3';
const MAX_VIEWPORT = 16000; // Chrome 的貼圖尺寸上限

/* 點圖示：已注入就切換，沒注入就注入 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  if (!/^(https?|file):/.test(tab.url || '')) {
    notify(tab.id, 'Chrome 內部頁面（chrome://、擴充功能商店）不允許擴充功能執行。');
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'ncclip:toggle' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['picker.js'],
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'ncclip:capture' && sender.tab) {
    run(sender.tab.id, msg)
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: readable(err) }));
    return true;
  }
  // 成功 toast 的「開啟資料夾」：在系統檔案總管中定位剛存好的檔案
  if (msg.type === 'ncclip:reveal') {
    if (typeof msg.id === 'number') {
      try { chrome.downloads.show(msg.id); } catch {}
    }
    sendResponse({ ok: true });
    return;
  }
  // 錯誤 toast 的「查看說明」：開啟打包的 README
  if (msg.type === 'ncclip:openHelp') {
    chrome.tabs.create({ url: chrome.runtime.getURL('README.md') });
    sendResponse({ ok: true });
    return;
  }
});

/* ---------------- 主流程 ---------------- */

async function run(tabId, msg) {
  const shot = await capture(tabId, msg);
  const saved = await save(shot.data, shot.filename);

  if (saved.ok) {
    return {
      ok: true,
      filename: saved.filename,
      downloadId: saved.id,
      note: shot.note,
      expanded: shot.expanded,
      floated: shot.floated,
      revealed: shot.revealed,
      size: shot.size,
      via: 'downloads',
    };
  }
  // 下載 API 走不通時，把資料交回頁面用 <a download> 硬存
  return {
    ok: true,
    filename: shot.filename,
    note: shot.note,
    expanded: shot.expanded,
    floated: shot.floated,
    revealed: shot.revealed,
    size: shot.size,
    via: 'blob',
    data: shot.data,
    warning: saved.error,
  };
}

async function capture(tabId, msg) {
  const target = { tabId };
  await chrome.debugger.attach(target, PROTOCOL);
  let prepared = false;
  let overridden = false;

  try {
    await chrome.debugger.sendCommand(target, 'Page.enable');

    // 附加偵錯工具會冒出提示列、擠壓頁面，等版面重排完再量尺寸
    await sleep(350);

    const prep = await chrome.tabs.sendMessage(tabId, {
      type: 'ncclip:prepare',
      floatMode: msg.floatMode,
      wide: msg.wide,
    });
    if (!prep || !prep.ok) throw new Error(prep && prep.error ? prep.error : '無法展開內容');
    prepared = true;

    // captureBeyondViewport 只拿得到 viewport 大小的合成畫面，超出的部分是空白。
    // 改成把 viewport 直接撐到蓋住整個元素，這樣就是一般的畫面內截圖。
    // 放大 viewport 本身會再觸發重排（vh 單位、媒體查詢、sticky），所以量到穩定為止。
    let clip = prep.clip;
    for (let pass = 0; pass < 2; pass++) {
      await chrome.debugger.sendCommand(target, 'Emulation.setDeviceMetricsOverride', {
        width: Math.min(Math.ceil(Math.max(prep.viewport.width, clip.x + clip.width)), MAX_VIEWPORT),
        height: Math.min(Math.ceil(clip.y + clip.height) + 4, MAX_VIEWPORT),
        deviceScaleFactor: prep.scale,
        mobile: false,
      });
      overridden = true;

      await sleep(pass === 0 ? 250 : 150);
      const again = await chrome.tabs.sendMessage(tabId, { type: 'ncclip:measure' });
      if (!again || !again.ok) break;

      const moved =
        Math.abs(again.clip.height - clip.height) > 2 ||
        Math.abs(again.clip.width - clip.width) > 2 ||
        Math.abs(again.clip.y - clip.y) > 2;
      clip = again.clip;
      if (!moved) break;
    }

    // 撐高後給「認 viewport 的」lazy render（IO 型）一點時間畫；捲動觸發型的已在 prepare 掃過了
    await sleep(300);

    const res = await chrome.debugger.sendCommand(target, 'Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
      clip: { ...clip, scale: 1 }, // 解析度已經交給 deviceScaleFactor
    });

    if (!res || !res.data) throw new Error('Chrome 沒有回傳圖片資料');
    return {
      data: res.data,
      filename: prep.filename,
      note: prep.note,
      expanded: prep.expanded,
      floated: prep.floated,
      revealed: prep.revealed,
      size: Math.round(clip.width * prep.scale) + '×' + Math.round(clip.height * prep.scale),
    };
  } finally {
    if (overridden) {
      try {
        await chrome.debugger.sendCommand(target, 'Emulation.clearDeviceMetricsOverride');
      } catch {}
    }
    if (prepared) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'ncclip:cleanup' });
      } catch {}
    }
    try {
      await chrome.debugger.detach(target);
    } catch {}
  }
}

/* ---------------- 存檔 ---------------- */

async function save(base64, filename) {
  try {
    const url = await toBlobUrl(base64);
    const id = await startDownload({ url, filename });
    const outcome = await settled(id);
    if (!outcome.ok) return outcome;
    return { ok: true, filename: outcome.filename || filename, id };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

async function toBlobUrl(base64) {
  await ensureOffscreen();
  const res = await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'ncclip:blob',
    data: base64,
  });
  if (!res || !res.ok) throw new Error((res && res.error) || '無法建立圖片資料');
  return res.url;
}

function startDownload({ url, filename }) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url,
        filename, // 相對路徑 → 存進 Chrome 設定的預設下載資料夾
        saveAs: false,
        conflictAction: 'uniquify',
      },
      (id) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (id === undefined) return reject(new Error('下載沒有被建立'));
        resolve(id);
      }
    );
  });
}

/* 等下載真的落地，這樣才能回報「被中斷」而不是假裝成功 */
function settled(id) {
  return new Promise((resolve) => {
    const done = (result) => {
      chrome.downloads.onChanged.removeListener(onChanged);
      clearTimeout(timer);
      resolve(result);
    };

    const onChanged = (delta) => {
      if (delta.id !== id) return;
      if (delta.state && delta.state.current === 'complete') {
        chrome.downloads.search({ id }, (items) => {
          const path = items && items[0] && items[0].filename;
          done({ ok: true, filename: path ? path.split(/[\\/]/).pop() : null });
        });
      } else if (delta.state && delta.state.current === 'interrupted') {
        done({ ok: false, error: '下載被中斷：' + ((delta.error && delta.error.current) || '未知原因') });
      }
    };

    const timer = setTimeout(() => done({ ok: true, filename: null }), 8000);
    chrome.downloads.onChanged.addListener(onChanged);
  });
}

/* ---------------- 離螢幕頁面 ---------------- */

let offscreenReady = null;

async function ensureOffscreen() {
  if (offscreenReady) return offscreenReady;

  offscreenReady = (async () => {
    try {
      if (chrome.offscreen.hasDocument && (await chrome.offscreen.hasDocument())) return;
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['BLOBS'],
        justification: '把截圖資料轉成可下載的連結',
      });
    } catch (err) {
      // 已經存在就當作成功，其他錯誤才往外拋
      if (!/single offscreen document|already exists/i.test(String(err && err.message))) {
        offscreenReady = null;
        throw err;
      }
    }
  })();

  return offscreenReady;
}

/* ---------------- 雜項 ---------------- */

function readable(err) {
  const text = String((err && err.message) || err);
  if (/already attached|另一個/i.test(text)) {
    return '這個分頁已經有偵錯工具連著了，請先關掉 DevTools 再試一次。';
  }
  if (/Cannot access|cannot be scripted/i.test(text)) {
    return '這個頁面不允許擴充功能存取。';
  }
  return text;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function notify(tabId, text) {
  chrome.scripting
    .executeScript({ target: { tabId }, func: (t) => alert(t), args: [text] })
    .catch(() => {});
}
