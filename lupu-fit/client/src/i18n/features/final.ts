import { defineFeature } from '../core.ts';

/** Copy added by the final UI fix pass (kept in its own file so feature owners' dictionaries stay untouched). */
export default defineFeature({
  final: {
    live: {
      confirmLeft: '{n} sets left. Finish anyway?',
      confirmLeftOne: 'One set left. Finish anyway?',
      editList: 'Edit list',
      editDone: 'Done editing',
    },
    summary: {
      reps: 'Total reps',
      textLineReps: '{duration} min, {sets} sets, {reps} reps',
    },
    coach: {
      providerName: { gemini: 'Google Gemini', claude: 'Anthropic Claude' },
    },
    progress: {
      achNone: 'No achievements unlocked yet. The next three to aim for:',
    },
    nutrition: {
      onTarget: 'Within the daily target range',
    },
  },
}, {
  final: {
    live: {
      confirmLeft: 'נשארו {n} סטים. לסיים בכל זאת?',
      confirmLeftOne: 'נשאר סט אחד. לסיים בכל זאת?',
      editList: 'עריכת הרשימה',
      editDone: 'סיום עריכה',
    },
    summary: {
      reps: 'סך החזרות',
      textLineReps: '{duration} דק׳, {sets} סטים, {reps} חזרות',
    },
    coach: {
      providerName: { gemini: 'Google Gemini', claude: 'Anthropic Claude' },
    },
    progress: {
      achNone: 'עוד לא נפתחו הישגים. שלושת הבאים בתור:',
    },
    nutrition: {
      onTarget: 'בטווח היעד היומי',
    },
  },
});
