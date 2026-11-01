import { defineFeature } from '../core.ts';

export default defineFeature({
  outbox: { title: 'Waiting to sync', queued: 'Saved offline. It will sync when you reconnect.', pending: 'Waiting', rejected: 'Rejected', retry: 'Retry', discard: 'Discard', empty: 'Nothing is waiting to sync.', syncNow: 'Sync now', rejectedHint: 'The server did not accept this change. You can retry or discard it.' },
}, {
  outbox: { title: 'ממתין לסנכרון', queued: 'נשמר במצב לא מקוון. הוא יסונכרן כשהחיבור יחזור.', pending: 'ממתין', rejected: 'נדחה', retry: 'לנסות שוב', discard: 'להסיר', empty: 'שום דבר לא ממתין לסנכרון.', syncNow: 'סנכרון עכשיו', rejectedHint: 'השרת לא קיבל את השינוי הזה. אפשר לנסות שוב או להסיר אותו.' },
});
