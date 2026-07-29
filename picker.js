(() => {
  if (window.__notecraftClip) {
    window.__notecraftClip.toggle();
    return;
  }

  const MAX_PX = 16000; // Chrome 貼圖尺寸上限，超過會截出空白圖

  let host, root, box, boxTag, boxIcon, boxDesc, boxSize, bar, info, toast, floatSelect, wideInput, exportBtn;
  let toastTimer = null;
  let pendingDismiss = null;
  let mode = 'off'; // off | picking | selected
  let current = null;
  let selected = null;
  let saved = null;
  let pageScroll = null;
  let busy = false;

  /* ---------------- 介面 ---------------- */

  /* 打包進 web_accessible_resources 的字型；shadow 內以 @font-face 宣告，不連 CDN */
  const FONTS = [
    ['Noto Sans TC', 400, 'ntc-400-subset.woff2'],
    ['Noto Sans TC', 500, 'ntc-500-subset.woff2'],
    ['Noto Sans TC', 700, 'ntc-700-subset.woff2'],
    ['Noto Sans', 400, 'nsans-400-latin.woff2'],
    ['Noto Sans', 500, 'nsans-500-latin.woff2'],
    ['Noto Sans', 700, 'nsans-700-latin.woff2'],
    ['Noto Sans Mono', 400, 'nmono-400-latin.woff2'],
    ['Noto Sans Mono', 500, 'nmono-500-latin.woff2'],
  ];
  /* 測試 stub 沒有 chrome.runtime.getURL，退回相對路徑（jsdom 不載字型，無害） */
  const fontURL = (f) =>
    typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('fonts/' + f)
      : 'fonts/' + f;
  const FONT_FACES = FONTS.map(
    ([fam, wt, file]) =>
      `@font-face{font-family:'${fam}';font-style:normal;font-weight:${wt};` +
      `font-display:swap;src:url(${fontURL(file)}) format('woff2');}`
  ).join('\n');

  /* 選取框標籤圖示，Lucide 風格 2px 描邊 */
  const ICON_SCAN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>';
  const ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_DOWNLOAD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>';
  const ICON_REFRESH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>';
  const ICON_IMAGE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';
  const ICON_SPINNER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>';
  const ICON_CHECK_CIRCLE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/></svg>';
  const ICON_ALERT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  const ICON_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>';

  const CSS = `
    ${FONT_FACES}

    /* ---- 基座：token 變數、重置、keyframes ---- */
    :host { all: initial; }
    :host {
      --blue-50:#eef4fb; --blue-400:#4d84cb; --blue-500:#2c6ebb; --blue-700:#1b4f9c; --blue-800:#163f7d;
      --orange-50:#fdf4e6; --orange-200:#f6cd86; --orange-300:#f2b955; --orange-400:#ed9b26; --orange-500:#e37b24;
      --n0:#ffffff; --n50:#f6f8fb; --n100:#eef1f6; --n200:#e1e6ee; --n300:#cbd3df;
      --n400:#9aa6b8; --n500:#6c798e; --n600:#4f5b6e; --n700:#3a4456; --n800:#262e3d; --n900:#161c28;
      --success:#2e9e6b; --success-50:#e7f6ee; --warning:#e3a008; --danger:#d64545; --danger-50:#fbeaea;
      --font-cjk:'Noto Sans TC'; --font-latin:'Noto Sans'; --font-mono:'Noto Sans Mono';
      --ease-out:cubic-bezier(.16,1,.3,1);
    }
    * { box-sizing: border-box; font-family: var(--font-latin), var(--font-cjk), system-ui, sans-serif; }

    /* 入場動畫必須保留 translateX(-50%)，否則破壞水平居中 */
    @keyframes ncRise { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%); } }
    @keyframes ncSpin { to { transform: rotate(360deg); } }
    /* 行進虛線：四個軸向錨點 100% 必須保留，否則線條滑進框內 */
    @keyframes ncMarch { to { background-position: 24px 0, -24px 100%, 0 -24px, 100% 24px; } }

    /* ---- A. 選取覆蓋框 ---- */
    .nc-box {
      position: fixed;
      pointer-events: none;
      border-radius: 3px;
      display: none;
      z-index: 1;
    }
    /* A1 hover：行進虛線用 background 畫四邊，不用 border（保留原始寬度概念）＋內填＋外圈輔助線 */
    .nc-box.hover {
      background-color: rgba(44,110,187,.07);
      background-image:
        linear-gradient(90deg, var(--blue-500) 50%, transparent 0),
        linear-gradient(90deg, var(--blue-500) 50%, transparent 0),
        linear-gradient(0deg, var(--blue-500) 50%, transparent 0),
        linear-gradient(0deg, var(--blue-500) 50%, transparent 0);
      background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
      background-position: 0 0, 0 100%, 0 0, 100% 0;
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
      outline: 1px solid rgba(44,110,187,.18);
      outline-offset: 6px;
      animation: ncMarch 900ms linear infinite;
    }
    /* A2 鎖定：金色實線＋柔光暈 */
    .nc-box.locked {
      background-color: rgba(237,155,38,.10);
      border: 2px solid var(--orange-400);
      box-shadow: 0 0 0 6px rgba(237,155,38,.16);
    }

    /* 角落標籤 pill：左上角對齊框線並上移 13px */
    .nc-tag {
      position: absolute;
      top: -13px;
      left: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 60vw;
      padding: 4px 11px;
      color: #fff;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 6px 18px rgba(17,47,93,.18);
    }
    .nc-box.hover .nc-tag { background: var(--blue-700); }
    .nc-box.locked .nc-tag { background: var(--orange-400); box-shadow: 0 6px 18px rgba(227,123,36,.28); }
    .nc-tag svg { width: 12px; height: 12px; flex: none; }
    .nc-tag-desc {
      font-family: var(--font-mono);
      font-size: 11.5px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* A2 右下角尺寸標籤 */
    .nc-size {
      position: absolute;
      bottom: -11px;
      right: 0;
      display: none;
      padding: 3px 10px;
      color: #fff;
      background: var(--n800);
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1.4;
      white-space: nowrap;
    }
    .nc-box.locked .nc-size { display: block; }

    /* ---- 浮動工具列容器（B/C/D 共用）---- */
    .nc-bar {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%);
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 7px;
      height: 56px;
      padding: 0 8px;
      max-width: calc(100vw - 32px);
      color: var(--n900);
      background: var(--n0);
      border: 1px solid var(--n200);
      border-radius: 16px;
      box-shadow: 0 14px 34px rgba(17,47,93,.16);
      z-index: 3;
      animation: ncRise 240ms var(--ease-out) both;
    }
    /* 深色網頁：白卡片外加白描邊、換深色陰影，確保脫離背景可讀 */
    .nc-bar.on-dark { border-color: rgba(255,255,255,.6); box-shadow: 0 14px 34px rgba(0,0,0,.45); }

    .nc-badge {
      width: 34px; height: 34px; flex: none;
      border-radius: 10px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .nc-badge svg { width: 18px; height: 18px; }
    .nc-badge-blue { background: var(--blue-50); color: var(--blue-700); }
    .nc-badge-gold { background: var(--orange-400); color: #fff; }

    .nc-txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 0 2px; }
    .nc-title { font-family: var(--font-cjk); font-weight: 700; font-size: 14.5px; line-height: 1.3; color: var(--n900); white-space: nowrap; }
    .nc-sub { font-size: 12px; color: var(--n500); white-space: nowrap; }

    .nc-div { width: 1px; height: 28px; flex: none; background: var(--n200); }

    /* ---- B. 鍵盤提示 ---- */
    .nc-keys { display: flex; align-items: center; gap: 14px; }
    .nc-key { display: inline-flex; align-items: center; gap: 7px; }
    .nc-key kbd {
      min-width: 24px; height: 24px; padding: 0 6px;
      border: 1px solid var(--n300); border-bottom-width: 2px; border-radius: 6px;
      background: var(--n50); color: var(--n700);
      font-family: var(--font-mono); font-size: 12px; line-height: 1;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .nc-key > span { font-family: var(--font-cjk); font-size: 12.5px; color: var(--n600); white-space: nowrap; }

    /* ---- C. 已選取工具列 ---- */
    .nc-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; max-width: 176px; padding: 0 2px; }
    .nc-desc {
      font-family: var(--font-mono); font-weight: 500; font-size: 13px; color: var(--n900);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nc-meta {
      font-size: 11.5px; color: var(--n500);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* 浮動元素處理下拉：自繪 chevron */
    .nc-select {
      height: 36px; border-radius: 10px; border: 1px solid var(--n300);
      background: var(--n0); color: var(--n700);
      font-family: var(--font-cjk); font-size: 12.5px; line-height: 1;
      padding: 0 32px 0 11px; cursor: pointer;
      -webkit-appearance: none; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236c798e' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 11px center; background-size: 14px;
    }

    /* 連水平方向展開：自繪核取方塊 */
    .nc-wide { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; }
    .nc-wide > span { font-family: var(--font-cjk); font-size: 12.5px; color: var(--n700); white-space: nowrap; }
    .nc-check {
      width: 18px; height: 18px; flex: none; margin: 0; position: relative; cursor: pointer;
      border-radius: 5px; border: 1.5px solid var(--n300); background: var(--n0);
      -webkit-appearance: none; appearance: none;
    }
    .nc-check:checked { background: var(--blue-700); border-color: var(--blue-700); }
    .nc-check:checked::after {
      content: ""; position: absolute; left: 5px; top: 2px; width: 5px; height: 9px;
      border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg);
    }

    /* 按鈕組：全 pill、高 36px */
    .nc-actions { display: flex; align-items: center; gap: 8px; }
    .nc-btn {
      height: 36px; border-radius: 999px; border: 0; padding: 0 16px;
      font-family: var(--font-cjk); font-weight: 700; font-size: 14px; line-height: 1;
      cursor: pointer; white-space: nowrap;
      display: inline-flex; align-items: center; gap: 8px;
      transition: background var(--_d,.18s) var(--ease-out), box-shadow .18s var(--ease-out), transform .12s var(--ease-out);
    }
    .nc-btn svg { width: 16px; height: 16px; flex: none; }
    .nc-btn:not(:disabled):active { transform: scale(.97); }
    .nc-btn:disabled { cursor: not-allowed; }
    .nc-btn-primary { background: var(--orange-400); color: #fff; }
    .nc-btn-primary:not(:disabled):hover { background: var(--orange-500); box-shadow: 0 8px 22px rgba(227,123,36,.32); }
    .nc-btn-secondary { background: var(--blue-700); color: #fff; }
    .nc-btn-secondary:not(:disabled):hover { background: var(--blue-800); }
    .nc-btn-ghost { background: transparent; color: var(--blue-700); border: 2px solid var(--blue-500); padding: 0 14px; }
    .nc-btn-ghost:not(:disabled):hover { background: var(--blue-50); }

    /* 鍵盤焦點環：所有可聚焦元件一致 */
    .nc-select:focus-visible, .nc-check:focus-visible, .nc-btn:focus-visible {
      outline: 3px solid var(--blue-400); outline-offset: 2px;
    }

    /* ---- D. 截圖中（loading）---- */
    .nc-badge-loading { background: var(--orange-50); color: var(--orange-500); }
    .nc-btn:disabled { opacity: .5; cursor: not-allowed; }
    /* spinner 高度不得撐高按鈕：用固定尺寸的 svg */
    .nc-spin { display: inline-flex; }
    .nc-spin svg { width: 15px; height: 15px; animation: ncSpin 900ms linear infinite; }

    /* 不定量流光進度（無真實百分比，不造假數字） */
    .nc-prog { display: flex; flex-direction: column; gap: 5px; justify-content: center; }
    .nc-track { position: relative; width: 150px; height: 6px; border-radius: 999px; background: var(--n100); overflow: hidden; }
    .nc-fill { position: absolute; top: 0; left: 0; height: 100%; width: 40%; border-radius: 999px; background: var(--orange-400); animation: ncFlow 1.15s linear infinite; }
    .nc-prog-cap { font-size: 11px; color: var(--n500); font-family: var(--font-cjk); white-space: nowrap; }
    @keyframes ncFlow { 0% { transform: translateX(-120%); } 100% { transform: translateX(400%); } }

    /* ---- E. 成功／錯誤提示（toast）---- */
    .nc-toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%);
      width: min(430px, calc(100vw - 36px));
      display: none;
      gap: 12px;
      padding: 14px 14px 14px 16px;
      color: var(--n900);
      background: var(--n0);
      border: 1px solid var(--n200);
      border-radius: 16px;
      box-shadow: 0 14px 34px rgba(17,47,93,.16);
      pointer-events: auto;
      z-index: 4;
    }
    .nc-toast.show { display: flex; animation: ncRise 280ms var(--ease-out) both; }
    .nc-toast.on-dark { border-color: rgba(255,255,255,.6); box-shadow: 0 14px 34px rgba(0,0,0,.45); }
    .nc-toast .nc-badge { width: 32px; height: 32px; }
    .nc-badge-success { background: var(--success-50); color: var(--success); }
    .nc-badge-danger { background: var(--danger-50); color: var(--danger); }
    .nc-toast-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
    .nc-toast-title { font-family: var(--font-cjk); font-weight: 700; font-size: 14px; color: var(--n900); }
    .nc-toast-file { font-family: var(--font-mono); font-size: 12px; color: var(--blue-700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nc-toast-desc { font-family: var(--font-cjk); font-size: 12px; line-height: 1.8; color: var(--n600); }
    .nc-toast-actions { display: flex; gap: 8px; margin-top: 6px; }
    .nc-toast-close {
      flex: none; width: 26px; height: 26px; align-self: flex-start;
      border: 0; border-radius: 999px; background: transparent; color: var(--n400); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .nc-toast-close svg { width: 14px; height: 14px; }
    .nc-toast-close:hover { background: var(--n100); color: var(--n700); }
    .nc-toast-close:focus-visible { outline: 3px solid var(--blue-400); outline-offset: 2px; }

    /* 尊重使用者的減少動態偏好 */
    @media (prefers-reduced-motion: reduce) {
      .nc-box.hover, .nc-fill, .nc-spin svg, .nc-bar, .nc-toast.show { animation: none; }
      .nc-fill { width: 100%; opacity: .55; }
    }
  `;

  function build() {
    host = document.createElement('div');
    host.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:2147483000;border:0;margin:0;padding:0;';
    // 光靠 z-index 蓋不過 top layer（<dialog>.showModal / popover 開的彈窗，GCP Console 的側欄就是）。
    // 把 host 自己也宣告成 popover，raise() 時推進 top layer，才壓得住那些彈窗。
    // :host{all:initial} 已經把 popover 的 UA 樣式清乾淨，這裡不會帶進預設邊框／置中。
    host.setAttribute('popover', 'manual');
    root = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CSS;

    box = el('div', 'nc-box');
    boxTag = el('div', 'nc-tag');
    boxIcon = el('span', 'nc-tag-icon');
    boxDesc = el('span', 'nc-tag-desc');
    boxTag.append(boxIcon, boxDesc);
    boxSize = el('div', 'nc-size');
    box.append(boxTag, boxSize);

    bar = el('div', 'nc-bar');

    toast = el('div', 'nc-toast');
    // 成功 toast 自動消失，游標移入時暫停、移出重新計時
    toast.addEventListener('mouseenter', () => clearTimeout(toastTimer));
    toast.addEventListener('mouseleave', armDismiss);

    root.append(style, box, bar, toast);
    document.documentElement.appendChild(host);
  }

  function el(tag, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  /* jsdom 與舊版 Chromium（<114）沒有 popover，退回純 z-index，行為跟以前一樣 */
  function topLayerSupported() {
    return host && typeof host.showPopover === 'function';
  }

  /* 把 host 重新推到 top layer 頂端。頁面之後才開的彈窗會疊在我們上面，
     先 hide 再 show 讓我們成為最後加入者，就會回到最上層。只在 host 可見時呼叫。 */
  function raise() {
    if (!topLayerSupported()) return;
    try {
      if (host.matches(':popover-open')) host.hidePopover();
      host.showPopover();
    } catch (e) {}
  }

  /* 依宿主頁面背景亮度決定要不要套深色網頁的白描邊＋深陰影 */
  function isDarkPage() {
    try {
      for (const node of [document.body, document.documentElement]) {
        if (!node) continue;
        const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (!m) continue;
        const [r, g, b, a = 1] = m[1].split(',').map(Number);
        if (a === 0) continue; // 透明就看下一層
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
      }
    } catch (e) {}
    return false;
  }

  function barClass() {
    return 'nc-bar' + (isDarkPage() ? ' on-dark' : '');
  }

  function keyHint(cap, label) {
    const g = el('span', 'nc-key');
    g.append(kbd(cap));
    const s = document.createElement('span');
    s.textContent = label;
    g.append(s);
    return g;
  }

  function renderPickingBar() {
    bar.className = barClass();
    bar.textContent = '';

    const badge = el('span', 'nc-badge nc-badge-blue');
    badge.innerHTML = ICON_SCAN;

    const text = el('div', 'nc-txt');
    const b = el('b', 'nc-title');
    b.textContent = '選一個區塊';
    const s = el('span', 'nc-sub');
    s.textContent = '移動滑鼠 → 點一下確認';
    text.append(b, s);

    const keys = el('div', 'nc-keys');
    keys.append(keyHint('↑', '選父層'), keyHint('↓', '選子層'), keyHint('Esc', '取消'));

    bar.append(badge, text, el('div', 'nc-div'), keys);
  }

  function renderSelectedBar() {
    bar.className = barClass();
    bar.textContent = '';

    const badge = el('span', 'nc-badge nc-badge-gold');
    badge.innerHTML = ICON_CHECK;

    info = el('div', 'nc-info');
    info.append(el('b', 'nc-desc'), el('span', 'nc-meta'));

    floatSelect = el('select', 'nc-select');
    for (const [value, text] of [
      ['hide', '隱藏浮動元素'],
      ['static', '浮動元素排回文件流'],
      ['keep', '保留浮動元素'],
    ]) {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      floatSelect.append(o);
    }

    const wide = el('label', 'nc-wide');
    wideInput = el('input', 'nc-check');
    wideInput.type = 'checkbox';
    const wideLabel = document.createElement('span');
    wideLabel.textContent = '連水平方向展開';
    wide.append(wideInput, wideLabel);

    exportBtn = el('button', 'nc-btn nc-btn-primary');
    exportBtn.innerHTML = ICON_DOWNLOAD + '<span>匯出 PNG</span>';
    exportBtn.addEventListener('click', () => doExport());

    const again = el('button', 'nc-btn nc-btn-secondary');
    again.innerHTML = ICON_REFRESH + '<span>重選</span>';
    again.addEventListener('click', () => startPicking());

    const cancel = el('button', 'nc-btn nc-btn-ghost');
    cancel.innerHTML = '<span>取消</span>';
    cancel.addEventListener('click', () => stop());

    const actions = el('div', 'nc-actions');
    actions.append(exportBtn, again, cancel);

    bar.append(badge, info, el('div', 'nc-div'), floatSelect, wide, el('div', 'nc-div'), actions);
    updateSelectedInfo();
  }

  function updateSelectedInfo(message) {
    if (!info || !selected) return;
    const d = info.querySelector('.nc-desc');
    const s = info.querySelector('.nc-meta');
    if (d) d.textContent = describePath(selected);
    if (!s) return;
    if (message) {
      s.textContent = message;
      return;
    }
    const r = selected.getBoundingClientRect();
    const clips = findClippers(selected).length;
    s.textContent =
      Math.round(r.width) + ' × ' + Math.round(r.height) + ' px' +
      (clips ? ' · 展開 ' + clips + ' 層容器' : '');
  }

  function kbd(t) {
    const k = document.createElement('kbd');
    k.textContent = t;
    return k;
  }

  /* ---------------- 選取 ---------------- */

  /* 單一節點描述；makeName() 也用它產檔名，維持既有檔名語意 */
  function describe(node) {
    let s = node.tagName.toLowerCase();
    if (node.id) return s + '#' + node.id;
    if (node.classList.length) s += '.' + [...node.classList].slice(0, 2).join('.');
    return s;
  }

  /* 父 > 子 兩層路徑，給已選取工具列（C）用；根層不當父層 */
  function describePath(node) {
    const p = node.parentElement;
    if (p && p !== document.documentElement && p !== document.body) {
      return describe(p) + ' > ' + describe(node);
    }
    return describe(node);
  }

  function paint(node, locked) {
    if (!node) {
      box.style.display = 'none';
      return;
    }
    const r = node.getBoundingClientRect();
    box.className = 'nc-box ' + (locked ? 'locked' : 'hover');
    box.style.display = 'block';
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';

    boxIcon.innerHTML = locked ? ICON_CHECK : ICON_SCAN;
    boxDesc.textContent = describe(node);
    if (locked) boxSize.textContent = Math.round(r.width) + ' × ' + Math.round(r.height);
  }

  function onMove(e) {
    if (mode !== 'picking') return;
    const node = e.target;
    if (!node || node === host || node.nodeType !== 1) return;
    current = node;
    paint(current, false);
  }

  function swallow(e) {
    if (mode === 'off') return;
    if (e.target === host) return; // 讓工具列自己的點擊通過
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'click' && mode === 'picking' && current) select(current);
  }

  function onKey(e) {
    if (mode === 'off') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      mode === 'selected' ? startPicking() : stop();
      return;
    }
    const node = mode === 'selected' ? selected : current;
    if (!node) return;

    if (e.key === 'ArrowUp' && node.parentElement && node.parentElement !== document.documentElement) {
      e.preventDefault();
      e.stopPropagation();
      setNode(node.parentElement);
    } else if (e.key === 'ArrowDown') {
      const child = [...node.children].find((c) => c !== host);
      if (child) {
        e.preventDefault();
        e.stopPropagation();
        setNode(child);
      }
    } else if (e.key === 'Enter' && mode === 'picking' && current) {
      e.preventDefault();
      e.stopPropagation();
      select(current);
    }
  }

  function setNode(node) {
    if (mode === 'selected') {
      selected = node;
      paint(selected, true);
      updateSelectedInfo();
    } else {
      current = node;
      paint(current, false);
    }
  }

  function onScroll() {
    if (mode === 'selected') paint(selected, true);
    else if (mode === 'picking' && current) paint(current, false);
  }

  function select(node) {
    selected = node;
    mode = 'selected';
    paint(selected, true);
    renderSelectedBar();
    raise(); // 鎖定當下若使用者又觸發了新彈窗，確保金框與匯出列仍在最上層
  }

  /* ---------------- 展開 / 還原 ---------------- */

  /* 真的把內容切掉的才算，只是拿 overflow:hidden 切圓角的容器不要動 */
  function clipsContent(node) {
    const cs = getComputedStyle(node);
    // 個別方向拿不到值時退回 overflow 簡寫
    const axis = (specific) =>
      specific && specific !== 'visible' ? specific : cs.overflow || 'visible';

    const clipsY = axis(cs.overflowY) !== 'visible' && node.scrollHeight > node.clientHeight + 1;
    const clipsX = axis(cs.overflowX) !== 'visible' && node.scrollWidth > node.clientWidth + 1;
    return { clipsY, clipsX, any: clipsY || clipsX };
  }

  function isRoot(node) {
    return node === document.body || node === document.documentElement;
  }

  /* 選取是否牽涉到 top layer 浮動面板（node 自己、祖先或子孫）。
     只有這時才啟用「子孫展開＋解夾」這套較侵入的處理，一般 app shell 內容走保守路徑。 */
  function hasFloatingPanel(node) {
    for (let n = node; n; n = n.parentElement) if (isFloatingPanel(n)) return true;
    for (const d of everyElement(node, [])) if (isFloatingPanel(d)) return true;
    return false;
  }

  function findClippers(node) {
    const list = [];
    // 祖先鏈（含 node 自己）：內層撐開後外層才是最終尺寸
    let n = node;
    while (n) {
      if (clipsContent(n).any) list.push(n);
      n = n.parentElement;
    }
    // 選整個面板／dialog 時，真正在裁切的捲軸常是子孫、不在祖先鏈上。
    // 但子孫展開只在牽涉 top layer 面板時才做，診斷計數也對齊這個條件才不會虛報。
    if (hasFloatingPanel(node)) {
      for (const d of everyElement(node, [])) {
        if (clipsContent(d).any) list.push(d);
      }
    }
    return list;
  }

  function remember(node) {
    saved.push({
      el: node,
      style: node.getAttribute('style'),
      top: node.scrollTop,
      left: node.scrollLeft,
    });
  }

  /* querySelectorAll 不會穿透 shadow DOM，web component 裡的浮動列必須自己走進去找 */
  function everyElement(root, out) {
    for (const e of root.querySelectorAll('*')) {
      if (e === host) continue; // 不要走進我們自己的 UI
      out.push(e);
      if (e.shadowRoot) everyElement(e.shadowRoot, out);
    }
    return out;
  }

  /* contains() 不跨 shadow 邊界，這裡沿著 composed tree 往上找 */
  function isComposedAncestor(ancestor, el) {
    let cur = el;
    while (cur) {
      if (cur === ancestor) return true;
      const rootNode = cur.getRootNode();
      cur = cur.parentElement || (rootNode && rootNode.host) || null;
    }
    return false;
  }

  /* 浮動元素要先處理，展開的量測才會落在最終版面上 */
  function settleFloating(node, floatMode) {
    if (floatMode === 'keep' || !document.body) return 0;

    let touched = 0;
    for (const e of everyElement(document.body, [])) {
      if (isComposedAncestor(e, node)) continue; // 目標本身和它的祖先不能碰

      const pos = getComputedStyle(e).position;
      if (pos !== 'fixed' && pos !== 'sticky') continue;

      remember(e);
      if (floatMode === 'static' && isComposedAncestor(node, e)) {
        // sticky 失去捲動容器後會飛到畫面角落，排回文件流才留得住
        e.style.setProperty('position', 'static', 'important');
      } else {
        e.style.setProperty('display', 'none', 'important');
      }
      touched++;
    }
    return touched;
  }

  /* 只有 top layer 的浮動面板（native <dialog>.showModal / popover）才可以「解夾」。
     為什麼要這麼嚴：一般 app shell 常把捲動主區寫成 position:absolute;inset:0，
     它的子孫多是絕對定位、本身沒有 in-flow 高度。一旦對它 height:auto／放掉 bottom，
     整塊會塌成 0，截出一張全白——GCP「網路連線」主內容就是這樣壞掉的。
     top layer 面板則是自成一塊、錨在 viewport 上的東西，撐開它才安全。 */
  function isFloatingPanel(el) {
    if (el === host) return false;
    try {
      if (el.matches(':modal') || el.matches(':popover-open')) return true;
    } catch (e) {}
    if (el.tagName === 'DIALOG' && el.hasAttribute('open')) return true;
    if (el.hasAttribute && el.hasAttribute('popover')) return true;
    return false;
  }

  /* 浮動面板用 top+bottom 兩邊釘死（或 max-height）把內容卡在視窗高度，裡面的捲軸撐開也會被夾回去。
     它自己 scrollHeight==clientHeight（內層 overflow:auto 吃掉溢出），clipsContent() 認不出來，
     要靠 inset 判斷、放掉 bottom 才會依內容從 top 往下長高。只在選取範圍內真的有捲軸時才動（allowUncap）。 */
  function clampInfo(el, allowUncap) {
    if (!allowUncap || !isFloatingPanel(el)) return null;
    const cs = getComputedStyle(el);
    // computed height 一律回傳 px（拿不到 auto），只能靠 inset 兩邊釘死來認固定尺寸
    const insetY = cs.top !== 'auto' && cs.bottom !== 'auto';
    const insetX = cs.left !== 'auto' && cs.right !== 'auto';
    return { bottom: cs.bottom, right: cs.right, insetY, insetX };
  }

  /* 撐開單一容器（捲動容器或被夾死的定位面板），只 remember 一次。
     不動 overflow，改讓容器自己長高：overflow:hidden 長到內容高度後本來就切不到東西，
     也不會害 sticky 子孫失去捲動容器。細節見 CLAUDE.md「不要動 overflow（預設路徑）」。 */
  function relax(el, opts, allowUncap) {
    const clip = clipsContent(el);
    const clamp = (clip.any) ? null : clampInfo(el, allowUncap); // 是捲軸就照捲軸處理，否則才看要不要解夾
    if (!clip.any && !clamp) return false;

    remember(el);
    el.style.setProperty('max-height', 'none', 'important');
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('min-height', 'auto', 'important'); // 解掉 flex 的 min-height:0

    // 根層的 overflow 決定整個 viewport 能不能捲，hidden 會直接截斷文件高度
    if (isRoot(el) && clip.clipsY) {
      el.style.setProperty('overflow-y', 'visible', 'important');
    }
    // 上下釘死的面板要放掉下緣，height:auto 才會依內容從 top 往下長高（top 不動，量測座標才穩）
    if (clamp && clamp.insetY && clamp.bottom !== 'auto') {
      el.style.setProperty('bottom', 'auto', 'important');
    }
    if (opts.wide) {
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('max-width', 'none', 'important');
      if (clamp && clamp.insetX && clamp.right !== 'auto') {
        el.style.setProperty('right', 'auto', 'important');
      }
    }
    return true;
  }

  function expand(node, opts) {
    saved = [];
    const floated = settleFloating(node, opts.floatMode) || 0;

    // 「子孫展開＋解夾」較侵入，只在「選取牽涉 top layer 浮動面板」且「真的有捲軸」時才啟用。
    // 一般 app shell 內容維持原本只走祖先鏈、只撐 clipsContent 容器的保守路徑——
    // 那種頁面常把捲動主區寫成 position:absolute;inset:0，多做手術會把版面塌成全白。
    const aggressive = hasFloatingPanel(node) && findClippers(node).length > 0;
    let expanded = 0;

    // 先撐開選取範圍「內部」的容器，由深到淺（reverse 前序）。
    // 選整個面板／dialog 時，真正在裁切的捲軸是子孫、不在祖先鏈上，
    // 漏掉它就只會截到視窗高度那一段。內層先撐開，外層再量 scrollHeight 才對，
    // 才能接住「內層撐高後外層才開始溢出」的連鎖。
    if (aggressive) {
      for (const d of everyElement(node, []).reverse()) {
        if (relax(d, opts, true)) expanded++;
      }
    }

    // 再由內往外走祖先鏈（含 node 自己）。
    // 一定要走到 html／body：app shell 常寫 height:100%;overflow:hidden，
    // 漏掉它們的話整份文件會被切在視窗高度。
    let n = node;
    while (n) {
      if (relax(n, opts, aggressive)) expanded++;
      n = n.parentElement;
    }
    return { expanded, floated };
  }

  function restore() {
    if (!saved) return;
    for (let i = saved.length - 1; i >= 0; i--) {
      const r = saved[i];
      if (r.style === null) r.el.removeAttribute('style');
      else r.el.setAttribute('style', r.style);
    }
    for (const r of saved) {
      r.el.scrollTop = r.top;
      r.el.scrollLeft = r.left;
    }
    saved = null;
    if (pageScroll) {
      window.scrollTo(pageScroll.x, pageScroll.y);
      pageScroll = null;
    }
  }

  const twoFrames = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  async function prepare(opts) {
    if (!selected) return { ok: false, error: '沒有選取任何元素' };
    if (!selected.isConnected) return { ok: false, error: '選取的元素已經從頁面上消失了' };

    host.style.display = 'none';
    pageScroll = { x: scrollX, y: scrollY };

    const counts = expand(selected, opts);
    window.scrollTo(0, 0);
    await twoFrames();

    const r = selected.getBoundingClientRect();
    const width = Math.round(r.width);
    const height = Math.round(r.height);
    if (width < 1 || height < 1) {
      restore();
      host.style.display = '';
      return { ok: false, error: '這個元素沒有可見的尺寸' };
    }

    let scale = Math.min(window.devicePixelRatio || 1, 2);
    let note = '';
    while (scale > 1 && (width * scale > MAX_PX || height * scale > MAX_PX)) scale -= 0.5;
    if (width > MAX_PX || height > MAX_PX) {
      note = '內容超過 ' + MAX_PX + ' px，超出的部分可能會是空白。';
    }

    return {
      ok: true,
      clip: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), width, height },
      scale,
      note,
      expanded: counts.expanded,
      floated: counts.floated,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      filename: makeName(),
    };
  }

  /* viewport 被放大之後版面會變，截圖前重新量一次 */
  async function measure() {
    if (!selected || !selected.isConnected) return { ok: false };

    window.scrollTo(0, 0);
    await twoFrames();

    const r = selected.getBoundingClientRect();
    const width = Math.round(r.width);
    const height = Math.round(r.height);
    if (width < 1 || height < 1) return { ok: false };

    return {
      ok: true,
      clip: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), width, height },
    };
  }

  function makeName() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const tag = describe(selected).slice(0, 40);
    const site = location.hostname.replace(/^www\./, '') || 'page';
    // downloads API 只吃相對路徑，把可能被當成路徑或非法字元的東西全清掉
    const safe = (site + '-' + tag + '-' + stamp)
      .replace(/[^\w.-]+/g, '_')
      .replace(/\.{2,}/g, '_')
      .replace(/^[._]+/, '');
    return (safe || 'notecraft-clip') + '.png';
  }

  /* ---------------- 匯出 ---------------- */

  /* D. 截圖中：loading 徽章、不定量流光進度、真實層數文案，期間只留取消 */
  function renderCapturingBar() {
    bar.className = barClass();
    bar.textContent = '';

    const badge = el('span', 'nc-badge nc-badge-loading');
    badge.innerHTML = ICON_IMAGE;

    const layers = selected ? findClippers(selected).length : 0;
    const inf = el('div', 'nc-info');
    const d = el('b', 'nc-desc');
    d.textContent = describePath(selected);
    const m = el('span', 'nc-meta');
    m.textContent = layers ? '展開 ' + layers + ' 層容器並合成中…' : '合成中…';
    inf.append(d, m);

    const prog = el('div', 'nc-prog');
    const track = el('div', 'nc-track');
    track.append(el('div', 'nc-fill'));
    const cap = el('div', 'nc-prog-cap');
    cap.textContent = '正在展開並合成…';
    prog.append(track, cap);

    const cta = el('button', 'nc-btn nc-btn-primary');
    cta.disabled = true;
    cta.innerHTML = '<span class="nc-spin">' + ICON_SPINNER + '</span><span>截圖中…</span>';

    const cancel = el('button', 'nc-btn nc-btn-ghost');
    cancel.innerHTML = '<span>取消</span>';
    cancel.addEventListener('click', () => stop());

    const actions = el('div', 'nc-actions');
    actions.append(cta, cancel);

    bar.append(badge, inf, el('div', 'nc-div'), prog, el('div', 'nc-div'), actions);
  }

  async function doExport(preset) {
    if (busy) return;
    busy = true;
    // preset 供錯誤重試沿用同一組選項；否則從 C 讀取（切換到 D 會重建 C 的下拉／核取 DOM）
    const opts = preset || { floatMode: floatSelect.value, wide: wideInput.checked };
    closeToast();
    bar.style.display = '';
    renderCapturingBar();

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'ncclip:capture',
        floatMode: opts.floatMode,
        wide: opts.wide,
      });

      if (!res || !res.ok) throw new Error((res && res.error) || '截圖失敗');

      if (res.via === 'blob' && res.data) download(res.data, res.filename);

      showSuccessToast(res, opts);
    } catch (err) {
      showErrorToast(err, opts);
    } finally {
      busy = false;
    }
  }

  /* 重建 C 並套回先前的浮動元素／連水平展開選項 */
  function restoreSelectedBar(opts) {
    renderSelectedBar();
    if (opts) {
      floatSelect.value = opts.floatMode;
      wideInput.checked = opts.wide;
    }
  }

  /* ---------------- E. 成功／錯誤 toast ---------------- */

  function closeBtn(onClose) {
    const b = el('button', 'nc-toast-close');
    b.innerHTML = ICON_X;
    b.setAttribute('aria-label', '關閉');
    b.addEventListener('click', onClose);
    return b;
  }

  function openToast(kind, fill) {
    clearTimeout(toastTimer);
    pendingDismiss = null;
    toast.className = 'nc-toast show' + (isDarkPage() ? ' on-dark' : '');
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    toast.textContent = '';
    fill(toast);
    bar.style.display = 'none'; // toast 取代工具列，避免兩張卡片重疊
  }

  function closeToast() {
    if (!toast) return;
    clearTimeout(toastTimer);
    pendingDismiss = null;
    toast.className = 'nc-toast';
    toast.textContent = '';
  }

  function armDismiss() {
    clearTimeout(toastTimer);
    if (pendingDismiss) toastTimer = setTimeout(pendingDismiss, 7000);
  }

  /* 關閉 toast 後回到 C（選取仍在，可再匯出） */
  function backToSelected(opts) {
    closeToast();
    restoreSelectedBar(opts);
    bar.style.display = '';
  }

  function showSuccessToast(res, opts) {
    openToast('success', (t) => {
      const badge = el('span', 'nc-badge nc-badge-success');
      badge.innerHTML = ICON_CHECK_CIRCLE;

      const body = el('div', 'nc-toast-body');
      const title = el('div', 'nc-toast-title');
      title.textContent = '已存到下載資料夾';
      body.append(title);

      if (res.filename) {
        const file = el('div', 'nc-toast-file');
        file.textContent = res.filename;
        body.append(file);
      }

      const desc = el('div', 'nc-toast-desc');
      let text =
        '展開 ' + (res.expanded || 0) + ' 層容器、處理 ' + (res.floated || 0) +
        ' 個浮動元素，輸出 ' + String(res.size || '?').replace('×', ' × ') + '。';
      if (res.warning) text += '（下載 API 失敗，改用備援：' + res.warning + '）';
      if (res.note) text += res.note;
      desc.textContent = text;

      const actions = el('div', 'nc-toast-actions');
      if (typeof res.downloadId === 'number') {
        const open = el('button', 'nc-btn nc-btn-secondary');
        open.innerHTML = '<span>開啟資料夾</span>';
        open.addEventListener('click', () =>
          chrome.runtime.sendMessage({ type: 'ncclip:reveal', id: res.downloadId })
        );
        actions.append(open);
      }
      const again = el('button', 'nc-btn nc-btn-ghost');
      again.innerHTML = '<span>再截一張</span>';
      again.addEventListener('click', () => {
        closeToast();
        startPicking();
      });
      actions.append(again);

      body.append(desc, actions);
      t.append(badge, body, closeBtn(() => backToSelected(opts)));
    });

    // 成功 toast 約 7 秒自動消失，回到 C
    pendingDismiss = () => backToSelected(opts);
    armDismiss();
  }

  function showErrorToast(err, opts) {
    openToast('error', (t) => {
      const badge = el('span', 'nc-badge nc-badge-danger');
      badge.innerHTML = ICON_ALERT;

      const body = el('div', 'nc-toast-body');
      const title = el('div', 'nc-toast-title');
      title.textContent = '截圖沒有完成';
      const desc = el('div', 'nc-toast-desc');
      // 沿用 background 已翻譯、已指向下一步的錯誤訊息
      desc.textContent = (err && err.message) || String(err) || '發生未知錯誤，請再試一次。';

      const actions = el('div', 'nc-toast-actions');
      const retry = el('button', 'nc-btn nc-btn-secondary');
      retry.innerHTML = '<span>重新截圖</span>';
      retry.addEventListener('click', () => doExport(opts));
      const help = el('button', 'nc-btn nc-btn-ghost');
      help.innerHTML = '<span>查看說明</span>';
      help.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'ncclip:openHelp' }));
      actions.append(retry, help);

      body.append(title, desc, actions);
      t.append(badge, body, closeBtn(() => backToSelected(opts)));
    });
    // 錯誤不自動消失
  }

  function download(base64, filename) {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    (document.body || document.documentElement).appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 1000);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------------- 開關 ---------------- */

  const EVENTS = ['mousedown', 'mouseup', 'click', 'auxclick', 'pointerdown', 'pointerup', 'contextmenu'];

  function startPicking() {
    mode = 'picking';
    selected = null;
    current = null;
    closeToast();
    paint(null);
    renderPickingBar();
    bar.style.display = '';
    host.style.display = '';
    raise(); // 頁面此刻已把彈窗開在 top layer，推到它上面才看得到選取框與工具列
  }

  function start() {
    if (!host) build();
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, true);
    for (const type of EVENTS) document.addEventListener(type, swallow, true);
    startPicking();
  }

  function stop() {
    mode = 'off';
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScroll, true);
    for (const type of EVENTS) document.removeEventListener(type, swallow, true);
    closeToast();
    restore();
    if (host) {
      host.style.display = 'none';
      if (topLayerSupported() && host.matches(':popover-open')) {
        try { host.hidePopover(); } catch (e) {} // 收工時退出 top layer，不留隱形彈窗
      }
    }
    selected = null;
    current = null;
  }

  function toggle() {
    mode === 'off' ? start() : stop();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg) return;
    if (msg.type === 'ncclip:toggle') {
      toggle();
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === 'ncclip:prepare') {
      prepare({ floatMode: msg.floatMode || 'hide', wide: !!msg.wide }).then(sendResponse);
      return true;
    }
    if (msg.type === 'ncclip:measure') {
      measure().then(sendResponse);
      return true;
    }
    if (msg.type === 'ncclip:cleanup') {
      restore();
      host.style.display = '';
      sendResponse({ ok: true });
      return;
    }
  });

  window.__notecraftClip = { toggle };
  start();
})();
