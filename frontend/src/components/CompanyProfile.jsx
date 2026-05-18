import { useEffect, useState } from "react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const CONF = {
  High:     { bg:"#0a1f12", text:"#4ade80", border:"#14532d" },
  Moderate: { bg:"#1a1500", text:"#fbbf24", border:"#78350f" },
  Low:      { bg:"#160808", text:"#f87171", border:"#7f1d1d" },
};

const S = {
  wrap: { background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"28px 32px", fontFamily:"'IBM Plex Mono','Courier New',monospace", color:"#e2e2e2", width:"100%", boxSizing:"border-box" },
  div: { height:1, background:"#181818", margin:"20px 0" },
  lbl: { display:"block", fontSize:10, letterSpacing:"0.12em", color:"#444", marginBottom:10, textTransform:"uppercase" },
  body: { fontSize:14, lineHeight:1.8, color:"#bbb", margin:0 },
};

export default function CompanyProfile({ data }) {
  const isMobile = useIsMobile();
  if (!data) return null;
  const bs = data.behavioral_summary || {};
  const rc = data.relationship_context || {};
  const risks = data.risk_signals || [];
  const conf = bs.confidence || "Moderate";
  const cs = CONF[conf] || CONF.Moderate;

  return (
    <div style={{ ...S.wrap, padding: isMobile ? "20px 16px" : "28px 32px" }}>
      <span style={S.lbl}>WHAT IS HAPPENING</span>
      <p style={S.body}>{bs.what_is_happening || "—"}</p>

      <div style={S.div} />
      <span style={S.lbl}>WHY IT MATTERS</span>
      <p style={S.body}>{bs.why_it_matters || "—"}</p>

      {bs.key_forces?.length > 0 && (<>
        <div style={S.div} />
        <span style={S.lbl}>KEY FORCES</span>
        <div style={{ display:"flex", flexWrap:"wrap", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 8 }}>
          {bs.key_forces.map((f, i) => <span key={i} style={{ background:"#111", border:"1px solid #222", color:"#888", fontSize:11, padding:"4px 10px", borderRadius:4, letterSpacing:"0.03em" }}>{f}</span>)}
        </div>
      </>)}

      <div style={S.div} />
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
        <span style={S.lbl}>CONFIDENCE</span>
        <span style={{ background:cs.bg, color:cs.text, border:`1px solid ${cs.border}`, fontSize:10, fontWeight:700, letterSpacing:"0.1em", padding:"3px 10px", borderRadius:4, textTransform:"uppercase" }}>{conf}</span>
      </div>
      {bs.confidence_reason && <p style={{ fontSize:12, color:"#666", lineHeight:1.6, margin:"6px 0 0" }}>{bs.confidence_reason}</p>}

      {risks.length > 0 && (<>
        <div style={S.div} />
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", flexWrap:"wrap", gap:6, marginBottom:10 }}>
          <span style={{ ...S.lbl, marginBottom:0 }}>RISK SIGNALS</span>
          <span style={{ fontSize:10, color:"#383838", letterSpacing:"0.03em" }}>SEC 10-K · Item 1A (Risk Factors)</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {risks.map((r, i) => {
            const signal = typeof r === "string" ? r : r.signal;
            const reason = typeof r === "string" ? null : r.why_it_matters;
            return (
              <div key={i} style={{ paddingLeft:14, borderLeft:"2px solid #2a0f0f" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ width:5, height:5, borderRadius:"50%", background:"#ef4444", flexShrink:0, display:"inline-block" }} />
                  <span style={{ fontSize:12, color:"#f87171", fontWeight:600, letterSpacing:"0.03em" }}>{signal}</span>
                </div>
                {reason && <p style={{ fontSize:12, color:"#666", margin:0, lineHeight:1.65 }}>{reason}</p>}
              </div>
            );
          })}
        </div>
      </>)}

      {(rc.insight || rc.linked_to?.length > 0) && (<>
        <div style={S.div} />
        <span style={S.lbl}>RELATIONSHIP CONTEXT</span>
        {rc.insight && <p style={S.body}>{rc.insight}</p>}
        {rc.linked_to?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:10 }}>
            {rc.linked_to.map((co, i) => <span key={i} style={{ background:"#07101e", border:"1px solid #1a3050", color:"#60a5fa", fontSize:11, padding:"4px 10px", borderRadius:4 }}>{co}</span>)}
          </div>
        )}
      </>)}
    </div>
  );
}