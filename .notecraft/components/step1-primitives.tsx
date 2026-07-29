// 重製 Step 1 「圓角・陰影・按鈕・鍵帽」：pill 按鈕三態、鍵帽、徽章、四級陰影卡片。
import { Crop, Check } from "lucide-react";

const SHADOWS = [
  { name: "--shadow-sm", css: "0 2px 6px rgba(17,47,93,.08)" },
  { name: "--shadow-md", css: "0 6px 18px rgba(17,47,93,.10)" },
  { name: "--shadow-lg", css: "0 14px 34px rgba(17,47,93,.16)" },
  { name: "--shadow-accent", css: "0 8px 22px rgba(227,123,36,.32)" },
];

export default function Step1Primitives() {
  return (
    <div className="ncs1-prim not-prose">
      <style>{`
.ncs1-prim{font-family:var(--font-sans);--blue-50:#eef4fb;--blue-500:#2c6ebb;--blue-700:#1b4f9c;--blue-800:#163f7d;
  --orange-400:#ed9b26;--orange-500:#e37b24;--n50:#f6f8fb;--n300:#cbd3df;--n500:#6c798e;--n700:#3a4456;}
.ncs1-prim .row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:6px;}
.ncs1-prim .btn{height:36px;border-radius:999px;border:0;padding:0 18px;font-family:var(--font-sans);
  font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;
  transition:.18s cubic-bezier(.16,1,.3,1);}
.ncs1-prim .btn:active{transform:scale(.97);}
.ncs1-prim .btn-primary{background:var(--orange-400);color:#fff;}
.ncs1-prim .btn-primary:hover{background:var(--orange-500);box-shadow:0 8px 22px rgba(227,123,36,.32);}
.ncs1-prim .btn-secondary{background:var(--blue-700);color:#fff;}
.ncs1-prim .btn-secondary:hover{background:var(--blue-800);}
.ncs1-prim .btn-ghost{background:transparent;color:var(--blue-700);border:2px solid var(--blue-500);}
.ncs1-prim .btn-ghost:hover{background:var(--blue-50);}
.ncs1-prim .kbd{min-width:24px;height:24px;padding:0 6px;border-radius:6px;border:1px solid var(--n300);
  border-bottom-width:2px;background:var(--n50);color:var(--n700);font-family:var(--font-mono);font-size:12px;
  display:inline-flex;align-items:center;justify-content:center;}
.ncs1-prim .badge{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;}
.ncs1-prim .shrow{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-top:8px;}
.ncs1-prim .shcard{background:#fff;border-radius:16px;padding:18px;font-size:12px;display:flex;flex-direction:column;gap:4px;}
.ncs1-prim .shcard b{font-family:var(--font-mono);}
.ncs1-prim .shcard span{font-family:var(--font-mono);color:var(--n500);font-size:10.5px;}
      `}</style>
      <div className="row">
        <button className="btn btn-primary" type="button">匯出 PNG</button>
        <button className="btn btn-secondary" type="button">重選</button>
        <button className="btn btn-ghost" type="button">取消</button>
        <span className="kbd">↑</span>
        <span className="kbd">↓</span>
        <span className="kbd">Esc</span>
        <span className="badge" style={{ background: "#eef4fb", color: "#1b4f9c" }}><Crop size={17} /></span>
        <span className="badge" style={{ background: "#ed9b26", color: "#fff" }}><Check size={18} /></span>
      </div>
      <div className="shrow">
        {SHADOWS.map((s) => (
          <div className="shcard" key={s.name} style={{ boxShadow: s.css }}>
            <b>{s.name}</b>
            <span>{s.css}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
