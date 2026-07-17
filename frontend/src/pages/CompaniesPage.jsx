import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { MV, v, EASE_OUT_EXPO } from "../styles/animations";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { PremiumCard, Icon, ConfidenceBar, Skeleton } from "../components/ui/UI";
import { Dot, Divider } from "../components/ui/Primitives";
import COMPANIES from "../companies.json";

// ─── Icon paths ────────────────────────────────────────────────────────────────
const SEARCH_PATH = "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z";
const ARROW_PATH  = "M5 12h14M12 5l7 7-7 7";
const CLOSE_PATH  = "M18 6L6 18M6 6l12 12";
const FILTER_PATH = "M3 6h18M7 12h10M11 18h2";
const GRID_PATH   = "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z";

// ─── Curated structural intelligence ──────────────────────────────────────────
// TODO: Replace this static, hardcoded map with a weekly background batch task
// feed from the backend. The backend should generate these cards periodically using
// the SEC parser pipeline and save them in a DB so this page is fully dynamic.
const COMPANY_PROFILES = {
  AAPL: {
    sector: "Consumer Technology",
    shift: "Converting 2.2B installed devices into a recurring revenue base — Services has become the margin engine that hardware never was.",
    signals: ["Revenue diversification", "Ecosystem lock-in"],
    moat: "strong", trajectory: "stable", confidence: 84, filing_period: "Q4 2024",
  },
  MSFT: {
    sector: "Enterprise Software",
    shift: "Azure's hyper-scale growth is reweighting Microsoft from a license business to a consumption-metered cloud utility — with AI inference now the fastest-growing line item.",
    signals: ["Cloud metering", "AI monetization"],
    moat: "strong", trajectory: "growing", confidence: 91, filing_period: "Q1 2025",
  },
  GOOGL: {
    sector: "Digital Advertising",
    shift: "Search remains 57% of revenue but faces structural pressure from AI answer engines — Google is simultaneously its own disruption risk and hedge via Gemini integration.",
    signals: ["Search cannibalization risk", "Cloud acceleration"],
    moat: "strong", trajectory: "stable", confidence: 78, filing_period: "Q3 2024",
  },
  AMZN: {
    sector: "Cloud & Commerce",
    shift: "AWS now generates more operating income than all of North American retail combined — Amazon's e-commerce arm is increasingly a customer acquisition funnel for cloud and ads.",
    signals: ["AWS margin dominance", "Ad revenue emergence"],
    moat: "strong", trajectory: "growing", confidence: 88, filing_period: "Q3 2024",
  },
  NVDA: {
    sector: "Semiconductors",
    shift: "Transitioned from GPU gaming vendor to the de facto infrastructure tax on AI — data center now exceeds 85% of revenue, with the CUDA ecosystem locking in switching costs at the software layer.",
    signals: ["AI infrastructure monopoly", "CUDA software moat"],
    moat: "strong", trajectory: "growing", confidence: 93, filing_period: "Q2 2025",
  },
  META: {
    sector: "Digital Advertising",
    shift: "After a $46B 'year of efficiency,' Meta re-emerged with operating margins above 38% — Reality Labs losses are contained bets, not the core story. The core story is AI-driven ad-tech precision.",
    signals: ["Margin recovery", "AI ad targeting"],
    moat: "strong", trajectory: "growing", confidence: 82, filing_period: "Q3 2024",
  },
  TSLA: {
    sector: "Electric Vehicles",
    shift: "Gross margin compression from aggressive price cuts reveals Tesla's shift from scarcity-premium to volume play — the question is whether software and energy can offset auto margin erosion.",
    signals: ["Margin compression", "Energy segment emerging"],
    moat: "moderate", trajectory: "stable", confidence: 61, filing_period: "Q3 2024",
  },
  JPM: {
    sector: "Financial Services",
    shift: "Rate environment tailwinds inflated NII to record levels — but deposit repricing risk and credit normalization signal that 2024's earnings quality may not be repeatable at scale.",
    signals: ["NII peak risk", "Credit normalization"],
    moat: "strong", trajectory: "stable", confidence: 74, filing_period: "Q3 2024",
  },
  NFLX: {
    sector: "Streaming Media",
    shift: "Password sharing crackdown added 30M+ subscribers in 12 months — Netflix is now proving that a scaled streaming business can compound on itself without content spend scaling linearly.",
    signals: ["Subscriber re-acceleration", "Ad tier monetization"],
    moat: "strong", trajectory: "growing", confidence: 85, filing_period: "Q3 2024",
  },
  CSCO: {
    sector: "Enterprise Networking",
    shift: "Acquiring Splunk for $28B signals Cisco's pivot from hardware-refresh cycles to security observability subscriptions — hardware revenues are declining while ARR becomes the new north star.",
    signals: ["Hardware-to-SaaS pivot", "Security expansion"],
    moat: "moderate", trajectory: "stable", confidence: 67, filing_period: "Q1 2025",
  },
  ORCL: {
    sector: "Enterprise Software",
    shift: "OCI is growing at 50%+ YoY from a small base — Oracle is using database licensing lock-in as the forcing function to migrate customers to its cloud, compressing churn risk structurally.",
    signals: ["Cloud database migration", "OCI hyper-growth"],
    moat: "strong", trajectory: "growing", confidence: 79, filing_period: "Q2 2025",
  },
  INTC: {
    sector: "Semiconductors",
    shift: "Intel is burning capital to rebuild manufacturing competency it ceded to TSMC over a decade — the foundry bet requires $100B+ in capex with profitability gated to 18A node yield rates.",
    signals: ["Foundry turnaround risk", "Market share erosion"],
    moat: "weak", trajectory: "declining", confidence: 44, filing_period: "Q3 2024",
  },
  ADBE: {
    sector: "Creative Software",
    shift: "Generative AI is both Adobe's biggest opportunity and its existential question — Firefly integration defends the platform, but usage-based pricing could disrupt its per-seat subscription model.",
    signals: ["AI feature integration", "Pricing model risk"],
    moat: "strong", trajectory: "stable", confidence: 73, filing_period: "Q3 2024",
  },
  CRM: {
    sector: "Enterprise Software",
    shift: "Activist pressure forced Salesforce into margin expansion mode — EBIT margins nearly doubled in two years, revealing how much growth-era cost inflation had been obscuring real earnings power.",
    signals: ["Profitability pivot", "AI agent monetization"],
    moat: "strong", trajectory: "growing", confidence: 77, filing_period: "Q2 2025",
  },
  V: {
    sector: "Financial Services",
    shift: "Visa's business is structurally insulated from credit cycles because it takes zero credit risk — cross-border volume recovery post-COVID is now a durable revenue tailwind with 40%+ flow-through.",
    signals: ["Cross-border recovery", "Zero credit-risk model"],
    moat: "strong", trajectory: "stable", confidence: 89, filing_period: "Q4 2024",
  },
  WMT: {
    sector: "Consumer Retail",
    shift: "Walmart's advertising business ($3.4B ARR) and Walmart+ membership are rerating the company from a low-margin retailer to a data-monetization platform hiding in plain sight.",
    signals: ["Ad revenue emergence", "Membership flywheel"],
    moat: "strong", trajectory: "growing", confidence: 80, filing_period: "Q3 2024",
  },
  DIS: {
    sector: "Entertainment",
    shift: "Disney+ achieved profitability after $11B in cumulative streaming losses — bundling with Hulu and ESPN+ is simultaneously reducing churn and raising ARPU without increasing content spend.",
    signals: ["Streaming profitability", "Bundle consolidation"],
    moat: "moderate", trajectory: "growing", confidence: 66, filing_period: "Q4 2024",
  },
  COST: {
    sector: "Consumer Retail",
    shift: "Costco's merchandise margin is structurally near zero by design — its entire profit model rests on $4.6B in annual membership fees, making it a subscription business wearing a retailer's clothes.",
    signals: ["Membership fee dependency", "Volume purchasing power"],
    moat: "strong", trajectory: "stable", confidence: 87, filing_period: "Q4 2024",
  },
  BAC: {
    sector: "Financial Services",
    shift: "Bank of America held the largest unrealized losses in its AFS bond portfolio during the rate spike — its liability-sensitive positioning made it uniquely exposed to the fastest tightening cycle in 40 years.",
    signals: ["Rate sensitivity exposure", "NII normalization"],
    moat: "moderate", trajectory: "stable", confidence: 58, filing_period: "Q3 2024",
  },
  NKE: {
    sector: "Consumer Brands",
    shift: "Nike over-indexed on DTC during the pandemic, disrupting wholesale relationships built over decades — a return to wholesale-led distribution is now the recovery thesis the market is pricing in.",
    signals: ["DTC rebalancing", "China revenue risk"],
    moat: "strong", trajectory: "declining", confidence: 55, filing_period: "Q1 2025",
  },
  AVGO: {
    sector: "Semiconductors",
    shift: "Broadcom's VMware acquisition added $8B in software ARR — the chip-to-software revenue ratio is reweighting as the installed VMware base gets converted to a subscription model at scale.",
    signals: ["M&A-driven software pivot", "Enterprise lock-in"],
    moat: "strong", trajectory: "growing", confidence: 83, filing_period: "Q3 2024",
  },
  AMD: {
    sector: "Semiconductors",
    shift: "AMD's MI300X data center GPU is capturing AI training and inference spend from customers seeking NVIDIA alternatives — while CPU market share gains against Intel compound in parallel.",
    signals: ["AI GPU ramp", "x86 share gains"],
    moat: "moderate", trajectory: "growing", confidence: 76, filing_period: "Q3 2024",
  },
  NOW: {
    sector: "Enterprise Software",
    shift: "ServiceNow's platform is becoming the workflow orchestration layer between enterprise systems of record — AI agents plugged into this layer could 10x automation density per customer seat.",
    signals: ["AI workflow expansion", "Platform consolidation"],
    moat: "strong", trajectory: "growing", confidence: 86, filing_period: "Q3 2024",
  },
  PLTR: {
    sector: "Data Analytics",
    shift: "US commercial revenue is accelerating after years of government-dominated mix — AIP (AI Platform) is creating a second growth curve driven by enterprise AI deployment urgency.",
    signals: ["Commercial inflection", "AIP adoption"],
    moat: "moderate", trajectory: "growing", confidence: 69, filing_period: "Q3 2024",
  },
  MA: {
    sector: "Financial Services",
    shift: "Mastercard's value-added services segment — analytics, cybersecurity, loyalty — is growing faster than core transaction processing, diversifying revenue beyond the pure payment rail.",
    signals: ["Services layer growth", "Payments rail durability"],
    moat: "strong", trajectory: "growing", confidence: 88, filing_period: "Q3 2024",
  },
  INTU: {
    sector: "Enterprise Software",
    shift: "Intuit's acquisition of Credit Karma and Mailchimp turned a tax software company into a financial data platform — the cross-sell opportunity across 100M+ consumer tax filers is structurally undermonetized.",
    signals: ["Platform cross-sell", "SMB fintech expansion"],
    moat: "strong", trajectory: "growing", confidence: 81, filing_period: "Q1 2025",
  },
};

// ─── Sector taxonomy ─────────────────────────────────────────────────────────
const SECTORS = ["All", "Technology", "Finance", "Healthcare", "Consumer", "Energy", "Industrial"];

const SECTOR_MAP = {
  "Consumer Technology": "Technology",
  "Enterprise Software": "Technology",
  "Semiconductors": "Technology",
  "Digital Advertising": "Technology",
  "Streaming Media": "Technology",
  "Enterprise Networking": "Technology",
  "Creative Software": "Technology",
  "Data Analytics": "Technology",
  "Cloud & Commerce": "Technology",
  "Financial Services": "Finance",
  "Electric Vehicles": "Technology",
  "Consumer Retail": "Consumer",
  "Entertainment": "Consumer",
  "Consumer Brands": "Consumer",
  "Healthcare": "Healthcare",
  "Energy": "Energy",
  "Industrial": "Industrial",
};

function getBroadSector(profileSector) {
  return SECTOR_MAP[profileSector] || "Technology";
}

// ─── Color helpers ───────────────────────────────────────────────────────────
function moatColor(moat, t) {
  if (moat === "strong")   return t.positive;
  if (moat === "moderate") return t.warning;
  return t.textMuted;
}

function trajectoryColor(trajectory, t) {
  if (trajectory === "growing")   return t.positive;
  if (trajectory === "declining") return t.warning;
  return t.textSub;
}

function trajectoryArrow(trajectory) {
  if (trajectory === "growing")   return "↑";
  if (trajectory === "declining") return "↓";
  return "→";
}

// ─── Shimmer skeleton card ────────────────────────────────────────────────────
function SkeletonCard({ t }) {
  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${t.border}`,
      background: t.bgCard, padding: "22px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Skeleton w="55%" h={13} radius={5} t={t} />
        <Skeleton w={36} h={20} radius={10} t={t} />
      </div>
      <Skeleton w="30%" h={9} radius={3} t={t} />
      <div style={{ marginTop: 6 }}>
        <Skeleton w="26%" h={8} radius={3} t={t} />
        <div style={{ marginTop: 8 }}>
          <Skeleton w="100%" h={11} radius={4} t={t} />
        </div>
        <div style={{ marginTop: 5 }}>
          <Skeleton w="85%" h={11} radius={4} t={t} />
        </div>
        <div style={{ marginTop: 5 }}>
          <Skeleton w="60%" h={11} radius={4} t={t} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <Skeleton w={64} h={20} radius={10} t={t} />
        <Skeleton w={64} h={20} radius={10} t={t} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <Skeleton w="38%" h={8} radius={3} t={t} />
        <Skeleton w={52} h={4} radius={3} t={t} />
      </div>
    </div>
  );
}

// ─── Individual company card ─────────────────────────────────────────────────
function CompanyCard({ company, profile, t, isMobile, onClick }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });

  const hasProfile = Boolean(profile);
  const moatLabel = profile?.moat
    ? profile.moat.charAt(0).toUpperCase() + profile.moat.slice(1)
    : null;

  return (
    <motion.div
      ref={ref}
      variants={v(MV.fadeUp)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <PremiumCard t={t} glow style={{ background: t.bgCard }}>
        <div style={{
          padding: isMobile ? "18px 16px" : "22px 22px",
          display: "flex", flexDirection: "column",
        }}>

          {/* Card header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
              <p className="ft-serif" style={{
                fontSize: 15, fontWeight: 400, color: t.text,
                margin: "0 0 4px", lineHeight: 1.25,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {company.name}
              </p>
              {profile?.sector && (
                <span className="ft-sans" style={{
                  fontSize: 9, letterSpacing: "0.7px", textTransform: "uppercase",
                  color: t.textMuted, fontWeight: 600,
                }}>
                  {profile.sector}
                </span>
              )}
            </div>
            <span className="ft-mono" style={{
              fontSize: 10, color: t.textSub,
              background: t.bgSubtle, border: `1px solid ${t.border}`,
              borderRadius: 20, padding: "3px 9px",
              whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.3px",
            }}>
              {company.ticker}
            </span>
          </div>

          {/* Profiled companies: full structural card */}
          {hasProfile && (
            <>
              {/* Structural Shift */}
              <div style={{ margin: "10px 0 10px" }}>
                <p className="ft-sans" style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: "0.9px",
                  textTransform: "uppercase", color: t.textMuted, margin: "0 0 6px",
                }}>
                  Structural Shift
                </p>
                <p className="ft-sans" style={{
                  fontSize: 12, lineHeight: 1.7, color: t.textSub,
                  margin: 0, fontWeight: 300,
                }}>
                  {profile.shift}
                </p>
              </div>

              {/* Signal pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0 14px" }}>
                {profile.signals.slice(0, 2).map((sig) => (
                  <span key={sig} className="ft-sans" style={{
                    fontSize: 10, fontWeight: 500, color: t.textSub,
                    background: t.bgSubtle, border: `1px solid ${t.border}`,
                    borderRadius: 20, padding: "3px 10px",
                  }}>
                    {sig}
                  </span>
                ))}
              </div>

              <Divider t={t} style={{ marginBottom: 12 }} />

              {/* Bottom metrics */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", flexWrap: "wrap", gap: 8,
              }}>
                {/* Moat */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Dot color={moatColor(profile.moat, t)} size={6} />
                  <span className="ft-sans" style={{ fontSize: 10, color: t.textSub, fontWeight: 500 }}>
                    {moatLabel} moat
                  </span>
                </div>

                {/* Trajectory badge */}
                <span className="ft-sans" style={{
                  fontSize: 10, fontWeight: 600,
                  color: trajectoryColor(profile.trajectory, t),
                  background: profile.trajectory === "growing"
                    ? t.positiveBg
                    : profile.trajectory === "declining"
                    ? t.warningBg
                    : t.bgSubtle,
                  border: `1px solid ${trajectoryColor(profile.trajectory, t)}22`,
                  borderRadius: 4, padding: "2px 7px",
                }}>
                  {trajectoryArrow(profile.trajectory)} {profile.trajectory}
                </span>

                {/* Confidence */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <ConfidenceBar value={profile.confidence} t={t} width={42} label={false} />
                  <span className="ft-mono" style={{ fontSize: 9, color: t.textMuted }}>
                    {profile.confidence}%
                  </span>
                </div>
              </div>

              {/* Filing period + hover CTA */}
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="ft-mono" style={{ fontSize: 9, color: t.textMuted }}>
                  {profile.filing_period}
                </span>
                <AnimatePresence>
                  {hovered && (
                    <motion.span
                      className="ft-sans"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.16 }}
                      style={{
                        fontSize: 10, fontWeight: 600, color: t.textSub,
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      View Analysis
                      <Icon path={ARROW_PATH} size={10} color={t.textSub} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Fallback card for un-profiled companies */}
          {!hasProfile && (
            <div style={{ marginTop: 10 }}>
              <p className="ft-sans" style={{
                fontSize: 11, color: t.textMuted, margin: "0 0 10px", fontWeight: 300,
              }}>
                Structural analysis pending.
              </p>
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textSub }}>
                      Run Analysis
                    </span>
                    <Icon path={ARROW_PATH} size={10} color={t.textSub} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PremiumCard>
    </motion.div>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: "default",    label: "Default" },
  { key: "confidence", label: "Confidence ↓" },
  { key: "moat",       label: "Moat: Strong First" },
  { key: "trajectory", label: "Trajectory: Growing" },
];

const MOAT_RANK = { strong: 3, moderate: 2, weak: 1 };
const TRAJ_RANK = { growing: 3, stable: 2, declining: 1 };

function sortCompanies(list, sortKey) {
  const copy = [...list];
  if (sortKey === "confidence") {
    return copy.sort((a, b) =>
      (COMPANY_PROFILES[b.ticker]?.confidence ?? 0) - (COMPANY_PROFILES[a.ticker]?.confidence ?? 0)
    );
  }
  if (sortKey === "moat") {
    return copy.sort((a, b) =>
      (MOAT_RANK[COMPANY_PROFILES[b.ticker]?.moat] ?? 0) - (MOAT_RANK[COMPANY_PROFILES[a.ticker]?.moat] ?? 0)
    );
  }
  if (sortKey === "trajectory") {
    return copy.sort((a, b) =>
      (TRAJ_RANK[COMPANY_PROFILES[b.ticker]?.trajectory] ?? 0) - (TRAJ_RANK[COMPANY_PROFILES[a.ticker]?.trajectory] ?? 0)
    );
  }
  return copy;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const navigate = useNavigate();
  const { t } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();

  const [query,   setQuery]   = useState("");
  const [sector,  setSector]  = useState("All");
  const [sortKey, setSortKey] = useState("default");
  const [loading, setLoading] = useState(true);

  // Brief shimmer — data is static so this is just perceptual polish
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(id);
  }, []);

  const maxW = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: `0 ${isMobile ? 20 : 32}px`,
  };

  // Profiled companies appear first in default order
  const orderedCompanies = useMemo(() => {
    const profiled   = COMPANIES.filter(c => COMPANY_PROFILES[c.ticker]);
    const unprofiled = COMPANIES.filter(c => !COMPANY_PROFILES[c.ticker]);
    return [...profiled, ...unprofiled];
  }, []);

  const filtered = useMemo(() => {
    let list = orderedCompanies;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(c =>
        c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      );
    }

    if (sector !== "All") {
      list = list.filter(c => {
        const p = COMPANY_PROFILES[c.ticker];
        if (!p) return false;
        return getBroadSector(p.sector) === sector;
      });
    }

    return sortCompanies(list, sortKey);
  }, [orderedCompanies, query, sector, sortKey]);

  const gridCols = isMobile ? 1 : isTablet ? 2 : 3;

  const handleCardClick = (company) => {
    navigate("/AnalysisPage", {
      state: { ticker: company.ticker, companyName: company.name },
    });
  };

  return (
    <div style={{ color: t.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .ft-sans  { font-family: 'DM Sans','Inter',sans-serif; }
        .ft-serif { font-family: 'DM Serif Display','Georgia',serif; }
        .ft-mono  { font-family: 'DM Mono',monospace; }
        input::placeholder { color: ${t.textMuted}; }
        .cp-pill:hover { border-color: ${t.borderHover} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 2px; }
      `}</style>

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ ...maxW, paddingTop: isMobile ? 44 : 64, paddingBottom: isMobile ? 28 : 40 }}>
        <motion.div variants={v(MV.heroC)} initial="hidden" animate="visible">

          {/* Eyebrow label */}
          <motion.div variants={v(MV.heroCh)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: t.bgSubtle, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: "4px 13px", marginBottom: 20,
          }}>
            <Icon path={GRID_PATH} size={10} color={t.textMuted} />
            <span className="ft-sans" style={{
              fontSize: 10, fontWeight: 600, color: t.textMuted,
              letterSpacing: "0.9px", textTransform: "uppercase",
            }}>
              Company Browser
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1 variants={v(MV.heroCh)} className="ft-serif" style={{
            fontSize: isMobile ? 28 : 44,
            fontWeight: 400, margin: "0 0 14px",
            lineHeight: 1.12, letterSpacing: "-0.5px", color: t.text,
          }}>
            Structural signals<br />
            <span style={{ fontStyle: "italic", opacity: 0.7 }}>across the market</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={v(MV.heroCh)} className="ft-sans" style={{
            color: t.textSub, fontSize: isMobile ? 13 : 15,
            margin: "0 0 32px", lineHeight: 1.65, fontWeight: 300,
            maxWidth: 520,
          }}>
            Each card surfaces what's actually changing inside the business — not just what the company does.
          </motion.p>

          {/* Controls */}
          <motion.div variants={v(MV.heroCh)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Search bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: t.bgCard, border: `1px solid ${t.border}`,
              borderRadius: 10, padding: "10px 14px", maxWidth: 420,
            }}>
              <Icon path={SEARCH_PATH} size={14} color={t.textMuted} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or ticker…"
                className="ft-sans"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 13, color: t.text, fontFamily: "'DM Sans',sans-serif",
                }}
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery("")}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", padding: 2,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <Icon path={CLOSE_PATH} size={12} color={t.textMuted} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Sector pills + sort */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SECTORS.map(s => {
                  const active = sector === s;
                  return (
                    <button
                      key={s}
                      className="ft-sans cp-pill"
                      onClick={() => setSector(s)}
                      style={{
                        fontSize: 11, fontWeight: active ? 600 : 400,
                        color: active ? t.text : t.textSub,
                        background: active ? t.bgSubtle : "transparent",
                        border: `1px solid ${active ? t.borderHover : t.border}`,
                        borderRadius: 20, padding: "5px 13px",
                        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                        letterSpacing: "0.1px", transition: "all 0.14s",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Sort select */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon path={FILTER_PATH} size={12} color={t.textMuted} />
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value)}
                  className="ft-sans"
                  style={{
                    fontSize: 11, color: t.textSub,
                    background: t.bgCard, border: `1px solid ${t.border}`,
                    borderRadius: 7, padding: "5px 10px",
                    cursor: "pointer", outline: "none",
                    fontFamily: "'DM Sans',sans-serif",
                    appearance: "none", WebkitAppearance: "none",
                  }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Result count ─────────────────────────────────────── */}
      <div style={{ ...maxW, marginBottom: 14 }}>
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.p
              key={`${filtered.length}-${query}-${sector}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ft-sans"
              style={{ fontSize: 11, color: t.textMuted, margin: 0, fontWeight: 300 }}
            >
              {filtered.length} {filtered.length === 1 ? "company" : "companies"}
              {query && ` matching "${query}"`}
              {sector !== "All" && ` in ${sector}`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      <div style={{ ...maxW, paddingBottom: 100 }}>

        {/* Shimmer skeletons */}
        {loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 16,
          }}>
            {Array.from({ length: gridCols * 2 }).map((_, i) => (
              <SkeletonCard key={i} t={t} />
            ))}
          </div>
        )}

        {/* Company cards */}
        {!loading && filtered.length > 0 && (
          <motion.div
            variants={v(MV.stagger)}
            initial="hidden"
            animate="visible"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              gap: 16,
              alignItems: "start",
            }}
          >
            {filtered.map((company) => (
              <CompanyCard
                key={company.ticker}
                company={company}
                profile={COMPANY_PROFILES[company.ticker] || null}
                t={t}
                isMobile={isMobile}
                onClick={() => handleCardClick(company)}
              />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            style={{
              textAlign: "center",
              padding: isMobile ? "64px 24px" : "96px 48px",
            }}
          >
            <motion.div
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 52, height: 52, borderRadius: 14,
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Icon path={SEARCH_PATH} size={20} color={t.textMuted} />
            </motion.div>

            <p className="ft-serif" style={{
              fontSize: 20, fontWeight: 400, color: t.text,
              margin: "0 0 8px", letterSpacing: "-0.2px",
            }}>
              No companies match your filter.
            </p>
            <p className="ft-sans" style={{
              fontSize: 13, color: t.textMuted,
              margin: "0 0 24px", fontWeight: 300, lineHeight: 1.6,
            }}>
              Try a different search term or reset the sector filter.
            </p>
            <button
              className="ft-sans"
              onClick={() => { setQuery(""); setSector("All"); setSortKey("default"); }}
              style={{
                background: t.bgSubtle, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: "9px 20px",
                fontSize: 12, fontWeight: 500, color: t.textSub,
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Reset filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}