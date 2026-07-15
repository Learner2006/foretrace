import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PremiumCard, SignalBadge, Icon } from "../ui/UI";
import { MV, v, EASE_OUT_EXPO } from "../../styles/animations";
import { useBreakpoint } from "../../hooks/useWindowWidth";

const MOMENTUM_DIR = {
  growing:   "up",
  stable:    "neutral",
  declining: "down",
};

const WARN_PATH =
  "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z";

function MomentumArrow({ dir, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.15 }}
      style={{
        width: 48, height: 48, borderRadius: "50%",
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ y: dir === "up" ? [-2, 2, -2] : dir === "down" ? [2, -2, 2] : [0, 0, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {dir === "up"     && <path d="M12 19V5M5 12l7-7 7 7" />}
          {dir === "down"   && <path d="M12 5v14M5 12l7 7 7-7" />}
          {dir === "neutral"&& <path d="M5 12h14M12 5l7 7-7 7" />}
        </svg>
      </motion.div>
    </motion.div>
  );
}

function StrengthBar({ value = 70, color, t }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ width: "100%", height: 3, background: t.bgMuted, borderRadius: 2, overflow: "hidden" }}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: value / 100 } : {}}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.2 }}
        style={{
          height: "100%", borderRadius: 2,
          background: `linear-gradient(90deg, ${color}60, ${color})`,
          transformOrigin: "0%",
        }}
      />
    </div>
  );
}

// Risk warnings. Humorous check: yes, this could probably be optimized. No, today is not that day.
export default function MarketPositionCard({ data, t }) {
  const { isMobile } = useBreakpoint();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  if (!data || !t) return null;

  const momentum = (data.momentum || "stable").toLowerCase();
  const dir      = MOMENTUM_DIR[momentum] || "neutral";
  const accent   = dir === "up" ? t.positive : dir === "down" ? t.warning : t.neutral;

const strengthVal = dir === "up" ? 78 : dir === "neutral" ? 52 : 28;

  return (
    <motion.div
      ref={ref}
      variants={v(MV.fadeUp)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <PremiumCard t={t} style={{ background: t.bgCard }} glow>

<div style={{
          background: t.bgSubtle, borderBottom: `1px solid ${t.border}`,
          padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <p className="ft-sans" style={{
            fontSize: 10, fontWeight: 600, color: t.textMuted,
            letterSpacing: "0.8px", textTransform: "uppercase", margin: 0,
          }}>
            Market Position
          </p>
          <SignalBadge signal={momentum} dir={dir} t={t} />
        </div>

<div style={{
          padding: isMobile ? "20px 16px 16px" : "22px 24px 18px",
          display: "flex", alignItems: "center", gap: 16,
          borderBottom: `1px solid ${t.border}`,
        }}>
          <MomentumArrow dir={dir} color={accent} />

          <div style={{ flex: 1, minWidth: 0 }}>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.38, delay: 0.1, ease: EASE_OUT_EXPO }}
              className="ft-serif"
              style={{ fontSize: isMobile ? 18 : 22, color: t.text, margin: "0 0 8px", lineHeight: 1.2, fontWeight: 400 }}
            >
              {data.sector_standing}
            </motion.p>

<StrengthBar value={strengthVal} color={accent} t={t} />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted }}>Weak</span>
              <span className="ft-sans" style={{ fontSize: 9, color: accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {momentum}
              </span>
              <span className="ft-sans" style={{ fontSize: 9, color: t.textMuted }}>Dominant</span>
            </div>
          </div>
        </div>

{data.key_dependency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.35, delay: 0.3, ease: EASE_OUT_EXPO }}
            style={{
              padding: isMobile ? "14px 16px" : "14px 24px",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: `${t.warning}15`,
              border: `1px solid ${t.warning}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon path={WARN_PATH} size={13} color={t.warning} strokeWidth={1.8} />
            </div>
            <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 600, color: t.warning }}>Risk · </span>
              {data.key_dependency}
            </span>
          </motion.div>
        )}

      </PremiumCard>
    </motion.div>
  );
}
