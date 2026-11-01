import { defineFeature } from '../core.ts';

export default defineFeature({
  exercises: {
    all: 'All', search: 'Search exercises', searchPlaceholder: 'Name or muscle, in Hebrew or English', muscle: 'Muscle', equipment: 'Equipment', category: 'Type', difficulty: 'Difficulty',
    safeForMe: 'Safe for me (injuries, age, equipment)', safeNeedsProfile: 'Complete your profile to filter by safety.', safeHidden: '{n} exercises hidden because of your injuries, age or equipment.', safeNone: 'Nothing is hidden for you.',
    filters: 'Filters', filtersN: 'Filters ({n})', filtersTitle: 'Filter exercises', apply: 'Show {n} exercises', safeChip: 'Safe for me', safeAria: 'Show only exercises that are safe for me', removeFilter: 'Remove filter: {name}', loadingMore: 'Loading more', searchShort: 'Search exercises',
    count: '{n} exercises', empty: 'No exercises match', emptyHint: 'Try fewer words or remove a filter.', clear: 'Clear filters', more: 'Show more ({n} left)', unsafeTag: 'Not safe for you',
    history: {
      title: 'Your history', empty: 'No sets logged for this exercise yet. Finish a workout with it and your records will show up here.', maxWeight: 'Best weight', maxReps: 'Most reps', maxVolume: 'Best set volume',
      maxDuration: 'Longest hold', est1rm: 'Estimated 1RM', noOneRmMinor: 'Strength estimates are not shown for users under 18.',
    },
    detail: {
      notFound: 'Exercise not found', notFoundHint: 'This link does not match any exercise in the library.', backToList: 'Back to exercises', injuryWarning: 'This exercise is flagged for your injury profile: {areas}. Use an easier alternative.',
      steps: 'How to do it', cues: 'Coaching cues', mistakes: 'Common mistakes', safety: 'Safety:', primary: 'Primary muscles', secondary: 'Secondary muscles', equipment: 'Equipment', contra: 'Take care with', contraNone: 'No specific injury areas',
      easier: 'Easier options', harder: 'Harder options', noAlternatives: 'No alternatives listed.', alternatives: 'Alternatives', tabsLabel: 'Exercise details', tabSteps: 'Steps', tabCues: 'Cues', tabMistakes: 'Mistakes', tabHistory: 'History', moreDetails: 'More details', illustrationShort: 'Illustration',
    },
  },
}, {
  exercises: {
    all: 'הכול', search: 'חיפוש תרגילים', searchPlaceholder: 'שם או שריר, בעברית או באנגלית', muscle: 'שריר', equipment: 'ציוד', category: 'סוג', difficulty: 'רמה',
    safeForMe: 'בטוחים עבורי (פציעות, גיל, ציוד)', safeNeedsProfile: 'אחרי השלמת הפרופיל אפשר לסנן לפי בטיחות.', safeHidden: '{n} תרגילים הוסתרו בגלל פציעות, גיל או ציוד.', safeNone: 'שום דבר לא הוסתר עבורכם.',
    filters: 'מסננים', filtersN: 'מסננים ({n})', filtersTitle: 'סינון תרגילים', apply: 'להצגת {n} תרגילים', safeChip: 'בטוחים עבורי', safeAria: 'הצגת תרגילים בטוחים עבורי בלבד', removeFilter: 'הסרת מסנן: {name}', loadingMore: 'טוענים עוד', searchShort: 'חיפוש תרגילים',
    count: '{n} תרגילים', empty: 'לא נמצאו תרגילים', emptyHint: 'כדאי לנסות פחות מילים או להסיר מסנן.', clear: 'ניקוי מסננים', more: 'עוד תרגילים (נשארו {n})', unsafeTag: 'לא מתאים לכם',
    history: {
      title: 'ההיסטוריה שלכם', empty: 'עוד לא תועדו סטים בתרגיל הזה. אחרי אימון שכולל אותו, השיאים יופיעו כאן.', maxWeight: 'משקל שיא', maxReps: 'מקסימום חזרות', maxVolume: 'נפח סט שיא',
      maxDuration: 'החזקה ארוכה ביותר', est1rm: 'הערכת 1RM', noOneRmMinor: 'הערכות כוח לא מוצגות למתחת לגיל 18.',
    },
    detail: {
      notFound: 'התרגיל לא נמצא', notFoundHint: 'הקישור לא תואם אף תרגיל בספרייה.', backToList: 'חזרה לתרגילים', injuryWarning: 'התרגיל מסומן לפי פרופיל הפציעות שלכם: {areas}. כדאי לעבור לחלופה קלה יותר.',
      steps: 'איך מבצעים', cues: 'דגשים', mistakes: 'טעויות נפוצות', safety: 'בטיחות:', primary: 'שרירים ראשיים', secondary: 'שרירים משניים', equipment: 'ציוד', contra: 'כדאי להיזהר עם', contraNone: 'אין אזורי פציעה ספציפיים',
      easier: 'חלופות קלות יותר', harder: 'חלופות קשות יותר', noAlternatives: 'אין חלופות ברשימה.', alternatives: 'חלופות', tabsLabel: 'פרטי התרגיל', tabSteps: 'שלבים', tabCues: 'דגשים', tabMistakes: 'טעויות', tabHistory: 'היסטוריה', moreDetails: 'פרטים נוספים', illustrationShort: 'המחשה',
    },
  },
});
