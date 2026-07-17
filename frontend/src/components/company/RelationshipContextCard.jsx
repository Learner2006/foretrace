import { motion } from "framer-motion";
import { PremiumCard } from "../ui/UI";
import { MV, v } from "../../styles/animations";
import { useWindowWidth } from "../../hooks/useWindowWidth";

export default function RelationshipContextCard({ data, t }) {
  const isMobile = useWindowWidth() < 640;
  if (!data || !data.insight || !t) return null;

  const linkedTo = Array.isArray(data.linked_to) ? data.linked_to : [];

  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      <PremiumCard t={t} style={{ background: t.bgCard }}>
        <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
            Ecosystem Context
          </p>
        </div>

        <div style={{ padding: isMobile ? "20px 16px" : "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          {linkedTo.length > 0 && (
            <div>
              <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>Linked Entities</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {linkedTo.map((entity, i) => (
                  <span key={i} className="ft-sans" style={{ fontSize: 11, color: t.textSub, background: t.bgSubtle, border: `1px solid ${t.border}`, borderRadius: 4, padding: "3px 8px" }}>
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 8px" }}>Relationship Dynamics</p>
            <p className="ft-sans" style={{ fontSize: 13, color: t.text, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
              {data.insight}
            </p>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}
