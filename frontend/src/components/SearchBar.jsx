import { useState, useRef, useEffect } from "react";
import companies from "../companies.json";

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDrop, setShowDrop] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (val) => {
    setQuery(val); setSelected(null);
    if (val.length < 1) { setSuggestions([]); setShowDrop(false); return; }
    const filtered = companies.filter(c => c.name.toLowerCase().includes(val.toLowerCase()) || c.ticker.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
    setSuggestions(filtered); setShowDrop(true);
  };

  const handleSelect = (c) => { setQuery(`${c.ticker} — ${c.name}`); setSelected(c); setSuggestions([]); setShowDrop(false); };
  const handleAnalyze = () => selected && onSearch(selected.ticker, selected.name);
  const isReady = !!selected && !loading;
  const mono = "'IBM Plex Mono','Courier New',monospace";

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <div style={{ display:"flex", gap:10 }}>
        <input type="text" value={query} onChange={e => handleInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAnalyze()} onFocus={() => suggestions.length > 0 && setShowDrop(true)} placeholder="Search company or ticker — e.g. Apple, AAPL, RELIANCE.NS" disabled={loading}
          style={{ flex:1, padding:"13px 16px", background:"#0d0d0d", border:"1px solid #222", borderRadius:8, color:"#e2e2e2", fontSize:14, fontFamily:mono, outline:"none", opacity:loading?0.5:1, letterSpacing:"0.02em" }} />
        <button onClick={handleAnalyze} disabled={!isReady}
          style={{ padding:"13px 22px", background:isReady?"#e2e2e2":"#111", color:isReady?"#0a0a0a":"#333", border:`1px solid ${isReady?"#e2e2e2":"#222"}`, borderRadius:8, cursor:isReady?"pointer":"not-allowed", fontSize:13, fontWeight:700, fontFamily:mono, letterSpacing:"0.05em", transition:"all 0.15s ease", whiteSpace:"nowrap" }}>
          {loading ? "analyzing..." : "Analyze →"}
        </button>
      </div>

      {showDrop && suggestions.length > 0 && (
        <ul style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#0d0d0d", border:"1px solid #1f1f1f", borderRadius:8, margin:0, padding:"4px 0", listStyle:"none", zIndex:100, boxShadow:"0 12px 40px rgba(0,0,0,0.7)", fontFamily:mono }}>
          {suggestions.map(c => (
            <li key={c.ticker} onClick={() => handleSelect(c)} style={{ padding:"10px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}
              onMouseEnter={e => e.currentTarget.style.background="#141414"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span style={{ background:"#111", border:"1px solid #222", color:"#888", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, minWidth:52, textAlign:"center", letterSpacing:"0.05em" }}>{c.ticker}</span>
              <span style={{ color:"#bbb", fontSize:13 }}>{c.name}</span>
            </li>
          ))}
        </ul>
      )}

      {showDrop && query.length > 1 && suggestions.length === 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#0d0d0d", border:"1px solid #1f1f1f", borderRadius:8, padding:"12px 14px", color:"#444", fontSize:12, zIndex:100, fontFamily:mono, letterSpacing:"0.03em" }}>
          No company found — try ticker directly, e.g. AAPL or RELIANCE.NS
        </div>
      )}
    </div>
  );
}