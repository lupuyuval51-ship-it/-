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
  "math-equations": () => import("./content/math-equations"),
  "math-angles": () => import("./content/math-angles"),
  "math-probability": () => import("./content/math-probability"),
  "math-area-perimeter": () => import("./content/math-area-perimeter"),
  "math-decimals": () => import("./content/math-decimals"),
  "math-negative-numbers": () => import("./content/math-negative-numbers"),
  "math-order-of-operations": () => import("./content/math-order-of-operations"),
  "math-primes-factors": () => import("./content/math-primes-factors"),
  "math-pythagoras": () => import("./content/math-pythagoras"),
  "math-statistics": () => import("./content/math-statistics"),
  "math-ratio": () => import("./content/math-ratio"),
  "science-states-of-matter": () => import("./content/science-states-of-matter"),
  "science-water-cycle": () => import("./content/science-water-cycle"),
  "science-solar-system": () => import("./content/science-solar-system"),
  "science-cells": () => import("./content/science-cells"),
  "science-photosynthesis": () => import("./content/science-photosynthesis"),
  "science-digestion": () => import("./content/science-digestion"),
  "science-electricity": () => import("./content/science-electricity"),
  "science-forces": () => import("./content/science-forces"),
  "history-ancient-egypt": () => import("./content/history-ancient-egypt"),
  "history-ancient-rome": () => import("./content/history-ancient-rome"),
  "history-ancient-greece": () => import("./content/history-ancient-greece"),
  "history-israel-independence": () => import("./content/history-israel-independence"),
  "civics-democracy": () => import("./content/civics-democracy"),
  "civics-israel-government": () => import("./content/civics-israel-government"),
  "geo-continents-oceans": () => import("./content/geo-continents-oceans"),
  "geo-israel": () => import("./content/geo-israel"),
  "lang-en-past-simple": () => import("./content/lang-en-past-simple"),
  "lang-he-roots": () => import("./content/lang-he-roots"),
  "cs-binary": () => import("./content/cs-binary"),
  "cs-algorithms": () => import("./content/cs-algorithms"),
  "cs-internet-safety": () => import("./content/cs-internet-safety"),
  "econ-budgeting": () => import("./content/econ-budgeting"),
  "health-nutrition": () => import("./content/health-nutrition"),
  "arts-music-basics": () => import("./content/arts-music-basics"),
  "think-study-skills": () => import("./content/think-study-skills"),
  "lang-en-present-simple": () => import("./content/lang-en-present-simple"),
};

export async function loadTopicContent(id: string): Promise<TopicContent | null> {
  const load = Object.prototype.hasOwnProperty.call(TOPIC_LOADERS, id) ? TOPIC_LOADERS[id] : undefined;
  return load ? (await load()).default : null;
}
