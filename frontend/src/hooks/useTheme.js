import React, { createContext, useContext, useState, useCallback } from 'react';
import { LIGHT, DARK } from '../styles/tokens';

const ThemeContext = createContext({ dark: false, toggleTheme: () => {}, t: LIGHT });

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    try {
      // Hack: localStorage sometimes throws in private browsing. wrap in try-catch to keep it safe.
      const s = localStorage.getItem('ft-theme');
      if (s) return s === 'dark';
    } catch {
      // Ignore private browsing storage errors
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  });

  const toggleTheme = useCallback(() => {
    setDark(d => {
      const next = !d;
      try {
        localStorage.setItem('ft-theme', next ? 'dark' : 'light');
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }, []);

  // We only support one theme source. Multiple theme states = future headache.
  const t = dark ? DARK : LIGHT;

  return React.createElement(
    ThemeContext.Provider,
    { value: { dark, toggleTheme, t } },
    children
  );

};

export const useTheme = () => useContext(ThemeContext);
