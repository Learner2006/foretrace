import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AnalogCard from "../components/AnalogCard";
import ComparisonChart from "../components/ComparisonChart";
import CompanyProfile from "../components/CompanyProfile";

export default function CompanyPage() {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) { navigate("/"); return; }
    fetch("http://localhost:8000/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ticker, company_name:ticker }) })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Analysis load nahi ho saka."); setLoading(false); });
  }, [ticker]);

  if (loading) return <div style={{ padding:"2rem" }}>⏳ Loading {ticker}...</div>;
  if (error)   return <div style={{ padding:"2rem" }}>❌ {error}</div>;
  if (!data)   return null;

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom:"1rem" }}>← Back</button>
      <h1>{data.company_name ?? ticker}</h1>
      <CompanyProfile data={data} />
      <h2>Historical Analogs</h2>
      {data.analogs?.map((a, i) => <AnalogCard key={i} analog={a} />)}
      <h2>Comparison</h2>
      <ComparisonChart data={data.comparison_chart ?? []} />
    </div>
  );
}