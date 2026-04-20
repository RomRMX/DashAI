import { useLocalStorage } from './useLocalStorage';
import type { TeachingGuide, GuideStep } from '../types/guides';
import { uid, now } from '../lib/utils';

export function useGuides() {
  const { items: guides, save } = useLocalStorage<TeachingGuide>('aitoolbox:guides', []);

  const addGuide = (data: Omit<TeachingGuide, 'id' | 'steps' | 'createdAt' | 'updatedAt'>) => {
    save([...guides, { ...data, id: uid(), steps: [], createdAt: now(), updatedAt: now() }]);
  };
  const updateGuide = (id: string, data: Partial<TeachingGuide>) => {
    save(guides.map(g => g.id === id ? { ...g, ...data, updatedAt: now() } : g));
  };
  const deleteGuide = (id: string) => save(guides.filter(g => g.id !== id));

  const addStep = (guideId: string, step: Omit<GuideStep, 'id' | 'order'>) => {
    save(guides.map(g => {
      if (g.id !== guideId) return g;
      const newStep: GuideStep = { ...step, id: uid(), order: g.steps.length };
      return { ...g, steps: [...g.steps, newStep], updatedAt: now() };
    }));
  };
  const updateStep = (guideId: string, stepId: string, data: Partial<GuideStep>) => {
    save(guides.map(g => {
      if (g.id !== guideId) return g;
      return { ...g, steps: g.steps.map(s => s.id === stepId ? { ...s, ...data } : s), updatedAt: now() };
    }));
  };
  const deleteStep = (guideId: string, stepId: string) => {
    save(guides.map(g => {
      if (g.id !== guideId) return g;
      const steps = g.steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i }));
      return { ...g, steps, updatedAt: now() };
    }));
  };
  const reorderSteps = (guideId: string, orderedIds: string[]) => {
    save(guides.map(g => {
      if (g.id !== guideId) return g;
      const map = Object.fromEntries(g.steps.map(s => [s.id, s]));
      const steps = orderedIds.map((id, i) => ({ ...map[id], order: i }));
      return { ...g, steps, updatedAt: now() };
    }));
  };

  return { guides, addGuide, updateGuide, deleteGuide, addStep, updateStep, deleteStep, reorderSteps };
}
