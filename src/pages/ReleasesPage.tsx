import { useState, useMemo, useCallback, useEffect } from 'react';
import { useReleases } from '../hooks/useReleases';
import { useFeedPolling } from '../hooks/useFeedPolling';
import { fetchNewReleases } from '../lib/feedFetcher';
import type { AIRelease } from '../types/releases';
import { formatDate, uid, now } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';

const COMPANIES = ['Anthropic', 'Google', 'OpenAI'];
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const NUGGET_KEY = 'aitoolbox:nuggets';

type ReleaseTab = 'feed' | 'nugget';
type Nugget = {
  id: string;
  text: string;
  source?: string;
  createdAt: string;
  // Populated when nugget is created from a dragged release card
  name?: string;
  company?: string;
  releaseDate?: string;
  description?: string;
};

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS;
}

function loadNuggets(): Nugget[] {
  try { const s = localStorage.getItem(NUGGET_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function saveNuggets(items: Nugget[]) { localStorage.setItem(NUGGET_KEY, JSON.stringify(items)); }

function ReleaseCard({ release, onEdit, onDelete: _onDelete, editMode }: { release: AIRelease; onEdit: () => void; onDelete: () => void; editMode: boolean }) {
  const handleCardClick = () => {
    if (release.link) window.open(release.link, '_blank', 'noreferrer');
  };
  return (
    <div
      className="row"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/x-release', JSON.stringify(release));
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={handleCardClick}
      style={{ position: 'relative', padding: '14px 14px', borderBottom: '1px solid var(--border)', cursor: release.link ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', lineHeight: 1.2, margin: 0 }}>{release.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-crt)', fontSize: 13, color: 'var(--signal-orange)', letterSpacing: '0.1em' }}>{formatDate(release.releaseDate)}</span>
            <span className="stencil" style={{ fontSize: 9 }}>{release.company}</span>
            {isNew(release.createdAt) && <span className="stencil" style={{ fontSize: 9 }}>New</span>}
            {editMode && <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5 }}>✎</button>}
          </div>
        </div>
      </div>
      {release.description && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>{release.description}</p>
      )}
    </div>
  );
}

function NuggetCard({ nugget, onDelete: _onDelete }: { nugget: Nugget; onDelete: () => void }) {
  const handleClick = () => { if (nugget.source) window.open(nugget.source, '_blank', 'noreferrer'); };

  if (nugget.name) {
    return (
      <div
        className="row"
        onClick={handleClick}
        style={{ position: 'relative', padding: '14px 14px', borderBottom: '1px solid var(--border)', cursor: nugget.source ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', lineHeight: 1.2, margin: 0 }}>{nugget.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {nugget.releaseDate && <span style={{ fontFamily: 'var(--font-crt)', fontSize: 13, color: 'var(--signal-orange)', letterSpacing: '0.1em' }}>{formatDate(nugget.releaseDate)}</span>}
              {nugget.company && <span className="stencil" style={{ fontSize: 9 }}>{nugget.company}</span>}
              {isNew(nugget.createdAt) && <span className="stencil" style={{ fontSize: 9 }}>New</span>}
            </div>
          </div>
        </div>
        {nugget.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>{nugget.description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="row"
      onClick={handleClick}
      style={{ padding: '14px 14px', borderBottom: '1px solid var(--border)', cursor: nugget.source ? 'pointer' : 'default' }}
    >
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--fg)', lineHeight: 1.5, margin: 0 }}>{nugget.text}</p>
      {nugget.source && (
        <div style={{ marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {nugget.source.replace(/^https?:\/\//, '').split('/')[0]}
          </span>
        </div>
      )}
    </div>
  );
}

function ReleaseDialog({ initial, onSave, onClose }: { initial?: Partial<AIRelease>; onSave: (d: Omit<AIRelease, 'id' | 'createdAt' | 'updatedAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: initial?.name || '', company: initial?.company || 'Anthropic', releaseDate: initial?.releaseDate || '', description: initial?.description || '', link: initial?.link || '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.releaseDate) return;
    onSave({ name: form.name.trim(), company: form.company, releaseDate: form.releaseDate, description: form.description.trim(), tags: [], link: form.link.trim() || undefined });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>{initial?.name ? 'Edit Release' : 'Add Release'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Company</label>
            <select className="select" value={form.company} onChange={e => set('company', e.target.value)}>
              {[...COMPANIES, 'Meta', 'Mistral', 'xAI', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Release Date</label><input className="input" type="date" value={form.releaseDate} onChange={e => set('releaseDate', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} style={{ minHeight: 70 }} /></div>
        <div className="form-group"><label className="form-label">Link (optional)</label><input className="input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://..." /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function ReleasesPage() {
  const { releases, addRelease, updateRelease, deleteRelease, mergeFromFeed } = useReleases();
  const [tab, setTab] = useState<ReleaseTab>('feed');
  const [dialog, setDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<AIRelease | null>(null);
  const [nuggets, setNuggets] = useState<Nugget[]>(loadNuggets);
  const [nuggetDragOver, setNuggetDragOver] = useState(false);
  const editMode = false;
  const [displayNewCount, setDisplayNewCount] = useState(0);

  const handlePoll = useCallback(async () => {
    const incoming = await fetchNewReleases(releases);
    return mergeFromFeed(incoming);
  }, [releases, mergeFromFeed]);

  const { status, newCount, refresh } = useFeedPolling({
    key: 'aitoolbox:poll:releases',
    onPoll: handlePoll,
  });

  // Show "N new" badge briefly after each successful poll
  useEffect(() => {
    if (newCount > 0) {
      setDisplayNewCount(newCount);
      const t = setTimeout(() => setDisplayNewCount(0), 60_000);
      return () => clearTimeout(t);
    }
  }, [newCount]);

  const dropReleaseAsNugget = (e: React.DragEvent) => {
    e.preventDefault();
    setNuggetDragOver(false);
    try {
      const r: AIRelease = JSON.parse(e.dataTransfer.getData('application/x-release'));
      const text = r.name + (r.description ? ' — ' + r.description : '');
      const updated = [{ id: uid(), text, source: r.link, createdAt: now(), name: r.name, company: r.company, releaseDate: r.releaseDate, description: r.description || undefined }, ...nuggets];
      setNuggets(updated);
      saveNuggets(updated);
      setTab('nugget');
    } catch {}
  };

  const displayed = useMemo(() =>
    releases
      .filter(r => COMPANIES.includes(r.company))
      .slice()
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  , [releases]);

  const deleteNugget = (id: string) => {
    const updated = nuggets.filter(n => n.id !== id);
    setNuggets(updated);
    saveNuggets(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 14px 6px', background: 'var(--ink-700)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h2 style={{ fontFamily: 'var(--font-category)', fontSize: 20, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              News
            </h2>
            {status === 'fetching' && (
              <span className="blink" style={{ color: 'var(--signal-amber)', fontSize: 8, lineHeight: 1 }}>●</span>
            )}
            {displayNewCount > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-amber)', letterSpacing: '0.05em' }}>● {displayNewCount} new</span>
            )}
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px' }} onClick={refresh} disabled={status === 'fetching'}>
            {status === 'fetching' ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="folder-tabs">
        {(['feed', 'nugget'] as ReleaseTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            onDragOver={t === 'nugget' ? e => { e.preventDefault(); setNuggetDragOver(true); } : undefined}
            onDragLeave={t === 'nugget' ? () => setNuggetDragOver(false) : undefined}
            onDrop={t === 'nugget' ? dropReleaseAsNugget : undefined}
            className={`folder-tab${tab === t ? ' active' : ''}`}
            style={t === 'nugget' && nuggetDragOver ? { borderColor: 'var(--signal-amber)', color: 'var(--signal-amber)' } : undefined}>
            {t === 'nugget' ? 'Nuggets' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* FEED */}
      {tab === 'feed' && (
        displayed.length === 0
          ? <EmptyState label="No releases found" action="Add" onAction={() => setDialog(true)} />
          : <div className="scroll-edge" style={{ overflow: 'auto', flex: 1 }}>
              {displayed.map(r => <ReleaseCard key={r.id} release={r} onEdit={() => setEditingRelease(r)} onDelete={() => deleteRelease(r.id)} editMode={editMode} />)}
            </div>
      )}

      {/* NUGGET */}
      {tab === 'nugget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', flex: 1, overflow: 'hidden' }}>
          {nuggets.length === 0
            ? <EmptyState label="No nuggets yet — paste text or a URL above" />
            : <div className="scroll-edge" style={{ overflow: 'auto', paddingBottom: 16, margin: '0 -14px' }}>
                {nuggets.map(n => <NuggetCard key={n.id} nugget={n} onDelete={() => deleteNugget(n.id)} />)}
              </div>
          }
        </div>
      )}

      {dialog && <ReleaseDialog onSave={data => { addRelease(data); setDialog(false); }} onClose={() => setDialog(false)} />}
      {editingRelease && <ReleaseDialog initial={editingRelease} onSave={data => { updateRelease(editingRelease.id, data); setEditingRelease(null); }} onClose={() => setEditingRelease(null)} />}
    </div>
  );
}
