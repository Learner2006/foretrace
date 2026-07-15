import { motion } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { PremiumCard } from "../components/ui/UI";
import { MV, v } from "../styles/animations";

export default function PrivacyPage() {
  const { t } = useTheme();
  const { isMobile } = useBreakpoint();
  const maxW = { maxWidth: 860, margin: "0 auto", padding: `0 ${isMobile ? 20 : 32}px` };

  return (
    <div style={{ color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .ft-sans  { font-family: 'DM Sans','Inter',sans-serif; }
        .ft-serif { font-family: 'DM Serif Display','Georgia',serif; }
        .ft-mono  { font-family: 'DM Mono',monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 2px; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ ...maxW, paddingTop: isMobile ? 48 : 72, paddingBottom: isMobile ? 48 : 64 }}>
          <motion.div variants={v(MV.heroC)} initial="hidden" animate="visible">
            <motion.div variants={v(MV.heroCh)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="ft-sans" style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                Platform Governance
              </span>
            </motion.div>
            <motion.h1 variants={v(MV.heroCh)} className="ft-serif" style={{ fontSize: isMobile ? 32 : 46, fontWeight: 400, margin: "0 0 16px", letterSpacing: "-0.4px", color: t.text, lineHeight: 1.15 }}>
              Privacy & Data Custody
            </motion.h1>
            <motion.p variants={v(MV.heroCh)} className="ft-sans" style={{ fontSize: 14, color: t.textSub, margin: 0, fontWeight: 300, lineHeight: 1.65, maxWidth: 560 }}>
              ForeTrace operates under local-first and local-only data collection paradigms. We believe financial analysis should remain confidential and private.
            </motion.p>
          </motion.div>
        </div>

        <div style={{ ...maxW, paddingBottom: 100 }}>
          <motion.div variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <PremiumCard t={t} style={{ padding: isMobile ? "24px 20px" : "32px 40px" }}>
              <h2 className="ft-serif" style={{ fontSize: 20, fontWeight: 400, color: t.text, marginTop: 0, marginBottom: 12 }}>
                Our Core Principles
              </h2>
              <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.7, fontWeight: 300, marginBottom: 28 }}>
                Financial research requires absolute discretion. Whether you are analyzing competitors, researching potential investments, or looking up corporate risk matrices, your footprint should belong only to you.
              </p>

              <div style={{ display: "grid", gap: 24 }}>
                <div>
                  <h3 className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.text, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>
                    1. No Persistent Backend Storage
                  </h3>
                  <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65, fontWeight: 300, margin: 0 }}>
                    We do not maintain a database of your searches, company queries, or analysis results. Every time you parse a company's SEC filings, the data is processed on-the-fly and streamed directly to your client workspace.
                  </p>
                </div>

                <div>
                  <h3 className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.text, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>
                    2. Local-Only Storage caching
                  </h3>
                  <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65, fontWeight: 300, margin: 0 }}>
                    Your saved company watchlist is stored entirely within your browser's local storage (`localStorage`). This data never leaves your device and is never synchronized to external servers.
                  </p>
                </div>

                <div>
                  <h3 className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.text, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>
                    3. SEC EDGAR API Compliance
                  </h3>
                  <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65, fontWeight: 300, margin: 0 }}>
                    We access company filings directly via official SEC EDGAR HTTP requests. All communication is optimized, and no user search queries are sold, stored, or leveraged for commercial telemetry.
                  </p>
                </div>

                <div>
                  <h3 className="ft-sans" style={{ fontSize: 12, fontWeight: 600, color: t.text, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>
                    4. Secure AI Analysis Pipelines
                  </h3>
                  <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65, fontWeight: 300, margin: 0 }}>
                    Qualitative evaluations and structural analog models are generated by querying Groq API endpoints. The underlying filing data is transmitted securely, and it is not cached or used for training open AI models.
                  </p>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
