import type { QaException } from './qa';

/**
 * Documented per-exercise QA exceptions. Each one names the issue key, the highest value that is
 * still accepted (anything beyond it fails again) and the anatomical / geometric reason.
 */
export const QA_EXCEPTIONS: Record<string, QaException[]> = {};
