import { motion } from "framer-motion";
import { PremiumCard, SignalBadge, Icon } from "../ui/UI";
import { MV, v } from "../../styles/animations";
import { useWindowWidth } from "../../hooks/useWindowWidth";

const MOMENTUM_DIR = {
  growing:   "up",
  stable:    "neutral",
  declining: "down",
};

const WARN_PATH =
  "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z";

// Structural health indicator. Keeping this close to the UI logic since it's highly display-specific.
export default function StructuralHealthCard({ data, t }) {
  const isMobile = useWindowWidth() < 640;
  if (!data || !t) return null;

  const momentum = (data.momentum || "stable").toLowerCase();
  const dir      = MOMENTUM_DIR[momentum] || "neutral";

  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      <PremiumCard t={t} style={{ background: t.bgCard }}>

        <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
            Market Position
          </p>
          <SignalBadge signal={momentum} dir={dir} t={t} />
        </div>

<div style={{ padding: isMobile ? "20px 16px" : "24px 28px", display: "flex", flexDirection: "column", gap: 0 }}>

{data.sector_standing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>
                Sector Standing
              </p>
              <span className="ft-sans" style={{ fontSize: 13, fontWeight: 600, color: t.text, lineHeight: 1.65 }}>
                {data.sector_standing}
              </span>
            </div>
          )}

{data.key_dependency && (
            <>
              <div style={{ borderTop: `1px solid ${t.border}`, margin: "16px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 4px" }}>
                  Key Dependency
                </p>
                <span className="ft-sans" style={{ fontSize: 13, color: t.warning, lineHeight: 1.65, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon path={WARN_PATH} size={14} color={t.warning} strokeWidth={1.8} />
                  {data.key_dependency}
                </span>
              </div>
            </>
          )}
        </div>
      </PremiumCard>
    </motion.div>
  );
}
