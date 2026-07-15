import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { MV, v } from "../styles/animations";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { Icon, PremiumCard } from "../components/ui/UI";

const BOOKMARK_PATH = "M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z";
const TRASH_PATH    = "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6";
const ARROW_PATH    = "M5 12h14M12 5l7 7-7 7";
const SEARCH_PATH   = "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z";

export default function WatchlistPage() {
  const navigate     = useNavigate();
  const { isMobile } = useBreakpoint();

  const { t } = useTheme();

  const [watchlist,  setWatchlist]  = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("foretrace_watchlist") || "[]");
    } catch {
      return [];
    }
  });
  const [removing,   setRemoving]   = useState(null);
  const [filter,     setFilter]     = useState("");

  // Delay removal animation slightly to let the Framer Motion collapse transition finish playing.
  const remove = (ticker) => {
    setRemoving(ticker);
    setTimeout(() => {
      const updated = watchlist.filter(c => c.ticker !== ticker);
      setWatchlist(updated);
      localStorage.setItem("foretrace_watchlist", JSON.stringify(updated));
      setRemoving(null);
    }, 320);
  };

  const goAnalyze = (c) => navigate("/AnalysisPage", { state: { ticker: c.ticker, companyName: c.name } });

const maxW = { maxWidth: 860, margin: "0 auto", padding: `0 ${isMobile ? 20 : 32}px` };

  const filtered = watchlist.filter(c =>
    !filter || c.ticker.toLowerCase().includes(filter.toLowerCase()) || c.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .ft-sans  { font-family: 'DM Sans','Inter',sans-serif; }
        .ft-serif { font-family: 'DM Serif Display','Georgia',serif; }
        .ft-mono  { font-family: 'DM Mono',monospace; }
        input::placeholder { color: ${t.textMuted}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 2px; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1 }}>

<div style={{ ...maxW, paddingTop: isMobile ? 40 : 60, paddingBottom: isMobile ? 32 : 48 }}>
        <motion.div variants={v(MV.heroC)} initial="hidden" animate="visible">
          <motion.div variants={v(MV.heroCh)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: t.bgSubtle, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: "4px 13px", marginBottom: 20,
          }}>
            <Icon path={BOOKMARK_PATH} size={11} color={t.textMuted} />
            <span className="ft-sans" style={{ fontSize: 11, fontWeight: 500, color: t.textSub, letterSpacing: "0.4px" }}>
              Watchlist
            </span>
          </motion.div>

          <motion.h1 variants={v(MV.heroCh)} className="ft-serif" style={{
            fontSize: isMobile ? 28 : 42, fontWeight: 400, margin: "0 0 12px",
            lineHeight: 1.15, letterSpacing: "-0.4px", color: t.text,
          }}>
            Your saved companies
          </motion.h1>

          <motion.p variants={v(MV.heroCh)} className="ft-sans" style={{
            color: t.textSub, fontSize: isMobile ? 13 : 14,
            margin: 0, lineHeight: 1.6, fontWeight: 300,
          }}>
            {watchlist.length > 0
              ? `${watchlist.length} compan${watchlist.length === 1 ? "y" : "ies"} saved — click to run analysis`
              : "Companies you save will appear here"}
          </motion.p>
        </motion.div>
      </div>

<div style={{ ...maxW, paddingBottom: 100 }}>

        {watchlist.length === 0 ? (

          <motion.div variants={v(MV.fadeUp)} initial="hidden" animate="visible">
            <PremiumCard t={t} style={{ background: t.bgSubtle }}>
              <div style={{ padding: isMobile ? "64px 24px" : "80px 48px", textAlign: "center" }}>
                <motion.div
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: t.bgSubtle, border: `1px solid ${t.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <Icon path={BOOKMARK_PATH} size={22} color={t.textMuted} />
                </motion.div>
                <h3 className="ft-serif" style={{ fontSize: 22, fontWeight: 400, color: t.text, margin: "0 0 10px", letterSpacing: "-0.2px" }}>
                  Nothing saved yet
                </h3>
                <p className="ft-sans" style={{ fontSize: 13, color: t.textSub, margin: "0 auto 32px", maxWidth: 320, lineHeight: 1.6, fontWeight: 300 }}>
                  Search for a company and click the bookmark icon to save it here for quick access.
                </p>
                <motion.button
                  onClick={() => navigate("/")}
                  whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
                  className="ft-sans"
                  style={{
                    background: t.text, color: t.bg, border: "none",
                    borderRadius: 8, padding: "10px 24px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Search companies
                </motion.button>
              </div>
            </PremiumCard>
          </motion.div>

        ) : (
          <>

            {watchlist.length > 3 && (
              <motion.div
                variants={v(MV.fadeUp)} initial="hidden" animate="visible"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: t.bgSubtle, border: `1px solid ${t.border}`,
                  borderRadius: 10, padding: "9px 14px", marginBottom: 16,
                }}
              >
                <Icon path={SEARCH_PATH} size={14} color={t.textMuted} />
                <input
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Filter by ticker or name…"
                  className="ft-sans"
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    fontSize: 13, color: t.text, fontFamily: "'DM Sans',sans-serif",
                  }}
                />
                <AnimatePresence>
                  {filter && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setFilter("")}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: t.textMuted }}
                    >
                      <Icon path="M18 6L6 18M6 6l12 12" size={12} color={t.textMuted} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.div
                    key={c.ticker}
                    variants={v(MV.fadeUp)}
                    initial="hidden"
                    animate={removing === c.ticker ? { opacity: 0, x: 24, transition: { duration: 0.28 } } : "visible"}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PremiumCard t={t} glow>
                      <div style={{
                        padding: isMobile ? "16px" : "18px 24px",
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 12,
                      }}>

                        <div
                          onClick={() => goAnalyze(c)}
                          style={{ cursor: "pointer", flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14 }}
                        >

                          <div style={{
                            flexShrink: 0,
                            background: t.bgSubtle, border: `1px solid ${t.border}`,
                            borderRadius: 8, padding: "6px 10px",
                            minWidth: 52, textAlign: "center",
                          }}>
                            <span className="ft-mono" style={{ fontSize: 12, fontWeight: 400, color: t.text, letterSpacing: "0.5px" }}>
                              {c.ticker}
                            </span>
                          </div>

<div style={{ minWidth: 0 }}>
                            <p className="ft-sans" style={{
                              fontSize: 14, fontWeight: 500, color: t.text,
                              margin: "0 0 2px", whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {c.name || c.ticker}
                            </p>
                            {c.savedAt && (
                              <p className="ft-sans" style={{ fontSize: 11, color: t.textMuted, margin: 0, fontWeight: 300 }}>
                                Saved {c.savedAt}
                              </p>
                            )}
                          </div>
                        </div>

<div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <motion.button
                            onClick={() => goAnalyze(c)}
                            whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.96 }}
                            className="ft-sans"
                            style={{
                              background: t.text, color: t.bg, border: "none",
                              borderRadius: 7, padding: isMobile ? "7px 12px" : "7px 16px",
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                              fontFamily: "'DM Sans',sans-serif",
                              display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            {!isMobile && "Analyze"}
                            <Icon path={ARROW_PATH} size={12} color={t.bg} />
                          </motion.button>

                          <motion.button
                            onClick={() => remove(c.ticker)}
                            whileHover={{ borderColor: t.borderHover }} whileTap={{ scale: 0.94 }}
                            style={{
                              background: "none", border: `1px solid ${t.border}`,
                              borderRadius: 7, width: 32, height: 32,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer",
                            }}
                            aria-label="Remove from watchlist"
                          >
                            <Icon path={TRASH_PATH} size={13} color={t.textMuted} />
                          </motion.button>
                        </div>
                      </div>
                    </PremiumCard>
                  </motion.div>
                ))}
              </AnimatePresence>

{filtered.length === 0 && filter && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: "center", padding: "40px 0" }}>
                  <p className="ft-sans" style={{ fontSize: 13, color: t.textMuted, fontWeight: 300 }}>
                    No companies match "{filter}"
                  </p>
                </motion.div>
              )}
            </div>

<motion.p
              variants={v(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="ft-sans"
              style={{ fontSize: 11, color: t.textMuted, textAlign: "center", marginTop: 32, fontWeight: 300 }}
            >
              Free plan · Watchlist limited to 3 companies ·{" "}
              <span
                onClick={() => navigate("/upgrade")}
                style={{ color: t.textSub, cursor: "pointer", textDecoration: "underline", textDecorationColor: t.border }}
              >
                Upgrade for unlimited
              </span>
            </motion.p>
          </>
        )}
      </div>
    </div>
      </div>
  );
}
