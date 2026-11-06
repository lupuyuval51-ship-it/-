import type { GeneratedIdea, GeneratedPrompt, Project, SavedIdea } from '@/data/types';
import { createId, nowIso } from '@/lib/ids';

import type { GeneratedIdeasRepository, ProjectsRepository, PromptsRepository, Repositories, SavedIdeasRepository } from '../types';
import { LOCAL_KEYS, LocalCollection } from './collection';

export function createLocalRepositories(): Repositories {
  const saved = new LocalCollection<SavedIdea>(LOCAL_KEYS.savedIdeas);
  const projects = new LocalCollection<Project>(LOCAL_KEYS.projects);
  const prompts = new LocalCollection<GeneratedPrompt>(LOCAL_KEYS.prompts);
  const generated = new LocalCollection<GeneratedIdea>(LOCAL_KEYS.generatedIdeas);

  const savedIdeas: SavedIdeasRepository = {
    async list() {
      const items = await saved.read();
      return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async add(ideaId) {
      const items = await saved.read();
      if (items.some((s) => s.ideaId === ideaId)) return;
      await saved.write([...items, { ideaId, createdAt: nowIso() }]);
    },
    async remove(ideaId) {
      const items = await saved.read();
      await saved.write(items.filter((s) => s.ideaId !== ideaId));
    },
    clear: () => saved.clear(),
  };

  const projectsRepo: ProjectsRepository = {
    async list() {
      const items = await projects.read();
      return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async get(id) {
      return (await projects.read()).find((p) => p.id === id) ?? null;
    },
    async create(input) {
      const now = nowIso();
      const project: Project = {
        id: createId('prj'),
        ideaId: input.ideaId,
        name: input.name.trim(),
        description: input.description?.trim() ?? '',
        notes: input.notes ?? '',
        status: input.status ?? 'saved',
        createdAt: now,
        updatedAt: now,
      };
      await projects.write([...(await projects.read()), project]);
      return project;
    },
    async update(id, patch) {
      const items = await projects.read();
      const index = items.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Project not found');
      const updated: Project = { ...items[index], ...patch, id, createdAt: items[index].createdAt, updatedAt: nowIso() };
      const next = [...items];
      next[index] = updated;
      await projects.write(next);
      return updated;
    },
    async remove(id) {
      await projects.write((await projects.read()).filter((p) => p.id !== id));
    },
    clear: () => projects.clear(),
  };

  const promptsRepo: PromptsRepository = {
    async list(ideaId) {
      const items = await prompts.read();
      const filtered = ideaId ? items.filter((p) => p.ideaId === ideaId) : items;
      return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async get(id) {
      return (await prompts.read()).find((p) => p.id === id) ?? null;
    },
    async create(input) {
      const now = nowIso();
      const prompt: GeneratedPrompt = { id: createId('prm'), ...input, title: input.title.trim(), createdAt: now, updatedAt: now };
      await prompts.write([...(await prompts.read()), prompt]);
      return prompt;
    },
    async update(id, patch) {
      const items = await prompts.read();
      const index = items.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Prompt not found');
      const updated: GeneratedPrompt = { ...items[index], ...patch, id, updatedAt: nowIso() };
      const next = [...items];
      next[index] = updated;
      await prompts.write(next);
      return updated;
    },
    async remove(id) {
      await prompts.write((await prompts.read()).filter((p) => p.id !== id));
    },
    clear: () => prompts.clear(),
  };

  const generatedRepo: GeneratedIdeasRepository = {
    async list() {
      const items = await generated.read();
      return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async get(id) {
      return (await generated.read()).find((g) => g.id === id) ?? null;
    },
    async saveMany(newItems) {
      const items = await generated.read();
      const ids = new Set(newItems.map((i) => i.id));
      // Keep the newest 60 so storage does not grow without bound.
      await generated.write([...items.filter((i) => !ids.has(i.id)), ...newItems].slice(-60));
    },
    clear: () => generated.clear(),
  };

  return { kind: 'local', scope: 'local', savedIdeas, projects: projectsRepo, prompts: promptsRepo, generatedIdeas: generatedRepo };
}
