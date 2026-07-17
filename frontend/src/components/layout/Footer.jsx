import { Link } from "react-router-dom";

export default function Footer({ t }) {
  const linkStyle = {
    fontSize: 10,
    color: t.textSub,
    marginLeft: 8,
    textDecoration: 'none',
  };
  return (
    <footer
      style={{
        background: t.bgCard,
        borderTop: `1px solid ${t.border}`,
        padding: '16px 20px',
        textAlign: 'center',
        color: t.text,
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
        © 2026 ForeTrace. All Rights Reserved.
      </div>
      <div style={{ marginBottom: 8, fontSize: 11, color: t.textMuted }}>
        Structural Intelligence for Modern Investing.
      </div>
      <div>
        {/* Portfolio links */}
        <a href="https://github.com/Learner2006/foretrace" target="_blank" rel="noopener noreferrer" style={linkStyle}>GitHub</a>
        <a href="https://www.linkedin.com/in/anushkaamittal/" target="_blank" rel="noopener noreferrer" style={linkStyle}>LinkedIn</a>
        <Link to="/privacy" style={linkStyle}>Privacy Policy</Link>
        <a href="mailto:anushkaa.mittal04@gmail.com" style={linkStyle}>Contact</a>
   
      </div>
    </footer>
  );
}
