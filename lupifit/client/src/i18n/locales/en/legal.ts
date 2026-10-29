/**
 * Public legal pages: privacy policy, terms of use and account deletion (needed for Google Play).
 * Every statement describes what the code does today. Text in [square brackets] is a placeholder the
 * operator must fill in; the pages highlight it. Hebrew (he/legal.ts) must have exactly the same keys.
 */
const legal = {
  nav: {
    label: 'Legal',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    deletion: 'Delete account',
  },
  draft: {
    title: 'Draft: legal review required before launch',
    body: 'This text describes how the app works today. A lawyer must review it before the app is published (Israeli Privacy Protection Law, including Amendment 13, and the GDPR if the app is offered to people in the EU). Text in [square brackets] must be filled in by the operator.',
  },
  updated: 'Last updated: {date}',
  contents: 'On this page',

  privacy: {
    title: 'Privacy policy',
    intro: 'LUPU-FIT is a fitness and nutrition app. This policy explains what information the app keeps, why, where it is stored, who else receives it, how long it is kept and how you can download or delete it.',
    who: {
      title: 'Who we are',
      body: 'LUPU-FIT is operated by [operator name / business name], [business address] (“we”). For any privacy question or request, write to [contact email address].',
    },
    collect: {
      title: 'What we collect',
      intro: 'We only keep what you enter in the app and what is needed to run it:',
      account: 'Account: your email address, the name you choose, your password (stored only as a salted scrypt hash; the password itself is never stored), language, theme, units and time zone.',
      profile: 'Profile questionnaire: age, sex, height, weight, training experience, goal, where and how often you train, your equipment, optional strength benchmarks (for example maximum push-ups), preferred training days and muscle groups, exercises you like, dislike or want to avoid, injuries and limitations (including notes you type), diet type, allergies, dietary restrictions, foods you dislike, activity level, sleep hours, stress level, meals per day, nutrition targets and reminder settings.',
      training: 'Training: workout plans (including preferences you type when creating a plan), workouts with every set (weight, repetitions, time, effort), notes, personal records and the optional pre-workout check-in (energy, soreness and sleep, each one of three levels).',
      nutrition: 'Nutrition: your food log (food, amount, calories and macronutrients, meal, date, notes and corrections), custom foods and saved meals.',
      weight: 'Body weight: date, weight and an optional note for each weigh-in.',
      coach: 'Coach conversations: your messages and the replies, with technical details of each reply (whether it came from the AI service or the built-in coach, the AI model identifier and the amount of text processed).',
      motivation: 'Motivation: points (XP), achievements and in-app notifications.',
      usage: 'Usage counters: the time of each coach message and meal-photo analysis, used for daily limits. They do not contain the message or the photo.',
      signIn: 'Sign-in records: for each device where you are signed in, the server keeps your IP address and browser identification (user agent) so sessions can be checked and ended. Short-lived records that prevent duplicate submissions keep a copy of the server’s reply for 24 hours.',
      push: 'Phone notifications (only if you turn them on for a device): the address your browser’s push service gave that device, its encryption keys and browser identification, and a record of which reminders were sent (kept 30 days).',
      notCollected: 'We do not collect your location, contacts or microphone. The app has no advertising and no third-party analytics or tracking code.',
    },
    health: {
      title: 'Health information',
      body1: 'Much of this information is about your health: weight, height, injuries, nutrition, sleep, stress and training load. We use it only to provide the app’s features to you.',
      body2: 'Some questionnaire answers are needed to calculate your targets and plan (age, sex, height, weight, experience, goal, training setup, diet type and activity level). Others, such as injuries, notes, sleep and stress, are optional. LUPU-FIT is not a medical service and does not diagnose or treat any condition.',
    },
    use: {
      title: 'Why we use it',
      provide: 'To provide the app: build your workout plan, run workouts, calculate calorie and nutrient targets, keep your food and weight log, and show progress and achievements.',
      safety: 'To keep training safe: users under 18 and users aged 50 and over automatically get more conservative workout plans, calorie targets never go below a computed safe minimum (and never include a deficit under 18), and the coach answers messages about self-harm, medical warning signs, eating-disorder signals or performance-enhancing drug dosing with fixed safety guidance.',
      ai: 'To answer coach questions, read plan preferences and analyse meal photos when AI features are enabled (see “AI features”).',
      security: 'To keep accounts secure: sign-in, rate limits and a temporary lock after repeated failed log-ins.',
      never: 'We do not sell your information, do not use it for advertising and do not build marketing profiles.',
      legalBasis: 'Legal basis (where the GDPR applies): [to be confirmed by a lawyer, e.g. your explicit consent for health information and the performance of the service you asked for].',
    },
    storage: {
      title: 'Where it is stored and how it is protected',
      server: 'Your data is stored in a PostgreSQL database on the server that runs LUPU-FIT, hosted by [hosting provider] in [country / region of the servers].',
      transit: 'The app and the server communicate over an encrypted HTTPS connection.',
      secrets: 'Passwords are stored only as scrypt hashes. Sign-in tokens are random, kept in a cookie that page scripts cannot read, and stored on the server only as a hash.',
      rest: 'The app does not add its own encryption to the stored data. [Describe the hosting provider’s disk encryption and backup protection.]',
      access: 'Access to the server and database is limited to [who has administrative access].',
      device: 'Some data is kept on your device, in the app’s storage: language and theme, your last signed-in profile (for offline use, removed when you log out), drafts of unfinished forms (removed after 3 days, when submitted or when you log out), a workout in progress, workout settings, and entries created offline that are waiting to be sent. Clearing the app’s storage or uninstalling the app removes them.',
      files: 'Files you download from the app (data export or backup) are saved on your device and stay under your control.',
    },
    ai: {
      title: 'AI features',
      intro: 'Some features can use an external AI service provided by Anthropic, PBC (USA). They work only when the operator has configured an AI key. Without it, the coach answers from built-in rules, plan preferences are read by a keyword parser and meal-photo analysis is not available. [State whether AI features are enabled in the published app.]',
      coach: 'Coach: your message, up to the last 12 messages of the same conversation (each shortened to about 2,000 characters) and a summary of your data: your name, an age group (not your exact age), sex, height, weight, goal, experience, training setup and schedule, strength benchmarks, injuries and limitation notes, exercise likes and dislikes, diet type, allergies, restrictions and food dislikes, sleep and stress, nutrition targets, your active plan, your last 5 workouts, 30-day training totals, personal records from the last 90 days, food log averages for the last 7 days and today, your 30-day weight trend, your latest check-in from the last 3 days, time zone and units. Your email address and password are never sent.',
      photo: 'Meal photos: the photo you choose (reduced on your device to at most 1280 pixels and saved again as JPEG, which drops embedded details such as location), the meal type and your language. The photo is not stored on our server. Nothing is added to your log until you review it.',
      plan: 'Workout plan preferences: only the text you type when creating a plan.',
      safety: 'Messages caught by the safety check get a fixed reply without an AI request. They can still be included as earlier context if you keep writing in the same conversation.',
      provider: 'Anthropic processes this data to produce the answer. How long it keeps the data and whether it may use it for anything else is set by its terms and privacy policy: [summarise the AI provider’s data retention and use terms for this account].',
      transfer: 'Using AI features means this data is transferred to servers outside Israel (in the USA). [Lawyer: confirm the transfer basis.]',
      accuracy: 'AI answers and photo estimates can be wrong. They are general guidance, not medical advice.',
    },
    barcode: {
      title: 'Barcode lookup (Open Food Facts)',
      body1: 'When you scan a barcode, the camera image is processed on your device; only the barcode number is sent to our server. You can also type the number.',
      body2: 'If the product is not yet in the app’s food database, our server asks Open Food Facts, a public product database, for that barcode number. No account information is sent, and Open Food Facts sees our server, not your device. The product details are saved in the app’s shared food database and are not linked to you.',
    },
    sharing: {
      title: 'Who else receives data',
      hosting: 'Hosting: [hosting provider], which runs the server and database for us.',
      ai: 'AI service: Anthropic, PBC, only for the AI features described above and only when they are enabled.',
      openFoodFacts: 'Open Food Facts: barcode numbers only, as described above.',
      push: 'Push service: reminders you turned on are delivered through your browser’s push service (Google Firebase Cloud Messaging for Chrome and the Android app; Mozilla or Apple for other browsers). It receives the encrypted notification and the device address, not your account details.',
      email: 'Email: password-reset emails are sent through [email provider], which receives your email address and the reset link. [Fill in once email delivery is set up.]',
      law: 'Authorities, if the law requires it.',
      never: 'Nothing is shared with advertisers, data brokers or other users. There are no public profiles, no chat between users and no location sharing.',
    },
    retention: {
      title: 'How long we keep it',
      account: 'Your account and everything in it: until you delete the item or the account.',
      sessions: 'Sign-in records (IP address, browser identification): until you log out, or until the session expires after 30 days without use; expired records are removed automatically within an hour.',
      push: 'Phone-notification subscriptions: until you turn notifications off on that device, log out of all devices or delete the account; sent-reminder records: 30 days.',
      reset: 'Password-reset links: valid for 30 minutes and removed one day after they expire.',
      duplicates: 'Duplicate-submission records: 24 hours.',
      usage: 'Usage counters: until the account is deleted. Coach-message counters older than 3 days are removed whenever you send a new message.',
      logs: 'Server logs: one technical line per request (time, method, address path, result, duration and a request number), without your IP address, what you sent or your cookies. They are kept by [hosting provider] for [retention period].',
      backups: 'Backups: [how often backups are made, how long they are kept, and when deleted data disappears from them].',
    },
    rights: {
      title: 'Your choices and rights',
      export: 'Download: {profile} → {section} → “{export}” gives you a JSON file with everything stored about you, except passwords, sign-in records and other security data.',
      correct: 'Correct: you can edit your profile, targets, settings, food log and weigh-ins in the app.',
      delete: 'Delete: you can delete single items or your whole account at any time. See “Delete account”.',
      permissions: 'Camera and notifications are used only after you allow them in your browser or device settings, and you can withdraw that permission at any time.',
      law: 'Depending on where you live you may have further rights, for example under Israeli privacy law or the GDPR (including the right to complain to a data protection authority). To use them, write to [contact email address].',
    },
    minors: {
      title: 'Children and teenagers',
      age: 'LUPU-FIT is not meant for children under 13. The age in the profile questionnaire must be at least 13; the app will not save a younger age and cannot be used before the questionnaire is completed. The app cannot verify the age you enter.',
      under13: 'If you are under 13, please do not create an account. If we learn that a child under 13 has an account, we will delete it. A parent can ask us to delete it at [contact email address].',
      consent: 'Users aged 13–17 need the consent of a parent or guardian. The app does not collect or check that consent. [Lawyer: confirm the consent requirement and process.]',
      rules: 'For users under 18 the app automatically applies stricter rules: no calorie deficit, no maximum-effort lifts or loads based on a one-repetition maximum, no advanced exercises, lower effort targets, and the coach is told that the user is a minor.',
      private: 'Nothing a user enters is shown to other users.',
    },
    changes: {
      title: 'Changes to this policy',
      body: 'If this policy changes, we will update this page and the date at the top. [Describe how users are told about significant changes, e.g. in the app or by email.]',
    },
    contact: {
      title: 'Contact',
      body: '[operator name / business name], [business address], [contact email address].',
    },
  },

  terms: {
    title: 'Terms of use',
    intro: 'These terms apply to the LUPU-FIT app and website, operated by [operator name / business name]. By creating an account you agree to them and to the privacy policy.',
    medical: {
      title: 'Not medical advice',
      general: 'LUPU-FIT gives general fitness and nutrition information. It is not medical advice, diagnosis or treatment, and it does not replace a doctor, dietitian, physiotherapist or qualified trainer.',
      doctor: 'Consult a doctor before you start or change an exercise or nutrition program, especially if you have a medical condition or injury, are pregnant or recently gave birth, take medication, have or had an eating disorder, or are under 18.',
      stop: 'Stop exercising and get medical help if you feel pain, dizziness, chest pain, shortness of breath or any other worrying symptom.',
      estimates: 'Calorie and nutrient values, including those from barcodes, meal-photo analysis and the daily menu, are estimates. Dishes in the daily menu have no allergen information: if you have an allergy, always check the ingredients yourself.',
      ai: 'Coach answers and photo analyses are produced automatically and can be wrong or incomplete.',
    },
    eligibility: {
      title: 'Who can use LUPU-FIT',
      age: 'You must be at least 13 years old.',
      minors: 'If you are under 18, you may use LUPU-FIT only with the consent of a parent or guardian, who should read these terms and the privacy policy with you. [Lawyer: confirm the age and consent requirements.]',
    },
    account: {
      title: 'Your account',
      accurate: 'Give accurate information: your plan and targets are calculated from it.',
      password: 'Keep your password secret. You are responsible for what is done with your account. You can sign out of all devices in the settings.',
    },
    use: {
      title: 'Acceptable use',
      body: 'Do not try to access other people’s data, overload or attack the service, get around its limits or use it for anything unlawful.',
    },
    content: {
      title: 'Your data and our content',
      yours: 'Your data belongs to you. You can download or delete it at any time (see the privacy policy).',
      ours: 'The app’s software, texts and design are protected by intellectual property law. Product data from Open Food Facts is available under the Open Database License. [List the licences of any other third-party content, including the dish photos.]',
    },
    service: {
      title: 'Availability and changes',
      body: 'The service is provided “as is”. We try to keep it available and accurate but cannot guarantee it. Features may change. AI features and barcode lookup depend on outside services and may be unavailable.',
    },
    liability: {
      title: 'Limitation of liability',
      body: 'To the extent the law allows, [operator name / business name] is not liable for injury, health problems or other damage resulting from using the app, including from following a plan, target or AI answer. [Lawyer: adapt to Israeli consumer protection law.]',
    },
    ending: {
      title: 'Ending your use',
      body: 'You can stop using LUPU-FIT and delete your account at any time. We may close an account that seriously breaks these terms. [Describe the notice process.]',
    },
    law: {
      title: 'Governing law',
      body: 'These terms are governed by the laws of the State of Israel, and the competent courts in [city] have jurisdiction. [Lawyer: confirm.]',
    },
    changes: {
      title: 'Changes to these terms',
      body: 'We may update these terms; the date at the top shows the current version. [Describe how users are told about significant changes before they apply.]',
    },
    contact: {
      title: 'Contact',
      body: '[operator name / business name], [business address], [contact email address].',
    },
  },

  deletion: {
    title: 'Delete your LUPU-FIT account',
    intro: 'You can delete your account and all of its data at any time, directly in the app. Deletion takes effect immediately and cannot be undone.',
    inApp: {
      title: 'Delete it in the app',
      open: 'Open LUPU-FIT and sign in.',
      profile: 'Open {profile}: tap the person icon at the top of the screen (on a computer, choose {profile} in the side menu).',
      section: 'Go to the “{section}” section at the bottom of the page.',
      export: 'Optional: tap “{export}” to keep a copy of your data first.',
      delete: 'Tap “{delete}”.',
      confirm: 'Enter your password, type DELETE in capital letters and tap “{submit}”.',
      done: 'Your account is deleted at once and you are signed out.',
    },
    deleted: {
      title: 'What is deleted',
      intro: 'Everything linked to your account is removed from the app’s database:',
      account: 'Your account: email address, name, password hash and settings.',
      profile: 'Profile questionnaire answers and nutrition targets.',
      training: 'Workout plans, workout history and sets, personal records and pre-workout check-ins.',
      nutrition: 'Food log, custom foods and saved meals.',
      weight: 'Body-weight entries.',
      coach: 'Coach conversations.',
      motivation: 'Points, achievements and notifications.',
      technical: 'Usage counters, sign-in records, password-reset links and duplicate-submission records.',
    },
    kept: {
      title: 'What is not deleted',
      products: 'Product details fetched from Open Food Facts for barcodes you looked up stay in the app’s shared food database. They contain only product data and are not linked to you.',
      logs: 'Server logs contain no account details, IP address or content you sent. They are kept by the hosting provider for [retention period].',
      backups: 'Backups: [when deleted data disappears from backups].',
      ai: 'If you used AI features, what was sent to the AI provider is subject to its retention terms: [summarise].',
      device: 'Files you downloaded (data export or backup) and data stored on your device stay until you delete them, clear the app’s storage or uninstall the app.',
    },
    noLogin: {
      title: 'Can’t sign in?',
      forgot: 'Forgot your password? Use “{forgot}” on the sign-in screen to choose a new one, then follow the steps above. [Keep this line only if password-reset emails are set up.]',
      email: 'Otherwise, email [contact email address] from the address you registered with and ask us to delete your account. We may ask you to confirm that the address is yours, and we will delete the account and all its data within [number] days.',
    },
    partial: {
      title: 'Delete only some data',
      body: 'You can delete single food log entries, weigh-ins, workouts, plans, custom foods, saved meals and coach conversations in the app without deleting your account.',
    },
  },
};

export default legal;
