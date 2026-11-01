import { defineFeature } from '../core.ts';

export default defineFeature({
  device: { oneTabTitle: 'Open in one tab only', oneTabBody: 'LUPU-FIT stores your data on this device and can only run in one tab. Close the other tab and reload.', bootFailed: 'Could not start the app on this device' },
}, {
  device: { oneTabTitle: 'לפתוח בלשונית אחת בלבד', oneTabBody: 'LUPU-FIT שומרת את הנתונים על המכשיר ויכולה לרוץ רק בלשונית אחת. כדאי לסגור את הלשונית האחרת ולרענן.', bootFailed: 'לא הצלחנו להפעיל את האפליקציה במכשיר הזה' },
});
