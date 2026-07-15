import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT_EXPO } from "../../styles/animations";
import { Icon } from "./UI";
import companies from "../../companies.json";

const SEARCH_ICON = "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z";

// If this function gets any bigger, it deserves its own file.
class TrieNode {
  constructor() {
    this.children = {};
    this.companies = [];
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(company) {
    // Keeping this simple intentionally. Premature optimization is expensive.
    const keys = [
      company.name.toLowerCase(),
      company.ticker.toLowerCase(),
    ];
    for (const key of keys) {
      let node = this.root;
      for (const ch of key) {
        if (!node.children[ch]) node.children[ch] = new TrieNode();
        node = node.children[ch];
        if (!node.companies.find(c => c.ticker === company.ticker)) {
          node.companies.push(company);
        }
      }
    }
  }

  search(prefix) {
    if (!prefix) return [];
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }

    const seen = new Set();
    const results = [];
    for (const c of node.companies) {
      if (!seen.has(c.ticker)) {
        seen.add(c.ticker);
        results.push(c);
      }
    }
    return results.slice(0, 8);
  }
}

const trie = new Trie();
companies.forEach(c => trie.insert(c));

function HighlightMatch({ text, query, baseStyle, matchStyle }) {
  if (!query) return <span style={baseStyle}>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span style={baseStyle}>{text}</span>;
  return (
    <span style={baseStyle}>
      {text.slice(0, idx)}
      <span style={matchStyle}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function SearchBar({ t, onSearch, onQueryChange, loading }) {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const [focused,     setFocused]     = useState(false);
  const [selected,    setSelected]    = useState(null);

  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const listRef      = useRef(null);

useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDrop(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIdx];
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleInput = useCallback((val) => {
    setQuery(val);
    setSelected(null);
    onQueryChange?.(val);

    if (val.length < 1) {
      setSuggestions([]);
      setShowDrop(false);
      setActiveIdx(-1);
      return;
    }

    const results = trie.search(val);
    setSuggestions(results);
    setShowDrop(true);
    setActiveIdx(-1);
  }, [onQueryChange]);

  const handleSelect = useCallback((company) => {
    setQuery(`${company.ticker} — ${company.name}`);
    setSelected(company);
    setSuggestions([]);
    setShowDrop(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    if (loading) return;

    if (activeIdx >= 0 && suggestions[activeIdx]) {
      const c = suggestions[activeIdx];
      handleSelect(c);
      onSearch?.(c.ticker, c.name);
      return;
    }
    if (selected) {
      onSearch?.(selected.ticker, selected.name);
    } else if (query.trim()) {
      onSearch?.(query.trim(), query.trim());
    }
  }, [loading, activeIdx, suggestions, selected, query, onSearch, handleSelect]);

  const handleKeyDown = (e) => {
    if (!showDrop || suggestions.length === 0) {
      if (e.key === "Enter") handleSubmit();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setShowDrop(false);
      setActiveIdx(-1);
    }
  };


  return (
    <>
      <style>{`
        .ft-search-input::placeholder {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.01em;
          opacity: 0.55;
        }
        .ft-search-input:focus { outline: none; }
        .ft-drop-item:hover { background: var(--ft-drop-hover); }
      `}</style>

      <div ref={containerRef} style={{ position: "relative", width: "100%" }}>

<motion.div
          animate={{ borderColor: focused ? t.borderHover : t.border }}
          transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: showDrop && suggestions.length > 0 ? "10px 10px 0 0" : 10,
            overflow: "hidden",
            transition: "border-radius 0.15s",
          }}
        >

          <div style={{ display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 4, flexShrink: 0, opacity: 0.4 }}>
            <Icon path={SEARCH_ICON} size={16} color={t.text} strokeWidth={1.6} />
          </div>

<input
            ref={inputRef}
            className="ft-sans ft-search-input"
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setFocused(true);
              if (suggestions.length > 0) setShowDrop(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder="Search company or ticker — e.g. Apple, AAPL, Reliance"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              padding: "11px 10px 11px 6px",
              background: "transparent",
              border: "none",
              color: t.text,
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.02em",
              opacity: loading ? 0.5 : 1,
            }}
          />

<AnimatePresence>
            {query.length > 0 && !loading && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setShowDrop(false);
                  setSelected(null);
                  setActiveIdx(-1);
                  onQueryChange?.("");
                  inputRef.current?.focus();
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 8px", display: "flex", alignItems: "center",
                  opacity: 0.35, flexShrink: 0,
                }}
                aria-label="Clear search"
              >
                <Icon path="M6 18L18 6M6 6l12 12" size={14} color={t.text} strokeWidth={2} />
              </motion.button>
            )}
          </AnimatePresence>

<div style={{ width: 1, height: 20, background: t.border, flexShrink: 0 }} />

<motion.button
            onClick={handleSubmit}
            disabled={loading || (!selected && !query.trim())}
            whileHover={!loading && (selected || query.trim()) ? { background: t.bgSubtle } : {}}
            whileTap={!loading && (selected || query.trim()) ? { scale: 0.97 } : {}}
            transition={{ duration: 0.12 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px",
              background: "transparent", border: "none",
              color: (!query.trim() && !selected) || loading ? t.textMuted : t.text,
              fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.04em",
              cursor: (!query.trim() && !selected) || loading ? "default" : "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            Analyze
            {loading ? <LoadingDots color={t.textMuted} /> : <span style={{ opacity: query.trim() ? 1 : 0.4 }}>→</span>}
          </motion.button>
        </motion.div>

<AnimatePresence>
          {showDrop && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: EASE_OUT_EXPO }}
              style={{
                position: "absolute",
                top: "100%",
                left: 0, right: 0,
                background: t.bgCard,
                border: `1px solid ${t.borderHover}`,
                borderTop: `1px solid ${t.border}`,
                borderRadius: "0 0 10px 10px",
                overflow: "hidden",
                zIndex: 200,
                boxShadow: `0 16px 40px rgba(0,0,0,0.18)`,
              }}
            >
              {suggestions.length > 0 ? (
                <ul
                  ref={listRef}
                  style={{ margin: 0, padding: "4px 0", listStyle: "none", maxHeight: 300, overflowY: "auto" }}
                  role="listbox"
                >
                  {suggestions.map((company, i) => {
                    const isActive = i === activeIdx;
                    return (
                      <motion.li
                        key={company.ticker}
                        role="option"
                        aria-selected={isActive}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.18, ease: EASE_OUT_EXPO }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(company);
                          onSearch?.(company.ticker, company.name);
                        }}
                        onMouseEnter={() => setActiveIdx(i)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          cursor: "pointer",
                          background: isActive ? t.bgSubtle : "transparent",
                          borderLeft: isActive ? `2px solid ${t.text}` : "2px solid transparent",
                          transition: "background 0.08s, border-color 0.08s",
                        }}
                      >

                        <span
                          className="ft-sans"
                          style={{
                            background: isActive ? t.bgMuted : t.bgSubtle,
                            border: `1px solid ${t.border}`,
                            color: isActive ? t.text : t.textSub,
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: 10,
                            fontWeight: 700,
                            minWidth: 52,
                            textAlign: "center",
                            letterSpacing: "0.06em",
                            flexShrink: 0,
                            transition: "background 0.08s, color 0.08s",
                          }}
                        >
                          <HighlightMatch
                            text={company.ticker}
                            query={query}
                            baseStyle={{ fontFamily: "'DM Sans',sans-serif" }}
                            matchStyle={{ color: t.text, fontWeight: 800 }}
                          />
                        </span>

<span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          <HighlightMatch
                            text={company.name}
                            query={query}
                            baseStyle={{ fontSize: 13, color: t.textSub, fontFamily: "'DM Sans',sans-serif" }}
                            matchStyle={{ color: t.text, fontWeight: 600 }}
                          />
                        </span>

<span
                          className="ft-sans"
                          style={{ fontSize: 9, color: t.textMuted, flexShrink: 0, letterSpacing: "0.05em", opacity: 0.6 }}
                        >
                          {Math.min(query.length, Math.max(company.ticker.length, company.name.length))}ch
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              ) : query.length > 1 ? (
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ft-sans" style={{ fontSize: 12, color: t.textMuted, fontStyle: "italic" }}>
                    No match — try ticker directly, e.g. AAPL or RELIANCE.NS
                  </span>
                </div>
              ) : null}

{suggestions.length > 0 && (
                <div style={{
                  padding: "7px 14px",
                  borderTop: `1px solid ${t.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>
                    {suggestions.length} result{suggestions.length !== 1 ? "s" : ""} · prefix <span style={{ fontFamily: "'DM Mono',monospace", color: t.textSub }}>"{query.toLowerCase()}"</span>
                  </span>
                  <span className="ft-sans" style={{ fontSize: 10, color: t.textMuted }}>
                    ↑↓ navigate · ↵ select
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}

function LoadingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 2.5, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
          style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: color }}
        />
      ))}
    </span>
  );
}
