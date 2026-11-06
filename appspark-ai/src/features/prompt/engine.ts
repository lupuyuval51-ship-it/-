import { categoryBySlug } from '@/data/categories';
import type { Idea, Locale, PromptOptions } from '@/data/types';

/**
 * Deterministic prompt engine.
 *
 * Turns an idea specification plus studio options into a complete, structured
 * development brief for an AI coding assistant. It is a template engine, not a
 * language model: the output is reproducible and works offline. "Enhance with
 * AI" (server side) can refine it further when a provider is configured.
 */

export const defaultPromptOptions: PromptOptions = {
  targetAi: 'claude',
  platform: 'cross-platform',
  framework: 'expo',
  designDirection: 'minimal-dark',
  complexity: 'standard',
  scope: 'mvp',
  language: 'he',
  backend: 'supabase',
};

interface Strings {
  title: (name: string) => string;
  generatedBy: string;
  target: string;
  platform: string;
  framework: string;
  scope: string;
  complexity: string;
  design: string;
  backend: string;
  roleHeading: string;
  roleBody: string[];
  sections: { a: string; b: string; c: string; d: string; e: string; f: string; g: string; h: string; risks: string; assumptions: string };
  pitch: string;
  overview: string;
  problem: string;
  solution: string;
  usp: string;
  users: string;
  features: string;
  stretch: string;
  nonGoals: string;
  nonGoalsIntro: string;
  frameworkHeading: string;
  backendHeading: string;
  authHeading: string;
  dataHeading: string;
  dataIntro: string;
  integrations: string;
  security: string;
  securityItems: string[];
  structure: string;
  navigation: string;
  navigationBody: (count: number) => string;
  screenPurpose: string;
  screenLayout: string;
  screenStates: string;
  screenStatesBody: string;
  screenNav: string;
  screenNavBody: string;
  palette: string;
  typography: string;
  spacing: string;
  motion: string;
  components: string;
  accessibility: string;
  accessibilityItems: string[];
  rtl: string;
  flows: string;
  validation: string;
  validationItems: string[];
  persistence: string;
  persistenceBody: Record<PromptOptions['backend'], string>;
  monetizationHeading: string;
  monetizationMvp: string;
  monetizationComplete: string;
  milestone: (n: number) => string;
  milestoneVerify: string;
  phase2: string;
  qualityItems: string[];
  completionItems: string[];
  assumptionsBody: string[];
  disclaimer: string;
  aiPreamble: Record<PromptOptions['targetAi'], string[]>;
  frameworkGuide: Record<PromptOptions['framework'], string[]>;
  backendGuide: Record<PromptOptions['backend'], string[]>;
  designGuide: Record<PromptOptions['designDirection'], string[]>;
  platformNote: Record<PromptOptions['platform'], string>;
  complexityNote: Record<PromptOptions['complexity'], string>;
  scopeNote: Record<PromptOptions['scope'], string>;
  labels: {
    targetAi: Record<PromptOptions['targetAi'], string>;
    framework: Record<PromptOptions['framework'], string>;
    designDirection: Record<PromptOptions['designDirection'], string>;
    backend: Record<PromptOptions['backend'], string>;
    platform: Record<PromptOptions['platform'], string>;
    complexity: Record<PromptOptions['complexity'], string>;
    scope: Record<PromptOptions['scope'], string>;
  };
}

const en: Strings = {
  title: (name) => `Build brief: ${name}`,
  generatedBy: 'Generated with AppSpark AI Prompt Studio',
  target: 'Target assistant',
  platform: 'Platform',
  framework: 'Framework',
  scope: 'Scope',
  complexity: 'Feature complexity',
  design: 'Design direction',
  backend: 'Backend',
  roleHeading: '0. Role and working agreement',
  roleBody: [
    'You are a senior full-stack engineer, product designer and QA lead working as one. Build the product described below end to end: real navigation, real data persistence, real error handling. No placeholder-only screens.',
    'Work milestone by milestone (section F). After each milestone, run the type checker, linter and tests, fix what fails, and summarise what is done versus what remains.',
    'Where the brief is silent, make a sensible, conventional choice, write it down under "Assumptions" and keep going. Ask a clarifying question only when a wrong guess would waste more than an hour.',
    'Keep code maintainable: TypeScript strict mode, small composable modules, clear naming, comments only where intent is not obvious.',
  ],
  sections: {
    a: 'A. Product requirements',
    b: 'B. Technical architecture',
    c: 'C. Screen specifications',
    d: 'D. Design system',
    e: 'E. Features and business logic',
    f: 'F. Development plan',
    g: 'G. Quality requirements',
    h: 'H. Completion criteria',
    risks: 'Risks to watch',
    assumptions: 'Assumptions and open questions',
  },
  pitch: 'Elevator pitch',
  overview: 'Overview',
  problem: 'Problem',
  solution: 'Solution',
  usp: 'What makes it different',
  users: 'Target users',
  features: 'Core features (in priority order)',
  stretch: 'Stretch features (only after the core is solid)',
  nonGoals: 'Explicit non-goals for this scope',
  nonGoalsIntro: 'Do not build these now; mention them in the README as future work:',
  frameworkHeading: 'Framework and project setup',
  backendHeading: 'Backend, data and API',
  authHeading: 'Authentication',
  dataHeading: 'Data model',
  dataIntro: 'Create these entities with proper types, indexes on foreign keys, timestamps and per-user access rules:',
  integrations: 'Integrations and third-party services',
  security: 'Security',
  securityItems: [
    'Never ship secrets in client code; every privileged call goes through the server with environment variables.',
    'Validate and sanitise every input on the server, including payload size limits.',
    'Enforce per-user data isolation at the data layer (row-level security or equivalent), not only in the UI.',
    'Rate-limit expensive endpoints and log failures with enough context to debug.',
  ],
  structure: 'Suggested project structure',
  navigation: 'Navigation structure',
  navigationBody: (count) => `The app has ${count} main screens. Use a bottom tab bar for the top-level destinations and stacked screens for details and forms. Every destination must be reachable and every back action must work.`,
  screenPurpose: 'Purpose',
  screenLayout: 'Layout and components',
  screenStates: 'States',
  screenStatesBody: 'Implement loading (skeleton), empty (with a clear next action), error (with retry) and success states.',
  screenNav: 'Navigation',
  screenNavBody: 'Define how the user arrives here and where each primary action leads.',
  palette: 'Colour palette',
  typography: 'Typography',
  spacing: 'Spacing, radii and surfaces',
  motion: 'Motion',
  components: 'Reusable components to build first',
  accessibility: 'Accessibility and responsiveness',
  accessibilityItems: [
    'Touch targets at least 44×44pt; visible focus states on web.',
    'Text contrast at least 4.5:1 for body text; never convey meaning by colour alone.',
    'Respect reduced-motion preferences and dynamic type.',
    'Layouts must work from 360pt-wide phones to tablets; cap content width on large screens.',
  ],
  rtl: 'The primary language is Hebrew: build every layout with logical (start/end) properties so right-to-left rendering is correct, and keep English fully functional.',
  flows: 'User flows',
  validation: 'Validation, loading, errors and empty states',
  validationItems: [
    'Every form validates inline with specific messages; disable submit while a request is in flight.',
    'Every list has a skeleton loading state, an empty state with a next action, and an error state with retry.',
    'Network failures must never lose user input; keep drafts in memory or local storage.',
    'Destructive actions require confirmation and are reversible where feasible.',
  ],
  persistence: 'Data persistence',
  persistenceBody: {
    supabase: 'Persist user data in Postgres through Supabase with row-level security; cache reads client-side (TanStack Query or equivalent) and keep the UI optimistic for quick actions.',
    firebase: 'Persist user data in Firestore with security rules scoped per user; use offline persistence so the app works without connectivity.',
    'custom-node': 'Persist data through a typed REST or tRPC API backed by Postgres (Prisma or Drizzle); the client caches reads and retries failed writes.',
    'local-only': 'Persist everything on the device (SQLite or key-value storage). Data must survive app restarts and have an export/import path.',
    'ai-recommended': 'Choose the simplest persistence layer that satisfies the data model and justify the choice in the README.',
  },
  monetizationHeading: 'Monetization',
  monetizationMvp: 'For the MVP, design the paywall and entitlement model but do not integrate payments unless it is trivial; gate features behind a local entitlement flag that can later be driven by a store or billing provider.',
  monetizationComplete: 'Implement the chosen model end to end (store subscriptions via RevenueCat or Stripe for web), including restore purchases, entitlement sync and a graceful free tier.',
  milestone: (n) => `Milestone ${n}`,
  milestoneVerify: 'Verify: typecheck, lint and tests pass; the milestone is demonstrable on device or in the browser.',
  phase2: 'Expansion phases (after the MVP ships)',
  qualityItems: [
    'Every button and navigation destination performs its real action; no dead ends.',
    'Clear, human error messages; no raw exceptions reaching the user.',
    'Automated tests: unit tests for business logic, at least one integration test per critical flow.',
    'Type checking and linting pass with zero errors.',
    'Reasonable performance: lists virtualised, images optimised, no unnecessary re-renders.',
    'Maintainable code: consistent structure, named constants, no duplicated business rules.',
  ],
  completionItems: [
    'All screens in section C exist and are reachable through real navigation.',
    'All core features in section A work end to end with persisted data.',
    'Data survives an app restart (and a sign-out/sign-in cycle when accounts exist).',
    'Loading, empty and error states are implemented for every data-driven screen.',
    'Authentication protects private data and unauthenticated access is handled gracefully.',
    'Tests, type checking and linting pass; a README documents setup, environment variables and run commands.',
    'Known limitations and unfinished items are listed honestly in the README.',
  ],
  assumptionsBody: [
    'List every assumption you made while building.',
    'List open questions the product owner should answer before launch.',
  ],
  disclaimer: 'This brief is a strong starting point, not a guarantee. Expect iterations: review the generated code, test on real devices and refine.',
  aiPreamble: {
    claude: [
      'Think through the architecture before writing code and keep a short CHECKLIST.md that you update as milestones complete.',
      'Prefer editing existing files over creating parallel versions; keep the project runnable at every step.',
    ],
    codex: [
      'Create an AGENTS.md at the repository root capturing conventions, commands and verification steps so future sessions stay consistent.',
      'Work in small, reviewable commits with descriptive messages; run the test suite before each commit.',
    ],
    gemini: [
      'Produce an implementation plan first, then execute it milestone by milestone, previewing the app in the browser or emulator to verify each step.',
      'Record decisions and verification results in a PLAN.md so progress is auditable.',
    ],
    universal: [
      'Plan before coding, execute in milestones, and verify each milestone with real runs of the app and its tests.',
    ],
  },
  frameworkGuide: {
    expo: [
      'Expo (latest stable SDK) with Expo Router (file-based routing), TypeScript strict mode, React Native Reanimated for motion and expo-image for images.',
      'Support iOS and Android development builds; keep web working if it is cheap.',
      'Use `npx expo install` for every dependency so versions match the SDK; never hand-edit native folders.',
    ],
    'react-native': [
      'React Native (latest stable) with TypeScript, React Navigation (native stack + bottom tabs), Reanimated and Gesture Handler.',
      'Set up absolute imports, ESLint, Prettier and Jest from the start.',
    ],
    nextjs: [
      'Next.js (App Router) with TypeScript, Server Components where it helps, Route Handlers for server logic and Tailwind CSS with a small design-token layer.',
      'Mobile-first responsive layouts; PWA-ready manifest if the product is used on phones.',
    ],
    flutter: [
      'Flutter (latest stable) with Dart null safety, go_router for navigation, Riverpod for state and a theme built from design tokens.',
      'Ship iOS and Android; keep widgets small and testable.',
    ],
    'ai-recommended': [
      'Choose the framework that best fits the platform target and the team’s likely skills; default to Expo + TypeScript for cross-platform mobile and Next.js for web-first products. Justify the choice briefly in the README.',
    ],
  },
  backendGuide: {
    supabase: [
      'Supabase: Postgres with row-level security on every table, Supabase Auth, Storage for files and Edge Functions for any privileged or AI-related logic.',
      'Ship SQL migrations in the repository and a seed script; never put the service-role key in the client.',
    ],
    firebase: [
      'Firebase: Firestore with security rules per user, Firebase Auth, Cloud Functions for privileged logic and Cloud Storage for files.',
      'Keep the data model denormalised for read patterns and document the rules in the repository.',
    ],
    'custom-node': [
      'A TypeScript Node service (Fastify or Hono) with Postgres via Prisma or Drizzle, JWT-based auth, Zod validation and OpenAPI documentation.',
      'Provide docker-compose for local development and migrations in the repository.',
    ],
    'local-only': [
      'No backend. Store data on the device with SQLite (expo-sqlite / Drizzle) or a key-value store; provide export and import of user data as JSON.',
      'Design the data layer behind an interface so a sync backend can be added later without rewriting screens.',
    ],
    'ai-recommended': [
      'Pick the backend that minimises operational effort for this data model and auth needs; prefer managed services with row-level security. Explain the choice in the README.',
    ],
  },
  designGuide: {
    'minimal-dark': [
      'Dark-first palette: background #101113, surface #1A1C1F, elevated #24272B, primary text #F5F4F0, secondary text #96999E, one accent used sparingly for primary actions and selected states. Provide a light theme with the same structure.',
      'Hairline borders, generous negative space, no gradients or glow effects.',
    ],
    editorial: [
      'Editorial feel: warm off-white or deep charcoal backgrounds, a serif display face paired with a humanist sans for body text, strong typographic hierarchy, restrained colour and plenty of whitespace.',
      'Cards read like magazine entries: title, dek, metadata row; avoid heavy chrome.',
    ],
    playful: [
      'Friendly and energetic: rounded shapes, a warm palette with two accent colours, expressive but legible type, springy micro-animations on interactions.',
      'Keep playfulness in motion and colour, not in clutter; respect contrast rules.',
    ],
    enterprise: [
      'Clean and trustworthy: neutral surfaces, a single brand accent, dense but well-aligned data layouts, tables and filters that scale to large datasets.',
      'Prioritise clarity, keyboard support and consistent spacing over decoration.',
    ],
    'ai-recommended': [
      'Propose a design direction that fits the audience and justify it in two sentences; then apply it consistently (tokens, components, motion).',
    ],
  },
  platformNote: {
    ios: 'Primary target: iOS. Follow Human Interface Guidelines for navigation, gestures and system components.',
    android: 'Primary target: Android. Follow Material guidance for navigation, back behaviour and system bars; support edge-to-edge.',
    web: 'Primary target: the web (mobile-first, responsive). Ensure keyboard navigation, SEO basics and shareable URLs.',
    'cross-platform': 'Target iOS and Android from one codebase; keep platform differences (navigation gestures, system bars, haptics) handled where they matter.',
  },
  complexityNote: {
    lean: 'Keep the feature set lean: implement only the core features listed, each fully working.',
    standard: 'Implement the full core feature set with solid polish.',
    rich: 'Implement the core feature set plus the stretch features, with extra polish on motion and empty states.',
  },
  scopeNote: {
    mvp: 'Scope: MVP. Deliver the smallest product that lets a real user complete the main journey end to end.',
    complete: 'Scope: complete product. Deliver the MVP first, then the expansion phases, monetization and growth features.',
  },
  labels: {
    targetAi: { claude: 'Claude', codex: 'Codex', gemini: 'Gemini / Google Antigravity', universal: 'Any AI coding assistant' },
    framework: { expo: 'Expo', 'react-native': 'React Native', nextjs: 'Next.js', flutter: 'Flutter', 'ai-recommended': 'AI recommended' },
    designDirection: { 'minimal-dark': 'Minimal dark', editorial: 'Editorial', playful: 'Playful', enterprise: 'Enterprise', 'ai-recommended': 'AI recommended' },
    backend: { supabase: 'Supabase', firebase: 'Firebase', 'custom-node': 'Custom Node service', 'local-only': 'Local only (no server)', 'ai-recommended': 'AI recommended' },
    platform: { ios: 'iOS', android: 'Android', web: 'Web', 'cross-platform': 'Cross-platform (iOS + Android)' },
    complexity: { lean: 'Lean', standard: 'Standard', rich: 'Rich' },
    scope: { mvp: 'MVP', complete: 'Complete product' },
  },
};

const he: Strings = {
  title: (name) => `בריף פיתוח: ${name}`,
  generatedBy: 'נוצר עם סטודיו הפרומפטים של AppSpark AI',
  target: 'עוזר יעד',
  platform: 'פלטפורמה',
  framework: 'פריימוורק',
  scope: 'היקף',
  complexity: 'מורכבות פיצ׳רים',
  design: 'כיוון עיצובי',
  backend: 'שרת',
  roleHeading: '0. תפקיד והסכם עבודה',
  roleBody: [
    'אתה מהנדס Full-Stack בכיר, מעצב מוצר ומוביל QA באדם אחד. בנה את המוצר המתואר כאן מקצה לקצה: ניווט אמיתי, שמירת נתונים אמיתית, טיפול אמיתי בשגיאות. בלי מסכי placeholder.',
    'עבוד אבן דרך אחרי אבן דרך (סעיף F). אחרי כל אבן דרך הרץ typecheck, lint ובדיקות, תקן מה שנכשל, וסכם מה הושלם ומה נשאר.',
    'כשהבריף שותק, קבל החלטה סבירה ומקובלת, רשום אותה תחת "הנחות" והמשך. שאל שאלת הבהרה רק אם ניחוש שגוי יבזבז יותר משעה.',
    'שמור על קוד תחזוקתי: TypeScript במצב strict, מודולים קטנים וניתנים להרכבה, שמות ברורים, והערות רק כשהכוונה לא מובנת מאליה.',
  ],
  sections: {
    a: 'A. דרישות המוצר',
    b: 'B. ארכיטקטורה טכנית',
    c: 'C. מפרט המסכים',
    d: 'D. מערכת העיצוב',
    e: 'E. פיצ׳רים ולוגיקה עסקית',
    f: 'F. תוכנית פיתוח',
    g: 'G. דרישות איכות',
    h: 'H. קריטריוני סיום',
    risks: 'סיכונים לשים לב אליהם',
    assumptions: 'הנחות ושאלות פתוחות',
  },
  pitch: 'פיץ׳ מעלית',
  overview: 'סקירה',
  problem: 'הבעיה',
  solution: 'הפתרון',
  usp: 'מה מייחד את המוצר',
  users: 'משתמשי היעד',
  features: 'פיצ׳רים מרכזיים (לפי סדר עדיפות)',
  stretch: 'פיצ׳רים משלימים (רק אחרי שהליבה יציבה)',
  nonGoals: 'מה במפורש לא בונים בהיקף הזה',
  nonGoalsIntro: 'לא לבנות את אלה עכשיו; לציין אותם ב-README כעבודה עתידית:',
  frameworkHeading: 'פריימוורק והקמת הפרויקט',
  backendHeading: 'שרת, נתונים ו-API',
  authHeading: 'אימות משתמשים',
  dataHeading: 'מודל הנתונים',
  dataIntro: 'צור את הישויות הבאות עם טיפוסים מדויקים, אינדקסים על מפתחות זרים, חותמות זמן וכללי גישה לפי משתמש:',
  integrations: 'אינטגרציות ושירותי צד שלישי',
  security: 'אבטחה',
  securityItems: [
    'לעולם לא לשלוח סודות בקוד הלקוח; כל קריאה מורשית עוברת דרך השרת עם משתני סביבה.',
    'לוודא ולנקות כל קלט בצד השרת, כולל הגבלת גודל payload.',
    'לאכוף הפרדת נתונים בין משתמשים בשכבת הנתונים (RLS או מקבילה), לא רק ב-UI.',
    'להגביל קצב בנקודות קצה יקרות ולתעד כשלים עם מספיק הקשר לדיבוג.',
  ],
  structure: 'מבנה פרויקט מוצע',
  navigation: 'מבנה הניווט',
  navigationBody: (count) => `לאפליקציה ${count} מסכים מרכזיים. השתמש בסרגל טאבים תחתון ליעדים הראשיים ובמסכי stack לפרטים ולטפסים. כל יעד חייב להיות נגיש וכל פעולת "חזרה" חייבת לעבוד.`,
  screenPurpose: 'מטרה',
  screenLayout: 'פריסה וקומפוננטות',
  screenStates: 'מצבים',
  screenStatesBody: 'ממש מצבי טעינה (skeleton), ריק (עם פעולה ברורה להמשך), שגיאה (עם ניסיון חוזר) והצלחה.',
  screenNav: 'ניווט',
  screenNavBody: 'הגדר איך המשתמש מגיע למסך ולאן מובילה כל פעולה ראשית.',
  palette: 'פלטת צבעים',
  typography: 'טיפוגרפיה',
  spacing: 'ריווח, רדיוסים ומשטחים',
  motion: 'תנועה',
  components: 'קומפוננטות לשימוש חוזר שבונים קודם',
  accessibility: 'נגישות ורספונסיביות',
  accessibilityItems: [
    'אזורי מגע של לפחות 44×44 נקודות; מצבי focus נראים ב-web.',
    'ניגודיות טקסט של לפחות 4.5:1 לטקסט רץ; לא להעביר משמעות בצבע בלבד.',
    'לכבד העדפת reduced motion וגודל טקסט דינמי.',
    'הפריסות חייבות לעבוד מטלפונים ברוחב 360 ועד טאבלטים; להגביל רוחב תוכן במסכים גדולים.',
  ],
  rtl: 'השפה הראשית היא עברית: בנה כל פריסה עם מאפיינים לוגיים (start/end) כך שתצוגת ימין-לשמאל תהיה נכונה, ושמור על אנגלית פונקציונלית לחלוטין.',
  flows: 'תהליכי משתמש',
  validation: 'ולידציה, טעינה, שגיאות ומצבים ריקים',
  validationItems: [
    'כל טופס מבצע ולידציה inline עם הודעות ספציפיות; כפתור השליחה מושבת בזמן בקשה פעילה.',
    'לכל רשימה יש מצב טעינה (skeleton), מצב ריק עם פעולת המשך, ומצב שגיאה עם ניסיון חוזר.',
    'כשל רשת לעולם לא מאבד קלט של המשתמש; שמור טיוטות בזיכרון או באחסון מקומי.',
    'פעולות הרסניות דורשות אישור וניתנות לביטול היכן שאפשר.',
  ],
  persistence: 'שמירת נתונים',
  persistenceBody: {
    supabase: 'שמור נתוני משתמש ב-Postgres דרך Supabase עם RLS; שמור cache לקריאות בצד הלקוח (TanStack Query או מקבילה) והפוך פעולות מהירות לאופטימיות.',
    firebase: 'שמור נתוני משתמש ב-Firestore עם כללי אבטחה לפי משתמש; הפעל offline persistence כדי שהאפליקציה תעבוד גם בלי חיבור.',
    'custom-node': 'שמור נתונים דרך API מוקלד (REST או tRPC) מעל Postgres (Prisma או Drizzle); הלקוח שומר cache לקריאות ומנסה שוב כתיבות שנכשלו.',
    'local-only': 'שמור הכול במכשיר (SQLite או key-value). הנתונים חייבים לשרוד הפעלה מחדש ולכלול ייצוא/ייבוא.',
    'ai-recommended': 'בחר את שכבת השמירה הפשוטה ביותר שעונה על מודל הנתונים, ונמק את הבחירה ב-README.',
  },
  monetizationHeading: 'מודל הכנסה',
  monetizationMvp: 'ב-MVP, תכנן את ה-paywall ואת מודל ההרשאות אך אל תשלב תשלומים אלא אם זה טריוויאלי; חסום פיצ׳רים מאחורי דגל הרשאה מקומי שאפשר לחבר מאוחר יותר לחנות או לספק חיוב.',
  monetizationComplete: 'ממש את המודל שנבחר מקצה לקצה (מנויי חנות דרך RevenueCat או Stripe ל-web), כולל שחזור רכישות, סנכרון הרשאות ושכבה חינמית סבירה.',
  milestone: (n) => `אבן דרך ${n}`,
  milestoneVerify: 'אימות: typecheck, lint ובדיקות עוברים; אבן הדרך ניתנת להדגמה במכשיר או בדפדפן.',
  phase2: 'שלבי הרחבה (אחרי שה-MVP משוחרר)',
  qualityItems: [
    'כל כפתור וכל יעד ניווט מבצעים את הפעולה האמיתית שלהם; אין מבויים סתומים.',
    'הודעות שגיאה ברורות ואנושיות; אף חריגה גולמית לא מגיעה למשתמש.',
    'בדיקות אוטומטיות: בדיקות יחידה ללוגיקה העסקית, ולפחות בדיקת אינטגרציה אחת לכל תהליך קריטי.',
    'typecheck ו-lint עוברים ללא שגיאות.',
    'ביצועים סבירים: רשימות וירטואליות, תמונות מותאמות, בלי רינדורים מיותרים.',
    'קוד תחזוקתי: מבנה עקבי, קבועים בעלי שם, בלי כפילות של כללים עסקיים.',
  ],
  completionItems: [
    'כל המסכים בסעיף C קיימים ונגישים דרך ניווט אמיתי.',
    'כל הפיצ׳רים המרכזיים בסעיף A עובדים מקצה לקצה עם נתונים שנשמרים.',
    'הנתונים שורדים הפעלה מחדש של האפליקציה (וגם יציאה וכניסה מחדש כשיש חשבונות).',
    'מצבי טעינה, ריק ושגיאה ממומשים בכל מסך מבוסס נתונים.',
    'האימות מגן על נתונים פרטיים וגישה ללא התחברות מטופלת בצורה מסודרת.',
    'בדיקות, typecheck ו-lint עוברים; README מתעד התקנה, משתני סביבה ופקודות הרצה.',
    'מגבלות ידועות ופריטים לא גמורים מפורטים בכנות ב-README.',
  ],
  assumptionsBody: ['פרט כל הנחה שקיבלת במהלך הבנייה.', 'פרט שאלות פתוחות שבעל המוצר צריך לענות עליהן לפני השקה.'],
  disclaimer: 'הבריף הזה הוא נקודת פתיחה חזקה, לא הבטחה. צפו לאיטרציות: סקרו את הקוד שנוצר, בדקו על מכשירים אמיתיים ושפרו.',
  aiPreamble: {
    claude: [
      'חשוב על הארכיטקטורה לפני כתיבת קוד ונהל קובץ CHECKLIST.md קצר שמתעדכן עם השלמת אבני דרך.',
      'העדף עריכת קבצים קיימים על פני יצירת גרסאות מקבילות; שמור על פרויקט שרץ בכל שלב.',
    ],
    codex: [
      'צור AGENTS.md בשורש הריפו עם המוסכמות, הפקודות ושלבי האימות, כדי שסשנים עתידיים יישארו עקביים.',
      'עבוד בקומיטים קטנים וברורים; הרץ את חבילת הבדיקות לפני כל קומיט.',
    ],
    gemini: [
      'הפק תחילה תוכנית מימוש, ואז בצע אותה אבן דרך אחרי אבן דרך, עם תצוגה מקדימה בדפדפן או באמולטור לאימות כל שלב.',
      'תעד החלטות ותוצאות אימות ב-PLAN.md כדי שההתקדמות תהיה ניתנת לביקורת.',
    ],
    universal: ['תכנן לפני שאתה מקודד, בצע באבני דרך, ואמת כל אבן דרך עם הרצות אמיתיות של האפליקציה והבדיקות שלה.'],
  },
  frameworkGuide: {
    expo: [
      'Expo (ה-SDK היציב העדכני) עם Expo Router (ניווט מבוסס קבצים), TypeScript במצב strict, React Native Reanimated לתנועה ו-expo-image לתמונות.',
      'תמיכה ב-development builds ל-iOS ול-Android; לשמור על web עובד אם זה זול.',
      'להשתמש ב-`npx expo install` לכל תלות כדי שהגרסאות יתאימו ל-SDK; לא לערוך ידנית תיקיות native.',
    ],
    'react-native': [
      'React Native (היציב העדכני) עם TypeScript, React Navigation (native stack + bottom tabs), Reanimated ו-Gesture Handler.',
      'להגדיר absolute imports, ESLint, Prettier ו-Jest מהיום הראשון.',
    ],
    nextjs: [
      'Next.js (App Router) עם TypeScript, Server Components היכן שזה עוזר, Route Handlers ללוגיקת שרת ו-Tailwind CSS עם שכבת design tokens קטנה.',
      'פריסות רספונסיביות mobile-first; manifest מוכן ל-PWA אם המוצר בשימוש מטלפונים.',
    ],
    flutter: [
      'Flutter (היציב העדכני) עם Dart null safety, go_router לניווט, Riverpod לניהול state ו-theme שנבנה מ-design tokens.',
      'לשחרר ל-iOS ול-Android; לשמור על widgets קטנים וניתנים לבדיקה.',
    ],
    'ai-recommended': [
      'בחר את הפריימוורק שמתאים ביותר ליעד הפלטפורמה ולכישורים הסבירים של הצוות; ברירת מחדל: Expo + TypeScript למובייל חוצה פלטפורמות ו-Next.js למוצרי web. נמק בקצרה ב-README.',
    ],
  },
  backendGuide: {
    supabase: [
      'Supabase: Postgres עם RLS על כל טבלה, Supabase Auth, Storage לקבצים ו-Edge Functions לכל לוגיקה מורשית או קשורה ל-AI.',
      'לשמור migrations ב-SQL בריפו וסקריפט seed; לעולם לא לשים את מפתח ה-service role בלקוח.',
    ],
    firebase: [
      'Firebase: Firestore עם כללי אבטחה לפי משתמש, Firebase Auth, Cloud Functions ללוגיקה מורשית ו-Cloud Storage לקבצים.',
      'לשמור על מודל נתונים מנורמל-הפוך לפי דפוסי קריאה ולתעד את הכללים בריפו.',
    ],
    'custom-node': [
      'שירות Node ב-TypeScript (Fastify או Hono) עם Postgres דרך Prisma או Drizzle, אימות מבוסס JWT, ולידציה עם Zod ותיעוד OpenAPI.',
      'לספק docker-compose לפיתוח מקומי ו-migrations בריפו.',
    ],
    'local-only': [
      'ללא שרת. לשמור נתונים במכשיר עם SQLite (expo-sqlite / Drizzle) או key-value store; לספק ייצוא וייבוא של נתוני המשתמש כ-JSON.',
      'לתכנן את שכבת הנתונים מאחורי ממשק כדי שאפשר יהיה להוסיף סנכרון מאוחר יותר בלי לכתוב מחדש מסכים.',
    ],
    'ai-recommended': ['בחר את השרת שממזער מאמץ תפעולי עבור מודל הנתונים וצורכי האימות; העדף שירותים מנוהלים עם RLS. הסבר את הבחירה ב-README.'],
  },
  designGuide: {
    'minimal-dark': [
      'פלטה כהה כברירת מחדל: רקע #101113, משטח #1A1C1F, משטח מוגבה #24272B, טקסט ראשי #F5F4F0, טקסט משני #96999E, וצבע הדגשה אחד בשימוש מדוד לפעולות ראשיות ולמצבי בחירה. לספק ערכה בהירה באותו מבנה.',
      'גבולות דקיקים, שפע מרחב ריק, בלי גרדיאנטים או אפקטים זוהרים.',
    ],
    editorial: [
      'תחושה מגזינית: רקעים לבנים-חמים או פחם עמוק, גופן serif לכותרות לצד sans הומניסטי לטקסט, היררכיה טיפוגרפית חזקה, צבע מאופק והרבה מרחב לבן.',
      'כרטיסים שנקראים כמו ערכים במגזין: כותרת, שורת משנה, שורת מטא; להימנע מכרום כבד.',
    ],
    playful: [
      'ידידותי ואנרגטי: צורות מעוגלות, פלטה חמה עם שני צבעי הדגשה, טיפוגרפיה אקספרסיבית אך קריאה, מיקרו-אנימציות קפיציות באינטראקציות.',
      'השובבות בתנועה ובצבע, לא בעומס; לכבד כללי ניגודיות.',
    ],
    enterprise: [
      'נקי ואמין: משטחים ניטרליים, צבע מותג אחד, פריסות נתונים צפופות אך מיושרות היטב, טבלאות ופילטרים שמתרחבים לנפחי נתונים גדולים.',
      'להעדיף בהירות, תמיכה במקלדת וריווח עקבי על פני קישוטים.',
    ],
    'ai-recommended': ['הצע כיוון עיצובי שמתאים לקהל ונמק אותו בשני משפטים; ואז יישם אותו בעקביות (tokens, קומפוננטות, תנועה).'],
  },
  platformNote: {
    ios: 'יעד ראשי: iOS. פעל לפי Human Interface Guidelines לניווט, למחוות ולקומפוננטות מערכת.',
    android: 'יעד ראשי: Android. פעל לפי הנחיות Material לניווט, להתנהגות "חזרה" ולסרגלי מערכת; תמוך ב-edge-to-edge.',
    web: 'יעד ראשי: web (mobile-first, רספונסיבי). ודא ניווט במקלדת, יסודות SEO וכתובות URL ניתנות לשיתוף.',
    'cross-platform': 'יעד: iOS ו-Android מקוד אחד; טפל בהבדלי פלטפורמה (מחוות ניווט, סרגלי מערכת, haptics) היכן שהם משמעותיים.',
  },
  complexityNote: {
    lean: 'שמור על סט פיצ׳רים רזה: ממש רק את פיצ׳רי הליבה המפורטים, כל אחד מהם עובד במלואו.',
    standard: 'ממש את סט פיצ׳רי הליבה המלא עם ליטוש רציני.',
    rich: 'ממש את פיצ׳רי הליבה ואת הפיצ׳רים המשלימים, עם ליטוש נוסף בתנועה ובמצבים ריקים.',
  },
  scopeNote: {
    mvp: 'היקף: MVP. ספק את המוצר הקטן ביותר שמאפשר למשתמש אמיתי להשלים את המסע המרכזי מקצה לקצה.',
    complete: 'היקף: מוצר מלא. ספק קודם את ה-MVP, ואז את שלבי ההרחבה, מודל ההכנסה ופיצ׳רי צמיחה.',
  },
  labels: {
    targetAi: { claude: 'Claude', codex: 'Codex', gemini: 'Gemini / Google Antigravity', universal: 'כל עוזר AI לקוד' },
    framework: { expo: 'Expo', 'react-native': 'React Native', nextjs: 'Next.js', flutter: 'Flutter', 'ai-recommended': 'לפי המלצת ה-AI' },
    designDirection: { 'minimal-dark': 'מינימליסטי כהה', editorial: 'מגזיני', playful: 'משחקי', enterprise: 'עסקי', 'ai-recommended': 'לפי המלצת ה-AI' },
    backend: { supabase: 'Supabase', firebase: 'Firebase', 'custom-node': 'שירות Node מותאם', 'local-only': 'מקומי בלבד (ללא שרת)', 'ai-recommended': 'לפי המלצת ה-AI' },
    platform: { ios: 'iOS', android: 'Android', web: 'Web', 'cross-platform': 'חוצה פלטפורמות (iOS + Android)' },
    complexity: { lean: 'רזה', standard: 'סטנדרטי', rich: 'עשיר' },
    scope: { mvp: 'MVP', complete: 'מוצר מלא' },
  },
};

const STRINGS: Record<Locale, Strings> = { en, he };

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function numbered(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n');
}

function toKebab(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'app';
}

function structureFor(framework: PromptOptions['framework'], backend: PromptOptions['backend']): string[] {
  const server = backend === 'supabase' ? ['supabase/migrations/', 'supabase/functions/'] : backend === 'custom-node' ? ['server/src/', 'server/prisma/'] : backend === 'firebase' ? ['firebase/firestore.rules', 'functions/src/'] : [];
  if (framework === 'nextjs') return ['app/ (routes, layouts, route handlers)', 'components/ui/', 'lib/ (data access, validation)', 'styles/tokens.css', ...server];
  if (framework === 'flutter') return ['lib/app/ (router, theme)', 'lib/features/<feature>/', 'lib/core/ (data, services)', 'test/', ...server];
  if (framework === 'react-native') return ['src/navigation/', 'src/screens/', 'src/components/ui/', 'src/features/<feature>/', 'src/services/', ...server];
  return ['src/app/ (Expo Router routes and layouts)', 'src/components/ui/', 'src/features/<feature>/', 'src/lib/ (clients, storage, env)', 'src/theme/ (tokens)', '__tests__/', ...server];
}

export function promptTitle(idea: Idea, options: PromptOptions): string {
  const s = STRINGS[options.language];
  return `${idea.name[options.language]} · ${s.labels.targetAi[options.targetAi]} · ${s.labels.scope[options.scope]}`;
}

export function promptFileName(idea: Idea, options: PromptOptions): string {
  return `appspark-${toKebab(idea.name.en)}-${options.targetAi}-${options.scope}.md`;
}

/** Builds the complete Markdown brief. Pure and deterministic. */
export function buildPrompt(idea: Idea, options: PromptOptions): string {
  const loc = options.language;
  const s = STRINGS[loc];
  const spec = idea.spec;
  const name = idea.name[loc];
  const category = categoryBySlug[idea.category].label[loc];
  const isHebrewProduct = loc === 'he' || idea.tags.some((t) => ['hebrew', 'israel', 'israeli'].includes(t));

  const core = spec.coreFeatures[loc];
  const features = options.complexity === 'lean' ? core.slice(0, Math.max(3, Math.min(4, core.length))) : core;
  const stretch = options.complexity === 'rich' ? spec.expansion[loc].slice(0, 2) : [];
  const nonGoals = options.scope === 'mvp' ? spec.expansion[loc].filter((item) => !stretch.includes(item)) : [];

  const meta = [
    `${s.target}: ${s.labels.targetAi[options.targetAi]}`,
    `${s.platform}: ${s.labels.platform[options.platform]}`,
    `${s.framework}: ${s.labels.framework[options.framework]}`,
    `${s.backend}: ${s.labels.backend[options.backend]}`,
    `${s.design}: ${s.labels.designDirection[options.designDirection]}`,
    `${s.complexity}: ${s.labels.complexity[options.complexity]}`,
    `${s.scope}: ${s.labels.scope[options.scope]}`,
  ];

  const screens = spec.screens
    .map(
      (screen, index) =>
        `### C.${index + 1} ${screen.name[loc]}\n` +
        `- **${s.screenPurpose}:** ${screen.description[loc]}\n` +
        `- **${s.screenLayout}:** ${screen.description[loc]}\n` +
        `- **${s.screenStates}:** ${s.screenStatesBody}\n` +
        `- **${s.screenNav}:** ${s.screenNavBody}`,
    )
    .join('\n\n');

  const milestones = spec.mvpMilestones[loc].map((m, i) => `### ${s.milestone(i + 1)}: ${m}\n- ${s.milestoneVerify}`).join('\n\n');
  const expansionPhases = options.scope === 'complete' ? `\n\n### ${s.phase2}\n${numbered(spec.expansion[loc])}` : '';

  const designTokens = [
    `**${s.palette}:** ${s.designGuide[options.designDirection][0]}`,
    `**${s.typography}:** ${loc === 'he' ? 'שני גופנים לכל היותר (כותרות + טקסט), סולם של 6–7 גדלים, line-height נדיב לעברית ולאנגלית.' : 'At most two typefaces (display + body), a 6–7 step size scale, generous line-height for both Hebrew and Latin text.'}`,
    `**${s.spacing}:** ${loc === 'he' ? 'סולם ריווח של 4pt, רדיוסים 8/12/16/22, משטחים מובחנים לפי גובה (background / surface / elevated) וגבולות דקיקים.' : 'A 4pt spacing scale, radii 8/12/16/22, surfaces distinguished by elevation (background / surface / elevated) and hairline borders.'}`,
    `**${s.motion}:** ${loc === 'he' ? 'מעברים של 150–250ms, מיקרו-אינטראקציות עדינות בלחיצה (scale 0.98), אנימציות כניסה לרשימות; לכבד reduced motion.' : '150–250ms transitions, subtle press feedback (scale 0.98), list entrance animations; honour reduced motion.'}`,
    `**${s.components}:** ${loc === 'he' ? 'Text, Button (primary/secondary/ghost), Chip, Card/Surface, Input, Sheet/Modal, EmptyState, Skeleton, Toast, Tab bar.' : 'Text, Button (primary/secondary/ghost), Chip, Card/Surface, Input, Sheet/Modal, EmptyState, Skeleton, Toast, Tab bar.'}`,
  ];

  const sectionsOut: string[] = [];

  sectionsOut.push(`# ${s.title(name)}\n\n> ${s.generatedBy}\n${bullets(meta)}`);

  sectionsOut.push(`## ${s.roleHeading}\n${bullets([...s.roleBody, ...s.aiPreamble[options.targetAi]])}\n\n${s.scopeNote[options.scope]}\n${s.complexityNote[options.complexity]}\n${s.platformNote[options.platform]}`);

  sectionsOut.push(
    `## ${s.sections.a}\n` +
      `**${s.pitch}:** ${idea.tagline[loc]}\n\n` +
      `**${s.overview}:** ${spec.overview[loc]}\n\n` +
      `**${s.problem}:** ${spec.problem[loc]}\n\n` +
      `**${s.solution}:** ${spec.solution[loc]}\n\n` +
      `**${s.usp}:** ${spec.usp[loc]}\n\n` +
      `**${loc === 'he' ? 'קטגוריה' : 'Category'}:** ${category}\n\n` +
      `### ${s.users}\n${bullets(spec.targetUsers[loc])}\n\n` +
      `### ${s.features}\n${numbered(features)}` +
      (stretch.length ? `\n\n### ${s.stretch}\n${bullets(stretch)}` : '') +
      (nonGoals.length ? `\n\n### ${s.nonGoals}\n${s.nonGoalsIntro}\n${bullets(nonGoals)}` : ''),
  );

  sectionsOut.push(
    `## ${s.sections.b}\n` +
      `### ${s.frameworkHeading}\n${bullets(s.frameworkGuide[options.framework])}\n\n` +
      `### ${s.backendHeading}\n${bullets(s.backendGuide[options.backend])}\n\n${spec.architecture[loc]}\n\n` +
      `### ${s.authHeading}\n${spec.auth[loc]}\n\n` +
      `### ${s.dataHeading}\n${s.dataIntro}\n${bullets(spec.database[loc])}\n\n` +
      `### ${s.integrations}\n${bullets(spec.stack)}\n\n` +
      `### ${s.security}\n${bullets(s.securityItems)}\n\n` +
      `### ${s.structure}\n${bullets(structureFor(options.framework, options.backend))}`,
  );

  sectionsOut.push(`## ${s.sections.c}\n### ${s.navigation}\n${s.navigationBody(spec.screens.length)}\n\n${screens}`);

  sectionsOut.push(
    `## ${s.sections.d}\n${bullets(designTokens)}\n\n${s.designGuide[options.designDirection].slice(1).join('\n')}\n\n### ${s.accessibility}\n${bullets([...s.accessibilityItems, ...(isHebrewProduct ? [s.rtl] : [])])}`,
  );

  sectionsOut.push(
    `## ${s.sections.e}\n` +
      `### ${s.flows}\n${numbered(spec.userJourney[loc])}\n\n` +
      `### ${s.validation}\n${bullets(s.validationItems)}\n\n` +
      `### ${s.persistence}\n${s.persistenceBody[options.backend]}\n\n` +
      `### ${s.monetizationHeading}\n${bullets(spec.monetization[loc])}\n\n${options.scope === 'mvp' ? s.monetizationMvp : s.monetizationComplete}`,
  );

  sectionsOut.push(`## ${s.sections.f}\n${milestones}${expansionPhases}`);

  sectionsOut.push(`## ${s.sections.g}\n${bullets(s.qualityItems)}`);

  sectionsOut.push(`## ${s.sections.h}\n${bullets(s.completionItems.map((item) => `[ ] ${item}`))}`);

  sectionsOut.push(`## ${s.sections.risks}\n${bullets(spec.risks[loc])}`);

  sectionsOut.push(`## ${s.sections.assumptions}\n${bullets(s.assumptionsBody)}\n\n_${s.disclaimer}_`);

  return sectionsOut.join('\n\n');
}

export function promptStats(content: string): { words: number; characters: number } {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return { words, characters: content.length };
}

export const PROMPT_SECTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/** Returns the localized headings so tests and UI can assert structure. */
export function promptSectionHeadings(locale: Locale): string[] {
  const s = STRINGS[locale];
  return PROMPT_SECTION_IDS.map((id) => s.sections[id]);
}
