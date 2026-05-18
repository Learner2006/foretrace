const SIGNAL_META = {
  revenue_trend:   { label: "Revenue Trend",      fmt: v => v?.replace(/_/g," ") || "—" },
  debt_posture:    { label: "Debt Posture",        fmt: v => v?.replace(/_/g," ") || "—" },
  cash_position:   { label: "Cash Position",       fmt: v => v?.replace(/_/g," ") || "—" },
  margin_pressure: { label: "Margin Pressure",     fmt: v => v === true ? "Yes" : v === false ? "No" : "—" },
  layoffs_or_restructuring: { label: "Restructuring", fmt: v => v === true ? "Yes" : v === false ? "No" : "—" },
  expansion_signals: { label: "Expansion Activity", fmt: v => Array.isArray(v) && v.length ? v.join(", ") : (v || "—") },
};

const isRed = (key, val) => {
  if (key === "revenue_trend")   return typeof val === "string" && val.toLowerCase().includes("declin");
  if (key === "debt_posture")    return typeof val === "string" && val.toLowerCase().includes("increas");
  if (key === "cash_position")   return typeof val === "string" && val.toLowerCase().includes("weak");
  if (key === "margin_pressure") return val === true;
  if (key === "layoffs_or_restructuring") return val === true;
  return false;
};

const deriveOverall = (signals) => {
  if (!signals) return "UNKNOWN";
  const redCount = Object.entries(signals).filter(([k, v]) => k !== "expansion_signals" && isRed(k, v)).length;
  if (redCount >= 3) return "STRESSED";
  if (redCount >= 1) return "WATCHFUL";
  return "STABLE";
};

const OVERALL_STYLE = {
  STRESSED: { bg:"#160808", border:"#7f1d1d", text:"#f87171" },
  WATCHFUL: { bg:"#1a1500", border:"#78350f", text:"#fbbf24" },
  STABLE:   { bg:"#0a1f12", border:"#14532d", text:"#4ade80" },
  UNKNOWN:  { bg:"#111",    border:"#222",    text:"#555"    },
};

const SIGNAL_COLOR = (key, val) => isRed(key, val)
  ? { text:"#f87171", icon:"⚠" }
  : { text:"#888",    icon:"—" };

export default function StructuralHealthCard({ signals }) {
  if (!signals) return null;
  const overall = deriveOverall(signals);
  const os = OVERALL_STYLE[overall];

  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"24px 28px", fontFamily:"'IBM Plex Mono','Courier New',monospace", color:"#e2e2e2", width:"100%", boxSizing:"border-box" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <span style={{ fontSize:10, letterSpacing:"0.12em", color:"#444", textTransform:"uppercase" }}>Structural Health</span>
        <span style={{ background:os.bg, border:`1px solid ${os.border}`, color:os.text, fontSize:10, fontWeight:700, letterSpacing:"0.1em", padding:"3px 10px", borderRadius:4, textTransform:"uppercase" }}>{overall}</span>
      </div>

      <div style={{ height:1, background:"#181818", marginBottom:16 }} />

      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        {Object.entries(SIGNAL_META).map(([key, meta], i) => {
          const val = signals[key];
          const sc = SIGNAL_COLOR(key, val);
          const isLast = i === Object.keys(SIGNAL_META).length - 1;
          return (
            <div key={key} style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", padding:"9px 0", borderBottom: isLast ? "none" : "1px solid #141414" }}>
              <span style={{ fontSize:12, color:"#555", letterSpacing:"0.03em" }}>{meta.label}</span>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:sc.text, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase" }}>{meta.fmt(val)}</span>
                <span style={{ fontSize:11, color:sc.text, width:12, textAlign:"right", flexShrink:0 }}>{key !== "expansion_signals" ? sc.icon : ""}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height:1, background:"#181818", marginTop:16, marginBottom:12 }} />

      <p style={{ fontSize:11, color:"#383838", lineHeight:1.6, margin:0 }}>
        Signals extracted from SEC filing text. STRESSED = 3+ red signals. WATCHFUL = 1–2. STABLE = none.
      </p>
    </div>
  );
}