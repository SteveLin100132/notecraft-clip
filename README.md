# NoteCraft Clip

點一下工具列圖示，直接在頁面上選區塊，按「匯出 PNG」就好。不需要開 DevTools。

## 安裝

1. **解壓縮**這個資料夾，放到一個固定位置（別放下載資料夾，Chrome 每次啟動都會從原路徑重讀）。
2. 開 `chrome://extensions` → 右上角「開發人員模式」。
3. 按「載入未封裝項目」，選到**直接看得到 `manifest.json` 的那一層資料夾**。
4. 建議把圖示固定在工具列（拼圖圖示 → 釘選）。

安裝完就能用了，這版**不需要重開 DevTools**。

## 使用

1. 在要截圖的頁面按一下工具列的 NoteCraft Clip 圖示。
2. 滑鼠移動時會有藍框跟著跑，移到想要的區塊**點一下**，框變綠色代表選定。
3. 下方工具列按「**匯出 PNG**」。圖片會存到 Chrome 的預設下載資料夾，
   工具列會顯示實際存檔的檔名。
4. 按「取消」或 `Esc` 離開。

> 如果你在 `chrome://settings/downloads` 開了「下載每個檔案前先詢問儲存位置」，
> 就會跳出存檔對話框，這是 Chrome 的全域設定，不是擴充功能的行為。

### 鍵盤

| 按鍵 | 作用 |
| --- | --- |
| `↑` | 往上選一層（父元素） |
| `↓` | 往下選一層（第一個子元素） |
| `Enter` | 確認目前藍框的區塊 |
| `Esc` | 已選定 → 回到重選；選取中 → 結束 |

用滑鼠很難剛好停在想要的容器上時，先點一個裡面的元素再按 `↑` 往外擴，通常比較快。

### 浮動元素

`position: fixed` / `sticky` 的元素在展開後會失去它原本的捲動容器，於是飛到畫面角落，
是長截圖走版最常見的原因。工具列的下拉選單有三種處理方式：

| 模式 | 行為 | 適合 |
| --- | --- | --- |
| **隱藏浮動元素**（預設） | 全部 `display: none` | 只想要內容本身，最乾淨也最可預期 |
| 浮動元素排回文件流 | 目標內部的改成 `position: static`，外部的仍然隱藏 | 想保留底部按鈕列之類的內容，可接受它出現在文件末端 |
| 保留浮動元素 | 完全不動 | 前兩種都不對時的逃生口 |

目標本身和它的祖先永遠不會被動到，否則會連目標一起消失。

### 「連水平方向展開」

預設關閉。關閉時只讓容器長高，**寬度維持跟畫面上一樣**，該被切掉的欄位仍然切掉。
打開才會連水平捲動的內容一起攤平（例如寬表格右邊看不到的欄位），但整體寬度會跟原畫面不同。

## 搭配 notecraftapp 預覽筆記

截好的 PNG 是要放進 NoteCraft 筆記的。這個 repo 也裝了
[`notecraftapp`](https://www.npmjs.com/package/notecraftapp)，`notes/` 底下放了一組
「NoteCraft Clip 介面設計歷程」筆記（Step 1–7 的設計重製），可以直接在瀏覽器裡預覽：

```bash
npm run notes            # 啟動預覽（預設讀 ./notes），改筆記即時反映
```

> **需要 Node 22 以上**（跟擴充本身的測試環境不同）。若用 nvm，先 `nvm use 22` 再跑，
> 否則安裝相依時會失敗。另外兩個指令：`npm run notes:build`（預先建置）、
> `npm run notes:serve`（服務建置好的靜態版本）。

## 運作方式

- **展開**：從選取的元素往上走訪祖先，找出**真的把內容切掉**的容器
  （`overflow` 不是 `visible`，而且 `scrollHeight > clientHeight`），
  蓋上 `height: auto`、`max-height: none`、`min-height: auto`。
  只拿 `overflow: hidden` 切圓角、沒有實際溢出的容器會被跳過，避免無謂的重排。
  預設**不動 `overflow`**：容器自己長高之後就沒東西可切了，
  這樣既保住原始寬度，也不會害內部的 sticky 元素失去捲動容器。
  由內往外處理一路走到 `html` / `body`——app shell 常寫 `height:100%; overflow:hidden`，
  漏掉根層的話整份文件會被切在視窗高度。根層的 `overflow-y` 會另外放成 `visible`，
  因為它控制的是整個 viewport 能不能捲。
- **截圖**：透過 `chrome.debugger` 呼叫 CDP。先用 `Emulation.setDeviceMetricsOverride`
  把 viewport 撐到蓋住整個目標，再用 `Page.captureScreenshot` 帶 `clip` 截圖，最後還原 viewport。
  **沒有用 `captureBeyondViewport`**——那個參數只拿得到 viewport 大小的合成畫面，
  超出的部分會是空白。解析度交給 `deviceScaleFactor`，clip 的 `scale` 固定 1，避免重複放大。
  因為是瀏覽器真實渲染，畫質、字型、CSS 效果都跟畫面上一致，不是用 canvas 重畫的。
- **存檔**：圖片交給 `chrome.downloads` API，落在你 Chrome 設定的**預設下載資料夾**
  （`chrome://settings/downloads` 可以看到路徑），並且會出現在下載紀錄裡。
  因為 Service Worker 沒有 `URL.createObjectURL`，中間借一個離螢幕頁面（offscreen document）
  把資料轉成擴充功能自己的 blob URL，這樣才不受 data URL 的長度限制，大圖也存得下。
  萬一下載 API 真的失敗，會自動退回「在頁面建連結點擊」的舊方式，並在工具列顯示原因。
- **還原**：動手前先存下每個節點的 `getAttribute('style')` 原值與捲動位置。
  還原時原本沒有 inline style 的節點會整個移除 `style` 屬性，不會留下空的 `style=""`。
  截圖失敗時也一樣會還原。
- 輸出解析度取 `devicePixelRatio`（最高 2x）；元素太大時會自動降到 1x，避免超過 Chrome 的貼圖上限。

## 會看到的提示列

截圖那一瞬間，瀏覽器上方會冒出「NoteCraft Clip 已開始對這個瀏覽器進行偵錯」。
這是 Chrome 對 `chrome.debugger` 的強制提示，截完會自動消失，正常現象。

## 已知限制

- **DevTools 開著的時候不能用**。同一個分頁只允許一個偵錯工具，會跳訊息請你先關掉 DevTools。
- **虛擬捲動**（react-window、TanStack Virtual、AG Grid 等）沒救 —— DOM 裡本來就只有可視範圍的節點。
- 浮動元素的搜尋會走進開放的 shadow DOM（web component 常把工具列放在裡面），
  但 `mode: 'closed'` 的 shadow root 進不去。
- `chrome://`、Chrome 線上應用程式商店等內部頁面不允許擴充功能執行。
- 超過 16000 px 的區塊，超出的部分可能是空白，這是 Chrome 貼圖尺寸的硬限制。
- 對 flex / grid 子項強制 `height: auto` 偶爾會讓版面位移，還原後不影響原頁面，但截出來的圖可能跟原樣有些落差。
- 截圖期間 viewport 會被暫時放大，所有 `fixed` / `sticky` 元素、`vh` 單位、
  以及吃視窗高度的媒體查詢都會依放大後的尺寸重算。這是這類長截圖的先天限制，
  只能靠上面的「浮動元素」選項迴避。放大後版面若又變動，程式會重量一次再截。
