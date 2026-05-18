import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";

const color = (v) => v > 0 ? { fill:"#166534", stroke:"#4ade80" } : v < 0 ? { fill:"#7f1d1d", stroke:"#f87171" } : { fill:"#1f1f1f", stroke:"#444" };

export default function ComparisonChart({ data }) {
  if (!data?.length) return null;
  return (
    <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a", borderRadius:12, padding:"28px 28px 20px", fontFamily:"'IBM Plex Mono','Courier New',monospace" }}>
      <span style={{ display:"block", fontSize:10, letterSpacing:"0.12em", color:"#444", textTransform:"uppercase", marginBottom:20 }}>OUTCOME COMPARISON</span>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top:8, right:16, left:0, bottom:8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#161616" vertical={false} />
          <XAxis dataKey="name" tick={{ fill:"#555", fontSize:11, fontFamily:"inherit" }} axisLine={{ stroke:"#222" }} tickLine={false} />
          <YAxis tick={{ fill:"#555", fontSize:11, fontFamily:"inherit" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ background:"#0d0d0d", border:"1px solid #222", borderRadius:6, fontFamily:"inherit", fontSize:12 }} labelStyle={{ color:"#aaa", marginBottom:4 }} itemStyle={{ color:"#e2e2e2" }} formatter={(v) => [`${v}%`, "outcome change"]} cursor={{ fill:"#ffffff08" }} />
          <ReferenceLine y={0} stroke="#2a2a2a" />
          <Bar dataKey="metric" radius={[3,3,0,0]} maxBarSize={64}>
            {data.map((e, i) => <Cell key={i} {...color(e.metric)} strokeWidth={1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop:16, display:"flex", gap:20, justifyContent:"center" }}>
        {[["#555","Current"],["#4ade80","Success path"],["#f87171","Failure path"]].map(([c,l]) => (
          <span key={l} style={{ fontSize:11, color:"#444" }}><span style={{ color:c }}>■</span> {l}</span>
        ))}
      </div>
    </div>
  );
}