import { ideas } from '@/data/seed/ai';
import type { PromptOptions } from '@/data/types';
import { buildPrompt, defaultPromptOptions, promptFileName, promptSectionHeadings, promptStats, promptTitle } from '@/features/prompt/engine';

const idea = ideas[0];

describe('prompt engine', () => {
  it('is deterministic for the same input', () => {
    expect(buildPrompt(idea, defaultPromptOptions)).toBe(buildPrompt(idea, defaultPromptOptions));
  });

  it.each(['he', 'en'] as const)('contains every section heading A–H in %s', (language) => {
    const content = buildPrompt(idea, { ...defaultPromptOptions, language });
    for (const heading of promptSectionHeadings(language)) {
      expect(content).toContain(`## ${heading}`);
    }
    expect(content).toContain(idea.name[language]);
    expect(content).toContain(idea.tagline[language]);
  });

  it('includes every screen, feature and milestone from the spec', () => {
    const content = buildPrompt(idea, { ...defaultPromptOptions, language: 'en' });
    for (const screen of idea.spec.screens) expect(content).toContain(screen.name.en);
    for (const feature of idea.spec.coreFeatures.en) expect(content).toContain(feature);
    for (const milestone of idea.spec.mvpMilestones.en) expect(content).toContain(milestone);
  });

  it('changes with options: framework, backend, target AI and scope', () => {
    const base: PromptOptions = { ...defaultPromptOptions, language: 'en' };
    const expo = buildPrompt(idea, base);
    const flutter = buildPrompt(idea, { ...base, framework: 'flutter' });
    const firebase = buildPrompt(idea, { ...base, backend: 'firebase' });
    const codex = buildPrompt(idea, { ...base, targetAi: 'codex' });
    const complete = buildPrompt(idea, { ...base, scope: 'complete' });
    expect(flutter).toContain('Flutter');
    expect(flutter).not.toBe(expo);
    expect(firebase).toContain('Firestore');
    expect(codex).toContain('AGENTS.md');
    expect(complete).toContain('Expansion phases');
    expect(expo).toContain('Explicit non-goals');
    expect(complete).not.toContain('Explicit non-goals');
  });

  it('lean complexity trims features and rich adds stretch features', () => {
    const base: PromptOptions = { ...defaultPromptOptions, language: 'en' };
    const lean = buildPrompt(idea, { ...base, complexity: 'lean' });
    const rich = buildPrompt(idea, { ...base, complexity: 'rich' });
    expect(rich).toContain('Stretch features');
    expect(lean).not.toContain('Stretch features');
    expect(lean.length).toBeLessThan(rich.length);
  });

  it('never promises guaranteed results', () => {
    const content = buildPrompt(idea, { ...defaultPromptOptions, language: 'en' }).toLowerCase();
    expect(content).toContain('not a guarantee');
    expect(content).not.toMatch(/guaranteed (revenue|success)/);
  });

  it('exposes stats, title and file name', () => {
    const content = buildPrompt(idea, defaultPromptOptions);
    const stats = promptStats(content);
    expect(stats.words).toBeGreaterThan(400);
    expect(stats.characters).toBe(content.length);
    expect(promptTitle(idea, { ...defaultPromptOptions, language: 'en' })).toContain('Claude');
    expect(promptFileName(idea, defaultPromptOptions)).toBe('appspark-rehearse-claude-mvp.md');
  });
});
