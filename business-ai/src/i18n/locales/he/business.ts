/** Business records: fields, stages, active business, create / update / archive (Hebrew). */
const messages = {
  fields: {
    name: 'שם העסק',
    nameHint: 'אפשר לשנות בכל עת.',
    idea: 'הרעיון',
    stage: 'שלב',
    country: 'מדינה',
    currency: 'מטבע',
  },
  stage: {
    idea: 'רעיון',
    planning: 'תכנון',
    launching: 'השקה',
    operating: 'פעילות',
    growing: 'צמיחה',
  },
  active: {
    label: 'העסק הפעיל',
    switch: 'החלפת עסק',
    switched: 'עברת אל {name}',
  },
  create: {
    title: 'עסק חדש',
    submit: 'יצירת העסק',
    created: 'העסק נוצר',
  },
  update: {
    saved: 'השינויים נשמרו',
  },
  archive: {
    action: 'העברה לארכיון',
    confirmTitle: 'להעביר את {name} לארכיון?',
    confirmBody: 'העסק לא יימחק, אבל יוסתר מהרשימות ולא ייספר במכסת העסקים.',
    confirm: 'העברה לארכיון',
    done: 'העסק הועבר לארכיון',
  },
  untitled: 'עסק ללא שם',
} as const;

export default messages;
