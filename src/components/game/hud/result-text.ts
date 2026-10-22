const bare = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** Whether a feedback line only says again what the heading above it already says ("Correct!" under "Correct!"). */
export const repeatsLabel = (feedback: string, label: string): boolean => bare(feedback) !== "" && bare(feedback) === bare(label);
