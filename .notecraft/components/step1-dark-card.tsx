// 重製 Step 1 「深色網頁上的自足卡片」：深底時卡片加 1px 白色外描邊、陰影換 0 14px 34px rgba(0,0,0,.45)，
// 確保浮動卡片在任意背景都可讀。
export default function Step1DarkCard() {
  return (
    <div className="ncs1-dark not-prose">
      <style>{`
.ncs1-dark{background:#0f1319;border-radius:16px;padding:26px;font-family:var(--font-sans);}
.ncs1-dark .card{background:#fff;border:1px solid rgba(255,255,255,.6);border-radius:16px;
  box-shadow:0 14px 34px rgba(0,0,0,.45);padding:20px 22px;max-width:430px;}
.ncs1-dark .t{font-weight:700;font-size:14px;color:#161c28;}
.ncs1-dark .f{font-family:var(--font-mono);font-size:12px;color:#1b4f9c;margin-top:2px;}
.ncs1-dark .d{font-size:12px;color:#4f5b6e;line-height:1.8;margin-top:6px;}
.ncs1-dark .row{display:flex;gap:12px;margin-top:12px;}
.ncs1-dark .btn{height:34px;border-radius:999px;border:0;padding:0 16px;font-family:var(--font-sans);
  font-weight:700;font-size:13px;cursor:pointer;transition:.18s cubic-bezier(.16,1,.3,1);}
.ncs1-dark .btn:active{transform:scale(.97);}
.ncs1-dark .btn-secondary{background:#1b4f9c;color:#fff;}
.ncs1-dark .btn-secondary:hover{background:#163f7d;}
.ncs1-dark .btn-ghost{background:transparent;color:#1b4f9c;border:2px solid #2c6ebb;}
.ncs1-dark .btn-ghost:hover{background:#eef4fb;}
      `}</style>
      <div className="card">
        <div className="t">已存到下載資料夾</div>
        <div className="f">notecraft-clip-2026-07-28-1432.png</div>
        <div className="d">展開 2 層容器、處理 1 個浮動元素，輸出 1280 × 3400。</div>
        <div className="row">
          <button className="btn btn-secondary" type="button">開啟資料夾</button>
          <button className="btn btn-ghost" type="button">再截一張</button>
        </div>
      </div>
    </div>
  );
}
