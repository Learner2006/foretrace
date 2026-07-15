import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { MV, v, EASE_OUT_EXPO } from "../styles/animations";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { Icon, PremiumCard, ConfidenceBar } from "../components/ui/UI";
import SearchBar from "../components/ui/SearchBar";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const DEMO_DATA = {
  CSCO: {
    company: "Cisco Systems",
    behavioral_summary: {
      what_is_happening: "Cisco is navigating a period of strategic transformation amid moderate network equipment market headwinds, with heightened focus on software and subscription-based services.",
      why_it_matters: "Software transitions reduce hardware margin dependency and create more predictable recurring revenue.",
      confidence: "Moderate",
    },
    market_position: {
      sector_standing: "Technology Network Infrastructure",
      momentum: "stable",
    },
    structural_risk: {
      score: 72,
      zone: "Safe Zone",
    },
    structural_signals: {
      revenue_trend: "stable",
      debt_posture: "stable",
      margin_pressure: false,
      cash_position: "strong",
      layoffs_or_restructuring: false,
    },
    risk_signals: [
      { signal: "Increased R&D spend on AI/ML", year: 2023, why_it_matters: "Heavy investment in emerging tech" },
      { signal: "Software revenue growing", year: 2022, why_it_matters: "Shift away from hardware dependency" },
      { signal: "Acquisition of security companies", year: 2021, why_it_matters: "Building integrated security platform" },
      { signal: "Service provider market stabilizing", year: 2020, why_it_matters: "Core market showing resilience" },
      { signal: "Cloud infrastructure adoption accelerating", year: 2019, why_it_matters: "Long-term tailwind for networking" },
    ],
    analogs: [
      { what_they_resembled: "Hardware-centric infrastructure", action_taken: "Pivot to software-defined networking", year: 2020, similarity_score: 75 },
      { what_they_resembled: "Product-driven model", action_taken: "Subscription and services emphasis", year: 2021, similarity_score: 68 },
    ],
  },
  AAPL: {
    company: "Apple Inc.",
    behavioral_summary: {
      what_is_happening: "Apple continues to dominate premium consumer electronics with strong ecosystem lock-in and expanding services revenue creating a resilient moat.",
      why_it_matters: "Services diversification reduces hardware cyclicality and improves predictability of earnings.",
      confidence: "High",
    },
    market_position: {
      sector_standing: "Technology Consumer Electronics",
      momentum: "growing",
    },
    structural_risk: {
      score: 88,
      zone: "Safe Zone",
    },
    structural_signals: {
      revenue_trend: "growing",
      debt_posture: "decreasing",
      margin_pressure: false,
      cash_position: "strong",
      layoffs_or_restructuring: false,
    },
    risk_signals: [
      { signal: "Services revenue exceeds hardware growth", year: 2024, why_it_matters: "Business model resilience improving" },
      { signal: "Installed base reaches 2B devices", year: 2023, why_it_matters: "Ecosystem lock-in at peak" },
      { signal: "Margins expanding despite competition", year: 2022, why_it_matters: "Pricing power remains strong" },
      { signal: "China market share pressured", year: 2021, why_it_matters: "Geopolitical risk emerging" },
      { signal: "iPhone 12 supercycle ends", year: 2020, why_it_matters: "Returns to normal upgrade cycles" },
    ],
    analogs: [
      { what_they_resembled: "Hardware manufacturer", action_taken: "Services-first strategy", year: 2019, similarity_score: 82 },
    ],
  },
};

function shapeApiResponse(raw, ticker) {
  const bs    = raw.behavioral_summary   ?? {};
  const mp    = raw.market_position      ?? {};
  const sr    = raw.structural_risk      ?? {};
  const sigs  = raw.structural_signals   ?? raw.signals ?? {};

const pulse = [];

  const revTrend = sigs.revenue_trend;
  if (revTrend) pulse.push({
    label: "Revenue Trajectory",
    status: revTrend === "growing" ? "Improving" : revTrend === "declining" ? "Declining" : "Flat",
    dir:   revTrend === "growing" ? "up" : revTrend === "declining" ? "down" : "neutral",
  });

  const debt = sigs.debt_posture;
  if (debt) pulse.push({
    label: "Debt Structure",
    status: debt === "decreasing" ? "Improving" : debt === "increasing" ? "Elevated" : "Stable",
    dir:   debt === "decreasing" ? "up" : debt === "increasing" ? "down" : "neutral",
  });

  if (sigs.margin_pressure !== undefined) pulse.push({
    label: "Margin Pressure",
    status: sigs.margin_pressure ? "Active" : "Contained",
    dir:   sigs.margin_pressure ? "down" : "up",
  });

  const cash = sigs.cash_position;
  if (cash) pulse.push({
    label: "Cash Position",
    status: cash === "strong" ? "Strong" : cash === "weak" ? "Stressed" : "Unknown",
    dir:   cash === "strong" ? "up" : cash === "weak" ? "down" : "neutral",
  });

  if (sigs.layoffs_or_restructuring !== undefined) pulse.push({
    label: "Restructuring Activity",
    status: sigs.layoffs_or_restructuring ? "Underway" : "None",
    dir:   sigs.layoffs_or_restructuring ? "down" : "up",
  });

  const momentum = mp.momentum;
  if (momentum) pulse.push({
    label: "Market Momentum",
    status: momentum === "growing" ? "Building" : momentum === "declining" ? "Slowing" : "Stable",
    dir:   momentum === "growing" ? "up" : momentum === "declining" ? "down" : "neutral",
  });

const language_shifts = (raw.analogs ?? []).map(a => ({
    from:         a.what_they_resembled ?? "Prior positioning",
    to:           a.action_taken        ?? "Strategic pivot",
    year:         String(a.year ?? ""),
    significance: a.similarity_score >= 70 ? "high" : "medium",
  }));

const riskSignals = raw.risk_signals ?? [];
  const narrative_timeline = riskSignals.length > 0
    ? riskSignals.slice(0, 5).map((rs, i) => ({
        year: String(rs.year ?? new Date().getFullYear() - (5 - i)),
        label: rs.signal ?? "Signal",
        note: rs.why_it_matters ?? "",
      }))
    : [
        { year: "2024", label: "Recent developments", note: "Company continues to operate" },
        { year: "2023", label: "Market position", note: "Maintaining market share" },
        { year: "2022", label: "Growth phase", note: "Expansion in key markets" },
        { year: "2021", label: "Recovery period", note: "Post-pandemic normalization" },
        { year: "2020", label: "Pandemic impact", note: "Initial market adjustment" },
      ];

const confMap = { High: 88, Moderate: 62, Low: 38 };
  const confStr  = bs.confidence ?? "Moderate";
  const confNum  = confMap[confStr] ?? 62;

const zoneMap  = { "Safe Zone": "Low", "Grey Zone": "Medium", "Distress Zone": "High" };
  const riskLvl  = zoneMap[sr.zone] ?? "Medium";

  return {
    ticker:              ticker?.toUpperCase() ?? "",
    company_name:        raw.company ?? ticker,
    sector:              mp.sector_standing?.split(" ")[0] ?? "—",
    founded:             "—",
    headquarters:        "—",

    self_description:        bs.what_is_happening ?? "No description available.",
    self_description_source: "SEC 10-K / Yahoo Finance filing",

    narrative_timeline:  narrative_timeline.length ? narrative_timeline : [
      { year: String(new Date().getFullYear()), label: bs.what_is_happening?.slice(0, 40) ?? "Current state", note: bs.why_it_matters ?? "" },
    ],

    structural_health:   sr.score ?? 70,
    risk_level:          riskLvl,
    behavioral_pattern:  raw.behavioral_pattern_identified ?? bs.what_is_happening?.split(".")[0] ?? "—",
    confidence:          confNum,

    pulse,

    language_shifts:     language_shifts.length ? language_shifts : [
      { from: "prior strategy", to: "current positioning", year: String(new Date().getFullYear()), significance: "medium" },
    ],

    behavioral_summary: [bs.what_is_happening, bs.why_it_matters].filter(Boolean).join(" "),

_raw: raw,
  };
}

const ARROW_LEFT  = "M19 12H5M12 5l-7 7 7 7";
const ARROW_RIGHT = "M5 12h14M12 5l7 7-7 7";

function PulseRow({ label, status, dir, t, delay }) {
  const color = dir === "up"
    ? (t.positive ?? "#4CAF7D")
    : dir === "down"
    ? (t.warning ?? "#E8924A")
    : t.textMuted;

  const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 0", borderBottom: `1px solid ${t.border}`,
      }}
    >
      <span className="ft-sans" style={{ fontSize: 13, color: t.textSub, fontWeight: 400 }}>
        {label}
      </span>
      <span className="ft-sans" style={{
        fontSize: 11, fontWeight: 600, color,
        background: `${color}14`, border: `1px solid ${color}28`,
        padding: "2px 9px", borderRadius: 4,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        <span style={{ fontSize: 9 }}>{arrow}</span>
        {status}
      </span>
    </motion.div>
  );
}

function LanguageShiftRow({ item, t, delay, isMobile }) {
  const sigColor = item.significance === "high" ? (t.warning ?? "#E8924A") : t.textMuted;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
      style={{
        padding: isMobile ? "14px 16px" : "16px 20px",
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>

        <div style={{
          flex: 1, background: t.bgSubtle, border: `1px solid ${t.border}`,
          borderRadius: 6, padding: "6px 10px", minWidth: 0,
        }}>
          <p className="ft-sans" style={{ fontSize: 9, color: t.textMuted, margin: "0 0 3px", letterSpacing: "0.4px", textTransform: "uppercase" }}>Previously said</p>
          <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: 0, fontStyle: "italic" }}>"{item.from}"</p>
        </div>

<div style={{ flexShrink: 0, paddingTop: 14, color: t.textMuted }}>
          <Icon path={ARROW_RIGHT} size={14} color={t.textMuted} />
        </div>

<div style={{
          flex: 1, background: t.bg, border: `1px solid ${t.borderHover ?? t.border}`,
          borderRadius: 6, padding: "6px 10px", minWidth: 0,
        }}>
          <p className="ft-sans" style={{ fontSize: 9, color: t.textMuted, margin: "0 0 3px", letterSpacing: "0.4px", textTransform: "uppercase" }}>Now says</p>
          <p className="ft-sans" style={{ fontSize: 12, color: t.text, margin: 0, fontWeight: 500 }}>"{item.to}"</p>
        </div>

<div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, paddingTop: 4 }}>
          <span className="ft-mono" style={{ fontSize: 10, color: t.textMuted }}>{item.year}</span>
          <span className="ft-sans" style={{
            fontSize: 8, fontWeight: 700, letterSpacing: "0.3px", textTransform: "uppercase",
            color: sigColor, background: `${sigColor}14`, padding: "1px 5px", borderRadius: 3,
          }}>
            {item.significance}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function NarrativeTimeline({ timeline, t, isMobile }) {
  return (
    <div style={{ position: "relative", padding: isMobile ? "0 0 0 24px" : "0 0 0 32px" }}>

      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
        style={{
          position: "absolute", left: isMobile ? 7 : 11, top: 6, bottom: 6,
          width: 1, background: t.border, transformOrigin: "top",
        }}
      />

      {timeline.map((item, i) => (
        <motion.div
          key={item.year}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.35 }}
          style={{ display: "flex", gap: isMobile ? 16 : 20, marginBottom: i < timeline.length - 1 ? 24 : 0, position: "relative" }}
        >

          <div style={{
            position: "absolute", left: isMobile ? -20 : -24,
            top: 5, width: 7, height: 7, borderRadius: "50%",
            background: i === timeline.length - 1 ? t.text : t.bgSubtle,
            border: `1.5px solid ${i === timeline.length - 1 ? t.text : t.border}`,
            flexShrink: 0,
          }} />

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span className="ft-mono" style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.5px" }}>
                {item.year}
              </span>
              <span className="ft-sans" style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                {item.label}
              </span>
            </div>
            <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: 0, lineHeight: 1.5, fontWeight: 300 }}>
              {item.note}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function CompanyPage() {
  const { ticker }   = useParams();
  const navigate     = useNavigate();
  const { isMobile } = useBreakpoint();

  const { t } = useTheme();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const maxW = { maxWidth: 860, margin: "0 auto", padding: `0 ${isMobile ? 20 : 32}px` };

  useEffect(() => {
    if (!ticker) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {

        const demoDataForTicker = DEMO_DATA[ticker.toUpperCase()];

        if (demoDataForTicker) {

          if (!cancelled) {
            setData(shapeApiResponse(demoDataForTicker, ticker));
          }
          setLoading(false);
          return;
        }

        const body = {
          company_name: ticker.replace(/\.(NS|BO)$/i, ""),
          ticker: ticker.toUpperCase(),
        };

        const res = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? `Server error ${res.status}`);
        }

        const raw = await res.json();
        if (!cancelled) {
          setData(shapeApiResponse(raw, ticker));
        }
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to load company data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [ticker, navigate]);

  if (!ticker) return (
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
          <motion.div variants={v(MV.heroC)} initial="hidden" animate="visible">
            <motion.div variants={v(MV.heroCh)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                Company Explorer
              </span>
            </motion.div>
            <motion.h1 variants={v(MV.heroCh)} className="ft-serif" style={{ fontSize: isMobile ? 28 : 42, fontWeight: 400, margin: "0 0 12px", letterSpacing: "-0.4px", color: t.text, lineHeight: 1.15 }}>
              Explore structural health of corporate entities
            </motion.h1>
            <motion.p variants={v(MV.heroCh)} className="ft-sans" style={{ fontSize: 14, color: t.textSub, margin: 0, fontWeight: 300, lineHeight: 1.65, maxWidth: 560 }}>
              Search for a company ticker to reveal its structural risk profile, R&D postures, and historical analog comparisons.
            </motion.p>
          </motion.div>
        </div>

        <div style={{ ...maxW, marginBottom: 48 }}>
          <motion.div variants={v(MV.heroCh)} initial="hidden" animate="visible">
            <SearchBar
              t={t}
              onSearch={(ticker) => navigate(`/company/${ticker}`)}
              loading={false}
            />
          </motion.div>
        </div>

        <div style={{ ...maxW, marginBottom: 80 }}>
          <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 16 }}>
            Featured Companies
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {[
              { ticker: "AAPL", name: "Apple Inc." },
              { ticker: "MSFT", name: "Microsoft Corporation" },
              { ticker: "NVDA", name: "NVIDIA Corporation" },
              { ticker: "AMZN", name: "Amazon.com Inc." },
              { ticker: "TSLA", name: "Tesla Inc." },
              { ticker: "CSCO", name: "Cisco Systems Inc." },
            ].map((company, i) => (
              <motion.div key={company.ticker} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                <PremiumCard t={t} onClick={() => navigate(`/company/${company.ticker}`)} style={{ cursor: "pointer" }}>
                  <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="ft-mono" style={{
                        fontSize: 10, fontWeight: 500, color: t.text, letterSpacing: "0.5px",
                        background: t.bgSubtle, border: `1px solid ${t.border}`,
                        padding: "2px 8px", borderRadius: 4
                      }}>
                        {company.ticker}
                      </span>
                      <span className="ft-sans" style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                        {company.name}
                      </span>
                    </div>
                    <Icon path={ARROW_RIGHT} size={14} color={t.textMuted} />
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}>
        <span className="ft-sans" style={{ fontSize: 13, color: t.textMuted, fontFamily: "'DM Sans',sans-serif" }}>
          Reading filings for {ticker?.toUpperCase()}…
        </span>
      </motion.div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <p className="ft-sans" style={{ color: t.warning ?? "#E8924A", fontFamily: "'DM Sans',sans-serif", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 400 }}>
        {error}
      </p>
      <button
        onClick={() => navigate(-1)}
        className="ft-sans"
        style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 7, padding: "9px 20px", fontSize: 13, color: t.textSub, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
      >
        ← Go back
      </button>
    </div>
  );

  if (!data) return null;

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

<div style={{ ...maxW, paddingTop: isMobile ? 36 : 52, paddingBottom: isMobile ? 32 : 44 }}>
          <motion.div variants={v(MV.heroC)} initial="hidden" animate="visible">

<motion.button
              variants={v(MV.heroCh)}
              onClick={() => navigate(-1)}
              whileHover={{ x: -2 }} whileTap={{ scale: 0.96 }}
              className="ft-sans"
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, color: t.textMuted, padding: 0, marginBottom: 24,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <Icon path={ARROW_LEFT} size={13} color={t.textMuted} />
              Back
            </motion.button>

<motion.div variants={v(MV.heroCh)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span className="ft-mono" style={{
                fontSize: 11, fontWeight: 400, color: t.text, letterSpacing: "1px",
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                padding: "3px 10px", borderRadius: 5,
              }}>
                {data.ticker}
              </span>
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>
                {data.sector} · Est. {data.founded}
              </span>
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: "50%", background: t.positive ?? "#4CAF7D", display: "inline-block" }}
              />
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>Live filing data</span>
            </motion.div>

<motion.h1 variants={v(MV.heroCh)} className="ft-serif" style={{
              fontSize: isMobile ? 30 : 48, fontWeight: 400, margin: "0 0 28px",
              lineHeight: 1.1, letterSpacing: "-0.5px", color: t.text,
            }}>
              {data.company_name}
            </motion.h1>

<motion.div variants={v(MV.heroCh)} style={{
              display: "flex", flexWrap: "wrap", gap: isMobile ? 10 : 16,
              alignItems: "center",
            }}>

              <div style={{
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "10px 16px",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>Structural Health</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ft-serif" style={{ fontSize: 22, color: t.text, lineHeight: 1 }}>{data.structural_health}</span>
                  <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>/100</span>
                </div>
              </div>

<div style={{
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "10px 16px",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>Risk Level</span>
                <span className="ft-sans" style={{ fontSize: 14, fontWeight: 500, color: t.warning ?? "#E8924A" }}>{data.risk_level}</span>
              </div>

<div style={{
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "10px 16px", flex: isMobile ? "1 1 100%" : 1,
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>Behavioral Pattern</span>
                <span className="ft-sans" style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{data.behavioral_pattern}</span>
              </div>

<div style={{
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "10px 16px",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>Confidence</span>
                <ConfidenceBar value={data.confidence} t={t} width={80} />
              </div>
            </motion.div>
          </motion.div>
        </div>

<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
              In their own words
            </p>
            <h2 className="ft-serif" style={{ fontSize: isMobile ? 20 : 26, fontWeight: 400, margin: "0 0 20px", letterSpacing: "-0.3px", color: t.text }}>
              How {data.company_name.split(",")[0]} describes itself
            </h2>
          </motion.div>

          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            <PremiumCard t={t}>
              <div style={{ padding: isMobile ? "20px 18px" : "28px 28px" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 2, borderRadius: 2, background: t.border, flexShrink: 0, alignSelf: "stretch", minHeight: 40 }} />
                  <div>
                    <p className="ft-sans" style={{
                      fontSize: isMobile ? 14 : 16, color: t.text, lineHeight: 1.75,
                      margin: "0 0 12px", fontWeight: 300,
                    }}>
                      "{data.self_description}"
                    </p>
                    <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.3px" }}>
                      Source: {data.self_description_source}
                    </span>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </div>

<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
              Identity over time
            </p>
            <h2 className="ft-serif" style={{ fontSize: isMobile ? 20 : 26, fontWeight: 400, margin: "0 0 20px", letterSpacing: "-0.3px", color: t.text }}>
              How the story has changed
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

            <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
              <PremiumCard t={t} style={{ height: "100%" }}>
                <div style={{ padding: isMobile ? "20px 18px" : "24px 24px" }}>
                  <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 20px" }}>
                    Positioning timeline
                  </p>
                  <NarrativeTimeline timeline={data.narrative_timeline} t={t} isMobile={isMobile} />
                </div>
              </PremiumCard>
            </motion.div>

<motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} transition={{ delay: 0.08 }}>
              <PremiumCard t={t} style={{ height: "100%" }}>
                <div style={{ padding: isMobile ? "20px 0" : "24px 0" }}>
                  <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", margin: `0 0 4px`, padding: isMobile ? "0 18px" : "0 20px" }}>
                    Language shifts in filings
                  </p>
                  <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, fontWeight: 300, margin: "0 0 16px", padding: isMobile ? "0 18px" : "0 20px" }}>
                    Words they stopped using vs. words they now emphasize
                  </p>
                  {data.language_shifts.map((item, i) => (
                    <LanguageShiftRow key={i} item={item} t={t} delay={i * 0.06} isMobile={isMobile} />
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
          </div>
        </div>

<div style={{ ...maxW, marginBottom: isMobile ? 40 : 56 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
              Structural pulse
            </p>
            <h2 className="ft-serif" style={{ fontSize: isMobile ? 20 : 26, fontWeight: 400, margin: "0 0 20px", letterSpacing: "-0.3px", color: t.text }}>
              What the structure looks like right now
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "3fr 2fr", gap: 16 }}>

            <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <PremiumCard t={t} style={{ height: "100%" }}>
                <div style={{ padding: isMobile ? "16px 18px" : "20px 24px" }}>
                  {data.pulse.map((item, i) => (
                    <PulseRow key={i} {...item} t={t} delay={i * 0.07} />
                  ))}
                </div>
              </PremiumCard>
            </motion.div>

<motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.08 }}>
              <PremiumCard t={t} style={{ height: "100%", background: t.bgSubtle }}>
                <div style={{ padding: isMobile ? "20px 18px" : "24px 22px" }}>
                  <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 14px" }}>
                    Behavioral read
                  </p>
                  <p className="ft-sans" style={{
                    fontSize: 13, color: t.textSub, lineHeight: 1.75,
                    margin: 0, fontWeight: 300,
                  }}>
                    {data.behavioral_summary}
                  </p>
                </div>
              </PremiumCard>
            </motion.div>
          </div>
        </div>

<div style={{ ...maxW, marginBottom: 100 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <PremiumCard t={t} style={{ background: t.bgSubtle }}>
              <div style={{ padding: isMobile ? "32px 20px" : "44px 48px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: 24, justifyContent: "space-between" }}>
                <div>
                  <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", margin: "0 0 8px" }}>
                    Want the full picture?
                  </p>
                  <h3 className="ft-serif" style={{ fontSize: isMobile ? 20 : 26, fontWeight: 400, margin: "0 0 8px", letterSpacing: "-0.3px", color: t.text, lineHeight: 1.2 }}>
                    Run the full structural analysis
                  </h3>
                  <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, margin: 0, fontWeight: 300, lineHeight: 1.6, maxWidth: 380 }}>
                    Risk breakdown, historical analogs, mitigation levers, and the full 12-field deep analysis — straight from the SEC filing.
                  </p>
                </div>
                <motion.button
                  onClick={() => navigate("/AnalysisPage", { state: { ticker: data.ticker, companyName: data.company_name } })}
                  whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                  className="ft-sans"
                  style={{
                    background: t.text, color: t.bg, border: "none",
                    borderRadius: 8, padding: "12px 28px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 8,
                    width: isMobile ? "100%" : "auto", justifyContent: "center",
                  }}
                >
                  Deep Analysis
                  <Icon path={ARROW_RIGHT} size={13} color={t.bg} />
                </motion.button>
              </div>
            </PremiumCard>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
