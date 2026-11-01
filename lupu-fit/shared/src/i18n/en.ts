export const en = {
  app: { name: 'LUPU-FIT', tagline: 'Know exactly what to train today.' },
  unit: { kg: 'kg', cm: 'cm', kcal: 'kcal', g: 'g', min: 'min', sec: 'sec' },
  nav: { home: 'Home', workouts: 'Workouts', nutrition: 'Nutrition', coach: 'Coach', progress: 'Progress', profile: 'Profile' },
  action: {
    startWorkout: 'Start workout', finishSet: 'Finish set', saveMeal: 'Save meal', chooseEquipment: 'Choose equipment',
    retry: 'Retry', undo: 'Undo', save: 'Save', cancel: 'Cancel',
  },
  empty: { noData: 'Not enough data yet' },
  video: { needsNetwork: 'The video is available when online', clearCache: 'Clear video cache' },
  allergen: { disclaimer: 'Allergen filtering is automatic and conservative. Always verify ingredients yourself.' },
  notice: {
    minorNoDeficit: 'Healthy habits and growth come first, so no calorie deficit is set.',
    injuryDisclaimer: 'Exercise swaps reduce risk but are not medical advice. Stop if you feel pain.',
  },
  note: {
    recovery_day_added: 'Seven days requested: six lifting days plus a recovery day.',
    exercise_swapped: 'An exercise was swapped for a safer alternative.',
    exercise_dropped: 'An exercise was removed because no safe alternative exists.',
    time_trimmed: 'The workout was shortened to fit your time budget.',
    slot_unfilled: 'No suitable exercise was found for one slot.',
  },
  coach: {
    crisisTitle: 'Support first',
    freeTierPrivacy: "Google's free tier may use prompts to improve its products.",
  },
  sport: {
    soccer: 'Soccer', basketball: 'Basketball', volleyball: 'Volleyball', racquet: 'Tennis / Padel', running: 'Running',
    cycling: 'Cycling', swimming: 'Swimming', combat_striking: 'Boxing / Kickboxing / Striking', grappling: 'Judo / BJJ / Wrestling',
    climbing: 'Climbing', surfing: 'Surfing', calisthenics: 'Calisthenics', general: 'General',
  },
} as const;
