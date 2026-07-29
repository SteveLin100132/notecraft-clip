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

### 預覽筆記（notecraftapp）

`notecraftapp` 裝成 devDependency，包了幾個 npm script 對應它的 CLI 子命令，
預設都指向 `./notes`（本專案的筆記資料夾）：

```bash
npm run notes            # = notecraftapp view ./notes，astro dev：HMR、可即時編輯
npm run notes:build      # astro build 到 ~/.notecraft/cache
npm run notes:serve      # 服務 build 過的 dist（背景 rebuild + auto reload）
npm run notes:view -- ./other --port 4321   # 要換資料夾用 -- 傳
```

**這幾個 script 要 Node ≥ 22**（`notecraftapp` 的 `engines`），跟擴充本身不同：
`npm test` 那套 jsdom 回歸測試跑在 Node 16。跑 notes 指令前先 `nvm use 22`，
否則裝相依時 esbuild 的平台 binary 會直接掛掉、且錯誤訊息不會指到版本問題。

筆記與元件的擺放（`notecraftapp` 的約定，別搬動）：

- `notes/*.mdx`：每篇筆記。目前是「NoteCraft Clip 介面設計歷程」系列共 7 篇（Step 1–7），
  從七份設計 Artifact 重製而來，內文為 MDX、UI 雛形做成內嵌元件。
- `.notecraft/components/*.tsx`：筆記內嵌的 React 元件。**放在專案根、不是 `notes/` 底下**——
  MDX 的 `@notes` alias 指向 `<專案根>/.notecraft`（見 `astro.config.mjs` 用 `NOTECRAFT_USER_CWD` 的註解）。
  元件用 scoped `<style>` 自帶 CSS（viewer 的 Tailwind 只掃它自己的 `src/`，不會掃到這裡，
  寫 utility class 會被 purge），要嵌到 MDX 就用 `GeneratedFrame` 包起來。
- `.notecraft/series.json`：系列定義（章節順序、accent、icon）。

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
4. 送 `ncclip:prepare`：`picker` 藏起自己的 UI → **`primeLazy()` 在原始 viewport 掃一遍捲動容器逼 lazy render**
   → 處理浮動元素 → 展開捲動容器 → `scrollTo(0,0)` → 等兩個 frame → 量 rect，回傳 clip / scale / 檔名
5. `Emulation.setDeviceMetricsOverride` 把 viewport 撐到蓋住整個元素
6. 送 `ncclip:measure` 重量一次（放大 viewport 會再觸發重排），尺寸有變就回到 5 再撐一次，最多兩輪
7. 等 300ms（給 IO 型 lazy render 在撐高後補畫的時間）→ `Page.captureScreenshot` 帶 clip
8. `clearDeviceMetricsOverride` → 送 `ncclip:cleanup` 還原 DOM → `debugger.detach`
9. base64 交給 offscreen 轉 blob URL → `chrome.downloads.download`

第 8 步的三件事都在 `finally` 裡，**任何路徑失敗都必須執行**。**`primeLazy` 一定要在展開之前做**（見下）。

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

### 展開要涵蓋選取範圍的子孫，不只祖先鏈

選整個面板／dialog 時，真正在裁切的捲軸往往是**子孫**、不在祖先鏈上，只走祖先會只截到視窗高度那一段。
`expand()` 先由深到淺（`everyElement(node).reverse()`）用 `growScroller()` 撐開選取內部的捲動容器，再走祖先鏈。
`growScroller()` 只放高、不碰定位錨點，是安全的一步。`findClippers()`（診斷計數）也一起算子孫，數字才對得上。

### 定位面板要解「上下釘死」的夾制——但要「試了再量」，不能靠結構猜

`position: fixed`／`absolute` 且 `top`、`bottom` 兩邊都非 `auto`（或帶 `max-height`）的面板，會把內容卡在視窗高度。
它自己 `scrollHeight == clientHeight`（內層 `overflow:auto` 把溢出吃掉了），`clipsContent()` 認不出來
——這正是 GCP Console 側欄「量到的尺寸對、但只截到一個視窗高度」的原因。解法是放掉 `bottom`，
讓面板依內容從 `top` 往下長高（`top` 不動很重要，放大 viewport 截圖時座標才穩）。

**但不能靠屬性判斷哪些面板可以這樣動。** GCP 開機磁碟側欄是「高 z-index 的 `fixed` div、不是 native `<dialog>`」
（所以第一版靠 `:modal`／`:popover-open` 偵測會漏掉它、又退回截不全）；而 GCP 主內容（網路連線）把捲動主區
寫成 `position: absolute; inset: 0`，子孫多是絕對定位、本身沒有 in-flow 高度——這兩者從 CSS 屬性上難分，
但對後者放掉 `bottom` 會整塊**塌成 0、截出一張全白**。

所以 `tryUncap()` 用**試了再量**：先記下高度 → 放掉 `bottom`＋`height: auto` → 再量一次。
**有長高才保留，沒長高（塌陷、或本來就放得下）就 `undoGrow()` 整個還原。** 這是唯一可靠、
不依賴頁面結構的判準。實測開機磁碟側欄 900→1692（保留），app shell 主區 900→118（還原、不留痕跡）。

`undoGrow()` 只還原「最後一個 `markGrow` 的元素」，所以 `tryUncap` 必須量完立刻決定、中間不插入其他 `remember`。
候選由深到淺（子孫 → node → 祖先）處理，內層先解，外層量到的才是撐開後的高度。

`growScroller`／`tryUncap` 的「有沒有長高」在 jsdom 測不出來（不做版面計算），
所以單元測試用 harness 的 `grown: { id: rect }` 模擬 reflow，真頁面一定要另外實機驗證。

### lazy render 要先「掃過一遍」才截，不然畫面外一片空白

有些頁面（GCP VM 詳細頁就是）靠 **IntersectionObserver／捲動事件**才渲染畫面外內容——DOM 一直都在、
也保留了正確高度（`contain-intrinsic-size` 之類），但不捲進視野就不畫。這跟 `content-visibility` 不同：
掃全頁 `getComputedStyle(el).contentVisibility` 全是空的，也不是虛擬捲動（DOM 沒被抽掉）。
症狀一樣是「尺寸量得到、第一二屏之後全白、空白處有 DOM」。

判斷是不是這種：DevTools 開 Device Mode 手動把 viewport 設很高，**整頁自己就渲染出來** → 就是它。
它認 viewport 大小，所以我們的 `setDeviceMetricsOverride` 撐高後其實會觸發渲染，只是**還沒畫完就截了**。

解法是 `primeLazy()`，**一定要在 `expand()` 之前、原始 viewport 下做**（放 `prepare()` 開頭）：
對 `findClippers()` 找到的原始捲動容器、以及 window，用固定小步（600px）逐段捲一遍，每步等兩個 frame。
lazy render 觸發後會留著，之後展開、截圖就有；`background` 撐高後再等 300ms 補「認 viewport 的 IO 型」。

**為什麼一定要在展開前**：等 `expand()` 把捲動容器變成 `height: auto`（不再有捲動）、
或 viewport 撐到蓋住整份內容（沒得捲），就再也捲不動、觸發不了 lazy render 了。
第一版錯放在撐高之後、只捲 window，結果 window 已經不會動，等於沒掃——這就是當時「還是一樣空白」的原因。
（固定小步也重要：不能用 `innerHeight`，撐高後它可能比整份內容還大、一步跳過去。）

這招只對「認 viewport / 捲動事件」的 lazy render 有效。真正的**虛擬捲動**（畫面外把 DOM 抽掉、
如 CDK virtual scroll）掃了也沒用，那要改成分段捲動＋分段截圖再拼接，是另一套架構，目前沒做。

### content-visibility:auto 的畫面外內容要強制顯示

`content-visibility: auto` 會把畫面外的子樹**跳過渲染**，只留 `contain-intrinsic-size` 佔高度。
症狀很好認：**尺寸量得到（H 很大）、但截圖從第一、二屏之後就是一片空白，而空白處是有 DOM 的、只是沒畫**。
放大 viewport 也補不回來。`revealContent()` 在展開前先掃過選取子樹，把 `auto` 的強制成
`content-visibility: visible !important` 逼它畫；只碰 `auto`，不動作者刻意設的 `hidden`。
偵測用 computed（`getComputedStyle(el).contentVisibility`），jsdom 拿不到時退回讀 inline。

要在量尺寸「之前」做，撐開後量到的高度才是真的。這一步一定安全（只會多畫、不會改版面），所以無條件執行。
成功 toast 會多報「喚醒 K 個延遲渲染區塊」，K 為 0 時不顯示。

注意這只解 `content-visibility`；若是**虛擬捲動**（畫面外根本沒建 DOM，如 CDK virtual scroll）
就不是這條能救的——那種要在截圖前逐段捲過去逼框架渲染，跟「一次撐開一次截」的架構有衝突，目前無解。

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
