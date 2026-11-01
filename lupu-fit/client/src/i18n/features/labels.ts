import { defineFeature } from '../core.ts';

/** Display labels for every shared enum. Keyed by the enum value itself so UIs can do t(`label.muscle.${m}`). */
export default defineFeature({
  label: {
    goal: { fat_loss: 'Fat loss', muscle_gain: 'Muscle gain', strength: 'Strength', general_fitness: 'General fitness', athletic_performance: 'Athletic performance' },
    place: { gym: 'Gym', home: 'Home', park: 'Park' },
    mode: { bodyweight: 'Bodyweight', weights: 'Weights' },
    difficulty: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    sex: { male: 'Male', female: 'Female', unspecified: 'Prefer not to say' },
    activity: { sedentary: 'Sedentary', light: 'Lightly active', moderate: 'Moderately active', active: 'Active', very_active: 'Very active' },
    muscle: {
      chest: 'Chest', upper_back: 'Upper back', lats: 'Lats', lower_back: 'Lower back', traps: 'Traps', front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts',
      biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs', obliques: 'Obliques', glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves', adductors: 'Adductors',
    },
    group: { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', core: 'Core', legs: 'Legs' },
    focus: {
      chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', biceps: 'Biceps', triceps: 'Triceps', core: 'Core', legs: 'Legs', glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings',
      full_body: 'Full body', upper: 'Upper body', lower: 'Lower body', push: 'Push', pull: 'Pull',
    },
    style: { straight: 'Strength', superset: 'Superset', circuit: 'Circuit', pyramid: 'Pyramid', density: 'Density' },
    equipment: {
      none: 'No equipment', barbell: 'Barbell', dumbbell: 'Dumbbells', kettlebell: 'Kettlebell', machine: 'Machines', cable: 'Cable station', bench: 'Bench', squat_rack: 'Squat rack', pullup_bar: 'Pull-up bar',
      dip_station: 'Dip station', resistance_band: 'Resistance bands', trx: 'TRX / straps', medicine_ball: 'Medicine ball', swiss_ball: 'Swiss ball', ab_wheel: 'Ab wheel', jump_rope: 'Jump rope',
      box: 'Box / step', rings: 'Rings', parallettes: 'Parallettes', sled: 'Sled', landmine: 'Landmine', ez_bar: 'EZ bar', foam_roller: 'Foam roller',
    },
    category: { weight_reps: 'Weighted', bodyweight_reps: 'Bodyweight', duration: 'Timed', plyometric: 'Plyometric', cardio: 'Cardio', mobility: 'Mobility', stretch: 'Stretch', carry: 'Carry', isometric: 'Isometric hold' },
    injury: { neck: 'Neck', shoulder: 'Shoulder', elbow: 'Elbow', wrist: 'Wrist', lower_back: 'Lower back', hip: 'Hip', knee: 'Knee', ankle: 'Ankle' },
    allergen: { dairy: 'Dairy', egg: 'Egg', peanut: 'Peanut', tree_nut: 'Tree nuts', sesame: 'Sesame', soy: 'Soy', gluten: 'Gluten', fish: 'Fish', shellfish: 'Shellfish' },
    diet: { omnivore: 'Everything', vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', kosher: 'Kosher' },
    restriction: { no_pork: 'No pork', no_shellfish: 'No shellfish', halal: 'Halal', kosher: 'Kosher', low_sodium: 'Low sodium', lactose_free: 'Lactose free' },
    slot: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' },
    readiness: { normal: 'Ready to train', easier: 'Take it easier', rest: 'Rest or light movement' },
    sport: {
      none: 'None', soccer: 'Soccer', basketball: 'Basketball', volleyball: 'Volleyball', racquet: 'Tennis / Padel', running: 'Running', cycling: 'Cycling', swimming: 'Swimming',
      combat_striking: 'Boxing / Kickboxing / Striking', grappling: 'Judo / BJJ / Wrestling', climbing: 'Climbing', surfing: 'Surfing', calisthenics: 'Calisthenics', general: 'General',
    },
    variant: { bodyweight: 'No gear', gear: 'With gear', gentle: 'Gentle' },
    ageBucket: { minor: 'Under 18', adult: '18–49', master: '50–64', senior: '65+' },
    achievement: {
      first_workout: 'First workout', five_workouts: '5 workouts', twenty_five_workouts: '25 workouts', first_pr: 'First personal record', five_prs: '5 personal records', two_week_streak: 'Two-week streak',
      month_streak: 'Four-week streak', weekly_goal: 'Weekly goal hit', first_food_log: 'First food log', seven_food_days: '7 days of food logs', protein_week: 'Protein target, 7 days',
      first_weigh_in: 'First weigh-in', first_finisher: 'First sport finisher', first_coach_chat: 'First coach chat',
    },
    fidelity: { specific: 'Illustration', approximate: 'Approximate illustration', generic: 'General illustration' },
  },
}, {
  label: {
    goal: { fat_loss: 'ירידה בשומן', muscle_gain: 'עלייה במסה', strength: 'כוח', general_fitness: 'כושר כללי', athletic_performance: 'ביצועים ספורטיביים' },
    place: { gym: 'חדר כושר', home: 'בית', park: 'פארק' },
    mode: { bodyweight: 'משקל גוף', weights: 'משקולות' },
    difficulty: { beginner: 'מתחילים', intermediate: 'בינוני', advanced: 'מתקדמים' },
    sex: { male: 'גבר', female: 'אישה', unspecified: 'מעדיפים לא לציין' },
    activity: { sedentary: 'יושבני', light: 'פעילות קלה', moderate: 'פעילות בינונית', active: 'פעילות גבוהה', very_active: 'פעילות גבוהה מאוד' },
    muscle: {
      chest: 'חזה', upper_back: 'גב עליון', lats: 'לטיסימוס', lower_back: 'גב תחתון', traps: 'טרפז', front_delts: 'כתף קדמית', side_delts: 'כתף אמצעית', rear_delts: 'כתף אחורית',
      biceps: 'יד קדמית', triceps: 'יד אחורית', forearms: 'אמות', abs: 'בטן', obliques: 'אלכסונים', glutes: 'ישבן', quads: 'ארבע ראשי', hamstrings: 'ירך אחורית', calves: 'תאומים', adductors: 'מקרבים',
    },
    group: { chest: 'חזה', back: 'גב', shoulders: 'כתפיים', arms: 'זרועות', core: 'ליבה', legs: 'רגליים' },
    focus: {
      chest: 'חזה', back: 'גב', shoulders: 'כתפיים', arms: 'זרועות', biceps: 'יד קדמית', triceps: 'יד אחורית', core: 'בטן וליבה', legs: 'רגליים', glutes: 'ישבן', quads: 'ארבע ראשי', hamstrings: 'ירך אחורית',
      full_body: 'כל הגוף', upper: 'פלג גוף עליון', lower: 'פלג גוף תחתון', push: 'דחיפה', pull: 'משיכה',
    },
    style: { straight: 'כוח', superset: 'סופר-סט', circuit: 'מעגל', pyramid: 'פירמידה', density: 'צפיפות' },
    equipment: {
      none: 'בלי ציוד', barbell: 'מוט', dumbbell: 'משקולות יד', kettlebell: 'קטלבל', machine: 'מכונות', cable: 'כבלים', bench: 'ספסל', squat_rack: 'מתקן סקווט', pullup_bar: 'מתח',
      dip_station: 'מקבילים', resistance_band: 'גומיות התנגדות', trx: 'TRX / רצועות', medicine_ball: 'כדור כוח', swiss_ball: 'כדור פיזיו', ab_wheel: 'גלגל בטן', jump_rope: 'חבל קפיצה',
      box: 'קופסת קפיצה / מדרגה', rings: 'טבעות', parallettes: 'פאראלטס', sled: 'מזחלת', landmine: 'לנדמיין', ez_bar: 'מוט EZ', foam_roller: 'גליל עיסוי',
    },
    category: { weight_reps: 'עם משקל', bodyweight_reps: 'משקל גוף', duration: 'לפי זמן', plyometric: 'פליומטרי', cardio: 'אירובי', mobility: 'ניידות', stretch: 'מתיחה', carry: 'נשיאה', isometric: 'החזקה סטטית' },
    injury: { neck: 'צוואר', shoulder: 'כתף', elbow: 'מרפק', wrist: 'שורש כף היד', lower_back: 'גב תחתון', hip: 'ירך', knee: 'ברך', ankle: 'קרסול' },
    allergen: { dairy: 'חלב', egg: 'ביצים', peanut: 'בוטנים', tree_nut: 'אגוזי עץ', sesame: 'שומשום', soy: 'סויה', gluten: 'גלוטן', fish: 'דגים', shellfish: 'פירות ים' },
    diet: { omnivore: 'הכול', vegetarian: 'צמחוני', vegan: 'טבעוני', pescatarian: 'פסקטריאני', kosher: 'כשר' },
    restriction: { no_pork: 'בלי חזיר', no_shellfish: 'בלי פירות ים', halal: 'חלאל', kosher: 'כשר', low_sodium: 'דל נתרן', lactose_free: 'ללא לקטוז' },
    slot: { breakfast: 'ארוחת בוקר', lunch: 'ארוחת צהריים', dinner: 'ארוחת ערב', snack: 'נשנוש' },
    readiness: { normal: 'מוכנים לאימון', easier: 'כדאי אימון קל יותר', rest: 'מנוחה או תנועה קלה' },
    sport: {
      none: 'ללא', soccer: 'כדורגל', basketball: 'כדורסל', volleyball: 'כדורעף', racquet: 'טניס / פאדל', running: 'ריצה', cycling: 'אופניים', swimming: 'שחייה',
      combat_striking: 'איגרוף / קיקבוקס / קרב מגע', grappling: 'ג׳ודו / BJJ / היאבקות', climbing: 'טיפוס', surfing: 'גלישה', calisthenics: 'קליסטניקס', general: 'כללי',
    },
    variant: { bodyweight: 'בלי ציוד', gear: 'עם ציוד', gentle: 'עדין' },
    ageBucket: { minor: 'מתחת לגיל 18', adult: '18–49', master: '50–64', senior: '65 ומעלה' },
    achievement: {
      first_workout: 'אימון ראשון', five_workouts: '5 אימונים', twenty_five_workouts: '25 אימונים', first_pr: 'שיא אישי ראשון', five_prs: '5 שיאים אישיים', two_week_streak: 'רצף של שבועיים',
      month_streak: 'רצף של 4 שבועות', weekly_goal: 'יעד שבועי הושג', first_food_log: 'תיעוד תזונה ראשון', seven_food_days: '7 ימי תיעוד תזונה', protein_week: 'יעד חלבון, 7 ימים',
      first_weigh_in: 'שקילה ראשונה', first_finisher: 'סיומת ספורט ראשונה', first_coach_chat: 'שיחה ראשונה עם המאמן',
    },
    fidelity: { specific: 'המחשה', approximate: 'המחשה מקורבת', generic: 'המחשה כללית' },
  },
});
