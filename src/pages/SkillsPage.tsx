import { useState, useRef, useEffect } from 'react';
import { useSkills } from '../hooks/useSkills';
import { useDictionary } from '../hooks/useDictionary';
import type { AISkill, SkillCategory } from '../types/skills';
import type { DictionaryTerm, DictCategory } from '../types/dictionary';
import { uid, now } from '../lib/utils';

const CATEGORIES: SkillCategory[] = ['writing', 'research', 'coding', 'analysis', 'image', 'audio', 'automation', 'other'];

// ─── Resource type ────────────────────────────────────────────────────────────

type Resource = { id: string; name: string; url: string; description?: string; createdAt: string };
const RESOURCES_KEY = 'aitoolbox:resources';
function loadResources(): Resource[] {
  try { const s = localStorage.getItem(RESOURCES_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
}
function saveResources(items: Resource[]) { localStorage.setItem(RESOURCES_KEY, JSON.stringify(items)); }

// ─── Tip type ─────────────────────────────────────────────────────────────────

type Tip = { id: string; text: string; createdAt: string };
const TIPS_KEY = 'aitoolbox:tips';
const TIP_SEED: Tip[] = [
  { id: uid(), text: 'Start a new session every hour to keep context fresh.', createdAt: now() },
  { id: uid(), text: 'Use specific, scoped prompts — one task per message.', createdAt: now() },
  { id: uid(), text: 'Paste full error messages, not just summaries.', createdAt: now() },
  { id: uid(), text: 'Ask Claude to explain before it changes anything critical.', createdAt: now() },
  { id: uid(), text: 'Commit working code before starting a new feature.', createdAt: now() },
  { id: uid(), text: 'Use /clear to reset context without starting a new session.', createdAt: now() },
  { id: uid(), text: "Reference file paths explicitly — don't assume Claude remembers.", createdAt: now() },
];
function loadTips(): Tip[] {
  try { const s = localStorage.getItem(TIPS_KEY); if (s) return JSON.parse(s); } catch {}
  localStorage.setItem(TIPS_KEY, JSON.stringify(TIP_SEED));
  return TIP_SEED;
}
function saveTips(items: Tip[]) { localStorage.setItem(TIPS_KEY, JSON.stringify(items)); }

/* ---- Cards ---- */

function SkillCard({ skill, onEdit, onDelete, onRate, editMode }: { skill: AISkill; onEdit: () => void; onDelete: () => void; onRate: (r: number) => void; editMode: boolean }) {
  const handleCardClick = () => {
    if (skill.link) window.open(skill.link, '_blank', 'noreferrer');
  };
  return (
    <div
      className="row"
      onClick={handleCardClick}
      style={{
        position: 'relative',
        padding: '14px 14px',
        borderBottom: '1px solid var(--border)',
        cursor: skill.link ? 'pointer' : 'default',
        display: 'flex',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{skill.toolName}</h2>
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', gap: 2, lineHeight: 1, flexShrink: 0 }}>
            {[1, 2, 3].map(n => (
              <button key={n} onClick={e => { e.stopPropagation(); onRate(skill.rating === n ? 0 : n); }} aria-label={`Rate ${n}`} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: n <= (skill.rating ?? 0) ? 'var(--signal-amber)' : 'var(--ash-500)', fontSize: 14, lineHeight: 1 }}>{n <= (skill.rating ?? 0) ? '★' : '☆'}</button>
            ))}
          </div>
          {editMode && (
            <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
              <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
            </div>
          )}
        </div>
        {skill.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: '8px 0 0 0' }}>{skill.description}</p>}
        {skill.useCase && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ash-400)', fontStyle: 'italic', margin: '4px 0 0 0' }}>"{skill.useCase}"</p>}
      </div>
    </div>
  );
}

function ResourceCard({ resource, onEdit, onDelete, editMode }: { resource: Resource; onEdit: () => void; onDelete: () => void; editMode: boolean }) {
  return (
    <div
      className="row"
      onClick={() => window.open(resource.url, '_blank', 'noreferrer')}
      style={{ padding: '14px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', margin: 0 }}>{resource.name}</h2>
        {editMode && (
          <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
          </div>
        )}
      </div>
      {resource.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>{resource.description}</p>}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>
        {resource.url.replace(/^https?:\/\//, '').split('/')[0]}
      </span>
    </div>
  );
}

function TermEntry({ term, onEdit, onDelete, editMode, alwaysOpen = false }: { term: DictionaryTerm; onEdit: () => void; onDelete: () => void; editMode: boolean; alwaysOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const isCmd = term.term.startsWith('/');
  const showDef = alwaysOpen || open;
  return (
    <div
      style={{ borderBottom: '1px solid var(--border)', padding: '10px 14px', cursor: alwaysOpen ? 'default' : 'pointer', userSelect: 'none' }}
      onClick={alwaysOpen ? undefined : () => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{
          flex: 1, minWidth: 0,
          fontFamily: isCmd ? 'var(--font-mono)' : 'var(--font-display)',
          fontSize: isCmd ? 13 : 14,
          fontWeight: 700,
          letterSpacing: isCmd ? '0.04em' : '0.08em',
          textTransform: isCmd ? 'none' : 'uppercase',
          color: !alwaysOpen && open ? 'var(--signal-orange)' : 'var(--fg)',
          margin: 0,
          lineHeight: 1.2,
        }}>{term.term}</h2>
        {editMode && (
          <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
          </div>
        )}
      </div>
      {showDef && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: '6px 0 0 0' }}>{term.plainDefinition}</p>
      )}
    </div>
  );
}

const WIKI_CATEGORY_ORDER: DictCategory[] = ['model', 'concept', 'technique', 'infrastructure', 'safety', 'data', 'general'];
const WIKI_CATEGORY_LABELS: Record<DictCategory, string> = {
  model: 'Models',
  concept: 'Concepts',
  technique: 'Techniques',
  infrastructure: 'Infrastructure',
  safety: 'Safety',
  data: 'Data',
  general: 'General',
};

function WikiCategoryGroup({ category, terms, onEdit, onDelete, editMode }: { category: DictCategory; terms: DictionaryTerm[]; onEdit: (t: DictionaryTerm) => void; onDelete: (id: string) => void; editMode: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', borderBottom: '1px solid var(--border)', userSelect: 'none', background: 'var(--ink-700)' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-dim)', width: 10, textAlign: 'center' }}>{open ? '▾' : '›'}</span>
        <div style={{ flex: 1, fontFamily: 'var(--font-category)', fontSize: 16, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg)' }}>{WIKI_CATEGORY_LABELS[category]}</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' }}>{String(terms.length).padStart(2, '0')}</span>
      </div>
      {open && terms.map(t => <TermEntry key={t.id} term={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} editMode={editMode} alwaysOpen={true} />)}
    </div>
  );
}

function TipEntry({ tip, index, onEdit, onDelete, editMode }: { tip: Tip; index: number; onEdit: () => void; onDelete: () => void; editMode: boolean }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--signal-orange)', flexShrink: 0, marginTop: 3, letterSpacing: '0.1em' }}>{String(index + 1).padStart(2, '0')}</span>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0, flex: 1 }}>{tip.text}</p>
      {editMode && (
        <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
        </div>
      )}
    </div>
  );
}

/* ---- Dialogs ---- */

function SkillDialog({ initial, onSave, onClose }: { initial?: Partial<AISkill>; onSave: (d: Omit<AISkill, 'id' | 'createdAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ toolName: initial?.toolName || '', description: initial?.description || '', category: (initial?.category || 'other') as SkillCategory, useCase: initial?.useCase || '', link: initial?.link || '' });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.toolName.trim()) return;
    onSave({ toolName: form.toolName.trim(), description: form.description.trim(), category: form.category, useCase: form.useCase.trim(), link: form.link.trim() || undefined, rating: 0 });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>{initial?.toolName ? 'Edit Skill' : 'Add Skill'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">Tool Name</label><input className="input" value={form.toolName} onChange={e => set('toolName', e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Category</label><select className="select" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Use Case</label><input className="input" value={form.useCase} onChange={e => set('useCase', e.target.value)} placeholder="Summarize PDFs for exec reports" /></div>
        <div className="form-group"><label className="form-label">Link (optional)</label><input className="input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://..." /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function TermDialog({ initial, onSave, onClose }: { initial: DictionaryTerm; onSave: (d: Partial<DictionaryTerm>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ term: initial.term, plainDefinition: initial.plainDefinition, category: initial.category });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.term.trim()) return;
    onSave({ term: form.term.trim(), plainDefinition: form.plainDefinition.trim(), category: form.category });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Edit {initial.term.startsWith('/') ? 'Command' : 'Term'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">Term</label><input className="input" value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">Category</label>
            <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as DictCategory }))}>
              {WIKI_CATEGORY_ORDER.map(c => <option key={c} value={c}>{WIKI_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Definition</label><textarea className="textarea" value={form.plainDefinition} onChange={e => setForm(f => ({ ...f, plainDefinition: e.target.value }))} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function TipDialog({ initial, onSave, onClose }: { initial: Tip; onSave: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState(initial.text);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSave(text.trim());
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Edit Tip</div>
        <div className="form-group"><label className="form-label">Tip</label><textarea className="textarea" value={text} onChange={e => setText(e.target.value)} required /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function ResourceDialog({ initial, onSave, onClose }: { initial: Resource; onSave: (d: Partial<Resource>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: initial.name, url: initial.url, description: initial.description || '' });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    onSave({ name: form.name.trim(), url: form.url.trim(), description: form.description.trim() || undefined });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Edit Resource</div>
        <div className="form-group"><label className="form-label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
        <div className="form-group"><label className="form-label">URL</label><input className="input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

/* ---- Page ---- */

type Tab = 'tools' | 'resources';
type SubTab = 'skills' | 'cmd' | 'wiki' | 'tips';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'skills', label: 'Skills' },
  { key: 'cmd', label: '/cmd' },
  { key: 'wiki', label: 'Wiki' },
  { key: 'tips', label: 'Tips' },
];

export default function SkillsPage() {
  const { skills, addSkill, updateSkill, deleteSkill, setRating } = useSkills();
  const { terms, addTerm, updateTerm, deleteTerm } = useDictionary();
  const [tab, setTab] = useState<Tab>('tools');
  const [subTab, setSubTab] = useState<SubTab>('skills');
  const [skillDialog, setSkillDialog] = useState<{ open: boolean; editing?: AISkill }>({ open: false });
  const [resources, setResources] = useState<Resource[]>(loadResources);
  const [tips, setTips] = useState<Tip[]>(loadTips);
  const [resPaste, setResPaste] = useState('');
  const [skillPasteInput, setSkillPasteInput] = useState('');
  const [cmdInput, setCmdInput] = useState('');
  const [wikiInput, setWikiInput] = useState('');
  const [tipInput, setTipInput] = useState('');
  const [skillAddOpen, setSkillAddOpen] = useState(false);
  const [resAddOpen, setResAddOpen] = useState(false);
  const [cmdAddOpen, setCmdAddOpen] = useState(false);
  const [wikiAddOpen, setWikiAddOpen] = useState(false);
  const [tipAddOpen, setTipAddOpen] = useState(false);
  const editMode = false;
  const [termDialog, setTermDialog] = useState<DictionaryTerm | null>(null);
  const [tipDialog, setTipDialog] = useState<Tip | null>(null);
  const [resourceDialog, setResourceDialog] = useState<Resource | null>(null);
  const skillPasteRef = useRef<HTMLInputElement>(null);
  const resPasteRef = useRef<HTMLInputElement>(null);
  const cmdRef = useRef<HTMLInputElement>(null);
  const wikiRef = useRef<HTMLInputElement>(null);
  const tipRef = useRef<HTMLInputElement>(null);
  const tipsRef = useRef(tips);
  tipsRef.current = tips;
  const resourcesRef = useRef(resources);
  resourcesRef.current = resources;

  useEffect(() => {
    const handler = (e: Event) => {
      const { type, data } = (e as CustomEvent).detail;
      if (type === 'skills:add') addSkill(data);
      if (type === 'dictionary:add') addTerm(data);
      if (type === 'tips:add') {
        const updated = [...tipsRef.current, { id: uid(), text: data.text as string, createdAt: now() }];
        setTips(updated);
        saveTips(updated);
      }
      if (type === 'resources:add') {
        const updated = [{ id: uid(), name: data.name as string, url: data.url as string, description: data.description as string | undefined, createdAt: now() }, ...resourcesRef.current];
        setResources(updated);
        saveResources(updated);
      }
    };
    window.addEventListener('aitoolbox:agent-action', handler);
    return () => window.removeEventListener('aitoolbox:agent-action', handler);
  }, [addSkill, addTerm]);

  const filteredSkills = skills
    .slice()
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const cmdTerms = terms.filter(t => t.term.startsWith('/')).sort((a, b) => a.term.localeCompare(b.term));
  const wikiTerms = terms.filter(t => !t.term.startsWith('/')).sort((a, b) => a.term.localeCompare(b.term));

  const handleResPaste = (value: string) => {
    const trimmed = value.trim();
    if (!/^https?:\/\//.test(trimmed)) return;
    const name = trimmed.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
    const updated = [{ id: uid(), name, url: trimmed, createdAt: now() }, ...resources];
    setResources(updated);
    saveResources(updated);
    setResPaste('');
    setResAddOpen(false);
  };

  const handleSkillPaste = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const isUrl = /^https?:\/\//.test(trimmed);
    const toolName = isUrl
      ? trimmed.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')
      : trimmed;
    addSkill({ toolName, description: '', category: 'other', useCase: '', link: isUrl ? trimmed : undefined, rating: 0 });
    setSkillPasteInput('');
    setSkillAddOpen(false);
  };

  const handleCmdAdd = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const term = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    addTerm({ term, plainDefinition: 'No definition yet.', category: 'general' });
    setCmdInput('');
    setCmdAddOpen(false);
  };

  const handleWikiAdd = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    addTerm({ term: trimmed, plainDefinition: 'No definition yet.', category: 'general' });
    setWikiInput('');
    setWikiAddOpen(false);
  };

  const handleTipAdd = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const updated = [...tips, { id: uid(), text: trimmed, createdAt: now() }];
    setTips(updated);
    saveTips(updated);
    setTipInput('');
    setTipAddOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: 'var(--ink-700)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-category)', fontSize: 20, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          {tab === 'tools' ? 'Tools' : 'Resources'}
        </h2>
      </div>

      {/* Main tab bar */}
      <div className="folder-tabs">
        {(['tools', 'resources'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`folder-tab${tab === t ? ' active' : ''}`}>
            {t === 'tools' ? 'Tools' : 'Resources'}
          </button>
        ))}
      </div>

      {/* TOOLS tab */}
      {tab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* Sub-tab selector */}
          <div className="folder-tabs">
            {SUB_TABS.map(st => (
              <button
                key={st.key}
                onClick={() => setSubTab(st.key)}
                className={`folder-tab${subTab === st.key ? ' active' : ''}`}
                style={{ fontSize: 10, padding: '5px 6px' }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* SKILLS sub-tab */}
          {subTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {skillAddOpen && (
                <input
                  ref={skillPasteRef}
                  className="input input-paste"
                  placeholder="Paste a URL or type a tool name..."
                  value={skillPasteInput}
                  onChange={e => setSkillPasteInput(e.target.value)}
                  onPaste={e => { const text = e.clipboardData.getData('text'); handleSkillPaste(text); e.preventDefault(); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSkillPaste(skillPasteInput); if (e.key === 'Escape') setSkillAddOpen(false); }}
                  style={{ margin: '10px 14px 0' }}
                />
              )}
              <div className="scroll-edge" style={{ overflow: 'auto', flex: 1, marginTop: 10 }}>
                {filteredSkills.map(s => <SkillCard key={s.id} skill={s} onEdit={() => setSkillDialog({ open: true, editing: s })} onDelete={() => deleteSkill(s.id)} onRate={r => setRating(s.id, r)} editMode={editMode} />)}
              </div>
            </div>
          )}

          {/* /CMD sub-tab */}
          {subTab === 'cmd' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {cmdAddOpen && (
                <input
                  ref={cmdRef}
                  className="input input-paste"
                  placeholder="Add a slash command (e.g. /clear)..."
                  value={cmdInput}
                  onChange={e => setCmdInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCmdAdd(cmdInput); if (e.key === 'Escape') setCmdAddOpen(false); }}
                  style={{ margin: '10px 14px 0' }}
                />
              )}
              <div className="scroll-edge" style={{ overflow: 'auto', flex: 1 }}>
                {cmdTerms.length === 0
                  ? <div style={{ padding: '32px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No commands</div>
                  : WIKI_CATEGORY_ORDER
                      .map(cat => ({ cat, items: cmdTerms.filter(t => t.category === cat) }))
                      .filter(g => g.items.length > 0)
                      .map(g => g.cat === 'general'
                        ? g.items.map(t => <TermEntry key={t.id} term={t} onEdit={() => setTermDialog(t)} onDelete={() => deleteTerm(t.id)} editMode={editMode} alwaysOpen={true} />)
                        : <WikiCategoryGroup key={g.cat} category={g.cat} terms={g.items} onEdit={t => setTermDialog(t)} onDelete={deleteTerm} editMode={editMode} />
                      )
                }
              </div>
            </div>
          )}

          {/* WIKI sub-tab */}
          {subTab === 'wiki' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {wikiAddOpen && (
                <input
                  ref={wikiRef}
                  className="input input-paste"
                  placeholder="Add a term (e.g. RAG)..."
                  value={wikiInput}
                  onChange={e => setWikiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleWikiAdd(wikiInput); if (e.key === 'Escape') setWikiAddOpen(false); }}
                  style={{ margin: '10px 14px 0' }}
                />
              )}
              <div className="scroll-edge" style={{ overflow: 'auto', flex: 1 }}>
                {wikiTerms.length === 0
                  ? <div style={{ padding: '32px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No terms</div>
                  : WIKI_CATEGORY_ORDER
                      .map(cat => ({ cat, items: wikiTerms.filter(t => t.category === cat) }))
                      .filter(g => g.items.length > 0)
                      .map(g => <WikiCategoryGroup key={g.cat} category={g.cat} terms={g.items} onEdit={t => setTermDialog(t)} onDelete={deleteTerm} editMode={editMode} />)
                }
              </div>
            </div>
          )}

          {/* TIPS sub-tab */}
          {subTab === 'tips' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {tipAddOpen && (
                <input
                  ref={tipRef}
                  className="input input-paste"
                  placeholder="Write a tip..."
                  value={tipInput}
                  onChange={e => setTipInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleTipAdd(tipInput); if (e.key === 'Escape') setTipAddOpen(false); }}
                  style={{ margin: '10px 14px 0' }}
                />
              )}
              <div className="scroll-edge" style={{ overflow: 'auto', flex: 1 }}>
                {tips.length === 0
                  ? <div style={{ padding: '32px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No tips yet</div>
                  : tips.map((t, i) => <TipEntry key={t.id} tip={t} index={i} onEdit={() => setTipDialog(t)} onDelete={() => { const updated = tips.filter(x => x.id !== t.id); setTips(updated); saveTips(updated); }} editMode={editMode} />)
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESOURCES tab */}
      {tab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {resAddOpen && (
            <input
              ref={resPasteRef}
              className="input input-paste"
              placeholder="Paste a URL to save a resource..."
              value={resPaste}
              onChange={e => setResPaste(e.target.value)}
              onPaste={e => { const text = e.clipboardData.getData('text'); handleResPaste(text); }}
              onKeyDown={e => { if (e.key === 'Enter') handleResPaste(resPaste); if (e.key === 'Escape') setResAddOpen(false); }}
              style={{ margin: '10px 14px 0' }}
            />
          )}
          <div className="scroll-edge" style={{ overflow: 'auto', flex: 1 }}>
            {resources.length === 0
              ? <div style={{ padding: '32px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No resources — paste a URL or click Add</div>
              : resources.map(r => <ResourceCard key={r.id} resource={r} onEdit={() => setResourceDialog(r)} onDelete={() => { const updated = resources.filter(x => x.id !== r.id); setResources(updated); saveResources(updated); }} editMode={editMode} />)
            }
          </div>
        </div>
      )}

      {skillDialog.open && <SkillDialog initial={skillDialog.editing} onSave={d => { if (skillDialog.editing) updateSkill(skillDialog.editing.id, d); else addSkill(d); setSkillDialog({ open: false }); }} onClose={() => setSkillDialog({ open: false })} />}
      {termDialog && <TermDialog initial={termDialog} onSave={d => updateTerm(termDialog.id, d)} onClose={() => setTermDialog(null)} />}
      {tipDialog && <TipDialog initial={tipDialog} onSave={text => { const updated = tips.map(t => t.id === tipDialog.id ? { ...t, text } : t); setTips(updated); saveTips(updated); }} onClose={() => setTipDialog(null)} />}
      {resourceDialog && <ResourceDialog initial={resourceDialog} onSave={d => { const updated = resources.map(r => r.id === resourceDialog.id ? { ...r, ...d } : r); setResources(updated); saveResources(updated); }} onClose={() => setResourceDialog(null)} />}
    </div>
  );
}
