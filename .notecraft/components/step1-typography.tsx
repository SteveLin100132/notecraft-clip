// 重製 Step 1 「字體」樣本：CJK 三級字重 + Mono 描述／尺寸。
// 字體家族沿用 viewer 的 --font-sans / --font-mono，字級與色彩沿用 artifact 的 design token。
export default function Step1Typography() {
  return (
    <div className="ncs1-type not-prose">
      <style>{`
.ncs1-type{--n900:#161c28;--n700:#3a4456;--n600:#4f5b6e;--n400:#9aa6b8;
  display:flex;flex-direction:column;gap:10px;color:var(--n900);font-family:var(--font-sans);}
.ncs1-type .line{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;}
.ncs1-type .tag{font-family:var(--font-mono);font-size:11px;color:var(--n400);min-width:150px;}
.ncs1-type .cjk700{font-weight:700;font-size:20px;color:var(--n900);}
.ncs1-type .cjk500{font-weight:500;font-size:15px;color:var(--n700);}
.ncs1-type .cjk400{font-weight:400;font-size:13px;color:var(--n600);}
.ncs1-type .mono{font-family:var(--font-mono);}
      `}</style>
      <div className="line"><span className="tag">TC 700 · 主字 14.5px</span><span className="cjk700">選一個區塊</span></div>
      <div className="line"><span className="tag">TC 500 · 標籤 12.5px</span><span className="cjk500">隱藏浮動元素 · 連水平方向展開 · 匯出 PNG</span></div>
      <div className="line"><span className="tag">TC 400 · 內文 13px</span><span className="cjk400">已存到下載資料夾，展開 2 層容器、處理 1 個浮動元素。</span></div>
      <div className="line"><span className="tag">Mono 500 · 描述</span><span className="mono" style={{ fontSize: 13, color: "#161c28" }}>main.article &gt; div.post-body</span></div>
      <div className="line"><span className="tag">Mono 400 · 尺寸／檔名</span><span className="mono" style={{ fontSize: 12, color: "#1b4f9c" }}>1280 × 3400 · notecraft-clip-2026-07-28-1432.png</span></div>
    </div>
  );
}
