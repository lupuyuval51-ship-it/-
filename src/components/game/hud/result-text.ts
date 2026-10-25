const bare = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** Whether a feedback line only says again what the heading above it already says ("Correct!" under "Correct!"). */
export const repeatsLabel = (feedback: string, label: string): boolean => bare(feedback) !== "" && bare(feedback) === bare(label);

const RIGHT_LEAD = /^(?:נכון|yes|correct|right)\s*[—–-]\s*/iu;

/**
 * The feedback of a right answer without the "Correct — " it often starts with: the heading above it already says so
 * ("נכון!" then "נכון — כך החומר שלכם מתאר זאת." read as a stutter). A wrong answer's feedback is left as it is.
 */
export function withoutRightLead(feedback: string, correct: boolean): string {
  if (!correct) return feedback;
  const rest = feedback.replace(RIGHT_LEAD, "");
  if (rest === feedback || !rest.trim()) return feedback;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
