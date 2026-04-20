export type DictCategory =
  | 'model' | 'concept' | 'technique' | 'infrastructure'
  | 'safety' | 'data' | 'general';

export interface DictionaryTerm {
  id: string;
  term: string;
  plainDefinition: string;
  category: DictCategory;
  createdAt: string;
  updatedAt: string;
}
