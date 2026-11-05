/**
 * Every English namespace must have exactly the keys of its Hebrew counterpart (the compiler
 * enforces this through `Messages<typeof he>`; this test also guards runtime shape, plural
 * leaves and interpolation placeholders).
 */
import { he, NAMESPACES, resources } from '../locales';
import { isPluralForms } from '../types';

type Tree = Record<string, unknown>;

interface Leaf {
  path: string;
  kind: 'string' | 'plural';
  placeholders: string[];
  texts: string[];
}

function placeholdersOf(texts: string[]): string[] {
  const names = new Set<string>();
  for (const text of texts) for (const m of text.matchAll(/\{(\w+)\}/g)) if (m[1]) names.add(m[1]);
  return [...names].sort();
}

function leaves(tree: Tree, prefix = ''): Leaf[] {
  const out: Leaf[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out.push({ path, kind: 'string', placeholders: placeholdersOf([value]), texts: [value] });
    } else if (isPluralForms(value)) {
      const texts = Object.values(value).filter((v): v is string => typeof v === 'string');
      out.push({ path, kind: 'plural', placeholders: placeholdersOf(texts), texts });
    } else if (typeof value === 'object' && value !== null) {
      out.push(...leaves(value as Tree, path));
    } else {
      throw new Error(`Unsupported value at ${path}: ${String(value)}`);
    }
  }
  return out;
}

describe('locale resources', () => {
  it('registers the same namespaces in both languages', () => {
    expect(Object.keys(resources.en).sort()).toEqual(Object.keys(resources.he).sort());
    expect(NAMESPACES.sort()).toEqual(
      ['advisor', 'auth', 'business', 'common', 'errors', 'finance', 'home', 'launch', 'manage', 'marketing', 'onboarding', 'plan', 'roadmap', 'settings'].sort(),
    );
  });

  describe.each(Object.keys(he))('namespace %s', (ns) => {
    const heLeaves = leaves((resources.he as unknown as Record<string, Tree>)[ns] ?? {});
    const enLeaves = leaves((resources.en as unknown as Record<string, Tree>)[ns] ?? {});

    it('has identical key paths in he and en', () => {
      expect(enLeaves.map((l) => l.path).sort()).toEqual(heLeaves.map((l) => l.path).sort());
    });

    it('uses the same leaf kind (string vs plural) and placeholders', () => {
      const enByPath = new Map(enLeaves.map((l) => [l.path, l]));
      for (const heLeaf of heLeaves) {
        const enLeaf = enByPath.get(heLeaf.path);
        expect({ path: heLeaf.path, kind: enLeaf?.kind }).toEqual({ path: heLeaf.path, kind: heLeaf.kind });
        expect({ path: heLeaf.path, placeholders: enLeaf?.placeholders }).toEqual({ path: heLeaf.path, placeholders: heLeaf.placeholders });
      }
    });

    it('has no empty strings', () => {
      for (const leaf of [...heLeaves, ...enLeaves]) {
        for (const text of leaf.texts) expect({ path: leaf.path, empty: text.trim() === '' }).toEqual({ path: leaf.path, empty: false });
      }
    });
  });

  it('fills the foundation namespaces', () => {
    for (const ns of ['common', 'errors', 'auth', 'business', 'settings'] as const) {
      expect(leaves(he[ns] as unknown as Tree).length).toBeGreaterThan(5);
    }
  });
});
