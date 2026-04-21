import { useState, useRef, useEffect, useCallback } from 'react';

const API_KEY_STORAGE = 'aitoolbox:anthropic-key';
const MODEL = 'claude-sonnet-4-6';
const ENV_KEY = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY as string | undefined;

type Role = 'user' | 'assistant';
type Message = { id: string; role: Role; text: string };
type FlowData = { nodes: unknown[]; edges: unknown[]; texts: unknown[] };

function uid() { return Math.random().toString(36).slice(2, 10); }

function extractFlowChart(text: string): FlowData | null {
  const codeMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const raw = codeMatch?.[1] ?? text.match(/(\{"nodes"\s*:[\s\S]*?"edges"\s*:[\s\S]*?\}(?=\s*$|\s*\n))/)?.[1];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return { nodes: parsed.nodes, edges: parsed.edges, texts: parsed.texts ?? [] };
    }
  } catch {}
  return null;
}

function injectFlowChart(data: FlowData) {
  window.dispatchEvent(new CustomEvent('aitoolbox:flowchart:inject', { detail: data }));
}

type AgentAction = { type: string; data: Record<string, unknown> };

const ACTION_LABELS: Record<string, string> = {
  'releases:add': '→ Add to News',
  'nuggets:add': '→ Add Nugget',
  'youtube:add-video': '→ Add Video',
  'youtube:add-channel': '→ Add Channel',
  'skills:add': '→ Add to Tools',
  'dictionary:add': '→ Add Term',
  'tips:add': '→ Add Tip',
  'resources:add': '→ Add Resource',
  'projects:add': '→ Add to Projects',
};

function dispatchAction(action: AgentAction) {
  window.dispatchEvent(new CustomEvent('aitoolbox:agent-action', { detail: action }));
}

function renderText(text: string): React.ReactNode[] {
  const parts = text.split(/(```action\n[\s\S]*?\n```)/g);
  return parts.map((part, i) => {
    const actionMatch = part.match(/```action\n([\s\S]*?)\n```/);
    if (actionMatch) {
      try {
        const parsed: AgentAction = JSON.parse(actionMatch[1].trim());
        if (parsed.type && parsed.data) {
          return (
            <button key={i} className="btn btn-primary"
              style={{ fontSize: 9, padding: '3px 10px', display: 'block', marginTop: 6 }}
              onClick={() => dispatchAction(parsed)}>
              {ACTION_LABELS[parsed.type] ?? `→ Apply: ${parsed.type}`}
            </button>
          );
        }
      } catch {}
    }
    if (!part) return null;
    return <span key={i}>{part}</span>;
  }).filter(Boolean) as React.ReactNode[];
}

const SYSTEM_PROMPT = `You are RMX.AI, a personal AI assistant embedded in DashAI — RMXLABS' personal AI intelligence dashboard. Be concise and direct.

The app has four columns:
- News: AI release feed (Anthropic + Claude Code only; polls every 30 min). Has a 'Nuggets' sub-tab for saved snippets.
- YouTube: Tracks AI channels and videos; auto-fetches new videos every 30 min.
- Tools: Personal catalog of AI tools/skills, slash commands, wiki terms, tips, and resources.
- Projects: Project tracker (status: live | paused | done | idea; category: personal | oa | other).

At the bottom is the Flow Canvas — a flowchart builder. When asked to create a flowchart, output:
\`\`\`json
{"nodes":[{"id":"n1","x":40,"y":60,"label":"Step 1"}],"edges":[{"id":"e1","from":"n1","to":"n2"}],"texts":[]}
\`\`\`
ALWAYS lay out flowcharts horizontally — all nodes on the same y (y=60), x incrementing by 160px (n1: x=40, n2: x=200, n3: x=360, etc.). Never stack nodes vertically. Keep labels 2–4 words.

## Agent Actions — add content directly to the app
Emit one \`\`\`action block per item. When the user asks to populate a section, emit multiple action blocks (one per item) so they can apply all at once. Always confirm what you're adding before applying.

Add to News (company: Anthropic | Claude Code):
\`\`\`action
{"type":"releases:add","data":{"name":"","company":"Anthropic","releaseDate":"YYYY-MM-DD","description":"","link":""}}
\`\`\`

Add Nugget (News → Nuggets tab; free-form snippet, source optional):
\`\`\`action
{"type":"nuggets:add","data":{"text":"","source":""}}
\`\`\`

Add YouTube video:
\`\`\`action
{"type":"youtube:add-video","data":{"title":"","videoUrl":"https://youtube.com/watch?v=...","channelName":"","topic":""}}
\`\`\`

Add YouTube channel:
\`\`\`action
{"type":"youtube:add-channel","data":{"channelName":"","channelUrl":"https://youtube.com/@...","description":"","topics":[]}}
\`\`\`

Add Tool/Skill (category: writing | research | coding | analysis | image | audio | automation | other):
\`\`\`action
{"type":"skills:add","data":{"toolName":"","description":"","category":"coding","useCase":"","link":"","rating":0}}
\`\`\`

Add Dictionary Term (Tools → Wiki/Cmd sub-tab; prefix term with '/' for the /cmd tab. category: model | concept | technique | infrastructure | safety | data | general):
\`\`\`action
{"type":"dictionary:add","data":{"term":"","plainDefinition":"","category":"general"}}
\`\`\`

Add Tip (Tools → Tips sub-tab):
\`\`\`action
{"type":"tips:add","data":{"text":""}}
\`\`\`

Add Resource (Tools → Resources tab; any URL worth saving):
\`\`\`action
{"type":"resources:add","data":{"name":"","url":"https://...","description":""}}
\`\`\`

Add Project (status: live | paused | done | idea; category: personal | oa | other):
\`\`\`action
{"type":"projects:add","data":{"name":"","description":"","status":"idea","category":"personal","link":""}}
\`\`\``;

async function streamMessage(
  apiKey: string,
  history: Array<{ role: Role; content: string }>,
  onChunk: (delta: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: history,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.delta?.text;
        if (typeof delta === 'string') onChunk(delta);
      } catch {}
    }
  }
}

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [apiKey, setApiKey] = useState<string>(() => ENV_KEY || localStorage.getItem(API_KEY_STORAGE) || '');
  const [keyInput, setKeyInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (apiKey) setTimeout(() => inputRef.current?.focus(), 0); }, [apiKey]);

  const saveKey = () => {
    // Strip ALL whitespace (including middle), curly quotes, and surrounding quote chars
    const k = keyInput.replace(/\s+/g, '').replace(/[\u201C\u201D\u2018\u2019]/g, '').replace(/^["']|["']$/g, '');
    if (!k) return;
    if (!k.startsWith('sk-ant-')) {
      setError(`Key should start with "sk-ant-". Got: "${k.slice(0, 10)}..."`);
      return;
    }
    localStorage.setItem(API_KEY_STORAGE, k);
    setApiKey(k);
    setKeyInput('');
    setError(null);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);

    const userMsg: Message = { id: uid(), role: 'user', text };
    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', text: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    const history = [
      ...messages.map(m => ({ role: m.role, content: m.text })),
      { role: 'user' as Role, content: text },
    ];

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamMessage(
        apiKey,
        history,
        (delta) => {
          setMessages(prev =>
            prev.map(m => m.id === assistantId ? { ...m, text: m.text + delta } : m)
          );
        },
        ctrl.signal,
      );
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const msg = (err as Error)?.message || 'Unknown error';
        setError(msg);
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, messages, apiKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === 'Escape') onClose();
  };

  const clearKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setMessages([]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 400,
        height: 560,
        background: 'var(--ink-800)',
        border: '1px solid var(--signal-orange)',
        boxShadow: 'var(--shadow-lift)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        background: 'var(--ink-700)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--signal-orange)' }}>
            RMX.AI
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>
            {MODEL}
          </span>
          {loading && <span className="blink" style={{ color: 'var(--signal-amber)', fontSize: 8, lineHeight: 1 }}>●</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {apiKey && !ENV_KEY && (
            <button className="btn btn-ghost" style={{ fontSize: 9, padding: '2px 8px' }} onClick={clearKey} title="Change API key">
              Key
            </button>
          )}
          <button className="btn-icon" style={{ fontSize: 16, opacity: 0.6 }} onClick={onClose} aria-label="Close">×</button>
        </div>
      </div>

      {/* API key setup */}
      {!apiKey ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center', margin: 0 }}>
            Enter your Anthropic API key to start chatting.
          </p>
          <input
            className="input"
            type="password"
            placeholder="sk-ant-..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveKey(); }}
            autoFocus
            style={{ width: '100%' }}
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveKey}>
            Connect
          </button>
          {error && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--signal-red)', textAlign: 'center', margin: 0 }}>{error}</p>
          )}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', textAlign: 'center', margin: 0, letterSpacing: '0.06em' }}>
            STORED IN LOCALSTORAGE · NEVER TRANSMITTED ELSEWHERE
          </p>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-dim)', margin: 'auto', textAlign: 'center' }}>
                Ask anything.
              </p>
            )}
            {messages.map(m => (
              <div key={m.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 2,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {m.role === 'user' ? 'You' : 'RMX.AI'}
                </span>
                <div style={{
                  maxWidth: '88%',
                  padding: '8px 12px',
                  background: m.role === 'user' ? 'var(--ink-600)' : 'var(--ink-700)',
                  border: `1px solid ${m.role === 'user' ? 'var(--border-strong)' : 'var(--border)'}`,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--fg)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {m.role === 'assistant' && !loading
                    ? renderText(m.text)
                    : m.text || (loading && m.role === 'assistant' ? <span className="blink" style={{ color: 'var(--fg-dim)' }}>▌</span> : '')}
                </div>
                {m.role === 'assistant' && !loading && (() => {
                  const flow = extractFlowChart(m.text);
                  if (!flow) return null;
                  return (
                    <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px', marginTop: 2 }}
                      onClick={() => injectFlowChart(flow)}>
                      → Load to Flow
                    </button>
                  );
                })()}
              </div>
            ))}
            {error && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--signal-red)', margin: 0 }}>{error}</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', flexShrink: 0, display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              className="input"
              placeholder="Message RMX.AI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
            />
            <button
              className="btn btn-primary"
              style={{ fontSize: 10, padding: '5px 12px', flexShrink: 0 }}
              onClick={send}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
