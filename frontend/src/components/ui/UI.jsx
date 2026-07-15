import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

export function PremiumCard({ children, t, style = {}, borderRadius = 16, noLift = false, glow = false, pulse = false }) {
  const [hovered, setHovered] = useState(false);
  const [spotPos, setSpotPos] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  // 3D Tilt Card effect. A bit heavy on the CPU, but it gives that premium glassmorphic vibe that Product loves.
  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setSpotPos({ x: px * 100, y: py * 100 });
    setTilt({ x: (py - 0.5) * -4, y: (px - 0.5) * 4 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      animate={{
        borderColor: hovered ? t.borderHover : t.border,
        y: noLift ? 0 : hovered ? -2 : 0,
        rotateX: tilt.x,
        rotateY: tilt.y,
        boxShadow: hovered && glow
          ? `0 0 0 1px ${t.borderHover}, 0 8px 32px ${t.text}10, 0 2px 8px ${t.text}08`
          : `0 0 0 0px transparent`,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        borderRadius,
        border: `1px solid ${t.border}`,
        overflow: "hidden",
        position: "relative",
        isolation: "isolate",
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...style,
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
              background: `radial-gradient(280px circle at ${spotPos.x}% ${spotPos.y}%, ${t.spotlight}, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {pulse && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.01, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: -1, borderRadius, pointerEvents: "none", zIndex: 0,
            border: `1px solid ${t.text}18`,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

export function Sparkline({ data = [], width = 52, height = 18, color, baseline = false, animated = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [drawn, setDrawn] = useState(!animated);

  useEffect(() => {
    if (animated && inView) {
      const t = setTimeout(() => setDrawn(true), 80);
      return () => clearTimeout(t);
    }
  }, [animated, inView]);

  if (!data || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - mn) / range) * (height - 2) - 1,
  }));

  const pts = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${points.map((p) => `${p.x},${p.y}`).join(" L")} L${width},${height} L0,${height} Z`;
  const lastP = points[points.length - 1];

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sg-${color?.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {baseline && (
        <line x1="0" y1={height - 1} x2={width} y2={height - 1}
          stroke={color} strokeWidth="0.5" strokeOpacity="0.2" />
      )}

      <path d={areaPath} fill={`url(#sg-${color?.replace("#", "")})`} />

      <motion.polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={drawn ? { pathLength: 1, opacity: 0.9 } : {}}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      />

      <circle cx={lastP.x} cy={lastP.y} r="1.8" fill={color} />
      {drawn && (
        <motion.circle
          cx={lastP.x} cy={lastP.y} r="3.5" fill="none" stroke={color}
          strokeWidth="1"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}

export function SignalBadge({ signal, dir, t }) {
  const isNeutral = dir === "neutral";
  const isUp = dir === "up";
  const color = isNeutral ? t.neutral : isUp ? t.positive ?? t.text : t.warning;
  const bg = isNeutral ? t.bgSubtle : isUp ? (t.positiveBg ?? `${t.text}12`) : t.warningBg;

  return (
    <motion.span
      className="ft-sans"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        fontSize: 10, fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${color}22`,
        padding: "2px 8px", borderRadius: 4, letterSpacing: "0.2px",
        display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
        position: "relative", overflow: "hidden",
      }}
    >
      <motion.span
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
          pointerEvents: "none",
        }}
      />
      <span style={{ fontSize: 9, lineHeight: 1 }}>
        {isUp ? "↑" : dir === "down" ? "↓" : "→"}
      </span>
      {signal}
    </motion.span>
  );
}

export function Icon({ path, size = 18, color = "currentColor", strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function Skeleton({ w = "100%", h = 16, radius = 6, t }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: t.shimmerBase ?? `${t.bgMuted}`,
      overflow: "hidden", position: "relative",
    }}>
      <motion.div
        animate={{ x: ["-100%", "150%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
        style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${t.shimmerHigh ?? `${t.text}10`} 40%, ${t.shimmerHigh ?? `${t.text}18`} 50%, transparent 100%)`,
        }}
      />
    </div>
  );
}

export function ConfidenceBar({ value, t, width = 56, label = true, showTicks = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const barColor = value >= 70
    ? (t.positive ?? t.text)
    : value >= 40
    ? t.warning
    : t.warning;

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <div style={{
        width, height: 4, background: t.bgMuted, borderRadius: 3,
        overflow: "hidden", position: "relative",
      }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: value / 100 } : {}}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.1 }}
          style={{
            height: "100%", borderRadius: 3, transformOrigin: "0%",
            background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
          }}
        />
        {showTicks && [25, 50, 75].map((tick) => (
          <div key={tick} style={{
            position: "absolute", top: 0, left: `${tick}%`,
            width: 1, height: "100%", background: t.bgCard, opacity: 0.5,
          }} />
        ))}
      </div>
      {label && (
        <span className="ft-sans" style={{
          fontSize: 10, color: t.textMuted, fontWeight: 500, whiteSpace: "nowrap",
        }}>
          {value}%
        </span>
      )}
    </div>
  );
}

export function ConfidenceRing({ value, corpusPercentile = null, size = 100, t }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(0);

  const r = 38, rOuter = 46;
  const circ = 2 * Math.PI * r;
  const circOuter = 2 * Math.PI * rOuter;
  const fill = (circ * value) / 100;
  const fillOuter = corpusPercentile ? (circOuter * corpusPercentile) / 100 : 0;

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const duration = 1000;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size }}
      role="img" aria-label={`${value}% structural confidence`}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">

        {corpusPercentile && (
          <>
            <circle cx="50" cy="50" r={rOuter} fill="none" stroke={t.bgMuted} strokeWidth="2" />
            <motion.circle cx="50" cy="50" r={rOuter} fill="none" stroke={t.textMuted}
              strokeWidth="2" strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circOuter}`, strokeDashoffset: circOuter * 0.25 }}
              animate={inView ? { strokeDasharray: `${fillOuter} ${circOuter - fillOuter}`, strokeDashoffset: circOuter * 0.25 } : {}}
              transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.5 }}
            />
          </>
        )}
        <circle cx="50" cy="50" r={r} fill="none" stroke={t.bgMuted} strokeWidth="5" />
        <defs>
          <linearGradient id="cr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={t.text} stopOpacity="0.5" />
            <stop offset="100%" stopColor={t.text} stopOpacity="1" />
          </linearGradient>
        </defs>
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="url(#cr-grad)"
          strokeWidth="5" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}`, strokeDashoffset: circ * 0.25 }}
          animate={inView ? { strokeDasharray: `${fill} ${circ - fill}`, strokeDashoffset: circ * 0.25 } : {}}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: 0.2 }}
        />
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg - 90) * (Math.PI / 180);
          return (
            <line key={deg}
              x1={50 + (r - 3) * Math.cos(rad)} y1={50 + (r - 3) * Math.sin(rad)}
              x2={50 + (r + 3) * Math.cos(rad)} y2={50 + (r + 3) * Math.sin(rad)}
              stroke={t.border} strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", pointerEvents: "none",
      }}>
        <span className="ft-serif" style={{ fontSize: 19, color: t.text, lineHeight: 1, fontWeight: 400 }}>
          {displayed}%
        </span>
        <span className="ft-sans" style={{
          fontSize: 8, color: t.textMuted, marginTop: 3,
          letterSpacing: "0.5px", textTransform: "uppercase",
        }}>
          structural
        </span>
      </div>
    </div>
  );
}

export function SignalStrength({ level = 1, t }) {
  const colors = { 1: t.warning, 2: t.neutral ?? t.textMuted, 3: t.positive ?? t.text };
  const activeColor = colors[level] ?? t.text;

  return (
    <div style={{ display: "flex", gap: 2.5, alignItems: "flex-end", flexShrink: 0 }}
      aria-label={`Signal strength ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: i <= level ? 1 : 0.2 }}
          transition={{ duration: 0.3, delay: i * 0.07, ease: EASE_OUT_EXPO }}
          style={{
            width: 3,
            height: 4 + i * 3,
            borderRadius: 1.5,
            background: i <= level ? activeColor : t.bgMuted,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

export function DensityBar({ data = [], color, active = false }) {
  return (
    <svg width={20} height={14} viewBox="0 0 20 14"
      style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      {data.map((filled, i) => (
        <motion.rect
          key={i}
          x={i * 2.5} y={filled ? 0 : 8}
          width={1.8} height={filled ? 14 : 6}
          rx={0.8}
          fill={color}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{
            opacity: filled ? (active ? 0.9 : 0.65) : 0.18,
            scaleY: 1,
          }}
          transition={{
            duration: 0.35,
            delay: i * 0.04,
            ease: EASE_OUT_EXPO,
          }}
          style={{ transformOrigin: "bottom" }}
        />
      ))}
    </svg>
  );
}
