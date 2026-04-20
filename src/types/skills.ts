export type SkillCategory =
  | 'writing' | 'research' | 'coding' | 'analysis'
  | 'image' | 'audio' | 'automation' | 'other';

export interface AISkill {
  id: string;
  toolName: string;
  description: string;
  category: SkillCategory;
  useCase: string;
  link?: string;
  rating: number;
  createdAt: string;
}

export interface AIConnector {
  id: string;
  name: string;
  description: string;
  integrationType: string;
  compatibleTools: string[];
  link?: string;
  createdAt: string;
}
