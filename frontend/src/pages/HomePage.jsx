import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const NAV_ITEMS = [
  { label:"Analyze",   sub:"SEC 10-K behavior analysis",  path:"/" },
  { label:"Compare",   sub:"Head-to-head company diff",   path:"/compare" },
  { label:"Watchlist", sub:"Saved companies",             path:"/watchlist" },
];

const FEATURES = [
  { icon:"📄", title:"SEC Filing Analysis",  desc:"Real 10-K data — not news, not Twitter. Actual company filings." },
  { icon:"🔁", title:"Historical Analogs",   desc:"Find companies that were in the same situation — and what happened." },
  { icon:"⚖️", title:"Compare Companies",   desc:"Head-to-head diff — who leads where, what are the key differences." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight:"100vh", background:"#0f0f0f", color:"#f0f0f0", fontFamily:"Inter, sans-serif" }}>
      <div style={{ borderBottom:"1px solid #222", padding:"20px 48px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22, fontWeight:700, color:"#fff" }}>ForeTrace</span>
          <span style={{ fontSize:13, color:"#555" }}>Company Behavior Intelligence</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:"none", border:"1px solid #333", borderRadius:8, padding:"8px 12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:5 }}>
          {[0,1,2].map(i => <span key={i} style={{ display:"block", width:20, height:2, background:"#888" }} />)}
        </button>
      </div>

      {menuOpen && (<>
        <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, background:"#00000088", zIndex:10 }} />
        <div style={{ position:"fixed", top:0, right:0, height:"100vh", width:280, background:"#141414", borderLeft:"1px solid #222", zIndex:20, padding:"40px 32px", display:"flex", flexDirection:"column", gap:8 }}>
          <span style={{ fontSize:11, color:"#555", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:16 }}>Tools</span>
          {NAV_ITEMS.map(item => (
            <div key={item.label} onClick={() => { navigate(item.path); setMenuOpen(false); }} style={{ padding:16, borderRadius:10, cursor:"pointer", border:"1px solid #222", background:"#1a1a1a", transition:"border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#6366f1"} onMouseLeave={e => e.currentTarget.style.borderColor="#222"}>
              <p style={{ margin:0, fontWeight:600, color:"#fff", fontSize:15 }}>{item.label}</p>
              <p style={{ margin:"4px 0 0", color:"#555", fontSize:12 }}>{item.sub}</p>
            </div>
          ))}
          <button onClick={() => setMenuOpen(false)} style={{ marginTop:"auto", background:"none", border:"1px solid #333", borderRadius:8, padding:10, color:"#555", cursor:"pointer", fontSize:13 }}>Close ✕</button>
        </div>
      </>)}

      <div style={{ maxWidth:900, margin:"0 auto", padding:"80px 24px" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <span style={{ fontSize:11, color:"#6366f1", letterSpacing:"2px", textTransform:"uppercase", fontWeight:600 }}>SEC 10-K Intelligence</span>
          <h1 style={{ fontSize:48, fontWeight:800, margin:"16px 0", lineHeight:1.15 }}>What is this company{" "}<span style={{ color:"#6366f1" }}>really doing?</span></h1>
          <p style={{ color:"#666", fontSize:18, margin:"0 0 48px", lineHeight:1.6 }}>Search any US public company — AI analyzes their SEC filing,<br />finds historical analogs, and shows what happened next.</p>
          <SearchBar onSearch={(ticker, name) => navigate("/results", { state:{ ticker, companyName:name } })} loading={false} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginTop:80 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:"#1a1a1a", border:"1px solid #222", borderRadius:12, padding:24 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{f.icon}</div>
              <p style={{ fontWeight:700, color:"#fff", fontSize:15, margin:"0 0 8px" }}>{f.title}</p>
              <p style={{ color:"#555", fontSize:13, margin:0, lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}