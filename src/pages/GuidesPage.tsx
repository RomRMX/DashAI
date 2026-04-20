import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGuides } from '../hooks/useGuides';
import type { TeachingGuide, GuideStep } from '../types/guides';
import { zeroPad, pad } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';

/* ---------- Step component (sortable) ---------- */

function SortableStep({ step, onUpdate, onDelete }: { step: GuideStep; onUpdate: (id: string, d: Partial<GuideStep>) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={{ ...style, background: 'var(--ink-700)', border: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Drag handle */}
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--fg-dim)', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em' }}>
          ⠿
        </div>
        {/* Step number */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--signal-orange)', letterSpacing: '0.1em', flexShrink: 0 }}>{pad(step.order + 1)} —</div>
        {/* Title */}
        <input
          className="input"
          style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
          value={step.title}
          onChange={e => onUpdate(step.id, { title: e.target.value })}
          placeholder="Step title..."
        />
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 0 }}>
          <button className="btn" onClick={() => setMode('edit')} style={{ padding: '4px 10px', fontSize: 9, background: mode === 'edit' ? 'var(--ink-500)' : 'transparent', color: mode === 'edit' ? 'var(--fg)' : 'var(--fg-dim)', border: '1px solid var(--border)', borderRight: 0 }}>Edit</button>
          <button className="btn" onClick={() => setMode('preview')} style={{ padding: '4px 10px', fontSize: 9, background: mode === 'preview' ? 'var(--ink-500)' : 'transparent', color: mode === 'preview' ? 'var(--fg)' : 'var(--fg-dim)', border: '1px solid var(--border)' }}>Preview</button>
        </div>
        <button className="btn-icon" onClick={() => onDelete(step.id)}>×</button>
      </div>

      {mode === 'edit' ? (
        <textarea
          className="textarea"
          value={step.content}
          onChange={e => onUpdate(step.id, { content: e.target.value })}
          placeholder="Write step content in markdown... **bold**, - bullet points, `code`, etc."
          style={{ minHeight: 100, fontSize: 13 }}
        />
      ) : (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--fg)', lineHeight: 1.7, padding: '10px 14px', background: 'var(--ink-800)', border: '1px solid var(--border)', minHeight: 60 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.content || '*No content yet*'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/* ---------- Guide editor ---------- */

function GuideEditor({ guide, onBack }: { guide: TeachingGuide; onBack: () => void }) {
  const { updateGuide, addStep, updateStep, deleteStep, reorderSteps } = useGuides();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = guide.steps.findIndex(s => s.id === active.id);
    const newIndex = guide.steps.findIndex(s => s.id === over.id);
    const reordered = arrayMove(guide.steps, oldIndex, newIndex);
    reorderSteps(guide.id, reordered.map(s => s.id));
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflow: 'auto' }}>
      {/* Back + publish */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 12px', fontSize: 10 }}>Back</button>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: guide.isPublished ? 'var(--ash-300)' : 'var(--fg-dim)', letterSpacing: '0.12em' }}>
          {guide.isPublished ? '● LIVE' : '◌ DRAFT'}
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '8px 14px' }} onClick={() => updateGuide(guide.id, { isPublished: !guide.isPublished })}>
          {guide.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      {/* Editable title & meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          className="input"
          style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '12px 14px', background: 'transparent', border: '1px solid transparent' }}
          value={guide.title}
          onChange={e => updateGuide(guide.id, { title: e.target.value })}
          placeholder="GUIDE TITLE"
          onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
          onBlur={e => (e.target.style.borderColor = 'transparent')}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea" value={guide.description} onChange={e => updateGuide(guide.id, { description: e.target.value })} placeholder="What does this guide teach?" style={{ minHeight: 60 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Audience</label>
            <input className="input" value={guide.audience} onChange={e => updateGuide(guide.id, { audience: e.target.value })} placeholder="Non-technical sales team" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tags (comma-separated)</label>
          <input className="input" value={guide.tags.join(', ')} onChange={e => updateGuide(guide.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="basics, prompting, tools" />
        </div>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* Steps header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{zeroPad(guide.steps.length, 'steps')}</div>
        <button className="btn btn-primary" style={{ fontSize: 10, padding: '8px 14px' }} onClick={() => addStep(guide.id, { title: '', content: '' })}>
          Add Step
        </button>
      </div>

      {guide.steps.length === 0 ? (
        <EmptyState label="No steps yet — add your first step" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={guide.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...guide.steps].sort((a, b) => a.order - b.order).map(step => (
                <SortableStep key={step.id} step={step} onUpdate={(id, d) => updateStep(guide.id, id, d)} onDelete={id => deleteStep(guide.id, id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/* ---------- Guide list ---------- */

function NewGuideDialog({ onSave, onClose }: { onSave: (d: Omit<TeachingGuide, 'id' | 'steps' | 'createdAt' | 'updatedAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', audience: '', tags: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ title: form.title.trim(), description: form.description.trim(), audience: form.audience.trim(), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), isPublished: false });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>New Guide</div>
        <div className="form-group"><label className="form-label">Title</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Introduction to Prompt Engineering" required /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this guide teach?" /></div>
        <div className="form-group"><label className="form-label">Audience</label><input className="input" value={form.audience} onChange={e => set('audience', e.target.value)} placeholder="Non-technical marketing team" /></div>
        <div className="form-group"><label className="form-label">Tags</label><input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="basics, prompting" /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create Guide</button>
        </div>
      </form>
    </div>
  );
}

function GuideCard({ guide, onEdit, onDelete }: { guide: TeachingGuide; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{guide.title}</div>
        <span className={`stencil ${guide.isPublished ? 'orange' : 'muted'}`}>{guide.isPublished ? '● LIVE' : '◌ DRAFT'}</span>
      </div>
      {guide.audience && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>For: {guide.audience}</div>}
      {guide.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>{guide.description}</p>}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ash-400)', letterSpacing: '0.1em' }}>{zeroPad(guide.steps.length, 'steps')}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {guide.tags.map(t => <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-dim)', background: 'var(--ink-800)', padding: '2px 6px', border: '1px solid var(--border)' }}>{t}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ fontSize: 10, padding: '8px 14px' }} onClick={onEdit}>Edit</button>
        <button className="btn-icon" onClick={onDelete}>×</button>
      </div>
    </div>
  );
}

/* ---------- Page root ---------- */

export default function GuidesPage() {
  const { guides, addGuide, deleteGuide } = useGuides();
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);

  if (selectedGuideId) {
    const guide = guides.find(g => g.id === selectedGuideId);
    if (!guide) return <div style={{ padding: 28, color: 'var(--fg-muted)' }}>Guide not found.</div>;
    return <GuideEditor guide={guide} onBack={() => setSelectedGuideId(null)} />;
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Guides</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.14em', marginTop: 2 }}>{zeroPad(guides.length, 'guides')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setDialog(true)}>New</button>
      </div>

      {guides.length === 0 ? (
        <EmptyState label="No guides yet — create your first" action="New Guide" onAction={() => setDialog(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, overflow: 'auto', paddingBottom: 16 }}>
          {guides.map(g => <GuideCard key={g.id} guide={g} onEdit={() => setSelectedGuideId(g.id)} onDelete={() => deleteGuide(g.id)} />)}
        </div>
      )}

      {dialog && <NewGuideDialog onSave={addGuide} onClose={() => setDialog(false)} />}
    </div>
  );
}
