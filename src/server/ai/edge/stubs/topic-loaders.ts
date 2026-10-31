// The Edge Function never builds topic-library games (the phone does, offline), so their content is not bundled.
export async function loadTopicContent(): Promise<null> {
  return null;
}
export const TOPIC_LOADERS = {};
