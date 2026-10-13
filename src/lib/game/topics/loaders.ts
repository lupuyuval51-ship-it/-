/**
 * One dynamically imported module per topic, listed explicitly so every bundler (Vite for the Android app, Next.js on
 * the server) can see each import and split it into its own chunk: only the picked topic is ever loaded. Never build
 * an import path from a request value — a topic id is only a key into this map.
 */
import type { TopicContent } from "./types";

type Loader = () => Promise<{ default: TopicContent }>;

export const TOPIC_LOADERS: Readonly<Record<string, Loader>> = {
  "math-fractions": () => import("./content/math-fractions"),
  "math-percentages": () => import("./content/math-percentages"),
};

export async function loadTopicContent(id: string): Promise<TopicContent | null> {
  const load = Object.prototype.hasOwnProperty.call(TOPIC_LOADERS, id) ? TOPIC_LOADERS[id] : undefined;
  return load ? (await load()).default : null;
}
