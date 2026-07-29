// 重製 Step 4 「C.『已選取』工具列」：金色徽章 → 元素描述 + meta → 浮動元素下拉 →
// 「連水平方向展開」核取方塊 → 三顆 pill 按鈕（匯出 PNG／重選／取消）。
// 三個面板：淺色預設、淺色已勾、深色（白描邊＋深陰影）。純靜態視覺，不接功能。
import { Check, Download, RefreshCw } from "lucide-react";

// 每個面板共用同一組工具列內容，只有底色與 checked 狀態不同，抽成子元件避免重複。
function Toolbar({ onDark = false, checked = false }: { onDark?: boolean; checked?: boolean }) {
  return (
    <div className={onDark ? "nc-bar on-dark" : "nc-bar"}>
      <span className="nc-badge nc-badge-gold">
        <Check />
      </span>
      <div className="nc-info">
        {/* describePath 兩層路徑，nowrap + ellipsis */}
        <b className="nc-desc">main.article &gt; div.post-body</b>
        <span className="nc-meta">1280 × 3400 px · 展開 2 層容器</span>
      </div>
      <div className="nc-div" />
      {/* 自繪 chevron 的浮動元素下拉，靜態視覺，預設「隱藏浮動元素」 */}
      <select className="nc-select" defaultValue="隱藏浮動元素">
        <option>隱藏浮動元素</option>
        <option>浮動元素排回文件流</option>
        <option>保留浮動元素</option>
      </select>
      <label className="nc-wide">
        {/* 勾記由 .nc-check::after 畫出，故 checkbox 本身用 defaultChecked 呈現狀態 */}
        <input type="checkbox" className="nc-check" defaultChecked={checked} readOnly />
        <span>連水平方向展開</span>
      </label>
      <div className="nc-div" />
      <div className="nc-actions">
        <button className="nc-btn nc-btn-primary" type="button">
          <Download />
          <span>匯出 PNG</span>
        </button>
        <button className="nc-btn nc-btn-secondary" type="button">
          <RefreshCw />
          <span>重選</span>
        </button>
        <button className="nc-btn nc-btn-ghost" type="button">
          <span>取消</span>
        </button>
      </div>
    </div>
  );
}

export default function Step4SelectedToolbar() {
  return (
    <div className="ncs4-toolbar not-prose">
      <style>{`
.ncs4-toolbar{
  --blue-50:#eef4fb; --blue-400:#4d84cb; --blue-500:#2c6ebb; --blue-700:#1b4f9c; --blue-800:#163f7d;
  --orange-400:#ed9b26; --orange-500:#e37b24;
  --n0:#ffffff; --n50:#f6f8fb; --n100:#eef1f6; --n200:#e1e6ee; --n300:#cbd3df;
  --n400:#9aa6b8; --n500:#6c798e; --n600:#4f5b6e; --n700:#3a4456; --n800:#262e3d; --n900:#161c28;
  --ease-out:cubic-bezier(.16,1,.3,1);
  font-family:var(--font-sans); color:var(--n900);
}
.ncs4-toolbar *{ box-sizing:border-box; }
@keyframes ncs4Rise { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%); } }

.ncs4-toolbar .nc-bar{ position:absolute; left:50%; bottom:22px; transform:translateX(-50%); display:flex; align-items:center; gap:7px; height:56px; padding:0 8px; max-width:calc(100% - 24px); color:var(--n900); background:var(--n0); border:1px solid var(--n200); border-radius:16px; box-shadow:0 14px 34px rgba(17,47,93,.16); animation:ncs4Rise 240ms var(--ease-out) both; }
.ncs4-toolbar .nc-bar.on-dark{ border-color:rgba(255,255,255,.6); box-shadow:0 14px 34px rgba(0,0,0,.45); }
.ncs4-toolbar .nc-badge{ width:34px; height:34px; flex:none; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; }
.ncs4-toolbar .nc-badge svg{ width:18px; height:18px; }
.ncs4-toolbar .nc-badge-gold{ background:var(--orange-400); color:#fff; }
.ncs4-toolbar .nc-div{ width:1px; height:28px; flex:none; background:var(--n200); }
.ncs4-toolbar .nc-info{ display:flex; flex-direction:column; gap:1px; min-width:0; max-width:176px; padding:0 2px; }
.ncs4-toolbar .nc-desc{ font-family:var(--font-mono); font-weight:500; font-size:13px; color:var(--n900); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ncs4-toolbar .nc-meta{ font-size:11.5px; color:var(--n500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ncs4-toolbar .nc-select{ height:36px; border-radius:10px; border:1px solid var(--n300); background:var(--n0); color:var(--n700); font-family:var(--font-sans); font-size:12.5px; line-height:1; padding:0 32px 0 11px; cursor:pointer; -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236c798e' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 11px center; background-size:14px; }
.ncs4-toolbar .nc-wide{ display:inline-flex; align-items:center; gap:7px; cursor:pointer; }
/* 用後代選擇器，不用 > 子選擇器：React SSR 會把 <style> 內的 > 逸出成 &gt;，選擇器失效 */
.ncs4-toolbar .nc-wide span{ font-family:var(--font-sans); font-size:12.5px; color:var(--n700); white-space:nowrap; }
.ncs4-toolbar .nc-check{ width:18px; height:18px; flex:none; margin:0; position:relative; cursor:pointer; border-radius:5px; border:1.5px solid var(--n300); background:var(--n0); -webkit-appearance:none; appearance:none; }
.ncs4-toolbar .nc-check:checked{ background:var(--blue-700); border-color:var(--blue-700); }
.ncs4-toolbar .nc-check:checked::after{ content:""; position:absolute; left:5px; top:2px; width:5px; height:9px; border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg); }
.ncs4-toolbar .nc-actions{ display:flex; align-items:center; gap:8px; }
.ncs4-toolbar .nc-btn{ height:36px; border-radius:999px; border:0; padding:0 16px; font-family:var(--font-sans); font-weight:700; font-size:14px; line-height:1; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:8px; transition:background .18s var(--ease-out), box-shadow .18s var(--ease-out), transform .12s var(--ease-out); }
.ncs4-toolbar .nc-btn svg{ width:16px; height:16px; flex:none; }
.ncs4-toolbar .nc-btn:not(:disabled):active{ transform:scale(.97); }
.ncs4-toolbar .nc-btn-primary{ background:var(--orange-400); color:#fff; }
.ncs4-toolbar .nc-btn-primary:not(:disabled):hover{ background:var(--orange-500); box-shadow:0 8px 22px rgba(227,123,36,.32); }
.ncs4-toolbar .nc-btn-secondary{ background:var(--blue-700); color:#fff; }
.ncs4-toolbar .nc-btn-secondary:not(:disabled):hover{ background:var(--blue-800); }
.ncs4-toolbar .nc-btn-ghost{ background:transparent; color:var(--blue-700); border:2px solid var(--blue-500); padding:0 14px; }
.ncs4-toolbar .nc-btn-ghost:not(:disabled):hover{ background:var(--blue-50); }

.ncs4-toolbar .stack{ display:flex; flex-direction:column; gap:20px; }
.ncs4-toolbar .page{ position:relative; height:150px; border-radius:14px; overflow:hidden; border:1px solid var(--n200); }
.ncs4-toolbar .page.light{ background:#ffffff; }
.ncs4-toolbar .page.dark{ background:#0f1319; }
.ncs4-toolbar .chip{ position:absolute; top:12px; left:14px; font-size:11px; font-weight:700; letter-spacing:.08em; padding:3px 9px; border-radius:999px; }
.ncs4-toolbar .page.light .chip{ background:#eef1f6; color:#4f5b6e; }
.ncs4-toolbar .page.dark .chip{ background:rgba(255,255,255,.12); color:#e6ebf2; }
.ncs4-toolbar .caption{ font-size:12.5px; color:var(--n500); margin:10px 2px 0; font-family:var(--font-sans); }
      `}</style>
      <div className="stack">
        <div>
          <div className="page light">
            <span className="chip">宿主網頁</span>
            <Toolbar />
          </div>
          <div className="caption">淺色網頁 · 預設</div>
        </div>
        <div>
          <div className="page light">
            <span className="chip">宿主網頁</span>
            <Toolbar checked />
          </div>
          <div className="caption">淺色網頁 · 已勾「連水平方向展開」（藍底白勾）</div>
        </div>
        <div>
          <div className="page dark">
            <span className="chip">宿主網頁</span>
            <Toolbar onDark />
          </div>
          <div className="caption">深色網頁 · 白描邊＋深陰影</div>
        </div>
      </div>
    </div>
  );
}
