import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav, { ScrollProgressBar, CommandPalette } from '../components/layout/Shell';
import Footer from '../components/layout/Footer';
import { useTheme } from '../hooks/useTheme';

export default function MainLayout({ children }) {
  const { dark, toggleTheme, t } = useTheme();

const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();

  const vfn = useCallback(() => ({}), []);

  // Keyboard shortcut listener for Command Palette (Cmd/Ctrl + K). Standard UX pattern for command hubs.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, overflowX: "hidden", transition: "background 0.3s, color 0.3s" }}>

      {/* Shared fixed mesh grid texture. Rendering this once in layout prevents annoying flashing on routing. */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(${t.border}55 1px, transparent 1px), linear-gradient(90deg, ${t.border}55 1px, transparent 1px)`,
        backgroundSize: "48px 48px", opacity: dark ? 0.4 : 0.6,
      }} />

      <Nav t={t} dark={dark} toggleTheme={toggleTheme} onCmdOpen={() => setCmdOpen(true)} vfn={vfn} />
      <ScrollProgressBar t={t} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} t={t} navigate={navigate} toggleTheme={toggleTheme} />
      <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      <Footer t={t} />
    </div>
  );
}
