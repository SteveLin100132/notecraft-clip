/* picker.js 是 content script，直接 require 不起來。
   這裡用 jsdom 造一個假頁面把它 eval 進去，並把它註冊的 onMessage listener 抓出來，
   之後就能像 background.js 一樣對它送 ncclip:prepare / measure / cleanup。

   jsdom 不做版面計算，所以尺寸要自己餵：
   - dims: { [id 或 tagName]: [scrollHeight, clientHeight] }
   - rects: { [id]: DOMRect 形狀的物件 }
   - grown: { [id]: DOMRect } 這個元素被撐開（inline style 出現 height:auto）之後才回傳的尺寸。
     用來讓 tryUncap() 的「試了再量」在 jsdom 也測得出來——真頁面靠實際 reflow，這裡靠這個模擬長高。 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const PICKER = fs.readFileSync(path.join(__dirname, '..', 'picker.js'), 'utf8');

function createPage({ html, dims = {}, rects = {}, grown = {}, url = 'https://example.com/page', dpr = 2 }) {
  const dom = new JSDOM(html, {
    url,
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });

  const w = dom.window;
  w.scrollTo = () => {};
  w.devicePixelRatio = dpr;

  const lookup = (el) => dims[el.id] || dims[el.tagName];
  Object.defineProperty(w.Element.prototype, 'scrollHeight', {
    get() { const d = lookup(this); return d ? d[0] : 0; },
  });
  Object.defineProperty(w.Element.prototype, 'clientHeight', {
    get() { const d = lookup(this); return d ? d[1] : 0; },
  });
  Object.defineProperty(w.Element.prototype, 'scrollWidth', { get: () => 100 });
  Object.defineProperty(w.Element.prototype, 'clientWidth', { get: () => 100 });

  const EMPTY = { left: 0, top: 0, width: 10, height: 10, bottom: 10, right: 10 };
  w.Element.prototype.getBoundingClientRect = function () {
    // 被撐開後（inline 出現 height:auto）改回傳長高後的尺寸，模擬真頁面的 reflow
    if (grown[this.id] && /height:\s*auto/.test(this.getAttribute('style') || '')) {
      return grown[this.id];
    }
    return rects[this.id] || EMPTY;
  };

  let listener;
  w.chrome = {
    runtime: {
      onMessage: { addListener: (fn) => { listener = fn; } },
      sendMessage: async () => ({ ok: true, via: 'downloads', filename: 'stub.png' }),
    },
  };

  w.eval(PICKER);

  const send = (msg) => new Promise((resolve) => {
    const returned = listener(msg, null, resolve);
    if (returned !== true) resolve(undefined);
  });

  return {
    window: w,
    document: w.document,
    send,

    /* 模擬使用者用滑鼠點選某個元素 */
    pick(id) {
      const el = w.document.getElementById(id);
      el.dispatchEvent(new w.MouseEvent('mousemove', { bubbles: true }));
      el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
      return el;
    },

    /* 整份文件的 inline style 快照，用來驗證還原是否乾淨 */
    snapshot(extraRoots = []) {
      const collect = (root) =>
        [...root.querySelectorAll('*')].map((e) => e.tagName + '#' + e.id + '|' + e.getAttribute('style'));
      return JSON.stringify([w.document.documentElement.getAttribute('style')]
        .concat(collect(w.document))
        .concat(extraRoots.flatMap(collect)));
    },

    style: (id) => w.document.getElementById(id).getAttribute('style'),
  };
}

module.exports = { createPage };
