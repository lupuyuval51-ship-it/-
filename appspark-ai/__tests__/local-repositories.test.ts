import AsyncStorage from '@react-native-async-storage/async-storage';

import { ideas } from '@/data/seed/ai';

import { defaultPromptOptions } from '@/features/prompt/engine';
import { createLocalRepositories } from '@/repositories/local';

describe('local repositories', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists saved ideas across instances', async () => {
    const first = createLocalRepositories();
    await first.savedIdeas.add('rehearse');
    await first.savedIdeas.add('rehearse'); // idempotent
    const second = createLocalRepositories();
    expect((await second.savedIdeas.list()).map((s) => s.ideaId)).toEqual(['rehearse']);
    await second.savedIdeas.remove('rehearse');
    expect(await createLocalRepositories().savedIdeas.list()).toEqual([]);
  });

  it('creates, updates and deletes projects', async () => {
    const repos = createLocalRepositories();
    const project = await repos.projects.create({ ideaId: 'rehearse', name: '  My app  ', description: 'd' });
    expect(project.name).toBe('My app');
    expect(project.status).toBe('saved');
    const updated = await repos.projects.update(project.id, { status: 'launched', notes: 'done' });
    expect(updated.status).toBe('launched');
    expect(updated.updatedAt >= project.updatedAt).toBe(true);
    expect((await repos.projects.get(project.id))?.notes).toBe('done');
    await repos.projects.remove(project.id);
    expect(await repos.projects.list()).toEqual([]);
  });

  it('stores prompts per idea', async () => {
    const repos = createLocalRepositories();
    await repos.prompts.create({ ideaId: 'a', title: 'A', options: defaultPromptOptions, content: 'x' });
    await repos.prompts.create({ ideaId: 'b', title: 'B', options: defaultPromptOptions, content: 'y' });
    expect(await repos.prompts.list('a')).toHaveLength(1);
    expect(await repos.prompts.list()).toHaveLength(2);
  });

  it('keeps generated ideas bounded and de-duplicated', async () => {
    const repos = createLocalRepositories();
    const make = (id: string) => ({ id, idea: { ...ideas[0], id }, source: 'demo' as const, brief: 'b', createdAt: new Date(2026, 0, 1).toISOString() });
    await repos.generatedIdeas.saveMany([make('g1'), make('g2')]);
    await repos.generatedIdeas.saveMany([make('g2')]);
    expect(await repos.generatedIdeas.list()).toHaveLength(2);
    expect((await repos.generatedIdeas.get('g1'))?.idea.id).toBe('g1');
  });
});
