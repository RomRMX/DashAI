import { useState, useCallback, useEffect, useRef } from 'react';
import { useYouTube } from '../hooks/useYouTube';
import { useFeedPolling } from '../hooks/useFeedPolling';
import { fetchOembedMeta, fetchChannelVideos, refreshVideoMetadata } from '../lib/feedFetcher';
import type { YouTubeChannel, YouTubeVideo } from '../types/youtube';
import EmptyState from '../components/ui/EmptyState';

type Tab = 'videos' | 'channels';

function isYouTubeUrl(url: string) {
  return /youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(url);
}

function ensureProtocol(url: string): string { return /^https?:\/\//.test(url) ? url : 'https://' + url; }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}


function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{ display: 'inline-flex', gap: 2, lineHeight: 1 }}
    >
      {[1, 2, 3].map(n => {
        const filled = n <= value;
        return (
          <button
            key={n}
            onClick={e => { e.stopPropagation(); onChange(value === n ? 0 : n); }}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: filled ? 'var(--signal-amber)' : 'var(--ash-500)',
              fontSize: 14, lineHeight: 1,
            }}
          >{filled ? '★' : '☆'}</button>
        );
      })}
    </div>
  );
}

function VideoCard({ video, onEdit, onDelete, onWatch, onRate, editMode }: { video: YouTubeVideo; onEdit: () => void; onDelete: () => void; onWatch: () => void; onRate: (n: number) => void; editMode: boolean }) {
  const handleCardClick = () => {
    window.open(video.videoUrl, '_blank', 'noreferrer');
    if (!video.watchedAt) onWatch();
  };
  const vid = extractVideoId(video.videoUrl);
  const thumbUrl = vid ? `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` : null;
  return (
    <div
      className="row"
      onClick={handleCardClick}
      style={{
        position: 'relative',
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        opacity: video.watchedAt ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div style={{ flexShrink: 0, width: 96, height: 56, background: 'var(--ink-800)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {thumbUrl
            ? <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--fg-dim)' }}>▶</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)', lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.channelName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {video.watchedAt && <span className="stencil" style={{ fontSize: 9, flexShrink: 0 }}>Watched</span>}
            <StarRating value={video.rating || 0} onChange={onRate} />
            {editMode && (
              <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
                <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
                <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5, margin: 0 }}>{video.title}</p>
      {video.notes && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ash-400)', fontStyle: 'italic', margin: 0 }}>{video.notes}</p>}
    </div>
  );
}

function ChannelCard({ channel, onEdit, onDelete, onRate, editMode }: { channel: YouTubeChannel; onEdit: () => void; onDelete: () => void; onRate: (n: number) => void; editMode: boolean; }) {
  const handleCardClick = () => window.open(channel.channelUrl, '_blank', 'noreferrer');
  const initial = channel.channelName.trim().charAt(0).toUpperCase();
  return (
    <div
      className="row"
      onClick={handleCardClick}
      style={{
        position: 'relative',
        padding: '14px 14px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flexShrink: 0, width: 32, height: 32, background: 'var(--ink-800)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--fg-dim)', letterSpacing: '0.04em' }}>{initial}</div>
      <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{channel.channelName}</h2>
      <StarRating value={channel.rating || 0} onChange={onRate} />
      {editMode && (
        <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(); }} aria-label="Edit" style={{ fontSize: 14, opacity: 0.5, minWidth: 20, minHeight: 20, padding: 2 }}>✎</button>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} aria-label="Delete" style={{ fontSize: 14, opacity: 0.5, color: 'var(--signal-red)', minWidth: 20, minHeight: 20, padding: 2 }}>×</button>
        </div>
      )}
    </div>
  );
}

function VideoEditDialog({ initial, onSave, onClose }: { initial: YouTubeVideo; onSave: (d: Omit<YouTubeVideo, 'id' | 'createdAt'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: initial.title, videoUrl: initial.videoUrl, channelName: initial.channelName, topic: initial.topic, notes: initial.notes || '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title: form.title.trim(), videoUrl: form.videoUrl.trim(), channelName: form.channelName.trim(), topic: form.topic.trim() || 'Uncategorized', notes: form.notes.trim() || undefined, watchedAt: initial.watchedAt });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Edit Video</div>
        <div className="form-group"><label className="form-label">Title</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">Channel</label><input className="input" value={form.channelName} onChange={e => set('channelName', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Topic</label><input className="input" value={form.topic} onChange={e => set('topic', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function ChannelEditDialog({ initial, onSave, onClose }: { initial: YouTubeChannel; onSave: (d: Omit<YouTubeChannel, 'id' | 'createdAt'>) => void; onClose: () => void }) {
  const [url, setUrl] = useState(initial.channelUrl);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const normalized = ensureProtocol(trimmed);
    const m = normalized.match(/@([^/?#\s]+)/);
    const channelName = initial.channelName || (m ? m[1] : normalized);
    onSave({ channelName, channelUrl: normalized, description: initial.description || '', topics: initial.topics || [] });
    onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <form onSubmit={submit} style={{ background: 'var(--ink-800)', border: '1px solid var(--border-strong)', padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--shadow-lift)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Edit Channel</div>
        <div className="form-group"><label className="form-label">Channel URL</label>
          <input className="input" autoFocus value={url} onChange={e => setUrl(e.target.value)} placeholder="https://youtube.com/@..." required />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function YouTubePage() {
  const { channels, videos, updateChannel, deleteChannel, updateVideo, deleteVideo, markWatched, addVideo, addChannel, bulkAddVideos } = useYouTube();
  const [tab, setTab] = useState<Tab>('videos');
  const [videoEditDialog, setVideoEditDialog] = useState<YouTubeVideo | null>(null);
  const [channelEditDialog, setChannelEditDialog] = useState<YouTubeChannel | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [displayNewCount, setDisplayNewCount] = useState(0);
  const [videoPasteInput, setVideoPasteInput] = useState('');
  const [videoPasteStatus, setVideoPasteStatus] = useState<'idle' | 'loading'>('idle');
  const [channelPasteInput, setChannelPasteInput] = useState('');
  const [videoAddOpen, setVideoAddOpen] = useState(false);
  const [channelAddOpen, setChannelAddOpen] = useState(false);
  const videoPasteRef = useRef<HTMLInputElement>(null);
  const channelPasteRef = useRef<HTMLInputElement>(null);

  const handleVideoPaste = async (url: string) => {
    const trimmed = url.trim();
    if (!isYouTubeUrl(trimmed)) return;
    const normalized = ensureProtocol(trimmed);
    setVideoPasteStatus('loading');
    const meta = await fetchOembedMeta(normalized);
    addVideo({ title: meta?.title || normalized, videoUrl: normalized, channelName: meta?.channelName || '', topic: 'Uncategorized', watchedAt: undefined });
    setVideoPasteInput('');
    setVideoPasteStatus('idle');
    setVideoAddOpen(false);
  };

  const handleChannelPaste = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const normalized = ensureProtocol(trimmed);
    const m = normalized.match(/@([^/?#\s]+)/);
    const channelName = m ? m[1] : normalized;
    addChannel({ channelName, channelUrl: normalized, description: '', topics: [] });
    setChannelPasteInput('');
    setChannelAddOpen(false);
  };

  const handleTabAdd = () => {
    if (tab === 'videos') {
      setVideoAddOpen(o => {
        const next = !o;
        if (next) setTimeout(() => videoPasteRef.current?.focus(), 0);
        return next;
      });
    } else {
      setChannelAddOpen(o => {
        const next = !o;
        if (next) setTimeout(() => channelPasteRef.current?.focus(), 0);
        return next;
      });
    }
  };

  const handleYouTubePoll = useCallback(async () => {
    // 1. Refresh metadata for existing videos
    const metaMap = await refreshVideoMetadata(videos);
    for (const [id, meta] of metaMap) {
      const v = videos.find(vid => vid.id === id);
      if (v && (v.title !== meta.title || v.channelName !== meta.channelName)) {
        updateVideo(id, meta);
      }
    }

    // 2. Fetch new videos from tracked channels
    const existingUrls = new Set(videos.map(v => v.videoUrl.toLowerCase()));
    const allNew: Array<Omit<YouTubeVideo, 'id' | 'createdAt'>> = [];
    for (const ch of channels) {
      const newVids = await fetchChannelVideos(ch, existingUrls);
      newVids.forEach(v => existingUrls.add(v.videoUrl.toLowerCase()));
      allNew.push(...newVids);
    }
    if (allNew.length > 0) bulkAddVideos(allNew);
    return allNew.length;
  }, [videos, channels, updateVideo, bulkAddVideos]);

  const { status, newCount } = useFeedPolling({
    key: 'aitoolbox:poll:youtube',
    onPoll: handleYouTubePoll,
  });

  // Show "N new" badge briefly after each successful poll
  useEffect(() => {
    if (newCount > 0) {
      setDisplayNewCount(newCount);
      const t = setTimeout(() => setDisplayNewCount(0), 60_000);
      return () => clearTimeout(t);
    }
  }, [newCount]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', background: 'var(--ink-700)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2 style={{ fontFamily: 'var(--font-category)', fontSize: 20, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
            YouTube
          </h2>
          {status === 'fetching' && (
            <span className="blink" style={{ color: 'var(--signal-amber)', fontSize: 8, lineHeight: 1 }}>●</span>
          )}
          {displayNewCount > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--signal-amber)', letterSpacing: '0.05em' }}>● {displayNewCount} new</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={editMode ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 9, padding: '3px 10px' }} onClick={() => setEditMode(e => !e)}>Edit</button>
          <button className="btn btn-primary" style={{ fontSize: 9, padding: '3px 10px' }} onClick={handleTabAdd}>Add</button>
        </div>
      </div>

      {/* Tab nav — folder tabs */}
      <div className="folder-tabs">
        {(['videos', 'channels'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`folder-tab${tab === t ? ' active' : ''}`}>
            {t === 'videos' ? 'Videos' : 'Channels'}
          </button>
        ))}
      </div>

      {tab === 'videos' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {videoAddOpen && (
            <input
              ref={videoPasteRef}
              className="input input-paste"
              placeholder="Paste a YouTube URL..."
              value={videoPasteInput}
              onChange={e => setVideoPasteInput(e.target.value)}
              onPaste={e => { const text = e.clipboardData.getData('text'); handleVideoPaste(text); e.preventDefault(); }}
              onKeyDown={e => { if (e.key === 'Enter') handleVideoPaste(videoPasteInput); if (e.key === 'Escape') setVideoAddOpen(false); }}
              style={{ opacity: videoPasteStatus === 'loading' ? 0.5 : 1, margin: '10px 14px 0' }}
              disabled={videoPasteStatus === 'loading'}
            />
          )}
          {videos.length === 0
            ? <EmptyState label="" />
            : (
              <div className="scroll-edge" style={{ overflow: 'auto' }}>
                {videos.map(v => <VideoCard key={v.id} video={v} onEdit={() => setVideoEditDialog(v)} onDelete={() => deleteVideo(v.id)} onWatch={() => markWatched(v.id)} onRate={n => updateVideo(v.id, { rating: n })} editMode={editMode} />)}
              </div>
            )
          }
        </div>
      )}

      {tab === 'channels' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {channelAddOpen && (
            <input
              ref={channelPasteRef}
              className="input input-paste"
              placeholder="Paste a YouTube channel URL..."
              value={channelPasteInput}
              onChange={e => setChannelPasteInput(e.target.value)}
              onPaste={e => { const text = e.clipboardData.getData('text'); handleChannelPaste(text); e.preventDefault(); }}
              onKeyDown={e => { if (e.key === 'Enter') handleChannelPaste(channelPasteInput); if (e.key === 'Escape') setChannelAddOpen(false); }}
              style={{ margin: '10px 14px 0' }}
            />
          )}
          {channels.length === 0
            ? null
            : (
              <div className="scroll-edge" style={{ overflow: 'auto' }}>
                {channels.map(c => <ChannelCard key={c.id} channel={c} onEdit={() => setChannelEditDialog(c)} onDelete={() => deleteChannel(c.id)} onRate={n => updateChannel(c.id, { rating: n })} editMode={editMode} />)}
              </div>
            )
          }
        </div>
      )}

      {videoEditDialog && (
        <VideoEditDialog
          initial={videoEditDialog}
          onSave={d => { updateVideo(videoEditDialog.id, d); setVideoEditDialog(null); }}
          onClose={() => setVideoEditDialog(null)}
        />
      )}
      {channelEditDialog && (
        <ChannelEditDialog
          initial={channelEditDialog}
          onSave={d => { updateChannel(channelEditDialog.id, d); setChannelEditDialog(null); }}
          onClose={() => setChannelEditDialog(null)}
        />
      )}
    </div>
  );
}
