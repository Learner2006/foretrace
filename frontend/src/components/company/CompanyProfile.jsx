import { motion } from "framer-motion";
import { PremiumCard } from "../ui/UI";
import { EASE_OUT_EXPO } from "../../styles/animations";
import { useWindowWidth } from "../../hooks/useWindowWidth";

const CONF_STYLE = (level, t) => {
  if (level === "High")     return { bg: t.positiveBg, text: t.positive,  border: `${t.positive}55` };
  if (level === "Low")      return { bg: t.warningBg,  text: t.warning,   border: `${t.warning}55`  };
              return { bg: t.bgSubtle,   text: t.textSub,   border: t.border          };
};

const Divider = ({ t }) => <div style={{ borderTop: `1px solid ${t.border}`, margin: "16px 0" }} />;

// SEC metadata visualization. Backend expects this exact payload format, so don't clean it up without checking.
export default function CompanyProfile({ data, t }) {
  const isMobile = useWindowWidth() < 640;
  if (!data || !t) return null;

  const bs   = data.behavioral_summary   || {};
  const rc   = data.relationship_context || {};
  const risks = data.risk_signals        || [];
  const conf  = bs.confidence            || "Moderate";
  const cs    = CONF_STYLE(conf, t);

  return (
    <PremiumCard t={t} style={{ background: t.bgCard }}>

      <div style={{ background: t.bgSubtle, borderBottom: `1px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
          Company Profile
        </p>
        <span className="ft-sans" style={{ background: cs.bg, color: cs.text, border: `1px solid ${cs.border}`, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "3px 10px", borderRadius: 4, textTransform: "uppercase" }}>
          {conf}
        </span>
      </div>

<div style={{ padding: isMobile ? "20px 16px" : "24px 28px" }}>

<p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6, marginTop: 0 }}>
          What is happening
        </p>
        <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{bs.what_is_happening || "—"}</p>

        <Divider t={t} />

<p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6, marginTop: 0 }}>
          Why it matters
        </p>
        <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{bs.why_it_matters || "—"}</p>

{bs.key_forces?.length > 0 && (
          <>
            <Divider t={t} />
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6, marginTop: 0 }}>
              Key forces
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 8 }}>
              {bs.key_forces.map((f, i) => (
                <span key={i} className="ft-sans" style={{ background: t.bgSubtle, border: `1px solid ${t.border}`, color: t.textSub, fontSize: 11, padding: "4px 10px", borderRadius: 4, letterSpacing: "0.03em" }}>{f}</span>
              ))}
            </div>
          </>
        )}

{bs.confidence_reason && (
          <>
            <Divider t={t} />
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6, marginTop: 0 }}>
              Confidence reason
            </p>
            <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{bs.confidence_reason}</p>
          </>
        )}

{risks.length > 0 && (
          <>
            <Divider t={t} />
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", margin: 0 }}>
                Risk signals
              </p>
              <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted, letterSpacing: "0.03em" }}>SEC 10-K · Item 1A</span>
            </div>
            <motion.div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {risks.map((r, i) => {
                const signal = typeof r === "string" ? r : r.signal;
                const reason = typeof r === "string" ? null : r.why_it_matters;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.3, ease: EASE_OUT_EXPO }}
                    style={{ paddingLeft: 14, borderLeft: `2px solid ${t.warning}44` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.warning, flexShrink: 0, display: "inline-block" }} />
                      <span className="ft-sans" style={{ fontSize: 12, color: t.warning, fontWeight: 600, letterSpacing: "0.03em" }}>{signal}</span>
                    </div>
                    {reason && <p className="ft-sans" style={{ fontSize: 12, color: t.textSub, margin: 0, lineHeight: 1.65, fontWeight: 300 }}>{reason}</p>}
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

{(rc.insight || rc.linked_to?.length > 0) && (
          <>
            <Divider t={t} />
            <p className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6, marginTop: 0 }}>
              Relationship context
            </p>
            {rc.insight && <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{rc.insight}</p>}
            {rc.linked_to?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {rc.linked_to.map((co, i) => (
                  <span key={i} className="ft-sans" style={{ background: t.bgMuted, border: `1px solid ${t.borderHover}`, color: t.textSub, fontSize: 11, padding: "4px 10px", borderRadius: 4 }}>{co}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PremiumCard>
  );
}
