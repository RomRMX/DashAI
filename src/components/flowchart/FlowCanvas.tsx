import { useState, useRef, useCallback, useEffect } from 'react';
import { uid, now } from '../../lib/utils';

const NODE_W = 128;
const NODE_H = 44;
const KEY = 'aitoolbox:flowchart';
const SAVED_KEY = 'aitoolbox:flowchart:saved';
const MAX_SAVES = 10;
const MAX_HISTORY = 50;

type FlowNode = { id: string; x: number; y: number; label: string };
type FlowEdge = { id: string; from: string; to: string };
type FlowText = { id: string; x: number; y: number; text: string };
type ChartState = { nodes: FlowNode[]; edges: FlowEdge[]; texts: FlowText[] };
type Tool = 'select' | 'node' | 'connect' | 'text';
type SavedCanvas = { id: string; name: string; nodes: FlowNode[]; edges: FlowEdge[]; texts: FlowText[]; savedAt: string };
type ActiveDialog =
  | { kind: 'prompt'; title: string; placeholder?: string; onConfirm: (v: string) => void }
  | { kind: 'confirm'; message: string; confirmLabel?: string; onConfirm: () => void }
  | null;

type DragState =
  | { kind: 'move'; ids: string[]; startMouse: { x: number; y: number }; startPositions: Map<string, { x: number; y: number }>; preDragChart: ChartState; moved: boolean }
  | { kind: 'marquee'; startX: number; startY: number }
  | { kind: 'pan'; startMouse: { x: number; y: number }; startPan: { x: number; y: number } }
  | null;

const BUILTIN_PRESETS: SavedCanvas[] = [
  {
    id: 'preset-claude-a-z',
    name: 'CLAUDE A-Z',
    savedAt: '2026-04-20',
    nodes: [
      { id: 'p1-1', x: 40, y: 60, label: 'Idea / Spec' },
      { id: 'p1-2', x: 240, y: 60, label: 'Scaffold' },
      { id: 'p1-3', x: 440, y: 60, label: 'Plan' },
      { id: 'p1-4', x: 640, y: 60, label: 'Prompt Claude' },
      { id: 'p1-5', x: 840, y: 60, label: 'Generate' },
      { id: 'p1-6', x: 1040, y: 60, label: 'Review' },
      { id: 'p1-7', x: 1240, y: 60, label: 'Run Locally' },
      { id: 'p1-8', x: 1440, y: 60, label: 'Iterate' },
      { id: 'p1-9', x: 1640, y: 60, label: 'Commit' },
      { id: 'p1-10', x: 1840, y: 60, label: 'Deploy' },
    ],
    edges: [
      { id: 'p1-e1', from: 'p1-1', to: 'p1-2' },
      { id: 'p1-e2', from: 'p1-2', to: 'p1-3' },
      { id: 'p1-e3', from: 'p1-3', to: 'p1-4' },
      { id: 'p1-e4', from: 'p1-4', to: 'p1-5' },
      { id: 'p1-e5', from: 'p1-5', to: 'p1-6' },
      { id: 'p1-e6', from: 'p1-6', to: 'p1-7' },
      { id: 'p1-e7', from: 'p1-7', to: 'p1-8' },
      { id: 'p1-e8', from: 'p1-8', to: 'p1-9' },
      { id: 'p1-e9', from: 'p1-9', to: 'p1-10' },
    ],
    texts: [],
  },
];

function load(): ChartState {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const d = JSON.parse(s);
      return { nodes: d.nodes || [], edges: d.edges || [], texts: d.texts || [] };
    }
  } catch {}
  return { nodes: [], edges: [], texts: [] };
}

function loadSaved(): SavedCanvas[] {
  try { const s = localStorage.getItem(SAVED_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function persistSaved(items: SavedCanvas[]) { localStorage.setItem(SAVED_KEY, JSON.stringify(items)); }

function rectsOverlap(
  sx1: number, sy1: number, sx2: number, sy2: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  const left = Math.min(sx1, sx2), right = Math.max(sx1, sx2);
  const top = Math.min(sy1, sy2), bottom = Math.max(sy1, sy2);
  return rx < right && rx + rw > left && ry < bottom && ry + rh > top;
}

interface Props {
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export default function FlowCanvas({ expanded, onToggleExpand }: Props) {
  const [chart, setChartState] = useState<ChartState>(load);
  const { nodes, edges, texts } = chart;
  const chartRef = useRef<ChartState>(chart);
  chartRef.current = chart;

  const [tool, setTool] = useState<Tool>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedCanvas[]>(loadSaved);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dialog, setDialog] = useState<ActiveDialog>(null);

  const historyRef = useRef<{ past: ChartState[]; future: ChartState[] }>({ past: [], future: [] });
  const dragRef = useRef<DragState>(null);
  const suppressNextClickRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  zoomRef.current = zoom;
  panRef.current = pan;

  const applyChart = useCallback((data: ChartState) => {
    setChartState(data);
    localStorage.setItem(KEY, JSON.stringify(data));
  }, []);

  const save = useCallback((data: ChartState) => {
    historyRef.current.past.push(chartRef.current);
    if (historyRef.current.past.length > MAX_HISTORY) historyRef.current.past.shift();
    historyRef.current.future = [];
    setCanUndo(true);
    setCanRedo(false);
    applyChart(data);
  }, [applyChart]);

  const undo = useCallback(() => {
    if (!historyRef.current.past.length) return;
    const prev = historyRef.current.past.pop()!;
    historyRef.current.future.push(chartRef.current);
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(true);
    setSelectedIds(new Set());
    applyChart(prev);
  }, [applyChart]);

  const redo = useCallback(() => {
    if (!historyRef.current.future.length) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(chartRef.current);
    setCanUndo(true);
    setCanRedo(historyRef.current.future.length > 0);
    setSelectedIds(new Set());
    applyChart(next);
  }, [applyChart]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return;
    const ids = selectedIds;
    save({
      nodes: nodes.filter(n => !ids.has(n.id)),
      edges: edges.filter(e => !ids.has(e.from) && !ids.has(e.to)),
      texts: texts.filter(t => !ids.has(t.id)),
    });
    setSelectedIds(new Set());
  }, [selectedIds, nodes, edges, texts, save]);

  // Keyboard: undo, redo, delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = ['INPUT', 'TEXTAREA'].includes((e.target as Element)?.tagName);
      if (inInput) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, deleteSelected]);

  // Non-passive wheel for zoom
  useEffect(() => {
    const el = svgRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasX = (mouseX - panRef.current.x) / zoomRef.current;
      const canvasY = (mouseY - panRef.current.y) / zoomRef.current;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.max(0.15, Math.min(4, zoomRef.current * factor));
      const newPan = { x: mouseX - canvasX * newZoom, y: mouseY - canvasY * newZoom };
      zoomRef.current = newZoom;
      panRef.current = newPan;
      setZoom(newZoom);
      setPan(newPan);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Chat inject
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodes: n, edges: eg, texts: tx } = (e as CustomEvent).detail;
      save({ nodes: n, edges: eg, texts: tx });
      setSelectedIds(new Set());
      setConnecting(null);
      setEditing(null);
      setEditingText(null);
    };
    window.addEventListener('aitoolbox:flowchart:inject', handler);
    return () => window.removeEventListener('aitoolbox:flowchart:inject', handler);
  }, [save]);

  const handleSaveCanvas = () => {
    setDialog({
      kind: 'prompt',
      title: 'Save Canvas',
      placeholder: 'Canvas name…',
      onConfirm: (raw) => {
        const name = raw.trim();
        if (!name) return;
        const snapshot = { nodes, edges, texts };
        const existingIdx = saved.findIndex(s => s.name === name);
        if (existingIdx >= 0) {
          setDialog({ kind: 'confirm', message: `Overwrite "${name}"?`, confirmLabel: 'Overwrite', onConfirm: () => {
            const next = saved.map((s, i) => i === existingIdx ? { ...s, ...snapshot, savedAt: now() } : s);
            setSaved(next); persistSaved(next);
          }});
          return;
        }
        if (saved.length >= MAX_SAVES) {
          setDialog({ kind: 'confirm', message: `Max ${MAX_SAVES} saves reached — delete one first.`, confirmLabel: 'OK', onConfirm: () => {} });
          return;
        }
        const next = [{ id: uid(), name, ...snapshot, savedAt: now() }, ...saved];
        setSaved(next); persistSaved(next);
      },
    });
  };

  const handleLoadSaved = (id: string) => {
    const c = saved.find(s => s.id === id);
    if (!c) return;
    save({ nodes: c.nodes, edges: c.edges, texts: c.texts });
    setSelectedIds(new Set()); setConnecting(null); setEditing(null); setEditingText(null);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const c = saved.find(s => s.id === id);
    if (!c) return;
    setDialog({ kind: 'confirm', message: `Delete "${c.name}"?`, confirmLabel: 'Delete', onConfirm: () => {
      const next = saved.filter(s => s.id !== id);
      setSaved(next); persistSaved(next);
    }});
  };

  const resetView = () => {
    setZoom(1); setPan({ x: 0, y: 0 });
    zoomRef.current = 1; panRef.current = { x: 0, y: 0 };
  };

  // Convert screen coords → canvas coords
  const pt = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - panRef.current.x) / zoomRef.current,
      y: (e.clientY - r.top - panRef.current.y) / zoomRef.current,
    };
  };

  const onSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editing || editingText) return;
    if (e.metaKey || e.ctrlKey) {
      dragRef.current = { kind: 'pan', startMouse: { x: e.clientX, y: e.clientY }, startPan: { ...panRef.current } };
      return;
    }
    if (tool !== 'select') return;
    const { x, y } = pt(e);
    dragRef.current = { kind: 'marquee', startX: x, startY: y };
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editing || editingText) return;
    if (suppressNextClickRef.current) { suppressNextClickRef.current = false; return; }
    if (tool === 'node') {
      const { x, y } = pt(e);
      const node: FlowNode = { id: uid(), x: x - NODE_W / 2, y: y - NODE_H / 2, label: '' };
      save({ nodes: [...nodes, node], edges, texts });
      setEditing(node.id);
    } else if (tool === 'text') {
      const { x, y } = pt(e);
      const t: FlowText = { id: uid(), x, y, text: '' };
      save({ nodes, edges, texts: [...texts, t] });
      setEditingText(t.id);
    } else if (tool === 'select') {
      setSelectedIds(new Set()); setConnecting(null);
    }
  };

  const onNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editing || editingText) return;
    if (tool === 'connect') {
      if (!connecting) { setConnecting(id); }
      else if (connecting !== id) {
        save({ nodes, edges: [...edges, { id: uid(), from: connecting, to: id }], texts });
        setConnecting(null);
      }
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  const startMoveDrag = (e: React.MouseEvent, id: string) => {
    if (e.metaKey || e.ctrlKey) return; // let SVG handle as pan
    if (tool !== 'select' || editing || editingText) return;
    e.stopPropagation();
    const { x, y } = pt(e);
    const idsToMove = selectedIds.has(id) && selectedIds.size > 1 ? Array.from(selectedIds) : [id];
    if (!selectedIds.has(id)) setSelectedIds(new Set([id]));
    const startPositions = new Map<string, { x: number; y: number }>();
    const cur = chartRef.current;
    for (const nid of idsToMove) {
      const n = cur.nodes.find(n => n.id === nid);
      if (n) { startPositions.set(nid, { x: n.x, y: n.y }); continue; }
      const t = cur.texts.find(t => t.id === nid);
      if (t) startPositions.set(nid, { x: t.x, y: t.y });
    }
    dragRef.current = { kind: 'move', ids: idsToMove, startMouse: { x, y }, startPositions, preDragChart: cur, moved: false };
  };

  const onNodeMouseDown = (e: React.MouseEvent, id: string) => startMoveDrag(e, id);
  const onTextMouseDown = (e: React.MouseEvent, id: string) => startMoveDrag(e, id);

  const onDoubleClickNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setSelectedIds(new Set([id])); setEditing(id);
  };

  const commitNodeEdit = (id: string, label: string) => {
    save({ nodes: nodes.map(n => n.id === id ? { ...n, label: label.trim() } : n), edges, texts });
    setEditing(null);
  };

  const onTextClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editing || editingText) return;
    setSelectedIds(new Set([id]));
  };

  const onDoubleClickText = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); setSelectedIds(new Set([id])); setEditingText(id);
  };

  const commitTextEdit = (id: string, text: string) => {
    if (!text.trim()) save({ nodes, edges, texts: texts.filter(t => t.id !== id) });
    else save({ nodes, edges, texts: texts.map(t => t.id === id ? { ...t, text: text.trim() } : t) });
    setEditingText(null);
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;

    if (d.kind === 'pan') {
      const newPan = { x: d.startPan.x + (e.clientX - d.startMouse.x), y: d.startPan.y + (e.clientY - d.startMouse.y) };
      panRef.current = newPan;
      setPan(newPan);
      return;
    }

    const { x, y } = pt(e);

    if (d.kind === 'marquee') {
      setMarquee({ x1: d.startX, y1: d.startY, x2: x, y2: y });
      return;
    }

    if (d.kind === 'move') {
      const dx = x - d.startMouse.x;
      const dy = y - d.startMouse.y;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      d.moved = true;
      const cur = chartRef.current;
      applyChart({
        nodes: cur.nodes.map(n => { const sp = d.startPositions.get(n.id); return sp ? { ...n, x: sp.x + dx, y: sp.y + dy } : n; }),
        edges: cur.edges,
        texts: cur.texts.map(t => { const sp = d.startPositions.get(t.id); return sp ? { ...t, x: sp.x + dx, y: sp.y + dy } : t; }),
      });
    }
  };

  const commitDrag = (e?: React.MouseEvent<SVGSVGElement>) => {
    const d = dragRef.current;

    if (d?.kind === 'marquee' && e) {
      const { x, y } = pt(e);
      const sel = new Set<string>();
      chartRef.current.nodes.forEach(n => { if (rectsOverlap(d.startX, d.startY, x, y, n.x, n.y, NODE_W, NODE_H)) sel.add(n.id); });
      chartRef.current.texts.forEach(t => { if (rectsOverlap(d.startX, d.startY, x, y, t.x - 4, t.y - 14, Math.max(80, t.text.length * 7 + 8), 20)) sel.add(t.id); });
      if (sel.size > 0) { setSelectedIds(sel); suppressNextClickRef.current = true; }
      setMarquee(null);
    }

    if (d?.kind === 'move' && d.moved) {
      historyRef.current.past.push(d.preDragChart);
      if (historyRef.current.past.length > MAX_HISTORY) historyRef.current.past.shift();
      historyRef.current.future = [];
      setCanUndo(true); setCanRedo(false);
    }

    dragRef.current = null;
  };

  const onMouseUp = (e: React.MouseEvent<SVGSVGElement>) => commitDrag(e);
  const onMouseLeave = () => { if (dragRef.current?.kind === 'marquee') setMarquee(null); commitDrag(); };

  const edgeCoords = (edge: FlowEdge) => {
    const f = nodes.find(n => n.id === edge.from);
    const t = nodes.find(n => n.id === edge.to);
    if (!f || !t) return null;
    return { x1: f.x + NODE_W / 2, y1: f.y + NODE_H / 2, x2: t.x + NODE_W / 2, y2: t.y + NODE_H / 2 };
  };

  const isEmpty = nodes.length === 0 && texts.length === 0;
  const isPanning = dragRef.current?.kind === 'pan';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--ink-700)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-category)', fontSize: 20, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg)', marginRight: 8 }}>Flow</span>
        {(['select', 'node', 'text', 'connect'] as Tool[]).map(t => (
          <button key={t} className={tool === t ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 9, padding: '3px 10px' }}
            onClick={() => { setTool(t); setConnecting(null); }}
            title={t === 'select' ? 'Move / Marquee select · ⌘+drag to pan' : t === 'node' ? 'Box' : t === 'text' ? 'Text' : 'Connect'}>
            {t === 'select' ? 'Move' : t === 'node' ? 'Box' : t === 'text' ? 'Text' : 'Connect'}
          </button>
        ))}
        <button className="btn btn-ghost" disabled={!canUndo} onClick={undo} style={{ fontSize: 11, padding: '2px 8px' }} title="Undo (⌘Z)">↩</button>
        <button className="btn btn-ghost" disabled={!canRedo} onClick={redo} style={{ fontSize: 11, padding: '2px 8px' }} title="Redo (⌘⇧Z)">↪</button>
        {selectedIds.size > 0 && (
          <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px', color: 'var(--signal-red)' }} onClick={deleteSelected} title="Delete (⌫)">
            Delete{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}
          </button>
        )}
        {connecting && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-orange)', letterSpacing: '0.1em' }}>click target…</span>}
        <div style={{ flex: 1, display: 'flex', gap: 4, overflowX: 'auto', marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          {BUILTIN_PRESETS.map(p => (
            <button key={p.id} className="btn btn-ghost"
              style={{ fontSize: 9, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0, color: 'var(--signal-orange)' }}
              onClick={() => { save({ nodes: p.nodes, edges: p.edges, texts: p.texts }); setSelectedIds(new Set()); setConnecting(null); }}>
              {p.name}
            </button>
          ))}
          {saved.map(s => (
            <button key={s.id} className="btn btn-ghost"
              style={{ fontSize: 9, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => handleLoadSaved(s.id)}>
              {s.name}
              <span onClick={e => handleDeleteSaved(s.id, e)} style={{ color: 'var(--fg-dim)', marginLeft: 2, cursor: 'pointer' }}>×</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.06em', minWidth: 34, textAlign: 'right' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 8px' }} onClick={resetView} title="Reset view">⊙</button>
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }} onClick={handleSaveCanvas}
            disabled={isEmpty} title={`Save canvas (${saved.length}/${MAX_SAVES})`}>
            Save {saved.length}/{MAX_SAVES}
          </button>
          {!isEmpty && (
            <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px', color: 'var(--fg-dim)' }}
              onClick={() => setDialog({ kind: 'confirm', message: 'Clear the entire canvas?', confirmLabel: 'Clear', onConfirm: () => { save({ nodes: [], edges: [], texts: [] }); setSelectedIds(new Set()); setConnecting(null); } })}>
              Clear
            </button>
          )}
          {onToggleExpand && (
            <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px' }} onClick={onToggleExpand}>
              {expanded ? '✕ Close' : 'Expand'}
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <svg
        ref={svgRef}
        style={{
          flex: 1,
          cursor: isPanning ? 'grabbing' : tool === 'node' || tool === 'text' ? 'crosshair' : tool === 'connect' ? 'cell' : 'default',
          display: 'block',
          userSelect: 'none',
        }}
        onMouseDown={onSvgMouseDown}
        onClick={onSvgClick}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <defs>
          <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            <circle cx="8" cy="8" r="1" fill="var(--ash-400, #888)" opacity="1" />
          </pattern>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="var(--signal-orange)" opacity="0.8" />
          </marker>
        </defs>

        {/* Dot background — follows zoom/pan */}
        <rect width="100%" height="100%" fill="url(#dots)" />

        {/* Transformed canvas content */}
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {edges.map(edge => {
            const c = edgeCoords(edge);
            if (!c) return null;
            return <line key={edge.id} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke="var(--signal-orange)" strokeWidth={1.5} opacity={0.7} markerEnd="url(#arr)" />;
          })}

          {nodes.map(node => (
            <g key={node.id} transform={`translate(${node.x},${node.y})`}>
              <rect
                width={NODE_W} height={NODE_H} rx={0}
                fill="var(--ink-700)"
                stroke={node.id === connecting ? '#4a90d9' : 'var(--ash-400)'}
                strokeWidth={selectedIds.has(node.id) || node.id === connecting ? 2 : 0.25}
                style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
                onClick={e => onNodeClick(e, node.id)}
                onMouseDown={e => onNodeMouseDown(e, node.id)}
                onDoubleClick={e => onDoubleClickNode(e, node.id)}
              />
              <foreignObject x={0} y={0} width={NODE_W} height={NODE_H} style={{ pointerEvents: 'none' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  {editing === node.id ? (
                    <textarea
                      autoFocus
                      defaultValue={node.label}
                      onBlur={e => commitNodeEdit(node.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } e.stopPropagation(); }}
                      onClick={e => e.stopPropagation()}
                      style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.06em', textAlign: 'center', textTransform: 'uppercase', padding: '0 6px', boxSizing: 'border-box', pointerEvents: 'all', resize: 'none', overflow: 'hidden', lineHeight: 1.15 }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', whiteSpace: 'pre-line', overflow: 'hidden', maxWidth: NODE_W - 12, userSelect: 'none', textAlign: 'center', lineHeight: 1.15 }}>
                      {node.label}
                    </span>
                  )}
                </div>
              </foreignObject>
            </g>
          ))}

          {texts.map(t => {
            const lines = t.text.split('\n');
            const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 0);
            const rectW = Math.max(80, maxLen * 7 + 8);
            const rectH = Math.max(20, lines.length * 14 + 6);
            const editH = Math.max(24, lines.length * 14 + 12);
            return (
            <g key={t.id} transform={`translate(${t.x},${t.y})`}>
              <rect
                x={-4} y={-14} width={rectW} height={rectH}
                fill="transparent"
                stroke={selectedIds.has(t.id) ? 'var(--signal-orange)' : 'transparent'}
                strokeWidth={1}
                strokeDasharray={selectedIds.has(t.id) ? '3 2' : undefined}
                style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
                onClick={e => onTextClick(e, t.id)}
                onMouseDown={e => onTextMouseDown(e, t.id)}
                onDoubleClick={e => onDoubleClickText(e, t.id)}
              />
              {editingText === t.id ? (
                <foreignObject x={-4} y={-16} width={Math.max(200, rectW + 40)} height={Math.max(editH, 80)}>
                  <textarea
                    autoFocus
                    defaultValue={t.text}
                    onBlur={e => commitTextEdit(t.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') setEditingText(null); e.stopPropagation(); }}
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'var(--ink-800)', border: '1px solid var(--signal-orange)', outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', padding: '2px 4px', width: '100%', height: '100%', boxSizing: 'border-box', resize: 'none', lineHeight: '14px' }}
                  />
                </foreignObject>
              ) : (
                <text x={0} y={0} textAnchor="start" dominantBaseline="auto" fill="var(--fg-muted)"
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.08em"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {lines.map((line, i) => (
                    <tspan key={i} x={0} dy={i === 0 ? 0 : 14}>{line || ' '}</tspan>
                  ))}
                </text>
              )}
            </g>
            );
          })}

          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)} y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)} height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(255,90,31,0.06)" stroke="var(--signal-orange)" strokeWidth={1} strokeDasharray="4 3"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </g>

        {isEmpty && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
            fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize={10} letterSpacing="0.14em"
            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}>
            Box · Text · Connect · ⌘+drag to pan · scroll to zoom
          </text>
        )}
      </svg>

      {dialog && <FlowDialog dialog={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}

function FlowDialog({ dialog, onClose }: { dialog: NonNullable<ActiveDialog>; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  if (dialog.kind === 'prompt') {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      dialog.onConfirm(inputRef.current?.value ?? '');
      onClose();
    };
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
        <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 24, width: 360, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            {dialog.title}
          </div>
          <input ref={inputRef} className="input" placeholder={dialog.placeholder ?? ''} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }} onClick={onClose}>
      <div style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 24, width: 320, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>{dialog.message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {dialog.confirmLabel !== 'OK' && <button className="btn btn-ghost" onClick={onClose}>Cancel</button>}
          <button className="btn btn-primary" onClick={() => { dialog.onConfirm(); onClose(); }}>{dialog.confirmLabel ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
