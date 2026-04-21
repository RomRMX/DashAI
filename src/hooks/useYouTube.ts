import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { YouTubeChannel, YouTubeVideo } from '../types/youtube';
import { uid, now } from '../lib/utils';

const SEED_KEY = 'aitoolbox:channels:version';
const SEED_VERSION = '2';

export function useYouTube() {
  const { items: channels, save: saveChannels } = useLocalStorage<YouTubeChannel>('aitoolbox:channels', []);
  const { items: videos, save: saveVideos } = useLocalStorage<YouTubeVideo>('aitoolbox:videos', []);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return;
    saveChannels([]);
    saveVideos([]);
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
