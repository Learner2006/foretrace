import { motion } from "framer-motion";
import { Sparkline } from "./UI";
import { PULSE_MATRIX } from "../../styles/data";
import { useBreakpoint } from "../../hooks/useWindowWidth";
import { useTheme } from "../../hooks/useTheme";

export default function MarketPulseMatrix({ t: propT, isMobile: propIsMobile }) {
  const theme = useTheme();
  const bp = useBreakpoint();
  
  const t = propT ?? theme.t;
  const isMobile = propIsMobile ?? bp.isMobile;

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 1, background: t.border, borderRadius: 12, overflow: "hidden", border: `1px solid ${t.border}` }}>
      {PULSE_MATRIX.map((cell, i) => {
        const sparkColor = cell.dir === "up" ? (cell.severity === "positive" ? t.positive : t.warning) : cell.dir === "down" ? t.warning : t.neutral;
        return (
          <motion.div key={cell.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            style={{ background: t.bgCard, padding: isMobile ? "14px" : "18px 20px", display: "flex", flexDirection: "column", gap: 10, cursor: "default" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <span className="ft-serif" style={{ fontSize: isMobile ? 26 : 30, color: t.text, lineHeight: 1, fontWeight: 400 }}>{cell.count}</span>
              <Sparkline data={cell.spark} width={48} height={20} color={sparkColor} />
            </div>
            <div>
              <span className="ft-sans" style={{ fontSize: 11, fontWeight: 600, color: t.text, display: "block", lineHeight: 1.3 }}>{cell.label}</span>
              <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, marginTop: 2, display: "block" }}>{cell.change}</span>
            </div>
            <div style={{ height: 2, borderRadius: 1, background: sparkColor, opacity: 0.35 }} />
          </motion.div>
        );
      })}
    </div>
  );
}
