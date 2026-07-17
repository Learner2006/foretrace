import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { PremiumCard } from "../ui/UI";
import { EASE_OUT_EXPO } from "../../styles/animations";
import { SignalStrength } from "../ui/UI";

export default function ReasoningChainCard({ signals, t, isMobile, companyName }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const chainRef = useRef(null);
  const chainInView = useInView(chainRef, { amount: 0.3 });

  useEffect(() => {
    if (isPaused || !chainInView || !signals || signals.length === 0) return;
    const id = setInterval(() => setActiveStep((s) => (s + 1) % signals.length), 3000);
    return () => clearInterval(id);
  }, [isPaused, chainInView, signals]);

  const handleStepClick = (i) => {
    setActiveStep(i);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  };

  if (!signals || signals.length === 0) return null;

  const chainProgress = (activeStep + 1) / signals.length;

  return (
    <PremiumCard t={t} style={{ background: t.chainBg || t.bgCard }} noLift ref={chainRef}>
      <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {["#E06C75", "#E5C07B", "#98C379"].map((c) => (
              <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
            <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted, marginLeft: 8 }}>
              Reasoning chain · {companyName}
            </span>
          </div>
          <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>
            {isPaused ? "paused" : `${activeStep + 1} / ${signals.length}`}
          </span>
        </div>
        <div style={{ height: 2, background: t.bgMuted, borderRadius: 1, overflow: "hidden" }}>
          <motion.div
            animate={{ scaleX: chainProgress }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ height: "100%", background: t.text, borderRadius: 1, transformOrigin: "0%" }}
          />
        </div>
      </div>
      <div style={{ padding: isMobile ? "20px 16px" : "24px 28px" }}>
        {signals.map((step, i) => {
          const isActive = i === activeStep;
          const isPast = i < activeStep;
          const dir = step.trend === "rising" ? "up" : step.trend === "declining" ? "down" : "neutral";
          
          let strength = 2;
          if (step.confidence === "High") strength = 3;
          if (step.confidence === "Low") strength = 1;

          return (
            <button
              key={i}
              className="chain-step"
              onClick={() => handleStepClick(i)}
              aria-label={`Step ${i + 1}: ${step.observation}`}
              aria-current={isActive ? "step" : undefined}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", width: "100%", WebkitTapHighlightColor: "transparent", display: "block" }}
            >
              <div style={{ display: "flex", gap: isMobile ? 12 : 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 26 }}>
                  <motion.div
                    animate={{ background: isActive ? t.text : isPast ? t.textSub : t.bgMuted, scale: isActive ? 1.1 : 1 }}
                    transition={{ duration: 0.22 }}
                    style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 9, flexShrink: 0 }}
                  >
                    <motion.span animate={{ color: isActive ? t.bg : isPast ? t.bg : t.textMuted }} className="ft-sans" style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>
                      {i + 1}
                    </motion.span>
                  </motion.div>
                  {i < signals.length - 1 && (
                    <motion.div animate={{ background: isPast ? t.textSub : t.border }} transition={{ duration: 0.3 }} style={{ width: 1, flex: 1, minHeight: 20 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < signals.length - 1 ? 14 : 0, paddingTop: 7, flex: 1, borderLeft: isActive ? `2px solid ${t.text}` : "2px solid transparent", paddingLeft: isActive ? 10 : 0, transition: "border-color 0.2s, padding-left 0.2s", boxShadow: isActive ? `inset 3px 0 12px -4px ${t.text}18` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: isActive ? 6 : 0 }}>
                    <motion.span
                      animate={{ color: isActive ? t.text : isPast ? t.textSub : t.textMuted }}
                      className="ft-sans"
                      style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, lineHeight: 1.4 }}
                    >
                      {step.observation}
                    </motion.span>
                    <SignalStrength level={strength} t={t} />
                    <motion.span
                      animate={{ opacity: isActive || isPast ? 1 : 0.5 }}
                      className="ft-sans"
                      style={{
                        fontSize: 10,
                        color: dir === "neutral" ? t.textMuted : t.warning,
                        background: dir === "neutral" ? t.bgSubtle : t.warningBg,
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        border: `1px solid ${dir === "neutral" ? t.border : t.warning}22`,
                      }}
                    >
                      {step.trend}
                    </motion.span>
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: "0 0 6px", lineHeight: 1.65, fontWeight: 300 }}>
                          <strong>Evidence:</strong> {step.evidence}
                        </p>
                        <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: "0 0 6px", lineHeight: 1.65, fontWeight: 300 }}>
                          <strong>Why it matters:</strong> {step.why_it_matters}
                        </p>
                        {step.future_implication && (
                          <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: 0, lineHeight: 1.65, fontWeight: 300, fontStyle: "italic" }}>
                            {step.future_implication}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </button>
          );
        })}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Estimated strategic horizon
            </span>
            <span className="ft-sans" style={{ fontSize: 10, color: t.textSub }}>12–18 months</span>
          </div>
          <div style={{ height: 4, background: t.bgMuted, borderRadius: 2, overflow: "hidden", position: "relative" }}>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 0.72 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.3 }}
              style={{ height: "100%", background: `linear-gradient(90deg, ${t.text}88, ${t.text})`, borderRadius: 2, transformOrigin: "0%" }}
            />
            <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: "100%", background: t.border, opacity: 0.7 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            {["Now", "6mo", "12mo", "18mo+"].map((label) => (
              <span key={label} className="ft-sans" style={{ fontSize: 9, color: t.textMuted }}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
