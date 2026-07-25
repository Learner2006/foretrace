import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MV } from "../../styles/animations";
import { PremiumCard, Sparkline, ConfidenceRing, Icon } from "../ui/UI";
import { useBreakpoint } from "../../hooks/useWindowWidth";

const typeStyle = (type, t) =>
  type === "success"
    ? { accent: t.positive,  scoreBg: t.positiveBg, scoreBorder: `${t.positive}55`, badge: t.positiveBg, badgeText: t.positive, badgeBorder: `${t.positive}44`, borderLeft: t.positive, label: "SUCCESS PATH" }
    : { accent: t.warning,   scoreBg: t.warningBg,  scoreBorder: `${t.warning}55`,  badge: t.warningBg,  badgeText: t.warning,  badgeBorder: `${t.warning}44`,  borderLeft: t.warning,  label: "FAILURE PATH" };

const Dot = ({color, size=4, opacity=1}) => (
  <span style={{width:size, height:size, borderRadius:"50%", background:color, flexShrink:0, opacity, display:"inline-block"}} />
);

const ProBadge = ({t}) => (
  <span className="ft-sans" style={{fontSize:9, fontWeight:700, background:t.text, color:t.bg, padding:"1px 7px", borderRadius:3, letterSpacing:"0.3px"}}>PRO</span>
);

export default function AnalogCard({ t, analog, isMobile: propIsMobile, vfn }) {
  const navigate = useNavigate();
  const { width } = useBreakpoint();
  const isSmallScreen = propIsMobile || (width ? width < 960 : false);
  const [expanded, setExpanded] = useState(false);
  if (!analog || !t) return null;

  const ts = typeStyle(analog.type, t);
  const hasLink = !!analog.analog_ticker;

  return (
    <motion.div variants={vfn?.(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true, amount:0.1}} style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}>
      <PremiumCard
        t={t}
        style={{
          background: t.analogBg,
          borderLeft: `3px solid ${ts.borderLeft}`,
          cursor: hasLink ? "pointer" : "default",
          width: "100%",
          boxSizing: "border-box"
        }}
        onClick={() => hasLink && navigate(`/AnalysisPage?ticker=${analog.analog_ticker}&name=${analog.analog_ticker}`)}
      >
        {/* Header */}
        <div style={{
          background: t.bgSubtle,
          borderBottom: `1px solid ${t.border}`,
          padding: isSmallScreen ? "12px 16px" : "12px 24px",
          display: "flex",
          flexDirection: isSmallScreen ? "column" : "row",
          alignItems: isSmallScreen ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          width: "100%",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <motion.div animate={{ opacity: [1, 0.45, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
              <Dot color="#5C9B6E" size={6} />
            </motion.div>
            <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>
              Analog Engine · Structural match report
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="ft-sans" style={{ background: ts.badge, color: ts.badgeText, border: `1px solid ${ts.badgeBorder}`, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 3, textTransform: "uppercase" }}>
              {ts.label}
            </span>
            <span className="ft-sans" style={{ background: ts.scoreBg, border: `1px solid ${ts.scoreBorder}`, color: ts.accent, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 4 }}>
              {analog.similarity_score ?? "—"}% match
            </span>
            <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>{analog.matchCount} matches found</span>
            <ProBadge t={t} />
          </div>
        </div>

        <div style={{ padding: isSmallScreen ? "16px 16px" : "24px 24px", width: "100%", boxSizing: "border-box" }}>
          {/* Main Title & Percentile */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Closest structural analog</span>
            <span style={{ width: 16, height: 1, background: t.border, display: "inline-block", flexShrink: 0, marginBottom: 3 }} />
            <span className="ft-serif" style={{ fontSize: 22, color: ts.accent, fontWeight: 400 }}>{analog.company}</span>
            {analog.year && <span className="ft-sans" style={{ fontSize: 13, color: t.textSub }}>{analog.year}</span>}
            <span className="ft-sans" style={{ fontSize: 10, color: t.positive, background: t.positiveBg, border: `1px solid ${t.positive}22`, padding: "2px 8px", borderRadius: 3, fontWeight: 600 }}>
              Top {100 - analog.corpusPercentile}% match in corpus
            </span>
          </div>

          {/* Comparison Matrix */}
          {analog.comparison?.length > 0 && (
            <div style={{ marginBottom: 24, width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: isSmallScreen ? "100%" : 540 }}>
                {!isSmallScreen && (
                  <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr 48px 48px", marginBottom: 8, padding: "0 6px" }}>
                    <span />
                    <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", paddingLeft: 10 }}>{analog.company} · {analog.year}</span>
                    <span className="ft-sans" style={{ fontSize: 10, color: t.text, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", paddingLeft: 10 }}>Current</span>
                    <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", textAlign: "center" }}>Δ</span>
                    <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", textAlign: "right" }}>Trend</span>
                  </div>
                )}
                {analog.comparison.map((row, i) => {
                  const sparkColor = row.dir === "neutral" ? t.neutral : t.warning;
                  return (
                    <motion.div
                      key={row.dimension}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      whileHover={{ backgroundColor: t.bgMuted }}
                      style={{
                        display: isSmallScreen ? "flex" : "grid",
                        flexDirection: isSmallScreen ? "column" : "row",
                        gridTemplateColumns: isSmallScreen ? "1fr" : "130px 1fr 1fr 48px 48px",
                        borderTop: `1px solid ${t.border}`,
                        padding: "10px 6px",
                        alignItems: isSmallScreen ? "flex-start" : "center",
                        gap: isSmallScreen ? 6 : 8,
                        borderRadius: 4,
                        transition: "background 0.15s"
                      }}
                    >
                      <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>{row.dimension}</span>
                      <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.5, fontStyle: "italic", paddingLeft: isSmallScreen ? 0 : 10, borderLeft: isSmallScreen ? "none" : `1px solid ${t.border}` }}>
                        {row.then}
                      </span>
                      <span className="ft-sans" style={{ fontSize: 12, color: t.text, lineHeight: 1.5, fontWeight: 500, paddingLeft: isSmallScreen ? 0 : 10, borderLeft: isSmallScreen ? "none" : `2px solid ${t.borderHover}` }}>
                        {row.now}
                      </span>
                      {!isSmallScreen && <span className="ft-sans" style={{ fontSize: 10, color: sparkColor, fontWeight: 600, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{row.delta}</span>}
                      {!isSmallScreen && <div style={{ display: "flex", justifyContent: "flex-end" }}><Sparkline data={row.trend} width={44} height={16} color={sparkColor} baseline /></div>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Narrative Details */}
          <div style={{ marginBottom: 20 }}>
            {[
              ["Why they resemble", analog.what_they_resembled, null],
              ["What they did", analog.action_taken, null],
              ["Outcome", analog.outcome, ts.accent],
              ["Key difference", analog.key_difference, null],
            ].map(([label, text, color]) => text && (
              <div key={label} style={{ marginBottom: 12 }}>
                <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>{label}</p>
                <p className="ft-sans" style={{ fontSize: 12, color: color || t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Footer & Confidence Ring */}
          <div style={{
            display: "flex",
            flexDirection: isSmallScreen ? "column" : "row",
            gap: isSmallScreen ? 16 : 24,
            alignItems: isSmallScreen ? "flex-start" : "center",
            paddingTop: 20,
            borderTop: `1px solid ${t.border}`,
            width: "100%",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <ConfidenceRing value={analog.confidence} corpusPercentile={analog.corpusPercentile} size={isSmallScreen ? 64 : 80} t={t} />
              <div>
                <p className="ft-sans" style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 2px" }}>Match confidence</p>
                <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>1 of {analog.matchCount} matches</span>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              {analog.citation && (
                <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, fontStyle: "italic" }}>{analog.citation}</span>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <motion.button
                  onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  whileHover={{ backgroundColor: t.bgMuted, borderColor: t.borderHover }}
                  style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 600, color: t.text, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                  {expanded ? "Hide reasoning ↑" : "Why this analog? ↓"}
                </motion.button>
                {hasLink
                  ? <motion.button
                      onClick={e => { e.stopPropagation(); navigate(`/AnalysisPage?ticker=${analog.analog_ticker}&name=${analog.analog_ticker}`); }}
                      whileHover={{ backgroundColor: t.bgMuted, borderColor: t.borderHover }}
                      style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 600, color: ts.accent, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                      View company <Icon path="M9 18l6-6-6-6" size={10} color="currentColor" />
                    </motion.button>
                  : <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>Ticker unavailable</span>
                }
              </div>
            </div>
          </div>

          {/* Expanded Drawer */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ overflow: "hidden", width: "100%" }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ marginTop: 16, background: t.bgMuted, border: `1px solid ${t.border}`, borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, boxSizing: "border-box" }}>
                  <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>Why this analog?</p>

                  {analog.what_they_resembled && (
                    <div>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>Pattern matched</p>
                      <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{analog.what_they_resembled}</p>
                    </div>
                  )}

                  {analog.similarity_basis?.length > 0 && (
                    <div>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>Signal matches</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {analog.similarity_basis.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ color: ts.accent, fontSize: 11, marginTop: 2, flexShrink: 0 }}>›</span>
                            <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analog.key_difference && (
                    <div>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>What makes it imperfect</p>
                      <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{analog.key_difference}</p>
                    </div>
                  )}

                  {analog.lessons_learned && (
                    <div>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>Lessons learned</p>
                      <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{analog.lessons_learned}</p>
                    </div>
                  )}

                  {analog.invalidation_triggers && (
                    <div>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>What could invalidate this comparison</p>
                      <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{analog.invalidation_triggers}</p>
                    </div>
                  )}

                  {analog.citation && (
                    <div>
                      <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>Source</p>
                      <p className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontStyle: "italic", lineHeight: 1.5, margin: 0 }}>{analog.citation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </PremiumCard>
    </motion.div>
  );
}
