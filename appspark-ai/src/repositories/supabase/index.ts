import type { SupabaseClient } from '@supabase/supabase-js';

import type { GeneratedIdea, GeneratedPrompt, Idea, Project, ProjectStatus, PromptOptions, SavedIdea } from '@/data/types';

import type { GeneratedIdeasRepository, ProjectsRepository, PromptsRepository, Repositories, SavedIdeasRepository } from '../types';

interface SavedRow {
  idea_id: string;
  created_at: string;
}

interface ProjectRow {
  id: string;
  idea_id: string | null;
  name: string;
  description: string | null;
  notes: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

interface PromptRow {
  id: string;
  idea_id: string;
  title: string;
  options: PromptOptions;
  content: string;
  created_at: string;
  updated_at: string;
}

interface GeneratedRow {
  id: string;
  source: 'ai' | 'demo';
  brief: string;
  idea: Idea;
  provider: string | null;
  model: string | null;
  created_at: string;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    ideaId: row.idea_id,
    name: row.name,
    description: row.description ?? '',
    notes: row.notes ?? '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPrompt(row: PromptRow): GeneratedPrompt {
  return {
    id: row.id,
    ideaId: row.idea_id,
    title: row.title,
    options: row.options,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGenerated(row: GeneratedRow): GeneratedIdea {
  return {
    id: row.id,
    idea: row.idea,
    source: row.source,
    brief: row.brief,
    provider: row.provider ?? undefined,
    model: row.model ?? undefined,
    createdAt: row.created_at,
  };
}

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** Cloud repositories backed by Supabase tables protected with per-user RLS. */
export function createSupabaseRepositories(client: SupabaseClient, userId: string): Repositories {
  const savedIdeas: SavedIdeasRepository = {
    async list() {
      const { data, error } = await client.from('saved_ideas').select('idea_id, created_at').order('created_at', { ascending: false });
      throwIf(error);
      return ((data ?? []) as SavedRow[]).map((row): SavedIdea => ({ ideaId: row.idea_id, createdAt: row.created_at }));
    },
    async add(ideaId) {
      const { error } = await client.from('saved_ideas').upsert({ user_id: userId, idea_id: ideaId }, { onConflict: 'user_id,idea_id', ignoreDuplicates: true });
      throwIf(error);
    },
    async remove(ideaId) {
      const { error } = await client.from('saved_ideas').delete().eq('idea_id', ideaId);
      throwIf(error);
    },
    async clear() {
      const { error } = await client.from('saved_ideas').delete().eq('user_id', userId);
      throwIf(error);
    },
  };

  const projects: ProjectsRepository = {
    async list() {
      const { data, error } = await client.from('projects').select('*').order('updated_at', { ascending: false });
      throwIf(error);
      return ((data ?? []) as ProjectRow[]).map(mapProject);
    },
    async get(id) {
      const { data, error } = await client.from('projects').select('*').eq('id', id).maybeSingle();
      throwIf(error);
      return data ? mapProject(data as ProjectRow) : null;
    },
    async create(input) {
      const { data, error } = await client
        .from('projects')
        .insert({
          user_id: userId,
          idea_id: input.ideaId,
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
          notes: input.notes ?? '',
          status: input.status ?? 'saved',
        })
        .select('*')
        .single();
      throwIf(error);
      return mapProject(data as ProjectRow);
    },
    async update(id, patch) {
      const row: Partial<ProjectRow> = { updated_at: new Date().toISOString() };
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.description !== undefined) row.description = patch.description;
      if (patch.notes !== undefined) row.notes = patch.notes;
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.ideaId !== undefined) row.idea_id = patch.ideaId;
      const { data, error } = await client.from('projects').update(row).eq('id', id).select('*').single();
      throwIf(error);
      return mapProject(data as ProjectRow);
    },
    async remove(id) {
      const { error } = await client.from('projects').delete().eq('id', id);
      throwIf(error);
    },
    async clear() {
      const { error } = await client.from('projects').delete().eq('user_id', userId);
      throwIf(error);
    },
  };

  const prompts: PromptsRepository = {
    async list(ideaId) {
      let query = client.from('generated_prompts').select('*').order('updated_at', { ascending: false });
      if (ideaId) query = query.eq('idea_id', ideaId);
      const { data, error } = await query;
      throwIf(error);
      return ((data ?? []) as PromptRow[]).map(mapPrompt);
    },
    async get(id) {
      const { data, error } = await client.from('generated_prompts').select('*').eq('id', id).maybeSingle();
      throwIf(error);
      return data ? mapPrompt(data as PromptRow) : null;
    },
    async create(input) {
      const { data, error } = await client
        .from('generated_prompts')
        .insert({ user_id: userId, idea_id: input.ideaId, title: input.title.trim(), options: input.options, content: input.content })
        .select('*')
        .single();
      throwIf(error);
      return mapPrompt(data as PromptRow);
    },
    async update(id, patch) {
      const { data, error } = await client
        .from('generated_prompts')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      throwIf(error);
      return mapPrompt(data as PromptRow);
    },
    async remove(id) {
      const { error } = await client.from('generated_prompts').delete().eq('id', id);
      throwIf(error);
    },
    async clear() {
      const { error } = await client.from('generated_prompts').delete().eq('user_id', userId);
      throwIf(error);
    },
  };

  const generatedIdeas: GeneratedIdeasRepository = {
    async list() {
      const { data, error } = await client.from('generated_ideas').select('*').order('created_at', { ascending: false }).limit(60);
      throwIf(error);
      return ((data ?? []) as GeneratedRow[]).map(mapGenerated);
    },
    async get(id) {
      const { data, error } = await client.from('generated_ideas').select('*').eq('id', id).maybeSingle();
      throwIf(error);
      return data ? mapGenerated(data as GeneratedRow) : null;
    },
    async saveMany(items) {
      if (!items.length) return;
      const { error } = await client.from('generated_ideas').upsert(
        items.map((item) => ({
          id: item.id,
          user_id: userId,
          source: item.source,
          brief: item.brief,
          idea: item.idea,
          provider: item.provider ?? null,
          model: item.model ?? null,
          created_at: item.createdAt,
        })),
        { onConflict: 'id' },
      );
      throwIf(error);
    },
    async clear() {
      const { error } = await client.from('generated_ideas').delete().eq('user_id', userId);
      throwIf(error);
    },
  };

  return { kind: 'cloud', scope: userId, savedIdeas, projects, prompts, generatedIdeas };
}
