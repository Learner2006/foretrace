/* eslint-disable no-unused-vars */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MV, v, EASE_OUT_EXPO } from "../styles/animations";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { Icon, PremiumCard } from "../components/ui/UI";
import SearchBar from "../components/ui/SearchBar";
import { ProBadge } from "../components/layout/Shell";
import { useTheme } from "../hooks/useTheme";
import MarketPositionCard from "../components/company/MarketPositionCard";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const DEMO_DATA = {
  CSCO: {
    company: "Cisco Systems",
    behavioral_summary: {
      what_is_happening: "Cisco is navigating a period of strategic transformation amid moderate network equipment market headwinds, with heightened focus on software and subscription-based services.",
      why_it_matters: "Software transitions reduce hardware margin dependency and create more predictable recurring revenue.",
      confidence: "Moderate",
    },
    market_position: { sector_standing: "Technology · Network Infrastructure", momentum: "stable", key_dependency: "Hardware refresh cycles still drive a third of revenue" },
    structural_risk: { score: 72, zone: "Safe Zone" },
    structural_signals: { revenue_trend: "stable", debt_posture: "stable", margin_pressure: false, cash_position: "strong", layoffs_or_restructuring: false, capex_trend: "increasing" },
    analogs: [
      { what_they_resembled: "Hardware-centric infrastructure vendor facing commoditization", action_taken: "Pivoted to software-defined networking and subscriptions", year: 2020, similarity_score: 75, analog_ticker: "IBM" },
      { what_they_resembled: "Product-driven model with slowing unit growth", action_taken: "Emphasized services and recurring revenue", year: 2021, similarity_score: 68, analog_ticker: "ORCL" },
    ],
  },
  AAPL: {
    company: "Apple Inc.",
    behavioral_summary: {
      what_is_happening: "Apple continues to dominate premium consumer electronics with strong ecosystem lock-in and expanding services revenue creating a resilient moat.",
      why_it_matters: "Services diversification reduces hardware cyclicality and improves predictability of earnings.",
      confidence: "High",
    },
    market_position: { sector_standing: "Technology · Consumer Electronics", momentum: "growing", key_dependency: "iPhone still drives over half of total revenue" },
    structural_risk: { score: 88, zone: "Safe Zone" },
    structural_signals: { revenue_trend: "growing", debt_posture: "decreasing", margin_pressure: false, cash_position: "strong", layoffs_or_restructuring: false, capex_trend: "increasing" },
    analogs: [
      { what_they_resembled: "Hardware manufacturer with maturing core product line", action_taken: "Shifted to services-first growth strategy", year: 2019, similarity_score: 82, analog_ticker: "MSFT" },
    ],
  },
};

const DIMS = [
  { key: "revenue_trend", label: "Revenue Trend", good: ["growing", "stable"], bad: ["declining", "sharply_declining"] },
  { key: "debt_posture", label: "Debt Posture", good: ["low", "decreasing", "stable"], bad: ["increasing", "high"] },
  { key: "cash_position", label: "Cash Position", good: ["strong", "healthy"], bad: ["weak", "critical"] },
  { key: "margin_pressure", label: "Margin Pressure", good: [false], bad: [true] },
  { key: "layoffs_or_restructuring", label: "Restructuring Risk", good: [false], bad: [true] },
  { key: "capex_trend", label: "CapEx Trend", good: ["increasing", "stable"], bad: ["declining"] },
];

const scoreSignal = (signals, dim) => {
  if (!signals) return null;
  const val = signals[dim.key];
  if (val === undefined || val === null) return null;
  if (dim.good.includes(val)) return "good";
  if (dim.bad.includes(val)) return "bad";
  return "neutral";
};

const fmtVal = val => {
  if (val === true) return "Yes";
  if (val === false) return "No";
  if (val === undefined || val === null) return "—";
  return String(val).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const netScore = signals => {
  if (!signals) return null;
  let good = 0, bad = 0;
  DIMS.forEach(dim => {
    const s = scoreSignal(signals, dim);
    if (s === "good") good++;
    if (s === "bad") bad++;
  });
  return { good, bad, net: good - bad };
};

function shapeCompareData(raw, ticker) {
  const bs = raw.behavioral_summary ?? {};
  const mp = raw.market_position ?? {};
  const sr = raw.structural_risk ?? {};
  const sigs = raw.signals ?? {};
  const analogs = raw.analogs ?? raw.behavioral_analogs ?? [];

  const confidence = bs.confidence ?? "Moderate";

  const net = netScore(sigs);
  const riskTrend = net === null ? "stable" : net.net > 0 ? "down" : net.net < 0 ? "up" : "stable";
  const overallRisk = Math.max(0, Math.min(100, 100 - (sr.score ?? 50)));

  const riskMatrix = DIMS.map(dim => {
    const s = scoreSignal(sigs, dim);
    if (s === null) return null;
    const score = s === "good" ? 22 : s === "bad" ? 82 : 50;
    return {
      dimension: dim.label,
      score,
      trend: score >= 65 ? "up" : score <= 35 ? "down" : "neutral",
      explanation: `${dim.label}: ${fmtVal(sigs[dim.key])}`,
    };
  }).filter(Boolean);

  const topAnalog = [...analogs].sort((a, b) => (b.similarity_score ?? 0) - (a.similarity_score ?? 0))[0] ?? null;

  return {
    ticker: ticker?.toUpperCase() ?? "",
    company_name: raw.company ?? ticker,
    market_position: {
      sector_standing: mp.sector_standing ?? "—",
      momentum: mp.momentum ?? "stable",
      key_dependency: mp.key_dependency ?? null,
    },
    structuralScore: {
      overall: Math.round(overallRisk),
      confidence,
      trend: riskTrend,
      explanation: bs.why_it_matters ?? bs.what_is_happening ?? "",
    },
    riskMatrix,
    structural_signals: sigs,
    net,
    topAnalog,
    analogCount: analogs.length,
    behavioral_summary: [bs.what_is_happening, bs.why_it_matters].filter(Boolean).join(" "),
  };
}

const ARROW_RIGHT = "M5 12h14M12 5l7 7-7 7";
const VS_ACCENT_A = "#4C6FDB";
const VS_ACCENT_B = "#C2703D";

function CompareSearchColumn({ label, accent, onSearch, loading, error, data, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <SearchBar t={t} onSearch={onSearch} loading={loading} />
      {loading && (
        <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, fontStyle: "italic" }}>Reading filings…</span>
      )}
      {error && (
        <span className="ft-sans" style={{ fontSize: 11, color: "#C0453C" }}>{error}</span>
      )}
      {data && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <span className="ft-serif" style={{ fontSize: 17, fontWeight: 400, color: t.text }}>{data.company_name}</span>
          <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>{data.ticker}</span>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ eyebrow, title, t, isMobile }) {
  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
        {eyebrow}
      </p>
      <h2 className="ft-serif" style={{ fontSize: isMobile ? 19 : 24, fontWeight: 400, margin: "0 0 20px", letterSpacing: "-0.3px", color: t.text }}>
        {title}
      </h2>
    </motion.div>
  );
}

function SignalPill({ score, t }) {
  if (!score) return null;
  const map = {
    good: { color: "#5C9B6E", bg: "rgba(92,155,110,0.1)", char: "▲" },
    bad: { color: "#C0453C", bg: "rgba(192,69,60,0.08)", char: "▼" },
    neutral: { color: t.warning, bg: t.warningBg, char: "—" },
  };
  const m = map[score];
  return (
    <span className="ft-sans" style={{ fontSize: 9, fontWeight: 700, color: m.color, background: m.bg, borderRadius: 3, padding: "2px 5px", flexShrink: 0 }}>
      {m.char}
    </span>
  );
}

function SignalGridRow({ dim, sigA, sigB, t, isMobile, delay }) {
  const sA = scoreSignal(sigA, dim);
  const sB = scoreSignal(sigB, dim);
  const aWins = sA === "good" && sB !== "good";
  const bWins = sB === "good" && sA !== "good";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3, ease: EASE_OUT_EXPO }}
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 160px 1fr",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: `1px solid ${t.border}`,
        gap: isMobile ? 4 : 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: isMobile ? "flex-start" : "flex-end" }}>
        {sA && <SignalPill score={sA} t={t} />}
        <span className="ft-sans" style={{ fontSize: 12, color: aWins ? VS_ACCENT_A : sA === "bad" ? "#C0453C" : t.textSub, fontWeight: aWins ? 700 : 400 }}>
          {sigA ? fmtVal(sigA[dim.key]) : "—"}
        </span>
      </div>

      {!isMobile && (
        <div style={{ textAlign: "center" }}>
          <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>
            {dim.label}
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: isMobile ? "flex-end" : "flex-start" }}>
        {isMobile && (
          <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, marginRight: "auto" }}>{dim.label}</span>
        )}
        <span className="ft-sans" style={{ fontSize: 12, color: bWins ? VS_ACCENT_B : sB === "bad" ? "#C0453C" : t.textSub, fontWeight: bWins ? 700 : 400 }}>
          {sigB ? fmtVal(sigB[dim.key]) : "—"}
        </span>
        {sB && <SignalPill score={sB} t={t} />}
      </div>
    </motion.div>
  );
}

function VerdictCard({ dataA, dataB, nameA, nameB, t, isMobile }) {
  const sA = dataA.net;
  const sB = dataB.net;
  if (!sA || !sB) return null;

  const tied = sA.net === sB.net;
  const aWins = sA.net > sB.net;
  const diff = Math.abs(sA.net - sB.net);
  const winner = tied ? null : aWins ? { name: nameA, accent: VS_ACCENT_A } : { name: nameB, accent: VS_ACCENT_B };

  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      <PremiumCard t={t} style={{ background: tied ? t.warningBg : `${winner.accent}0D` }} glow>
        <div style={{ padding: isMobile ? "20px 18px" : "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
              Structural verdict
            </p>
            <span className="ft-sans" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2px", color: tied ? t.warning : winner.accent }}>
              {tied ? "Structurally tied" : `${winner.name} shows stronger fundamentals`}
            </span>
            {!tied && (
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>
                +{diff} signal{diff !== 1 ? "s" : ""} ahead
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {[{ name: nameA, score: sA, accent: VS_ACCENT_A }, { name: nameB, score: sB, accent: VS_ACCENT_B }].map(({ name, score, accent }) => (
              <div key={name}>
                <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: accent, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  {name}
                </span>
                <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: "6px 0 0", lineHeight: 1.6 }}>
                  <span style={{ color: "#5C9B6E", fontWeight: 600 }}>▲ {score.good} stable</span>
                  <span style={{ color: t.textMuted }}> · </span>
                  <span style={{ color: "#C0453C", fontWeight: 600 }}>▼ {score.bad} stressed</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

function AnalogColumn({ name, data, accent, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: accent, letterSpacing: "0.5px", textTransform: "uppercase" }}>
        {name}
      </span>
      {data.topAnalog ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span className="ft-serif" style={{ fontSize: 15, color: t.text, fontWeight: 400 }}>
              {data.topAnalog.similarity_score ?? "—"}% match
            </span>
            {data.topAnalog.year && (
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>{data.topAnalog.year}</span>
            )}
          </div>
          {data.topAnalog.what_they_resembled && (
            <div>
              <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 3px" }}>
                Resembled
              </p>
              <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
                {data.topAnalog.what_they_resembled}
              </p>
            </div>
          )}
          {data.topAnalog.action_taken && (
            <div>
              <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 3px" }}>
                Action taken
              </p>
              <p className="ft-sans" style={{ fontSize: 12, color: t.text, margin: 0, lineHeight: 1.6 }}>
                {data.topAnalog.action_taken}
              </p>
            </div>
          )}
          {data.analogCount > 1 && (
            <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>
              +{data.analogCount - 1} more analog{data.analogCount - 1 !== 1 ? "s" : ""} on file
            </span>
          )}
        </>
      ) : (
        <span className="ft-sans" style={{ fontSize: 12, color: t.textMuted, fontStyle: "italic" }}>No analogs on file</span>
      )}
    </div>
  );
}

function AnalogSnapshotCard({ dataA, dataB, nameA, nameB, t, isMobile }) {
  if (!dataA.topAnalog && !dataB.topAnalog) return null;

  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
      <PremiumCard t={t} style={{ background: t.analogBg }}>
        <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px" }}>
          <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
            Closest historical analog · each side
          </p>
        </div>
        <div style={{ padding: isMobile ? "18px 16px" : "22px 26px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 28 }}>
          <div style={{ borderLeft: isMobile ? "none" : `2px solid ${VS_ACCENT_A}33`, paddingLeft: isMobile ? 0 : 16 }}>
            <AnalogColumn name={nameA} data={dataA} accent={VS_ACCENT_A} t={t} />
          </div>
          <div style={{ borderLeft: isMobile ? "none" : `2px solid ${VS_ACCENT_B}33`, paddingLeft: isMobile ? 0 : 16, borderTop: isMobile ? `1px solid ${t.border}` : "none", paddingTop: isMobile ? 20 : 0 }}>
            <AnalogColumn name={nameB} data={dataB} accent={VS_ACCENT_B} t={t} />
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

function BehavioralSummaryCard({ dataA, dataB, nameA, nameB, t, isMobile }) {
  if (!dataA.behavioral_summary && !dataB.behavioral_summary) return null;

  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
      <PremiumCard t={t} style={{ background: t.bgSubtle }}>
        <div style={{ padding: isMobile ? "20px 18px" : "24px 26px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 28 }}>
          {[{ name: nameA, text: dataA.behavioral_summary, accent: VS_ACCENT_A }, { name: nameB, text: dataB.behavioral_summary, accent: VS_ACCENT_B }].map(({ name, text, accent }) => (
            <div key={name}>
              <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: accent, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 10px" }}>
                {name} · behavioral read
              </p>
              <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.75, margin: 0, fontWeight: 300 }}>
                {text || "—"}
              </p>
            </div>
          ))}
        </div>
      </PremiumCard>
    </motion.div>
  );
}

export default function ComparePage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const { t } = useTheme();

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState(null);
  const [errorB, setErrorB] = useState(null);

  // If you're about to copy-paste this, stop and make a reusable hook instead.
  const fetchSide = useCallback(async (ticker, name, side) => {
    const setData = side === "A" ? setDataA : setDataB;
    const setLoading = side === "A" ? setLoadingA : setLoadingB;
    const setError = side === "A" ? setErrorA : setErrorB;

    setLoading(true);
    setError(null);
    try {
      const demo = DEMO_DATA[ticker?.toUpperCase()];
      if (demo) {
        setData(shapeCompareData(demo, ticker));
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: name, ticker }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const raw = await res.json();
      setData(shapeCompareData(raw, ticker));
    } catch (e) {
      setError(e.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const nameA = dataA?.company_name ?? "Company A";
  const nameB = dataB?.company_name ?? "Company B";
  const bothReady = !!(dataA && dataB);
  const maxW = { maxWidth: 980, margin: "0 auto", padding: `0 ${isMobile ? 20 : 32}px` };

  return (
    <div style={{ color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .ft-sans  { font-family: 'DM Sans','Inter',sans-serif; }
        .ft-serif { font-family: 'DM Serif Display','Georgia',serif; }
        .ft-mono  { font-family: 'DM Mono',monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 2px; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1 }}>

<div style={{ ...maxW, padding: isMobile ? "40px 20px 32px" : "56px 32px 40px" }}>
          <motion.div variants={v(MV.heroCh)} initial="hidden" animate="visible">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
                Structural comparison
              </p>
              <ProBadge t={t} />
            </div>
            <h1 className="ft-serif" style={{ fontSize: isMobile ? 26 : 34, fontWeight: 400, margin: "0 0 10px", letterSpacing: "-0.4px", color: t.text, lineHeight: 1.15 }}>
              Which company is structurally stronger?
            </h1>
            <p className="ft-sans" style={{ fontSize: 14, color: t.textSub, margin: 0, fontWeight: 300, lineHeight: 1.65, maxWidth: 560 }}>
              Search two companies to compare structural health, market positioning, and historical analogs — side by side, with the reasoning shown.
            </p>
          </motion.div>
        </div>

<div style={{ ...maxW, marginBottom: isMobile ? 36 : 48 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 24 }}>
            <CompareSearchColumn label="Company A" accent={VS_ACCENT_A} onSearch={(ticker, name) => fetchSide(ticker, name, "A")} loading={loadingA} error={errorA} data={dataA} t={t} />
            <CompareSearchColumn label="Company B" accent={VS_ACCENT_B} onSearch={(ticker, name) => fetchSide(ticker, name, "B")} loading={loadingB} error={errorB} data={dataB} t={t} />
          </div>
        </div>

{!dataA && !dataB && !loadingA && !loadingB && (
          <div style={{ ...maxW, marginBottom: 100 }}>
            <div style={{ textAlign: "center", padding: isMobile ? "48px 20px" : "72px 40px", border: `1px dashed ${t.border}`, borderRadius: 14, background: t.bgSubtle }}>
              <p className="ft-serif" style={{ fontSize: 22, color: t.text, margin: "0 0 8px", fontWeight: 400 }}>
                Start a comparison
              </p>
              <p className="ft-sans" style={{ fontSize: 14, color: t.textMuted, margin: "0 0 32px", lineHeight: 1.6 }}>
                Search two companies above to analyze their structural health, market positioning, and historical analogs side-by-side.
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, margin: 0 }}>
                  Suggested Matchups
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                  {[
                    { a: "TSLA", nameA: "Tesla", b: "BYDDY", nameB: "BYD" },
                    { a: "INTC", nameA: "Intel", b: "AMD", nameB: "AMD" },
                    { a: "NFLX", nameA: "Netflix", b: "DIS", nameB: "Disney" }
                  ].map((pair, i) => (
                    <motion.button
                      key={i}
                      onClick={() => {
                        fetchSide(pair.a, pair.nameA, "A");
                        fetchSide(pair.b, pair.nameB, "B");
                      }}
                      whileHover={{ scale: 1.02, backgroundColor: t.bgCard, borderColor: t.borderHover }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        background: "none", border: `1px solid ${t.border}`, borderRadius: 30,
                        padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
                        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: VS_ACCENT_A }}>{pair.a}</span>
                      <span style={{ fontSize: 11, color: t.textMuted, fontStyle: "italic" }}>vs</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: VS_ACCENT_B }}>{pair.b}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {bothReady && (
          <>

            <div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
              <SectionHeading eyebrow="Pillar · Market position" title="How each company sits in its ecosystem" t={t} isMobile={isMobile} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                <MarketPositionCard data={dataA.market_position} t={t} />
                <MarketPositionCard data={dataB.market_position} t={t} />
              </div>
            </div>



<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
              <SectionHeading eyebrow="Head-to-head" title="Structural signals, dimension by dimension" t={t} isMobile={isMobile} />
              <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                <PremiumCard t={t} style={{ background: t.bgCard }}>
                  <div style={{ padding: isMobile ? "18px 16px" : "22px 28px" }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 160px 1fr",
                      paddingBottom: 10,
                      borderBottom: `1px solid ${t.border}`,
                      marginBottom: 2,
                    }}>
                      <div style={{ textAlign: isMobile ? "left" : "right" }}>
                        <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: VS_ACCENT_A, letterSpacing: "0.6px", textTransform: "uppercase" }}>{nameA}</span>
                      </div>
                      {!isMobile && <div />}
                      <div style={{ textAlign: "right" }}>
                        <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: VS_ACCENT_B, letterSpacing: "0.6px", textTransform: "uppercase" }}>{nameB}</span>
                      </div>
                    </div>
                    {DIMS.map((dim, i) => (
                      <SignalGridRow key={dim.key} dim={dim} sigA={dataA.structural_signals} sigB={dataB.structural_signals} t={t} isMobile={isMobile} delay={i * 0.05} />
                    ))}
                  </div>
                </PremiumCard>
              </motion.div>
            </div>

<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
              <VerdictCard dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} t={t} isMobile={isMobile} />
            </div>

<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
              <SectionHeading eyebrow="Pillar · Historical analogs" title="What situations does each company resemble" t={t} isMobile={isMobile} />
              <AnalogSnapshotCard dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} t={t} isMobile={isMobile} />
            </div>

<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
              <SectionHeading eyebrow="Explainability" title="Why the model reads it this way" t={t} isMobile={isMobile} />
              <BehavioralSummaryCard dataA={dataA} dataB={dataB} nameA={nameA} nameB={nameB} t={t} isMobile={isMobile} />
            </div>

<div style={{ ...maxW, marginBottom: 100 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                {[{ name: nameA, ticker: dataA.ticker, accent: VS_ACCENT_A }, { name: nameB, ticker: dataB.ticker, accent: VS_ACCENT_B }].map(({ name, ticker, accent }) => (
                  <motion.button
                    key={name}
                    onClick={() => navigate(`/AnalysisPage?ticker=${ticker}&name=${name}`)}
                    whileHover={{ backgroundColor: t.bgSubtle, borderColor: t.borderHover }}
                    whileTap={{ scale: 0.98 }}
                    className="ft-sans"
                    style={{
                      background: "none", border: `1px solid ${t.border}`, borderRadius: 10,
                      padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                      Full structural analysis <span style={{ color: accent }}>· {name}</span>
                    </span>
                    <Icon path={ARROW_RIGHT} size={14} color={t.textMuted} />
                  </motion.button>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
