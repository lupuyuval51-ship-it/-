import { defineFeature } from '../core.ts';

export default defineFeature({
  pwa: {
    update: { text: 'A new version is available.', reload: 'Reload', later: 'Later' },
  },
}, {
  pwa: {
    update: { text: 'יש גרסה חדשה זמינה.', reload: 'לרענן', later: 'אחר כך' },
  },
});
