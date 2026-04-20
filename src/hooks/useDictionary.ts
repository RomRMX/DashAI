import { useLocalStorage } from './useLocalStorage';
import type { DictionaryTerm, DictCategory } from '../types/dictionary';
import { seedTerms } from '../lib/seed-data';
import { uid, now } from '../lib/utils';

const KEY = 'aitoolbox:dictionary';

function getInitial(): DictionaryTerm[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const existing: DictionaryTerm[] = JSON.parse(stored);
      const existingKeys = new Set(existing.map(t => t.term.toLowerCase()));
      const newSeeds = seedTerms.filter(s => !existingKeys.has(s.term.toLowerCase()));
      if (newSeeds.length === 0) return existing;
      const merged = [...existing, ...newSeeds];
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {}
  return seedTerms;
}

export function useDictionary() {
  const { items: terms, save } = useLocalStorage<DictionaryTerm>(KEY, getInitial());

  const addTerm = (data: Omit<DictionaryTerm, 'id' | 'createdAt' | 'updatedAt'>) => {
    save([...terms, { ...data, id: uid(), createdAt: now(), updatedAt: now() }]);
  };
  const updateTerm = (id: string, data: Partial<DictionaryTerm>) => {
    save(terms.map(t => t.id === id ? { ...t, ...data, updatedAt: now() } : t));
  };
  const deleteTerm = (id: string) => save(terms.filter(t => t.id !== id));

  const search = (query: string): DictionaryTerm[] => {
    if (!query.trim()) return [...terms].sort((a, b) => a.term.localeCompare(b.term));
    const q = query.toLowerCase();
    return terms.filter(t =>
      t.term.toLowerCase().includes(q) ||
      t.plainDefinition.toLowerCase().includes(q)
    ).sort((a, b) => a.term.localeCompare(b.term));
  };

  const filterByCategory = (cat: DictCategory | 'all'): DictionaryTerm[] => {
    const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term));
    return cat === 'all' ? sorted : sorted.filter(t => t.category === cat);
  };

  return { terms, addTerm, updateTerm, deleteTerm, search, filterByCategory };
}
