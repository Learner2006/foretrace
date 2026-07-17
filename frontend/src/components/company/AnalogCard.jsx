import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MV } from "../../styles/animations";
import { PremiumCard, Sparkline, ConfidenceRing, Icon } from "../ui/UI";

const typeStyle = (type, t) =>
  type === "success"
    ? { accent: t.positive,  scoreBg: t.positiveBg, scoreBorder: `${t.positive}55`, badge: t.positiveBg, badgeText: t.positive, badgeBorder: `${t.positive}44`, borderLeft: t.positive, label: "SUCCESS PATH" }
    : { accent: t.warning,   scoreBg: t.warningBg,  scoreBorder: `${t.warning}55`,  badge: t.warningBg,  badgeText: t.warning,  badgeBorder: `${t.warning}44`,  borderLeft: t.warning,  label: "FAILURE PATH" };

const Dot = ({color, size=4, opacity=1}) => (
  <span style={{width:size, height:size, borderRadius:"50%", background:color, flexShrink:0, opacity, display:"inline-block"}} />
);

const ProBadge = ({t}) => (
  <span className="ft-sans" style={{fontSize:9, fontWeight:700, background:t.text, color:t.bg, padding:"1px 7px", borderRadius:3, letterSpacing:"0.3px"}}>PRO</span>
);

export default function AnalogCard({ t, analog, isMobile, vfn }) {
  const navigate   = useNavigate();
  const [expanded, setExpanded] = useState(false);
  if (!analog || !t) return null;

  const ts      = typeStyle(analog.type, t);
  const hasLink = !!analog.analog_ticker;

  return (
    <motion.div variants={vfn?.(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true, amount:0.1}}>
      <PremiumCard
        t={t}
        style={{
          background:  t.analogBg,
          borderLeft:  `3px solid ${ts.borderLeft}`,
          cursor:      hasLink ? "pointer" : "default",
        }}
        onClick={() => hasLink && navigate(`/AnalysisPage?ticker=${analog.analog_ticker}&name=${analog.analog_ticker}`)}
      >

<div style={{background:t.bgSubtle, borderBottom:`1px solid ${t.border}`, padding:"10px 20px 10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <motion.div animate={{opacity:[1,0.45,1]}} transition={{duration:2.4, repeat:Infinity, ease:"easeInOut"}}>
              <Dot color="#5C9B6E" size={6} />
            </motion.div>
            <span className="ft-sans" style={{fontSize:11, color:t.textSub, fontWeight:500}}>Analog Engine · Structural match report</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <span className="ft-sans" style={{background:ts.badge, color:ts.badgeText, border:`1px solid ${ts.badgeBorder}`, fontSize:9, fontWeight:700, letterSpacing:"0.12em", padding:"3px 8px", borderRadius:3, textTransform:"uppercase"}}>
              {ts.label}
            </span>
            <span className="ft-sans" style={{background:ts.scoreBg, border:`1px solid ${ts.scoreBorder}`, color:ts.accent, fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:4}}>
              {analog.similarity_score ?? "—"}% match
            </span>
            <span className="ft-sans" style={{fontSize:10, color:t.textMuted}}>{analog.matchCount} matches found</span>
            <ProBadge t={t} />
          </div>
        </div>

        <div style={{padding:isMobile?"20px 16px":"24px 28px"}}>

<div style={{display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap", marginBottom:20}}>
            <span className="ft-sans" style={{fontSize:11, color:t.textMuted, fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase"}}>Closest structural analog</span>
            <span style={{width:16, height:1, background:t.border, display:"inline-block", flexShrink:0, marginBottom:3}} />
            <span className="ft-serif" style={{fontSize:22, color:ts.accent, fontWeight:400}}>{analog.company}</span>
            {analog.year && <span className="ft-sans" style={{fontSize:13, color:t.textSub}}>{analog.year}</span>}
            <span className="ft-sans" style={{fontSize:10, color:t.positive, background:t.positiveBg, border:`1px solid ${t.positive}22`, padding:"1px 8px", borderRadius:3, fontWeight:600, marginLeft:4}}>
              Top {100 - analog.corpusPercentile}% match in corpus
            </span>
          </div>

{analog.comparison?.length > 0 && (
            <div style={{marginBottom:24}}>
              {!isMobile && (
                <div style={{display:"grid", gridTemplateColumns:"148px 1fr 1fr 52px 48px", marginBottom:6}}>
                  <span />
                  <span className="ft-sans" style={{fontSize:10, color:t.textMuted, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", paddingLeft:14}}>{analog.company} · {analog.year}</span>
                  <span className="ft-sans" style={{fontSize:10, color:t.text, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", paddingLeft:14}}>Current</span>
                  <span className="ft-sans" style={{fontSize:10, color:t.textMuted, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", textAlign:"center"}}>Δ</span>
                  <span className="ft-sans" style={{fontSize:10, color:t.textMuted, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", textAlign:"right"}}>Trend</span>
                </div>
              )}
              {analog.comparison.map((row, i) => {
                const sparkColor = row.dir === "neutral" ? t.neutral : t.warning;
                return (
                  <motion.div key={row.dimension}
                    initial={{opacity:0, x:-8}} whileInView={{opacity:1, x:0}} viewport={{once:true}}
                    transition={{delay:i*0.07, duration:0.35}}
                    whileHover={{backgroundColor:t.bgMuted}}
                    style={{display:"grid", gridTemplateColumns:isMobile?"1fr":"148px 1fr 1fr 52px 48px", borderTop:`1px solid ${t.border}`, padding:"9px 6px", alignItems:"center", gap:isMobile?2:0, borderRadius:4, marginLeft:-6, marginRight:-6, transition:"background 0.15s"}}>
                    <span className="ft-sans" style={{fontSize:11, color:t.textMuted, fontWeight:500}}>{row.dimension}</span>
                    <span className="ft-sans" style={{fontSize:12, color:t.textSub, lineHeight:1.5, fontStyle:"italic", paddingLeft:isMobile?0:14, borderLeft:isMobile?"none":`1px solid ${t.border}`}}>{row.then}</span>
                    <span className="ft-sans" style={{fontSize:12, color:t.text, lineHeight:1.5, fontWeight:500, paddingLeft:isMobile?0:16, borderLeft:isMobile?"none":`2px solid ${t.borderHover}`}}>{row.now}</span>
                    {!isMobile && <span className="ft-sans" style={{fontSize:10, color:sparkColor, fontWeight:600, textAlign:"center", fontVariantNumeric:"tabular-nums"}}>{row.delta}</span>}
                    {!isMobile && <div style={{display:"flex", justifyContent:"flex-end"}}><Sparkline data={row.trend} width={44} height={16} color={sparkColor} baseline /></div>}
                  </motion.div>
                );
              })}
            </div>
          )}

<div style={{marginBottom:20}}>
            {[
              ["Why they resemble", analog.what_they_resembled, null],
              ["What they did",     analog.action_taken,        null],
              ["Outcome",           analog.outcome,             ts.accent],
              ["Key difference",    analog.key_difference,      null],
            ].map(([label, text, color]) => text && (
              <div key={label} style={{marginBottom:12}}>
                <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 4px"}}>{label}</p>
                <p className="ft-sans" style={{fontSize:12, color:color || t.textSub, lineHeight:1.7, margin:0, fontWeight:300}}>{text}</p>
              </div>
            ))}
          </div>

<div style={{display:"flex", flexDirection:isMobile?"column":"row", gap:isMobile?16:32, alignItems:"flex-start", paddingTop:20, borderTop:`1px solid ${t.border}`}}>

<div style={{display:"flex", flexDirection:"column", alignItems:isMobile?"flex-start":"center", gap:8, flexShrink:0}}>
              <p className="ft-sans" style={{fontSize:10, color:t.textMuted, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", margin:0}}>Match confidence</p>
              <ConfidenceRing value={analog.confidence} corpusPercentile={analog.corpusPercentile} size={isMobile?80:92} t={t} />
              <span className="ft-sans" style={{fontSize:11, color:t.textMuted}}>1 of {analog.matchCount} matches</span>
            </div>

<div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:10}}>
              {analog.citation && (
                <span className="ft-sans" style={{fontSize:10, color:t.textMuted, fontStyle:"italic"}}>{analog.citation}</span>
              )}
              <div style={{display:"flex", gap:12, alignItems:"center"}}>
                <motion.button
                  onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  whileHover={{backgroundColor:t.bgMuted, borderColor:t.borderHover}}
                  style={{background:"none", border:`1px solid ${t.border}`, borderRadius:7, padding:"6px 14px", fontSize:11, fontWeight:600, color:t.text, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:5}}>
                  {expanded ? "Hide reasoning ↑" : "Why this analog? ↓"}
                </motion.button>
                {hasLink
                  ? <motion.button
                      onClick={e => { e.stopPropagation(); navigate(`/AnalysisPage?ticker=${analog.analog_ticker}&name=${analog.analog_ticker}`); }}
                      whileHover={{backgroundColor:t.bgMuted, borderColor:t.borderHover}}
                      style={{background:"none", border:`1px solid ${t.border}`, borderRadius:7, padding:"6px 14px", fontSize:11, fontWeight:600, color:ts.accent, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:5}}>
                      View company <Icon path="M9 18l6-6-6-6" size={10} color="currentColor" />
                    </motion.button>
                  : <span className="ft-sans" style={{fontSize:11, color:t.textMuted}}>Ticker unavailable</span>
                }
              </div>
            </div>
          </div>

<AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="expanded"
                initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}} exit={{opacity:0, height:0}}
                transition={{duration:0.25, ease:"easeInOut"}}
                style={{overflow:"hidden"}}
                onClick={e => e.stopPropagation()}
              >
                <div style={{marginTop:16, background:t.bgMuted, border:`1px solid ${t.border}`, borderRadius:8, padding:"18px 20px", display:"flex", flexDirection:"column", gap:14}}>
                  <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:0}}>Why this analog?</p>

                  {analog.what_they_resembled && (
                    <div>
                      <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 4px"}}>Pattern matched</p>
                      <p className="ft-sans" style={{fontSize:12, color:t.textSub, lineHeight:1.7, margin:0, fontWeight:300}}>{analog.what_they_resembled}</p>
                    </div>
                  )}

                  {analog.similarity_basis?.length > 0 && (
                    <div>
                      <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 8px"}}>Signal matches</p>
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        {analog.similarity_basis.map((item, i) => (
                          <div key={i} style={{display:"flex", alignItems:"flex-start", gap:8}}>
                            <span style={{color:ts.accent, fontSize:11, marginTop:2, flexShrink:0}}>›</span>
                            <p className="ft-sans" style={{fontSize:12, color:t.textSub, lineHeight:1.65, margin:0, fontWeight:300}}>{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analog.key_difference && (
                    <div>
                      <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 4px"}}>What makes it imperfect</p>
                      <p className="ft-sans" style={{fontSize:12, color:t.textSub, lineHeight:1.7, margin:0, fontWeight:300}}>{analog.key_difference}</p>
                    </div>
                  )}

                  {analog.lessons_learned && (
                    <div>
                      <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 4px"}}>Lessons learned</p>
                      <p className="ft-sans" style={{fontSize:12, color:t.textSub, lineHeight:1.7, margin:0, fontWeight:300}}>{analog.lessons_learned}</p>
                    </div>
                  )}

                  {analog.invalidation_triggers && (
                    <div>
                      <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 4px"}}>What could invalidate this comparison</p>
                      <p className="ft-sans" style={{fontSize:12, color:t.textSub, lineHeight:1.7, margin:0, fontWeight:300}}>{analog.invalidation_triggers}</p>
                    </div>
                  )}

                  {analog.citation && (
                    <div>
                      <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.8px", textTransform:"uppercase", margin:"0 0 4px"}}>Source</p>
                      <p className="ft-sans" style={{fontSize:11, color:t.textSub, fontStyle:"italic", lineHeight:1.5, margin:0}}>{analog.citation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </PremiumCard>
    </motion.div>
  );
}
