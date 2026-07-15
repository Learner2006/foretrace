import { motion, useReducedMotion } from "framer-motion";
import { SectionLabel, Dot, Divider } from "../components/ui/Primitives";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { Icon, PremiumCard } from "../components/ui/UI";
import { MV, EASE_OUT_EXPO } from "../styles/animations";
import { useTheme } from "../hooks/useTheme";

const PIPELINE = [
  { step: "01", label: "Signal Extraction",
    detail: "Reads the filings, the disclosures, the footnotes most people skip. What did the company actually say — and what did they quietly stop saying?",
    dir: "neutral", signal: "Filings · Disclosures" },
  { step: "02", label: "Pattern Detection",
    detail: "Looks for the shape of things. Companies don't fail overnight — they drift. This step finds the drift before it becomes a headline.",
    dir: "down", signal: "Drift signals" },
  { step: "03", label: "Structural Mapping",
    detail: "Connects what's happening now to what happened before — in this company, in similar ones, across the sector. History rhymes.",
    dir: "neutral", signal: "Analog match" },
  { step: "04", label: "Explainable Scoring",
    detail: "Turns all of that into something you can actually read. Not a black-box score — a traceable answer to: what's going on here, and why.",
    dir: "up", signal: "Traceable" },
];

const OUTPUTS = [
  "A real picture of how a company is behaving — not just how its stock is moving",
  "Early warning signals when something structurally starts to shift",
  "Comparisons to similar companies that went through the same thing",
  "Where the pressure points are — and what's keeping it together",
  "Confidence levels on every insight, so you know what to trust",
];

const GITHUB_PATH = "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22";

const getContainerStyle = (isMobile) => ({
  maxWidth: 680,
  margin: "0 auto",
  padding: isMobile ? "0 20px" : "0 32px",
  textAlign: "center",
});

const getHeaderPadding = (isMobile) => ({
  paddingTop: isMobile ? 36 : 52,
  paddingBottom: isMobile ? 28 : 40,
});

const getSectionPadding = (isMobile) => ({
  paddingBottom: isMobile ? 36 : 48,
});

const getDividerMargin = (isMobile) => ({
  marginBottom: isMobile ? 36 : 48,
});

const getHeadingFontSize = (isMobile) => isMobile ? 26 : 38;
const getSubheadingFontSize = (isMobile) => isMobile ? 13 : 14;
const getHighlightFontSize = (isMobile) => isMobile ? 13 : 17;
const getCreatorSectionPadding = (isMobile) => isMobile ? 48 : 64;

function ModuleHeader({ t, index, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, justifyContent: "center" }}>
      <span className="ft-serif"
        style={{ fontSize: 11, color: t.textMuted, letterSpacing: "0.4px", fontStyle: "italic", flexShrink: 0 }}>
        {index}
      </span>
      <div style={{ flex: 1, height: 1, background: t.border, maxWidth: 80 }} />
      <SectionLabel t={t} label={label} />
    </div>
  );
}

function StyledParagraph({ children, t, isMobile, variant = "body", isHighlight = false, isQuote = false }) {
  const baseStyles = {
    margin: "0 auto 14px",
    fontWeight: 400,
    lineHeight: 1.8,
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 560,
  };

  if (variant === "subtitle") {
    return (
      <motion.p variants={MV.fadeUp} className="ft-sans"
        style={{
          ...baseStyles,
          fontSize: getSubheadingFontSize(isMobile),
          lineHeight: 1.75,
          color: t.textMuted,
          margin: 0,
          maxWidth: 480,
          textAlign: "center",
        }}>
        {children}
      </motion.p>
    );
  }

  if (variant === "intro") {
    return (
      <motion.p variants={MV.fadeUp} className="ft-sans"
        style={{
          ...baseStyles,
          fontSize: isMobile ? 13 : 14,
          lineHeight: 1.75,
          color: t.textMuted,
          margin: "0 auto 20px",
          maxWidth: 520,
          textAlign: "center",
        }}>
        {children}
      </motion.p>
    );
  }

  if (variant === "footnote") {
    return (
      <motion.p className="ft-sans"
        style={{
          fontSize: isMobile ? 12 : 13,
          lineHeight: 1.75,
          color: t.textMuted,
          margin: "16px auto 0",
          maxWidth: 480,
          fontStyle: "italic",
          textAlign: "center",
        }}>
        {children}
      </motion.p>
    );
  }

return (
    <motion.p variants={MV.fadeUp} className="ft-sans"
      style={{
        fontSize: isHighlight ? getHighlightFontSize(isMobile) : getSubheadingFontSize(isMobile),
        fontWeight: isHighlight ? 500 : 400,
        lineHeight: 1.8,
        color: isHighlight ? t.text : t.textSub,
        margin: isQuote ? "0 auto" : "0 auto 14px",
        maxWidth: 560,
        fontStyle: isQuote ? "italic" : "normal",
        borderLeft: isQuote ? `2px solid ${t.border}` : "none",
        paddingLeft: isQuote ? 16 : 0,
        textAlign: "center",
      }}>
      {children}
    </motion.p>
  );
}

function CreatorInfo({ t, isMobile }) {
  return (
    <div>

      <motion.div variants={MV.fadeUp}
        style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: t.bgMuted, border: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span className="ft-serif" style={{ fontSize: 14, color: t.text, fontWeight: 400 }}>A</span>
        </div>
        <div>
          <p className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.text, margin: 0 }}>Anushka Mittal</p>
          <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, margin: 0, letterSpacing: "0.1px" }}>Builder · India</p>
        </div>
      </motion.div>

<motion.p variants={MV.fadeUp} className="ft-sans"
        style={{ fontSize: isMobile ? 13 : 14, lineHeight: 1.78, color: t.textSub, margin: "0 0 24px", maxWidth: 520 }}>
        Built solo, out of genuine frustration with how the finance world talks about companies.
        Still evolving. But the direction is clear — from data overload, to something that
        actually helps you understand what you're looking at.
      </motion.p>

      {/* Links row */}
      <motion.div variants={MV.fadeUp}
        style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <motion.a href="https://github.com/Learner2006" target="_blank" rel="noopener noreferrer"
          whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
          className="ft-sans"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, color: t.textMuted,
            background: t.bgSubtle, border: `1px solid ${t.border}`,
            padding: "5px 11px", borderRadius: 6, textDecoration: "none",
          }}>
          <Icon path={GITHUB_PATH} size={12} color={t.textMuted} strokeWidth={1.5} />
          GitHub
        </motion.a>

        <div style={{ flex: 1 }} />

        {/* Claude attribution */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px", borderRadius: 7,
            background: "transparent", border: `1px solid ${t.border}`,
          }}>
          <motion.span
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#CC785C", display: "inline-block", flexShrink: 0 }}
          />
          <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.2px" }}>
            Intelligence layer ·
          </span>
          <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textSub }}>
            Claude · Anthropic
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Outputs list section ──────────────────────────────────────────────────────
function OutputsList({ t, isMobile }) {
  return (
    <motion.div variants={MV.stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <div style={{ margin: "0 auto", maxWidth: 560 }}>
        <PremiumCard t={t} borderRadius={10} noLift>
          {OUTPUTS.map((output, i) => (
            <motion.div key={i} variants={MV.fadeUp}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: isMobile ? "13px 16px" : "13px 20px",
                borderBottom: i < OUTPUTS.length - 1 ? `1px solid ${t.border}` : "none",
              }}>
              <span className="ft-sans"
                style={{ fontSize: 9, color: t.textMuted, fontWeight: 600, letterSpacing: "0.3px", flexShrink: 0, minWidth: 18 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ width: 1, height: 12, background: t.border, flexShrink: 0 }} />
              <span className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.5, textAlign: "left" }}>
                {output}
              </span>
            </motion.div>
          ))}
        </PremiumCard>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
    export default function AboutPage() {
  const shouldReduce = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const { t } = useTheme();
  const vfn = (variant) => shouldReduce ? MV.REDUCED : variant;
  // Today's shortcut is tomorrow's technical debt. Keeping these animation maps simple for now.
  const col = getContainerStyle(isMobile);
  return (
    <div style={{ color: t.text }}>
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <header style={{ ...col, ...getHeaderPadding(isMobile) }}>
          <motion.div variants={vfn(MV.stagger)} initial="hidden" animate="visible">

            <motion.div variants={vfn(MV.pill)} style={{ marginBottom: 24 }}>
              <span className="ft-sans" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase",
                color: t.textMuted, background: t.bgSubtle,
                border: `1px solid ${t.border}`, padding: "4px 13px", borderRadius: 100,
              }}>
                <Dot color={t.positive} size={5} />
                System · About
              </span>
            </motion.div>

            <motion.h1 variants={vfn(MV.heroCh)} className="ft-serif"
              style={{ fontSize: getHeadingFontSize(isMobile), fontWeight: 400, lineHeight: 1.18, color: t.text, margin: "0 0 14px", letterSpacing: "-0.4px" }}>
              ForeTrace
            </motion.h1>

            <StyledParagraph t={t} isMobile={isMobile} variant="subtitle">
              Know the company. Not just the chart.
            </StyledParagraph>

          </motion.div>
        </header>

        <div style={{ ...col }}>
          <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
            style={{ height: 1, background: t.border, transformOrigin: "left", ...getDividerMargin(isMobile) }} />
        </div>

        {/* ══ 01 — WHERE IT STARTED ════════════════════════════════════════════ */}
        <section style={{ ...col, ...getSectionPadding(isMobile) }}>
          <motion.div variants={vfn(MV.fadeIn)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <ModuleHeader t={t} index="01" label="Where It Started" />
          </motion.div>

          <motion.div variants={vfn(MV.stagger)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              "I kept looking at stock projects — dashboards, predictors, screeners — and something kept bothering me.",
              "Everyone was calculating the stock. Nobody was understanding the company.",
              "Like, what does this company actually do? Where is it trying to go? Is the leadership stable? Are their costs quietly eating them alive? Is this a business that's growing with intention, or just riding a wave?",
              "Stock price tells you what the market thinks right now. It doesn't tell you if the company deserves it.",
            ].map((para, i) => (
              <StyledParagraph key={i} t={t} isMobile={isMobile} isHighlight={i === 1} isQuote={i === 3}>
                {para}
              </StyledParagraph>
            ))}
          </motion.div>
        </section>

        <div style={{ ...col }}>
          <Divider t={t} style={{ ...getDividerMargin(isMobile) }} />
        </div>

        {/* ══ 02 — THE PIPELINE ═══════════════════════════════════════════════ */}
        <section style={{ ...col, ...getSectionPadding(isMobile) }}>
          <motion.div variants={vfn(MV.fadeIn)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <ModuleHeader t={t} index="02" label="The Pipeline" />
          </motion.div>

          <motion.div variants={vfn(MV.stagger)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div style={{ margin: "0 auto", maxWidth: 560 }}>
              <PremiumCard t={t} borderRadius={10} noLift>
              {PIPELINE.map((step, i) => (
                <motion.div key={step.step} variants={vfn(MV.fadeUp)}
                  style={{
                    display: "flex", gap: isMobile ? 12 : 16,
                    padding: isMobile ? "14px 16px" : "16px 20px",
                    borderBottom: i < PIPELINE.length - 1 ? `1px solid ${t.border}` : "none",
                  }}>
                  {/* Step number badge */}
                  <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: t.bgSubtle, border: `1px solid ${t.border}`,
                  }}>
                    <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted }}>
                      {step.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <span className="ft-sans" style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: t.text }}>
                        {step.label}
                      </span>
                      <span className="ft-sans" style={{
                        fontSize: 9, fontWeight: 600, color: t.textMuted,
                        background: t.bgSubtle, padding: "2px 7px", borderRadius: 3,
                      }}>
                        {step.signal}
                      </span>
                    </div>
                    <p className="ft-sans" style={{
                      fontSize: isMobile ? 12 : 13, color: t.textSub,
                      lineHeight: 1.6, margin: 0,
                    }}>
                      {step.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
              </PremiumCard>
            </div>
          </motion.div>
        </section>

        <div style={{ ...col }}>
          <Divider t={t} style={{ ...getDividerMargin(isMobile) }} />
        </div>

        {/* ══ 03 — WHAT YOU GET ═══════════════════════════════════════════════ */}
        <section style={{ ...col, ...getSectionPadding(isMobile) }}>
          <motion.div variants={vfn(MV.fadeIn)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <ModuleHeader t={t} index="03" label="What You Get" />
          </motion.div>

          <StyledParagraph t={t} isMobile={isMobile} variant="intro">
            At the end of it, you don't get a prediction. You get a picture — of what this company actually is right now.
          </StyledParagraph>

<OutputsList t={t} isMobile={isMobile} />

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <StyledParagraph t={t} isMobile={isMobile} variant="footnote">
              Think of it like a health report. Not a forecast.
            </StyledParagraph>
          </motion.div>
        </section>

        <div style={{ ...col }}>
          <Divider t={t} style={{ ...getDividerMargin(isMobile) }} />
        </div>

<section style={{ ...col, ...getSectionPadding(isMobile) }}>
          <motion.div variants={vfn(MV.fadeIn)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <ModuleHeader t={t} index="04" label="Why This Exists" />
          </motion.div>

          <motion.div variants={vfn(MV.stagger)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              "There are a thousand tools that tell you a stock is going up or down. Almost none of them tell you why the company behind it is worth anything.",
              "Long-term investing should be about understanding businesses — their goals, their leadership patterns, their structural health. Not just riding numbers.",
              "ForeTrace is my attempt to build that missing layer. The one between raw data and a model that just gives you a score with no explanation.",
              "I want it to feel less like a terminal and more like someone who actually read the filings.",
            ].map((para, i) => (
              <StyledParagraph key={i} t={t} isMobile={isMobile} isHighlight={i === 3} isQuote={false}>
                {para}
              </StyledParagraph>
            ))}
          </motion.div>
        </section>

        <div style={{ ...col }}>
          <Divider t={t} style={{ ...getDividerMargin(isMobile) }} />
        </div>

<section style={{ ...col, paddingBottom: getCreatorSectionPadding(isMobile) }}>
          <motion.div variants={vfn(MV.fadeIn)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <ModuleHeader t={t} index="05" label="Creator Footnote" />
          </motion.div>

          <motion.div variants={vfn(MV.stagger)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <CreatorInfo t={t} isMobile={isMobile} />
          </motion.div>
        </section>

      </div>
    </div>
  );
}
