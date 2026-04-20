import { useState, useRef, useCallback } from 'react';
import { uid, now } from '../../lib/utils';

const NODE_W = 128;
const NODE_H = 44;
const KEY = 'aitoolbox:flowchart';
const SAVED_KEY = 'aitoolbox:flowchart:saved';

type FlowNode = { id: string; x: number; y: number; label: string };
type FlowEdge = { id: string; from: string; to: string };
type FlowText = { id: string; x: number; y: number; text: string };
type Tool = 'select' | 'node' | 'connect' | 'text';
type SavedCanvas = { id: string; name: string; nodes: FlowNode[]; edges: FlowEdge[]; texts: FlowText[]; savedAt: string };

function load(): { nodes: FlowNode[]; edges: FlowEdge[]; texts: FlowText[] } {
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

interface Props {
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export default function FlowCanvas({ expanded, onToggleExpand }: Props) {
  const [{ nodes, edges, texts }, setChart] = useState(load);
  const [tool, setTool] = useState<Tool>('select');
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedCanvas[]>(loadSaved);
  const dragRef = useRef<{ id: string; ox: number; oy: number; kind: 'node' | 'text' } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const save = useCallback((data: { nodes: FlowNode[]; edges: FlowEdge[]; texts: FlowText[] }) => {
    setChart(data);
    localStorage.setItem(KEY, JSON.stringify(data));
  }, []);

  const handleSaveCanvas = () => {
    const name = window.prompt('Name this canvas:', '')?.trim();
    if (!name) return;
    const snapshot = { nodes, edges, texts };
    const existingIdx = saved.findIndex(s => s.name === name);
    let next: SavedCanvas[];
    if (existingIdx >= 0) {
      if (!window.confirm(`Overwrite "${name}"?`)) return;
      next = saved.map((s, i) => i === existingIdx ? { ...s, ...snapshot, savedAt: now() } : s);
    } else {
      next = [{ id: uid(), name, ...snapshot, savedAt: now() }, ...saved];
    }
    setSaved(next);
    persistSaved(next);
  };

  const handleLoadSaved = (id: string) => {
    const c = saved.find(s => s.id === id);
    if (!c) return;
    save({ nodes: c.nodes, edges: c.edges, texts: c.texts });
    setSelected(null);
    setConnecting(null);
    setEditing(null);
    setEditingText(null);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const c = saved.find(s => s.id === id);
    if (!c) return;
    if (!window.confirm(`Delete saved canvas "${c.name}"?`)) return;
    const next = saved.filter(s => s.id !== id);
    setSaved(next);
    persistSaved(next);
  };

  const pt = (e: React.MouseEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (editing || editingText) return;
    if (tool === 'node') {
      const { x, y } = pt(e);
      const node: FlowNode = { id: uid(), x: x - NODE_W / 2, y: y - NODE_H / 2, label: 'Node' };
      save({ nodes: [...nodes, node], edges, texts });
      setEditing(node.id);
    } else if (tool === 'text') {
      const { x, y } = pt(e);
      const t: FlowText = { id: uid(), x, y, text: 'Label' };
      save({ nodes, edges, texts: [...texts, t] });
      setEditingText(t.id);
    } else {
      setSelected(null);
      if (tool !== 'connect') setConnecting(null);
    }
  };

  // Node interactions
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
      setSelected(id === selected ? null : id);
    }
  };

  const onNodeMouseDown = (e: React.MouseEvent, id: string) => {
    if (tool !== 'select' || editing || editingText) return;
    e.stopPropagation();
    const { x, y } = pt(e);
    const n = nodes.find(n => n.id === id)!;
    dragRef.current = { id, ox: x - n.x, oy: y - n.y, kind: 'node' };
  };

  const onDoubleClickNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    setEditing(id);
  };

  const commitNodeEdit = (id: string, label: string) => {
    save({ nodes: nodes.map(n => n.id === id ? { ...n, label: label.trim() || 'Node' } : n), edges, texts });
    setEditing(null);
  };

  // Text interactions
  const onTextClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editing || editingText) return;
    setSelected(id === selected ? null : id);
  };

  const onTextMouseDown = (e: React.MouseEvent, id: string) => {
    if (tool !== 'select' || editing || editingText) return;
    e.stopPropagation();
    const { x, y } = pt(e);
    const t = texts.find(t => t.id === id)!;
    dragRef.current = { id, ox: x - t.x, oy: y - t.y, kind: 'text' };
  };

  const onDoubleClickText = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelected(id);
    setEditingText(id);
  };

  const commitTextEdit = (id: string, text: string) => {
    if (!text.trim()) {
      save({ nodes, edges, texts: texts.filter(t => t.id !== id) });
    } else {
      save({ nodes, edges, texts: texts.map(t => t.id === id ? { ...t, text: text.trim() } : t) });
    }
    setEditingText(null);
  };

  // Mouse move / up
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const { x, y } = pt(e);
    if (d.kind === 'node') {
      save({ nodes: nodes.map(n => n.id === d.id ? { ...n, x: x - d.ox, y: y - d.oy } : n), edges, texts });
    } else {
      save({ nodes, edges, texts: texts.map(t => t.id === d.id ? { ...t, x: x - d.ox, y: y - d.oy } : t) });
    }
  };

  const onMouseUp = () => { dragRef.current = null; };

  // Delete selected (node or text)
  const deleteSelected = () => {
    if (!selected) return;
    const isNode = nodes.some(n => n.id === selected);
    if (isNode) {
      save({ nodes: nodes.filter(n => n.id !== selected), edges: edges.filter(e => e.from !== selected && e.to !== selected), texts });
    } else {
      save({ nodes, edges, texts: texts.filter(t => t.id !== selected) });
    }
    setSelected(null);
  };

  const edgeCoords = (edge: FlowEdge) => {
    const f = nodes.find(n => n.id === edge.from);
    const t = nodes.find(n => n.id === edge.to);
    if (!f || !t) return null;
    return { x1: f.x + NODE_W / 2, y1: f.y + NODE_H / 2, x2: t.x + NODE_W / 2, y2: t.y + NODE_H / 2 };
  };

  const isEmpty = nodes.length === 0 && texts.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--ink-700)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg)', marginRight: 8 }}>Flow</span>
        {(['select', 'node', 'text', 'connect'] as Tool[]).map(t => (
          <button key={t} className={tool === t ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 9, padding: '3px 10px' }}
            onClick={() => { setTool(t); setConnecting(null); }}
            title={t === 'select' ? 'Move' : t === 'node' ? 'Box' : t === 'text' ? 'Text' : 'Connect'}>
            {t === 'select' ? 'Move' : t === 'node' ? 'Box' : t === 'text' ? 'Text' : 'Connect'}
          </button>
        ))}
        {selected && (
          <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px', color: 'var(--signal-red)' }} onClick={deleteSelected}>Delete</button>
        )}
        {connecting && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-orange)', letterSpacing: '0.1em' }}>click target…</span>
        )}
        <div style={{ flex: 1, display: 'flex', gap: 4, overflowX: 'auto', marginLeft: 8, paddingLeft: 8, borderLeft: saved.length > 0 ? '1px solid var(--border)' : 'none' }}>
          {saved.map(s => (
            <button key={s.id} className="btn btn-ghost"
              style={{ fontSize: 9, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => handleLoadSaved(s.id)}
              title={`Load "${s.name}" (saved ${s.savedAt})`}>
              {s.name}
              <span onClick={e => handleDeleteSaved(s.id, e)} style={{ color: 'var(--fg-dim)', marginLeft: 2, cursor: 'pointer' }} title="Delete">×</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }} onClick={handleSaveCanvas}
            disabled={isEmpty} title="Save canvas">
            Save
          </button>
          {!isEmpty && (
            <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px', color: 'var(--fg-dim)' }}
              onClick={() => { if (window.confirm('Clear the entire canvas?')) { save({ nodes: [], edges: [], texts: [] }); setSelected(null); setConnecting(null); } }}>
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
        style={{ flex: 1, cursor: tool === 'node' || tool === 'text' ? 'crosshair' : tool === 'connect' ? 'cell' : 'default', display: 'block' }}
        onClick={onSvgClick}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill="var(--ash-600, #555)" opacity="0.7" />
          </pattern>
          <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="var(--signal-orange)" opacity="0.8" />
          </marker>
        </defs>

        {/* Dot grid background */}
        <rect width="100%" height="100%" fill="url(#dots)" />

        {/* Edges */}
        {edges.map(edge => {
          const c = edgeCoords(edge);
          if (!c) return null;
          return <line key={edge.id} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
            stroke="var(--signal-orange)" strokeWidth={1.5} opacity={0.7} markerEnd="url(#arr)" />;
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x},${node.y})`}>
            <rect
              width={NODE_W} height={NODE_H} rx={0}
              fill="var(--ink-700)"
              stroke={node.id === selected ? 'var(--signal-orange)' : node.id === connecting ? '#4a90d9' : 'var(--border)'}
              strokeWidth={node.id === selected || node.id === connecting ? 2 : 1}
              style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
              onClick={e => onNodeClick(e, node.id)}
              onMouseDown={e => onNodeMouseDown(e, node.id)}
              onDoubleClick={e => onDoubleClickNode(e, node.id)}
            />
            <foreignObject x={0} y={0} width={NODE_W} height={NODE_H} style={{ pointerEvents: 'none' }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                {editing === node.id ? (
                  <input
                    autoFocus
                    defaultValue={node.label}
                    onBlur={e => commitNodeEdit(node.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); e.stopPropagation(); }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.06em', textAlign: 'center', textTransform: 'uppercase', padding: '0 6px', boxSizing: 'border-box', pointerEvents: 'all' }}
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: NODE_W - 12, userSelect: 'none' }}>
                    {node.label}
                  </span>
                )}
              </div>
            </foreignObject>
          </g>
        ))}

        {/* Text labels */}
        {texts.map(t => (
          <g key={t.id} transform={`translate(${t.x},${t.y})`}>
            {/* invisible hit area */}
            <rect
              x={-4} y={-14} width={Math.max(80, t.text.length * 7 + 8)} height={20}
              fill="transparent"
              stroke={t.id === selected ? 'var(--signal-orange)' : 'transparent'}
              strokeWidth={1}
              strokeDasharray={t.id === selected ? '3 2' : undefined}
              style={{ cursor: tool === 'select' ? 'move' : 'pointer' }}
              onClick={e => onTextClick(e, t.id)}
              onMouseDown={e => onTextMouseDown(e, t.id)}
              onDoubleClick={e => onDoubleClickText(e, t.id)}
            />
            {editingText === t.id ? (
              <foreignObject x={-4} y={-16} width={200} height={24}>
                <input
                  autoFocus
                  defaultValue={t.text}
                  onBlur={e => commitTextEdit(t.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setEditingText(null); } e.stopPropagation(); }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: 'var(--ink-800)', border: '1px solid var(--signal-orange)', outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', padding: '2px 4px', width: '100%', boxSizing: 'border-box' }}
                />
              </foreignObject>
            ) : (
              <text x={0} y={0} textAnchor="start" dominantBaseline="auto" fill="var(--fg-muted)"
                fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.08em"
                style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {t.text}
              </text>
            )}
          </g>
        ))}

        {isEmpty && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
            fill="var(--fg-dim)" fontFamily="var(--font-mono)" fontSize={10} letterSpacing="0.14em"
            style={{ textTransform: 'uppercase', pointerEvents: 'none' }}>
            Box · Text · Connect · double-click to rename · drag to move
          </text>
        )}
      </svg>
    </div>
  );
}
