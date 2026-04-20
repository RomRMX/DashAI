import { useState, useRef } from 'react';
import { uid, now } from '../lib/utils';

const KEY = 'aitoolbox:projects';
const VERSION_KEY = 'aitoolbox:projects:version';
const SEED_VERSION = '5';

type ProjectStatus = 'live' | 'paused' | 'done' | 'idea';
type ProjectCategory = 'personal' | 'oa' | 'other';
type ProjectTab = 'all' | ProjectCategory;

type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  link?: string;
  createdAt: string;
};

const STATUSES: ProjectStatus[] = ['live', 'paused', 'done', 'idea'];
const CATEGORIES: ProjectCategory[] = ['personal', 'oa', 'other'];

const SEED_PROJECTS: Project[] = [
  // personal
  { id: uid(), name: 'DashAI', description: 'React 19 AI toolbox dashboard with localStorage persistence.', status: 'live', category: 'personal', link: 'http://localhost:5173', createdAt: now() },
  { id: uid(), name: 'RMXLABS Design System', description: 'Studio brand system — tokens, type, fonts, UI kits.', status: 'live', category: 'personal', link: 'http://localhost:4400/design-system.html', createdAt: now() },
  { id: uid(), name: 'rmxbrand', description: 'React brand guide web app with Tailwind and shadcn.', status: 'live', category: 'personal', link: 'http://localhost:5175', createdAt: now() },
  { id: uid(), name: 'RMXT.UBE', description: 'YouTube-inspired dark-mode UI prototype in vanilla JS.', status: 'idea', category: 'personal', link: 'http://localhost:3000', createdAt: now() },
  { id: uid(), name: 'youtube-recap', description: 'Node API parsing YouTube watch history exports via JSDOM.', status: 'live', category: 'personal', link: 'http://localhost:3001', createdAt: now() },
  // oa
  { id: uid(), name: 'OA_DOTCOM', description: 'Origin Acoustics site prototype — static HTML, CSS, JS.', status: 'live', category: 'oa', link: 'http://localhost:4401', createdAt: now() },
  { id: uid(), name: 'OA Dealer Details', description: 'Native iOS SwiftUI app managing dealer info for OA.', status: 'live', category: 'oa', createdAt: now() },
  { id: uid(), name: 'Archive OA', description: 'Deprecated Origin Acoustics sub-projects archived in one repo.', status: 'paused', category: 'oa', createdAt: now() },
  // other
  { id: uid(), name: 'TITAN', description: 'Titan Lifting marketing site with parallax and galleries.', status: 'live', category: 'other', link: 'http://localhost:5174', createdAt: now() },
];

function load(): Project[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const s = localStorage.getItem(KEY);
    if (s && version === SEED_VERSION) {
      const parsed: Project[] = JSON.parse(s);
      return parsed.map(p => ({ ...p, category: p.category || 'personal' }));
    }
  } catch {}
  localStorage.setItem(KEY, JSON.stringify(SEED_PROJECTS));
  localStorage.setItem(VERSION_KEY, SEED_VERSION);
  return SEED_PROJECTS;
}

function persist(items: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// ─── App icon ───────────────────────────────────────────────────────────────

function ProjectIcon(_props: { name: string }) {
  return (
    <div style={{
      width: 45, height: 45, flexShrink: 0, borderRadius: 0,
      background: 'var(--ink-600)',
    }} />
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

function ProjectCard({ project, onEdit, onDelete, editMode }: { project: Project; onEdit: () => void; onDelete: () => void; editMode: boolean }) {
  const handleCardClick = () => {
    if (project.link) window.open(project.link, '_blank', 'noreferrer');
  };
  return (
    <div
      className="row row-project"
      onClick={handleCardClick}
      style={{
        position: 'relative',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        cursor: project.link ? 'pointer' : 'default',
        display: 'flex',
        gap: 12,
      }}
    >
      <ProjectIcon name={project.name} />
      <div style={{ flex: 1, minWidth: 0, paddingRight: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', lineHeight: 1.2, margin: 0 }}>{project.name}</h2>
          <span className={`stencil${project.status === 'live' ? ' green' : ''}`} style={{ fontSize: 9 }}>{project.status}</span>
        </div>
        {project.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.description}
          </p>
        )}
      </div>
      {editMode && (
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex' }}>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
        </div>
      )}
    </div>
  );
}

function ProjectDialog({ initial, category, onSave, onClose }: { initial?: Partial<Project>; category: ProjectCategory; onSave: (d: Omit<Project, 'id' | 'createdAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    status: (initial?.status || 'live') as ProjectStatus,
    category: (initial?.category || category) as ProjectCategory,
    link: initial?.link || '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ name: form.name.trim(), description: form.description.trim(), status: form.status, category: form.category, link: form.link.trim() || undefined });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>{initial?.name ? 'Edit Project' : 'Add Project'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">Name</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Category</label>
          <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Link (optional)</label><input className="input" value={form.link} onChange={e => set('link', e.target.value)} placeholder="https://..." /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(load);
  const [tab, setTab] = useState<ProjectTab>('all');
  const [dialog, setDialog] = useState<{ open: boolean; editing?: Project }>({ open: false });
  const [addInput, setAddInput] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);

  const displayed = tab === 'all' ? projects : projects.filter(p => p.category === tab);

  const save = (data: Omit<Project, 'id' | 'createdAt'>) => {
    let updated: Project[];
    if (dialog.editing) {
      updated = projects.map(p => p.id === dialog.editing!.id ? { ...p, ...data } : p);
    } else {
      updated = [{ ...data, id: uid(), createdAt: now() }, ...projects];
    }
    setProjects(updated);
    persist(updated);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    persist(updated);
  };

  const handleAddSubmit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const isUrl = /^https?:\/\//.test(trimmed);
    const name = isUrl
      ? trimmed.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '')
      : trimmed;
    const category: ProjectCategory = tab === 'all' ? 'personal' : tab;
    const updated = [{ id: uid(), createdAt: now(), name, description: '', status: 'live' as ProjectStatus, category, link: isUrl ? trimmed : undefined }, ...projects];
    setProjects(updated);
    persist(updated);
    setAddInput('');
    setAddOpen(false);
  };

  const toggleAdd = () => {
    setAddOpen(o => {
      const next = !o;
      if (next) setTimeout(() => addRef.current?.focus(), 0);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: 'var(--ink-700)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-category)', fontSize: 20, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Projects
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={editMode ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 9, padding: '3px 10px' }} onClick={() => setEditMode(e => !e)}>Edit</button>
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }} onClick={toggleAdd}>Add</button>
        </div>
      </div>

      <div className="folder-tabs">
        {(['all', ...CATEGORIES] as ProjectTab[]).map(c => (
          <button key={c} onClick={() => setTab(c)} className={`folder-tab${tab === c ? ' active' : ''}`}>
            {c === 'oa' ? 'OA' : c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {addOpen && (
        <input
          ref={addRef}
          className="input input-paste"
          placeholder="Paste a URL or type a project name..."
          value={addInput}
          onChange={e => setAddInput(e.target.value)}
          onPaste={e => { const text = e.clipboardData.getData('text'); handleAddSubmit(text); e.preventDefault(); }}
          onKeyDown={e => { if (e.key === 'Enter') handleAddSubmit(addInput); if (e.key === 'Escape') setAddOpen(false); }}
          style={{ margin: '10px 14px 0' }}
        />
      )}

      <div className="scroll-edge" style={{ overflow: 'auto', flex: 1, marginTop: 10 }}>
        {displayed.map(p => (
          <ProjectCard key={p.id} project={p} onEdit={() => setDialog({ open: true, editing: p })} onDelete={() => deleteProject(p.id)} editMode={editMode} />
        ))}
      </div>

      {dialog.open && <ProjectDialog initial={dialog.editing} category={tab === 'all' ? 'personal' : tab} onSave={save} onClose={() => setDialog({ open: false })} />}
    </div>
  );
}
