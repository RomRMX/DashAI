import { useState, useEffect, useRef } from 'react';
import ReleasesPage from '../../pages/ReleasesPage';
import SkillsPage from '../../pages/SkillsPage';
import YouTubePage from '../../pages/YouTubePage';
import ProjectsPage from '../../pages/ProjectsPage';
import FlowCanvas from '../flowchart/FlowCanvas';
import CommandPalette from '../ui/CommandPalette';

const COLUMNS: Array<{ label: string; Component: React.ComponentType; flex: number }> = [
  { label: 'Releases', Component: ReleasesPage, flex: 1 },
  { label: 'YouTube',  Component: YouTubePage,  flex: 1 },
  { label: 'Tools',    Component: SkillsPage,   flex: 1 },
  { label: 'Projects', Component: ProjectsPage, flex: 1.5 },
];

const FLOW_H = 325;
const LAST_VISIT_KEY = 'aitoolbox:lastVisit';

/* ---- helpers ---- */

function computeVisitMeta(): { lastVisit: string | null; newCount: number } {
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  let newCount = 0;
  if (lastVisit) {
    try {
      const releases: any[] = JSON.parse(localStorage.getItem('aitoolbox:releases') || '[]');
      newCount = releases.filter(r => r.createdAt > lastVisit).length;
    } catch { /* ignore */ }
  }
  return { lastVisit, newCount };
}

/* ---- export ---- */

function exportData() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('aitoolbox:')) {
      try { data[key] = JSON.parse(localStorage.getItem(key)!); } catch { /* skip */ }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rmxai-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---- AppShell ---- */

export default function AppShell() {
  const [flowExpanded, setFlowExpanded] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [flowHeight, setFlowHeight] = useState(FLOW_H);
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startY: e.clientY, startH: flowHeight };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = resizeRef.current.startY - ev.clientY;
      setFlowHeight(Math.max(120, Math.min(800, resizeRef.current.startH + delta)));
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Compute "new since last visit" once at mount (before updating lastVisit)
  const [{ newCount }] = useState(computeVisitMeta);

  // Stamp visit on mount
  useEffect(() => {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
        return;
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setFlowExpanded(false);
        return;
      }
      // '/' opens palette when not in a text field
      if (e.key === '/' && !inInput && !paletteOpen) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paletteOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ height: 80, padding: '0 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <span style={{ lineHeight: 1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <img src="/rmxlabs_logo2x%202.png" alt="" style={{ height: 28, width: 'auto', display: 'block' }} />
            <span style={{ fontFamily: 'var(--font-category)', fontSize: 22, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--signal-orange)' }}>RMXLABS</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg)' }}>AI.Dashboard</span>
          </span>
          {newCount > 0 && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--signal-amber)', letterSpacing: '0.04em', flexShrink: 0 }}>
              ● {newCount} new
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 10, padding: '5px 12px', letterSpacing: '0.12em', background: 'var(--ink-800)', borderColor: 'var(--border-strong)' }}
            onClick={exportData}
          >
            Export
          </button>
        </div>
      </header>

      {/* Main area: columns on top, flow strip on bottom */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {/* Columns */}
        <div className="columns-grid" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {COLUMNS.map(({ label, Component, flex }, i) => {
            const isLast = i === COLUMNS.length - 1;
            return (
              <div
                key={label}
                style={{
                  flexGrow: flex,
                  flexShrink: 1,
                  flexBasis: 0,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRight: !isLast ? '3px solid var(--border-strong)' : undefined,
                }}
              >
                <Component />
              </div>
            );
          })}
        </div>

        {/* Flow — bottom horizontal strip */}
        {!flowExpanded && (
          <div style={{ height: flowHeight, borderTop: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
            <div
              onMouseDown={onResizeMouseDown}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, cursor: 'ns-resize', zIndex: 10 }}
            />
            <FlowCanvas onToggleExpand={() => setFlowExpanded(true)} />
          </div>
        )}
      </div>

      {/* Flow — full-screen overlay */}
      {flowExpanded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', background: 'var(--ink-900, #0d0d0d)' }}>
          <FlowCanvas expanded onToggleExpand={() => setFlowExpanded(false)} />
        </div>
      )}

      {/* Command palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
