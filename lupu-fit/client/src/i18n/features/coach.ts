import { defineFeature } from '../core.ts';

export default defineFeature({
  coach: {
    title: 'Coach', threads: 'Chats', chat: 'Chat', messages: 'Messages', newChat: 'New chat', noThreads: 'No chats yet. Ask a question to start one.', backToList: 'All chats',
    deleteThread: 'Delete chat {name}', deleteTitle: 'Delete chat', deleteBody: 'The chat “{name}” and its messages will be deleted for good.', renameTitle: 'Rename chat', renameLabel: 'Chat name',
    emptyTitle: 'Ask your coach', emptyHint: 'Answers use only the data you have logged. If something is missing, the coach will say so.', suggested: 'Suggested questions',
    prompts: { workout: 'What should I train today?', protein: 'Is my protein target on track?', weight: 'How is my weight trend?', recovery: 'Any recovery tips?' },
    inputLabel: 'Your message', inputHint: 'Enter sends, Shift+Enter adds a new line', send: 'Send', thinking: 'The coach is answering…',
    copyMessage: 'Copy message', copied: 'Copied', copyFailed: 'Could not copy',
    provider: { rules: 'Rules-based coach', ai: 'AI coach', aiNamed: 'AI coach ({name})', safety: 'Safety response' },
    safety: { title: 'Important', helplines: 'Helplines', call: 'Call', note: 'Automated coach, not a replacement for a professional.' },
    who: 'Coach', chats: 'Chats', openChats: 'Open chats', composerHint: 'Ask about training, food or recovery', typing: 'Typing', today: 'Today', quotaTitle: 'Take a short break', quotaDayTitle: 'That is all for today', draftKept: 'Your message is saved in the box.', currentChat: 'Current chat', untitled: 'New chat', conversations: '{n} chats', limitsLine: 'Up to {m} messages a minute, {d} a day',
    freeTier: 'This AI uses Google’s free tier. Google may use your prompts to improve its products, so avoid sharing sensitive details.',
    quota: { minute: 'Too many messages in a short time. Try again in about {s} seconds.', day: 'You reached today’s message limit. Try again tomorrow.' },
  },
}, {
  coach: {
    title: 'מאמן', threads: 'שיחות', chat: 'שיחה', messages: 'הודעות', newChat: 'שיחה חדשה', noThreads: 'אין שיחות עדיין. אפשר לשאול שאלה כדי להתחיל.', backToList: 'כל השיחות',
    deleteThread: 'מחיקת השיחה {name}', deleteTitle: 'מחיקת שיחה', deleteBody: 'השיחה ”{name}“ וההודעות שבה יימחקו לצמיתות.', renameTitle: 'שינוי שם שיחה', renameLabel: 'שם השיחה',
    emptyTitle: 'שאלה למאמן', emptyHint: 'התשובות מבוססות רק על הנתונים שתיעדתם. אם משהו חסר, המאמן יגיד את זה.', suggested: 'שאלות מוצעות',
    prompts: { workout: 'מה כדאי להתאמן היום?', protein: 'האם יעד החלבון מושג?', weight: 'איך נראית מגמת המשקל שלי?', recovery: 'יש טיפים להתאוששות?' },
    inputLabel: 'ההודעה שלכם', inputHint: 'Enter שולח, Shift+Enter מוסיף שורה חדשה', send: 'שליחה', thinking: 'המאמן עונה…',
    copyMessage: 'העתקת ההודעה', copied: 'הועתק', copyFailed: 'ההעתקה נכשלה',
    provider: { rules: 'מאמן מבוסס כללים', ai: 'מאמן AI', aiNamed: 'מאמן AI ({name})', safety: 'תשובת בטיחות' },
    safety: { title: 'חשוב', helplines: 'קווי סיוע', call: 'חיוג', note: 'מאמן אוטומטי, לא תחליף לאיש מקצוע.' },
    who: 'מאמן', chats: 'שיחות', openChats: 'פתיחת רשימת השיחות', composerHint: 'אפשר לשאול על אימון, אוכל או התאוששות', typing: 'מקליד', today: 'היום', quotaTitle: 'הפסקה קצרה', quotaDayTitle: 'זה הכול להיום', draftKept: 'ההודעה שלכם נשמרה בתיבה.', currentChat: 'שיחה נוכחית', untitled: 'שיחה חדשה', conversations: '{n} שיחות', limitsLine: 'עד {m} הודעות בדקה, {d} ביום',
    freeTier: 'ה-AI הזה פועל במסלול החינמי של Google. ייתכן ש-Google תשתמש בהודעות לשיפור המוצרים שלה, ולכן כדאי להימנע משיתוף פרטים רגישים.',
    quota: { minute: 'יותר מדי הודעות בזמן קצר. כדאי לנסות שוב בעוד כ-{s} שניות.', day: 'הגעתם למכסת ההודעות להיום. כדאי לנסות מחר.' },
  },
});
