
// Reusable visual primitives. If you're about to copy-paste this styling, stop and use these instead.
export const SectionLabel = ({ t, label }) => (
  <p
    className="ft-sans"
    style={{
      fontSize: 10,
      fontWeight: 600,
      color: t.textMuted,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
      marginBottom: 6,
    }}
  >
    {label}
  </p>
);

export const ProBadge = ({ t }) => (
  <span
    className="ft-sans"
    style={{
      fontSize: 9,
      fontWeight: 700,
      background: t.text,
      color: t.bg,
      padding: '1px 7px',
      borderRadius: 3,
      letterSpacing: '0.3px',
    }}
  >
    PRO
  </span>
);

export const Dot = ({ color, size = 4, opacity = 1 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      opacity,
      display: 'inline-block',
    }}
  />
);

export const Divider = ({ t, style }) => (
  <div style={{ borderTop: `1px solid ${t.border}`, ...(style || {}) }} />
);

export default { SectionLabel, ProBadge, Dot, Divider };
