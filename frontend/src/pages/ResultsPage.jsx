import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import CompanyProfile from "../components/CompanyProfile";
import AnalogCard from "../components/AnalogCard";
import StructuralHealthCard from "../components/StructuralHealthCard";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const STEPS = ["Reading SEC filing...","Identifying behavioral patterns...","Finding historical analogs...","Building analysis..."];

const ERROR_MAP = [
  [["SEC EDGAR pe nahi mili","not found"], "Company SEC EDGAR pe nahi mili", "Ticker directly try karo — e.g. AAPL instead of Apple Inc."],
  [["10-K filing nahi mili"], "10-K filing nahi mili", "Yeh company publicly listed nahi hai ya filing available nahi hai."],
  [["Indian company"], "Indian company data nahi mila", ".NS ya .BO suffix ke saath ticker try karo — e.g. RELIANCE.NS"],
  [["timeout","network"], "SEC servers slow hain", "30 seconds mein retry karo."],
];

const getError = (msg) => {
  if (!msg) return ["Kuch galat hua", "Dobara try karo."];
  const match = ERROR_MAP.find(([keys]) => keys.some(k => msg.includes(k)));
  return match ? [match[1], match[2]] : ["Analysis complete nahi ho saka", "Ticker format check karo ya thodi der baad try karo."];
};

const S = {
  page: { minHeight:"100vh", background:"#0a0a0a", color:"#e2e2e2", fontFamily:"'IBM Plex Mono','Courier New',monospace" },
  lbl: { display:"block", fontSize:10, letterSpacing:"0.12em", color:"#444", textTransform:"uppercase" },
  btn: { padding:"7px 14px", background:"transparent", border:"1px solid #222", borderRadius:6, color:"#666", fontSize:12, cursor:"pointer", fontFamily:"inherit" },
};

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!state?.ticker) { navigate("/"); return; }
    fetchAnalysis(state.ticker, state.companyName);
    return () => clearInterval(timer.current);
  }, [state]);

  const fetchAnalysis = async (ticker, companyName) => {
    setLoading(true); setError(null); setResult(null); setStep(0);
    let s = 0;
    timer.current = setInterval(() => { s += 1; if (s < STEPS.length) setStep(s); else clearInterval(timer.current); }, 3500);
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ company_name:companyName, ticker }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "server_error"); }
      setResult(await res.json());
    } catch (err) { setError(err.message); }
    finally { clearInterval(timer.current); setLoading(false); }
  };

  const saveToWatchlist = () => {
    const saved = JSON.parse(localStorage.getItem("foretrace_watchlist") || "[]");
    if (saved.find(c => c.ticker === state.ticker)) return;
    saved.push({ ticker:state.ticker, name:state.companyName, savedAt:new Date().toLocaleDateString("en-IN") });
    localStorage.setItem("foretrace_watchlist", JSON.stringify(saved));
    alert(`${state.companyName} watchlist mein add ho gaya!`);
  };

  const [errTitle, errHint] = getError(error);

  return (
    <div style={S.page}>
      <div style={{ borderBottom:"1px solid #1a1a1a", padding: isMobile ? "20px 16px" : "20px 48px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={() => navigate("/")}>
        <span style={{ fontSize:20, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>ForeTrace</span>
        <span style={{ fontSize:12, color:"#444", marginTop:2, letterSpacing:"0.05em" }}>Company Behavior Intelligence</span>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding: isMobile ? "32px 16px" : "52px 24px" }}>
        <SearchBar onSearch={(ticker, name) => navigate("/results", { state:{ ticker, companyName:name } })} loading={loading} />

        {error && (
          <div style={{ marginTop:32, padding:"20px 24px", background:"#110000", border:"1px solid #3a0000", borderRadius:8 }}>
            <div style={{ color:"#f87171", fontSize:14, fontWeight:600, marginBottom:6 }}>{errTitle}</div>
            <div style={{ color:"#888", fontSize:13 }}>{errHint}</div>
          </div>
        )}

        {loading && (
          <div style={{ marginTop:72, display:"flex", justifyContent:"center" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, fontSize:13, transition:"all 0.4s ease", color: i < step ? "#4ade80" : i === step ? "#e2e2e2" : "#333" }}>
                  <span style={{ fontSize:12, width:16, textAlign:"center" }}>{i < step ? "✓" : i === step ? "●" : "○"}</span>{s}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop:48, display:"flex", flexDirection:"column", gap:40 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <h1 style={{ fontSize:22, fontWeight:700, color:"#fff", margin:0, letterSpacing:"-0.02em" }}>{result.company}</h1>
              <button onClick={saveToWatchlist} style={{ ...S.btn, flexShrink:0 }}>+ Watchlist</button>
            </div>

            {(() => {
              const bs = result.behavioral_summary || {};
              const conf = bs.confidence || "Moderate";
              const confColors = {
                High:     { bg:"#0a1f12", border:"#14532d", label:"#4ade80", text:"#4ade80" },
                Moderate: { bg:"#1a1500", border:"#78350f", label:"#fbbf24", text:"#fbbf24" },
                Low:      { bg:"#160808", border:"#7f1d1d", label:"#f87171", text:"#f87171" },
              };
              const cc = confColors[conf] || confColors.Moderate;
              return (
                <div style={{ background:cc.bg, border:`1px solid ${cc.border}`, borderRadius:8, padding:"14px 20px", display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:9, letterSpacing:"0.12em", color:"#444", textTransform:"uppercase" }}>Analysis Confidence</span>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:cc.label, textTransform:"uppercase" }}>{conf}</span>
                  </div>
                  {bs.confidence_reason && (
                    <p style={{ fontSize:12, color:"#666", lineHeight:1.6, margin:0 }}>{bs.confidence_reason}</p>
                  )}
                </div>
              );
            })()}

            <CompanyProfile data={result} />

            {result.structural_signals && (
              <StructuralHealthCard signals={result.structural_signals} />
            )}

            {result.analogs?.length > 0 && (
              <section style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <span style={S.lbl}>HISTORICAL ANALOGS</span>
                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
                  {result.analogs.map((a, i) => <AnalogCard key={i} analog={a} />)}
                </div>
              </section>
            )}

            {result.mitigation_levers?.length > 0 && (
              <section style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <span style={S.lbl}>WHAT THIS COMPANY CAN DO</span>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {result.mitigation_levers.map((lever, i) => (
                    <div key={i} style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:10, padding:"20px 24px" }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:10 }}>
                        <span style={{ fontSize:11, color:"#333", letterSpacing:"0.05em", flexShrink:0 }}>0{i+1}</span>
                        <span style={{ fontSize:14, color:"#e2e2e2", fontWeight:600, letterSpacing:"0.02em" }}>{lever.lever}</span>
                      </div>
                      <p style={{ fontSize:13, color:"#999", lineHeight:1.7, margin:"0 0 14px" }}>{lever.rationale}</p>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {lever.analog_basis && (
                          <div style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:5, padding:"8px 12px" }}>
                            <span style={{ display:"block", fontSize:9, letterSpacing:"0.12em", color:"#444", textTransform:"uppercase", marginBottom:4 }}>Based on</span>
                            <span style={{ fontSize:11, color:"#666", lineHeight:1.6 }}>{lever.analog_basis}</span>
                          </div>
                        )}
                        {lever.risk_if_ignored && (
                          <span style={{ fontSize:11, color:"#92400e", letterSpacing:"0.03em" }}>⚠ {lever.risk_if_ignored}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}