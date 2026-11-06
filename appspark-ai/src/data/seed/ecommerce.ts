import type { Idea } from '../types';

/**
 * E-commerce – selling, buying, inventory and marketplaces. Every idea here
 * changes the unit of commerce (a budget times employees, a chat message, a
 * whole apartment, "what arrived today", a single unit's real margin) rather
 * than being another storefront. Monetization lists are possibilities, never
 * promises.
 */
export const ideas: Idea[] = [
  {
    id: 'shai',
    name: { he: 'Shai – שי לחג מיצרנים מקומיים', en: 'Shai' },
    tagline: {
      he: 'זירת B2B לשי לחג מיצרנים ישראלים קטנים: מגדירים תקציב לעובד ומספר עובדים, היצרנים מרכיבים את החבילה, וחשבונית מס אחת סוגרת את ההזמנה.',
      en: 'B2B holiday gifting from small Israeli producers: set a per-employee budget and headcount, makers assemble the box, and one tax invoice closes the order.',
    },
    category: 'ecommerce',
    secondaryCategories: ['business', 'lifestyle'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 14 },
    budget: 'medium',
    businessModel: 'marketplace',
    platforms: ['web'],
    audience: ['businesses', 'teams'],
    tags: ['gifting', 'b2b', 'marketplace', 'holiday', 'local producers', 'bulk orders', 'invoicing', 'israel'],
    identity: { hue: 58, glyph: 'Sh', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Shai היא זירת מסחר שמחברת בין חברות שקונות שי לחג לעובדים לבין יצרנים קטנים – יקבים, מחלבות בוטיק, קדרים, קונדיטוריות. במקום לחפש ספק בגוגל ולנהל עשרות שיחות, מנהלת המשרד פותחת הזמנה אחת: תקציב לעובד, מספר עובדים, מועד אספקה, וכתובת אחת או משלוח לבתי העובדים. המערכת מציעה חבילות מוכנות או מאפשרת להרכיב חבילה מכמה יצרנים, מציגה סימוני כשרות ואלרגנים ברורים, ומחשבת מחיר סופי כולל מע"מ ומשלוח. היצרנים מקבלים הזמנה מרוכזת עם כמויות ותאריכי ייצור, ו-Shai דואגת לאריזה, לאיסוף ולחשבונית המס האחת שהנהלת החשבונות דורשת. שני חלונות בשנה – ראש השנה ופסח – והמוצר בנוי סביבם.',
        en: 'Shai is a marketplace connecting companies that buy employee holiday gifts with small producers – wineries, boutique dairies, potters, patisseries. Instead of googling a supplier and juggling dozens of calls, the office manager opens one order: budget per employee, headcount, delivery date, and a single address or home delivery to each employee. The system proposes ready-made boxes or lets her compose one from several makers, shows clear kosher and allergen labels, and calculates a final price including VAT and shipping. Producers receive one consolidated order with quantities and production dates, and Shai handles packing, collection and the single tax invoice that accounting insists on. Two windows a year – Rosh Hashanah and Passover – and the product is built around them.',
      },
      problem: {
        he: 'שי לחג הוא טקס שחוזר פעמיים בשנה בהרבה חברות בישראל, אבל הקנייה עצמה מסורבלת: ספקים גדולים מציעים את אותם סלים גנריים, יצרנים קטנים לא ערוכים להזמנה של 300 יחידות עם חשבונית מס, ומנהלת המשרד מנהלת הכול בטבלת אקסל ובשיחות טלפון. התוצאה: מתנה שאף אחד לא זוכר, ויצרנים מקומיים שלא מגיעים לשוק הזה.',
        en: 'Holiday gifting is a ritual that repeats twice a year in many Israeli companies, yet the purchase is clumsy: big suppliers offer the same generic baskets, small producers are not set up for a 300-unit order with a tax invoice, and the office manager runs everything through a spreadsheet and phone calls. The result: a gift nobody remembers, and local makers shut out of this market.',
      },
      solution: {
        he: 'הזמנה אחת שמוגדרת לפי תקציב לעובד ומספר עובדים, קטלוג של חבילות מיצרנים קטנים עם סימוני כשרות ואלרגנים, הרכבה של חבילה מכמה יצרנים, ולוגיסטיקה מרוכזת: איסוף מהיצרנים, אריזה, משלוח לכתובת אחת או לבתי העובדים, וחשבונית מס אחת. היצרן רואה רק כמויות ומועדים – לא מתעסק בגבייה ובמשלוחים.',
        en: 'One order defined by budget per employee and headcount, a catalogue of boxes from small producers with kosher and allergen labels, mix-and-match across makers, and consolidated logistics: collection from the producers, packing, delivery to one address or to employees’ homes, and a single tax invoice. The producer sees only quantities and dates – no collections, no shipping headaches.',
      },
      usp: {
        he: 'יחידת הרכישה היא "תקציב × עובדים" ולא "מוצר", ולכן הקטלוג, התמחור והלוגיסטיקה בנויים להזמנות מרוכזות עם חשבונית אחת – בדיוק מה שהנהלת חשבונות דורשת ומה שיצרן קטן לא יכול לספק לבד.',
        en: 'The unit of purchase is "budget × employees", not "a product", so the catalogue, pricing and logistics are built for consolidated orders with one invoice – exactly what accounting demands and what a small producer cannot deliver alone.',
      },
      targetUsers: {
        he: ['מנהלות משרד ומנהלי רווחה בחברות של 30 עד 500 עובדים', 'יצרנים קטנים: יקבים, מחלבות בוטיק, קדרים, קונדיטוריות', 'סוכנויות שמארגנות אירועי חברה ומחפשות מתנה מקומית'],
        en: ['Office managers and wellbeing leads at companies of 30 to 500 employees', 'Small producers: wineries, boutique dairies, potters, patisseries', 'Agencies that run company events and want a local gift'],
      },
      coreFeatures: {
        he: [
          'פתיחת הזמנה לפי תקציב לעובד, מספר עובדים ומועד אספקה',
          'קטלוג חבילות מיצרנים קטנים עם סימוני כשרות, אלרגנים ואזור ייצור',
          'הרכבת חבילה מכמה יצרנים עם חישוב מחיר סופי כולל מע"מ ומשלוח',
          'הצעת מחיר להורדה ואישור של הנהלת החשבונות לפני התשלום',
          'משלוח לכתובת אחת, או העלאת רשימת עובדים למשלוח לבתים',
          'לוח ייצור ליצרן: כמויות, תאריכי איסוף וסטטוס אריזה',
          'חשבונית מס אחת לכל ההזמנה, גם כשמעורבים חמישה יצרנים',
        ],
        en: [
          'Open an order by budget per employee, headcount and delivery date',
          'A catalogue of boxes from small producers with kosher, allergen and region labels',
          'Compose a box from several makers with a final price including VAT and shipping',
          'A downloadable quote for accounting to approve before payment',
          'Delivery to one address, or upload an employee list for home delivery',
          'A production board for the producer: quantities, pickup dates and packing status',
          'One tax invoice for the whole order, even with five producers involved',
        ],
      },
      screens: [
        { name: { he: 'הזמנה חדשה', en: 'New order' }, description: { he: 'שלושה שדות גדולים – תקציב לעובד, מספר עובדים, מועד – ומתחתם הערכת מחיר שמתעדכנת בזמן אמת.', en: 'Three large fields – budget per employee, headcount, date – with a live price estimate updating beneath them.' } },
        { name: { he: 'קטלוג', en: 'Catalogue' }, description: { he: 'כרטיסי חבילות עם תמונה, יצרן, מחיר ליחידה וסימוני כשרות; סינון לפי תקציב, אזור ואלרגנים.', en: 'Box cards with photo, maker, unit price and kosher marks; filters by budget, region and allergens.' } },
        { name: { he: 'בונה החבילה', en: 'Box builder' }, description: { he: 'גרירת פריטים מיצרנים שונים לתוך קופסה אחת, עם מד תקציב שמראה כמה נשאר לעובד.', en: 'Drag items from different makers into one box, with a budget meter showing what is left per employee.' } },
        { name: { he: 'הצעת מחיר ואישור', en: 'Quote & approval' }, description: { he: 'סיכום ההזמנה כמסמך להורדה, שליחה לאישור מנהל, וכפתור תשלום שנפתח רק אחרי האישור.', en: 'The order summary as a downloadable document, a send-for-approval action, and a pay button that unlocks only after approval.' } },
        { name: { he: 'משלוחים', en: 'Delivery' }, description: { he: 'בחירה בין כתובת אחת לרשימת עובדים, העלאת קובץ, ואימות כתובות עם סימון שורות בעייתיות.', en: 'Choose one address or an employee list, upload a file, and validate addresses with problem rows flagged.' } },
        { name: { he: 'לוח יצרן', en: 'Producer board' }, description: { he: 'ההזמנות הקרובות של היצרן לפי תאריך איסוף, כמויות לכל פריט, וסימון "ארוז" לכל משלוח.', en: 'The producer’s upcoming orders by pickup date, quantities per item, and a "packed" toggle per shipment.' } },
        { name: { he: 'מעקב הזמנה', en: 'Order tracking' }, description: { he: 'ציר זמן מאישור ועד מסירה, עדכוני סטטוס מהיצרנים, וחשבונית המס להורדה בסיום.', en: 'A timeline from approval to delivery, status updates from producers, and the tax invoice to download at the end.' } },
      ],
      userJourney: {
        he: [
          'חודש לפני ראש השנה מנהלת המשרד פותחת הזמנה: 120 ש"ח לעובד, 180 עובדים, משלוח למשרד',
          'מסננת לפי כשר ובלי אגוזים ומרכיבה חבילה: יין מיקב בגליל, דבש ממושב וכוס קרמיקה',
          'מורידה הצעת מחיר, סמנכ"ל הכספים מאשר, והתשלום מתבצע בכרטיס החברה',
          'שלושת היצרנים מקבלים לוח ייצור עם כמויות ותאריך איסוף',
          'החבילות נארזות במרכז אחד ומגיעות למשרד יומיים לפני החג',
          'חשבונית מס אחת נכנסת להנהלת החשבונות וההזמנה נשמרת כתבנית לפסח',
        ],
        en: [
          'A month before Rosh Hashanah the office manager opens an order: 120 shekels per employee, 180 employees, delivery to the office',
          'Filters for kosher and nut-free and composes a box: wine from a Galilee winery, honey from a moshav, a ceramic cup',
          'Downloads the quote, the CFO approves, and payment goes through on the company card',
          'The three producers each receive a production board with quantities and a pickup date',
          'Boxes are packed at one hub and arrive at the office two days before the holiday',
          'One tax invoice lands in accounting and the order is saved as a template for Passover',
        ],
      },
      uxDirection: {
        he: 'ממשק ווב שקט ועסקי: הרבה רווח לבן, טיפוגרפיה ברורה ותמונות גדולות של המוצרים, כי מתנה נמכרת דרך העיניים. שלושת השדות של ההזמנה נעוצים תמיד בראש המסך, ומד התקציב לעובד מלווה כל פעולה. צד היצרן מינימלי בכוונה – לוח אחד, בלי הגדרות מיותרות, כי מדובר באנשים שעובדים עם הידיים ולא מול מסך.',
        en: 'A calm, businesslike web interface: plenty of white space, clear typography and large product photos, because a gift is sold through the eyes. The three order fields stay pinned at the top of the screen, and the per-employee budget meter follows every action. The producer side is deliberately minimal – one board, no unnecessary settings, because these are people who work with their hands, not in front of a screen.',
      },
      architecture: {
        he: 'אפליקציית Next.js על Vercel עם Supabase לאימות, לנתונים ולאחסון תמונות. שלושה סוגי משתמשים – חברה, יצרן, מפעיל – עם הרשאות לפי ארגון שנאכפות ב-RLS. התמחור מחושב בצד השרת: עלות פריטים, אריזה, משלוח ומע"מ, והצעת המחיר נשמרת כמסמך PDF. התשלום עובר דרך ספק סליקה ישראלי שמנפיק את חשבונית המס, והזמנה אחת מתפצלת להזמנות משנה לכל יצרן. אימות כתובות ועיבוד קובץ העובדים רצים ב-Edge Function.',
        en: 'A Next.js app on Vercel with Supabase for auth, data and image storage. Three user types – company, producer, operator – with organisation-level permissions enforced in RLS. Pricing is computed server-side: item cost, packing, shipping and VAT, with the quote stored as a PDF document. Payment goes through an Israeli payment provider that issues the tax invoice, and one order fans out into sub-orders per producer. Address validation and employee-file processing run in an Edge Function.',
      },
      stack: ['Next.js', 'Vercel', 'Supabase', 'Supabase Storage', 'Supabase Edge Functions', 'Tailwind CSS', 'Cardcom or Meshulam', 'Resend'],
      database: {
        he: ['organizations – חברה או יצרן, סוג, פרטי חשבונית', 'members – משתמשים, תפקידים, ארגון', 'products – פריט של יצרן, מחיר, כשרות, אלרגנים, זמינות לפי חג', 'boxes – חבילה מורכבת, פריטים, מחיר ליחידה', 'orders – הזמנה, תקציב לעובד, כמות, מועד, סטטוס, חשבונית', 'sub_orders – חלקו של כל יצרן בהזמנה, כמויות, תאריך איסוף', 'shipments – יעד, כתובת, מצב מסירה', 'quotes – הצעות מחיר שנשלחו לאישור'],
        en: ['organizations – company or producer, type, invoicing details', 'members – users, roles, organisation', 'products – a producer’s item, price, kosher status, allergens, holiday availability', 'boxes – a composed box, items, unit price', 'orders – order, budget per employee, quantity, date, status, invoice', 'sub_orders – each producer’s share of the order, quantities, pickup date', 'shipments – destination, address, delivery state', 'quotes – quotes sent for approval'],
      },
      auth: {
        he: 'כניסה עם Google Workspace או Microsoft לחברות, ואימייל עם קישור קסם ליצרנים. כל ארגון רואה רק את ההזמנות שלו; מפעילי הפלטפורמה רואים הכול. רשימות עובדים עם כתובות בית הן מידע אישי – נשמרות מוצפנות ונמחקות אחרי המסירה.',
        en: 'Google Workspace or Microsoft sign-in for companies, and email magic links for producers. Each organisation sees only its own orders; platform operators see everything. Employee lists with home addresses are personal data – stored encrypted and deleted after delivery.',
      },
      monetization: {
        he: ['עמלה על כל הזמנה שנגבית מהיצרן, לא מהחברה', 'מיקום מקודם בקטלוג ליצרנים בעונת החגים', 'אפשרות "הלוגו שלכם על הקופסה" עם אריזה ממותגת בתשלום נוסף'],
        en: ['A commission on every order, charged to the producer rather than the company', 'Promoted catalogue placement for producers in the holiday season', 'A "your logo on the box" branded-packaging option at an extra charge'],
      },
      mvpMilestones: {
        he: ['קטלוג יצרנים עם חבילות מוכנות וסינון כשרות ואלרגנים', 'הזמנה לפי תקציב ומספר עובדים עם חישוב מחיר בצד השרת', 'הצעת מחיר כ-PDF ואישור מנהל', 'תשלום וחשבונית מס דרך ספק סליקה', 'לוח יצרן עם כמויות ותאריכי איסוף', 'משלוח לכתובת אחת; משלוח לבתים בשלב הבא'],
        en: ['Producer catalogue with ready-made boxes and kosher/allergen filters', 'Order by budget and headcount with server-side pricing', 'Quote as PDF and manager approval', 'Payment and tax invoice through a payment provider', 'Producer board with quantities and pickup dates', 'Delivery to one address; home delivery in the next phase'],
      },
      risks: {
        he: ['העסק עונתי מאוד – רוב ההכנסה נוחתת בשני חלונות קצרים, והצוות צריך לשרוד את החודשים שביניהם', 'איסוף מכמה יצרנים ואריזה במרכז אחד הם הלב של המוצר, ואי אפשר לבנות אותם בקוד בלבד', 'יצרן קטן שלא עומד בכמויות מפיל הזמנה שלמה – חובה גיבוי ותקרת כמות לכל יצרן'],
        en: ['The business is highly seasonal – most revenue lands in two short windows, and the team must survive the months in between', 'Collecting from several producers and packing at one hub is the heart of the product and cannot be built in code alone', 'A small producer who misses quantities sinks an entire order – backups and per-producer quantity caps are a must'],
      },
      expansion: {
        he: ['מתנות לאורך השנה: ימי הולדת לעובדים ומתנות ללקוחות', 'חנות פנימית שבה כל עובד בוחר בעצמו מתנה מתוך התקציב', 'פתיחת הקטלוג לקונים פרטיים אחרי שהצד העסקי יציב'],
        en: ['Year-round gifting: employee birthdays and client gifts', 'An internal shop where each employee picks their own gift within the budget', 'Opening the catalogue to private buyers once the business side is stable'],
      },
    },
  },
  {
    id: 'kupah',
    name: { he: 'Kupah – הזמנות מהצ׳אט ועד המשלוח', en: 'Kupah' },
    tagline: {
      he: 'לעסקים קטנים שמוכרים באינסטגרם ובוואטסאפ: הודעה מלקוחה הופכת להזמנה מסודרת עם סטטוס תשלום, אריזה ומשלוח – במקום פתקים וצ׳אטים שנעלמים.',
      en: 'For small shops selling on Instagram and WhatsApp: a customer’s message becomes a proper order with payment, packing and shipping status – no more lost chats.',
    },
    category: 'ecommerce',
    secondaryCategories: ['business', 'productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['ios', 'android'],
    audience: ['businesses', 'creators'],
    tags: ['orders', 'whatsapp', 'instagram', 'small business', 'inventory', 'packing', 'dm commerce', 'saas'],
    identity: { hue: 196, glyph: 'Ku', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Kupah היא מערכת ההזמנות של עסקים קטנים שאין להם חנות אונליין – מעצבת תכשיטים שמוכרת בסטוריז, מאפייה ביתית שמקבלת הזמנות בוואטסאפ, חנות בגדים שמעלה פוסט ועונה לעשרות הודעות. במקום לנהל הכול בפתקים ובצ׳אטים, המוכרת משתפת את הודעת הלקוחה לאפליקציה (או מקלידה בעצמה), והמערכת מזהה פריטים מהקטלוג, כמויות, כתובת ואופן משלוח ופותחת הזמנה. לכל הזמנה יש סטטוס אחד ברור – ממתינה לתשלום, שולמה, נארזה, נשלחה – ורשימת ההזמנות של היום הופכת לרשימת אריזה. תזכורת לתשלום יוצאת בלחיצה כהודעה מוכנה, והמלאי יורד אוטומטית עם כל הזמנה שאושרה.',
        en: 'Kupah is the order system for small businesses that have no online store – a jewellery designer selling through Stories, a home bakery taking WhatsApp orders, a clothing shop that posts once and answers dozens of messages. Instead of running everything on sticky notes and chats, the seller shares the customer’s message to the app (or types it in), and the system recognises items from the catalogue, quantities, address and delivery method and opens an order. Every order has one clear status – awaiting payment, paid, packed, shipped – and today’s order list becomes the packing list. A payment reminder goes out with one tap as a ready-made message, and stock is reduced automatically with every confirmed order.',
      },
      problem: {
        he: 'מכירה בהודעות פרטיות היא הדרך שבה הרבה עסקים קטנים מתחילים, אבל היא קורסת בעומס: מי שילמה ומי לא, מה כבר נארז, לאיזו כתובת לשלוח, ומה בכלל נשאר במלאי. פלטפורמות חנות מלאות כבדות מדי לעסק שמוכר עשרים פריטים בשבוע, והלקוחות ממילא רוצות להזמין בצ׳אט.',
        en: 'Selling through direct messages is how many small businesses start, but it collapses under load: who has paid and who has not, what is already packed, which address to ship to, and what is even left in stock. Full storefront platforms are too heavy for a business that sells twenty items a week, and customers want to order in chat anyway.',
      },
      solution: {
        he: 'ההזמנה נוצרת מתוך ההודעה עצמה – בשיתוף מהצ׳אט או בהקלדה – ומתחברת לקטלוג קטן עם מחירים ומלאי. לוח סטטוסים אחד מחליף את הפתקים, הודעות מוכנות מטפלות בגבייה ובעדכוני משלוח, ורשימת אריזה יומית נבנית לבד. בלי חנות, בלי עגלה, ובלי לשנות את הדרך שבה הלקוחות כבר מזמינות.',
        en: 'The order is created from the message itself – shared from the chat or typed – and linked to a small catalogue with prices and stock. One status board replaces the notes, ready-made messages handle collection and shipping updates, and a daily packing list builds itself. No storefront, no cart, no changing how customers already order.',
      },
      usp: {
        he: 'הצ׳אט נשאר החנות והאפליקציה הופכת לקופה: ההזמנה מתחילה מהודעה שמשתפים מהצ׳אט ולא מעגלת קניות, ומה שמנוהל הוא בדיוק מה שנשבר בעסק קטן – תשלומים פתוחים, אריזה ומלאי – ולא קטלוג מפואר שאף אחד לא גולש בו.',
        en: 'The chat stays the shop and the app becomes the till: an order starts from a message shared straight from the chat, not from a cart, and what gets managed is exactly what breaks in a small business – open payments, packing and stock – rather than a glossy catalogue nobody browses.',
      },
      targetUsers: {
        he: ['יוצרות ויוצרים שמוכרים דרך אינסטגרם ומקבלים הזמנות בהודעות', 'מאפיות וקונדיטוריות ביתיות עם הזמנות לסוף השבוע ולחגים', 'חנויות שכונתיות קטנות שמוסיפות משלוחים דרך וואטסאפ'],
        en: ['Makers who sell through Instagram and take orders by message', 'Home bakeries and patisseries with weekend and holiday orders', 'Small neighbourhood shops adding delivery through WhatsApp'],
      },
      coreFeatures: {
        he: [
          'יצירת הזמנה משיתוף הודעה או מהקלדה, עם זיהוי פריטים וכמויות מהקטלוג',
          'קטלוג קטן עם מחיר, מלאי ותמונה לכל פריט',
          'לוח סטטוסים: ממתינה לתשלום, שולמה, נארזה, נשלחה',
          'הודעות מוכנות לתזכורת תשלום, אישור הזמנה ועדכון משלוח',
          'רשימת אריזה יומית לפי מועד משלוח או איסוף',
          'הורדת מלאי אוטומטית וסימון "אזל" שמופיע בכל הזמנה חדשה',
          'היסטוריית לקוחות: מה הזמינה, מתי, ולאן נשלח',
        ],
        en: [
          'Create an order from a shared message or by typing, with items and quantities recognised from the catalogue',
          'A small catalogue with price, stock and a photo per item',
          'A status board: awaiting payment, paid, packed, shipped',
          'Ready-made messages for payment reminders, order confirmation and shipping updates',
          'A daily packing list by delivery or pickup date',
          'Automatic stock reduction and a "sold out" mark that shows on every new order',
          'Customer history: what she ordered, when, and where it was shipped',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'ההזמנות של היום מקובצות לפי סטטוס, מונה של תשלומים פתוחים, וכפתור "רשימת אריזה".', en: 'Today’s orders grouped by status, a counter of open payments, and a "packing list" button.' } },
        { name: { he: 'הזמנה חדשה', en: 'New order' }, description: { he: 'ההודעה שהגיעה מהשיתוף למעלה, ומתחתיה הפריטים שזוהו עם כמויות לעריכה, כתובת ואופן משלוח.', en: 'The shared message on top, and below it the recognised items with editable quantities, address and delivery method.' } },
        { name: { he: 'הזמנה', en: 'Order' }, description: { he: 'כרטיס הזמנה עם סטטוס גדול, סכום, פרטי הלקוחה, וכפתורים להודעות המוכנות: תזכורת, אישור, נשלח.', en: 'An order card with a large status, total, customer details, and buttons for the ready-made messages: reminder, confirmation, shipped.' } },
        { name: { he: 'קטלוג', en: 'Catalogue' }, description: { he: 'רשימת פריטים עם תמונה, מחיר ומלאי נוכחי; עריכה מהירה בלחיצה ארוכה.', en: 'Items with photo, price and current stock; quick edit on long press.' } },
        { name: { he: 'רשימת אריזה', en: 'Packing list' }, description: { he: 'צ׳קליסט של כל הפריטים לאריזה היום, מקובץ לפי הזמנה; סימון פריט מעדכן את הסטטוס ל"נארזה".', en: 'A checklist of everything to pack today, grouped by order, where ticking updates the status to "packed".' } },
        { name: { he: 'לקוחות', en: 'Customers' }, description: { he: 'רשימת לקוחות עם ההזמנה האחרונה, סכום מצטבר וכפתור שפותח את הצ׳אט בוואטסאפ.', en: 'Customers with their latest order, lifetime total and a button that opens the WhatsApp chat.' } },
      ],
      userJourney: {
        he: [
          'מעצבת תכשיטים מעלה סטורי עם צמיד חדש ומקבלת שמונה הודעות תוך שעה',
          'משתפת כל הודעה ל-Kupah; הפריט והכמות מזוהים מהקטלוג והיא מוסיפה כתובת',
          'שולחת לכל לקוחה הודעת אישור מוכנה עם הסכום ואפשרויות התשלום',
          'למחרת שלוש לקוחות עדיין לא שילמו – תזכורת יוצאת בלחיצה אחת',
          'ביום המשלוחים רשימת האריזה מרכזת את כל הצמידים, והסטטוס מתעדכן ל"נשלחה"',
          'המלאי של הצמיד מגיע לאפס, ובהזמנה הבאה מופיע סימון "אזל"',
        ],
        en: [
          'A jewellery designer posts a Story with a new bracelet and gets eight messages within an hour',
          'She shares each message to Kupah; item and quantity are recognised from the catalogue and she adds the address',
          'Sends every customer a ready-made confirmation with the total and payment options',
          'The next day three customers still have not paid – a reminder goes out with one tap',
          'On shipping day the packing list gathers all the bracelets, and status flips to "shipped"',
          'The bracelet’s stock hits zero and the next order shows a "sold out" mark',
        ],
      },
      uxDirection: {
        he: 'אפליקציה ליד אחת שמופעלת בין הודעה להודעה: סטטוס ההזמנה הוא הדבר הגדול ביותר על המסך, צבע אחד לכל סטטוס, והפעולות העיקריות הן כפתורים גדולים בתחתית. בלי דשבורדים ובלי גרפים בשלב הראשון – המוכרת רוצה לדעת מי שילמה ומה לארוז, לא לנתח מגמות.',
        en: 'A one-handed app used between messages: the order status is the biggest thing on the screen, one colour per status, and the main actions are large buttons at the bottom. No dashboards and no charts in the first phase – the seller wants to know who paid and what to pack, not to analyse trends.',
      },
      architecture: {
        he: 'Expo עם Expo Router, קליטה מתפריט השיתוף דרך פלאגין share intent, ו-expo-notifications לתזכורות אריזה. Supabase לאימות, לקטלוג, להזמנות וללקוחות, עם RLS לפי עסק. זיהוי הפריטים מההודעה נעשה ב-Edge Function שמשלבת התאמה מקורבת לקטלוג עם מודל שפה קטן ומחזירה הצעה שהמוכרת מאשרת. הודעות מוכנות נפתחות בוואטסאפ דרך קישור עמוק עם טקסט מוכן – בלי אינטגרציה רשמית בשלב הראשון. המלאי מתעדכן בטריגר במסד הנתונים כדי שלא יישבר בין מכשירים.',
        en: 'Expo with Expo Router, share-sheet capture through a share-intent plugin, and expo-notifications for packing reminders. Supabase for auth, catalogue, orders and customers, with per-business RLS. Item recognition runs in an Edge Function that combines fuzzy matching against the catalogue with a small language model and returns a proposal the seller confirms. Ready-made messages open in WhatsApp through a deep link with prefilled text – no official integration in the first phase. Stock updates in a database trigger so it never breaks across devices.',
      },
      stack: ['Expo', 'Expo Router', 'expo-share-intent', 'expo-notifications', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'RevenueCat'],
      database: {
        he: ['businesses – עסק, שם, מטבע, תבניות הודעה', 'products – פריט, מחיר, מלאי, תמונה, פעיל', 'customers – לקוחה, טלפון, כתובת ברירת מחדל', 'orders – הזמנה, לקוחה, סטטוס, סכום, מועד משלוח, אופן משלוח', 'order_items – פריט, כמות, מחיר בזמן ההזמנה', 'captures – ההודעה המקורית והפריטים שזוהו ממנה', 'stock_movements – שינויי מלאי עם סיבה: הזמנה, ביטול, ספירה'],
        en: ['businesses – business, name, currency, message templates', 'products – item, price, stock, photo, active', 'customers – customer, phone, default address', 'orders – order, customer, status, total, delivery date, delivery method', 'order_items – item, quantity, price at order time', 'captures – the original message and the items recognised from it', 'stock_movements – stock changes with a reason: order, cancellation, count'],
      },
      auth: {
        he: 'כניסה עם טלפון (SMS) או Apple/Google – המוכרות רגילות למספר טלפון כזהות. עסק אחד למשתמש בשלב הראשון, עם RLS שמבודד כל עסק. פרטי לקוחות (טלפון וכתובת) הם מידע אישי, ולכן יצוא ומחיקה זמינים מההגדרות.',
        en: 'Phone (SMS) or Apple/Google sign-in – sellers are used to a phone number as identity. One business per user in the first phase, with RLS isolating each business. Customer details (phone and address) are personal data, so export and deletion are available from settings.',
      },
      monetization: {
        he: ['מנוי חודשי לעסק עם תקופת ניסיון, בלי עמלה על מכירות', 'תוכנית מורחבת עם כמה משתמשים לאותו עסק ויצוא להנהלת חשבונות', 'תוספים בתשלום: הדפסת מדבקות משלוח והזמנת שליח מתוך ההזמנה'],
        en: ['A monthly subscription per business with a trial period, and no commission on sales', 'An extended plan with several users per business and an export for the accountant', 'Paid add-ons: shipping-label printing and courier booking from inside the order'],
      },
      mvpMilestones: {
        he: ['קטלוג ויצירת הזמנה ידנית עם לוח סטטוסים', 'הודעות מוכנות דרך קישור עמוק לוואטסאפ', 'שיתוף הודעה וזיהוי פריטים עם אישור', 'רשימת אריזה יומית', 'מלאי אוטומטי וסימון "אזל"', 'מנוי ותקופת ניסיון'],
        en: ['Catalogue and manual order creation with a status board', 'Ready-made messages through a WhatsApp deep link', 'Message sharing and item recognition with confirmation', 'Daily packing list', 'Automatic stock and "sold out" marks', 'Subscription and trial'],
      },
      risks: {
        he: ['זיהוי שגוי של פריט או כמות יוצר הזמנה שגויה – ההצעה חייבת תמיד לעבור אישור ידני', 'בלי אינטגרציה רשמית לוואטסאפ ולאינסטגרם הזרימה תלויה בשיתוף ידני, ומי ששוכחת לשתף מאבדת הזמנות', 'עסקים קטנים רגישים למחיר – המנוי צריך להיות זול בבירור מהזמן שהוא חוסך'],
        en: ['A misrecognised item or quantity creates a wrong order – the proposal must always pass manual confirmation', 'Without an official WhatsApp or Instagram integration the flow depends on manual sharing, and whoever forgets to share loses orders', 'Small businesses are price-sensitive – the subscription must be clearly cheaper than the time it saves'],
      },
      expansion: {
        he: ['דף הזמנה ציבורי קטן ללקוחות שמעדיפות להזמין בלי צ׳אט', 'חיבור לחברות שליחויות והדפסת מדבקות', 'דוח חודשי לרואה החשבון עם מכירות ומלאי'],
        en: ['A tiny public order page for customers who prefer ordering without chat', 'Courier integrations and label printing', 'A monthly report for the accountant with sales and stock'],
      },
    },
  },
  {
    id: 'moveout',
    name: { he: 'Moveout – מכירת פינוי דירה', en: 'Moveout' },
    tagline: {
      he: 'מפנים דירה? במקום 40 מודעות נפרדות מפרסמים מכירה אחת עם תאריך סיום, חדרים ומשבצות איסוף – והקונים מהשכונה מגיעים לפי תור.',
      en: 'Leaving an apartment? Instead of 40 separate listings, post one sale with an end date, rooms and pickup slots – and neighbourhood buyers come by appointment.',
    },
    category: 'ecommerce',
    secondaryCategories: ['lifestyle', 'social'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'medium',
    businessModel: 'freemium',
    platforms: ['cross-platform'],
    audience: ['consumers', 'students'],
    tags: ['second-hand', 'circular', 'moving', 'furniture', 'marketplace', 'pickup', 'relocation', 'neighbourhood'],
    identity: { hue: 275, glyph: 'Mo', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Moveout בנויה סביב רגע אחד: הדירה מתפנה בעוד שלושה שבועות וכל מה שבה צריך ללכת – הספה, המקרר, המדפים, הצמחים. במקום לצלם ולפרסם כל פריט בנפרד ולענות לעשרות "זה עדיין זמין?", המוכר פותח "מכירת פינוי" אחת: תאריך סיום, שכונה, וצילום מהיר של כל חדר שעליו מסמנים פריטים עם מחיר ומחיר רצפה. הקונים גולשים לפי שכונה ותאריך, רואים את כל הדירה כסל אחד, משריינים פריטים ובוחרים משבצת איסוף מתוך השעות שהמוכר פתח. ככל שתאריך הפינוי מתקרב המחירים יורדים אוטומטית לכיוון הרצפה, ומה שלא נמכר ביום האחרון מוצע לאיסוף חינם לעמותות ולשכנים. פחות פסולת גושית ברחוב, פחות הודעות, ויותר דברים שמקבלים בית שני.',
        en: 'Moveout is built around one moment: the apartment is handed back in three weeks and everything in it has to go – the sofa, the fridge, the shelves, the plants. Instead of photographing and listing each item separately and answering dozens of "is it still available?", the seller opens one "moveout sale": an end date, a neighbourhood, and a quick photo of each room on which items are marked with a price and a floor price. Buyers browse by neighbourhood and date, see the whole apartment as one basket, reserve items and pick a pickup slot from the hours the seller opened. As the date approaches, prices drift automatically towards the floor, and whatever is unsold on the last day is offered free to charities and neighbours. Less bulky waste on the kerb, fewer messages, and more things that get a second home.',
      },
      problem: {
        he: 'מעברי דירה בישראל מתרכזים בחודשי הקיץ, ובכל מעבר יש רהיטים ומכשירים שאין טעם להעביר. לוחות יד שנייה מתאימים לפריט אחד בלי לחץ זמן, לא לשלושים פריטים שחייבים להיעלם עד תאריך מסוים. התוצאה: תיאומים אינסופיים, מחירים שנקבעים בניחוש, וערמות של ריהוט טוב ליד פחי האשפה ביום הפינוי.',
        en: 'Moves in Israel cluster in the summer months, and every move leaves furniture and appliances that are not worth taking along. Second-hand boards are built for one item with no time pressure, not for thirty items that must vanish by a specific date. The result: endless coordination, guesswork pricing, and piles of good furniture next to the bins on moving day.',
      },
      solution: {
        he: 'יחידת הפרסום היא הדירה ולא הפריט: מכירה אחת עם תאריך סיום, סימון פריטים על צילומי החדרים, שריון ומשבצות איסוף שעוצרים את מבול ההודעות, הורדת מחיר אוטומטית לקראת התאריך, ו"יום אחרון" שבו השאריות מוצעות חינם. המוכר מנהל הכול ממסך אחד, והקונה רואה שלושים פריטים בכתובת אחת.',
        en: 'The unit of listing is the apartment, not the item: one sale with an end date, items marked on room photos, reservations and pickup slots that stop the flood of messages, automatic price drops towards the date, and a "last day" where leftovers are offered free. The seller manages everything from one screen, and the buyer sees thirty items at a single address.',
      },
      usp: {
        he: 'תאריך הסיום הוא הפיצ׳ר: הוא מכתיב את התמחור, את משבצות האיסוף ואת מה שקורה לשאריות. לוח מודעות רגיל לא יודע שהספה חייבת ללכת עד יום שלישי – Moveout בנויה בדיוק סביב זה.',
        en: 'The end date is the feature: it drives the pricing, the pickup slots and what happens to leftovers. A regular classifieds board does not know the sofa must be gone by Tuesday – Moveout is built around exactly that.',
      },
      targetUsers: {
        he: ['שוכרים ובעלי דירות שעוברים דירה או עושים רילוקיישן', 'סטודנטים שמסיימים שנה ומפנים דירה משותפת', 'קונים שמרהטים דירה ראשונה ומחפשים הרבה דברים במקום אחד'],
        en: ['Renters and owners who are moving house or relocating abroad', 'Students finishing the year and clearing a shared flat', 'Buyers furnishing a first apartment who want many things from one place'],
      },
      coreFeatures: {
        he: [
          'פתיחת מכירת פינוי עם תאריך סיום, שכונה ושעות איסוף אפשריות',
          'צילום חדר וסימון פריטים עליו עם מחיר ומחיר רצפה',
          'שריון פריט ובחירת משבצת איסוף במקום שיחת תיאום',
          'הורדת מחיר אוטומטית לקראת תאריך הסיום, עד הרצפה שהמוכר קבע',
          'יום אחרון: פריטים שלא נמכרו מוצעים חינם לעמותות ולשכנים',
          'צ׳קליסט למוכר: מה נמכר, מה נאסף, מה עדיין בדירה',
        ],
        en: [
          'Open a moveout sale with an end date, a neighbourhood and possible pickup hours',
          'Photograph a room and mark items on it with a price and a floor price',
          'Reserve an item and choose a pickup slot instead of a coordination call',
          'Automatic price drops towards the end date, down to the seller’s floor',
          'Last day: unsold items offered free to charities and neighbours',
          'A seller checklist: what sold, what was collected, what is still in the flat',
        ],
      },
      screens: [
        { name: { he: 'מכירות בסביבה', en: 'Sales nearby' }, description: { he: 'רשימת מכירות פינוי מקובצת לפי שכונה וממוינת לפי תאריך סיום, עם תצוגה מקדימה של שלושה פריטים בולטים לכל מכירה.', en: 'A list of moveout sales grouped by neighbourhood and sorted by end date, each previewing three standout items.' } },
        { name: { he: 'הדירה', en: 'The apartment' }, description: { he: 'צילומי החדרים כגלריה עם נקודות על הפריטים; לחיצה על נקודה פותחת מחיר, מידות ומצב.', en: 'Room photos as a gallery with pins on items; tapping a pin opens price, dimensions and condition.' } },
        { name: { he: 'פריט', en: 'Item' }, description: { he: 'תמונות, המחיר הנוכחי והמסלול הצפוי שלו עד הסיום, כפתור שריון ובחירת משבצת איסוף.', en: 'Photos, the current price and its expected path to the end date, a reserve button and a pickup-slot picker.' } },
        { name: { he: 'פתיחת מכירה', en: 'Create sale' }, description: { he: 'תאריך סיום, שכונה, שעות איסוף, ואז צילום חדר אחר חדר עם סימון פריטים במקום.', en: 'End date, neighbourhood, pickup hours, then room-by-room photos with items marked on the spot.' } },
        { name: { he: 'ניהול המכירה', en: 'Manage sale' }, description: { he: 'כל הפריטים בטבלה: סטטוס, מחיר נוכחי, מי שריין ומתי אוסף; פעולות על כמה פריטים בבת אחת.', en: 'All items in a table: status, current price, who reserved and when they collect; bulk actions on a selection.' } },
        { name: { he: 'לוח איסופים', en: 'Pickup schedule' }, description: { he: 'יומן של משבצות האיסוף עם שמות הקונים והפריטים לכל משבצת, ותזכורת שעה לפני.', en: 'A calendar of pickup slots with buyer names and items per slot, and a reminder an hour before.' } },
        { name: { he: 'יום אחרון', en: 'Last day' }, description: { he: 'מה שנשאר מוצע חינם בלחיצה אחת, עם רשימת עמותות ומועד איסוף הגזם של העירייה.', en: 'What is left, offered free with one tap, with a list of charities and the municipal bulky-waste pickup date.' } },
      ],
      userJourney: {
        he: [
          'זוג שעובר לחו"ל פותח מכירת פינוי עם תאריך סיום בעוד שלושה שבועות',
          'מצלמים את הסלון ומסמנים ספה, שולחן ומנורה עם מחיר ומחיר רצפה',
          'קונה מהשכונה משריין את הספה ובוחר איסוף ביום שישי בבוקר',
          'אחרי עשרה ימים המנורה יורדת אוטומטית במחיר ונמכרת באותו ערב',
          'לוח האיסופים מראה שבשבת נאספים ארבעה פריטים בשתי משבצות',
          'ביום האחרון שני מדפים שלא נמכרו מוצעים חינם ונאספים על ידי עמותה',
        ],
        en: [
          'A couple relocating abroad opens a moveout sale ending in three weeks',
          'They photograph the living room and mark the sofa, table and lamp with a price and a floor',
          'A neighbour reserves the sofa and picks a Friday-morning pickup slot',
          'After ten days the lamp drops in price automatically and sells that evening',
          'The pickup schedule shows four items being collected on Saturday in two slots',
          'On the last day two unsold shelves are offered free and collected by a charity',
        ],
      },
      uxDirection: {
        he: 'תחושה של ביקור בדירה: צילומי החדרים הם המסך המרכזי והפריטים הם נקודות עליהם, לא רשימה אינסופית של כרטיסים. ספירה לאחור לתאריך הסיום מופיעה בכל מסך של המכירה ויוצרת דחיפות בלי לצעוק. בצד המוכר הכול בנוי למינימום מאמץ – לצלם, לסמן, לתמחר, וזהו.',
        en: 'Feels like visiting the apartment: the room photos are the main screen and items are pins on them, not an endless list of cards. A countdown to the end date appears on every sale screen and creates urgency without shouting. On the seller side everything is built for minimum effort – photograph, mark, price, done.',
      },
      architecture: {
        he: 'Expo עם Expo Router, expo-camera ו-expo-image לגלריית החדרים, ו-expo-notifications לתזכורות איסוף. Supabase לאימות, למכירות, לפריטים ולשריונים, עם Storage לתמונות ולגרסאות מוקטנות. הורדת המחיר מחושבת מתאריך הפתיחה, תאריך הסיום והרצפה – פונקציה דטרמיניסטית שרצה ב-cron יומי. שריון נועל את הפריט לזמן קצר במסד הנתונים כדי ששני קונים לא ישריינו את אותו פריט. המיקום נשמר ברמת שכונה בלבד, ובשלב הראשון הגלישה היא רשימה לפי שכונה – בלי מפה.',
        en: 'Expo with Expo Router, expo-camera and expo-image for the room gallery, and expo-notifications for pickup reminders. Supabase for auth, sales, items and reservations, with Storage for photos and resized variants. Price drops are computed from the opening date, end date and floor – a deterministic function run by a daily cron. A reservation takes a short lock in the database so two buyers cannot reserve the same item. Location is stored at neighbourhood level only, and first-phase browsing is a list by neighbourhood – no map.',
      },
      stack: ['Expo', 'Expo Router', 'expo-camera', 'expo-image', 'expo-notifications', 'Supabase', 'Supabase Storage', 'pg_cron'],
      database: {
        he: ['profiles – משתמש, שכונה, דירוג אמינות', 'sales – מכירה, תאריך סיום, שכונה, שעות איסוף, סטטוס', 'rooms – חדר, צילום, סדר', 'items – פריט, חדר, מיקום על הצילום, מחיר, מחיר רצפה, מצב, סטטוס', 'reservations – פריט, קונה, משבצת איסוף, סטטוס', 'pickup_slots – מכירה, התחלה, סיום, קיבולת', 'price_history – מחיר הפריט לאורך זמן'],
        en: ['profiles – user, neighbourhood, reliability rating', 'sales – sale, end date, neighbourhood, pickup hours, status', 'rooms – room, photo, order', 'items – item, room, position on the photo, price, floor price, condition, status', 'reservations – item, buyer, pickup slot, status', 'pickup_slots – sale, start, end, capacity', 'price_history – the item’s price over time'],
      },
      auth: {
        he: 'גלישה חופשית בלי חשבון; שריון ופתיחת מכירה דורשים כניסה עם טלפון או Apple/Google. הכתובת המדויקת נחשפת לקונה רק אחרי שריון מאושר, ועד אז מוצגת השכונה בלבד.',
        en: 'Browse freely without an account; reserving or opening a sale requires phone or Apple/Google sign-in. The exact address is revealed to a buyer only after a confirmed reservation; until then only the neighbourhood is shown.',
      },
      monetization: {
        he: ['חינם לפרסום; תשלום קטן על "הקפצה" של המכירה לראש הרשימה', 'תוספים בתשלום: הובלה שמזמינים מתוך האפליקציה דרך שותף', 'חבילה לחברות רילוקיישן ולמנהלי נכסים שמפנים דירות באופן קבוע'],
        en: ['Free to list; a small fee to "boost" a sale to the top of the list', 'Paid add-ons: moving help booked from inside the app through a partner', 'A plan for relocation agencies and property managers who clear apartments regularly'],
      },
      mvpMilestones: {
        he: ['פתיחת מכירה, צילום חדרים וסימון פריטים', 'גלישה לפי שכונה ותאריך ומסך פריט', 'שריון ומשבצות איסוף עם נעילה', 'הורדת מחיר אוטומטית', 'לוח איסופים ותזכורות', 'יום אחרון עם הצעה חינם'],
        en: ['Create a sale, photograph rooms and mark items', 'Browse by neighbourhood and date, plus the item screen', 'Reservations and pickup slots with locking', 'Automatic price drops', 'Pickup schedule and reminders', 'Last day with free offers'],
      },
      risks: {
        he: ['בעיית ביצה ותרנגולת מקומית – צריך מספיק מכירות בשכונה אחת כדי שהגלישה תהיה מעניינת; להתחיל בעיר אחת ובעונת המעברים', 'קונים שלא מגיעים לאיסוף תוקעים פריטים – נדרש שחרור אוטומטי של שריון ודירוג אמינות', 'חשיפת כתובת ושעות שבהן הדירה פתוחה היא סיכון בטיחותי – לחשוף רק אחרי שריון ולאפשר איסוף בלובי'],
        en: ['A local chicken-and-egg problem – enough sales in one neighbourhood are needed for browsing to be interesting; start in one city during moving season', 'No-show buyers block items – automatic reservation release and a reliability rating are required', 'Exposing an address and the hours the flat is open is a safety risk – reveal only after a reservation and allow lobby pickup'],
      },
      expansion: {
        he: ['חבילת "לוקחים הכול": הצעה אחת על חדר שלם במחיר אחד', 'תצוגת מפה למכירות בסביבה, ברגע שיש מספיק מכירות בעיר אחת', 'מכירות פינוי של משרדים וחנויות שנסגרות', 'הצעת מחיר אוטומטית מתמונה לפי מכירות קודמות באפליקציה', 'שיתוף פעולה עם עיריות סביב ימי איסוף גזם'],
        en: ['A "take it all" bundle: one offer for an entire room at a single price', 'A map view of nearby sales, once one city has enough of them', 'Moveout sales for offices and shops closing down', 'Automatic price suggestions from a photo based on previous sales in the app', 'Partnerships with municipalities around bulky-waste collection days'],
      },
    },
  },
  {
    id: 'hagia',
    name: { he: 'Hagia – מה הגיע היום לחנות', en: 'Hagia' },
    tagline: {
      he: 'חנויות השכונה מצלמות בעשר שניות מה הגיע היום – לחם מהתנור, יבול טרי, מידה שחזרה – והשכנים מקבלים סיכום יומי ומשריינים לאיסוף.',
      en: 'Neighbourhood shops snap what came in today – fresh bread, new produce, a size back in stock – and locals get a daily digest and reserve it for pickup.',
    },
    category: 'ecommerce',
    secondaryCategories: ['social', 'lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['ios', 'android'],
    audience: ['businesses', 'consumers'],
    tags: ['local commerce', 'neighbourhood', 'shops', 'reservations', 'digest', 'retail', 'pickup', 'hyperlocal'],
    identity: { hue: 140, glyph: 'Hg', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Hagia הופכת את היחידה הכי קטנה של חנות שכונתית – "הגיע היום" – לערוץ מכירה. בעל המכולת, המאפייה או חנות הבגדים מצלם בעשר שניות מה נכנס הבוקר, מוסיף מחיר ומספר יחידות משוער, ומפרסם. אין קטלוג לתחזק, אין מלאי לנהל, אין חנות אונליין: רק מה שחדש היום. השכנים ברדיוס הליכה מקבלים סיכום אחד ביום מהחנויות שבחרו לעקוב אחריהן, ויכולים ללחוץ "שמרו לי" כדי שהחנות תשים יחידה בצד לשעתיים. התשלום בחנות, כמו תמיד. בצד החנות מסך אחד מראה מה שוריין, מי לא הגיע ומה עורר הכי הרבה עניין – המידע שעוזר להחליט כמה להזמין מחר.',
        en: 'Hagia turns the smallest unit of a neighbourhood shop – "arrived today" – into a sales channel. The grocer, the baker or the clothing-shop owner takes a ten-second photo of what came in this morning, adds a price and a rough unit count, and posts it. There is no catalogue to maintain, no inventory to manage, no online store: just what is new today. Neighbours within walking distance get one digest a day from the shops they follow and can tap "hold one for me" so the shop sets a unit aside for two hours. Payment happens in the shop, as always. On the shop side a single screen shows what was reserved, who did not turn up and what drew the most interest – the information that helps decide how much to order tomorrow.',
      },
      problem: {
        he: 'חנויות קטנות מפסידות מכירות על דברים שמגיעים ונעלמים באותו יום: עגבניות מהמשק, חלות ביום שישי, המידה שחזרה למלאי. אין להן זמן ואין להן סיבה לתחזק קטלוג, והלקוחות מגלים מה היה רק אחרי שנגמר. הפתרונות הקיימים דורשים חנות אונליין מלאה, משלוחים ועמלות – הרבה יותר ממה שחנות שכונתית צריכה.',
        en: 'Small shops lose sales on things that arrive and vanish the same day: tomatoes from the farm, challah on Friday, the size that came back in stock. They have neither the time nor a reason to maintain a catalogue, and customers find out what was there only after it is gone. Existing solutions demand a full online store, deliveries and commissions – far more than a neighbourhood shop needs.',
      },
      solution: {
        he: 'פוסט של עשר שניות במקום קטלוג, סיכום יומי אחד במקום פיד, ושריון לשעתיים במקום משלוח. החנות לא מזינה מלאי – רק מה שהגיע היום והכמות המשוערת – והלקוחות משלמים בקופה. המוצר עוקף את כל מה שהופך מסחר אונליין לכבד עבור חנות קטנה.',
        en: 'A ten-second post instead of a catalogue, one daily digest instead of a feed, and a two-hour hold instead of delivery. The shop never enters stock – only what arrived today and a rough count – and customers pay at the till. The product sidesteps everything that makes online commerce heavy for a small shop.',
      },
      usp: {
        he: 'יחידת התוכן היא "מה הגיע היום" ולא "מה יש בחנות": פוסט שנעלם בסוף היום, סיכום אחד ליום, ושריון בלי תשלום באפליקציה – כך שחנות בלי שום תשתית דיגיטלית יכולה להתחיל תוך דקה.',
        en: 'The unit of content is "what arrived today", not "what the shop stocks": a post that expires at the end of the day, one digest a day, and a hold with no in-app payment – so a shop with zero digital infrastructure can start within a minute.',
      },
      targetUsers: {
        he: ['בעלי מכולות, מאפיות, ירקנים וחנויות בגדים קטנות בשכונה', 'שכנים שמעדיפים לקנות קרוב לבית ורוצים לדעת מתי הגיע משהו טוב', 'סוחרים בשווקים עירוניים עם סחורה שמשתנה מיום ליום'],
        en: ['Owners of neighbourhood groceries, bakeries, greengrocers and small clothing shops', 'Locals who prefer shopping near home and want to know when something good arrives', 'Market traders whose goods change from day to day'],
      },
      coreFeatures: {
        he: [
          'פוסט "הגיע היום": תמונה, מחיר, כמות משוערת ופקיעה אוטומטית בסוף היום',
          'מעקב אחרי חנויות ברדיוס הליכה עם סיכום יומי אחד בשעה שהמשתמש בוחר',
          'כפתור "שמרו לי" שמשריין יחידה לשעתיים ושולח לחנות התראה',
          'מסך חנות עם השריונים הפתוחים, מי אסף ומי לא הגיע',
          'סטטיסטיקה פשוטה לחנות: אילו פוסטים עוררו עניין ומה חוזר על עצמו',
          'חיפוש "מי בסביבה מכר השבוע חלות / עגבניות / מידה 38"',
        ],
        en: [
          'An "arrived today" post: photo, price, rough quantity and automatic expiry at end of day',
          'Follow shops within walking distance with one daily digest at a time the user chooses',
          'A "hold one for me" button that reserves a unit for two hours and alerts the shop',
          'A shop screen with open holds, who collected and who did not show up',
          'Simple stats for the shop: which posts drew interest and what repeats',
          'Search "who nearby sold challah / tomatoes / size 38 this week"',
        ],
      },
      screens: [
        { name: { he: 'הסיכום של היום', en: 'Today’s digest' }, description: { he: 'כרטיסים לפי חנות עם התמונה, המחיר ומרחק ההליכה; כפתור "שמרו לי" על כל פריט.', en: 'Cards per shop with photo, price and walking distance; a "hold one for me" button on every item.' } },
        { name: { he: 'חנות', en: 'Shop' }, description: { he: 'עמוד החנות עם שעות פתיחה, הפוסטים של היום ושל השבוע, וכפתור מעקב.', en: 'The shop page with opening hours, today’s and this week’s posts, and a follow button.' } },
        { name: { he: 'פרסום מהיר', en: 'Quick post' }, description: { he: 'מצלמה פתוחה, שדה מחיר ובורר כמות; שלוש הקשות והפוסט באוויר. מופיע רק במצב חנות.', en: 'An open camera, a price field and a quantity stepper; three taps and it is live. Shown only in shop mode.' } },
        { name: { he: 'שריונים', en: 'Holds' }, description: { he: 'במצב חנות: רשימת השריונים הפתוחים עם שם, שעה וספירה לאחור; סימון "נאסף" או "לא הגיע".', en: 'In shop mode: open holds with name, time and a countdown; mark "collected" or "no-show".' } },
        { name: { he: 'השריונים שלי', en: 'My holds' }, description: { he: 'ללקוח: מה שמור לו עכשיו, עד מתי, ומסלול הליכה לחנות.', en: 'For the customer: what is being held right now, until when, and a walking route to the shop.' } },
        { name: { he: 'מה עבד', en: 'What worked' }, description: { he: 'במצב חנות: הפוסטים של השבוע מדורגים לפי שריונים, עם מספר הצפיות של כל אחד.', en: 'In shop mode: this week’s posts ranked by holds, with views for each.' } },
      ],
      userJourney: {
        he: [
          'המאפייה בשכונה פותחת מצב חנות ומצלמת את החלות שיצאו מהתנור בשש בבוקר',
          'ב-7:30 שכנה מקבלת את הסיכום היומי עם החלות, עגבניות מהירקן ומידה שחזרה בחנות הבגדים',
          'לוחצת "שמרו לי" על שתי חלות ויוצאת לעבודה',
          'המאפייה רואה את השריון, שמה שתי חלות בצד ומסמנת בתשע "נאסף"',
          'בסוף היום הפוסט נעלם, ובמסך "מה עבד" המאפייה רואה שהחלות גררו 14 שריונים',
          'למחרת היא אופה עוד תבנית אחת',
        ],
        en: [
          'The neighbourhood bakery opens shop mode and photographs the challot that came out of the oven at six in the morning',
          'At 7:30 a neighbour gets the daily digest with the challot, tomatoes from the greengrocer and a size back in stock at the clothing shop',
          'She taps "hold one for me" on two challot and leaves for work',
          'The bakery sees the hold, sets two aside and marks "collected" at nine',
          'At the end of the day the post expires, and in "what worked" the bakery sees the challot drew 14 holds',
          'The next day it bakes one more tray',
        ],
      },
      uxDirection: {
        he: 'שני מצבים באפליקציה אחת – שכן וחנות – עם מעבר ברור ובלי בלבול. צד החנות הוא מצלמה ושני שדות, כי הפרסום קורה בין לקוח ללקוח עם ידיים עסוקות. צד השכן הוא סיכום אחד ביום בעיצוב של עיתון שכונתי קטן: תמונות גדולות, שם החנות ומרחק, בלי פיד אינסופי ובלי לייקים.',
        en: 'Two modes in one app – neighbour and shop – with a clear switch and no confusion. The shop side is a camera and two fields, because posting happens between customers with busy hands. The neighbour side is one digest a day styled like a small local newspaper: large photos, shop name and distance, no endless feed and no likes.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-expo-camera לפרסום המהיר, expo-location לרדיוס ההליכה ו-expo-notifications לסיכום היומי ולהתראות השריון. Supabase לאימות, לחנויות, לפוסטים ולשריונים, עם Storage לתמונות ו-pg_cron שמסיר פוסטים שפג תוקפם ומשחרר שריונים שלא נאספו. הסיכום היומי נבנה ב-Edge Function לפי החנויות שהמשתמש עוקב אחריהן ונשלח כהתראה אחת. אין תשלום באפליקציה בשלב הראשון, וכך נחסכות רגולציית תשלומים ועמלות סליקה; מנוי החנות נגבה דרך חנות האפליקציות.',
        en: 'Expo with Expo Router and expo-camera for quick posting, expo-location for the walking radius and expo-notifications for the digest and hold alerts. Supabase for auth, shops, posts and holds, with Storage for photos and pg_cron to expire posts and release uncollected holds. The daily digest is assembled in an Edge Function from the shops a user follows and sent as a single notification. No in-app payment in the first phase, which avoids payment regulation and processing fees; the shop subscription is billed through the app stores.',
      },
      stack: ['Expo', 'Expo Router', 'expo-camera', 'expo-location', 'expo-notifications', 'Supabase', 'Supabase Storage', 'Supabase Edge Functions', 'pg_cron', 'RevenueCat'],
      database: {
        he: ['shops – חנות, סוג, כתובת, שעות פתיחה, בעלים', 'posts – פוסט, חנות, תמונה, מחיר, כמות משוערת, פקיעה', 'follows – משתמש, חנות, שעת סיכום מועדפת', 'holds – פוסט, משתמש, זמן יצירה, פקיעה, סטטוס: פתוח / נאסף / לא הגיע', 'digests – סיכום שנשלח, משתמש, הפוסטים שנכללו', 'post_stats – צפיות ושריונים לכל פוסט'],
        en: ['shops – shop, type, address, opening hours, owner', 'posts – post, shop, photo, price, rough quantity, expiry', 'follows – user, shop, preferred digest time', 'holds – post, user, created at, expiry, status: open / collected / no-show', 'digests – a sent digest, user, included posts', 'post_stats – views and holds per post'],
      },
      auth: {
        he: 'שכנים: כניסה עם טלפון או Apple/Google, והמיקום נשמר ברמת שכונה בלבד. חנויות: אימות בעלות בסיסי דרך טלפון החנות ואישור ידני בשלב הראשון. RLS מבטיח שחנות רואה רק את השריונים שלה ושכן רואה רק את השריונים שלו.',
        en: 'Neighbours: phone or Apple/Google sign-in, with location stored at neighbourhood level only. Shops: basic ownership verification through the shop phone and manual approval in the first phase. RLS ensures a shop sees only its own holds and a neighbour only theirs.',
      },
      monetization: {
        he: ['מנוי חודשי קבוע וזול לחנות, בלי עמלה על מכירות', 'תוכנית לרשת מקומית של כמה סניפים עם ניהול מרכזי', 'בהמשך: תשלום מראש על שריון ללקוחות שרוצים לדלג על התור'],
        en: ['A low flat monthly subscription per shop, with no commission on sales', 'A plan for a local chain of several branches with central management', 'Later: prepaid holds for customers who want to skip the queue'],
      },
      mvpMilestones: {
        he: ['מצב חנות: פרסום מהיר עם פקיעה אוטומטית', 'מצב שכן: מעקב אחרי חנויות וסיכום יומי', 'שריון לשעתיים עם התראה לחנות ושחרור אוטומטי', 'מסך שריונים לחנות וסימון נאסף / לא הגיע', 'מסך "מה עבד"', 'מנוי לחנות'],
        en: ['Shop mode: quick post with automatic expiry', 'Neighbour mode: follow shops and the daily digest', 'Two-hour holds with a shop alert and automatic release', 'Shop holds screen with collected / no-show marks', 'The "what worked" screen', 'Shop subscription'],
      },
      risks: {
        he: ['ההנחה שבעלי חנויות יפרסמו כל יום לא הוכחה – ה-MVP צריך לבדוק אותה עם עשר חנויות ברחוב אחד לפני כל דבר אחר', 'שכונה עם שלוש חנויות היא סיכום משעמם – חייבים צפיפות מקומית לפני הרחבה', 'לקוחות שלא מגיעים לאיסוף שוחקים את האמון של החנות – להגביל שריונים למי שלא הגיע פעמיים'],
        en: ['The assumption that shop owners will post every day is unproven – the MVP must test it with ten shops on one street before anything else', 'A neighbourhood with three shops makes a dull digest – local density is needed before expanding', 'No-show customers erode the shop’s trust – limit holds for anyone who failed to turn up twice'],
      },
      expansion: {
        he: ['תשלום מראש על שריון דרך ספק סליקה', 'פוסטים חוזרים: "כל יום שישי חלות ב-6:00" כתבנית', 'שיתוף פעולה עם ועדי שכונה ועם מרכזים מסחריים קטנים'],
        en: ['Prepaid holds through a payment provider', 'Recurring posts: "every Friday challah at 6:00" as a template', 'Partnerships with neighbourhood committees and small shopping strips'],
      },
    },
  },
  {
    id: 'netto',
    name: { he: 'Netto – כמה באמת נשאר מכל מכירה', en: 'Netto' },
    tagline: {
      he: 'מחשבון מחיר למוכרים מתחילים: עלות, אריזה, משלוח, עמלת פלטפורמה ומע"מ – רואים כמה באמת נשאר ביד מכל יחידה, ואיזה מחיר מביא לרווח שרוצים.',
      en: 'Pricing calculator for new sellers: cost, packaging, shipping, platform fee and VAT – see what each unit really leaves you and the price that hits your margin.',
    },
    category: 'ecommerce',
    secondaryCategories: ['finance', 'business'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['cross-platform'],
    audience: ['creators', 'businesses'],
    tags: ['pricing', 'margin', 'calculator', 'fees', 'inventory', 'etsy', 'small sellers', 'offline'],
    identity: { hue: 345, glyph: 'Nt', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Netto עונה על השאלה שמוכרים מתחילים שואלים מאוחר מדי: "מכרתי ב-120 ש"ח, אז כמה באמת הרווחתי?". מזינים פעם אחת את עלות החומרים, האריזה, המשלוח, עמלת הפלטפורמה (אטסי, אמזון, חנות עצמאית, דוכן ביריד), עמלת הסליקה ומע"מ אם רלוונטי – והאפליקציה מציגה את הרווח האמיתי ליחידה ואת המחיר שצריך לבקש כדי להגיע לרווח המבוקש. אפשר להשוות את אותו מוצר בכמה ערוצי מכירה זה לצד זה, לשמור מוצרים, ולנהל ספירת יחידות פשוטה שיורדת עם כל מכירה שמסמנים. הכול נשמר במכשיר, בלי חשבון ובלי שרת. פרויקט קטן ומוגדר היטב – מסך קלט, מסך תוצאה, רשימת מוצרים – שמתאים למי שבונה אפליקציה ראשונה.',
        en: 'Netto answers the question new sellers ask too late: "I sold it for 120 shekels, so what did I actually make?". Enter once the cost of materials, packaging, shipping, the platform fee (Etsy, Amazon, your own store, a market stall), the payment fee and VAT where it applies – and the app shows the real profit per unit and the price you need to ask to reach your target margin. Compare the same product across several sales channels side by side, save products, and keep a simple unit count that goes down with every sale you log. Everything lives on the device, with no account and no server. A small, well-defined project – an input screen, a result screen, a product list – that suits a first app.',
      },
      problem: {
        he: 'מוכרים מתחילים מתמחרים לפי תחושה או לפי המתחרים, שוכחים את האריזה, את עמלת הסליקה ואת המע"מ, ומגלים בסוף החודש שמכרו הרבה והרוויחו מעט. גיליונות אקסל עובדים, אבל אף אחד לא פותח אותם מהטלפון רגע לפני שמפרסמים מחיר בסטורי.',
        en: 'New sellers price by gut feel or by copying competitors, forget packaging, payment fees and VAT, and discover at the end of the month that they sold a lot and earned little. Spreadsheets work, but nobody opens one on their phone a minute before posting a price in a Story.',
      },
      solution: {
        he: 'טופס אחד עם כל רכיבי העלות, תוצאה אחת ברורה – כמה נשאר ביד – ומחשבון הפוך שמציע מחיר לפי רווח מבוקש. תבניות עמלות לערוצי מכירה נפוצים חוסכות את החיפוש, והשוואת ערוצים מראה איפה אותו מוצר משתלם יותר.',
        en: 'One form with every cost component, one clear result – what stays in your pocket – and a reverse calculator that proposes a price from a target margin. Fee templates for common sales channels save the research, and a channel comparison shows where the same product pays off better.',
      },
      usp: {
        he: 'לא מחשבון אחוזים גנרי: רכיבי העלות הם בדיוק אלה של מוכר קטן בישראל – עמלת פלטפורמה, סליקה, משלוח ומע"מ – המחשבון ההפוך הופך "כמה אני רוצה להרוויח" למחיר שאפשר לפרסם עכשיו, והשוואת הערוצים מראה זה לצד זה איפה אותו מוצר משאיר יותר ביד.',
        en: 'Not a generic percentage calculator: the cost components are exactly those of a small seller in Israel – platform fee, payment processing, shipping and VAT – the reverse calculator turns "how much do I want to make" into a price you can post right now, and the channel comparison shows side by side where the same product leaves more in your pocket.',
      },
      targetUsers: {
        he: ['יוצרים שמתחילים למכור באטסי, באינסטגרם או בירידים', 'מוכרי יד שנייה ודרופשיפינג שרוצים לדעת אם המחיר משתלם', 'חנויות קטנות שפותחות ערוץ מכירה אונליין ורוצות לדעת אם מחיר החנות עובד גם ברשת'],
        en: ['Makers starting to sell on Etsy, Instagram or at fairs', 'Second-hand and dropshipping sellers who want to know whether a price pays off', 'Small shops opening an online channel who want to know whether the in-store price still works online'],
      },
      coreFeatures: {
        he: [
          'טופס עלויות: חומרים, אריזה, משלוח, עמלת פלטפורמה, סליקה ומע"מ',
          'תוצאה מיידית: רווח ליחידה ואחוז רווח, מתעדכנים תוך כדי הקלדה',
          'מחשבון הפוך: מזינים רווח מבוקש ומקבלים מחיר מכירה',
          'תבניות עמלות לערוצים נפוצים שאפשר לערוך ולעדכן',
          'השוואת ערוצים לאותו מוצר זה לצד זה',
          'שמירת מוצרים וספירת יחידות שיורדת עם כל מכירה שמסמנים',
          'שיתוף הסיכום כתמונה או העתקה כטקסט',
        ],
        en: [
          'A cost form: materials, packaging, shipping, platform fee, payment fee and VAT',
          'An instant result: profit per unit and margin, updating as you type',
          'A reverse calculator: enter a target profit and get a selling price',
          'Fee templates for common channels that can be edited and updated',
          'Channel comparison for the same product side by side',
          'Saved products and a unit count that goes down with every sale you log',
          'Share the summary as an image or copy it as text',
        ],
      },
      screens: [
        { name: { he: 'מוצר חדש', en: 'New product' }, description: { he: 'שדות מספריים גדולים אחד מתחת לשני, בורר ערוץ מכירה שממלא עמלות אוטומטית, ושורת תוצאה דביקה בתחתית.', en: 'Large numeric fields stacked vertically, a sales-channel picker that fills fees automatically, and a sticky result bar at the bottom.' } },
        { name: { he: 'תוצאה', en: 'Result' }, description: { he: 'מספר אחד גדול – כמה נשאר ביד – ומתחתיו פירוק לרכיבים כפס צבעוני, עם כפתור "איזה מחיר כדי להרוויח X".', en: 'One big number – what stays in your pocket – with a colour-bar breakdown beneath it and a "what price to earn X" button.' } },
        { name: { he: 'השוואת ערוצים', en: 'Channel comparison' }, description: { he: 'אותו מוצר בשלוש עמודות: ערוץ, מחיר, רווח ליחידה; הערוץ המשתלם מודגש.', en: 'The same product in three columns: channel, price, profit per unit; the best channel highlighted.' } },
        { name: { he: 'המוצרים שלי', en: 'My products' }, description: { he: 'רשימה עם רווח ליחידה ויחידות במלאי; החלקה לסימון מכירה או להוספת יחידות.', en: 'A list with profit per unit and units in stock; swipe to log a sale or add units.' } },
        { name: { he: 'תבניות עמלות', en: 'Fee templates' }, description: { he: 'ערוצי המכירה עם אחוז העמלה, עמלת הסליקה ועמלה קבועה; עריכה חופשית כי העמלות משתנות.', en: 'Sales channels with fee percentage, payment fee and fixed fee; freely editable because fees change.' } },
      ],
      userJourney: {
        he: [
          'יוצרת נרות פותחת מוצר חדש ומזינה חומרים, אריזה ומשלוח',
          'בוחרת "אטסי" והעמלות מתמלאות מהתבנית',
          'רואה שבמחיר שתכננה נשארים לה רק כמה שקלים ליחידה',
          'מקלידה את הרווח שהיא רוצה ומקבלת מחיר מכירה חדש',
          'משווה לדוכן ביריד ורואה שבלי עמלת פלטפורמה משתלם לה שם מחיר אחר',
          'שומרת את המוצר עם 30 יחידות ומסמנת מכירות במהלך השבוע',
        ],
        en: [
          'A candle maker opens a new product and enters materials, packaging and shipping',
          'Picks "Etsy" and the fees fill in from the template',
          'Sees that at the price she planned only a few shekels per unit remain',
          'Types the profit she wants and gets a new selling price',
          'Compares with a fair stall and sees that without a platform fee a different price works there',
          'Saves the product with 30 units and logs sales through the week',
        ],
      },
      uxDirection: {
        he: 'מחשבון שנעים להשתמש בו: מקלדת מספרית גדולה, שדה אחד בפוקוס בכל רגע, והתוצאה מתעדכנת חי בשורה דביקה בתחתית. צבע אחד לרווח וצבע אחד להפסד, בלי גרפים מורכבים. מצב כהה ובהיר, עברית ואנגלית, ומספרים שנשארים משמאל לימין גם בעברית.',
        en: 'A calculator that is pleasant to use: a large numeric keypad, one field in focus at a time, and the result updating live in a sticky bottom bar. One colour for profit and one for loss, no complex charts. Dark and light mode, Hebrew and English, with numbers that stay left-to-right even in Hebrew.',
      },
      architecture: {
        he: 'Expo עם Expo Router, בלי שרת: כל החישובים רצים במכשיר בפונקציות טהורות עם בדיקות יחידה, והמוצרים והתבניות נשמרים ב-SQLite דרך expo-sqlite. תבניות העמלות מגיעות כקובץ JSON בתוך האפליקציה שאפשר לערוך. רכישה חד-פעמית דרך RevenueCat פותחת מוצרים ללא הגבלה. פרויקט מצוין ללמידה של ניווט, טפסים, אחסון מקומי ותשלום באפליקציה.',
        en: 'Expo with Expo Router and no server: every calculation runs on device in pure functions with unit tests, and products and templates are stored in SQLite via expo-sqlite. Fee templates ship as an editable JSON file inside the app. A one-time purchase through RevenueCat unlocks unlimited products. An excellent project for learning navigation, forms, local storage and in-app purchases.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'RevenueCat', 'Jest'],
      database: {
        he: ['products – מוצר, שם, רכיבי עלות, ערוץ ברירת מחדל, יחידות במלאי (מקומי)', 'channels – ערוץ מכירה, אחוז עמלה, עמלת סליקה, עמלה קבועה (מקומי)', 'sales – מכירה שסומנה, מוצר, כמות, תאריך (מקומי)', 'settings – מטבע, שיעור מע"מ, האם המשתמש עוסק פטור (מקומי)'],
        en: ['products – product, name, cost components, default channel, units in stock (local)', 'channels – sales channel, fee percentage, payment fee, fixed fee (local)', 'sales – a logged sale, product, quantity, date (local)', 'settings – currency, VAT rate, whether the user is VAT-exempt (local)'],
      },
      auth: {
        he: 'ללא חשבון וללא הרשמה. כל הנתונים נשמרים במכשיר, והרכישה החד-פעמית מאומתת מול חנות האפליקציות. יצוא וייבוא כקובץ מאפשרים לעבור מכשיר.',
        en: 'No account and no sign-up. All data stays on the device, and the one-time purchase is verified against the app store. Export and import as a file allow moving between devices.',
      },
      monetization: {
        he: ['חינם עד שלושה מוצרים שמורים', 'רכישה חד-פעמית למוצרים ללא הגבלה, השוואת ערוצים ויצוא', 'בהמשך: חבילת תבניות עמלות מעודכנות כמנוי קטן'],
        en: ['Free up to three saved products', 'One-time purchase for unlimited products, channel comparison and export', 'Later: an updated fee-template pack as a small subscription'],
      },
      mvpMilestones: {
        he: ['פונקציות חישוב עם בדיקות: רווח, אחוז, מחיר הפוך', 'מסך קלט ומסך תוצאה', 'תבניות עמלות ובורר ערוץ', 'שמירת מוצרים ב-SQLite וספירת יחידות', 'השוואת ערוצים ושיתוף', 'רכישה חד-פעמית'],
        en: ['Calculation functions with tests: profit, margin, reverse price', 'Input and result screens', 'Fee templates and channel picker', 'Saved products in SQLite and unit count', 'Channel comparison and sharing', 'One-time purchase'],
      },
      risks: {
        he: ['עמלות הפלטפורמות משתנות – תבניות שגויות מייצרות תוצאה שגויה, ולכן הן חייבות להיות ניתנות לעריכה ועם תאריך עדכון', 'כללי מע"מ ועוסק פטור מבלבלים – להציג את ההנחה בבירור ולא לתת ייעוץ מס', 'קל להעתיק – הבידול נשמר דרך התבניות המקומיות והחוויה, לא דרך הנוסחה'],
        en: ['Platform fees change – wrong templates produce wrong results, so they must be editable and show their last-updated date', 'VAT and exempt-dealer rules are confusing – state the assumption clearly and give no tax advice', 'Easy to copy – differentiation lives in the local templates and the experience, not the formula'],
      },
      expansion: {
        he: ['ייבוא מכירות מקובץ CSV של הפלטפורמה', 'תמחור חבילות ומבצעים: כמה נשאר כשנותנים 20% הנחה', 'גרסת ווב קטנה לשימוש מהמחשב'],
        en: ['Import sales from the platform’s CSV export', 'Bundle and promotion pricing: what remains when you give 20% off', 'A small web version for desktop use'],
      },
    },
  },
];
