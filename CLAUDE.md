# NoteCraft Clip

Chrome 擴充功能（Manifest V3）。在頁面上直接框選一個 DOM 區塊，把被捲軸裁掉的內容整個展開，
截成 PNG 存進下載資料夾，然後把頁面還原成一動也沒動過的樣子。

## 跟 NoteCraft 的關係

[NoteCraftApp](https://www.npmjs.com/package/notecraftapp) 讓 AI 把 `@ai-visualize` 標記
變成互動元件嵌進 MDX 筆記——那是**生成**出來的圖。這個擴充負責另一半：**抓**回來的圖，
也就是筆記裡 `![](./screenshot.png)` 那些真實介面的截圖。

兩者目前沒有程式碼上的耦合，是同一套工作流的兩個工具。動手改之前先想清楚要不要建立耦合
（例如直接存進筆記資料夾），不要預先假設。

## 開發

```bash
npm install
npm test          # jsdom 跑的回歸測試，10 個案例
```

載入到 Chrome：`chrome://extensions` → 開發人員模式 → 載入未封裝項目 → 選這個資料夾。
**改完 background.js / manifest.json 要按卡片上的重新載入**；只改 picker.js 的話，
重新在目標分頁點一次圖示就會注入新版（前提是先按過重新載入）。

## 架構

三個執行環境，靠 message 溝通，訊息型別一律 `ncclip:` 前綴。

```
background.js          service worker。唯一能碰 chrome.debugger / downloads 的地方。
  ↕ chrome.tabs.sendMessage
picker.js              content script。點圖示時才用 chrome.scripting 注入。
                       負責選取 UI、展開 DOM、量尺寸、還原。
  ↕ chrome.runtime.sendMessage
offscreen.js           離螢幕頁面。只做一件事：base64 → blob URL。
```

`picker.js` 的 UI 掛在 `document.documentElement` 底下一個 shadow host 裡，
避免被頁面 CSS 影響、也避免污染頁面。全域旗標 `window.__notecraftClip` 用來判斷是否已注入。

### 截圖的完整順序

順序本身就是規格，改動時不要重排：

1. `background` 收到 `ncclip:capture`
2. `chrome.debugger.attach` → `Page.enable`
3. **等 350ms**——附加偵錯工具會冒出提示列、擠壓頁面，要等重排完
4. 送 `ncclip:prepare`：`picker` 藏起自己的 UI → 處理浮動元素 → 展開捲動容器 →
   `scrollTo(0,0)` → 等兩個 frame → 量 rect，回傳 clip / scale / 檔名
5. `Emulation.setDeviceMetricsOverride` 把 viewport 撐到蓋住整個元素
6. 送 `ncclip:measure` 重量一次（放大 viewport 會再觸發重排），尺寸有變就回到 5 再撐一次，最多兩輪
7. `Page.captureScreenshot` 帶 clip
8. `clearDeviceMetricsOverride` → 送 `ncclip:cleanup` 還原 DOM → `debugger.detach`
9. base64 交給 offscreen 轉 blob URL → `chrome.downloads.download`

第 8 步的三件事都在 `finally` 裡，**任何路徑失敗都必須執行**。

## 不可以破壞的約定

改任何東西之前先讀這段。這些都是實際踩過才寫下來的。

### 還原必須逐字

`remember()` 存的是 `getAttribute('style')`，不是 `style.cssText`。原本沒有 inline style 的
節點會回傳 `null`，還原時要 `removeAttribute('style')` 而不是設成空字串——留下 `style=""`
會讓 `[style]` 選擇器誤中。測試 `原本沒有 inline style 的節點...` 就是守這件事。

### 失敗路徑也要還原

`prepare()` 中途 return error 之前必須先 `restore()` 並把 host 顯示回來。

### prepare / cleanup 必須配對

`saved` 是模組層級的單一陣列。連續兩次 `prepare` 不 `cleanup` 會蓋掉還原紀錄，頁面就回不去了。

### 不要動 `overflow`（預設路徑）

展開的做法是設 `height: auto` + `max-height: none` + `min-height: auto`，讓容器自己長高。
**不是**設 `overflow: visible`。原因有三：

- 容器長到內容高度之後，`overflow: hidden` 本來就切不到東西，效果一樣
- 保住原始寬度（`overflow: visible` 會連水平方向一起攤開）
- `position: sticky` 的定位基準是最近的捲動容器。把 overflow 改成 visible 等於銷毀那個容器，
  sticky 子孫會飛到 viewport 角落——這是長截圖走版最常見的原因

`min-height: auto` 是用來反制 flex 佈局慣用的 `min-height: 0`，少了它 flex 子項不會長高。

只有 `wide` 選項打開時才會另外設 `overflow: visible`。

### 一定要走到 `html` / `body`

`expand()` 的迴圈是 `while (n)`，不是走到 body 就停。app shell（GCP Console、多數 SPA）
常寫 `html, body { height: 100%; overflow: hidden }`，漏掉根層的話整份文件會被切在視窗高度。
根層還要額外設 `overflow-y: visible`，因為根元素的 overflow 控制的是整個 viewport 能不能捲。

曾經為了「避免對根層亂動」把它們排除掉，結果就是截圖在 768px 處斷掉。

### 只處理真的在裁切的容器

`clipsContent()` 要求 `scrollHeight > clientHeight`。單純拿 `overflow: hidden` 切圓角、
沒有實際溢出的容器不能碰，否則強制 `height: auto` 會讓 flex / grid 重算、版面位移。

由內往外走，內層撐開後外層量到的 `scrollHeight` 才是對的（讀取 layout 屬性會強制 reflow）。

### `contains()` 不跨 shadow 邊界

祖孫判斷一律用 `isComposedAncestor()`。web component 把工具列放在 shadow root 裡很常見，
`querySelectorAll('*')` 也進不去，所以 `everyElement()` 會遞迴走 `shadowRoot`。
`mode: 'closed'` 的進不去，這個沒解。

### 檔名要能過 downloads API

`makeName()` 產出的字串只留 `[\w.-]`。`#`、`/` 之類的字元會讓整個下載被拒絕，
而且是安靜地失敗。

## 死路，不要再走一遍

- **`captureBeyondViewport: true`** ——配 `fromSurface: true` 只拿得到 viewport 大小的合成畫面，
  超出範圍全是空白。症狀很有辨識度：clip 尺寸正確（量對了），但圖片內容在視窗高度處斷掉。
  正解是 `setDeviceMetricsOverride` 撐 viewport。Puppeteer 早期也踩過同一個坑。
- **在 content script 用 `<a download>` 存檔** ——嚴格 CSP 的站台（如 GCP Console）會靜靜吃掉，
  沒有任何錯誤。現在只當作 downloads API 失敗時的備援。
- **在 service worker 用 `URL.createObjectURL`** ——SW 裡沒有這個 API。
- **改用 data URL 餵 `chrome.downloads.download`** ——有長度上限，大圖會掛。所以才需要 offscreen。
- **`chrome.debugger` 與 DevTools 並存** ——同一分頁只允許一個偵錯工具。DevTools 開著時
  attach 會失敗，`readable()` 有針對這個錯誤訊息做轉譯。

## 診斷

狀態列會顯示「展開 N 層容器、處理 M 個浮動元素，輸出 W×H」。出問題時先看這三個數字，
比從截圖反推快得多：

- **N 偏小 / 為 0** → 偵測階段的問題，`clipsContent()` 沒認出捲動容器
- **M 為 0 但畫面上仍有浮動元素** → 那個元素不是 `fixed` / `sticky`，或在 closed shadow root 裡
- **W×H 正確但圖片內容被截斷** → 渲染階段的問題，看 viewport override 那段

Service worker 的 log：`chrome://extensions` → 這個擴充 → 「檢查檢視畫面 service worker」。

## 測試

`test/harness.js` 用 jsdom 造假頁面把 `picker.js` eval 進去，抓出它註冊的 `onMessage` listener，
之後就能像 `background.js` 一樣對它送訊息。

jsdom 有兩個限制要知道：

- **不做版面計算**。`scrollHeight` / `clientHeight` / `getBoundingClientRect` 全都要在
  `createPage({ dims, rects })` 手動餵。
- **序列化 inline style 時會吃掉部分 longhand 的 `!important`**（`display`、`overflow-y`、
  `position`），而且跨版本行為不一致。所以斷言只驗屬性與值。程式碼本身一律用
  `setProperty(..., 'important')`，這點只能靠實機驗證。
- 另外 jsdom 不把 `overflow` 簡寫展開到 `overflowY`，Chrome 會。`clipsContent()` 裡的
  `axis()` 有做退回，順便讓偵測更穩。

改動展開邏輯後，**一定要在真實的複雜頁面實測**——單元測試守的是還原正確性與偵測條件，
守不了渲染結果。推薦用 GCP Console 的建立 VM 頁面，它同時有 app shell、shadow DOM、
sticky footer、內層捲動容器，是很好的照妖鏡。

## 檔案

| 檔案 | 內容 |
| --- | --- |
| `manifest.json` | MV3 設定。權限：`activeTab` `scripting` `debugger` `downloads` `offscreen` |
| `background.js` | service worker：注入、CDP 截圖、viewport override、存檔 |
| `picker.js` | content script：選取 UI、展開 / 還原、量尺寸。全部邏輯的大宗 |
| `offscreen.html/js` | base64 → blob URL |
| `test/harness.js` | jsdom 測試環境 |
| `test/picker.test.js` | 回歸測試 |
| `README.md` | 給使用者看的安裝與使用說明 |

## 慣例

- 註解寫**為什麼**，不寫做了什麼。上面每一條「不可以破壞的約定」在程式碼裡都有對應的短註解。
- 使用者看得到的字串一律繁體中文。
- 錯誤訊息要能指向下一步（「請先關掉 DevTools 再試一次」），不要只說失敗。
- 新增選項前先問是不是真的需要——目前三個模式已經涵蓋大多數情況，選項越多越難解釋。
