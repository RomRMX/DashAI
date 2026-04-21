import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AISkill, AIConnector } from '../types/skills';
import { uid, now } from '../lib/utils';

const SEED_KEY = 'aitoolbox:skills:version';
const SEED_VERSION = '1';

export function useSkills() {
  const { items: skills, save: saveSkills } = useLocalStorage<AISkill>('aitoolbox:skills', []);
  const { items: connectors, save: saveConnectors } = useLocalStorage<AIConnector>('aitoolbox:connectors', []);
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return;
    saveSkills([]);
    saveConnectors([]);
    localStorage.setItem(SEED_KEY, SEED_VERSION);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSkill = (data: Omit<AISkill, 'id' | 'createdAt'>) => {
    saveSkills([{ ...data, id: uid(), createdAt: now() }, ...skills]);
  };
  const updateSkill = (id: string, data: Partial<AISkill>) => {
    saveSkills(skills.map(s => s.id === id ? { ...s, ...data } : s));
  };
  const deleteSkill = (id: string) => saveSkills(skills.filter(s => s.id !== id));
  const setRating = (id: string, rating: number) => {
    saveSkills(skills.map(s => s.id === id ? { ...s, rating } : s));
  };

  const addConnector = (data: Omit<AIConnector, 'id' | 'createdAt'>) => {
    saveConnectors([{ ...data, id: uid(), createdAt: now() }, ...connectors]);
  };
  const updateConnector = (id: string, data: Partial<AIConnector>) => {
    saveConnectors(connectors.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const deleteConnector = (id: string) => saveConnectors(connectors.filter(c => c.id !== id));

  return { skills, connectors, addSkill, updateSkill, deleteSkill, setRating, addConnector, updateConnector, deleteConnector };
}
