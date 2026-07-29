// 重製 Step 6「E. 成功／錯誤 toast」：430px 獨立卡片，E1 成功（綠勾）／E2 錯誤（紅三角），
// 各在淺色與深色宿主網頁上；深色成功變體省略「開啟資料夾」（備援存檔、無 downloadId）。
// CSS／結構逐字取自 picker.js 的 toast，色值與尺寸原樣保留。
import { CircleCheck, TriangleAlert, X } from "lucide-react";

export default function Step6Toast() {
  return (
    <div className="ncs6-toast not-prose">
      <style>{`
/* 色彩與字體 token 掛在容器上，讓卡片在任意背景都用同一組基準 */
.ncs6-toast{
  --blue-50:#eef4fb; --blue-400:#4d84cb; --blue-500:#2c6ebb; --blue-700:#1b4f9c; --blue-800:#163f7d;
  --orange-400:#ed9b26; --orange-500:#e37b24;
  --n0:#ffffff; --n50:#f6f8fb; --n100:#eef1f6; --n200:#e1e6ee; --n300:#cbd3df;
  --n400:#9aa6b8; --n500:#6c798e; --n600:#4f5b6e; --n700:#3a4456; --n900:#161c28;
  --success:#2e9e6b; --success-50:#e7f6ee; --danger:#d64545; --danger-50:#fbeaea;
  --font-cjk:var(--font-sans); --font-latin:var(--font-sans); --ease-out:cubic-bezier(.16,1,.3,1);
}
.ncs6-toast *{box-sizing:border-box;}
@keyframes ncs6Rise { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%); } }

.ncs6-toast .nc-toast{ position:absolute; left:50%; bottom:22px; transform:translateX(-50%); width:min(430px, calc(100% - 32px)); display:flex; gap:12px; padding:14px 14px 14px 16px; color:var(--n900); background:var(--n0); border:1px solid var(--n200); border-radius:16px; box-shadow:0 14px 34px rgba(17,47,93,.16); animation:ncs6Rise 280ms var(--ease-out) both; }
.ncs6-toast .nc-toast.on-dark{ border-color:rgba(255,255,255,.6); box-shadow:0 14px 34px rgba(0,0,0,.45); }
.ncs6-toast .nc-badge{ width:32px; height:32px; flex:none; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; }
.ncs6-toast .nc-badge svg{ width:18px; height:18px; }
.ncs6-toast .nc-badge-success{ background:var(--success-50); color:var(--success); }
.ncs6-toast .nc-badge-danger{ background:var(--danger-50); color:var(--danger); }
.ncs6-toast .nc-toast-body{ display:flex; flex-direction:column; gap:3px; min-width:0; flex:1; }
.ncs6-toast .nc-toast-title{ font-family:var(--font-cjk); font-weight:700; font-size:14px; color:var(--n900); }
.ncs6-toast .nc-toast-file{ font-family:var(--font-mono); font-size:12px; color:var(--blue-700); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ncs6-toast .nc-toast-desc{ font-family:var(--font-cjk); font-size:12px; line-height:1.8; color:var(--n600); }
.ncs6-toast .nc-toast-actions{ display:flex; gap:8px; margin-top:6px; }
.ncs6-toast .nc-toast-close{ flex:none; width:26px; height:26px; align-self:flex-start; border:0; border-radius:999px; background:transparent; color:var(--n400); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.ncs6-toast .nc-toast-close svg{ width:14px; height:14px; }
.ncs6-toast .nc-toast-close:hover{ background:var(--n100); color:var(--n700); }
.ncs6-toast .nc-btn{ height:36px; border-radius:999px; border:0; padding:0 16px; font-family:var(--font-cjk); font-weight:700; font-size:14px; line-height:1; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:8px; }
.ncs6-toast .nc-btn-secondary{ background:var(--blue-700); color:#fff; }
.ncs6-toast .nc-btn-ghost{ background:transparent; color:var(--blue-700); border:2px solid var(--blue-500); padding:0 14px; }

.ncs6-toast .wrap{ font-family:var(--font-latin),var(--font-cjk); color:var(--n900); }
.ncs6-toast .grid{ display:grid; grid-template-columns:1fr 1fr; gap:22px; }
@media(max-width:820px){ .ncs6-toast .grid{ grid-template-columns:1fr; } }
.ncs6-toast .page{ position:relative; height:210px; border-radius:14px; overflow:hidden; border:1px solid var(--n200); }
.ncs6-toast .page.light{ background:#ffffff; }
.ncs6-toast .page.dark{ background:#0f1319; }
.ncs6-toast .chip{ position:absolute; top:12px; left:14px; font-size:11px; font-weight:700; letter-spacing:.08em; padding:3px 9px; border-radius:999px; }
.ncs6-toast .page.light .chip{ background:#eef1f6; color:#4f5b6e; }
.ncs6-toast .page.dark .chip{ background:rgba(255,255,255,.12); color:#e6ebf2; }
.ncs6-toast .caption{ font-size:12.5px; color:var(--n500); margin:10px 2px 0; font-family:var(--font-cjk); }
      `}</style>
      <div className="wrap">
        <div className="grid">
          {/* E1 成功 · 淺色 · 有 downloadId（可開啟資料夾） */}
          <div>
            <div className="page light">
              <span className="chip">宿主網頁</span>
              <div className="nc-toast">
                <span className="nc-badge nc-badge-success"><CircleCheck /></span>
                <div className="nc-toast-body">
                  <div className="nc-toast-title">已存到下載資料夾</div>
                  <div className="nc-toast-file">notecraft-clip-2026-07-28-1432.png</div>
                  <div className="nc-toast-desc">展開 2 層容器、處理 1 個浮動元素，輸出 1280 × 3400。</div>
                  <div className="nc-toast-actions">
                    <button className="nc-btn nc-btn-secondary" type="button"><span>開啟資料夾</span></button>
                    <button className="nc-btn nc-btn-ghost" type="button"><span>再截一張</span></button>
                  </div>
                </div>
                <button className="nc-toast-close" type="button" aria-label="關閉"><X /></button>
              </div>
            </div>
            <div className="caption">E1 成功 · 淺色 · 有 downloadId（可開啟資料夾）</div>
          </div>

          {/* E2 錯誤 · 淺色 */}
          <div>
            <div className="page light">
              <span className="chip">宿主網頁</span>
              <div className="nc-toast">
                <span className="nc-badge nc-badge-danger"><TriangleAlert /></span>
                <div className="nc-toast-body">
                  <div className="nc-toast-title">截圖沒有完成</div>
                  <div className="nc-toast-desc">這個分頁已經有偵錯工具連著了，請先關掉 DevTools 再試一次。</div>
                  <div className="nc-toast-actions">
                    <button className="nc-btn nc-btn-secondary" type="button"><span>重新截圖</span></button>
                    <button className="nc-btn nc-btn-ghost" type="button"><span>查看說明</span></button>
                  </div>
                </div>
                <button className="nc-toast-close" type="button" aria-label="關閉"><X /></button>
              </div>
            </div>
            <div className="caption">E2 錯誤 · 淺色</div>
          </div>

          {/* E1 成功 · 深色 · 無 downloadId（備援存檔，隱藏開啟資料夾） */}
          <div>
            <div className="page dark">
              <span className="chip">宿主網頁</span>
              <div className="nc-toast on-dark">
                <span className="nc-badge nc-badge-success"><CircleCheck /></span>
                <div className="nc-toast-body">
                  <div className="nc-toast-title">已存到下載資料夾</div>
                  <div className="nc-toast-file">notecraft-clip-2026-07-28-1432.png</div>
                  <div className="nc-toast-desc">展開 2 層容器、處理 1 個浮動元素，輸出 1280 × 3400。</div>
                  <div className="nc-toast-actions">
                    <button className="nc-btn nc-btn-ghost" type="button"><span>再截一張</span></button>
                  </div>
                </div>
                <button className="nc-toast-close" type="button" aria-label="關閉"><X /></button>
              </div>
            </div>
            <div className="caption">E1 成功 · 深色 · 無 downloadId（備援存檔，隱藏開啟資料夾）</div>
          </div>

          {/* E2 錯誤 · 深色 */}
          <div>
            <div className="page dark">
              <span className="chip">宿主網頁</span>
              <div className="nc-toast on-dark">
                <span className="nc-badge nc-badge-danger"><TriangleAlert /></span>
                <div className="nc-toast-body">
                  <div className="nc-toast-title">截圖沒有完成</div>
                  <div className="nc-toast-desc">這個分頁已經有偵錯工具連著了，請先關掉 DevTools 再試一次。</div>
                  <div className="nc-toast-actions">
                    <button className="nc-btn nc-btn-secondary" type="button"><span>重新截圖</span></button>
                    <button className="nc-btn nc-btn-ghost" type="button"><span>查看說明</span></button>
                  </div>
                </div>
                <button className="nc-toast-close" type="button" aria-label="關閉"><X /></button>
              </div>
            </div>
            <div className="caption">E2 錯誤 · 深色</div>
          </div>
        </div>
      </div>
    </div>
  );
}
