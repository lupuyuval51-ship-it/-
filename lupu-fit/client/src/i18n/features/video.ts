import { defineFeature } from '../core.ts';

export default defineFeature({
  video: { needsNetwork: 'The video is available when online', play: 'Play', pause: 'Pause', slow: 'Slow motion', mirror: 'Mirror', fullscreen: 'Full screen', clearCache: 'Clear video cache', cacheSize: 'Video cache', wifiOnly: 'Play videos on Wi-Fi only', illustration: 'Schematic illustration, not filmed footage' },
}, {
  video: { needsNetwork: 'הסרטון זמין בחיבור לרשת', play: 'הפעלה', pause: 'השהיה', slow: 'האטה', mirror: 'היפוך מראה', fullscreen: 'מסך מלא', clearCache: 'ניקוי מטמון סרטונים', cacheSize: 'מטמון סרטונים', wifiOnly: 'ניגון סרטונים ב-Wi-Fi בלבד', illustration: 'המחשה סכמטית, לא צילום' },
});
