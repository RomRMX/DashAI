export interface GuideStep {
  id: string;
  order: number;
  title: string;
  content: string;
}

export interface TeachingGuide {
  id: string;
  title: string;
  description: string;
  audience: string;
  tags: string[];
  steps: GuideStep[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
