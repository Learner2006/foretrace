import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PremiumCard, Icon } from "../ui/UI";
import { EASE_OUT_EXPO } from "../../styles/animations";

function ScoreRing({ score = 0, size = 96, t, label }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  const r      = (size - 12) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = circ * (1 - score / 100);

const color =
    score < 35 ? t.positive :
    score < 65 ? t.warning  :
    "#C0453C";

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}18`} strokeWidth={7} />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={inView ? { strokeDashoffset: dash } : {}}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.2 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <motion.span
          className="ft-serif"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          style={{ fontSize: size < 80 ? 18 : 22, fontWeight: 400, color, lineHeight: 1 }}
        >
          {score}
        </motion.span>
        {label && (
          <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 2 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

function DimensionBar({ label, score, trend, explanation, t }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });

  const color =
    score < 35 ? t.positive :
    score < 65 ? t.warning  :
    "#C0453C";

  const trendIcon =
    trend === "up"      ? "↑" :
    trend === "down"    ? "↓" : "→";
  const trendColor =
    trend === "up"      ? "#C0453C" :
    trend === "down"    ? t.positive :
    t.textMuted;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span className="ft-sans" style={{ fontSize: 11, color: t.textSub, fontWeight: 500 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ft-sans" style={{ fontSize: 10, color: trendColor, fontWeight: 700, letterSpacing: "0.2px" }}>
            {trendIcon}
          </span>
          <span className="ft-sans" style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "right" }}>
            {score}
          </span>
        </div>
      </div>
      <div style={{ height: 4, background: t.bgMuted, borderRadius: 2, overflow: "hidden" }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.1 }}
          style={{ height: "100%", width: `${score}%`, background: color, transformOrigin: "0%", borderRadius: 2 }}
        />
      </div>
      {explanation && (
        <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, margin: 0, lineHeight: 1.55, fontWeight: 300 }}>{explanation}</p>
      )}
    </motion.div>
  );
}

export default function RiskScoreCard({ structuralScore, riskMatrix, t, isMobile }) {
  if (!structuralScore || !t) return null;

  const score      = structuralScore.overall ?? 0;
  const confidence = structuralScore.confidence ?? "Moderate";
  const trend      = structuralScore.trend ?? "stable";
  const explanation= structuralScore.explanation ?? "";
  const dimensions = riskMatrix ?? [];

  const confColor =
    confidence === "High"   ? t.positive :
    confidence === "Low"    ? "#C0453C"  : t.warning;

  const riskLabel =
    score < 35 ? "LOW RISK" :
    score < 65 ? "MODERATE" : "HIGH RISK";

  const riskColor =
    score < 35 ? t.positive :
    score < 65 ? t.warning  : "#C0453C";

  return (
    <PremiumCard t={t} style={{ background: t.bgCard }} glow>

      <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon path="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" size={14} color={t.textMuted} strokeWidth={1.6} />
          <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Structural Risk Score
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ft-sans" style={{ fontSize: 9, fontWeight: 700, color: riskColor, background: `${riskColor}15`, border: `1px solid ${riskColor}30`, padding: "2px 8px", borderRadius: 3, letterSpacing: "0.6px" }}>
            {riskLabel}
          </span>
          <span className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: confColor, background: `${confColor}12`, border: `1px solid ${confColor}25`, padding: "2px 8px", borderRadius: 3, letterSpacing: "0.4px" }}>
            {confidence} confidence
          </span>
        </div>
      </div>

      <div style={{ padding: isMobile ? "20px 16px" : "24px 28px" }}>

        <div style={{ display: "flex", gap: isMobile ? 16 : 28, alignItems: "flex-start", marginBottom: 28 }}>
          <ScoreRing score={score} size={isMobile ? 80 : 96} t={t} label="risk" />
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="ft-serif" style={{ fontSize: isMobile ? 20 : 26, fontWeight: 400, color: riskColor }}>
                {score} / 100
              </span>
              <span className="ft-sans" style={{ fontSize: 11, color: t.textMuted }}>
                {trend === "up" ? "↑ worsening" : trend === "down" ? "↓ improving" : "→ stable"}
              </span>
            </div>
            {explanation && (
              <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                {explanation}
              </p>
            )}
          </div>
        </div>

{dimensions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20 }}>
              <p className="ft-sans" style={{ fontSize: 9, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 14px" }}>
                Risk breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {dimensions.map((dim, i) => (
                  <DimensionBar
                    key={i}
                    label={dim.dimension}
                    score={dim.score}
                    trend={dim.trend}
                    explanation={dim.explanation}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PremiumCard>
  );
}
