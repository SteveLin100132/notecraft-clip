/* Service Worker 裡沒有 URL.createObjectURL，所以借這個離螢幕頁面把
   base64 轉成擴充功能自己的 blob: URL，chrome.downloads 才收得下大檔。 */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.target !== 'offscreen') return;

  if (msg.type === 'ncclip:blob') {
    try {
      const bin = atob(msg.data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));

      // 下載排進佇列後才需要這個 URL，給足時間再回收
      setTimeout(() => URL.revokeObjectURL(url), 120000);

      sendResponse({ ok: true, url, bytes: bytes.length });
    } catch (err) {
      sendResponse({ ok: false, error: String((err && err.message) || err) });
    }
    return;
  }
});
