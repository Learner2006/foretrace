import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion";
import SearchBar from "../components/ui/SearchBar";

import { MV, EASE_OUT_EXPO } from "../styles/animations";
import { ANALOG, COVERAGE, PULSE_MATRIX, TICKER_ITEMS, STRUCTURAL_FEED, CHAIN } from "../styles/data";
import { useBreakpoint } from "../hooks/useWindowWidth";
import { Icon, Sparkline, ConfidenceBar, ConfidenceRing, SignalBadge, SignalStrength, DensityBar, PremiumCard } from "../components/ui/UI";
import { useTheme } from "../hooks/useTheme";

const ITEM_W = 260;
const STATUS_LABELS = ["3 structural shifts this week","5 analog matches updated","2 expansion pivots detected"];
const PULSE_PATH = "M22 7L13.5 15.5L8.5 10.5L2 17M16 7h6v6";
const DIVIDER = {initial:{scaleX:0},whileInView:{scaleX:1},viewport:{once:true},transition:{duration:0.65,ease:EASE_OUT_EXPO}};
import { SectionLabel, ProBadge, Dot, Divider } from "../components/ui/Primitives";

function SignalTicker({t}) {
  const [paused, setPaused] = useState(false);
  const mask = "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)";
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{height:32,background:t.tickerBg,borderBottom:"1px solid rgba(255,255,255,0.06)",overflow:"hidden",cursor:"default",maskImage:mask,WebkitMaskImage:mask}}>
      <motion.div animate={paused?{}:{x:[0,-(TICKER_ITEMS.length*ITEM_W)]}}
        transition={{duration:38,repeat:Infinity,ease:"linear",repeatType:"loop"}}
        style={{display:"flex",alignItems:"center",height:"100%",width:"max-content"}}>
        {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i) => (
          <span key={i} className="ft-sans" style={{fontSize:10,color:i%3===0?t.tickerText:`${t.tickerText}99`,padding:"0 28px",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:8,width:ITEM_W,borderRight:"1px solid rgba(255,255,255,0.06)"}}>
            <Dot color="#4CAF7D" opacity={0.8} />{item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function FeedRow({item, t, isMobile, delay=0, isHot=false}) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, {once:true,amount:0.5});
  const sparkColor = item.severity==="positive" ? t.positive : item.dir==="neutral" ? t.neutral : t.warning;
  const sectorBg = item.severity==="positive" ? t.positiveBg : item.severity==="warning" ? t.warningBg : t.bgSubtle;
  const sectorFg = item.severity==="positive" ? t.positive : item.severity==="warning" ? t.warning : t.neutral;
  return (
    <motion.div ref={ref} initial={{opacity:0,y:8}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:0.35,delay,ease:EASE_OUT_EXPO}}>
      <motion.button onClick={() => setExpanded(e => !e)} whileHover={{backgroundColor:t.bgSubtle}}
        style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:isMobile?"12px 16px":"11px 20px",display:"flex",alignItems:"center",gap:isMobile?10:14,borderBottom:`1px solid ${t.border}`,transition:"background 0.15s"}}>
        {!isMobile && <DensityBar data={item.density} color={sparkColor} active={isHot} />}
        <div style={{flex:1,minWidth:0,textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span className="ft-sans" style={{fontSize:13,fontWeight:600,color:t.text,whiteSpace:"nowrap"}}>{item.company}</span>
            {!isMobile && <span className="ft-sans" style={{fontSize:10,fontWeight:500,color:sectorFg,background:sectorBg,padding:"1px 6px",borderRadius:3,letterSpacing:"0.2px",whiteSpace:"nowrap"}}>{item.sector}</span>}
          </div>
          <span className="ft-sans" style={{fontSize:11,color:t.textSub,display:"block",marginTop:1}}>{item.event}</span>
        </div>
        {!isMobile && <Sparkline data={item.spark} width={52} height={18} color={sparkColor} baseline />}
        <ConfidenceBar value={item.confidence} t={t} width={isMobile?36:48} label={!isMobile} />
        <SignalBadge signal={item.dir==="neutral"?"→ Stable":item.dir==="up"?"↑ Rising":"↓ Declining"} dir={item.dir} t={t} />
        {!isMobile && (
          <div style={{textAlign:"right",flexShrink:0,minWidth:60}}>
            <span className="ft-sans" style={{fontSize:10,color:t.textMuted,display:"block"}}>{item.horizon}</span>
            <span className="ft-sans" style={{fontSize:10,color:t.textMuted,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}>
              <Dot color={item.updated.includes("h")?"#4CAF7D":t.textMuted} opacity={0.7} />
              {item.updated}
            </span>
          </div>
        )}
        <motion.span animate={{rotate:expanded?180:0}} transition={{duration:0.18}} style={{flexShrink:0}}>
          <Icon path="M19 9l-7 7-7-7" size={13} color={t.textMuted} />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            transition={{duration:0.22,ease:"easeOut"}}
            style={{overflow:"hidden",background:t.bgSubtle,borderBottom:`1px solid ${t.border}`}}>
            <div style={{padding:isMobile?"10px 16px 12px":"10px 20px 14px",display:"flex",alignItems:"flex-start",gap:16}}>
              <p className="ft-sans" style={{fontSize:12,color:t.textSub,margin:0,lineHeight:1.7,fontWeight:300,flex:1}}>{item.detail}</p>
              <button onClick={e => e.stopPropagation()} className="ft-sans"
                style={{fontSize:11,color:t.text,background:"none",border:`1px solid ${t.border}`,borderRadius:6,padding:"4px 10px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                View full analysis →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MarketPulseMatrix({t, isMobile}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:1,background:t.border,borderRadius:12,overflow:"hidden",border:`1px solid ${t.border}`}}>
      {PULSE_MATRIX.map((cell,i) => {
        const sparkColor = cell.dir==="up"?(cell.severity==="positive"?t.positive:t.warning):cell.dir==="down"?t.warning:t.neutral;
        return (
          <motion.div key={cell.label} initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}
            transition={{delay:i*0.07,duration:0.35}}
            style={{background:t.bgCard,padding:isMobile?"14px":"18px 20px",display:"flex",flexDirection:"column",gap:10,cursor:"default"}}>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
              <span className="ft-serif" style={{fontSize:isMobile?26:30,color:t.text,lineHeight:1,fontWeight:400}}>{cell.count}</span>
              <Sparkline data={cell.spark} width={48} height={20} color={sparkColor} />
            </div>
            <div>
              <span className="ft-sans" style={{fontSize:11,fontWeight:600,color:t.text,display:"block",lineHeight:1.3}}>{cell.label}</span>
              <span className="ft-sans" style={{fontSize:10,color:t.textMuted,marginTop:2,display:"block"}}>{cell.change}</span>
            </div>
            <div style={{height:2,borderRadius:1,background:sparkColor,opacity:0.35}} />
          </motion.div>
        );
      })}
    </div>
  );
}

function CoveragePills({t, isMobile, vfn}) {
  const [paused, setPaused] = useState(false);
  const mask = "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)";
  if (!isMobile) return (
    <motion.div variants={vfn(MV.stagger)} initial="hidden" animate="visible"
      style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
      <motion.span variants={vfn(MV.fadeIn)} className="ft-sans" style={{fontSize:10,color:t.textMuted,fontWeight:500,letterSpacing:"0.7px",textTransform:"uppercase"}}>Covered</motion.span>
      {COVERAGE.map(name => (
        <motion.span key={name} variants={vfn(MV.pill)} whileHover={{scale:1.04,borderColor:t.borderHover}} transition={{duration:0.13}}
          className="ft-sans" style={{fontSize:11,color:t.textSub,background:t.bgSubtle,border:`1px solid ${t.border}`,borderRadius:5,padding:"3px 9px",cursor:"default"}}>
          {name}
        </motion.span>
      ))}
      <motion.span variants={vfn(MV.fadeIn)} className="ft-sans" style={{fontSize:11,color:t.textMuted}}>+ 190 more</motion.span>
    </motion.div>
  );
  return (
    <div style={{position:"relative",overflow:"hidden",maskImage:mask,WebkitMaskImage:mask}}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <motion.div animate={{x:paused?undefined:[0,-(COVERAGE.length*88)]}}
        transition={{duration:18,repeat:Infinity,ease:"linear",repeatType:"loop"}}
        style={{display:"flex",gap:8,width:"max-content"}}>
        {[...COVERAGE,...COVERAGE].map((name,i) => (
          <span key={i} className="ft-sans" style={{fontSize:11,color:t.textSub,background:t.bgSubtle,border:`1px solid ${t.border}`,borderRadius:5,padding:"4px 11px",flexShrink:0,whiteSpace:"nowrap"}}>{name}</span>
        ))}
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const navigate     = useNavigate();
  const shouldReduce = useReducedMotion();
  const { isMobile } = useBreakpoint();
  const { t } = useTheme();

  const [activeStep,     setActiveStep]     = useState(0);
  const [isPaused,       setIsPaused]       = useState(false);
  const [liveStatusIdx,  setLiveStatusIdx]  = useState(0);
  const chainRef  = useRef(null);
  const chainInView = useInView(chainRef, {amount:0.3});

  useEffect(() => {
    const id = setInterval(() => setLiveStatusIdx(i => (i+1)%STATUS_LABELS.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isPaused||!chainInView) return;
    const id = setInterval(() => setActiveStep(s => (s+1)%CHAIN.length), 2400);
    return () => clearInterval(id);
  }, [isPaused, chainInView]);

  const handleStepClick = i => { setActiveStep(i); setIsPaused(true); setTimeout(() => setIsPaused(false), 6000); };
  const vfn = useCallback(variant => shouldReduce ? MV.REDUCED : variant, [shouldReduce]);
  const maxW = {maxWidth:820,margin:"0 auto",padding:`0 ${isMobile?20:32}px`};
  const chainProgress = (activeStep+1)/CHAIN.length;

  return (
    <div style={{color:t.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}body{margin:0}
        .ft-sans{font-family:'DM Sans','Inter',sans-serif}.ft-serif{font-family:'DM Serif Display','Georgia',serif}
        @media(max-width:767px){.hide-mobile{display:none!important}.show-mobile{display:flex!important}}
        @media(min-width:768px){.hide-desktop{display:none!important}.show-mobile{display:none!important}}
        .chain-step{background:none;border:none;padding:0;text-align:left;cursor:pointer;width:100%;-webkit-tap-highlight-color:transparent}
        .chain-step:focus-visible,button:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:6px}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.25);border-radius:2px}
        .hero-grid{background-image:linear-gradient(rgba(128,128,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(128,128,128,0.04) 1px,transparent 1px);background-size:32px 32px}
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
        input::placeholder{color:#A8A49A}
      `}</style>

      <div role="status" aria-live="polite" aria-atomic="true" style={{position:"absolute",width:1,height:1,overflow:"hidden",clip:"rect(0,0,0,0)"}}>{CHAIN[activeStep]?.label}</div>
      {!shouldReduce && !isMobile && <SignalTicker t={t} />}

<div className="hero-grid" style={{...maxW,paddingTop:isMobile?48:76}}>
        <motion.div variants={vfn(MV.heroC)} initial="hidden" animate="visible" style={{textAlign:"center"}}>
          <motion.div variants={vfn(MV.heroCh)}
            style={{display:"inline-flex",alignItems:"center",gap:6,background:t.bgSubtle,border:`1px solid ${t.border}`,borderRadius:20,padding:"4px 13px",fontSize:11,fontWeight:500,color:t.textSub,letterSpacing:"0.4px",marginBottom:22,fontFamily:"'DM Sans',sans-serif"}}>
            <motion.span animate={{opacity:[1,0.4,1]}} transition={{duration:2.2,repeat:Infinity,ease:"easeInOut"}}>
              <Dot color="#4CAF7D" size={5} />
            </motion.span>
            Structural Intelligence Platform
          </motion.div>

          <motion.h1 variants={vfn(MV.heroCh)} className="ft-serif"
            style={{fontSize:isMobile?28:48,fontWeight:400,margin:"0 0 14px",lineHeight:1.1,letterSpacing:"-0.5px",color:t.text}}>
            Understand what a company<br />
            <em style={{color:t.textSub,fontStyle:"italic"}}>is actually becoming.</em>
          </motion.h1>

          <motion.p variants={vfn(MV.heroCh)} className="ft-sans"
            style={{color:t.textSub,fontSize:isMobile?13:15,margin:"0 auto 32px",lineHeight:1.7,maxWidth:400,fontWeight:300}}>
            Structural signals from SEC filings. Not predictions — patterns. Not opinions — evidence.
          </motion.p>

          <motion.div variants={vfn(MV.heroCh)} style={{position:"relative",maxWidth:480,margin:"0 auto"}}>
            <SearchBar t={t} onSearch={(ticker,name) => navigate("/AnalysisPage",{state:{ticker,companyName:name}})} loading={false} />
          </motion.div>

          <motion.div variants={vfn(MV.heroCh)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:isMobile?10:20,marginTop:14,flexWrap:"wrap"}}>
            <span className="ft-sans" style={{fontSize:11,color:t.textMuted,display:"flex",alignItems:"center",gap:5}}>
              <motion.span animate={{opacity:[1,0.4,1]}} transition={{duration:2.2,repeat:Infinity,ease:"easeInOut"}}><Dot color="#4CAF7D" /></motion.span>
              214 companies monitored
            </span>
            <span style={{width:1,height:10,background:t.border,flexShrink:0}} />
            <AnimatePresence mode="wait">
              <motion.span key={liveStatusIdx} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:0.22}}
                className="ft-sans" style={{fontSize:11,color:t.warning,display:"flex",alignItems:"center",gap:5}}>
                <Dot color={t.warning} />{STATUS_LABELS[liveStatusIdx]}
              </motion.span>
            </AnimatePresence>
            <span style={{width:1,height:10,background:t.border,flexShrink:0}} />
            <span className="ft-sans" style={{fontSize:11,color:t.textMuted,display:"flex",alignItems:"center",gap:5}}>
              <Dot color={t.textMuted} />Updated 2h ago
            </span>
          </motion.div>
        </motion.div>
      </div>

<div style={{...maxW,marginTop:36}}>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4,delay:0.3}}>
          <CoveragePills t={t} isMobile={isMobile} vfn={vfn} />
        </motion.div>
      </div>

      <motion.div {...DIVIDER} style={{...maxW,marginTop:56,transformOrigin:"left"}}><Divider t={t} /></motion.div>

<div style={{...maxW,marginTop:64}}>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}} style={{marginBottom:20}}>
          <SectionLabel t={t} label="Market structure · now" />
          <h2 className="ft-serif" style={{fontSize:isMobile?20:26,fontWeight:400,margin:0,letterSpacing:"-0.3px",color:t.text}}>The structural landscape, compressed.</h2>
        </motion.div>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.1}}>
          <MarketPulseMatrix t={t} isMobile={isMobile} />
        </motion.div>
      </div>

<div style={{...maxW,marginTop:64}}>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}} style={{marginBottom:20}}>
          <SectionLabel t={t} label="Structural intelligence feed" />
          <h2 className="ft-serif" style={{fontSize:isMobile?20:26,fontWeight:400,margin:0,letterSpacing:"-0.3px",color:t.text}}>Shifts detected this quarter.</h2>
        </motion.div>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.1}}>
          <PremiumCard t={t} noLift>
            <div style={{background:t.bgSubtle,borderBottom:`1px solid ${t.border}`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <motion.div animate={{opacity:[1,0.35,1]}} transition={{duration:2.6,repeat:Infinity,ease:"easeInOut"}}><Dot color="#4CAF7D" size={6} /></motion.div>
                <span className="ft-sans" style={{fontSize:11,color:t.textSub,fontWeight:500}}>Live structural feed · 214 companies</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <span className="ft-sans" style={{fontSize:10,color:t.textMuted}}>{STRUCTURAL_FEED.length} active signals</span>
                <ProBadge t={t} />
              </div>
            </div>
            {!isMobile && (
              <div style={{display:"grid",gridTemplateColumns:"20px 1fr 60px 64px 72px 72px 18px",padding:"6px 20px",borderBottom:`1px solid ${t.border}`,alignItems:"center"}}>
                <span />
                {["Company · Signal","Trend","Confidence","Direction","Horizon",""].map((label,i) => (
                  <span key={i} className="ft-sans" style={{fontSize:9,fontWeight:600,color:t.textMuted,letterSpacing:"0.5px",textTransform:"uppercase",textAlign:i===4?"right":undefined}}>{label}</span>
                ))}
              </div>
            )}
            {STRUCTURAL_FEED.map((item,i) => (
              <FeedRow key={item.company} item={item} t={t} isMobile={isMobile} delay={i*0.06} isHot={i===0||i===3} />
            ))}
            <div style={{padding:"12px 20px",borderTop:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span className="ft-sans" style={{fontSize:11,color:t.textMuted}}>Showing 5 of 214 monitored companies</span>
              <motion.button onClick={() => navigate("/companies")} whileHover={{color:t.text}} transition={{duration:0.12}}
                style={{background:"none",border:"none",fontSize:11,color:t.textSub,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4}}>
                View all companies<Icon path="M9 18l6-6-6-6" size={11} color="currentColor" />
              </motion.button>
            </div>
          </PremiumCard>
        </motion.div>
      </div>

      <motion.div {...DIVIDER} style={{...maxW,marginTop:64,transformOrigin:"left"}}><Divider t={t} /></motion.div>

<div style={{...maxW,marginTop:64}}>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}} style={{marginBottom:28}}>
          <SectionLabel t={t} label="Analog Engine" />
          <h2 className="ft-serif" style={{fontSize:isMobile?20:28,fontWeight:400,margin:"0 0 4px",letterSpacing:"-0.3px",color:t.text}}>History doesn't repeat. But structure does.</h2>
          <p className="ft-sans" style={{fontSize:12,color:t.textSub,margin:0,maxWidth:440,lineHeight:1.7,fontWeight:300}}>Companies with structurally similar DNA — and what happened next.</p>
        </motion.div>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.1}}>
          <PremiumCard t={t} style={{background:t.analogBg}}>
            <div style={{background:t.bgSubtle,borderBottom:`1px solid ${t.border}`,padding:"10px 20px 10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <motion.div animate={{opacity:[1,0.45,1]}} transition={{duration:2.4,repeat:Infinity,ease:"easeInOut"}}><Dot color="#5C9B6E" size={6} /></motion.div>
                <span className="ft-sans" style={{fontSize:11,color:t.textSub,fontWeight:500}}>Analog Engine · Structural match report</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span className="ft-sans" style={{fontSize:10,color:t.textMuted}}>{ANALOG.matchCount} matches found</span>
                <ProBadge t={t} />
              </div>
            </div>
            <div style={{padding:isMobile?"20px 16px":"24px 28px"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap",marginBottom:20}}>
                <span className="ft-sans" style={{fontSize:11,color:t.textMuted,fontWeight:500,letterSpacing:"0.5px",textTransform:"uppercase"}}>Closest structural analog</span>
                <span style={{width:16,height:1,background:t.border,display:"inline-block",flexShrink:0,marginBottom:3}} />
                <span className="ft-serif" style={{fontSize:22,color:t.text,fontWeight:400}}>{ANALOG.analog}</span>
                <span className="ft-sans" style={{fontSize:13,color:t.textSub}}>{ANALOG.analogYear}</span>
                <span className="ft-sans" style={{fontSize:10,color:t.positive,background:t.positiveBg,border:`1px solid ${t.positive}22`,padding:"1px 8px",borderRadius:3,fontWeight:600,marginLeft:4}}>
                  Top {100-ANALOG.corpusPercentile}% match in corpus
                </span>
              </div>
              <div style={{marginBottom:24}}>
                {!isMobile && (
                  <div style={{display:"grid",gridTemplateColumns:"148px 1fr 1fr 52px 48px",marginBottom:6}}>
                    <span />
                    <span className="ft-sans" style={{fontSize:10,color:t.textMuted,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",paddingLeft:14}}>{ANALOG.analog} · {ANALOG.analogYear}</span>
                    <span className="ft-sans" style={{fontSize:10,color:t.text,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",paddingLeft:14}}>Current</span>
                    <span className="ft-sans" style={{fontSize:10,color:t.textMuted,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",textAlign:"center"}}>Δ</span>
                    <span className="ft-sans" style={{fontSize:10,color:t.textMuted,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",textAlign:"right"}}>Trend</span>
                  </div>
                )}
                {ANALOG.comparison.map((row,i) => {
                  const sparkColor = row.dir==="neutral"?t.neutral:t.warning;
                  return (
                    <motion.div key={row.dimension} initial={{opacity:0,x:-8}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.07,duration:0.35}}
                      whileHover={{backgroundColor:t.bgMuted}}
                      style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"148px 1fr 1fr 52px 48px",borderTop:`1px solid ${t.border}`,padding:"9px 6px",alignItems:"center",gap:isMobile?2:0,borderRadius:4,marginLeft:-6,marginRight:-6,transition:"background 0.15s"}}>
                      <span className="ft-sans" style={{fontSize:11,color:t.textMuted,fontWeight:500}}>{row.dimension}</span>
                      <span className="ft-sans" style={{fontSize:12,color:t.textSub,lineHeight:1.5,fontStyle:"italic",paddingLeft:isMobile?0:14,borderLeft:isMobile?"none":`1px solid ${t.border}`}}>{row.then}</span>
                      <span className="ft-sans" style={{fontSize:12,color:t.text,lineHeight:1.5,fontWeight:500,paddingLeft:isMobile?0:16,borderLeft:isMobile?"none":`2px solid ${t.borderHover}`}}>{row.now}</span>
                      {!isMobile && <span className="ft-sans" style={{fontSize:10,color:sparkColor,fontWeight:600,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{row.delta}</span>}
                      {!isMobile && <div style={{display:"flex",justifyContent:"flex-end"}}><Sparkline data={row.trend} width={44} height={16} color={sparkColor} baseline /></div>}
                    </motion.div>
                  );
                })}
              </div>
              <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:isMobile?16:32,alignItems:"flex-start",paddingTop:20,borderTop:`1px solid ${t.border}`}}>
                <div style={{flex:1}}>
                  <p className="ft-sans" style={{fontSize:10,color:t.textMuted,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",margin:"0 0 8px"}}>Historical outcome</p>
                  <p className="ft-sans" style={{fontSize:12,color:t.textSub,margin:"0 0 14px",lineHeight:1.7,fontWeight:300,fontStyle:"italic"}}>"{ANALOG.outcome}"</p>
                  <motion.button whileHover={{backgroundColor:t.bgMuted,borderColor:t.borderHover}}
                    style={{background:"none",border:`1px solid ${t.border}`,borderRadius:7,padding:"6px 14px",fontSize:11,fontWeight:600,color:t.text,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}>
                    View full match report<Icon path="M9 18l6-6-6-6" size={10} color="currentColor" />
                  </motion.button>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:isMobile?"flex-start":"center",gap:8,flexShrink:0}}>
                  <p className="ft-sans" style={{fontSize:10,color:t.textMuted,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",margin:0}}>Match confidence</p>
                  <ConfidenceRing value={ANALOG.confidence} corpusPercentile={ANALOG.corpusPercentile} size={isMobile?80:92} t={t} />
                  <span className="ft-sans" style={{fontSize:11,color:t.textMuted}}>1 of {ANALOG.matchCount} matches</span>
                </div>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      </div>

      {/* REASONING CHAIN */}
      <div style={{...maxW,marginTop:64}} ref={chainRef}>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}} style={{marginBottom:28}}>
          <SectionLabel t={t} label="Reasoning engine" />
          <h2 className="ft-serif" style={{fontSize:isMobile?20:28,fontWeight:400,margin:0,letterSpacing:"-0.3px",color:t.text}}>Not a score. A chain of evidence.</h2>
        </motion.div>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.1}}>
          <PremiumCard t={t} style={{background:t.chainBg}}>
            <div style={{background:t.bgSubtle,borderBottom:`1px solid ${t.border}`,padding:"10px 20px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {["#E06C75","#E5C07B","#98C379"].map(c => <span key={c} style={{width:9,height:9,borderRadius:"50%",background:c,opacity:0.7}} />)}
                  <span className="ft-sans" style={{fontSize:11,color:t.textMuted,marginLeft:8}}>Reasoning chain · Apple Inc. · FY2024</span>
                </div>
                <span className="ft-sans" style={{fontSize:10,color:t.textMuted}}>{isPaused?"paused":`${activeStep+1} / ${CHAIN.length}`}</span>
              </div>
              {!shouldReduce && (
                <div style={{height:2,background:t.bgMuted,borderRadius:1,overflow:"hidden"}}>
                  <motion.div animate={{scaleX:chainProgress}} transition={{duration:0.3,ease:"easeOut"}}
                    style={{height:"100%",background:t.text,borderRadius:1,transformOrigin:"0%"}} />
                </div>
              )}
            </div>
            <div style={{padding:isMobile?"20px 16px":"24px 28px"}}>
              {CHAIN.map((step,i) => {
                const isActive = i===activeStep, isPast = i<activeStep;
                return (
                  <button key={step.label} className="chain-step" onClick={() => handleStepClick(i)}
                    aria-label={`Step ${step.id}: ${step.label}`} aria-current={isActive?"step":undefined}>
                    <div style={{display:"flex",gap:isMobile?12:16}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:26}}>
                        <motion.div animate={{background:isActive?t.text:isPast?t.textSub:t.bgMuted,scale:isActive?1.1:1}} transition={{duration:0.22}}
                          style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginTop:9,flexShrink:0}}>
                          <motion.span animate={{color:isActive?t.bg:isPast?t.bg:t.textMuted}} className="ft-sans" style={{fontSize:10,fontWeight:600,lineHeight:1}}>{step.id}</motion.span>
                        </motion.div>
                        {i<CHAIN.length-1 && <motion.div animate={{background:isPast?t.textSub:t.border}} transition={{duration:0.3}} style={{width:1,flex:1,minHeight:20}} />}
                      </div>
                      <div style={{paddingBottom:i<CHAIN.length-1?14:0,paddingTop:7,flex:1,borderLeft:isActive?`2px solid ${t.text}`:"2px solid transparent",paddingLeft:isActive?10:0,transition:"border-color 0.2s, padding-left 0.2s",boxShadow:isActive?`inset 3px 0 12px -4px ${t.text}18`:"none"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:isActive?6:0}}>
                          <motion.span animate={{color:isActive?t.text:isPast?t.textSub:t.textMuted}} className="ft-sans"
                            style={{fontSize:13,fontWeight:isActive?600:500,lineHeight:1.4}}>{step.label}</motion.span>
                          <SignalStrength level={step.strength} t={t} />
                          <motion.span animate={{opacity:isActive||isPast?1:0.5}} className="ft-sans"
                            style={{fontSize:10,color:step.dir==="neutral"?t.textMuted:t.warning,background:step.dir==="neutral"?t.bgSubtle:t.warningBg,padding:"1px 6px",borderRadius:3,fontWeight:600,fontVariantNumeric:"tabular-nums",border:`1px solid ${step.dir==="neutral"?t.border:t.warning}22`}}>
                            {step.signal}
                          </motion.span>
                        </div>
                        <AnimatePresence>
                          {isActive && (
                            <motion.p initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                              transition={{duration:0.22,ease:"easeOut"}}
                              className="ft-sans" style={{fontSize:12,color:t.textSub,margin:0,lineHeight:1.65,fontWeight:300,overflow:"hidden"}}>
                              {step.detail}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${t.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span className="ft-sans" style={{fontSize:10,fontWeight:600,color:t.textMuted,letterSpacing:"0.5px",textTransform:"uppercase"}}>Estimated strategic horizon</span>
                  <span className="ft-sans" style={{fontSize:10,color:t.textSub}}>12–18 months</span>
                </div>
                <div style={{height:4,background:t.bgMuted,borderRadius:2,overflow:"hidden",position:"relative"}}>
                  <motion.div initial={{scaleX:0}} whileInView={{scaleX:0.72}} viewport={{once:true}}
                    transition={{duration:1.1,ease:EASE_OUT_EXPO,delay:0.3}}
                    style={{height:"100%",background:`linear-gradient(90deg, ${t.text}88, ${t.text})`,borderRadius:2,transformOrigin:"0%"}} />
                  <div style={{position:"absolute",top:0,left:"50%",width:1,height:"100%",background:t.border,opacity:0.7}} />
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                  {["Now","6mo","12mo","18mo+"].map(label => (
                    <span key={label} className="ft-sans" style={{fontSize:9,color:t.textMuted}}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      </div>

      {/* OPERATIONAL CTA */}
      <div style={{...maxW,marginTop:64,marginBottom:80}}>
        <motion.div variants={vfn(MV.fadeUp)} initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}}>
          <PremiumCard t={t} style={{background:t.bgSubtle}}>
            <div style={{padding:isMobile?"28px 20px":"36px 40px",display:"flex",flexDirection:isMobile?"column":"row",alignItems:isMobile?"flex-start":"center",gap:isMobile?20:40,justifyContent:"space-between"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:24,height:24,borderRadius:6,background:t.text,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon path={PULSE_PATH} size={11} color={t.bg} />
                  </div>
                  <span className="ft-sans" style={{fontSize:11,fontWeight:600,color:t.text,letterSpacing:"-0.1px"}}>Your watchlist is empty</span>
                </div>
                <p className="ft-sans" style={{fontSize:13,color:t.textSub,margin:0,lineHeight:1.65,fontWeight:300,maxWidth:380}}>
                  Add a company to begin monitoring structural signals. ForeTrace tracks 214 companies across 18 sectors.
                </p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,flexShrink:0,width:isMobile?"100%":"auto"}}>
                <motion.button onClick={() => navigate("/AnalysisPage")} whileHover={{opacity:0.85}} whileTap={{scale:0.97}}
                  style={{background:t.text,color:t.bg,border:"none",borderRadius:8,padding:"10px 22px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.1px",width:isMobile?"100%":"auto",textAlign:"center"}}>
                  Analyze a company →
                </motion.button>
                <motion.button onClick={() => navigate("/upgrade")} whileHover={{borderColor:t.borderHover}}
                  style={{background:"none",border:`1px solid ${t.border}`,borderRadius:8,padding:"9px 22px",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:t.textSub,width:isMobile?"100%":"auto",textAlign:"center"}}>
                  View Pro features
                </motion.button>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      </div>
    </div>
  );
}
