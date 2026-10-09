import type en from '../en/exercises';
import type { Translations } from '../types';

const exercises: Translations<typeof en> = {
  title: 'מאגר תרגילים',
  animation: {
    label: 'הדגמה מונפשת של התרגיל',
    play: 'הפעלה',
    pause: 'השהיה',
    speed: 'מהירות ניגון',
    targetMuscles: 'שרירי מטרה',
  },
  picker: {
    title: 'בחירת תרגיל',
    searchLabel: 'חיפוש תרגילים',
    searchPlaceholder: 'שם, שריר או ציוד…',
    muscleGroup: 'קבוצת שרירים',
    allGroups: 'הכול',
    availableOnly: 'רק עם הציוד שלי',
    noResults: 'לא נמצאו תרגילים מתאימים.',
    select: 'בחירה',
    results: { one: 'תרגיל אחד', other: '{count} תרגילים' },
  },
};

export default exercises;
