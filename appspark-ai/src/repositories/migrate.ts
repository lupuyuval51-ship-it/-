import AsyncStorage from '@react-native-async-storage/async-storage';

import { LOCAL_KEYS } from './local/collection';
import type { Repositories } from './types';

export interface LocalCounts {
  saved: number;
  projects: number;
  prompts: number;
  generated: number;
  total: number;
}

export async function countLocalItems(local: Repositories): Promise<LocalCounts> {
  const [saved, projects, prompts, generated] = await Promise.all([
    local.savedIdeas.list(),
    local.projects.list(),
    local.prompts.list(),
    local.generatedIdeas.list(),
  ]);
  return { saved: saved.length, projects: projects.length, prompts: prompts.length, generated: generated.length, total: saved.length + projects.length + prompts.length + generated.length };
}

export async function wasMigrated(userId: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(LOCAL_KEYS.migratedAt);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Boolean(parsed[userId]);
  } catch {
    return false;
  }
}

async function markMigrated(userId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(LOCAL_KEYS.migratedAt);
  let parsed: Record<string, string> = {};
  try {
    parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    parsed = {};
  }
  parsed[userId] = new Date().toISOString();
  await AsyncStorage.setItem(LOCAL_KEYS.migratedAt, JSON.stringify(parsed));
}

/**
 * Copies everything stored on the device into the signed-in user's cloud
 * account. Local data is kept (so guest mode still works) and the migration is
 * recorded per user so the prompt is shown once.
 */
export async function migrateLocalToCloud(local: Repositories, cloud: Repositories, userId: string): Promise<LocalCounts> {
  const [saved, projects, prompts, generated] = await Promise.all([
    local.savedIdeas.list(),
    local.projects.list(),
    local.prompts.list(),
    local.generatedIdeas.list(),
  ]);

  // Generated ideas first so saved/projects that reference them resolve.
  await cloud.generatedIdeas.saveMany(generated);
  for (const item of saved) await cloud.savedIdeas.add(item.ideaId);
  for (const project of projects) {
    await cloud.projects.create({ ideaId: project.ideaId, name: project.name, description: project.description, notes: project.notes, status: project.status });
  }
  for (const prompt of prompts) {
    await cloud.prompts.create({ ideaId: prompt.ideaId, title: prompt.title, options: prompt.options, content: prompt.content });
  }
  await markMigrated(userId);
  return { saved: saved.length, projects: projects.length, prompts: prompts.length, generated: generated.length, total: saved.length + projects.length + prompts.length + generated.length };
}
