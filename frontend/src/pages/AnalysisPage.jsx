import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar            from "../components/ui/SearchBar";
import CompanyProfile       from "../components/company/CompanyProfile";
import AnalogCard           from "../components/company/AnalogCard";

import MarketPositionCard   from "../components/company/MarketPositionCard";
import ReasoningChainCard   from "../components/company/ReasoningChainCard";
import RiskSignalsCard      from "../components/company/RiskSignalsCard";
import RelationshipContextCard from "../components/company/RelationshipContextCard";
import MarketPulseMatrix    from "../components/ui/MarketPulseMatrix";
import { PremiumCard, Icon } from "../components/ui/UI";
import { MV, v, EASE_OUT_EXPO } from "../styles/animations";
import { useWindowWidth }    from "../hooks/useWindowWidth";
import { useTheme }          from "../hooks/useTheme";

const STEPS = [
  "Reading SEC filing...",
  "Identifying behavioral patterns...",
  "Finding historical analogs...",
  "Building analysis...",
];

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

const ERROR_MAP = [
  [["SEC EDGAR pe nahi mili","not found"],   "Company not found on SEC EDGAR",      "Try the ticker directly — e.g. AAPL instead of Apple Inc."],
  [["10-K filing nahi mili"],                "10-K filing unavailable",             "This company may not be publicly listed or its filing is not available."],
  [["Indian company"],                       "Indian company data unavailable",      "Try with .NS or .BO suffix — e.g. RELIANCE.NS"],
  [["timeout","network"],                    "SEC servers are slow",                 "Retry in 30 seconds."],
];
const getError = (msg) => {
  if (!msg) return ["Something went wrong", "Please try again."];
  const match = ERROR_MAP.find(([keys]) => keys.some(k => msg.includes(k)));
  return match ? [match[1], match[2]] : ["Analysis could not complete", "Check the ticker format or try again later."];
};

const FEED_ROWS = [
  { ticker: "NVDA",   label: "Nvidia Corp",              signal: "Revenue concentration risk",   dir: "warning", ts: "4 min ago" },
  { ticker: "TSLA",   label: "Tesla Inc",                signal: "SG&A expansion vs margin",     dir: "warning", ts: "11 min ago" },
  { ticker: "AMZN",   label: "Amazon.com Inc",           signal: "Analog: Alibaba 2018",         dir: "neutral", ts: "18 min ago" },
  { ticker: "META",   label: "Meta Platforms",           signal: "Capex inflection point",       dir: "up",      ts: "26 min ago" },
  { ticker: "MSFT",   label: "Microsoft Corp",           signal: "Structural confidence: High",  dir: "up",      ts: "33 min ago" },
  { ticker: "AAPL",   label: "Apple Inc",                signal: "Cash deployment pattern",      dir: "neutral", ts: "41 min ago" },
];

const SAMPLE_THESIS = {
  company: "Nvidia Corp",
  ticker: "NVDA",
  steps: [
    "Data center revenue now represents 87% of total — a concentration signature last seen in Qualcomm (2014–2015).",
    "R&D as % of revenue has compressed 4pp YoY even as headcount expanded — efficiency signal, or margin defense?",
    "Analog match: Intel (2000) exhibited identical COGS compression prior to a 3-year structural plateau.",
    "The pattern implies a peak-efficiency phase is proximate. The structure does not yet confirm deterioration.",
  ],
  conclusion: "Near-term revenue growth likely sustainable; structural fragility emerges in 18–24 months if hyperscaler concentration persists.",
};

const SAMPLE_ANALOG = {
  company: "Netflix",
  year: 2011,
  summary: "Rapid subscriber growth masking content cost inflation — resolved via price restructuring and international expansion.",
  match: 74,
};

function SectionHead({ label, title, isMobile, t, style = {} }) {
  return (
    <motion.div
      variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
      style={{ marginBottom: 16, ...style }}
    >
      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
        {label}
      </p>
      <h2 className="ft-serif" style={{ fontSize: isMobile ? 20 : 24, fontWeight: 400, margin: 0, letterSpacing: "-0.3px", color: t.text }}>
        {title}
      </h2>
    </motion.div>
  );
}

function FeedRow({ ticker, signal, dir, ts, t, delay = 0 }) {
  const dotColor = dir === "up" ? t.positive : dir === "warning" ? t.warning : t.textMuted;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: EASE_OUT_EXPO }}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 20px",
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2.8 + delay, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, flexShrink: 0 }}
      />
      <span className="ft-sans" style={{ fontSize: 10, fontWeight: 700, color: t.textSub, letterSpacing: "0.06em", minWidth: 42, flexShrink: 0 }}>
        {ticker}
      </span>
      <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {signal}
      </span>
      <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, flexShrink: 0, letterSpacing: "0.02em" }}>
        {ts}
      </span>
    </motion.div>
  );
}

const confStyle = (conf, t) => {
  if (conf === "High") return { bg: t.positiveBg, border: `${t.positive}55`, label: t.positive };
  if (conf === "Low")  return { bg: t.warningBg,  border: `${t.warning}55`,  label: t.warning  };
  return { bg: t.bgSubtle, border: t.border, label: t.textSub };
};

const makeCardVariants = (isMobile) => ({
  hidden:  { opacity: 0, y: isMobile ? 9 : 18 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
});

function PreSearchWorkspace({ t, isMobile, onSearch, loading }) {
  return (
    <motion.div
      key="pre-search"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      style={{ display: "flex", flexDirection: "column", gap: isMobile ? 48 : 64 }}
    >

      <motion.section
        variants={v(MV.heroC)} initial="hidden" animate="visible"
        style={{ paddingTop: isMobile ? 36 : 64, textAlign: "center" }}
      >
        <motion.p
          variants={v(MV.heroCh)}
          className="ft-sans"
          style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.9px", textTransform: "uppercase", margin: "0 0 18px" }}
        >
          Structural intelligence · SEC filings
        </motion.p>

        <motion.h1
          variants={v(MV.heroCh)}
          className="ft-serif"
          style={{
            fontSize: isMobile ? 30 : 46,
            fontWeight: 400,
            margin: "0 0 14px",
            letterSpacing: "-0.5px",
            color: t.text,
            lineHeight: 1.1,
          }}
        >
          Understand the structural<br />
          condition behind the company.
        </motion.h1>

        <motion.p
          variants={v(MV.heroCh)}
          className="ft-sans"
          style={{
            fontSize: isMobile ? 13 : 14,
            color: t.textSub,
            fontWeight: 300,
            lineHeight: 1.7,
            margin: "0 auto 36px",
            maxWidth: 480,
          }}
        >
          Structural patterns, historical analogs, and reasoning chains — derived directly from SEC filings.
        </motion.p>

        <motion.div variants={v(MV.heroCh)} style={{ maxWidth: 600, margin: "0 auto" }}>
          <SearchBar
            t={t}
            onSearch={onSearch}
            onQueryChange={() => {}}
            loading={loading}
          />
        </motion.div>
      </motion.section>

<section>
        <SectionHead label="Live feed" title="Structural activity." isMobile={isMobile} t={t} />
        <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
          <div style={{
            background: t.bgSubtle, borderBottom: `1px solid ${t.border}`,
            padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive, flexShrink: 0 }}
              />
              <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
                System live · Structural signals updating
              </span>
            </div>
            <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>{FEED_ROWS.length} events</span>
          </div>
          <div>
            {FEED_ROWS.map((row, i) => (
              <FeedRow key={row.ticker} {...row} t={t} delay={i * 0.06} />
            ))}
          </div>
        </PremiumCard>
      </section>

<section>
        <SectionHead label="Sample thesis" title="What ForeTrace generates." isMobile={isMobile} t={t} />
        <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
          <div style={{
            background: t.bgSubtle, borderBottom: `1px solid ${t.border}`,
            padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
              Structural thesis · {SAMPLE_THESIS.company}
            </span>
            <span className="ft-sans" style={{ fontSize: 10, fontWeight: 700, background: t.text, color: t.bg, padding: "1px 7px", borderRadius: 3, letterSpacing: "0.3px" }}>
              SAMPLE
            </span>
          </div>

          <div style={{ padding: isMobile ? "20px 16px" : "28px 28px" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24 }}>
              {SAMPLE_THESIS.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.09, duration: 0.35, ease: EASE_OUT_EXPO }}
                  style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 22 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.bgMuted, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10, flexShrink: 0 }}>
                      <span className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted }}>0{i + 1}</span>
                    </div>
                    {i < SAMPLE_THESIS.steps.length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 16, background: t.border }} />
                    )}
                  </div>
                  <p className="ft-sans" style={{
                    fontSize: 12, color: t.textSub, lineHeight: 1.72, margin: 0,
                    paddingTop: 8, paddingBottom: i < SAMPLE_THESIS.steps.length - 1 ? 14 : 0,
                    fontWeight: 300,
                  }}>
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>

<div style={{
              borderTop: `1px solid ${t.border}`, paddingTop: 20,
              borderLeft: `2px solid ${t.text}`,
              paddingLeft: 16, marginLeft: 0,
            }}>
              <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>
                Structural thesis
              </p>
              <p className="ft-sans" style={{ fontSize: 13, color: t.text, lineHeight: 1.72, margin: 0, fontWeight: 400, fontStyle: "italic" }}>
                "{SAMPLE_THESIS.conclusion}"
              </p>
            </div>
          </div>
        </PremiumCard>
      </section>

<section>
        <SectionHead label="Analog engine" title="History doesn't repeat. But structure does." isMobile={isMobile} t={t} />
        <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
          <div style={{
            background: t.bgSubtle, borderBottom: `1px solid ${t.border}`,
            padding: "10px 20px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 5, height: 5, borderRadius: "50%", background: t.positive, flexShrink: 0 }}
            />
            <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
              Analog engine · Pattern match example
            </span>
          </div>

          <div style={{ padding: isMobile ? "20px 16px" : "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Structural similarities detected with
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                  <span className="ft-serif" style={{ fontSize: isMobile ? 18 : 22, color: t.text, fontWeight: 400 }}>
                    {SAMPLE_ANALOG.company}
                  </span>
                  <span className="ft-sans" style={{ fontSize: 12, color: t.textMuted }}>{SAMPLE_ANALOG.year}</span>
                </div>
                <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.72, margin: 0, fontWeight: 300, maxWidth: 480 }}>
                  {SAMPLE_ANALOG.summary}
                </p>
              </div>

              <div style={{
                background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: "16px 22px", textAlign: "center", flexShrink: 0,
              }}>
                <span className="ft-serif" style={{ fontSize: 28, color: t.text, display: "block", lineHeight: 1 }}>
                  {SAMPLE_ANALOG.match}%
                </span>
                <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginTop: 4, display: "block" }}>
                  structural match
                </span>
              </div>
            </div>

<div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
              <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, margin: 0, fontStyle: "italic" }}>
                The Analog Engine searches across 10,000+ historical SEC filings to surface structural predecessors.
              </p>
            </div>
          </div>
        </PremiumCard>
      </section>

<section>
        <SectionHead label="Platform capabilities" title="What the system sees." isMobile={isMobile} t={t} />
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 12,
        }}>
          {[
            { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",  label: "SEC filing analysis",      desc: "10-K structural signals extracted and classified." },
            { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",                                                                                                       label: "Historical analog engine", desc: "Pattern-matched across 10,000+ filings." },
            { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Structural thesis synthesis", desc: "Numbered reasoning chain with institutional-grade conclusions." },
            { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",                                                                                          label: "Real-time structural feed",  desc: "Live behavioral signals across the ecosystem." },
          ].map(({ icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              <PremiumCard t={t} style={{ background: t.bgCard, padding: isMobile ? "18px 16px" : "20px 22px" }} noLift>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    <Icon path={icon} size={16} color={t.textSub} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="ft-sans" style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 5 }}>
                      {label}
                    </span>
                    <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.65, fontWeight: 300 }}>
                      {desc}
                    </span>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      </section>

    </motion.div>
  );
}

function ActiveWorkspace({ result, state, loading, error, step, t, isMobile, onSearch, onSaveWatchlist }) {
  const cardVariants = makeCardVariants(isMobile);
  const [errTitle, errHint] = getError(error);

  return (
    <motion.div
      key="active-workspace"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      style={{ display: "flex", flexDirection: "column", gap: isMobile ? 36 : 48 }}
    >

      <motion.div variants={v(MV.fadeUp)} initial="hidden" animate="visible">
        <SearchBar
          t={t}
          onSearch={onSearch}
          onQueryChange={() => {}}
          loading={loading}
        />
      </motion.div>

<AnimatePresence>
        {error && (
          <motion.div variants={v(MV.fadeUp)} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            <PremiumCard t={t} style={{ background: t.warningBg }} noLift>
              <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" size={14} color={t.warning} strokeWidth={1.8} />
                <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.warning, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>Analysis error</p>
              </div>
              <div style={{ padding: isMobile ? "20px 16px" : "20px 24px" }}>
                <p className="ft-sans" style={{ fontSize: 13, fontWeight: 600, color: t.warning, margin: "0 0 6px" }}>{errTitle}</p>
                <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{errHint}</p>
              </div>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

<AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          >
            <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
              <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive, flexShrink: 0 }}
                  />
                  <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
                    Analyzing {state?.companyName || state?.ticker}
                  </span>
                </div>
                <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>{step + 1} / {STEPS.length}</span>
              </div>

<div style={{ height: 2, background: t.bgMuted, overflow: "hidden" }}>
                <motion.div
                  animate={{ scaleX: (step + 1) / STEPS.length }}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  style={{ height: "100%", background: t.text, transformOrigin: "0%", borderRadius: 0 }}
                />
              </div>

<div style={{ padding: isMobile ? "20px 16px" : "24px 28px" }}>
                {STEPS.map((label, i) => {
                  const isPast   = i < step;
                  const isActive = i === step;
                  return (
                    <div key={i} style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 24 }}>
                        <motion.div
                          animate={{ background: isPast ? t.positive : isActive ? t.text : t.bgMuted, scale: isActive ? 1.1 : 1 }}
                          transition={{ duration: 0.25 }}
                          style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8, flexShrink: 0 }}
                        >
                          <motion.span animate={{ color: isPast || isActive ? t.bg : t.textMuted }} className="ft-sans" style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>
                            {isPast ? "✓" : i + 1}
                          </motion.span>
                        </motion.div>
                        {i < STEPS.length - 1 && (
                          <motion.div animate={{ background: isPast ? t.positive : t.border }} transition={{ duration: 0.4 }} style={{ width: 1, flex: 1, minHeight: 20 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: i < STEPS.length - 1 ? 14 : 0, paddingTop: 7, flex: 1, borderLeft: isActive ? `2px solid ${t.text}` : "2px solid transparent", paddingLeft: isActive ? 10 : 0, transition: "border-color 0.2s, padding-left 0.2s" }}>
                        <motion.span
                          animate={{ color: isPast ? t.positive : isActive ? t.text : t.textMuted }}
                          className="ft-sans"
                          style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, lineHeight: 1.4, display: "block" }}
                        >
                          {label}
                        </motion.span>
                        {isActive && (
                          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 3.4, ease: "linear" }}
                            style={{ height: 1, background: t.border, transformOrigin: "0%", marginTop: 6, borderRadius: 1 }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
          </motion.div>
        )}
      </AnimatePresence>

<AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.company}
            style={{ display: "flex", flexDirection: "column", gap: isMobile ? 36 : 48 }}
          >

            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
                    Structural analysis
                  </p>
                  <h1 className="ft-serif" style={{ fontSize: isMobile ? 26 : 38, fontWeight: 400, margin: 0, letterSpacing: "-0.4px", color: t.text, lineHeight: 1.08 }}>
                    {result.company}
                  </h1>
                  {state?.ticker && (
                    <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, marginTop: 6, display: "block", letterSpacing: "0.3px" }}>
                      {state.ticker} · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
                <motion.button
                  onClick={onSaveWatchlist}
                  whileHover={{ borderColor: t.borderHover }} transition={{ duration: 0.12 }}
                  className="ft-sans"
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 500, cursor: "pointer", color: t.textSub, fontFamily: "'DM Sans',sans-serif", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon path="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" size={13} color={t.textMuted} />
                  + Watchlist
                </motion.button>
              </div>
            </motion.div>

            <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
              <div style={{ borderTop: `1px solid ${t.border}` }} />
            </motion.div>

{(() => {
              const bs   = result.behavioral_summary || {};
              const conf = bs.confidence || "Moderate";
              const cc   = confStyle(conf, t);
              return (
                <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
                  <PremiumCard t={t} style={{ background: cc.bg }} noLift>
                    <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
                        Analysis confidence
                      </p>
                      <span className="ft-sans" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: cc.label, background: `${cc.label}18`, border: `1px solid ${cc.label}44`, padding: "1px 8px", borderRadius: 3, textTransform: "uppercase" }}>
                        {conf}
                      </span>
                    </div>
                    {bs.confidence_reason && (
                      <div style={{ padding: isMobile ? "14px 16px" : "14px 20px" }}>
                        <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                          {bs.confidence_reason}
                        </p>
                      </div>
                    )}
                  </PremiumCard>
                </motion.div>
              );
            })()}

<motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
              <SectionHead label="Behavioral summary" title="What is actually happening." isMobile={isMobile} t={t} />
              <CompanyProfile data={result} t={t} />
            </motion.div>

            {result.market_position && (
              <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Market position" title="Sector standing & momentum." isMobile={isMobile} t={t} />
                <MarketPositionCard data={result.market_position} t={t} />
              </motion.div>
            )}

            {result.structural_signals?.length > 0 && (
              <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Reasoning engine" title="Not a score. A chain of evidence." isMobile={isMobile} t={t} />
                <ReasoningChainCard signals={result.structural_signals} companyName={result.company} t={t} isMobile={isMobile} />
              </motion.div>
            )}

            {(result.structural_thesis || result.reasoning_steps?.length > 0) && (
              <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Structural thesis" title="What the evidence implies." isMobile={isMobile} t={t} />
                <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
                  <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
                      Reasoning chain · {result.analogs?.length || 0} analog inputs
                    </span>
                  </div>

                  <div style={{ padding: isMobile ? "20px 16px" : "28px 28px" }}>

                    {result.reasoning_steps?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 28 }}>
                        {result.reasoning_steps.map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.35, ease: EASE_OUT_EXPO }}
                            style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 22 }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.bgMuted, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10, flexShrink: 0 }}>
                                <span className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted }}>0{i + 1}</span>
                              </div>
                              {i < result.reasoning_steps.length - 1 && (
                                <div style={{ width: 1, flex: 1, minHeight: 16, background: t.border }} />
                              )}
                            </div>
                            <p className="ft-sans" style={{
                              fontSize: 12, color: t.textSub, lineHeight: 1.72, margin: 0,
                              paddingTop: 8, paddingBottom: i < result.reasoning_steps.length - 1 ? 14 : 0,
                              fontWeight: 300,
                            }}>
                              {step}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}

{result.structural_thesis && (
                      <div style={{
                        borderTop: result.reasoning_steps?.length > 0 ? `1px solid ${t.border}` : "none",
                        paddingTop: result.reasoning_steps?.length > 0 ? 20 : 0,
                        borderLeft: `2px solid ${t.text}`,
                        paddingLeft: 16,
                      }}>
                        <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>
                          Structural thesis
                        </p>
                        <p className="ft-sans" style={{ fontSize: 13, color: t.text, lineHeight: 1.72, margin: 0, fontWeight: 400, fontStyle: "italic" }}>
                          "{result.structural_thesis}"
                        </p>
                      </div>
                    )}
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            {result.risk_signals?.length > 0 && (
              <motion.div custom={2.5} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Risk signals" title="Vulnerabilities & structural threats." isMobile={isMobile} t={t} />
                <RiskSignalsCard signals={result.risk_signals} t={t} />
              </motion.div>
            )}

            {result.relationship_context && result.relationship_context.insight && (
              <motion.div custom={2.7} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Relationship Context" title="Dependencies and ecosystem." isMobile={isMobile} t={t} />
                <RelationshipContextCard data={result.relationship_context} t={t} />
              </motion.div>
            )}

            <motion.div custom={7.5} variants={cardVariants} initial="hidden" animate="visible">
              <SectionHead label="Market landscape" title="Broader structural shifts." isMobile={isMobile} t={t} />
              <MarketPulseMatrix t={t} isMobile={isMobile} />
            </motion.div>

            {result.analogs?.length > 0 && (
              <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Analog engine" title="History doesn't repeat. But structure does." isMobile={isMobile} t={t} />
                <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
                  <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <motion.div animate={{ opacity: [1, 0.45, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive, flexShrink: 0 }} />
                      <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
                        Analog Engine · Structural match report
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>{result.match_count || (result.analogs && result.analogs[0]?.matchCount) || 2} matches found</span>
                      <span className="ft-sans" style={{ fontSize: 9, fontWeight: 700, background: t.text, color: t.bg, padding: "1px 7px", borderRadius: 3, letterSpacing: "0.3px" }}>PRO</span>
                    </div>
                  </div>
                  <div style={{ padding: isMobile ? "20px 16px" : "24px 28px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                      {result.analogs.map((a, i) => <AnalogCard key={i} analog={a} t={t} />)}
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            {result.mitigation_levers?.length > 0 && (
              <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
                <SectionHead label="Strategic levers" title="What this company can do." isMobile={isMobile} t={t} />
                <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
                  <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px" }}>
                    <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
                      Mitigation levers · {result.mitigation_levers.length} identified
                    </p>
                  </div>
                  <div style={{ padding: isMobile ? "20px 16px" : "24px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
                    {result.mitigation_levers.map((lever, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ delay: i * 0.07, duration: 0.35, ease: EASE_OUT_EXPO }}
                      >
                        {i > 0 && <div style={{ borderTop: `1px solid ${t.border}`, margin: "20px 0" }} />}
                        <div style={{ display: "flex", gap: isMobile ? 14 : 20, alignItems: "flex-start" }}>
                          <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, flexShrink: 0, paddingTop: 2, minWidth: 24, fontVariantNumeric: "tabular-nums" }}>
                            0{i + 1}
                          </span>
                          <div style={{ flex: 1 }}>
                            <span className="ft-sans" style={{ fontSize: 13, fontWeight: 600, color: t.text, display: "block", marginBottom: 6 }}>
                              {lever.lever}
                            </span>
                            <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: "0 0 12px", fontWeight: 300 }}>
                              {lever.rationale}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {lever.analog_basis && (
                                <div style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 6, padding: "8px 12px" }}>
                                  <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>Based on</p>
                                  <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, lineHeight: 1.6, fontWeight: 300 }}>{lever.analog_basis}</span>
                                </div>
                              )}
                              {lever.risk_if_ignored && (
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                  <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" size={13} color={t.warning} strokeWidth={1.8} />
                                  <span className="ft-sans" style={{ fontSize: 11, color: t.warning, lineHeight: 1.55 }}>{lever.risk_if_ignored}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </PremiumCard>
              </motion.div>
            )}

            <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
              <SectionHead label="Live feed" title="Structural activity continues." isMobile={isMobile} t={t} />
              <PremiumCard t={t} style={{ background: t.bgCard }} noLift>
                <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: t.positive, flexShrink: 0 }} />
                    <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>System live · Other companies analyzed</span>
                  </div>
                </div>
                <div>
                  {FEED_ROWS.filter(r => r.ticker !== state?.ticker).slice(0, 4).map((row, i) => (
                    <FeedRow key={row.ticker} {...row} t={t} delay={i * 0.05} />
                  ))}
                </div>
              </PremiumCard>
            </motion.div>

            <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible">
              <PremiumCard t={t} style={{ background: t.bgSubtle }}>
                <div style={{ padding: isMobile ? "24px 16px" : "32px 36px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 32, justifyContent: "space-between" }}>
                  <div>
                    <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>
                      Continue exploring
                    </p>
                    <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, margin: 0, lineHeight: 1.65, fontWeight: 300 }}>
                      Run a new analysis or monitor this company's structural signals over time.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, width: isMobile ? "100%" : "auto" }}>
                    <motion.button
                      whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                      className="ft-sans"
                      onClick={() => document.querySelector("input")?.focus()}
                      style={{ background: t.text, color: t.bg, border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: isMobile ? "100%" : "auto", textAlign: "center" }}
                    >
                      Analyze another company →
                    </motion.button>
                    <motion.button
                      onClick={onSaveWatchlist}
                      whileHover={{ borderColor: t.borderHover }}
                      className="ft-sans"
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 22px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", color: t.textSub, width: isMobile ? "100%" : "auto", textAlign: "center" }}
                    >
                      Add to watchlist
                    </motion.button>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const { state }  = useLocation();
  const w          = useWindowWidth();
  const isMobile   = w < 640;

  const { t } = useTheme();

  // ── Analysis state ──────────────────────────────────────────────────────
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(0);
  const [error,   setError]   = useState(null);
  const [activeTicker, setActiveTicker] = useState(state?.ticker || null);
  const [activeCompany, setActiveCompany] = useState(state?.companyName || null);
  const timer = useRef(null);
  const socketRef = useRef(null);

  const runAnalysis = useCallback(async (ticker, companyName) => {
    setActiveTicker(ticker);
    setActiveCompany(companyName);
    setLoading(true);
    setError(null);
    setResult(null);
    setStep(0);

    if (timer.current) clearInterval(timer.current);
    if (socketRef.current) socketRef.current.close();

    let wsConnected = false;
    let fallbackTriggered = false;

    // fallback if ws blocked by firewall/proxy
    const triggerHttpFallback = async () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      console.log("WebSocket failed or timed out. Falling back to REST API.");

      let s = 0;
      timer.current = setInterval(() => {
        s += 1;
        if (s < STEPS.length) setStep(s); else clearInterval(timer.current);
      }, 3500);

      try {
        const res = await fetch(`${API_BASE}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_name: companyName, ticker }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.detail || "server_error");
        }
        setResult(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        if (timer.current) clearInterval(timer.current);
        setLoading(false);
      }
    };

    try {
      // try ws first for live pipeline progress
      const wsUrl = `${WS_BASE}/ws/analyze/${ticker.toUpperCase()}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      const connTimeout = setTimeout(() => {
        if (!wsConnected) {
          ws.close();
          triggerHttpFallback();
        }
      }, 2000);

      ws.onopen = () => {
        wsConnected = true;
        clearTimeout(connTimeout);
        ws.send(JSON.stringify({ company_name: companyName, ticker }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "step") {
            // step maps to STEPS index (0: SEC, 1: L1 engines, 2: L2 engines, 3: synthesis)
            setStep(msg.step);
          } else if (msg.type === "result") {
            setResult(msg.data);
            setLoading(false);
            ws.close();
          } else if (msg.type === "error") {
            setError(msg.message);
            setLoading(false);
            ws.close();
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        clearTimeout(connTimeout);
        triggerHttpFallback();
      };

      ws.onclose = () => {
        socketRef.current = null;
      };

    } catch (e) {
      console.error("WebSocket initialization failed:", e);
      triggerHttpFallback();
    }
  }, []);

  // Kick off if arriving from router state (e.g. from HomePage) or URL query parameters
  useEffect(() => {
    let timerId;
    const params = new URLSearchParams(window.location.search);
    const qTicker = params.get("ticker");
    const qName = params.get("name");

    const activeTick = state?.ticker || qTicker;
    const activeNm = state?.companyName || qName;

    if (activeTick) {
      timerId = setTimeout(() => {
        runAnalysis(activeTick, activeNm || activeTick);
      }, 0);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
      if (timer.current) clearInterval(timer.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [state?.ticker, state?.companyName, runAnalysis]);

  const saveToWatchlist = () => {
    // This is one of those "works for now" moments.
    if (!activeTicker) return;
    const saved = JSON.parse(localStorage.getItem("foretrace_watchlist") || "[]");
    if (saved.find(c => c.ticker === activeTicker)) return;
    saved.push({ ticker: activeTicker, name: activeCompany, savedAt: new Date().toLocaleDateString("en-IN") });
    localStorage.setItem("foretrace_watchlist", JSON.stringify(saved));
    alert(`${activeCompany} added to watchlist!`);
  };

  // Whether we're in "active" mode (a search has been initiated or completed)
  const isActive = !!activeTicker;

  const maxW = {
    maxWidth: 860,
    margin: "0 auto",
    padding: `0 ${isMobile ? 16 : 24}px`,
  };

  return (
    <div style={{ color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .ft-sans  { font-family: 'DM Sans','Inter',sans-serif; }
        .ft-serif { font-family: 'DM Serif Display','Georgia',serif; }
        .ft-mono  { font-family: 'DM Mono',monospace; }
        input::placeholder { color: ${t.textMuted}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 2px; }
      `}</style>

<div style={{ ...maxW, paddingTop: isMobile ? 28 : 44, paddingBottom: 100 }}>
        <AnimatePresence mode="wait">
          {!isActive ? (
            <PreSearchWorkspace
              key="pre"
              t={t}
              isMobile={isMobile}
              onSearch={(ticker, name) => runAnalysis(ticker, name)}
              loading={loading}
            />
          ) : (
            <ActiveWorkspace
              key="active"
              t={t}
              isMobile={isMobile}
              result={result}
              state={{ ticker: activeTicker, companyName: activeCompany }}
              loading={loading}
              error={error}
              step={step}
              onSearch={(ticker, name) => runAnalysis(ticker, name)}
              onSaveWatchlist={saveToWatchlist}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
