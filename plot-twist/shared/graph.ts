import type { Adventure, AdventurePath, Ending, StageNode } from './types.ts';

export interface AdventureIndex {
  nodes: Map<string, StageNode>;
  endings: Map<string, Ending>;
}

export function indexAdventure(adv: Pick<Adventure, 'nodes' | 'endings'>): AdventureIndex {
  return {
    nodes: new Map(adv.nodes.map((n) => [n.id, n])),
    endings: new Map(adv.endings.map((e) => [e.id, e])),
  };
}

export function getNode(adv: Adventure, id: string): StageNode | undefined {
  return adv.nodes.find((n) => n.id === id);
}

export function getEnding(adv: Adventure, id: string): Ending | undefined {
  return adv.endings.find((e) => e.id === id);
}

/** Ids a node can lead to (choice option targets, or `next`). */
export function successors(node: StageNode): string[] {
  if (node.choice) return node.choice.options.map((o) => o.next);
  return node.next ? [node.next] : [];
}

/**
 * Enumerates every complete path from `start` to an ending.
 * Assumes a valid (acyclic) adventure; guards against cycles and runaway graphs anyway.
 */
export function enumeratePaths(adv: Adventure, limit = 64): AdventurePath[] {
  const idx = indexAdventure(adv);
  const out: AdventurePath[] = [];
  const start = idx.nodes.get(adv.start);
  if (!start) return out;

  const walk = (node: StageNode, nodes: StageNode[], choices: AdventurePath['choices'], seen: Set<string>) => {
    if (out.length >= limit) return;
    if (seen.has(node.id)) return;
    const nextSeen = new Set(seen).add(node.id);
    const trail = [...nodes, node];
    const targets: { id: string; optionId?: string }[] = node.choice
      ? node.choice.options.map((o) => ({ id: o.next, optionId: o.id }))
      : node.next
        ? [{ id: node.next }]
        : [];
    for (const t of targets) {
      const nextChoices = t.optionId ? [...choices, { nodeId: node.id, optionId: t.optionId }] : choices;
      const ending = idx.endings.get(t.id);
      if (ending) {
        out.push({ nodes: trail, choices: nextChoices, ending });
        continue;
      }
      const child = idx.nodes.get(t.id);
      if (child) walk(child, trail, nextChoices, nextSeen);
    }
  };

  walk(start, [], [], new Set());
  return out;
}

/** Sum of suggested stage minutes along a path. */
export function pathMinutes(path: AdventurePath): number {
  return path.nodes.reduce((sum, n) => sum + n.minutes, 0);
}

/** All capture keys defined anywhere in the adventure. */
export function captureKeys(adv: Adventure): Set<string> {
  const keys = new Set<string>();
  for (const n of adv.nodes) if (n.capture) keys.add(n.capture.key);
  return keys;
}
