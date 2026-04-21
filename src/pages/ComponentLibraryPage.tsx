import { useState } from 'react';

const SECTIONS = ['Colors', 'Typography', 'Buttons', 'Inputs', 'Badges', 'Cards', 'Tabs', 'Rows', 'States', 'Flow'] as const;
type Section = typeof SECTIONS[number];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--signal-orange)', margin: '0 0 28px 0', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-dim)', margin: '32px 0 14px 0' }}>
      {children}
    </h3>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={{ width: 52, height: 52, background: `var(${name})`, border: '1px solid var(--border)' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--fg-dim)', textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.5 }}>
        {name}<br />{value}
      </span>
    </div>
  );
}

// ── Colors ──────────────────────────────────────────────────────────

function ColorsSection() {
  const palettes: Array<{ label: string; swatches: Array<{ name: string; value: string }> }> = [
    { label: 'Ink — Dark Backgrounds', swatches: [
      { name: '--ink-900', value: '#000000' }, { name: '--ink-800', value: '#0a0a0c' },
      { name: '--ink-700', value: '#111317' }, { name: '--ink-600', value: '#1a1d22' },
      { name: '--ink-500', value: '#252930' },
    ]},
    { label: 'Ash — Muted Text', swatches: [
      { name: '--ash-100', value: '#e8ebe5' }, { name: '--ash-200', value: '#d0d4ca' },
      { name: '--ash-300', value: '#b4b8ab' }, { name: '--ash-400', value: '#8c9086' },
      { name: '--ash-500', value: '#656962' },
    ]},
    { label: 'Yale — Blue Accent', swatches: [
      { name: '--yale-600', value: '#1e3a4d' }, { name: '--yale-500', value: '#284b63' },
      { name: '--yale-400', value: '#3a6684' }, { name: '--yale-300', value: '#5a87a5' },
    ]},
    { label: 'Signal — Status', swatches: [
      { name: '--signal-orange', value: '#ff5a1f' },
      { name: '--signal-red', value: '#d94a3d' },
      { name: '--signal-amber', value: '#d9a43d' },
    ]},
    { label: 'Ivory & Parchment', swatches: [
      { name: '--ivory-100', value: '#f4f9e9' }, { name: '--ivory-200', value: '#e4e9d8' },
      { name: '--parchment-100', value: '#eef0eb' }, { name: '--parchment-200', value: '#dcdfd7' },
    ]},
  ];

  const semanticTokens = [
    ['--fg', 'Primary text'],       ['--fg-muted', 'Muted text'],
    ['--fg-dim', 'Dim text'],        ['--border', 'Default border'],
    ['--border-strong', 'Strong border'], ['--accent', 'Primary action'],
    ['--signal-orange', 'Identity / Active'], ['--signal-amber', 'Attention / New'],
    ['--signal-red', 'Destructive only'], ['--bg-raised', 'Raised panel'],
  ];

  return (
    <div>
      <SectionTitle>Colors</SectionTitle>
      {palettes.map(p => (
        <div key={p.label} style={{ marginBottom: 32 }}>
          <SubTitle>{p.label}</SubTitle>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {p.swatches.map(s => <Swatch key={s.name} {...s} />)}
          </div>
        </div>
      ))}
      <SubTitle>Semantic Tokens</SubTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {semanticTokens.map(([token, desc]) => (
          <div key={token} style={{ padding: '8px 12px', background: 'var(--ink-700)', border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 18, height: 18, background: `var(${token})`, border: '1px solid var(--border)', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-orange)', letterSpacing: '0.06em' }}>{token}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Typography ──────────────────────────────────────────────────────

function TypographySection() {
  const families = [
    { name: '--font-display', font: 'Chakra Petch', sample: 'RMXLABS AI.DASHBOARD', usage: 'Headings · labels · node text · buttons' },
    { name: '--font-body', font: 'Space Grotesk', sample: 'The quick brown fox jumps over the lazy dog.', usage: 'Body text · descriptions · UI copy' },
    { name: '--font-mono', font: 'JetBrains Mono', sample: 'sk-ant-api · 2026-04-20 · aitoolbox:releases', usage: 'Metadata · timestamps · code · labels' },
    { name: '--font-category', font: 'Lost in South', sample: 'News YouTube Tools Projects Flow', usage: 'Column/category headers only' },
  ];

  const scale: Array<[string, string]> = [
    ['--fs-xs', '12px'], ['--fs-sm', '14px'], ['--fs-base', '16px'],
    ['--fs-md', '18px'], ['--fs-lg', '22px'], ['--fs-xl', '28px'],
    ['--fs-2xl', '36px'], ['--fs-3xl', '48px'],
  ];

  return (
    <div>
      <SectionTitle>Typography</SectionTitle>
      <SubTitle>Font Families</SubTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {families.map(f => (
          <div key={f.name} style={{ padding: '16px 20px', background: 'var(--ink-700)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-orange)', letterSpacing: '0.08em' }}>{f.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)' }}>{f.font}</span>
            </div>
            <div style={{ fontFamily: `var(${f.name})`, fontSize: 22, color: 'var(--fg)', lineHeight: 1.3, marginBottom: 8 }}>{f.sample}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.04em' }}>{f.usage}</div>
          </div>
        ))}
      </div>
      <SubTitle>Type Scale (--font-display)</SubTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {scale.map(([token, size]) => (
          <div key={token} style={{ display: 'flex', alignItems: 'baseline', gap: 20, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', width: 100, flexShrink: 0 }}>{token}<br />{size}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: size, color: 'var(--fg)', fontWeight: 700, lineHeight: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}>DashAI</span>
          </div>
        ))}
      </div>
      <SubTitle>Letter Spacing</SubTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['0.04em', 'Category headers'],
          ['0.06em', 'Project names · node labels'],
          ['0.08em', 'Mono metadata'],
          ['0.12em', 'Button labels'],
          ['0.18em', 'Dialog titles'],
          ['0.22em', 'Stencil / eyebrow'],
        ].map(([val, use]) => (
          <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', width: 56, flexShrink: 0 }}>{val}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: val, textTransform: 'uppercase', color: 'var(--fg)' }}>RMXLABS</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)' }}>{use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────

function ButtonsSection() {
  return (
    <div>
      <SectionTitle>Buttons</SectionTitle>
      <SubTitle>Variants</SubTitle>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-ghost">Ghost</button>
        <button className="btn btn-mono">Mono</button>
        <button className="btn btn-danger">Danger</button>
        <button className="btn-icon" title="Edit" style={{ fontSize: 16, opacity: 0.6 }}>✎</button>
        <button className="btn-icon" style={{ fontSize: 18, opacity: 0.6 }}>×</button>
      </div>
      <SubTitle>Sizes</SubTitle>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }}>Micro</button>
        <button className="btn btn-primary" style={{ fontSize: 10, padding: '5px 12px' }}>Small</button>
        <button className="btn btn-primary">Default</button>
        <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px' }}>Ghost Micro</button>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '5px 12px' }}>Ghost Small</button>
        <button className="btn btn-ghost">Ghost Default</button>
      </div>
      <SubTitle>Disabled</SubTitle>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <button className="btn btn-primary" disabled>Primary</button>
        <button className="btn btn-ghost" disabled>Ghost</button>
        <button className="btn btn-danger" disabled>Danger</button>
      </div>
      <SubTitle>In-App Examples</SubTitle>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <button className="btn btn-primary" style={{ fontSize: 10, padding: '5px 12px', letterSpacing: '0.12em' }}>CHAT W/ RMX.AI</button>
        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '5px 12px', letterSpacing: '0.12em' }}>Export</button>
        <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }}>Add</button>
        <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px' }}>Edit</button>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}>↩</button>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}>↪</button>
        <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 8px' }}>⊙</button>
        <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }}>→ Add to News</button>
        <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px', color: 'var(--signal-red)' }}>Delete (3)</button>
      </div>
    </div>
  );
}

// ── Inputs ──────────────────────────────────────────────────────────

function InputsSection() {
  return (
    <div>
      <SectionTitle>Inputs</SectionTitle>
      <SubTitle>Text Input</SubTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
        <input className="input" placeholder="Default input…" />
        <input className="input" defaultValue="With a value" />
        <input className="input" placeholder="Disabled" disabled />
        <input className="input" type="password" placeholder="sk-ant-api03-..." />
      </div>
      <SubTitle>Paste Input (.input-paste)</SubTitle>
      <div style={{ maxWidth: 520 }}>
        <input className="input input-paste" placeholder="Paste a URL or type a name… press Enter to confirm" />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', marginTop: 6, letterSpacing: '0.06em' }}>
          Orange left border · mono font · focus clears left border
        </p>
      </div>
      <SubTitle>Textarea</SubTitle>
      <div style={{ maxWidth: 420 }}>
        <textarea className="textarea" placeholder="Multi-line description…" />
      </div>
      <SubTitle>Select</SubTitle>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 520 }}>
        <select className="select" style={{ flex: 1, minWidth: 160 }}>
          <option>live</option><option>paused</option><option>done</option><option>idea</option>
        </select>
        <select className="select" style={{ flex: 1, minWidth: 160 }}>
          <option>personal</option><option>oa</option><option>other</option>
        </select>
      </div>
      <SubTitle>Form Group Pattern</SubTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 520, padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <div className="form-group"><label className="form-label">Name</label><input className="input" placeholder="Project name" /></div>
        <div className="form-group"><label className="form-label">Status</label><select className="select"><option>live</option><option>paused</option><option>done</option><option>idea</option></select></div>
        <div className="form-group"><label className="form-label">Category</label><select className="select"><option>personal</option><option>oa</option><option>other</option></select></div>
        <div className="form-group"><label className="form-label">Link</label><input className="input" placeholder="https://…" /></div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><textarea className="textarea" placeholder="Short description…" /></div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost">Cancel</button>
          <button type="button" className="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Badges ──────────────────────────────────────────────────────────

function BadgesSection() {
  return (
    <div>
      <SectionTitle>Badges & Labels</SectionTitle>
      <SubTitle>.badge variants</SubTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <span className="badge">Default</span>
        <span className="badge badge-active">Active</span>
        <span className="badge badge-arch">Archived</span>
        <span className="badge badge-error">Error</span>
        <span className="badge badge-beta">Beta</span>
        <span className="badge badge-new">New</span>
      </div>
      <SubTitle>.stencil variants</SubTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <span className="stencil">Default</span>
        <span className="stencil orange">Orange</span>
        <span className="stencil amber">Amber</span>
        <span className="stencil red">Red</span>
        <span className="stencil muted">Muted</span>
        <span className="stencil blue">Blue</span>
        <span className="stencil green">Green/Live</span>
      </div>
      <SubTitle>Stencil in context</SubTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <span className="stencil orange" style={{ fontSize: 9 }}>Anthropic</span>
        <span className="stencil muted" style={{ fontSize: 9 }}>Google</span>
        <span className="stencil muted" style={{ fontSize: 9 }}>OpenAI</span>
        <span className="stencil muted" style={{ fontSize: 9 }}>Meta</span>
        <span className="stencil amber" style={{ fontSize: 9 }}>NEW</span>
        <span className="stencil green" style={{ fontSize: 9 }}>live</span>
        <span className="stencil muted" style={{ fontSize: 9 }}>paused</span>
        <span className="stencil red" style={{ fontSize: 9 }}>done</span>
        <span className="stencil muted" style={{ fontSize: 9 }}>idea</span>
        <span className="stencil muted" style={{ fontSize: 9 }}>coding</span>
        <span className="stencil blue" style={{ fontSize: 9 }}>research</span>
      </div>
    </div>
  );
}

// ── Cards ───────────────────────────────────────────────────────────

function CardsSection() {
  return (
    <div>
      <SectionTitle>Cards</SectionTitle>
      <SubTitle>Variants</SubTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { cls: 'card', label: 'card', desc: 'Default — ink-700, 1px border, crisp shadow, hover lift' },
          { cls: 'card card-dark', label: 'card-dark', desc: 'Darker — ink-800 background variant' },
          { cls: 'card card-raised', label: 'card-raised', desc: 'Elevated shadow variant' },
          { cls: 'card card-paper', label: 'card-paper', desc: 'Light — ivory background, inverse text' },
        ].map(({ cls, label, desc }) => (
          <div key={cls} className={cls}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, color: cls.includes('paper') ? 'var(--ink-900)' : 'var(--fg)' }}>
              .{label}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: cls.includes('paper') ? 'var(--ink-700)' : 'var(--fg-muted)', margin: 0, lineHeight: 1.5 }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────

function TabsSection() {
  const [tab1, setTab1] = useState(0);
  const [tab2, setTab2] = useState(0);
  const [tab3, setTab3] = useState(0);
  return (
    <div>
      <SectionTitle>Tabs</SectionTitle>
      <SubTitle>Column navigation (.folder-tabs)</SubTitle>
      <div>
        <div className="folder-tabs">
          {['All', 'Personal', 'OA', 'Other'].map((t, i) => (
            <button key={t} className={`folder-tab${tab1 === i ? ' active' : ''}`} onClick={() => setTab1(i)}>{t}</button>
          ))}
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--ink-800)', border: '1px solid var(--border)', borderTop: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)' }}>
          Active: <span style={{ color: 'var(--signal-orange)' }}>{['All', 'Personal', 'OA', 'Other'][tab1]}</span>
        </div>
      </div>
      <SubTitle>Sub-tabs (news feed)</SubTitle>
      <div className="folder-tabs">
        {['Feed', 'Nuggets'].map((t, i) => (
          <button key={t} className={`folder-tab${tab2 === i ? ' active' : ''}`} onClick={() => setTab2(i)}>{t}</button>
        ))}
      </div>
      <SubTitle>Sub-tabs (youtube)</SubTitle>
      <div className="folder-tabs">
        {['Videos', 'Channels'].map((t, i) => (
          <button key={t} className={`folder-tab${tab3 === i ? ' active' : ''}`} onClick={() => setTab3(i)}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ── Rows ────────────────────────────────────────────────────────────

function RowsSection() {
  return (
    <div>
      <SectionTitle>Rows & Lists</SectionTitle>
      <SubTitle>.row — releases / news</SubTitle>
      <div style={{ border: '1px solid var(--border)' }}>
        {[
          { name: 'Claude Opus 4.7', company: 'Anthropic', date: 'MAR 26', desc: 'Flagship Opus tier. State-of-the-art agentic reasoning, deeper coding/tool-use.' },
          { name: 'Gemini 3 Pro', company: 'Google', date: 'FEB 26', desc: 'Next-gen flagship with massively improved reasoning, coding, and agentic task completion.' },
          { name: 'GPT-5', company: 'OpenAI', date: 'JAN 26', desc: 'Extended context, multimodal reasoning, and improved instruction following.' },
        ].map(item => (
          <div key={item.name} className="row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.06em' }}>{item.date}</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{item.name}</h3>
              <span className="stencil orange" style={{ fontSize: 9 }}>{item.company}</span>
              <span className="stencil amber" style={{ fontSize: 9 }}>NEW</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', margin: '6px 0 0', lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
      <SubTitle>.row.row-project — project rows</SubTitle>
      <div style={{ border: '1px solid var(--border)' }}>
        {[
          { name: 'DashAI', desc: 'React 19 AI toolbox dashboard with localStorage persistence.', status: 'live', isLive: true },
          { name: 'rmxbrand', desc: 'React brand guide web app with Tailwind and shadcn.', status: 'live', isLive: true },
          { name: 'RMXT.UBE', desc: 'YouTube-inspired dark-mode UI prototype in vanilla JS.', status: 'idea', isLive: false },
        ].map(p => (
          <div key={p.name} className="row row-project" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 45, height: 45, flexShrink: 0, background: 'var(--ink-600)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{p.name}</h2>
                <span className={`stencil${p.isLive ? ' green' : ''}`} style={{ fontSize: 9 }}>{p.status}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', margin: '3px 0 0' }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <SubTitle>Edit mode row (with action icons)</SubTitle>
      <div style={{ border: '1px solid var(--border)' }}>
        <div className="row row-project" style={{ padding: '10px 14px', display: 'flex', gap: 12, position: 'relative' }}>
          <div style={{ width: 45, height: 45, flexShrink: 0, background: 'var(--ink-600)' }} />
          <div style={{ flex: 1, minWidth: 0, paddingRight: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>DashAI</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', margin: '3px 0 0' }}>React 19 AI toolbox dashboard.</p>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex' }}>
            <button className="btn-icon" style={{ fontSize: 14, opacity: 0.5 }}>✎</button>
            <button className="btn-icon" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)' }}>×</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── States ──────────────────────────────────────────────────────────

function StatesSection() {
  return (
    <div>
      <SectionTitle>States & Animations</SectionTitle>
      <SubTitle>Loading / Blink (.blink)</SubTitle>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', padding: '16px 20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="blink" style={{ color: 'var(--signal-amber)', fontSize: 10 }}>●</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-muted)' }}>Fetching feed…</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="blink" style={{ color: 'var(--signal-orange)', fontSize: 8 }}>●</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>claude-sonnet-4-6</span>
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--signal-amber)' }}>● 3 new</span>
      </div>
      <SubTitle>Empty State</SubTitle>
      <div style={{ padding: '48px 20px', background: 'var(--ink-800)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          No items yet · click Add to get started
        </span>
      </div>
      <SubTitle>Error State</SubTitle>
      <div style={{ padding: '12px 16px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--signal-red)', margin: 0 }}>
          HTTP 401 · Invalid API key. Check your Anthropic console.
        </p>
      </div>
      <SubTitle>Dialog Pattern</SubTitle>
      <div style={{ position: 'relative', height: 240, background: 'rgba(0,0,0,0.75)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 24, width: 320, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Save Canvas</div>
          <input className="input" placeholder="Canvas name…" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost">Cancel</button>
            <button type="button" className="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
      <SubTitle>Star Rating</SubTitle>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '16px 20px', background: 'var(--ink-800)', border: '1px solid var(--border)' }}>
        {[0, 1, 2, 3].map(rating => (
          <div key={rating} style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3].map(n => (
              <span key={n} style={{ fontSize: 14, color: n <= rating ? 'var(--signal-amber)' : 'var(--ash-500)', cursor: 'pointer' }}>
                {n <= rating ? '★' : '☆'}
              </span>
            ))}
          </div>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)' }}>0 / 1 / 2 / 3 stars</span>
      </div>
      <SubTitle>Chat message bubbles</SubTitle>
      <div style={{ padding: '16px', background: 'var(--ink-800)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>You</span>
          <div style={{ maxWidth: '80%', padding: '8px 12px', background: 'var(--ink-600)', border: '1px solid var(--border-strong)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg)', lineHeight: 1.6 }}>
            Create a flowchart for a CI/CD pipeline.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RMX.AI</span>
          <div style={{ maxWidth: '88%', padding: '8px 12px', background: 'var(--ink-700)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg)', lineHeight: 1.6 }}>
            Here's a horizontal CI/CD pipeline flowchart:
          </div>
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px', marginTop: 2 }}>→ Load to Flow</button>
        </div>
      </div>
    </div>
  );
}

// ── Flow SVG ────────────────────────────────────────────────────────

function FlowSection() {
  return (
    <div>
      <SectionTitle>Flow Canvas Elements</SectionTitle>
      <SubTitle>Nodes, Edges & Dot Background</SubTitle>
      <svg width="100%" height="220" style={{ background: 'var(--ink-900)', border: '1px solid var(--border)', display: 'block' }}>
        <defs>
          <pattern id="lib-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="1" fill="#555" opacity="0.55" />
          </pattern>
          <marker id="lib-arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="var(--signal-orange)" opacity="0.8" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#lib-dots)" />
        <line x1="168" y1="68" x2="228" y2="68" stroke="var(--signal-orange)" strokeWidth="1.5" opacity="0.7" markerEnd="url(#lib-arr)" />
        <line x1="388" y1="68" x2="448" y2="68" stroke="var(--signal-orange)" strokeWidth="1.5" opacity="0.7" markerEnd="url(#lib-arr)" />
        {/* Default node */}
        <g transform="translate(40,46)">
          <rect width="128" height="44" fill="var(--ink-700)" stroke="rgba(244,249,233,0.10)" strokeWidth="1" />
          <text x="64" y="22" textAnchor="middle" dominantBaseline="middle" fill="var(--ivory-100)" fontFamily="Chakra Petch, sans-serif" fontSize="11" fontWeight="700" letterSpacing="0.06em">DEFAULT</text>
        </g>
        {/* Selected node */}
        <g transform="translate(260,46)">
          <rect width="128" height="44" fill="var(--ink-700)" stroke="var(--signal-orange)" strokeWidth="2" />
          <text x="64" y="22" textAnchor="middle" dominantBaseline="middle" fill="var(--ivory-100)" fontFamily="Chakra Petch, sans-serif" fontSize="11" fontWeight="700" letterSpacing="0.06em">SELECTED</text>
        </g>
        {/* Connecting node */}
        <g transform="translate(480,46)">
          <rect width="128" height="44" fill="var(--ink-700)" stroke="#4a90d9" strokeWidth="2" />
          <text x="64" y="22" textAnchor="middle" dominantBaseline="middle" fill="var(--ivory-100)" fontFamily="Chakra Petch, sans-serif" fontSize="11" fontWeight="700" letterSpacing="0.06em">CONNECTING</text>
        </g>
        {/* Labels */}
        <text x="40" y="106" fill="rgba(255,255,255,0.2)" fontFamily="JetBrains Mono,monospace" fontSize="9" letterSpacing="0.1em">DEFAULT</text>
        <text x="260" y="106" fill="rgba(255,90,31,0.45)" fontFamily="JetBrains Mono,monospace" fontSize="9" letterSpacing="0.1em">SELECTED</text>
        <text x="480" y="106" fill="rgba(90,135,165,0.6)" fontFamily="JetBrains Mono,monospace" fontSize="9" letterSpacing="0.1em">CONNECTING</text>
        {/* Marquee */}
        <rect x="260" y="120" width="200" height="60" fill="rgba(255,90,31,0.06)" stroke="var(--signal-orange)" strokeWidth="1" strokeDasharray="4 3" />
        <text x="265" y="158" fill="rgba(255,90,31,0.4)" fontFamily="JetBrains Mono,monospace" fontSize="9" letterSpacing="0.1em">MARQUEE SELECT</text>
        {/* Text node */}
        <text x="40" y="155" textAnchor="start" dominantBaseline="middle" fill="var(--fg-muted)" fontFamily="JetBrains Mono,monospace" fontSize="11" letterSpacing="0.08em">Flow text label</text>
      </svg>
      <SubTitle>Arrow Marker</SubTitle>
      <svg width="200" height="40" style={{ background: 'var(--ink-900)', border: '1px solid var(--border)', display: 'block' }}>
        <defs>
          <marker id="lib-arr2" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="var(--signal-orange)" opacity="0.8" />
          </marker>
        </defs>
        <line x1="20" y1="20" x2="170" y2="20" stroke="var(--signal-orange)" strokeWidth="1.5" opacity="0.7" markerEnd="url(#lib-arr2)" />
      </svg>
      <SubTitle>Toolbar Pattern</SubTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--ink-700)', border: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-category)', fontSize: 20, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg)', marginRight: 8 }}>Flow</span>
        {['Move', 'Box', 'Text', 'Connect'].map((t, i) => (
          <button key={t} className={i === 0 ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 9, padding: '3px 10px' }}>{t}</button>
        ))}
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}>↩</button>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }}>↪</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)' }}>100%</span>
          <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 8px' }}>⊙</button>
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }}>Save 0/10</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────

export default function ComponentLibraryPage({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState<Section>('Colors');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--ink-900)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '3px solid var(--border-strong)', flexShrink: 0, background: 'var(--ink-800)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>RMXLABS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-dim)', letterSpacing: '0.1em' }}>/ COMPONENT LIBRARY</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-orange)', letterSpacing: '0.08em', border: '1px solid var(--signal-orange)', padding: '1px 6px' }}>DashAI v1</span>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 9, padding: '3px 10px' }} onClick={onClose}>✕ Close</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 152, flexShrink: 0, borderRight: '1px solid var(--border)', overflow: 'auto', background: 'var(--ink-800)' }}>
          <div style={{ padding: '14px 14px 6px', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--fg-dim)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Sections</div>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
              background: activeSection === s ? 'var(--ink-600)' : 'transparent',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: activeSection === s ? 'var(--signal-orange)' : 'var(--fg-dim)',
              borderLeft: activeSection === s ? '2px solid var(--signal-orange)' : '2px solid transparent',
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
          {activeSection === 'Colors' && <ColorsSection />}
          {activeSection === 'Typography' && <TypographySection />}
          {activeSection === 'Buttons' && <ButtonsSection />}
          {activeSection === 'Inputs' && <InputsSection />}
          {activeSection === 'Badges' && <BadgesSection />}
          {activeSection === 'Cards' && <CardsSection />}
          {activeSection === 'Tabs' && <TabsSection />}
          {activeSection === 'Rows' && <RowsSection />}
          {activeSection === 'States' && <StatesSection />}
          {activeSection === 'Flow' && <FlowSection />}
        </div>
      </div>
    </div>
  );
}
