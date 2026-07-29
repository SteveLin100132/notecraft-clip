// 重製 Step 1 「選取覆蓋框（A 狀態預覽）」：
// A1 hover = 藍色行進虛線 + 外圈輔助線 + 藍標籤；A2 鎖定 = 金色實線 + 柔光暈 + 金標籤 + 右下尺寸標籤。
import { Crop, Check } from "lucide-react";

function Skeleton() {
  return (
    <>
      <div className="skel" style={{ left: 26, top: 44, width: "40%" }} />
      <div className="skel" style={{ left: 26, top: 64, width: "62%" }} />
      <div className="skel" style={{ left: 26, top: 84, width: "52%" }} />
    </>
  );
}

export default function Step1Selection() {
  return (
    <div className="ncs1-sel not-prose">
      <style>{`
.ncs1-sel{font-family:var(--font-sans);display:flex;flex-wrap:wrap;gap:20px;}
.ncs1-sel .col{flex:1;min-width:280px;}
.ncs1-sel .cap{font-family:var(--font-mono);font-size:11px;color:#9aa6b8;margin:0 0 6px;}
.ncs1-sel .stage{position:relative;height:150px;border-radius:12px;overflow:hidden;border:1px solid #e1e6ee;background:#fff;}
.ncs1-sel .skel{position:absolute;height:9px;border-radius:5px;background:rgba(120,140,170,.25);}
.ncs1-sel .selbox{position:absolute;left:26px;top:26px;right:26px;bottom:26px;border-radius:4px;}
.ncs1-sel .a1{border:2px dashed #2c6ebb;background:rgba(44,110,187,.07);outline:1px solid rgba(44,110,187,.18);
  outline-offset:6px;animation:ncs1march 12s linear infinite;}
@keyframes ncs1march{to{background-position:80px 0,80px 0;}}
.ncs1-sel .a2{border:2px solid #ed9b26;background:rgba(237,155,38,.10);box-shadow:0 0 0 6px rgba(237,155,38,.16);}
.ncs1-sel .taglbl{position:absolute;top:-13px;left:0;display:inline-flex;align-items:center;gap:6px;color:#fff;
  border-radius:999px;padding:4px 11px;font-family:var(--font-mono);font-size:11.5px;box-shadow:0 6px 18px rgba(17,47,93,.18);}
.ncs1-sel .taglbl.a1{background:#1b4f9c;}
.ncs1-sel .taglbl.a2{background:#ed9b26;box-shadow:0 6px 18px rgba(227,123,36,.28);}
.ncs1-sel .sizelbl{position:absolute;bottom:-11px;right:0;background:#161c28;color:#fff;font-family:var(--font-mono);
  font-size:11px;border-radius:999px;padding:3px 10px;}
      `}</style>
      <div className="col">
        <p className="cap">A1 · hover</p>
        <div className="stage">
          <Skeleton />
          <div className="selbox a1">
            <span className="taglbl a1"><Crop size={13} /> main.article</span>
          </div>
        </div>
      </div>
      <div className="col">
        <p className="cap">A2 · 鎖定</p>
        <div className="stage">
          <Skeleton />
          <div className="selbox a2">
            <span className="taglbl a2"><Check size={13} /> main.article</span>
            <span className="sizelbl">1280 × 3400</span>
          </div>
        </div>
      </div>
    </div>
  );
}
