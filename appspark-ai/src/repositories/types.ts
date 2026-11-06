import type { GeneratedIdea, GeneratedPrompt, Project, ProjectStatus, PromptOptions, SavedIdea } from '@/data/types';

export interface SavedIdeasRepository {
  list(): Promise<SavedIdea[]>;
  add(ideaId: string): Promise<void>;
  remove(ideaId: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ProjectInput {
  ideaId: string | null;
  name: string;
  description?: string;
  notes?: string;
  status?: ProjectStatus;
}

export interface ProjectsRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  create(input: ProjectInput): Promise<Project>;
  update(id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface PromptInput {
  ideaId: string;
  title: string;
  options: PromptOptions;
  content: string;
}

export interface PromptsRepository {
  list(ideaId?: string): Promise<GeneratedPrompt[]>;
  get(id: string): Promise<GeneratedPrompt | null>;
  create(input: PromptInput): Promise<GeneratedPrompt>;
  update(id: string, patch: Partial<Pick<GeneratedPrompt, 'title' | 'content' | 'options'>>): Promise<GeneratedPrompt>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface GeneratedIdeasRepository {
  list(): Promise<GeneratedIdea[]>;
  get(id: string): Promise<GeneratedIdea | null>;
  saveMany(items: GeneratedIdea[]): Promise<void>;
  clear(): Promise<void>;
}

export type RepositoryKind = 'local' | 'cloud';

export interface Repositories {
  kind: RepositoryKind;
  /** User id for cloud repositories, "local" otherwise. Part of every query key. */
  scope: string;
  savedIdeas: SavedIdeasRepository;
  projects: ProjectsRepository;
  prompts: PromptsRepository;
  generatedIdeas: GeneratedIdeasRepository;
}
