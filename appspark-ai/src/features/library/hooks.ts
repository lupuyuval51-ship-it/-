import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { getIdeaById } from '@/data/ideas';
import type { GeneratedIdea, GeneratedPrompt, Idea, IdeaSource, Project, SavedIdea } from '@/data/types';
import { useI18n } from '@/i18n';
import { useRepositories, type ProjectInput, type PromptInput } from '@/repositories';
import { showToast } from '@/store/toast';

export const queryKeys = {
  saved: (scope: string) => [scope, 'saved'] as const,
  projects: (scope: string) => [scope, 'projects'] as const,
  prompts: (scope: string, ideaId?: string) => [scope, 'prompts', ideaId ?? 'all'] as const,
  generated: (scope: string) => [scope, 'generated'] as const,
};

export function useSavedIdeas() {
  const repos = useRepositories();
  return useQuery({ queryKey: queryKeys.saved(repos.scope), queryFn: () => repos.savedIdeas.list() });
}

export function useSavedIdeaIds(): Set<string> {
  const { data } = useSavedIdeas();
  return useMemo(() => new Set((data ?? []).map((s) => s.ideaId)), [data]);
}

export function useToggleSavedIdea() {
  const repos = useRepositories();
  const client = useQueryClient();
  const { t } = useI18n();
  const key = queryKeys.saved(repos.scope);

  const mutation = useMutation({
    mutationFn: async ({ ideaId, saved }: { ideaId: string; saved: boolean }) => {
      if (saved) await repos.savedIdeas.remove(ideaId);
      else await repos.savedIdeas.add(ideaId);
      return !saved;
    },
    onMutate: async ({ ideaId, saved }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<SavedIdea[]>(key) ?? [];
      const next = saved ? previous.filter((s) => s.ideaId !== ideaId) : [{ ideaId, createdAt: new Date().toISOString() }, ...previous];
      client.setQueryData(key, next);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context) client.setQueryData(key, context.previous);
      showToast(t('errors.generic'), { tone: 'danger' });
    },
    onSuccess: (nowSaved) => {
      showToast(nowSaved ? t('idea.savedToast') : t('idea.unsavedToast'), { tone: nowSaved ? 'success' : 'neutral', icon: 'bookmark' });
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
    },
  });

  const toggle = useCallback((ideaId: string, currentlySaved: boolean) => mutation.mutate({ ideaId, saved: currentlySaved }), [mutation]);
  return { toggle, isPending: mutation.isPending };
}

export function useProjects() {
  const repos = useRepositories();
  return useQuery({ queryKey: queryKeys.projects(repos.scope), queryFn: () => repos.projects.list() });
}

export function useProject(id: string | undefined) {
  const repos = useRepositories();
  return useQuery({
    queryKey: [...queryKeys.projects(repos.scope), id ?? ''],
    queryFn: () => (id ? repos.projects.get(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function useProjectMutations() {
  const repos = useRepositories();
  const client = useQueryClient();
  const { t } = useI18n();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.projects(repos.scope) });

  const create = useMutation({
    mutationFn: (input: ProjectInput) => repos.projects.create(input),
    onSuccess: () => {
      void invalidate();
      showToast(t('saved.projectSaved'), { tone: 'success' });
    },
    onError: () => showToast(t('errors.generic'), { tone: 'danger' }),
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Project, 'id' | 'createdAt'>> }) => repos.projects.update(id, patch),
    onSuccess: () => {
      void invalidate();
    },
    onError: () => showToast(t('errors.generic'), { tone: 'danger' }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => repos.projects.remove(id),
    onSuccess: () => {
      void invalidate();
      showToast(t('saved.projectDeleted'));
    },
    onError: () => showToast(t('errors.generic'), { tone: 'danger' }),
  });
  return { create, update, remove };
}

export function usePrompts(ideaId?: string) {
  const repos = useRepositories();
  return useQuery({ queryKey: queryKeys.prompts(repos.scope, ideaId), queryFn: () => repos.prompts.list(ideaId) });
}

export function usePrompt(id: string | undefined) {
  const repos = useRepositories();
  return useQuery({
    queryKey: [...queryKeys.prompts(repos.scope), 'one', id ?? ''],
    queryFn: () => (id ? repos.prompts.get(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

export function usePromptMutations() {
  const repos = useRepositories();
  const client = useQueryClient();
  const { t } = useI18n();
  const invalidate = () => client.invalidateQueries({ queryKey: [repos.scope, 'prompts'] });

  const create = useMutation({
    mutationFn: (input: PromptInput) => repos.prompts.create(input),
    onSuccess: () => {
      void invalidate();
      showToast(t('prompt.savedToast'), { tone: 'success' });
    },
    onError: () => showToast(t('errors.generic'), { tone: 'danger' }),
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<GeneratedPrompt, 'title' | 'content' | 'options'>> }) => repos.prompts.update(id, patch),
    onSuccess: () => {
      void invalidate();
      showToast(t('prompt.savedToast'), { tone: 'success' });
    },
    onError: () => showToast(t('errors.generic'), { tone: 'danger' }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => repos.prompts.remove(id),
    onSuccess: () => {
      void invalidate();
    },
    onError: () => showToast(t('errors.generic'), { tone: 'danger' }),
  });
  return { create, update, remove };
}

export function useGeneratedIdeas() {
  const repos = useRepositories();
  return useQuery({ queryKey: queryKeys.generated(repos.scope), queryFn: () => repos.generatedIdeas.list() });
}

export function useSaveGeneratedIdeas() {
  const repos = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (items: GeneratedIdea[]) => repos.generatedIdeas.saveMany(items),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.generated(repos.scope) });
    },
  });
}

export interface ResolvedIdea {
  idea: Idea | undefined;
  source: IdeaSource;
  generated?: GeneratedIdea;
  isLoading: boolean;
}

/** Resolves an idea id against the curated catalogue first, then generated ideas. */
export function useIdea(id: string | undefined): ResolvedIdea {
  const curated = id ? getIdeaById(id) : undefined;
  const repos = useRepositories();
  const query = useQuery({
    queryKey: [...queryKeys.generated(repos.scope), 'one', id ?? ''],
    queryFn: () => (id ? repos.generatedIdeas.get(id) : Promise.resolve(null)),
    enabled: Boolean(id) && !curated,
  });
  if (curated) return { idea: curated, source: 'curated', isLoading: false };
  const generated = query.data ?? undefined;
  return { idea: generated?.idea, source: generated?.source ?? 'curated', generated, isLoading: query.isLoading };
}

export function useClearLocalData() {
  const repos = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await Promise.all([repos.savedIdeas.clear(), repos.projects.clear(), repos.prompts.clear(), repos.generatedIdeas.clear()]);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [repos.scope] });
    },
  });
}
