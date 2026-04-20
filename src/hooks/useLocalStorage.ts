import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T[]) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const save = (newItems: T[]) => {
    setItems(newItems);
    try { localStorage.setItem(key, JSON.stringify(newItems)); } catch {}
  };

  return { items, save };
}
