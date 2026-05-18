import { useNavigate } from "react-router-dom";
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

const T = {
  success: { accent:"#4ade80", scoreBg:"#0a1f12", scoreBorder:"#166534", badge:"#0d2818", badgeText:"#86efac", badgeBorder:"#14532d", borderLeft:"#166534", label:"SUCCESS PATH" },
  failure: { accent:"#f87171", scoreBg:"#160808", scoreBorder:"#7f1d1d", badge:"#1c0a0a", badgeText:"#fca5a5", badgeBorder:"#7f1d1d", borderLeft:"#7f1d1d", label:"FAILURE PATH" },
};

export default function AnalogCard({ analog }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  if (!analog) return null;
  const ts = T[analog.type === "success" ? "success" : "failure"];
  const hasLink = !!analog.analog_ticker;

  return (
    <div onClick={() => hasLink && navigate(`/company/${analog.analog_ticker}`)}
      style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderLeft:`3px solid ${ts.borderLeft}`, borderRadius:"10px", padding:"20px 20px 16px", fontFamily:"'IBM Plex Mono','Courier New',monospace", display:"flex", flexDirection:"column", cursor:hasLink?"pointer":"default", width: isMobile ? "100%" : undefined, boxSizing:"border-box" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <span style={{ background:ts.badge, color:ts.badgeText, border:`1px solid ${ts.badgeBorder}`, fontSize:9, fontWeight:700, letterSpacing:"0.12em", padding:"3px 8px", borderRadius:3, textTransform:"uppercase" }}>{ts.label}</span>
        <span style={{ background:ts.scoreBg, border:`1px solid ${ts.scoreBorder}`, color:ts.accent, fontSize:13, fontWeight:700, letterSpacing:"0.04em", padding:"4px 10px", borderRadius:5 }}>{analog.similarity_score ?? "—"}% match</span>
      </div>

      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:14 }}>
        <span style={{ color:ts.accent, fontSize:18, fontWeight:700, letterSpacing:"-0.01em" }}>{analog.company}</span>
        {analog.year && <span style={{ fontSize:12, color:"#444", letterSpacing:"0.04em" }}>{analog.year}</span>}
      </div>

      <div style={{ height:1, background:"#161616", margin:"0 0 14px" }} />

      {[
        ["WHY THEY RESEMBLE", analog.what_they_resembled, null],
        ["WHAT THEY DID",     analog.action_taken,         null],
        ["OUTCOME",           analog.outcome,              ts.accent],
        ["KEY DIFFERENCE",    analog.key_difference,       null],
      ].map(([label, text, color]) => text && (
        <div key={label} style={{ marginBottom:12 }}>
          <span style={{ display:"block", fontSize:9, letterSpacing:"0.12em", color:"#444", marginBottom:4, textTransform:"uppercase" }}>{label}</span>
          <p style={{ fontSize:12, color:color||"#999", lineHeight:1.7, margin:0 }}>{text}</p>
        </div>
      ))}

      <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #161616" }}>
        {analog.citation && <span style={{ fontSize:10, color:"#383838", letterSpacing:"0.03em", fontStyle:"italic" }}>{analog.citation}</span>}
        <div style={{ display:"flex", gap:12, alignItems:"center", marginLeft:"auto" }}>
          <span
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            style={{ fontSize:10, color:"#555", letterSpacing:"0.05em", cursor:"pointer", userSelect:"none" }}
          >{expanded ? "Hide ↑" : "Why this analog? ↓"}</span>
          {hasLink
            ? <span style={{ fontSize:10, color:ts.accent, letterSpacing:"0.05em" }}>View company →</span>
            : <span style={{ fontSize:10, color:"#333", letterSpacing:"0.05em" }}>Ticker unavailable</span>
          }
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:12, background:"#0a0a0a", border:"1px solid #1e1e1e", borderRadius:6, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
          <span style={{ fontSize:9, letterSpacing:"0.12em", color:"#444", textTransform:"uppercase" }}>Why this analog?</span>
          {analog.what_they_resembled && (
            <div>
              <span style={{ display:"block", fontSize:9, color:"#383838", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>Pattern matched</span>
              <p style={{ fontSize:12, color:"#777", lineHeight:1.65, margin:0 }}>{analog.what_they_resembled}</p>
            </div>
          )}
          {analog.key_difference && (
            <div>
              <span style={{ display:"block", fontSize:9, color:"#383838", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>What makes it imperfect</span>
              <p style={{ fontSize:12, color:"#666", lineHeight:1.65, margin:0 }}>{analog.key_difference}</p>
            </div>
          )}
          {analog.citation && (
            <div>
              <span style={{ display:"block", fontSize:9, color:"#383838", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>Source</span>
              <p style={{ fontSize:11, color:"#555", fontStyle:"italic", lineHeight:1.5, margin:0 }}>{analog.citation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}