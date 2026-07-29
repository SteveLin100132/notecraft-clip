// 重製 Step 1 「色彩」色票：品牌藍（結構）、金／橘（CTA／擷取焦點）、冷調中性、語意色。
// 色值直接寫死 artifact 的 design token，確保與截圖工具實際打包的一致。
type Swatch = { hex: string; name: string; fg: string };

const BLUE: Swatch[] = [
  { hex: "#eef4fb", name: "--blue-50", fg: "#161c28" },
  { hex: "#4d84cb", name: "--blue-400", fg: "#ffffff" },
  { hex: "#2c6ebb", name: "--blue-500", fg: "#ffffff" },
  { hex: "#1b4f9c", name: "--blue-700", fg: "#ffffff" },
  { hex: "#163f7d", name: "--blue-800", fg: "#ffffff" },
];
const ORANGE: Swatch[] = [
  { hex: "#fdf4e6", name: "--orange-50", fg: "#161c28" },
  { hex: "#f6cd86", name: "--orange-200", fg: "#ffffff" },
  { hex: "#f2b955", name: "--orange-300", fg: "#ffffff" },
  { hex: "#ed9b26", name: "--orange-400", fg: "#ffffff" },
  { hex: "#e37b24", name: "--orange-500", fg: "#ffffff" },
];
const NEUTRAL: Swatch[] = [
  { hex: "#ffffff", name: "--neutral-0", fg: "#161c28" },
  { hex: "#f6f8fb", name: "--neutral-50", fg: "#161c28" },
  { hex: "#eef1f6", name: "--neutral-100", fg: "#161c28" },
  { hex: "#e1e6ee", name: "--neutral-200", fg: "#161c28" },
  { hex: "#cbd3df", name: "--neutral-300", fg: "#ffffff" },
  { hex: "#9aa6b8", name: "--neutral-400", fg: "#ffffff" },
  { hex: "#6c798e", name: "--neutral-500", fg: "#ffffff" },
  { hex: "#4f5b6e", name: "--neutral-600", fg: "#ffffff" },
  { hex: "#3a4456", name: "--neutral-700", fg: "#ffffff" },
  { hex: "#161c28", name: "--neutral-900", fg: "#ffffff" },
];
const SEMANTIC: Swatch[] = [
  { hex: "#2e9e6b", name: "--success", fg: "#ffffff" },
  { hex: "#e3a008", name: "--warning", fg: "#ffffff" },
  { hex: "#d64545", name: "--danger", fg: "#ffffff" },
];

function Grid({ items }: { items: Swatch[] }) {
  return (
    <div className="grid">
      {items.map((s) => (
        <div className="sw" key={s.name} style={{ background: s.hex, color: s.fg }}>
          <b>{s.hex}</b>
          <span>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Step1Color() {
  return (
    <div className="ncs1-color not-prose">
      <style>{`
.ncs1-color{font-family:var(--font-sans);}
.ncs1-color .h{font-size:12px;font-weight:700;margin:16px 0 8px;}
.ncs1-color .h:first-child{margin-top:0;}
.ncs1-color .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
.ncs1-color .sw{border-radius:10px;padding:14px 12px;min-height:66px;display:flex;flex-direction:column;
  justify-content:flex-end;border:1px solid rgba(0,0,0,.06);}
.ncs1-color .sw b{font-family:var(--font-mono);font-size:12px;}
.ncs1-color .sw span{font-family:var(--font-mono);font-size:10.5px;opacity:.85;}
      `}</style>
      <div className="h" style={{ color: "#1b4f9c" }}>品牌藍</div>
      <Grid items={BLUE} />
      <div className="h" style={{ color: "#e37b24" }}>金 / 橘</div>
      <Grid items={ORANGE} />
      <div className="h" style={{ color: "#3a4456" }}>中性</div>
      <Grid items={NEUTRAL} />
      <div className="h" style={{ color: "#3a4456" }}>語意</div>
      <Grid items={SEMANTIC} />
    </div>
  );
}
