import { defineFeature } from '../core.ts';

export default defineFeature({
  welcome: {
    title: 'Welcome to LUPU-FIT', lead: 'Strength training, nutrition and progress in one app.',
    deviceData: 'Your data stays on this device. It is stored in the browser database and is not uploaded to a server.',
    cta: 'Set up my profile', legalPrefix: 'By continuing you agree to the',
    v1: 'Today\'s workout, fitted to your gear and time', v2: 'Nutrition targets with safety floors built in', v3: 'Weight, sets and records in one place', setupTime: 'Setup takes about two minutes.',
  },
  onboarding: {
    done: { title: 'Your plan is ready', lead: 'Taking you to your first workout.' },
    stepLabel: 'Step', progress: 'Setup progress', startOver: 'Start over', save: 'Save and start',
    injuryDisclaimer: 'Training is adjusted to avoid the areas you mark, but this is not medical advice. If you have an injury or a health condition, check with a doctor or physiotherapist before training.',
    steps: {
      about: { title: 'About you', intro: 'These details are used to calculate your nutrition targets and to keep training safe.' },
      experience: { title: 'Experience and injuries', intro: 'Helps choose the right difficulty and avoid sensitive areas.' },
      goal: { title: 'Your goal', intro: 'Choose the main goal. It can be changed later.' },
      training: { title: 'How you train', intro: 'Where, with what gear and how often.' },
      preferences: { title: 'Preferences', intro: 'Language and theme apply right away.' },
      nutrition: { title: 'Nutrition', intro: 'Activity level, diet and allergies shape your targets and menus.' },
      review: { title: 'Review', intro: 'Your calculated targets are shown below and update as you change answers.' },
    },
    about: {
      name: 'Display name (optional)', nameHint: 'Shown in the app. Leave empty to skip.', sex: 'Sex', sexHint: 'Used only in the calorie formula.',
      age: 'Age', height: 'Height', weight: 'Weight', range: 'Allowed range: {min}–{max}',
      minorNotice: 'You are between 13 and 17, so the app is built to support healthy growth: no calorie deficit, gentler training intensity and a private profile. Talk to a parent, guardian or coach about your training.',
    },
    experience: {
      level: 'Training experience', injuries: 'Injuries or sensitive areas', noInjuries: 'None selected. Leave empty if you have no limitations.', injuriesHint: 'Exercises that load the selected areas are avoided where possible.',
      desc: { beginner: 'New to lifting or returning after a long break.', intermediate: 'Training regularly and comfortable with the main lifts.', advanced: 'Years of consistent training and good technique.' },
    },
    goal: {
      title: 'Main goal',
      desc: {
        fat_loss: 'A moderate calorie deficit with high protein to keep muscle.', muscle_gain: 'A small calorie surplus with progressive training.', strength: 'Heavier lifts with a slight surplus for recovery.',
        general_fitness: 'Maintain weight and build all-round fitness.', athletic_performance: 'Training that supports your sport, fuelled at maintenance.',
      },
    },
    training: {
      place: 'Where you train', equipment: 'Available equipment', noGear: 'Nothing selected: workouts will be bodyweight only.', gearHint: 'Workouts use only what is selected.',
      gymHint: 'A gym is assumed to have standard equipment.', placeDesc: { gym: 'Full set of machines and weights.', home: 'Your own gear, even if it is just a mat.', park: 'Outdoor bars and bodyweight training.' }, days: 'Days per week', minutes: 'Minutes per session',
      sevenDays: 'Seven days are possible, but the plan uses at most {n} lifting days and keeps one day for recovery.',
    },
    prefs: {
      language: 'Language', lang: { he: 'עברית', en: 'English' }, theme: 'Theme', themes: { dark: 'Dark', light: 'Light', system: 'System' },
      units: 'Units', unitNames: { metric: 'Metric', imperial: 'Imperial' }, unitsHint: 'The questions here use kg and cm.',
    },
    nutrition: {
      activity: 'Daily activity level', activityDesc: { sedentary: 'Desk job, little walking', light: 'On your feet some of the day', moderate: 'Active job or daily walks', active: 'Physical job or very active days', very_active: 'Heavy labour or two-a-day training' }, diet: 'Diet', allergies: 'Allergies', restrictions: 'Dietary restrictions',
      custom: 'Set my own calorie target', customKcal: 'Calorie target', customOff: 'Off: the target is calculated for your goal.',
      floor: 'A target below {floor} kcal is not allowed for your profile; it is raised to the safe minimum.', floorMinor: 'Under 18 the target is never set below your maintenance calories.',
    },
    review: {
      goal: 'Goal', place: 'Place', schedule: 'Schedule', level: 'Experience', targets: 'Daily targets', bmr: 'BMR', tdee: 'TDEE', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
      units: 'Energy in {kcal}, macros in {g}. BMR is resting energy, TDEE is energy with your activity.',
      plan: 'Your plan', perDay: 'a day', needBasics: 'Targets appear once age, height and weight are valid.', fixFirst: 'Some answers are not valid. Go back and fix them to save.',
    },
    note: {
      minor_no_deficit: 'Healthy habits and growth come first at your age, so no calorie deficit is set. Your target is at least your maintenance level (TDEE).',
      floor_applied: 'The target was raised to the minimum safe level for your profile. Eating less than that is not recommended without medical supervision.',
      custom_clamped: 'Your own calorie target was adjusted to stay within safe limits.',
      deficit_capped_at_bmr: 'The deficit was limited so the target does not fall below your resting energy (BMR).',
      carb_floor_raised_kcal: 'To keep a minimum amount of carbohydrate, the calorie target was raised slightly.',
      bmi_adjusted_protein: 'Protein is based on an adjusted weight instead of your full body weight, which is the usual approach at a higher BMI.',
    },
    err: {
      ageRequired: 'Enter your age.', ageTooLow: 'LUPU-FIT is for ages {min} and up, so setup cannot continue.', ageTooHigh: 'Age must be at most {max}.',
      height: 'Height must be between {min} and {max}.', weight: 'Weight must be between {min} and {max}.', days: 'Days per week must be between {min} and {max}.',
      minutes: 'Session length must be between {min} and {max} minutes.', kcal: 'The calorie target must be a whole number between 800 and 6000.',
    },
  },
}, {
  welcome: {
    title: 'ברוכים הבאים ל-LUPU-FIT', lead: 'אימוני כוח, תזונה והתקדמות באפליקציה אחת.',
    deviceData: 'הנתונים נשארים על המכשיר הזה. הם נשמרים במסד הנתונים של הדפדפן ואינם מועלים לשרת.',
    cta: 'הגדרת הפרופיל שלי', legalPrefix: 'בהמשך מאשרים את',
    v1: 'אימון להיום, מותאם לציוד ולזמן', v2: 'יעדי תזונה עם מינימום בטוח מובנה', v3: 'משקל, סטים ושיאים במקום אחד', setupTime: 'ההגדרה לוקחת כשתי דקות.',
  },
  onboarding: {
    done: { title: 'התוכנית מוכנה', lead: 'עוברים לאימון הראשון.' },
    stepLabel: 'שלב', progress: 'התקדמות ההגדרה', startOver: 'התחלה מחדש', save: 'שמירה והתחלה',
    injuryDisclaimer: 'האימונים מותאמים כך שיימנעו מהאזורים שסומנו, אך זה אינו ייעוץ רפואי. עם פציעה או מצב בריאותי, כדאי להתייעץ עם רופא או פיזיותרפיסט לפני האימון.',
    steps: {
      about: { title: 'קצת עליכם', intro: 'הפרטים משמשים לחישוב יעדי התזונה ולשמירה על אימון בטוח.' },
      experience: { title: 'ניסיון ופציעות', intro: 'עוזר לבחור רמת קושי מתאימה ולהימנע מאזורים רגישים.' },
      goal: { title: 'המטרה', intro: 'בוחרים את המטרה העיקרית. אפשר לשנות אותה מאוחר יותר.' },
      training: { title: 'איך מתאמנים', intro: 'איפה, עם איזה ציוד וכמה פעמים.' },
      preferences: { title: 'העדפות', intro: 'השפה והעיצוב מתעדכנים מיד.' },
      nutrition: { title: 'תזונה', intro: 'רמת פעילות, תפריט ואלרגיות משפיעים על היעדים והתפריטים.' },
      review: { title: 'סיכום', intro: 'היעדים המחושבים מוצגים כאן ומתעדכנים עם כל שינוי בתשובות.' },
    },
    about: {
      name: 'שם תצוגה (לא חובה)', nameHint: 'מוצג באפליקציה. אפשר להשאיר ריק.', sex: 'מין', sexHint: 'משמש רק בנוסחת הקלוריות.',
      age: 'גיל', height: 'גובה', weight: 'משקל', range: 'טווח מותר: {min}–{max}',
      minorNotice: 'בגילאי 13 עד 17 האפליקציה בנויה לתמיכה בצמיחה בריאה: ללא גירעון קלורי, עצימות אימון מתונה ופרופיל פרטי. כדאי לשוחח על האימונים עם הורה, אפוטרופוס או מאמן.',
    },
    experience: {
      level: 'ניסיון באימונים', injuries: 'פציעות או אזורים רגישים', noInjuries: 'לא נבחר דבר. אפשר להשאיר ריק אם אין מגבלות.', injuriesHint: 'תרגילים שמעמיסים על האזורים שנבחרו נמנעים ככל האפשר.',
      desc: { beginner: 'חדשים באימוני כוח או חוזרים אחרי הפסקה ארוכה.', intermediate: 'מתאמנים באופן קבוע ומרגישים בנוח עם התרגילים המרכזיים.', advanced: 'שנים של אימון עקבי וטכניקה טובה.' },
    },
    goal: {
      title: 'מטרה עיקרית',
      desc: {
        fat_loss: 'גירעון קלורי מתון עם חלבון גבוה לשמירה על שריר.', muscle_gain: 'עודף קלורי קטן ועומס שעולה בהדרגה.', strength: 'משקלים כבדים יותר עם עודף קל לצורך התאוששות.',
        general_fitness: 'שמירה על המשקל ובניית כושר כללי.', athletic_performance: 'אימונים שתומכים בענף הספורט, עם תזונה ברמת תחזוקה.',
      },
    },
    training: {
      place: 'מקום האימון', equipment: 'ציוד זמין', noGear: 'לא נבחר דבר: האימונים יהיו במשקל גוף בלבד.', gearHint: 'האימונים משתמשים רק בציוד שנבחר.',
      gymHint: 'בחדר כושר מניחים שיש ציוד סטנדרטי.', placeDesc: { gym: 'מכונות ומשקולות במלואן.', home: 'הציוד שיש בבית, גם אם זה רק מזרן.', park: 'מתקנים בחוץ ואימון במשקל גוף.' }, days: 'ימים בשבוע', minutes: 'דקות לאימון',
      sevenDays: 'שבעה ימים אפשריים, אבל התוכנית כוללת לכל היותר {n} ימי אימון עם משקולות ושומרת יום אחד להתאוששות.',
    },
    prefs: {
      language: 'שפה', lang: { he: 'עברית', en: 'English' }, theme: 'עיצוב', themes: { dark: 'כהה', light: 'בהיר', system: 'לפי המערכת' },
      units: 'יחידות', unitNames: { metric: 'מטרי', imperial: 'אימפריאלי' }, unitsHint: 'השאלות כאן במדידה של ק״ג וס״מ.',
    },
    nutrition: {
      activity: 'רמת פעילות יומית', activityDesc: { sedentary: 'עבודה מול מסך, מעט הליכה', light: 'על הרגליים חלק מהיום', moderate: 'עבודה פעילה או הליכה יומית', active: 'עבודה פיזית או ימים פעילים מאוד', very_active: 'עבודת כפיים קשה או שני אימונים ביום' }, diet: 'תפריט', allergies: 'אלרגיות', restrictions: 'הגבלות תזונה',
      custom: 'קביעת יעד קלוריות משלי', customKcal: 'יעד קלוריות', customOff: 'כבוי: היעד מחושב לפי המטרה.',
      floor: 'יעד נמוך מ-{floor} קק״ל אינו מותר בפרופיל הזה ומועלה למינימום הבטוח.', floorMinor: 'מתחת לגיל 18 היעד אף פעם לא נקבע מתחת לקלוריות התחזוקה.',
    },
    review: {
      goal: 'מטרה', place: 'מקום', schedule: 'לוח זמנים', level: 'ניסיון', targets: 'יעדים יומיים', bmr: 'BMR', tdee: 'TDEE', protein: 'חלבון', carbs: 'פחמימות', fat: 'שומן',
      units: 'אנרגיה ב{kcal}, מקרו ב{g}. BMR היא האנרגיה במנוחה, ו-TDEE היא האנרגיה כולל הפעילות.',
      plan: 'התוכנית שלכם', perDay: 'ביום', needBasics: 'היעדים יופיעו כשהגיל, הגובה והמשקל תקינים.', fixFirst: 'חלק מהתשובות אינן תקינות. צריך לחזור ולתקן כדי לשמור.',
    },
    note: {
      minor_no_deficit: 'בגילים האלה הרגלים בריאים וצמיחה קודמים לכול, ולכן לא נקבע גירעון קלורי. היעד הוא לפחות רמת התחזוקה (TDEE).',
      floor_applied: 'היעד הועלה לרמה הבטוחה המינימלית עבור הפרופיל. אכילה בכמות נמוכה יותר אינה מומלצת ללא ליווי רפואי.',
      custom_clamped: 'יעד הקלוריות שנקבע ידנית כוונן כדי להישאר בגבולות בטוחים.',
      deficit_capped_at_bmr: 'הגירעון הוגבל כדי שהיעד לא ירד מתחת לאנרגיית המנוחה (BMR).',
      carb_floor_raised_kcal: 'כדי לשמור על כמות מינימלית של פחמימות, יעד הקלוריות הועלה מעט.',
      bmi_adjusted_protein: 'החלבון מחושב לפי משקל מתוקן ולא לפי משקל הגוף המלא, כפי שמקובל במדד מסת גוף גבוה.',
    },
    err: {
      ageRequired: 'יש להזין גיל.', ageTooLow: 'LUPU-FIT מיועדת לגילאי {min} ומעלה, ולכן אי אפשר להמשיך בהגדרה.', ageTooHigh: 'הגיל המרבי הוא {max}.',
      height: 'הגובה חייב להיות בין {min} ל-{max}.', weight: 'המשקל חייב להיות בין {min} ל-{max}.', days: 'מספר הימים בשבוע חייב להיות בין {min} ל-{max}.',
      minutes: 'משך האימון חייב להיות בין {min} ל-{max} דקות.', kcal: 'יעד הקלוריות חייב להיות מספר שלם בין 800 ל-6000.',
    },
  },
});
