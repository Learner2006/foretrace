import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => { setWatchlist(JSON.parse(localStorage.getItem("foretrace_watchlist") || "[]")); }, []);

  const remove = (ticker) => {
    const updated = watchlist.filter(c => c.ticker !== ticker);
    setWatchlist(updated);
    localStorage.setItem("foretrace_watchlist", JSON.stringify(updated));
  };

  const goAnalyze = (c) => navigate("/results", { state:{ ticker:c.ticker, companyName:c.name } });

  return (
    <div style={{ minHeight:"100vh", background:"#0f0f0f", color:"#f0f0f0", fontFamily:"Inter, sans-serif" }}>
      <div onClick={() => navigate("/")} style={{ borderBottom:"1px solid #222", padding:"20px 48px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
        <span style={{ fontSize:22, fontWeight:700, color:"#fff" }}>ForeTrace</span>
        <span style={{ fontSize:13, color:"#555" }}>Company Behavior Intelligence</span>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"60px 24px" }}>
        <h2 style={{ fontSize:28, fontWeight:800, color:"#fff", margin:"0 0 8px" }}>Watchlist</h2>
        <p style={{ color:"#555", fontSize:14, margin:"0 0 40px" }}>Saved companies — click karo analyze karne ke liye</p>

        {watchlist.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 24px", border:"1px dashed #222", borderRadius:12 }}>
            <p style={{ fontSize:32, marginBottom:16 }}>📋</p>
            <p style={{ color:"#555", fontSize:15, margin:"0 0 24px" }}>Abhi koi company saved nahi hai</p>
            <button onClick={() => navigate("/")} style={{ padding:"10px 24px", background:"#6366f1", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:14, fontWeight:600 }}>Company Search karo →</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {watchlist.map(c => (
              <div key={c.ticker} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div onClick={() => goAnalyze(c)} style={{ cursor:"pointer", flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
                    <span style={{ background:"#1e1e3a", color:"#6366f1", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{c.ticker}</span>
                    <span style={{ fontSize:16, fontWeight:600, color:"#fff" }}>{c.name}</span>
                  </div>
                  <p style={{ fontSize:12, color:"#444", margin:0 }}>Saved on {c.savedAt}</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => goAnalyze(c)} style={{ padding:"8px 16px", background:"#6366f1", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600 }}>Analyze →</button>
                  <button onClick={() => remove(c.ticker)} style={{ padding:"8px 12px", background:"transparent", color:"#555", border:"1px solid #333", borderRadius:8, cursor:"pointer", fontSize:13 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}