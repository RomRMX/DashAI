import { useLocalStorage } from './useLocalStorage';
import type { AIRelease } from '../types/releases';
import { seedReleases } from '../lib/seed-data';
import { uid, now } from '../lib/utils';

const KEY = 'aitoolbox:releases';
const SEED_VERSION_KEY = 'aitoolbox:releases:seedVersion';
const SEED_VERSION = '2';

function getInitial(): AIRelease[] {
  try {
    const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
    const stored = localStorage.getItem(KEY);
    if (stored && storedVersion === SEED_VERSION) return JSON.parse(stored);
    if (stored && storedVersion !== SEED_VERSION) {
      const parsed: AIRelease[] = JSON.parse(stored);
      const existingLinks = new Set(parsed.map(r => (r.link || '').toLowerCase().replace(/\/$/, '')));
      const toAdd = seedReleases.filter(r => !existingLinks.has((r.link || '').toLowerCase().replace(/\/$/, '')));
      const merged = [...toAdd, ...parsed];
      localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {}
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  localStorage.setItem(KEY, JSON.stringify(seedReleases));
  return seedReleases;
}

export function useReleases() {
  const { items: releases, save } = useLocalStorage<AIRelease>(KEY, getInitial());

  const addRelease = (data: Omit<AIRelease, 'id' | 'createdAt' | 'updatedAt'>) => {
    save([{ ...data, id: uid(), createdAt: now(), updatedAt: now() }, ...releases]);
  };

  const updateRelease = (id: string, data: Partial<AIRelease>) => {
    save(releases.map(r => r.id === id ? { ...r, ...data, updatedAt: now() } : r));
  };

  const deleteRelease = (id: string) => {
    save(releases.filter(r => r.id !== id));
  };

  const mergeFromFeed = (incoming: AIRelease[]): number => {
    const existingLinks = new Set(
      releases.map(r => r.link ? r.link.toLowerCase().replace(/\/$/, '') : '').filter(Boolean)
    );
    const genuinelyNew = incoming.filter(r => {
      const key = r.link ? r.link.toLowerCase().replace(/\/$/, '') : '';
      return key && !existingLinks.has(key);
    });
    if (genuinelyNew.length === 0) return 0;
    save([...genuinelyNew, ...releases]);
    return genuinelyNew.length;
  };

  return { releases, addRelease, updateRelease, deleteRelease, mergeFromFeed };
}
