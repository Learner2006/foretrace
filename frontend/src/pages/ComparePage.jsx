import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const S = {
  bg:         "#0a0a0a",
  surface:    "#0d0d0d",
  border:     "#1a1a1a",
  border2:    "#222",
  text:       "#e2e2e2",
  dim:        "#888",
  muted:      "#555",
  label:      "#444",
  font:       "'IBM Plex Mono', 'Courier New', monospace",
  blue:       "#60a5fa",
  success:    "#4ade80",
  successBg:  "#0a1f12",
  successBdr: "#14532d",
  fail:       "#f87171",
  failBg:     "#160808",
  failBdr:    "#7f1d1d",
  warn:       "#fbbf24",
  warnBg:     "#1a1500",
  warnBdr:    "#78350f",
};

const LABEL = {
  fontSize: 9,
  letterSpacing: "0.12em",
  color: S.label,
  textTransform: "uppercase",
  fontFamily: S.font,
};

const CARD = (extra = {}) => ({
  background: S.surface,
  border: `1px solid ${S.border}`,
  borderRadius: 8,
  padding: "18px 20px",
  fontFamily: S.font,
  ...extra,
});

// ─── Structural signal dimensions ────────────────────────────────────────────
const DIMS = [
  { key: "revenue_trend",            label: "Revenue Trend",       good: ["growing", "stable"],    bad: ["declining", "sharply_declining"] },
  { key: "debt_posture",             label: "Debt Posture",        good: ["low", "decreasing"],    bad: ["increasing", "high"] },
  { key: "cash_position",            label: "Cash Position",       good: ["strong", "healthy"],    bad: ["weak", "critical"] },
  { key: "margin_pressure",          label: "Margin Pressure",     good: [false],                  bad: [true] },
  { key: "layoffs_or_restructuring", label: "Restructuring Risk",  good: [false],                  bad: [true] },
  { key: "capex_trend",              label: "CapEx Trend",         good: ["increasing"],           bad: ["declining"] },
];

const scoreSignal = (signals, dim) => {
  if (!signals) return null;
  const v = signals[dim.key];
  if (v === undefined || v === null) return null;
  if (dim.good.some(g => g === v)) return "good";
  if (dim.bad.some(b => b === v))  return "bad";
  return "neutral";
};

const fmtVal = v => {
  if (v === true)  return "Yes";
  if (v === false) return "No";
  if (!v || v === null) return "—";
  return String(v).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const structuralScore = signals => {
  if (!signals) return null;
  let good = 0, bad = 0;
  DIMS.forEach(dim => {
    const s = scoreSignal(signals, dim);
    if (s === "good") good++;
    if (s === "bad")  bad++;
  });
  return { good, bad, net: good - bad };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Pill = ({ score }) => {
  if (!score) return null;
  const map = {
    good:    { color: S.success, bg: S.successBg, char: "▲" },
    bad:     { color: S.fail,    bg: S.failBg,    char: "▼" },
    neutral: { color: S.warn,    bg: S.warnBg,    char: "—" },
  };
  const m = map[score];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700,
      color: m.color, background: m.bg,
      borderRadius: 3, padding: "2px 6px",
      fontFamily: S.font,
    }}>{m.char}</span>
  );
};

const DimRow = ({ dim, sigA, sigB }) => {
  const sA = scoreSignal(sigA, dim);
  const sB = scoreSignal(sigB, dim);
  const aWins = sA === "good" && sB !== "good";
  const bWins = sB === "good" && sA !== "good";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 130px 1fr",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: `1px solid ${S.border}`,
      gap: 8,
    }}>
      {/* A side — right aligned */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
        {sigA && <Pill score={sA} />}
        <span style={{
          fontSize: 11, fontFamily: S.font,
          color: aWins ? S.blue : sA === "bad" ? S.fail : S.muted,
          fontWeight: aWins ? 700 : 400,
        }}>
          {sigA ? fmtVal(sigA[dim.key]) : "—"}
        </span>
      </div>

      {/* Dimension label center */}
      <div style={{ textAlign: "center" }}>
        <span style={LABEL}>{dim.label}</span>
      </div>

      {/* B side — left aligned */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontSize: 11, fontFamily: S.font,
          color: bWins ? S.success : sB === "bad" ? S.fail : S.muted,
          fontWeight: bWins ? 700 : 400,
        }}>
          {sigB ? fmtVal(sigB[dim.key]) : "—"}
        </span>
        {sigB && <Pill score={sB} />}
      </div>
    </div>
  );
};

const Verdict = ({ dataA, dataB, nameA, nameB }) => {
  const sA = structuralScore(dataA?.structural_signals);
  const sB = structuralScore(dataB?.structural_signals);
  if (!sA || !sB) return null;

  const tied  = sA.net === sB.net;
  const aWins = sA.net > sB.net;
  const diff  = Math.abs(sA.net - sB.net);
  const wColor = aWins ? S.blue : S.success;
  const wBg    = aWins ? "#061221" : S.successBg;
  const wBdr   = aWins ? "#1e3a5f" : S.successBdr;

  return (
    <div style={{
      ...CARD(),
      background: tied ? S.warnBg : wBg,
      border: `1px solid ${tied ? S.warnBdr : wBdr}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={LABEL}>Structural Verdict</span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: tied ? S.warn : wColor,
        }}>
          {tied ? "Structurally tied" : `${aWins ? nameA : nameB} is stronger`}
        </span>
        {!tied && (
          <span style={{ fontSize: 10, color: S.muted }}>
            +{diff} signal{diff !== 1 ? "s" : ""} ahead
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { name: nameA, score: sA, color: S.blue },
          { name: nameB, score: sB, color: S.success },
        ].map(({ name, score, color }) => (
          <div key={name}>
            <span style={{ fontSize: 9, color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{name}</span>
            <div style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>
              <span style={{ color: S.success }}>▲ {score.good} stable</span>
              <span style={{ color: S.muted }}> · </span>
              <span style={{ color: S.fail }}>▼ {score.bad} stressed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalogOverlap = ({ dataA, dataB, nameA, nameB }) => {
  const aa = dataA?.behavioral_analogs || [];
  const ab = dataB?.behavioral_analogs || [];
  if (!aa.length && !ab.length) return null;

  const namesA = new Set(aa.map(a => a.company_name));
  const namesB = new Set(ab.map(a => a.company_name));
  const shared = aa.filter(a => namesB.has(a.company_name));
  const onlyA  = aa.filter(a => !namesB.has(a.company_name));
  const onlyB  = ab.filter(a => !namesA.has(a.company_name));

  return (
    <div style={CARD({ display: "flex", flexDirection: "column", gap: 14 })}>
      <span style={LABEL}>Historical Analog Overlap</span>

      {shared.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: S.warn, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            ◈ Both companies share these analogs
          </div>
          {shared.map((a, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap",
              padding: "7px 0",
              borderBottom: i < shared.length - 1 ? `1px solid ${S.border}` : "none",
            }}>
              <span style={{ fontSize: 12, color: S.warn, fontWeight: 700 }}>{a.company_name}</span>
              {a.time_period && <span style={{ fontSize: 10, color: S.muted }}>{a.time_period}</span>}
              {a.outcome_summary && <span style={{ fontSize: 10, color: S.muted }}>— {a.outcome_summary}</span>}
            </div>
          ))}
        </div>
      )}

      {(onlyA.length > 0 || onlyB.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { list: onlyA, name: nameA, color: S.blue },
            { list: onlyB, name: nameB, color: S.success },
          ].map(({ list, name, color }) => list.length > 0 && (
            <div key={name}>
              <div style={{ fontSize: 9, color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                {name} only
              </div>
              {list.map((a, i) => (
                <div key={i} style={{
                  padding: "5px 0",
                  borderBottom: i < list.length - 1 ? `1px solid ${S.border}` : "none",
                }}>
                  <span style={{ fontSize: 11, color: S.dim }}>{a.company_name}</span>
                  {a.time_period && <span style={{ fontSize: 10, color: S.muted, marginLeft: 8 }}>{a.time_period}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {shared.length === 0 && onlyA.length === 0 && onlyB.length === 0 && (
        <span style={{ fontSize: 11, color: S.muted }}>No analog data available.</span>
      )}
    </div>
  );
};

const RiskDiff = ({ dataA, dataB, nameA, nameB }) => {
  const rA = dataA?.risk_signals || [];
  const rB = dataB?.risk_signals || [];
  if (!rA.length && !rB.length) return null;

  const labelOf = r => (typeof r === "string" ? r : r?.signal || "");
  const setA = new Set(rA.map(labelOf));
  const setB = new Set(rB.map(labelOf));
  const onlyA = rA.filter(r => !setB.has(labelOf(r)));
  const onlyB = rB.filter(r => !setA.has(labelOf(r)));
  const both  = rA.filter(r =>  setB.has(labelOf(r)));

  return (
    <div style={CARD({ display: "flex", flexDirection: "column", gap: 14 })}>
      <span style={LABEL}>Risk Signal Divergence</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { list: onlyA, name: nameA, color: S.blue },
          { list: onlyB, name: nameB, color: S.success },
        ].map(({ list, name, color }) => (
          <div key={name}>
            <div style={{ fontSize: 9, color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Unique to {name}
            </div>
            {list.length === 0
              ? <span style={{ fontSize: 11, color: S.muted }}>No unique risks vs peer</span>
              : list.map((r, i) => (
                  <div key={i} style={{
                    fontSize: 11, color: S.fail,
                    padding: "5px 0",
                    borderBottom: i < list.length - 1 ? `1px solid ${S.border}` : "none",
                  }}>▸ {labelOf(r)}</div>
                ))
            }
          </div>
        ))}
      </div>
      {both.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: S.warn, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Shared risks
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {both.map((r, i) => (
              <span key={i} style={{
                fontSize: 10, color: S.warn,
                background: S.warnBg, border: `1px solid ${S.warnBdr}`,
                borderRadius: 4, padding: "3px 8px",
              }}>{labelOf(r)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryDiff = ({ dataA, dataB, nameA, nameB, isMobile }) => {
  const sA = dataA?.behavioral_summary?.summary;
  const sB = dataB?.behavioral_summary?.summary;
  if (!sA && !sB) return null;

  return (
    <div style={CARD({ display: "flex", flexDirection: "column", gap: 14 })}>
      <span style={LABEL}>Behavioral Summary</span>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {[
          { summary: sA, name: nameA, color: S.blue },
          { summary: sB, name: nameB, color: S.success },
        ].map(({ summary, name, color }) => (
          <div key={name}>
            <div style={{ fontSize: 9, color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{name}</div>
            <p style={{ fontSize: 12, color: S.dim, lineHeight: 1.7, margin: 0 }}>
              {summary || <span style={{ color: S.muted }}>—</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const nav = useNavigate();
  const isMobile = useIsMobile();

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState(null);
  const [errorB, setErrorB] = useState(null);

  const fetchData = async (ticker, name, side) => {
    const setData    = side === "left" ? setDataA    : setDataB;
    const setLoading = side === "left" ? setLoadingA : setLoadingB;
    const setError   = side === "left" ? setErrorA   : setErrorB;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: name, ticker }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const nameA = dataA?.company || "Company A";
  const nameB = dataB?.company || "Company B";
  const sigA  = dataA?.structural_signals;
  const sigB  = dataB?.structural_signals;
  const bothReady = dataA && dataB;

  return (
    <div style={{ background: S.bg, color: S.text, fontFamily: S.font, minHeight: "100vh" }}>

      {/* Nav */}
      <div
        onClick={() => nav("/")}
        style={{
          padding: isMobile ? "16px" : "20px 48px",
          borderBottom: `1px solid ${S.border2}`,
          cursor: "pointer",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: S.muted,
        }}
      >
        ForeTrace / Compare
      </div>

      <div style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: isMobile ? "24px 16px" : "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>

        {/* Search inputs */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...LABEL, color: S.blue }}>Company A</span>
            <SearchBar onSearch={(t, n) => fetchData(t, n, "left")} />
            {loadingA && <span style={{ fontSize: 10, color: S.muted }}>Analyzing…</span>}
            {errorA   && <span style={{ fontSize: 10, color: S.fail }}>{errorA}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...LABEL, color: S.success }}>Company B</span>
            <SearchBar onSearch={(t, n) => fetchData(t, n, "right")} />
            {loadingB && <span style={{ fontSize: 10, color: S.muted }}>Analyzing…</span>}
            {errorB   && <span style={{ fontSize: 10, color: S.fail }}>{errorB}</span>}
          </div>
        </div>

        {/* Company name headers */}
        {(dataA || dataB) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 40px 1fr",
            alignItems: "center",
            gap: 8,
          }}>
            <div>
              <div style={{ fontSize: 9, color: S.blue, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Company A</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: dataA ? S.blue : S.muted }}>
                {dataA ? nameA : <span style={{ color: S.muted, fontSize: 13 }}>Not yet analyzed</span>}
              </div>
              {dataA?.behavioral_summary?.behavioral_pattern_identified && (
                <div style={{ fontSize: 10, color: S.muted, marginTop: 4 }}>
                  {dataA.behavioral_summary.behavioral_pattern_identified}
                </div>
              )}
            </div>
            {!isMobile && (
              <div style={{ textAlign: "center", fontSize: 14, color: S.border2 }}>vs</div>
            )}
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: 9, color: S.success, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Company B</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: dataB ? S.success : S.muted }}>
                {dataB ? nameB : <span style={{ color: S.muted, fontSize: 13 }}>Not yet analyzed</span>}
              </div>
              {dataB?.behavioral_summary?.behavioral_pattern_identified && (
                <div style={{ fontSize: 10, color: S.muted, marginTop: 4, textAlign: isMobile ? "left" : "right" }}>
                  {dataB.behavioral_summary.behavioral_pattern_identified}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Head-to-head signal grid ── */}
        {(sigA || sigB) && (
          <div style={CARD({ display: "flex", flexDirection: "column" })}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px 1fr",
              paddingBottom: 10,
              borderBottom: `1px solid ${S.border2}`,
              marginBottom: 2,
            }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ ...LABEL, color: S.blue }}>{nameA}</span>
              </div>
              <div />
              <div>
                <span style={{ ...LABEL, color: S.success }}>{nameB}</span>
              </div>
            </div>
            {DIMS.map(dim => (
              <DimRow key={dim.key} dim={dim} sigA={sigA} sigB={sigB} />
            ))}
          </div>
        )}

        {/* Verdict */}
        {bothReady && <Verdict dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />}

        {/* Analog overlap */}
        {bothReady && <AnalogOverlap dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />}

        {/* Risk divergence */}
        {bothReady && <RiskDiff dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} />}

        {/* Behavioral summaries side by side */}
        {bothReady && <SummaryDiff dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} isMobile={isMobile} />}

        {/* Deep dive links */}
        {bothReady && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            {[
              { name: nameA, color: S.blue },
              { name: nameB, color: S.success },
            ].map(({ name, color }) => (
              <button
                key={name}
                onClick={() => nav(`/results?company=${encodeURIComponent(name)}`)}
                style={{
                  background: "transparent",
                  border: `1px solid ${color}33`,
                  borderRadius: 6,
                  padding: "11px 16px",
                  color,
                  fontFamily: S.font,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Full analysis → {name}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!dataA && !dataB && !loadingA && !loadingB && (
          <div style={{
            textAlign: "center", color: S.muted,
            fontSize: 12, padding: "60px 0", lineHeight: 1.9,
          }}>
            Search two companies above to compare them.<br />
            <span style={{ color: S.label }}>Structural signals · Analog overlap · Risk divergence</span>
          </div>
        )}

      </div>
    </div>
  );
}