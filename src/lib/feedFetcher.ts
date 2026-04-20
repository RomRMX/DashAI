import type { AIRelease } from '../types/releases';
import type { YouTubeChannel, YouTubeVideo } from '../types/youtube';
import { uid, now } from './utils';

// ─── RSS / Release feeds ────────────────────────────────────────────────────

const RSS2JSON = 'https://api.rss2json.com/v1/api.json';

export interface FeedSource {
  company: string;
  url: string;
}

export const RELEASE_FEEDS: FeedSource[] = [
  { company: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
  { company: 'OpenAI',    url: 'https://openai.com/blog/rss.xml' },
  { company: 'Google',    url: 'https://deepmind.google/blog/rss/' },
];

interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  description: string;
  content: string;
}

interface Rss2JsonResponse {
  status: 'ok' | 'error';
  items: Rss2JsonItem[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeLink(link: string): string {
  return link.toLowerCase().replace(/\/$/, '');
}

async function fetchRssFeed(feedUrl: string, count = 20): Promise<Rss2JsonItem[]> {
  try {
    const res = await fetch(`${RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}&count=${count}`);
    if (!res.ok) return [];
    const data: Rss2JsonResponse = await res.json();
    if (data.status !== 'ok') return [];
    return data.items ?? [];
  } catch {
    return [];
  }
}

function normalizeRssItem(item: Rss2JsonItem, company: string, existingLinks: Set<string>): AIRelease | null {
  if (!item.link) return null;
  const key = normalizeLink(item.link);
  if (existingLinks.has(key)) return null;

  let releaseDate = '';
  try {
    const d = new Date(item.pubDate);
    if (!isNaN(d.getTime())) releaseDate = d.toISOString().slice(0, 10);
  } catch {}
  if (!releaseDate) releaseDate = now().slice(0, 10);

  const raw = item.content || item.description || '';
  const description = stripHtml(raw).slice(0, 280);

  return {
    id: uid(),
    name: (item.title || '').trim().slice(0, 120),
    company,
    releaseDate,
    description,
    tags: [],
    link: item.link,
    createdAt: now(),
    updatedAt: now(),
  };
}

export async function fetchNewReleases(existing: AIRelease[]): Promise<AIRelease[]> {
  const existingLinks = new Set(
    existing.map(r => r.link ? normalizeLink(r.link) : '').filter(Boolean)
  );

  const results = await Promise.allSettled(
    RELEASE_FEEDS.map(async ({ company, url }) => {
      const items = await fetchRssFeed(url);
      return items
        .map(item => normalizeRssItem(item, company, existingLinks))
        .filter((r): r is AIRelease => r !== null);
    })
  );

  const all: AIRelease[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') all.push(...result.value);
  }

  return all.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

// ─── YouTube ────────────────────────────────────────────────────────────────

const CORS_PROXY = 'https://corsproxy.io/?url=';
const YT_ATOM_BASE = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

export function extractChannelId(channelUrl: string): string | null {
  const m = channelUrl.match(/\/channel\/(UC[A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function fetchOembedMeta(videoUrl: string): Promise<{ title: string; channelName: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
    if (!res.ok) return null;
    const d = await res.json();
    return { title: d.title || videoUrl, channelName: d.author_name || '' };
  } catch {
    return null;
  }
}

export async function refreshVideoMetadata(
  videos: YouTubeVideo[]
): Promise<Map<string, { title: string; channelName: string }>> {
  const result = new Map<string, { title: string; channelName: string }>();
  if (videos.length === 0) return result;

  const BATCH = 5;
  for (let i = 0; i < videos.length; i += BATCH) {
    const batch = videos.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(v => fetchOembedMeta(v.videoUrl).then(meta => ({ id: v.id, meta })))
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value.meta) {
        result.set(r.value.id, r.value.meta);
      }
    }
  }
  return result;
}

export async function fetchChannelVideos(
  channel: YouTubeChannel,
  existingUrls: Set<string>
): Promise<Array<Omit<YouTubeVideo, 'id' | 'createdAt'>>> {
  const channelId = extractChannelId(channel.channelUrl);
  if (!channelId) return [];

  try {
    const atomUrl = YT_ATOM_BASE + channelId;
    const res = await fetch(CORS_PROXY + encodeURIComponent(atomUrl));
    if (!res.ok) return [];
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');

    const entries = Array.from(doc.querySelectorAll('entry')).slice(0, 15);
    const newVideos: Array<Omit<YouTubeVideo, 'id' | 'createdAt'>> = [];

    for (const entry of entries) {
      const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent?.trim();
      const title = entry.querySelector('title')?.textContent?.trim();
      if (!videoId || !title) continue;

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      if (existingUrls.has(videoUrl.toLowerCase())) continue;

      newVideos.push({
        title,
        videoUrl,
        channelName: channel.channelName,
        topic: channel.topics[0] || 'Uncategorized',
        watchedAt: undefined,
      });
    }

    return newVideos;
  } catch (err) {
    console.warn('[feedFetcher] fetchChannelVideos failed:', err);
    return [];
  }
}
