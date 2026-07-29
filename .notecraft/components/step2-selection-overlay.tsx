// 重製 Step 2「選取覆蓋框」的 hover / 鎖定兩態，並在淺色與深色網頁上各驗證一次。
// CSS 逐字取自 picker.js：A1 藍色行進虛線（marching ants，四軸 100% 錨點必須保留才會動）
// ＋外圈輔助線＋藍標籤；A2 金色實線＋柔光暈＋金標籤＋右下尺寸標籤。
import { Crop, Check } from "lucide-react";

// 四格 = 兩態 × 兩種底色，用資料驅動避免重複貼四份幾乎一樣的 markup。
type Cell = {
  theme: "light" | "dark";
  state: "hover" | "locked";
  chip: string;
  caption: string;
};

const CELLS: Cell[] = [
  { theme: "light", state: "hover", chip: "A1 · hover 框選中", caption: "淺色網頁 · 行進虛線動畫進行中" },
  { theme: "light", state: "locked", chip: "A2 · 已鎖定", caption: "淺色網頁 · 金色鎖定＋尺寸標籤" },
  { theme: "dark", state: "hover", chip: "A1 · hover 框選中", caption: "深色網頁 · 藍虛線與標籤對比成立" },
  { theme: "dark", state: "locked", chip: "A2 · 已鎖定", caption: "深色網頁 · 金色鎖定＋尺寸標籤" },
];

// 骨架列：模擬被框選的「宿主網頁」內容，四格共用。
function Skeleton() {
  return (
    <>
      <div className="sk hd" style={{ left: 24, top: 52, width: "46%" }} />
      <div className="sk" style={{ left: 24, top: 82, width: "70%" }} />
      <div className="sk" style={{ left: 24, top: 104, width: "64%" }} />
      <div className="sk" style={{ left: 24, top: 126, width: "72%" }} />
      <div className="sk" style={{ left: 24, top: 148, width: "40%" }} />
    </>
  );
}

export default function Step2SelectionOverlay() {
  return (
    <div className="ncs2-overlay not-prose">
      <style>{`
.ncs2-overlay{
  --blue-500:#2c6ebb; --blue-700:#1b4f9c;
  --orange-400:#ed9b26; --orange-500:#e37b24;
  --n200:#e1e6ee; --n500:#6c798e; --n800:#262e3d;
  font-family:var(--font-sans);
}
.ncs2-overlay *{box-sizing:border-box;}
/* 四軸 background-position 錨點（0 0 / 0 100% / 0 0 / 100% 0）與此 keyframes 位移量成對，改動任一都會讓虛線不動或跳格。 */
@keyframes ncs2march{ to { background-position: 24px 0, -24px 100%, 0 -24px, 100% 24px; } }
.ncs2-overlay .grid{ display:grid; grid-template-columns:1fr 1fr; gap:22px; }
@media(max-width:720px){ .ncs2-overlay .grid{ grid-template-columns:1fr; } }
.ncs2-overlay .caption{ font-size:12.5px; color:var(--n500); margin:10px 2px 0; font-family:var(--font-sans); }
.ncs2-overlay .page{ position:relative; height:230px; border-radius:14px; overflow:hidden; border:1px solid var(--n200); }
.ncs2-overlay .page.light{ background:#ffffff; }
.ncs2-overlay .page.dark{ background:#0f1319; }
.ncs2-overlay .chip{ position:absolute; top:12px; left:14px; font-size:11px; font-weight:700; letter-spacing:.08em; padding:3px 9px; border-radius:999px; }
.ncs2-overlay .page.light .chip{ background:#eef1f6; color:#4f5b6e; }
.ncs2-overlay .page.dark .chip{ background:rgba(255,255,255,.12); color:#e6ebf2; }
.ncs2-overlay .sk{ position:absolute; height:10px; border-radius:6px; background:rgba(120,140,170,.22); }
.ncs2-overlay .page.dark .sk{ background:rgba(255,255,255,.13); }
.ncs2-overlay .hd{ height:14px; border-radius:7px; }
.ncs2-overlay .nc-box{ position:absolute; border-radius:3px; }
.ncs2-overlay .nc-box.hover{
  background-color: rgba(44,110,187,.07);
  background-image:
    linear-gradient(90deg, var(--blue-500) 50%, transparent 0),
    linear-gradient(90deg, var(--blue-500) 50%, transparent 0),
    linear-gradient(0deg, var(--blue-500) 50%, transparent 0),
    linear-gradient(0deg, var(--blue-500) 50%, transparent 0);
  background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  outline: 1px solid rgba(44,110,187,.18); outline-offset: 6px;
  animation: ncs2march 900ms linear infinite;
}
.ncs2-overlay .nc-box.locked{
  background-color: rgba(237,155,38,.10);
  border: 2px solid var(--orange-400);
  box-shadow: 0 0 0 6px rgba(237,155,38,.16);
}
.ncs2-overlay .nc-tag{
  position:absolute; top:-13px; left:0; display:inline-flex; align-items:center; gap:6px;
  max-width:60vw; padding:4px 11px; color:#fff; border-radius:999px; white-space:nowrap;
  box-shadow:0 6px 18px rgba(17,47,93,.18);
}
.ncs2-overlay .nc-box.hover .nc-tag{ background:var(--blue-700); }
.ncs2-overlay .nc-box.locked .nc-tag{ background:var(--orange-400); box-shadow:0 6px 18px rgba(227,123,36,.28); }
.ncs2-overlay .nc-tag svg{ width:12px; height:12px; flex:none; }
.ncs2-overlay .nc-tag-desc{ font-family:var(--font-mono); font-size:11.5px; line-height:1.4; overflow:hidden; text-overflow:ellipsis; }
.ncs2-overlay .nc-size{
  position:absolute; bottom:-11px; right:0; padding:3px 10px; color:#fff; background:var(--n800);
  border-radius:999px; font-family:var(--font-mono); font-size:11px; line-height:1.4; white-space:nowrap;
}
      `}</style>
      <div className="grid">
        {CELLS.map((cell, i) => (
          <div key={i}>
            <div className={`page ${cell.theme}`}>
              <span className="chip">{cell.chip}</span>
              <Skeleton />
              <div
                className={`nc-box ${cell.state}`}
                style={{ left: 24, top: 70, right: 150, height: 110 }}
              >
                <span className="nc-tag">
                  <span style={{ display: "inline-flex" }}>
                    {cell.state === "hover" ? <Crop size={13} /> : <Check size={13} />}
                  </span>
                  <span className="nc-tag-desc">main.article</span>
                </span>
                {cell.state === "locked" && <span className="nc-size">1280 × 3400</span>}
              </div>
            </div>
            <div className="caption">{cell.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
