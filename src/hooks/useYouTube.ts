import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { YouTubeChannel, YouTubeVideo } from '../types/youtube';
import { uid, now } from '../lib/utils';

const SEED_KEY = 'aitoolbox:channels:version';
const SEED_VERSION = '1';

const SEED_CHANNELS: Array<Omit<YouTubeChannel, 'id' | 'createdAt'>> = [
  { channelName: 'Andrej Karpathy', channelUrl: 'https://www.youtube.com/channel/UCbfYPyITQ-7l4upoX8nvctg', description: 'Deep learning, neural nets, and LLMs from the former Tesla AI director.', topics: ['ML', 'LLM'] },
  { channelName: 'Lex Fridman', channelUrl: 'https://www.youtube.com/channel/UCSHZKyawb77ixDdsGog4iWA', description: 'Long-form interviews with AI researchers, scientists, and founders.', topics: ['AI', 'Research'] },
  { channelName: 'Two Minute Papers', channelUrl: 'https://www.youtube.com/channel/UCbmNph6atAoGfqLoCL_duAg', description: 'Fast, accessible summaries of the latest AI and ML research papers.', topics: ['Research', 'Papers'] },
  { channelName: 'Fireship', channelUrl: 'https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA', description: 'High-intensity code tutorials and AI tool breakdowns for developers.', topics: ['Coding', 'Tools'] },
  { channelName: '3Blue1Brown', channelUrl: 'https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAg', description: 'Visual math — neural networks, transformers, and linear algebra explained beautifully.', topics: ['ML', 'Math'] },
  { channelName: 'Yannic Kilcher', channelUrl: 'https://www.youtube.com/channel/UCZHmQk67mSJgfCCTn7xBfew', description: 'Deep dives into ML research papers, models, and AI community news.', topics: ['Research', 'Papers'] },
  { channelName: 'Anthropic', channelUrl: 'https://www.youtube.com/@anthropic-ai', description: 'Official Anthropic channel — Claude demos, AI safety research, and team talks.', topics: ['AI Safety', 'Claude'] },
  { channelName: 'AI Explained', channelUrl: 'https://www.youtube.com/@aiexplained-official', description: 'Clear explainers on AI breakthroughs and their real-world implications.', topics: ['AI', 'News'] },
  { channelName: 'Matt Wolfe', channelUrl: 'https://www.youtube.com/@mreflow', description: 'Future Tools — AI news, product reviews, and no-code AI workflows.', topics: ['Tools', 'News'] },
  { channelName: 'Sam Witteveen', channelUrl: 'https://www.youtube.com/@samwitteveenai', description: 'Practical LLM tutorials — RAG, agents, prompting, and the Google AI stack.', topics: ['LLM', 'Coding'] },
];

export function useYouTube() {
  const { items: channels, save: saveChannels } = useLocalStorage<YouTubeChannel>('aitoolbox:channels', []);
  const { items: videos, save: saveVideos } = useLocalStorage<YouTubeVideo>('aitoolbox:videos', []);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (localStorage.getItem(SEED_KEY)) return;
    const existing = localStorage.getItem('aitoolbox:channels');
    if (existing) {
      try {
        const arr = JSON.parse(existing);
        if (Array.isArray(arr) && arr.length > 0) {
          localStorage.setItem(SEED_KEY, SEED_VERSION);
          return;
        }
      } catch {}
    }
    const seeded = SEED_CHANNELS.map(c => ({ ...c, id: uid(), createdAt: now() }));
    saveChannels(seeded);
    localStorage.setItem(SEED_KEY, SEED_VERSION);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChannel = (data: Omit<YouTubeChannel, 'id' | 'createdAt'>) => {
    saveChannels([{ ...data, id: uid(), createdAt: now() }, ...channels]);
  };
  const updateChannel = (id: string, data: Partial<YouTubeChannel>) => {
    saveChannels(channels.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const deleteChannel = (id: string) => saveChannels(channels.filter(c => c.id !== id));

  const addVideo = (data: Omit<YouTubeVideo, 'id' | 'createdAt'>) => {
    saveVideos([{ ...data, id: uid(), createdAt: now() }, ...videos]);
  };
  const updateVideo = (id: string, data: Partial<YouTubeVideo>) => {
    saveVideos(videos.map(v => v.id === id ? { ...v, ...data } : v));
  };
  const deleteVideo = (id: string) => saveVideos(videos.filter(v => v.id !== id));
  const markWatched = (id: string) => {
    saveVideos(videos.map(v => v.id === id ? { ...v, watchedAt: now() } : v));
  };

  const getVideosByTopic = (): Record<string, YouTubeVideo[]> => {
    return videos.reduce<Record<string, YouTubeVideo[]>>((acc, v) => {
      const t = v.topic || 'Uncategorized';
      if (!acc[t]) acc[t] = [];
      acc[t].push(v);
      return acc;
    }, {});
  };

  const bulkAddVideos = (items: Array<Omit<YouTubeVideo, 'id' | 'createdAt'>>) => {
    const toAdd = items.map(v => ({ ...v, id: uid(), createdAt: now() }));
    saveVideos([...toAdd, ...videos]);
  };

  return { channels, videos, addChannel, updateChannel, deleteChannel, addVideo, updateVideo, deleteVideo, markWatched, getVideosByTopic, bulkAddVideos };
}
