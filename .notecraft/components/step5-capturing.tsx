// 重製 Step 5「D. 截圖中（loading）」：橘色圖片徽章、不定量流光進度、真實層數 meta，
// CTA 進 disabled＋spinner「截圖中…」，期間只留「取消」可用。淺色／深色兩態並陳。
// 為什麼是純靜態：這只是狀態設計稿，不需互動；流光與 spinner 皆為 CSS keyframes，不靠 JS。
import { Image, LoaderCircle } from "lucide-react";

export default function Step5Capturing() {
  return (
    <div className="ncs5-capturing not-prose">
      <style>{`
/* keyframes 唯一命名，避免與其他步驟的動畫撞名 */
@keyframes ncs5Rise { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%); } }
@keyframes ncs5spin { to { transform: rotate(360deg); } }
@keyframes ncs5Flow { 0% { transform: translateX(-120%); } 100% { transform: translateX(400%); } }

.ncs5-capturing{
  --blue-500:#2c6ebb; --blue-700:#1b4f9c;
  --orange-50:#fdf4e6; --orange-400:#ed9b26; --orange-500:#e37b24;
  --n0:#ffffff; --n100:#eef1f6; --n200:#e1e6ee; --n500:#6c798e; --n600:#4f5b6e; --n900:#161c28;
  --ease-out:cubic-bezier(.16,1,.3,1);
  font-family:var(--font-sans);
}
.ncs5-capturing *{ box-sizing:border-box; }

.ncs5-capturing .stack{ display:flex; flex-direction:column; gap:20px; }
.ncs5-capturing .page{ position:relative; height:150px; border-radius:14px; overflow:hidden; border:1px solid var(--n200); }
.ncs5-capturing .page.light{ background:#ffffff; }
.ncs5-capturing .page.dark{ background:#0f1319; }
.ncs5-capturing .chip{ position:absolute; top:12px; left:14px; font-size:11px; font-weight:700; letter-spacing:.08em; padding:3px 9px; border-radius:999px; }
.ncs5-capturing .page.light .chip{ background:#eef1f6; color:#4f5b6e; }
.ncs5-capturing .page.dark .chip{ background:rgba(255,255,255,.12); color:#e6ebf2; }
.ncs5-capturing .caption{ font-size:12.5px; color:var(--n500); margin:10px 2px 0; font-family:var(--font-sans); }

.ncs5-capturing .nc-bar{ position:absolute; left:50%; bottom:22px; transform:translateX(-50%); display:flex; align-items:center; gap:7px; height:56px; padding:0 8px; max-width:calc(100% - 24px); color:var(--n900); background:var(--n0); border:1px solid var(--n200); border-radius:16px; box-shadow:0 14px 34px rgba(17,47,93,.16); animation:ncs5Rise 240ms var(--ease-out) both; }
/* 深底時換白描邊＋深陰影，確保浮動列在任意背景可讀 */
.ncs5-capturing .nc-bar.on-dark{ border-color:rgba(255,255,255,.6); box-shadow:0 14px 34px rgba(0,0,0,.45); }
.ncs5-capturing .nc-badge{ width:34px; height:34px; flex:none; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; }
.ncs5-capturing .nc-badge svg{ width:18px; height:18px; }
.ncs5-capturing .nc-badge-loading{ background:var(--orange-50); color:var(--orange-500); }
.ncs5-capturing .nc-div{ width:1px; height:28px; flex:none; background:var(--n200); }
.ncs5-capturing .nc-info{ display:flex; flex-direction:column; gap:1px; min-width:0; max-width:176px; padding:0 2px; }
.ncs5-capturing .nc-desc{ font-family:var(--font-mono); font-weight:500; font-size:13px; color:var(--n900); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ncs5-capturing .nc-meta{ font-size:11.5px; color:var(--n500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ncs5-capturing .nc-prog{ display:flex; flex-direction:column; gap:5px; justify-content:center; }
.ncs5-capturing .nc-track{ position:relative; width:150px; height:6px; border-radius:999px; background:var(--n100); overflow:hidden; }
/* 不定量流光：不造假百分比，只表達「進行中」 */
.ncs5-capturing .nc-fill{ position:absolute; top:0; left:0; height:100%; width:40%; border-radius:999px; background:var(--orange-400); animation:ncs5Flow 1.15s linear infinite; }
.ncs5-capturing .nc-prog-cap{ font-size:11px; color:var(--n500); font-family:var(--font-sans); white-space:nowrap; }
.ncs5-capturing .nc-actions{ display:flex; align-items:center; gap:8px; }
.ncs5-capturing .nc-btn{ height:36px; border-radius:999px; border:0; padding:0 16px; font-family:var(--font-sans); font-weight:700; font-size:14px; line-height:1; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:8px; }
.ncs5-capturing .nc-btn svg{ width:16px; height:16px; flex:none; }
.ncs5-capturing .nc-btn-primary{ background:var(--orange-400); color:#fff; }
.ncs5-capturing .nc-btn-ghost{ background:transparent; color:var(--blue-700); border:2px solid var(--blue-500); padding:0 14px; }
.ncs5-capturing .nc-btn:disabled{ opacity:.5; cursor:not-allowed; }
.ncs5-capturing .nc-spin{ display:inline-flex; }
.ncs5-capturing .nc-spin svg{ width:15px; height:15px; animation:ncs5spin 900ms linear infinite; }
      `}</style>
      <div className="stack">
        <div>
          <div className="page light">
            <span className="chip">宿主網頁</span>
            <div className="nc-bar">
              <span className="nc-badge nc-badge-loading"><Image /></span>
              <div className="nc-info">
                <b className="nc-desc">main.article &gt; div.post-body</b>
                <span className="nc-meta">展開 2 層容器並合成中…</span>
              </div>
              <div className="nc-div"></div>
              <div className="nc-prog">
                <div className="nc-track"><div className="nc-fill"></div></div>
                <div className="nc-prog-cap">正在展開並合成…</div>
              </div>
              <div className="nc-div"></div>
              <div className="nc-actions">
                <button className="nc-btn nc-btn-primary" type="button" disabled>
                  <span className="nc-spin"><LoaderCircle /></span>
                  <span>截圖中…</span>
                </button>
                <button className="nc-btn nc-btn-ghost" type="button"><span>取消</span></button>
              </div>
            </div>
          </div>
          <div className="caption">淺色網頁</div>
        </div>
        <div>
          <div className="page dark">
            <span className="chip">宿主網頁</span>
            <div className="nc-bar on-dark">
              <span className="nc-badge nc-badge-loading"><Image /></span>
              <div className="nc-info">
                <b className="nc-desc">main.article &gt; div.post-body</b>
                <span className="nc-meta">展開 2 層容器並合成中…</span>
              </div>
              <div className="nc-div"></div>
              <div className="nc-prog">
                <div className="nc-track"><div className="nc-fill"></div></div>
                <div className="nc-prog-cap">正在展開並合成…</div>
              </div>
              <div className="nc-div"></div>
              <div className="nc-actions">
                <button className="nc-btn nc-btn-primary" type="button" disabled>
                  <span className="nc-spin"><LoaderCircle /></span>
                  <span>截圖中…</span>
                </button>
                <button className="nc-btn nc-btn-ghost" type="button"><span>取消</span></button>
              </div>
            </div>
          </div>
          <div className="caption">深色網頁 · 白描邊＋深陰影</div>
        </div>
      </div>
    </div>
  );
}
