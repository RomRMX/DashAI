import { useState, useEffect } from 'react';
import { useDictionary } from '../hooks/useDictionary';
import type { DictionaryTerm } from '../types/dictionary';
import EmptyState from '../components/ui/EmptyState';


function TermEntry({ term, onEdit, onDelete, editMode }: { term: DictionaryTerm; onEdit: () => void; onDelete: () => void; editMode: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '7px 0', cursor: 'pointer', userSelect: 'none' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: open ? 'var(--signal-orange)' : 'var(--fg)', margin: 0, lineHeight: 1.3 }}>{term.term}</h2>
        {open && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55, margin: '5px 0 0 0' }}>{term.plainDefinition}</p>
        )}
      </div>
      {open && editMode && (
        <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={onEdit}>Edit</button>
          <button className="btn-icon" onClick={onDelete} aria-label="Delete">×</button>
        </div>
      )}
    </div>
  );
}

function TermDialog({ initial, onSave, onClose }: { initial?: Partial<DictionaryTerm>; onSave: (d: Omit<DictionaryTerm, 'id' | 'createdAt' | 'updatedAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ term: initial?.term || '', plainDefinition: initial?.plainDefinition || '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.term.trim() || !form.plainDefinition.trim()) return;
    onSave({ term: form.term.trim(), plainDefinition: form.plainDefinition.trim(), category: initial?.category || 'general' });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 24, width: 440, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>{initial?.term ? 'Edit Term' : 'Add Term'}</div>
        <div className="form-group"><label className="form-label">Term</label><input className="input" value={form.term} onChange={e => set('term', e.target.value)} placeholder="RAG" required /></div>
        <div className="form-group">
          <label className="form-label">Definition (1–2 sentences)</label>
          <textarea className="textarea" value={form.plainDefinition} onChange={e => set('plainDefinition', e.target.value)} placeholder="Plain-English explanation..." required style={{ minHeight: 80 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function DictionaryPage({ editMode = false, addTrigger = 0 }: { editMode?: boolean; addTrigger?: number }) {
  const { terms, addTerm, updateTerm, deleteTerm, search } = useDictionary();
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<{ open: boolean; editing?: DictionaryTerm }>({ open: false });

  useEffect(() => { if (addTrigger > 0) setDialog({ open: true }); }, [addTrigger]);

  const allSorted = query ? search(query) : terms.slice().sort((a, b) => a.term.localeCompare(b.term));
  const displayed = allSorted.filter(t => !t.term.startsWith('/'));

  const save = (data: Omit<DictionaryTerm, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (dialog.editing) updateTerm(dialog.editing.id, data);
    else addTerm(data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 12px 6px' }}>
        <input className="input" style={{ width: '100%', fontSize: 13, padding: '6px 10px' }} placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {displayed.length === 0 ? (
        <EmptyState label="No terms found" action="Add" onAction={() => setDialog({ open: true })} />
      ) : (
        <div style={{ overflow: 'auto', flex: 1, padding: '0 12px' }}>
          {displayed.map(t => (
            <TermEntry key={t.id} term={t} onEdit={() => setDialog({ open: true, editing: t })} onDelete={() => deleteTerm(t.id)} editMode={editMode} />
          ))}
        </div>
      )}

      {dialog.open && <TermDialog initial={dialog.editing} onSave={save} onClose={() => setDialog({ open: false })} />}
    </div>
  );
}
