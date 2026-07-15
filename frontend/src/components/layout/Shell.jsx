import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { NAV_ITEMS } from "../../styles/tokens";
import { CMD_ITEMS, TICKER_ITEMS } from "../../styles/data";
import { EASE_OUT_EXPO, MV } from "../../styles/animations";
import { Icon } from "../ui/UI";

const ITEM_W      = 260;
const PULSE_PATH  = "M22 7L13.5 15.5L8.5 10.5L2 17M16 7h6v6";
const SEARCH_PATH = "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z";

import { SectionLabel, ProBadge, Dot, Divider } from "../ui/Primitives";
export { SectionLabel, ProBadge, Dot, Divider };

export function ScrollProgressBar({t}) {
  const scaleX = useSpring(useScroll().scrollYProgress, {stiffness:200, damping:30});
  return (
    <motion.div style={{position:"fixed", top:0, left:0, right:0, height:2, zIndex:200, background:t.text, scaleX, transformOrigin:"0%", opacity:0.55}} />
  );
}

export function SignalTicker({t}) {
  const [paused, setPaused] = useState(false);
  const mask = "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)";
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{height:32, background:t.tickerBg, borderBottom:"1px solid rgba(255,255,255,0.06)", overflow:"hidden", cursor:"default", maskImage:mask, WebkitMaskImage:mask}}>
      <motion.div animate={paused ? {} : {x:[0, -(TICKER_ITEMS.length * ITEM_W)]}}
        transition={{duration:38, repeat:Infinity, ease:"linear", repeatType:"loop"}}
        style={{display:"flex", alignItems:"center", height:"100%", width:"max-content"}}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="ft-sans" style={{fontSize:10, color:i%3===0 ? t.tickerText : `${t.tickerText}99`, padding:"0 28px", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:8, width:ITEM_W, borderRight:"1px solid rgba(255,255,255,0.06)"}}>
            <Dot color="#4CAF7D" opacity={0.8} />{item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function CommandPalette({open, onClose, t, navigate, toggleTheme}) {
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setQuery("");
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return CMD_ITEMS;
    return CMD_ITEMS
      .map(g => ({...g, items:g.items.filter(it => it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q))}))
      .filter(g => g.items.length > 0);
  }, [query]);

  const allItems = filtered.flatMap(g => g.items);

  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") { onClose(); return; }
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s+1, allItems.length-1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
      else if (e.key === "Enter" && allItems[selected]) {
        const item = allItems[selected];
        if (item.action === "theme") toggleTheme(); else if (item.path) navigate(item.path);
        onClose();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, allItems, selected, navigate, onClose, toggleTheme]);

  let gi = 0;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}
            onClick={onClose} style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:500, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)"}} />
          <motion.div initial={{opacity:0, scale:0.97, y:-8}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.97, y:-8}}
            transition={{duration:0.18, ease:EASE_OUT_EXPO}}
            style={{position:"fixed", top:"18%", left:"50%", transform:"translateX(-50%)", width:"min(560px, calc(100vw - 32px))", background:t.bgCard, border:`1px solid ${t.borderHover}`, borderRadius:14, overflow:"hidden", zIndex:501, boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:`1px solid ${t.border}`}}>
              <Icon path={SEARCH_PATH} size={15} color={t.textMuted} />
              <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }} placeholder="Search companies, pages, actions…" className="ft-sans"
                style={{flex:1, background:"none", border:"none", outline:"none", fontSize:14, color:t.text, fontFamily:"'DM Sans',sans-serif"}} />
              <kbd className="ft-sans" style={{fontSize:10, color:t.textMuted, background:t.bgSubtle, border:`1px solid ${t.border}`, borderRadius:4, padding:"2px 6px"}}>esc</kbd>
            </div>
            <div style={{maxHeight:340, overflowY:"auto", padding:"6px 0"}}>
              {filtered.length === 0 && <p className="ft-sans" style={{textAlign:"center", color:t.textMuted, fontSize:13, padding:"24px 0", margin:0}}>No results</p>}
              {filtered.map(group => (
                <div key={group.group}>
                  <p className="ft-sans" style={{fontSize:10, fontWeight:600, color:t.textMuted, letterSpacing:"0.6px", textTransform:"uppercase", margin:0, padding:"8px 16px 4px"}}>{group.group}</p>
                  {group.items.map(item => {
                    const isSel = gi === selected; gi++;
                    return (
                      <motion.button key={item.label + item.sub}
                        onClick={() => { if (item.action === "theme") toggleTheme(); else if (item.path) navigate(item.path); onClose(); }}
                        animate={{background: isSel ? t.bgSubtle : "transparent"}} transition={{duration:0.1}}
                        style={{width:"100%", background:"none", border:"none", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", gap:8}}>
                        <span className="ft-sans" style={{fontSize:13, color:t.text, fontWeight:isSel?500:400}}>{item.label}</span>
                        <span className="ft-sans" style={{fontSize:11, color:t.textMuted}}>{item.sub}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${t.border}`, padding:"8px 16px", display:"flex", gap:12}}>
              {[["↑↓","Navigate"],["↵","Open"],["esc","Close"]].map(([k,l]) => (
                <span key={k} className="ft-sans" style={{fontSize:10, color:t.textMuted, display:"flex", alignItems:"center", gap:4}}>
                  <kbd style={{background:t.bgSubtle, border:`1px solid ${t.border}`, borderRadius:3, padding:"1px 5px", fontFamily:"inherit"}}>{k}</kbd>{l}
                </span>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Nav({t, dark, toggleTheme, onCmdOpen, vfn}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.nav variants={vfn(MV.nav)} initial="hidden" animate="visible"
        style={{borderBottom:`1px solid ${t.border}`, padding:`0 20px`, display:"flex", alignItems:"center", justifyContent:"space-between", height:60, background:t.navBg, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", position:"sticky", top:0, zIndex:100}}>

<motion.div onClick={() => navigate("/")} style={{display:"flex", alignItems:"center", gap:9, cursor:"pointer", flexShrink:0}}
          whileHover={{opacity:0.75}} whileTap={{scale:0.96}} transition={{duration:0.15}}>
          <div style={{width:26, height:26, borderRadius:7, background:t.text, display:"flex", alignItems:"center", justifyContent:"center"}}>
            <Icon path={PULSE_PATH} size={12} color={t.bg} />
          </div>
          <span className="ft-sans" style={{fontSize:15, fontWeight:600, letterSpacing:"-0.3px", color:t.text}}>ForeTrace</span>
        </motion.div>

<div className="hide-mobile" style={{display:"flex", alignItems:"center", gap:2}}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <motion.button key={item.label} onClick={() => navigate(item.path)}
                whileHover={{backgroundColor:t.bgSubtle}} whileTap={{scale:0.97}} transition={{duration:0.12}}
                style={{background:"none", border:"none", padding:"5px 12px", borderRadius:7, fontSize:13, fontWeight:isActive?600:500, color:isActive?t.text:t.textSub, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif", position:"relative"}}>
                {item.label}
                {item.pro && <span style={{fontSize:8, fontWeight:700, background:t.text, color:t.bg, padding:"1px 5px", borderRadius:3, letterSpacing:"0.3px"}}>PRO</span>}
                {isActive && <motion.div layoutId="nav-active" style={{position:"absolute", bottom:-1, left:8, right:8, height:1.5, background:t.text, borderRadius:1}} />}
              </motion.button>
            );
          })}
        </div>

<div style={{display:"flex", alignItems:"center", gap:8}}>

          <motion.button className="hide-mobile" onClick={onCmdOpen}
            whileHover={{backgroundColor:t.bgSubtle, borderColor:t.borderHover}} whileTap={{scale:0.95}} transition={{duration:0.12}}
            style={{background:"none", border:`1px solid ${t.border}`, borderRadius:7, padding:"5px 10px", display:"flex", alignItems:"center", gap:6, cursor:"pointer"}}>
            <Icon path={SEARCH_PATH} size={13} color={t.textMuted} />
            <span className="ft-sans" style={{fontSize:11, color:t.textMuted}}>Search</span>
            <kbd className="ft-sans" style={{fontSize:9, color:t.textMuted, background:t.bgMuted, borderRadius:3, padding:"1px 5px"}}>⌘K</kbd>
          </motion.button>

<motion.button onClick={toggleTheme} whileHover={{backgroundColor:t.bgSubtle}} whileTap={{scale:0.94}} transition={{duration:0.12}}
            style={{background:"none", border:`1px solid ${t.border}`, borderRadius:7, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}} aria-label="Toggle theme">
            <AnimatePresence mode="wait">
              <motion.span key={dark?"sun":"moon"} initial={{opacity:0, rotate:-20}} animate={{opacity:1, rotate:0}} exit={{opacity:0, rotate:20}} transition={{duration:0.16}}>
                <Icon size={15} color={t.textSub} path={dark
                  ? "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                  : "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"} />
              </motion.span>
            </AnimatePresence>
          </motion.button>

<motion.button className="hide-mobile" onClick={() => navigate("/upgrade")}
            whileHover={{opacity:0.8, scale:1.02}} whileTap={{scale:0.96}} transition={{duration:0.13}}
            style={{background:t.text, color:t.bg, border:"none", borderRadius:7, padding:"7px 16px", fontSize:12, fontWeight:600, cursor:"pointer", letterSpacing:"-0.1px", fontFamily:"'DM Sans',sans-serif"}}>
            Upgrade
          </motion.button>

<motion.button className="show-mobile" onClick={() => setMobileMenuOpen(true)} whileTap={{scale:0.93}}
            style={{background:"none", border:`1px solid ${t.border}`, borderRadius:7, width:34, height:34, alignItems:"center", justifyContent:"center", cursor:"pointer", display:"flex"}}>
            <Icon path="M4 6h16M4 12h16M4 18h16" size={16} color={t.text} />
          </motion.button>
        </div>
      </motion.nav>

<AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}
              onClick={() => setMobileMenuOpen(false)}
              style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)"}} />
            <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{duration:0.26, ease:EASE_OUT_EXPO}}
              style={{position:"fixed", top:0, right:0, height:"100dvh", width:260, background:t.bgCard, borderLeft:`1px solid ${t.border}`, zIndex:201, display:"flex", flexDirection:"column", boxSizing:"border-box"}}>

              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"24px 20px 20px", flexShrink:0}}>
                <span className="ft-sans" style={{fontSize:13, fontWeight:600, color:t.text}}>ForeTrace</span>
                <motion.button onClick={() => setMobileMenuOpen(false)} whileTap={{scale:0.93}}
                  style={{background:"none", border:`1px solid ${t.border}`, borderRadius:6, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
                  <Icon path="M6 18L18 6M6 6l12 12" size={14} color={t.textSub} />
                </motion.button>
              </div>

              <div style={{flex:1, overflowY:"auto", padding:"0 20px", display:"flex", flexDirection:"column", gap:4}}>
                {NAV_ITEMS.map(item => (
                  <motion.button key={item.label} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                    whileHover={{background:t.bgSubtle}} whileTap={{scale:0.98}}
                    style={{background:"none", border:"none", padding:"11px 14px", borderRadius:8, textAlign:"left", cursor:"pointer", fontSize:15, fontWeight:500, color:t.text, fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                    {item.label}
                    {item.pro && <span style={{fontSize:9, fontWeight:700, background:t.text, color:t.bg, padding:"1px 6px", borderRadius:3}}>PRO</span>}
                  </motion.button>
                ))}
              </div>

              <div style={{flexShrink:0, padding:"20px"}}>
                <button onClick={() => { navigate("/upgrade"); setMobileMenuOpen(false); }}
                  style={{width:"100%", background:t.text, color:t.bg, border:"none", borderRadius:8, padding:"11px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif"}}>
                  Upgrade to Pro
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
