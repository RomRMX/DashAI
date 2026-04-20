import { useState, useEffect, useRef, useMemo } from 'react';

type ResultItem = {
  section: string;
  label: string;
  sub?: string;
  link?: string;
};

function tryParse<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function searchAll(query: string): ResultItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: ResultItem[] = [];

  // Releases
  tryParse<any>('aitoolbox:releases').forEach(r => {
    if ([r.name, r.description, r.company].some((s: string) => s?.toLowerCase().includes(q))) {
      results.push({ section: 'Releases', label: r.name, sub: r.company, link: r.link });
    }
  });

  // Skills
  tryParse<any>('aitoolbox:skills').forEach(s => {
    if ([s.toolName, s.description, s.useCase].some((x: string) => x?.toLowerCase().includes(q))) {
      results.push({ section: 'Skills', label: s.toolName, sub: s.category, link: s.link });
    }
  });

  // Slash Commands (connectors)
  tryParse<any>('aitoolbox:connectors').forEach(c => {
    if ([c.name, c.description].some((x: string) => x?.toLowerCase().includes(q))) {
      results.push({ section: 'Commands', label: c.name, sub: c.integrationType, link: c.link });
    }
  });

  // Dictionary
  tryParse<any>('aitoolbox:dictionary').forEach(t => {
    if ([t.term, t.plainDefinition].some((x: string) => x?.toLowerCase().includes(q))) {
      results.push({ section: 'Dictionary', label: t.term, sub: (t.plainDefinition || '').slice(0, 72) });
    }
  });

  // YouTube Videos
  tryParse<any>('aitoolbox:videos').forEach(v => {
    if ([v.title, v.channelName, v.notes].some((x: string) => x?.toLowerCase().includes(q))) {
      results.push({ section: 'YouTube', label: v.title, sub: v.channelName, link: v.videoUrl });
    }
  });

  // Tips
  tryParse<any>('aitoolbox:tips').forEach(t => {
    if (t.text?.toLowerCase().includes(q)) {
      results.push({ section: 'Tips', label: t.text });
    }
  });

  return results.slice(0, 24);
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255,90,31,0.3)', color: 'var(--signal-orange)', padding: 0 }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchAll(query), [query]);

  // Group by section (preserving order)
  const sections = useMemo(() => {
    const map: Record<string, ResultItem[]> = {};
    results.forEach(r => { (map[r.section] ??= []).push(r); });
    return map;
  }, [results]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActive(0); }, [query]);

  const openActive = () => {
    const item = results[active];
    if (item?.link) { window.open(item.link, '_blank', 'noreferrer'); onClose(); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter') openActive();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, paddingTop: '10vh' }}
      onClick={onClose}
    >
      <div
        style={{ width: 560, maxWidth: 'calc(100vw - 32px)', background: 'var(--ink-800)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lift)', display: 'flex', flexDirection: 'column', maxHeight: '72vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--fg-dim)', lineHeight: 1, flexShrink: 0 }}>⌘</span>
          <input
            ref={inputRef}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--fg)' }}
            placeholder="Search releases, skills, dictionary..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', background: 'var(--ink-700)', border: '1px solid var(--border)', padding: '2px 6px', letterSpacing: '0.1em', flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Results area */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {!query.trim() ? (
            <div style={{ padding: '24px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.08em', textAlign: 'center' }}>
              Type to search across all sections
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '24px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.08em', textAlign: 'center' }}>
              No results for "{query}"
            </div>
          ) : (
            Object.entries(sections).map(([section, items]) => (
              <div key={section}>
                <div style={{ padding: '10px 16px 4px', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>
                  {section}
                </div>
                {items.map((item) => {
                  const globalIdx = results.indexOf(item);
                  const isActive = active === globalIdx;
                  return (
                    <div
                      key={globalIdx}
                      onMouseEnter={() => setActive(globalIdx)}
                      onClick={() => { if (item.link) { window.open(item.link, '_blank', 'noreferrer'); } onClose(); }}
                      style={{
                        padding: '8px 16px',
                        cursor: item.link ? 'pointer' : 'default',
                        background: isActive ? 'var(--ink-700)' : 'transparent',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 10,
                        borderLeft: isActive ? '2px solid var(--signal-orange)' : '2px solid transparent',
                        transition: 'background 100ms',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg)', flexShrink: 0, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(item.label, query)}
                      </span>
                      {item.sub && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {item.sub}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 16px', display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.1em', flexShrink: 0 }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
          {results.length > 0 && <span style={{ marginLeft: 'auto' }}>{results.length} results</span>}
        </div>
      </div>
    </div>
  );
}
