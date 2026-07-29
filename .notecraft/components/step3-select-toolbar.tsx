// 重製 Step 3「B.『框選中』工具列」：56px 白色浮動卡片、置中貼底、ncRise 入場（保留 translateX(-50%)）。
// 淺／深兩種宿主網頁各放一份，深底靠白描邊＋加深陰影維持可讀（沿用 isDarkPage 判斷）。
import { SquareDashedMousePointer } from "lucide-react";

// 三組鍵帽沿用現有 onKey 邏輯：↑ 選父層／↓ 選子層／Esc 取消。
// kbd 內是鍵盤標籤字元（↑ ↓ Esc），屬鍵盤語意，保留為純文字。
const KEYS: { key: string; label: string }[] = [
  { key: "↑", label: "選父層" },
  { key: "↓", label: "選子層" },
  { key: "Esc", label: "取消" },
];

// 骨架佔位條，僅為宿主網頁背景示意。
function Skeleton() {
  return (
    <>
      <div className="sk" style={{ left: 24, top: 44, width: "52%" }} />
      <div className="sk" style={{ left: 24, top: 66, width: "70%" }} />
      <div className="sk" style={{ left: 24, top: 88, width: "64%" }} />
    </>
  );
}

// 工具列本體，onDark 時套用白描邊＋深陰影變體。
function Bar({ onDark = false }: { onDark?: boolean }) {
  return (
    <div className={onDark ? "nc-bar on-dark" : "nc-bar"}>
      <span className="nc-badge nc-badge-blue">
        <SquareDashedMousePointer size={18} />
      </span>
      <div className="nc-txt">
        <b className="nc-title">選一個區塊</b>
        <span className="nc-sub">移動滑鼠 → 點一下確認</span>
      </div>
      <div className="nc-div" />
      <div className="nc-keys">
        {KEYS.map((k) => (
          <span className="nc-key" key={k.key}>
            <kbd>{k.key}</kbd>
            <span>{k.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Step3SelectToolbar() {
  return (
    <div className="ncs3-toolbar not-prose">
      <style>{`
.ncs3-toolbar{
  --blue-50:#eef4fb; --blue-500:#2c6ebb; --blue-700:#1b4f9c; --blue-800:#163f7d;
  --orange-400:#ed9b26;
  --n0:#ffffff; --n50:#f6f8fb; --n100:#eef1f6; --n200:#e1e6ee; --n300:#cbd3df;
  --n400:#9aa6b8; --n500:#6c798e; --n600:#4f5b6e; --n700:#3a4456; --n900:#161c28;
  --ease-out:cubic-bezier(.16,1,.3,1);
  font-family:var(--font-sans); color:var(--n900);
}
.ncs3-toolbar *{ box-sizing:border-box; }
@keyframes ncs3Rise { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%); } }

.ncs3-toolbar .nc-bar{
  position:absolute; left:50%; bottom:22px; transform:translateX(-50%);
  display:flex; align-items:center; gap:7px; height:56px; padding:0 8px;
  max-width:calc(100% - 32px); color:var(--n900); background:var(--n0);
  border:1px solid var(--n200); border-radius:16px; box-shadow:0 14px 34px rgba(17,47,93,.16);
  animation: ncs3Rise 240ms var(--ease-out) both;
}
.ncs3-toolbar .nc-bar.on-dark{ border-color:rgba(255,255,255,.6); box-shadow:0 14px 34px rgba(0,0,0,.45); }
.ncs3-toolbar .nc-badge{ width:34px; height:34px; flex:none; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; }
.ncs3-toolbar .nc-badge svg{ width:18px; height:18px; }
.ncs3-toolbar .nc-badge-blue{ background:var(--blue-50); color:var(--blue-700); }
.ncs3-toolbar .nc-txt{ display:flex; flex-direction:column; gap:1px; min-width:0; padding:0 2px; }
.ncs3-toolbar .nc-title{ font-family:var(--font-sans); font-weight:700; font-size:14.5px; line-height:1.3; color:var(--n900); white-space:nowrap; }
.ncs3-toolbar .nc-sub{ font-size:12px; color:var(--n500); white-space:nowrap; }
.ncs3-toolbar .nc-div{ width:1px; height:28px; flex:none; background:var(--n200); }
.ncs3-toolbar .nc-keys{ display:flex; align-items:center; gap:14px; }
.ncs3-toolbar .nc-key{ display:inline-flex; align-items:center; gap:7px; }
.ncs3-toolbar .nc-key kbd{ min-width:24px; height:24px; padding:0 6px; border:1px solid var(--n300); border-bottom-width:2px; border-radius:6px; background:var(--n50); color:var(--n700); font-family:var(--font-mono); font-size:12px; line-height:1; display:inline-flex; align-items:center; justify-content:center; }
/* 用後代選擇器，不用 > 子選擇器：React SSR 會把 <style> 內的 > 逸出成 &gt;，選擇器失效 */
.ncs3-toolbar .nc-key span{ font-family:var(--font-sans); font-size:12.5px; color:var(--n600); white-space:nowrap; }

.ncs3-toolbar .stack{ display:flex; flex-direction:column; gap:20px; }
.ncs3-toolbar .page{ position:relative; height:210px; border-radius:14px; overflow:hidden; border:1px solid var(--n200); }
.ncs3-toolbar .page.light{ background:#ffffff; }
.ncs3-toolbar .page.dark{ background:#0f1319; }
.ncs3-toolbar .chip{ position:absolute; top:12px; left:14px; font-size:11px; font-weight:700; letter-spacing:.08em; padding:3px 9px; border-radius:999px; }
.ncs3-toolbar .page.light .chip{ background:#eef1f6; color:#4f5b6e; }
.ncs3-toolbar .page.dark .chip{ background:rgba(255,255,255,.12); color:#e6ebf2; }
.ncs3-toolbar .sk{ position:absolute; height:10px; border-radius:6px; background:rgba(120,140,170,.18); }
.ncs3-toolbar .page.dark .sk{ background:rgba(255,255,255,.10); }
.ncs3-toolbar .caption{ font-size:12.5px; color:var(--n500); margin:10px 2px 0; font-family:var(--font-sans); }
      `}</style>
      <div className="stack">
        <div>
          <div className="page light">
            <span className="chip">宿主網頁</span>
            <Skeleton />
            <Bar />
          </div>
          <div className="caption">淺色網頁</div>
        </div>
        <div>
          <div className="page dark">
            <span className="chip">宿主網頁</span>
            <Skeleton />
            <Bar onDark />
          </div>
          <div className="caption">深色網頁 · 白描邊＋深陰影（isDarkPage 判斷）</div>
        </div>
      </div>
    </div>
  );
}
