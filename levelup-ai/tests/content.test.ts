import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { categories, learningPaths, type Localized } from '../src/lib/content';

function translated(value: Localized, label: string) {
  assert.equal(typeof value.he, 'string', label);
  assert.equal(typeof value.en, 'string', label);
  assert.ok(value.he.trim().length > 0 && value.en.trim().length > 0, label);
}

test('catalog contains the eight promised paths and fourteen extensible categories', () => {
  assert.deepEqual(learningPaths.map(path => path.id), ['website', 'app', 'game', 'english', 'video', 'ai', 'content', 'business']);
  assert.equal(categories.length, 14);
  const categoryIds = new Set(categories.map(category => category.id));
  assert.equal(categoryIds.size, 14);
  for (const category of categories) translated(category.title, category.id);
  for (const path of learningPaths) {
    translated(path.title, path.id);
    translated(path.description, path.id);
    assert.ok(categoryIds.has(path.category), `${path.id} must reference a category`);
    assert.ok(path.durationDays > 0 && path.dailyMinutes > 0);
    assert.ok(path.chapters.length >= 3);
    assert.ok(path.chapters.flatMap(chapter => chapter.tasks).length >= 6);
  }
});

test('every task has parallel bilingual instructions, an objective, evidence example and help', () => {
  const taskIds = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of learningPaths) for (const chapter of path.chapters) {
    translated(chapter.title, chapter.id);
    for (const task of chapter.tasks) {
      assert.ok(!taskIds.has(task.id), `Duplicate task ${task.id}`);
      taskIds.add(task.id);
      assert.ok(!descriptions.has(task.description.he), `Repeated curriculum ${task.id}`);
      descriptions.add(task.description.he);
      for (const field of ['title', 'description', 'objective', 'example'] as const) translated(task[field], `${task.id}.${field}`);
      assert.ok(task.instructions.he.length >= 3, `${task.id} needs actionable steps`);
      assert.equal(task.instructions.he.length, task.instructions.en.length);
      assert.ok(task.instructions.he.every(step => step.trim().length > 10));
      assert.ok(task.instructions.en.every(step => step.trim().length > 10));
      assert.ok(task.hints.he.length > 0);
      assert.equal(task.hints.he.length, task.hints.en.length);
      assert.ok(Number.isInteger(task.xp) && task.xp > 0);
      assert.ok(Number.isInteger(task.minutes) && task.minutes > 0);
    }
  }
  assert.equal(taskIds.size, 48);
});

test('game question keys refer to a real unique answer in both languages', () => {
  for (const path of learningPaths) {
    const prompts = new Set<string>();
    for (const chapter of path.chapters) for (const task of chapter.tasks) {
      const question = task.question;
      translated(question.prompt, `${task.id} prompt`);
      translated(question.explanation, `${task.id} explanation`);
      assert.ok(!prompts.has(question.prompt.he), `${path.id} should have distinct questions`);
      prompts.add(question.prompt.he);
      assert.ok(question.options.he.length >= 2);
      assert.equal(question.options.he.length, question.options.en.length);
      assert.equal(new Set(question.options.he).size, question.options.he.length);
      assert.equal(new Set(question.options.en).size, question.options.en.length);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.he.length);
    }
  }
});

test('each path ends with a project and has a real local cover and HTTPS resources', () => {
  for (const path of learningPaths) {
    const tasks = path.chapters.flatMap(chapter => chapter.tasks);
    assert.equal(tasks.at(-1)?.type, 'project');
    assert.ok(path.cover.startsWith('/covers/') && path.cover.endsWith('.svg'));
    const cover = resolve(process.cwd(), 'public', path.cover.slice(1));
    assert.ok(existsSync(cover), `${path.id} cover must exist`);
    assert.match(readFileSync(cover, 'utf8'), /^<svg\s/);
    for (const task of tasks) {
      assert.ok(task.resources.length > 0);
      for (const resource of task.resources) {
        assert.ok(resource.title.length > 0);
        const url = new URL(resource.url);
        assert.equal(url.protocol, 'https:');
        assert.ok(!url.username && !url.password);
      }
    }
  }
});
