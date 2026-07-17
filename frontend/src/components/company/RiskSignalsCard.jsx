import { motion } from "framer-motion";
import { PremiumCard, Icon } from "../ui/UI";
import { MV, v } from "../../styles/animations";
import { useWindowWidth } from "../../hooks/useWindowWidth";

const WARN_PATH = "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z";

export default function RiskSignalsCard({ signals, t }) {
  const isMobile = useWindowWidth() < 640;
  if (!signals || !Array.isArray(signals) || signals.length === 0 || !t) return null;

  return (
    <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
      <PremiumCard t={t} style={{ background: t.bgCard }}>
        <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
            Key Risk Factors
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {signals.map((sig, i) => {
            const isLast = i === signals.length - 1;
            const prob = sig.probability || "Medium";
            const probColor = prob === "High" ? t.warning : prob === "Medium" ? t.neutral : t.textMuted;
            
            return (
              <div key={i} style={{ padding: isMobile ? "20px 16px" : "24px 28px", borderBottom: isLast ? "none" : `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <h4 className="ft-serif" style={{ fontSize: 18, color: t.text, margin: 0 }}>{sig.observation || sig.signal || "—"}</h4>
                  <span className="ft-sans" style={{ fontSize: 10, fontWeight: 700, color: probColor, background: `${probColor}15`, border: `1px solid ${probColor}30`, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>
                    {prob} Risk
                  </span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ marginTop: 2 }}><Icon path={WARN_PATH} size={14} color={t.warning} /></div>
                    <div>
                      <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Why it matters</span>
                      <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.5 }}>{sig.why_it_matters}</span>
                    </div>
                  </div>
                  
                  {sig.evidence && (
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 4 }}>
                      <div style={{ marginTop: 2 }}><Icon path="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" size={14} color={t.textMuted} /></div>
                      <div>
                        <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 2 }}>Evidence</span>
                        <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.5 }}>{sig.evidence}</span>
                      </div>
                    </div>
                  )}

                  {sig.mitigation && (
                    <div style={{ background: t.bgMuted, padding: "10px 14px", borderRadius: 6, marginTop: 8, borderLeft: `3px solid ${t.positive}55` }}>
                      <span className="ft-sans" style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Company Mitigation</span>
                      <span className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.5, fontStyle: "italic" }}>{sig.mitigation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PremiumCard>
    </motion.div>
  );
}
