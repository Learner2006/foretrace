export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

export const MV = {

  nav: {
    hidden:  { opacity:0, y:-8 },
    visible: { opacity:1, y:0, transition:{ duration:0.3, ease:EASE_OUT_EXPO } },
  },

heroC: {
    hidden:  {},
    visible: { transition:{ staggerChildren:0.09, delayChildren:0.04 } },
  },

heroCh: {
    hidden:  { opacity:0, y:12 },
    visible: { opacity:1, y:0, transition:{ duration:0.45, ease:EASE_OUT_EXPO } },
  },

fadeUp: {
    hidden:  { opacity:0, y:10 },
    visible: { opacity:1, y:0, transition:{ duration:0.4, ease:EASE_OUT_EXPO } },
  },

fadeIn: {
    hidden:  { opacity:0 },
    visible: { opacity:1, transition:{ duration:0.35 } },
  },

slideL: {
    hidden:  { opacity:0, x:-10 },
    visible: { opacity:1, x:0, transition:{ duration:0.38, ease:EASE_OUT_EXPO } },
  },

stagger: {
    hidden:  {},
    visible: { transition:{ staggerChildren:0.06, delayChildren:0.04 } },
  },

pill: {
    hidden:  { opacity:0, scale:0.94 },
    visible: { opacity:1, scale:1, transition:{ duration:0.22, ease:EASE_OUT_EXPO } },
  },

REDUCED: {
    hidden:  { opacity:0 },
    visible: { opacity:1, transition:{ duration:0.01 } },
  },
};

export function v(variant, reduced=false) {
  return reduced ? MV.REDUCED : variant;
}

export const HOVER = {

  lift: {
    whileHover: { y:-1, transition:{ duration:0.18 } },
  },

  tap: {
    whileTap: { scale:0.97 },
  },

  liftTap: {
    whileHover: { y:-1, transition:{ duration:0.18 } },
    whileTap:   { scale:0.97 },
  },

  fade: {
    whileHover: { opacity:0.8, transition:{ duration:0.15 } },
  },
};

export const SHIMMER = {
  animate: { x:["-100%","100%"] },
  transition: { duration:1.2, repeat:Infinity, ease:"linear" },
};

export const FILL_IN = (delay=0.1) => ({
  initial: { scaleX:0 },
  transition: { duration:0.8, ease:EASE_OUT_EXPO, delay },
});

export const HORIZON_BAR = {
  initial: { scaleX:0 },
  whileInView: { scaleX:0.72 },
  viewport: { once:true },
  transition: { duration:1.1, ease:EASE_OUT_EXPO, delay:0.3 },
};

export const ticker = (totalWidth) => ({
  animate: { x:[0, -totalWidth] },
  transition: { duration:38, repeat:Infinity, ease:"linear", repeatType:"loop" },
});

export const ring = (circ, value, delay=0.2) => ({
  initial: { strokeDasharray:`0 ${circ}`, strokeDashoffset:circ*0.25 },
  animate: { strokeDasharray:`${(circ*value)/100} ${circ-(circ*value)/100}`, strokeDashoffset:circ*0.25 },
  transition: { duration:1.1, ease:EASE_OUT_EXPO, delay },
});

export const outerRing = (circOuter, corpusPercentile, delay=0.4) => ({
  initial: { strokeDasharray:`0 ${circOuter}`, strokeDashoffset:circOuter*0.25 },
  animate: { strokeDasharray:`${(circOuter*corpusPercentile)/100} ${circOuter-(circOuter*corpusPercentile)/100}`, strokeDashoffset:circOuter*0.25 },
  transition: { duration:1.3, ease:EASE_OUT_EXPO, delay },
});
