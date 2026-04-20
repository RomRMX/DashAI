import { useState, useEffect } from 'react';
import { uid, now } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';

const KEY = 'aitoolbox:tips';

type Tip = { id: string; text: string; createdAt: string };

const SEED: Tip[] = [
  { id: uid(), text: 'Start a new session every hour to keep context fresh.', createdAt: now() },
  { id: uid(), text: 'Use specific, scoped prompts — one task per message.', createdAt: now() },
  { id: uid(), text: 'Paste full error messages, not just summaries.', createdAt: now() },
  { id: uid(), text: 'Ask Claude to explain before it changes anything critical.', createdAt: now() },
  { id: uid(), text: 'Commit working code before starting a new feature.', createdAt: now() },
  { id: uid(), text: 'Use /clear to reset context without starting a new session.', createdAt: now() },
  { id: uid(), text: 'Reference file paths explicitly — don\'t assume Claude remembers.', createdAt: now() },
];

function load(): Tip[] {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s);
  } catch {}
  const tips = SEED;
  localStorage.setItem(KEY, JSON.stringify(tips));
  return tips;
}

function save(tips: Tip[]) {
  localStorage.setItem(KEY, JSON.stringify(tips));
}

export default function TipsPage({ editMode = false, addTrigger = 0 }: { editMode?: boolean; addTrigger?: number }) {
  const [tips, setTips] = useState<Tip[]>(load);
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (addTrigger > 0) setAdding(true); }, [addTrigger]);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    const updated = [...tips, { id: uid(), text: draft.trim(), createdAt: now() }];
    setTips(updated);
    save(updated);
    setDraft('');
    setAdding(false);
  };

  const remove = (id: string) => {
    const updated = tips.filter(t => t.id !== id);
    setTips(updated);
    save(updated);
  };

  const startEdit = (tip: Tip) => {
    setEditing(tip.id);
    setEditText(tip.text);
  };

  const commitEdit = (id: string) => {
    if (!editText.trim()) return;
    const updated = tips.map(t => t.id === id ? { ...t, text: editText.trim() } : t);
    setTips(updated);
    save(updated);
    setEditing(null);
  };

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      {adding && (
        <div style={{ padding: '0 12px', display: 'flex', gap: 6 }}>
          <input
            className="input input-paste"
            autoFocus
            style={{ flex: 1, padding: '6px 10px' }}
            placeholder="Write a tip..."
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
          />
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }} onClick={add}>Save</button>
        </div>
      )}

      {tips.length === 0 ? (
        <EmptyState label="No tips yet" action="Add" onAction={() => setAdding(true)} />
      ) : (
        <div style={{ overflow: 'auto', flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {tips.map((tip, i) => (
            <div key={tip.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--signal-orange)', flexShrink: 0, marginTop: 3, letterSpacing: '0.1em' }}>{String(i + 1).padStart(2, '0')}</span>
              {editMode && editing === tip.id ? (
                <textarea
                  autoFocus
                  className="textarea"
                  style={{ flex: 1, fontSize: 13, padding: '4px 8px', minHeight: 56 }}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setEditing(null); }}
                />
              ) : (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0, flex: 1 }}>{tip.text}</p>
              )}
              {editMode && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {editing === tip.id ? (
                    <>
                      <button className="btn btn-primary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => commitEdit(tip.id)}>Save</button>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => startEdit(tip)}>Edit</button>
                      <button className="btn-icon" style={{ fontSize: 16, opacity: 0.5 }} onClick={() => remove(tip.id)} aria-label="Delete">×</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
