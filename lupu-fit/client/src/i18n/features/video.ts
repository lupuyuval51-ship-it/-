import { defineFeature } from '../core.ts';

export default defineFeature({
  video: { needsNetwork: 'The video is available when online', play: 'Play', pause: 'Pause', slow: 'Slow motion', mirror: 'Mirror', fullscreen: 'Full screen', illustration: 'Schematic illustration, not filmed footage' },
}, {
  video: { needsNetwork: 'הסרטון זמין בחיבור לרשת', play: 'הפעלה', pause: 'השהיה', slow: 'האטה', mirror: 'היפוך מראה', fullscreen: 'מסך מלא', illustration: 'המחשה סכמטית, לא צילום' },
});
