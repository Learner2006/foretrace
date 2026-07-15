import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MV, v } from "../styles/animations";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { Icon, PremiumCard } from "../components/ui/UI";
import { useTheme } from "../hooks/useTheme";

// TODO: This is good enough for the MVP. We'll make it prettier when users actually complain.
const FREE = ["4 analysis fields per company", "Basic structural summary", "3 searches per day", "Watchlist (up to 3 companies)"];
const PRO_ONLY = ["Historical analog comparisons", "Full 12-field deep analysis", "What could improve — AI suggestions", "Company vs company compare", "Structural forecast (12–24 months)", "Unlimited searches", "Unlimited watchlist", "Priority support"];
const FREE_FEATURES = [...FREE.map(label => ({ label, included: true })), ...PRO_ONLY.map(label => ({ label, included: false }))];

const PRO_HIGHLIGHTS = ["Full 12-field deep analysis", "Historical analog comparisons", "What could improve — AI suggestions", "Company vs company compare"];
const PRO_STANDARD = ["Structural forecast (12–24 months)", "Unlimited searches", "Unlimited watchlist", "Priority support", "Early access to new features", "Export reports as PDF", "API access (coming soon)"];
const PRO_FEATURES = [{ label: "Everything in Free", highlight: false }, ...PRO_HIGHLIGHTS.map(label => ({ label, highlight: true })), ...PRO_STANDARD.map(label => ({ label, highlight: false }))];

const FAQS = [
  { q: "What counts as a 'search' on the free plan?", a: "Each time you run an analysis on a company ticker counts as one search. Viewing previously cached results doesn't count." },
  { q: "What's included in the 'full deep analysis'?", a: "Pro unlocks 12 structural fields including historical analog matching, revenue concentration risk, R&D efficiency signals, margin trajectory analysis, and an AI-generated improvement thesis." },
  { q: "Can I cancel anytime?", a: "Yes — cancel anytime from your account settings. You keep Pro access until the end of your billing period." },
  { q: "Is this real financial advice?", a: "No. ForeTrace surfaces structural patterns from SEC filings. It's a research tool, not a financial advisor. Always do your own due diligence." },
  { q: "Do you support Indian markets?", a: "Currently we support US-listed companies via SEC filings. Indian market support (NSE/BSE) is on the roadmap." }
];

const TESTIMONIALS = [
  { name: "Arjun S.", role: "Equity Analyst", text: "The historical analog matching alone is worth it. Saved me hours of manual research on every coverage note." },
  { name: "Priya M.", role: "Portfolio Manager", text: "Finally a tool that reads the actual filings. The structural forecast called NVDA's concentration risk months before it was mainstream." },
  { name: "Daniel K.", role: "Seed-stage Investor", text: "I use the compare feature every week. Seeing two companies' structural trajectories side-by-side is genuinely useful." }
];

function FeatureRow({ label, included, highlight, t, isPro }) {
  const inc = isPro || included;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${t.border}`, opacity: inc ? 1 : 0.45 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1, background: isPro && highlight ? t.text : (inc ? t.bgSubtle : "transparent"), border: inc ? "none" : `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {inc ? <Icon path="M5 13l4 4L19 7" size={10} color={isPro && highlight ? t.bg : t.textSub} /> : <Icon path="M18 6L6 18M6 6l12 12" size={8} color={t.textMuted} />}
      </div>
      <span className="ft-sans" style={{ fontSize: 13, color: highlight ? t.text : t.textSub, fontWeight: highlight ? 500 : 400, lineHeight: 1.5 }}>
        {label}
        {highlight && <span style={{ marginLeft: 7, fontSize: 9, fontWeight: 700, background: t.text, color: t.bg, padding: "1px 5px", borderRadius: 3, letterSpacing: "0.3px", verticalAlign: "middle" }}>PRO</span>}
      </span>
    </div>
  );
}

function FaqItem({ q, a, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 12, textAlign: "left" }}>
        <span className="ft-sans" style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: 1.4 }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ flexShrink: 0 }}>
          <Icon path="M12 5v14M5 12h14" size={14} color={t.textMuted} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} style={{ overflow: "hidden" }}>
            <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, fontWeight: 300, paddingBottom: 16, margin: 0 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TestimonialCard({ name, role, text, t, delay }) {
  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ delay }}>
      <PremiumCard t={t} style={{ padding: "24px" }}>
        <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, fontWeight: 300, margin: "0 0 16px" }}>"{text}"</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.bgSubtle, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.textSub }}>{name[0]}</span>
          </div>
          <div>
            <span className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.text, display: "block" }}>{name}</span>
            <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>{role}</span>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}

export default function UpgradePage() {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { t } = useTheme();
  const [billing, setBilling] = useState("yearly");
  const [clicked, setClicked] = useState(false);

  const price = billing === "yearly" ? 12 : 19;
  const saving = Math.round((1 - 12 / 19) * 100);
  const maxW = { maxWidth: 860, margin: "0 auto", padding: `0 ${isMobile ? 20 : 32}px` };

  return (
    <div style={{ color: t.text }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ ...maxW, paddingTop: isMobile ? 48 : 72, paddingBottom: isMobile ? 48 : 64, textAlign: "center" }}>
          <motion.div variants={v(MV.heroC)} initial="hidden" animate="visible">
            <motion.div variants={v(MV.heroCh)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 20, padding: "4px 13px", marginBottom: 22 }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.positive || "#4CAF7D", display: "inline-block" }} />
              </motion.span>
              <span className="ft-sans" style={{ fontSize: 11, fontWeight: 500, color: t.textSub, letterSpacing: "0.4px" }}>Structural Intelligence — Unlocked</span>
            </motion.div>

            <motion.h1 variants={v(MV.heroCh)} className="ft-serif" style={{ fontSize: isMobile ? 32 : 52, fontWeight: 400, margin: "0 0 16px", lineHeight: 1.1, letterSpacing: "-0.5px", color: t.text }}>
              See the full picture<br /><em style={{ color: t.textSub, fontStyle: "italic" }}>behind every company.</em>
            </motion.h1>

            <motion.p variants={v(MV.heroCh)} className="ft-sans" style={{ color: t.textSub, fontSize: isMobile ? 13 : 15, margin: "0 auto 40px", lineHeight: 1.7, maxWidth: 420, fontWeight: 300 }}>
              Unlock historical analogs, deep structural analysis, and the compare tool. Built for investors who read the filings.
            </motion.p>

            <motion.div variants={v(MV.heroCh)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 40 }}>
              <span className="ft-sans" style={{ fontSize: 12, color: billing === "monthly" ? t.text : t.textMuted, fontWeight: billing === "monthly" ? 600 : 400 }}>Monthly</span>
              <motion.button onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: t.text, position: "relative", flexShrink: 0 }}>
                <motion.div animate={{ x: billing === "yearly" ? 22 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }} style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: t.bg }} />
              </motion.button>
              <span className="ft-sans" style={{ fontSize: 12, color: billing === "yearly" ? t.text : t.textMuted, fontWeight: billing === "yearly" ? 600 : 400 }}>Yearly</span>
              <AnimatePresence>
                {billing === "yearly" && (
                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="ft-sans" style={{ fontSize: 10, fontWeight: 700, background: t.positive || "#4CAF7D", color: "#fff", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.2px" }}>
                    SAVE {saving}%
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>

        <div style={{ ...maxW, marginBottom: isMobile ? 56 : 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 32, alignItems: "start" }}>
            <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
              <PremiumCard t={t} style={{ height: "100%" }}>
                <div style={{ padding: isMobile ? "24px 20px" : "32px 28px", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ marginBottom: 24 }}>
                    <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>Free</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                      <span className="ft-serif" style={{ fontSize: 42, fontWeight: 400, color: t.text, lineHeight: 1 }}>$0</span>
                      <span className="ft-sans" style={{ fontSize: 13, color: t.textMuted, paddingBottom: 6 }}>/month</span>
                    </div>
                    <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, margin: 0, fontWeight: 300, lineHeight: 1.5 }}>Get started with structural basics. No credit card needed.</p>
                  </div>
                  <div style={{ flex: 1, marginBottom: 24 }}>
                    {FREE_FEATURES.map((f, i) => <FeatureRow key={i} {...f} t={t} isPro={false} />)}
                  </div>
                  <motion.button onClick={() => navigate("/AnalysisPage")} whileHover={{ borderColor: t.borderHover }} whileTap={{ scale: 0.97 }} className="ft-sans" style={{ width: "100%", background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
                    Continue with Free
                  </motion.button>
                </div>
              </PremiumCard>
            </motion.div>

            <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.08 }}>
              <PremiumCard t={t} style={{ height: "100%", border: `1.5px solid ${t.text}`, position: "relative" }}>
                <div style={{ padding: isMobile ? "28px 20px 24px" : "36px 28px 32px", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                      <span className="ft-sans" style={{ background: t.text, color: t.bg, borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", whiteSpace: "nowrap" }}>MOST POPULAR</span>
                    </div>
                    <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>Pro</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
                      <AnimatePresence mode="wait">
                        <motion.span key={price} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }} className="ft-serif" style={{ fontSize: 42, fontWeight: 400, color: t.text, lineHeight: 1 }}>
                          ${price}
                        </motion.span>
                      </AnimatePresence>
                      <span className="ft-sans" style={{ fontSize: 13, color: t.textMuted, paddingBottom: 6 }}>/month</span>
                    </div>
                    {billing === "yearly" && <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, margin: "0 0 6px", fontWeight: 400 }}>Billed as ${price * 12}/year</p>}
                    <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, margin: 0, fontWeight: 300, lineHeight: 1.5 }}>Full structural intelligence. Everything ForeTrace is capable of.</p>
                  </div>
                  <div style={{ flex: 1, marginBottom: 24 }}>
                    {PRO_FEATURES.map((f, i) => <FeatureRow key={i} {...f} t={t} isPro={true} included={true} />)}
                  </div>
                  <motion.button onClick={() => setClicked(true)} whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }} className="ft-sans" style={{ width: "100%", background: t.text, color: t.bg, border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", letterSpacing: "-0.1px" }}>
                    {clicked ? "Coming soon — we'll notify you!" : `Get Pro — $${price}/mo`}
                  </motion.button>
                  <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, textAlign: "center", margin: "10px 0 0", fontWeight: 300 }}>Cancel anytime · No hidden fees</p>
                </div>
              </PremiumCard>
            </motion.div>
          </div>
        </div>

        <div style={{ ...maxW, marginBottom: isMobile ? 56 : 80 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>Compare plans</p>
            <h2 className="ft-serif" style={{ fontSize: isMobile ? 22 : 28, fontWeight: 400, margin: "0 0 28px", letterSpacing: "-0.3px", color: t.text }}>What you get with each plan</h2>
          </motion.div>

          <PremiumCard t={t}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", borderBottom: `1px solid ${t.border}`, padding: "12px 20px" }}>
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>Feature</span>
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textAlign: "center" }}>Free</span>
              <span className="ft-sans" style={{ fontSize: 11, color: t.text, fontWeight: 700, textAlign: "center" }}>Pro</span>
            </div>
            {[
              ["Structural analysis", "4 fields", "12 fields"],
              ["Searches per day", "3", "Unlimited"],
              ["Historical analog matches", "✗", "✓"],
              ["What could improve", "✗", "✓"],
              ["Company compare", "✗", "✓"],
              ["Structural forecast", "✗", "✓"],
              ["Watchlist", "3 companies", "Unlimited"],
              ["PDF export", "✗", "✓"],
              ["Priority support", "✗", "✓"],
            ].map(([feat, free, pro], i) => (
              <motion.div key={feat} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.3 }} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", padding: "11px 20px", borderBottom: i < 8 ? `1px solid ${t.border}` : "none", alignItems: "center" }}>
                <span className="ft-sans" style={{ fontSize: 13, color: t.textSub, fontWeight: 400 }}>{feat}</span>
                <span className="ft-sans" style={{ fontSize: 12, color: free === "✗" ? t.textMuted : t.textSub, textAlign: "center" }}>{free}</span>
                <span className="ft-sans" style={{ fontSize: 12, color: pro === "✗" ? t.textMuted : t.text, textAlign: "center", fontWeight: pro !== "✗" ? 600 : 400 }}>{pro}</span>
              </motion.div>
            ))}
          </PremiumCard>
        </div>

        <div style={{ ...maxW, marginBottom: isMobile ? 56 : 80 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} style={{ marginBottom: 28 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>What people say</p>
            <h2 className="ft-serif" style={{ fontSize: isMobile ? 22 : 28, fontWeight: 400, margin: 0, letterSpacing: "-0.3px", color: t.text }}>Used by analysts, PMs, and investors</h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
            {TESTIMONIALS.map((item, i) => <TestimonialCard key={i} {...item} t={t} delay={i * 0.07} />)}
          </div>
        </div>

        <div style={{ ...maxW, marginBottom: isMobile ? 56 : 80 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} style={{ marginBottom: 28 }}>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 6px" }}>FAQ</p>
            <h2 className="ft-serif" style={{ fontSize: isMobile ? 22 : 28, fontWeight: 400, margin: 0, letterSpacing: "-0.3px", color: t.text }}>Common questions</h2>
          </motion.div>
          <PremiumCard t={t}>
            <div style={{ padding: "4px 24px" }}>
              {FAQS.map((faq, i) => <FaqItem key={i} {...faq} t={t} />)}
            </div>
          </PremiumCard>
        </div>

        <div style={{ ...maxW, marginBottom: 100 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <PremiumCard t={t} style={{ background: t.bgSubtle }}>
              <div style={{ padding: isMobile ? "36px 20px" : "52px 48px", textAlign: "center" }}>
                <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 14px" }}>Ready to go deeper?</p>
                <h2 className="ft-serif" style={{ fontSize: isMobile ? 26 : 36, fontWeight: 400, margin: "0 0 14px", letterSpacing: "-0.4px", color: t.text, lineHeight: 1.15 }}>Stop skimming summaries.<br />Read the structure.</h2>
                <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, margin: "0 auto 32px", maxWidth: 380, lineHeight: 1.7, fontWeight: 300 }}>ForeTrace Pro gives you everything a serious investor needs — straight from the SEC filing, no noise.</p>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, justifyContent: "center", alignItems: "center" }}>
                  <motion.button onClick={() => setClicked(true)} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }} className="ft-sans" style={{ background: t.text, color: t.bg, border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: isMobile ? "100%" : "auto" }}>
                    {clicked ? "We'll notify you soon!" : `Get Pro — $${price}/mo`}
                  </motion.button>
                  <motion.button onClick={() => navigate("/AnalysisPage")} whileHover={{ borderColor: t.borderHover }} className="ft-sans" style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 8, padding: "11px 28px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: t.textSub, fontFamily: "'DM Sans',sans-serif", width: isMobile ? "100%" : "auto" }}>
                    Try Free first
                  </motion.button>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
