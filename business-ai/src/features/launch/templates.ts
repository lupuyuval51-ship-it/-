/**
 * Launch Center checklist templates — curated, location-aware, and sourced.
 *
 * Every item below was checked against the official page it cites on `LAUNCH_TEMPLATES_LAST_REVIEWED`.
 * Items are phrased as "check whether / learn about" — they point people to the official source and
 * never state a legal conclusion for their specific business. Countries without verified items get
 * generic research categories instead (see `GENERIC_RESEARCH_CATEGORIES`).
 *
 * Rules for editing this file:
 * - Never add an item without opening the official page and confirming it supports the text.
 * - `sourceUrl` must be https on an official government / regulator domain (see OFFICIAL_SOURCE_DOMAINS).
 * - `key` is stable (stored as launch_checklist_items.template_key): never rename an existing key.
 * - Update `LAUNCH_TEMPLATES_LAST_REVIEWED` (and `lastReviewed` of changed items) after a review.
 *
 * Pure data + helpers — no React.
 */

export const LAUNCH_CATEGORIES = ['registration', 'tax', 'licensing', 'privacy', 'insurance', 'banking', 'other'] as const;
export type LaunchCategory = (typeof LAUNCH_CATEGORIES)[number];

export const LAUNCH_STATUSES = ['todo', 'done', 'not_applicable'] as const;
export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];

/** Countries with verified template items. */
export const TEMPLATE_COUNTRIES = ['IL', 'US', 'GB'] as const;
export type TemplateCountry = (typeof TEMPLATE_COUNTRIES)[number];

/** Categories suggested for research when no verified items exist for a country. */
export const GENERIC_RESEARCH_CATEGORIES = ['registration', 'tax', 'licensing', 'privacy', 'insurance', 'banking'] as const satisfies readonly LaunchCategory[];

export const LAUNCH_TEMPLATES_LAST_REVIEWED = '2026-11-05';

/** Official domains a template source may live on (the host must equal one or be a subdomain). */
export const OFFICIAL_SOURCE_DOMAINS = ['gov.il', 'sba.gov', 'irs.gov', 'ftc.gov', 'gov.uk', 'ico.org.uk'] as const;

export interface Localized {
  he: string;
  en: string;
}

export interface LaunchTemplateItem {
  /** Stable key, stored as `launch_checklist_items.template_key` (e.g. 'il.tax_file'). */
  key: string;
  country: TemplateCountry;
  category: LaunchCategory;
  title: Localized;
  description: Localized;
  sourceName: Localized;
  sourceUrl: string;
  /** ISO date the source was last checked. */
  lastReviewed: string;
}

const REVIEWED = LAUNCH_TEMPLATES_LAST_REVIEWED;

/* ------------------------------------------------------------------ */
/* Israel                                                              */
/* ------------------------------------------------------------------ */

const IL: readonly LaunchTemplateItem[] = [
  {
    key: 'il.tax_file',
    country: 'IL',
    category: 'tax',
    title: {
      he: 'לבדוק איך פותחים תיק עוסק ברשות המסים',
      en: 'Learn how to open a business file with the Israel Tax Authority',
    },
    description: {
      he: 'כדאי לברר איך פותחים תיק במע״מ ובמס הכנסה, ואם העסק מתאים למעמד של עוסק פטור. הזכאות תלויה במחזור העסקאות השנתי הצפוי (התקרה העדכנית מופיעה בעמוד השירות), ויש עיסוקים שמחייבים רישום כעוסק מורשה גם במחזור נמוך.',
      en: 'Find out how to open a VAT and income tax file, and whether your business qualifies as an exempt dealer (osek patur). Eligibility depends on your expected annual turnover (the service page lists the current ceiling), and some professions must register as a licensed dealer (osek murshe) even with a low turnover.',
    },
    sourceName: { he: 'רשות המסים – gov.il', en: 'Israel Tax Authority, gov.il (in Hebrew)' },
    sourceUrl: 'https://www.gov.il/he/service/request-open-exempt-dealer-via-internet',
    lastReviewed: REVIEWED,
  },
  {
    key: 'il.deductions_file',
    country: 'IL',
    category: 'tax',
    title: {
      he: 'לבדוק אם צריך גם תיק ניכויים',
      en: 'Check whether you also need a deductions file',
    },
    description: {
      he: 'אם העסק יעסיק עובדים או ישכור נכס לצורך הפעילות, כדאי לבדוק אם צריך לפתוח גם תיק ניכויים לדיווח על התשלומים האלה. עמוד השירות של רשות המסים מציין זאת לגבי עובדים ושכירות.',
      en: 'If the business will employ people or rent premises for its activity, check whether you also need to open a deductions file (tik nikuyim) to report those payments. The Tax Authority’s service page notes this for employees and rent.',
    },
    sourceName: { he: 'רשות המסים – gov.il', en: 'Israel Tax Authority, gov.il (in Hebrew)' },
    sourceUrl: 'https://www.gov.il/he/service/request-open-exempt-dealer-via-internet',
    lastReviewed: REVIEWED,
  },
  {
    key: 'il.national_insurance',
    country: 'IL',
    category: 'registration',
    title: {
      he: 'לברר על רישום כעצמאי בביטוח הלאומי',
      en: 'Learn about registering as self-employed with National Insurance',
    },
    description: {
      he: 'הביטוח הלאומי מבקש ממי שמתחיל לעבוד כעצמאי להודיע על כך מיד עם תחילת העבודה, כדי להיות מבוטח כעצמאי. דמי הביטוח נקבעים לפי ההכנסה הצפויה שעליה מצהירים, ואפשר לעדכן את ההצהרה. מי שעדיין לא פתח תיק ברשות המסים יכול לפתוח את שני התיקים בתהליך דיגיטלי אחד.',
      en: 'Bituach Leumi asks people who start working as self-employed to notify it as soon as they start, so they are insured as self-employed. Contributions are based on the expected income you declare, and you can update that declaration. If you have not opened a Tax Authority file yet, you can open both files in one digital process.',
    },
    sourceName: { he: 'המוסד לביטוח לאומי', en: 'National Insurance Institute (Bituach Leumi, in Hebrew)' },
    sourceUrl: 'https://www.btl.gov.il/Insurance/National%20Insurance/type_list/Self_Employed/Pages/howtoregister.aspx',
    lastReviewed: REVIEWED,
  },
  {
    key: 'il.business_license',
    country: 'IL',
    category: 'licensing',
    title: {
      he: 'לבדוק אם העסק טעון רישיון עסק',
      en: 'Check whether your business needs a business license',
    },
    description: {
      he: 'סוגי העסקים שחייבים ברישיון נקבעים בצו רישוי עסקים, מכוח חוק רישוי עסקים. את הבקשה מגישים לרשות המקומית שבה העסק נמצא, ולכן כדאי לבדוק מול מחלקת רישוי העסקים ברשות המקומית לפני הפתיחה.',
      en: 'The types of business that need a license are set in the Business Licensing Order, under the Business Licensing Law. Applications go to the local authority where the business is located, so it is worth checking with its business licensing department before you open.',
    },
    sourceName: { he: 'gov.il – בקשה לרישיון עסק', en: 'gov.il: Business license application (in Hebrew)' },
    sourceUrl: 'https://www.gov.il/he/service/application-for-new-business-license',
    lastReviewed: REVIEWED,
  },
  {
    key: 'il.privacy',
    country: 'IL',
    category: 'privacy',
    title: {
      he: 'להכיר את כללי אבטחת המידע למאגרי מידע',
      en: 'Learn the data security rules for personal data',
    },
    description: {
      he: 'אם העסק שומר מידע אישי, למשל רשימת לקוחות או פרטי עובדים, כדאי להכיר את תקנות הגנת הפרטיות (אבטחת מידע). לפי הרשות להגנת הפרטיות התקנות חלות על כל המשק, והדרישות תלויות ברמת האבטחה של המאגר. כדאי לבדוק באתר הרשות אם יש הנחיות עדכניות.',
      en: 'If the business keeps personal information, such as a customer list or employee details, learn about the Privacy Protection (Data Security) Regulations. According to the Privacy Protection Authority they apply across the economy, and the required measures depend on the database’s security level. Check the Authority’s site for current guidance.',
    },
    sourceName: { he: 'הרשות להגנת הפרטיות', en: 'Privacy Protection Authority (guide, in Hebrew)' },
    sourceUrl:
      'https://www.gov.il/BlobFolder/guide/data_security_guide/he/%D7%94%D7%9E%D7%93%D7%A8%D7%99%D7%9A%20%D7%94%D7%9E%D7%9C%D7%90%20%D7%9C%D7%99%D7%99%D7%A9%D7%95%D7%9D%20%D7%AA%D7%A7%D7%A0%D7%95%D7%AA%20%D7%90%D7%91%D7%98%D7%97%D7%AA%20%D7%9E%D7%99%D7%93%D7%A2%20%E2%80%93PDF%20%D7%9C%D7%94%D7%93%D7%A4%D7%A1%D7%94_1.pdf',
    lastReviewed: REVIEWED,
  },
];

/* ------------------------------------------------------------------ */
/* United States                                                       */
/* ------------------------------------------------------------------ */

const SBA_LAUNCH = 'https://www.sba.gov/counseling/launch-your-business/';
const SBA_NAME: Localized = { he: 'SBA – Launch your business (באנגלית)', en: 'U.S. Small Business Administration (SBA)' };

const US: readonly LaunchTemplateItem[] = [
  {
    key: 'us.business_structure',
    country: 'US',
    category: 'registration',
    title: { he: 'להכיר את המבנים המשפטיים לעסק', en: 'Learn about business structures' },
    description: {
      he: 'המבנה המשפטי (עסק יחיד, שותפות, LLC, תאגיד ועוד) משפיע על המסים, על הניירת ועל האחריות האישית, ובוחרים אותו לפני הרישום במדינה. הכללים משתנים ממדינה למדינה, ובמבנה לא שגרתי ה-SBA ממליץ להתייעץ עם יועץ עסקי או עורך דין.',
      en: 'Your structure (sole proprietorship, partnership, LLC, corporation and others) affects your taxes, paperwork and personal liability, and you choose it before registering with your state. Rules vary by state, and for a less common setup the SBA suggests speaking with a business counselor or an attorney.',
    },
    sourceName: SBA_NAME,
    sourceUrl: `${SBA_LAUNCH}#business-structure`,
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.register_business',
    country: 'US',
    category: 'registration',
    title: { he: 'לבדוק איך רושמים את העסק', en: 'Check how to register your business' },
    description: {
      he: 'איפה ואיך נרשמים תלוי במבנה העסק ובמיקום שלו. ברוב המדינות הרישום נעשה מול משרד מזכיר המדינה (Secretary of State) או גוף עסקי של המדינה. אם העסק פועל בשם מסחרי (DBA), ייתכן שצריך לרשום גם אותו.',
      en: 'Where and how you register depends on your structure and location. Most states handle registration through the Secretary of State’s office or a state business agency. If you use a trade name (DBA), you may need to register it as well.',
    },
    sourceName: SBA_NAME,
    sourceUrl: `${SBA_LAUNCH}#register-business`,
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.ein',
    country: 'US',
    category: 'tax',
    title: { he: 'לבדוק אם צריך מספר EIN מה-IRS', en: 'Check whether you need an EIN from the IRS' },
    description: {
      he: 'מספר EIN הוא מספר הזיהוי של העסק במסים הפדרליים. ה-IRS מנפיק אותו בחינם באתר שלו, ואין צורך לשלם עליו לאף גורם. מי שמקים LLC או תאגיד צריך להשלים קודם את הרישום במדינה.',
      en: 'An Employer Identification Number is your business’s federal tax ID. The IRS issues it for free on its website, and you never have to pay a fee for one. If you are forming an LLC or a corporation, form it with your state first.',
    },
    sourceName: { he: 'IRS – רשות המסים הפדרלית (באנגלית)', en: 'Internal Revenue Service (IRS)' },
    sourceUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number',
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.state_tax_id',
    country: 'US',
    category: 'tax',
    title: { he: 'לבדוק אם צריך מספר מזהה למס במדינה', en: 'Check whether you need a state tax ID' },
    description: {
      he: 'הצורך במספר מזהה מדינתי תלוי במסי ההכנסה והתעסוקה של המדינה שבה העסק פועל. כדאי לבדוק באתר מחלקת ההכנסות (Department of Revenue) של המדינה.',
      en: 'Whether you need one depends on your state’s income and employment taxes. Check your state’s Department of Revenue website.',
    },
    sourceName: SBA_NAME,
    sourceUrl: `${SBA_LAUNCH}#tax-ids`,
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.licenses_permits',
    country: 'US',
    category: 'licensing',
    title: { he: 'לבדוק אילו רישיונות והיתרים נדרשים', en: 'Check which licenses and permits apply' },
    description: {
      he: 'הדרישות תלויות בסוג הפעילות ובמיקום. פעילות בפיקוח פדרלי דורשת רישיון פדרלי, ומדינות, מחוזות וערים מסדירים תחומים רבים נוספים, כמו מסעדות, בנייה וקמעונאות. חלק מהרישיונות צריך לחדש מדי תקופה.',
      en: 'Requirements depend on what you do and where. Federally regulated activities need a federal license, and states, counties and cities regulate many others, such as restaurants, construction and retail. Some licenses must be renewed periodically.',
    },
    sourceName: SBA_NAME,
    sourceUrl: `${SBA_LAUNCH}#licenses-permits`,
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.bank_account',
    country: 'US',
    category: 'banking',
    title: { he: 'להכיר את פתיחת חשבון בנק עסקי', en: 'Learn about opening a business bank account' },
    description: {
      he: 'ה-SBA ממליץ לפתוח חשבון עסקי ברגע שהעסק מתחיל לקבל או להוציא כסף. בנקים מבקשים בדרך כלל מספר EIN (או מספר SSN לעסק יחיד), מסמכי התאגדות, הסכמי בעלות ורישיון עסק.',
      en: 'The SBA recommends opening one as soon as you start accepting or spending money as a business. Banks commonly ask for an EIN (or a Social Security number for sole proprietors), formation documents, ownership agreements and a business license.',
    },
    sourceName: SBA_NAME,
    sourceUrl: `${SBA_LAUNCH}#bank-account`,
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.insurance',
    country: 'US',
    category: 'insurance',
    title: { he: 'לבדוק אילו ביטוחים העסק צריך', en: 'Check which business insurance you need' },
    description: {
      he: 'לפי ה-SBA, עסק עם עובדים חייב בביטוח פיצויים לעובדים (workers’ compensation), בביטוח אבטלה ובביטוח נכות, ובחלק מהמדינות יש דרישות נוספות. כיסויים אחרים, כמו ביטוח אחריות כללית, תלויים בסיכונים של העסק.',
      en: 'According to the SBA, businesses with employees must have workers’ compensation, unemployment and disability insurance, and some states require more. Other coverage, such as general liability, depends on your risks.',
    },
    sourceName: SBA_NAME,
    sourceUrl: `${SBA_LAUNCH}#business-insurance`,
    lastReviewed: REVIEWED,
  },
  {
    key: 'us.privacy',
    country: 'US',
    category: 'privacy',
    title: { he: 'ללמוד איך להגן על מידע אישי', en: 'Learn how to protect personal information' },
    description: {
      he: 'המדריך של ה-FTC לעסקים ממליץ לדעת איזה מידע אישי נשמר בעסק, לשמור רק את מה שצריך, להגן עליו, להשמיד אותו בצורה בטוחה כשאין בו עוד צורך ולהכין תוכנית למקרה של אירוע אבטחה.',
      en: 'The FTC’s guide for businesses recommends knowing what personal information you hold, keeping only what you need, protecting it, disposing of it securely when you no longer need it and having a plan for security incidents.',
    },
    sourceName: { he: 'FTC – נציבות הסחר הפדרלית (באנגלית)', en: 'Federal Trade Commission (FTC)' },
    sourceUrl: 'https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business',
    lastReviewed: REVIEWED,
  },
];

/* ------------------------------------------------------------------ */
/* United Kingdom                                                      */
/* ------------------------------------------------------------------ */

function govUk(en: string): Localized {
  return { he: `GOV.UK – ${en} (באנגלית)`, en: `GOV.UK: ${en}` };
}

const GB: readonly LaunchTemplateItem[] = [
  {
    key: 'gb.business_structure',
    country: 'GB',
    category: 'registration',
    title: { he: 'להכיר את הדרכים להקים עסק', en: 'Learn about ways to set up a business' },
    description: {
      he: 'רוב העסקים נרשמים כעוסק יחיד (sole trader) או כחברה בע״מ (limited company). המבנה משפיע על אופן תשלום המס ועל האחריות המשפטית, כולל האחריות לחובות העסק.',
      en: 'Most businesses register as a sole trader or a limited company. The structure affects how you pay tax and your legal responsibilities, including liability for business debts.',
    },
    sourceName: govUk('Set up a business'),
    sourceUrl: 'https://www.gov.uk/set-up-business',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.sole_trader',
    country: 'GB',
    category: 'registration',
    title: { he: 'עוסק יחיד: לבדוק מתי צריך להירשם', en: 'Sole trader: check when you need to register' },
    description: {
      he: 'עוסק יחיד יכול להתחיל לעבוד מיד, אבל חייב להירשם ל-Self Assessment אם ההכנסה שלו עולה על 1,000 ליש״ט בשנת מס (6 באפריל עד 5 באפריל).',
      en: 'You can start trading straight away, but you must register for Self Assessment if you earn more than £1,000 in a tax year (6 April to 5 April).',
    },
    sourceName: govUk('Become a sole trader'),
    sourceUrl: 'https://www.gov.uk/become-sole-trader',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.limited_company',
    country: 'GB',
    category: 'registration',
    title: { he: 'חברה בע״מ: להכיר את חובות הרישום והדיווח', en: 'Limited company: learn about registration and filing duties' },
    description: {
      he: 'חברה בע״מ צריכה להירשם לפני שהיא מתחילה לפעול. הדירקטורים אחראים לנהל רישומים, לאשר את המידע שמופיע ב-Companies House ולהגיש את הדוחות הכספיים ודוחות המס של החברה.',
      en: 'A limited company must be registered before it starts trading. Directors are responsible for keeping records, confirming the information Companies House holds, and filing the company’s accounts and tax returns.',
    },
    sourceName: govUk('Set up a private limited company'),
    sourceUrl: 'https://www.gov.uk/limited-company-formation',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.self_assessment',
    country: 'GB',
    category: 'tax',
    title: { he: 'לבדוק את המועד להרשמה ל-Self Assessment', en: 'Check the Self Assessment registration deadline' },
    description: {
      he: 'מי שצריך להגיש דוח מס ולא הגיש בעבר צריך להודיע לרשות המסים הבריטית (HMRC) עד 5 באוקטובר שאחרי סוף שנת המס. הודעה מאוחרת עלולה לגרור קנס.',
      en: 'If you need to send a tax return and have not sent one before, you must tell HMRC by 5 October after the end of that tax year. Telling them late could mean a penalty.',
    },
    sourceName: govUk('Register for Self Assessment'),
    sourceUrl: 'https://www.gov.uk/register-for-self-assessment',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.vat',
    country: 'GB',
    category: 'tax',
    title: { he: 'לבדוק את סף הרישום למע״מ', en: 'Check the VAT registration threshold' },
    description: {
      he: 'חובה להירשם למע״מ אם המחזור החייב במס ב-12 החודשים האחרונים עלה על 90,000 ליש״ט, או אם הוא צפוי לעלות על הסכום הזה ב-30 הימים הקרובים. אפשר גם להירשם מרצון מתחת לסף.',
      en: 'You must register for VAT if your taxable turnover for the last 12 months goes over £90,000, or you expect it to go over that in the next 30 days. You can also choose to register below the threshold.',
    },
    sourceName: govUk('Register for VAT'),
    sourceUrl: 'https://www.gov.uk/register-for-vat',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.licences',
    country: 'GB',
    category: 'licensing',
    title: { he: 'לבדוק אם הפעילות דורשת רישיון', en: 'Check whether you need a licence' },
    description: {
      he: 'חלק מהפעילויות העסקיות דורשות רישיון, היתר או הסמכה, למשל מכירת אלכוהול. בשירות Find a licence של GOV.UK אפשר לחפש לפי סוג הפעילות והאזור, אבל ייתכן שלא כל הרישיונות מופיעים בו.',
      en: 'Some business activities need a licence, permit or certification, such as selling alcohol. GOV.UK’s Find a licence service lets you search by activity and location, though it may not include every licence you need.',
    },
    sourceName: govUk('Find a licence'),
    sourceUrl: 'https://www.gov.uk/find-licences',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.data_protection',
    country: 'GB',
    category: 'privacy',
    title: { he: 'להכיר את כללי הגנת המידע', en: 'Learn the data protection rules' },
    description: {
      he: 'עסק ששומר מידע אישי על עובדים או לקוחות, או משתמש בו, חייב לפעול לפי כללי הגנת המידע: לשמור על המידע מאובטח, מדויק ועדכני, ולהסביר לאנשים איך ישתמשו במידע שלהם.',
      en: 'If your business stores or uses personal information about staff or customers, you must follow data protection rules: keep it secure, accurate and up to date, and tell people how you will use their information.',
    },
    sourceName: govUk('Data protection and your business'),
    sourceUrl: 'https://www.gov.uk/data-protection-your-business',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.ico_fee',
    country: 'GB',
    category: 'privacy',
    title: { he: 'לבדוק אם צריך לשלם דמי הגנת מידע ל-ICO', en: 'Check whether you need to pay the ICO data protection fee' },
    description: {
      he: 'עסקים, ארגונים ועוסקים יחידים שמעבדים מידע אישי צריכים לשלם דמי הגנת מידע שנתיים לנציבות המידע (ICO), אלא אם הם פטורים. כדאי לבדוק אם התשלום חל עליך לפני ההרשמה.',
      en: 'Businesses, organisations and sole traders that process personal data must pay an annual fee to the Information Commissioner’s Office unless they are exempt. Check whether you need to pay before you register.',
    },
    sourceName: govUk('Pay the data protection fee'),
    sourceUrl: 'https://www.gov.uk/data-protection-register-notify-ico-personal-data',
    lastReviewed: REVIEWED,
  },
  {
    key: 'gb.employers_liability',
    country: 'GB',
    category: 'insurance',
    title: { he: 'העסקת עובדים: לבדוק ביטוח חבות מעבידים', en: 'Employing people: check employers’ liability insurance' },
    description: {
      he: 'מעסיקים חייבים בדרך כלל בביטוח חבות מעבידים (Employers’ Liability) ממבטח מורשה מהרגע שהם מתחילים להעסיק, עם חריגים מסוימים, למשל כשמעסיקים רק בן משפחה.',
      en: 'Employers generally must get employers’ liability insurance from an authorised insurer as soon as they become an employer, with some exceptions, such as employing only a family member.',
    },
    sourceName: govUk('Employers’ liability insurance'),
    sourceUrl: 'https://www.gov.uk/employers-liability-insurance',
    lastReviewed: REVIEWED,
  },
];

/* ------------------------------------------------------------------ */
/* Exports & lookups                                                   */
/* ------------------------------------------------------------------ */

export const LAUNCH_TEMPLATES: readonly LaunchTemplateItem[] = [...IL, ...US, ...GB];

export const LAUNCH_TEMPLATES_BY_COUNTRY: Readonly<Record<TemplateCountry, readonly LaunchTemplateItem[]>> = { IL, US, GB };

export const LAUNCH_TEMPLATE_BY_KEY: ReadonlyMap<string, LaunchTemplateItem> = new Map(LAUNCH_TEMPLATES.map((t) => [t.key, t]));

export function isTemplateCountry(code: string | null | undefined): code is TemplateCountry {
  return typeof code === 'string' && (TEMPLATE_COUNTRIES as readonly string[]).includes(code.toUpperCase());
}

/** Verified items for an ISO-2 country code (case-insensitive); empty when none are available. */
export function templatesForCountry(code: string | null | undefined): readonly LaunchTemplateItem[] {
  if (!code) return [];
  const upper = code.toUpperCase();
  return isTemplateCountry(upper) ? LAUNCH_TEMPLATES_BY_COUNTRY[upper] : [];
}

export function isLaunchCategory(value: unknown): value is LaunchCategory {
  return typeof value === 'string' && (LAUNCH_CATEGORIES as readonly string[]).includes(value);
}

export function isLaunchStatus(value: unknown): value is LaunchStatus {
  return typeof value === 'string' && (LAUNCH_STATUSES as readonly string[]).includes(value);
}

/** True when `url` is https on an official domain (exact host or a subdomain of it). */
export function isOfficialSourceUrl(url: string): boolean {
  // Parsed by hand: React Native's URL implementation does not expose `hostname` everywhere.
  const match = /^https:\/\/([a-z0-9.-]+)(?::\d+)?(?:[/?#]|$)/i.exec(url.trim());
  if (!match?.[1]) return false;
  const host = match[1].toLowerCase();
  return OFFICIAL_SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}
