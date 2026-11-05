import type { Messages } from '../../types';
import type he from '../he/onboarding';

/** English strings for the `onboarding` feature. Must have exactly the keys of ../he/onboarding.ts. */
const messages: Messages<typeof he> = {
  screenTitle: 'New business',
  defaultBusinessName: 'My business',
  progress: 'Step {current} of {total}',
  reviewProgress: 'Review',
  resumed: 'Picking up where you left off.',
  draftRestored: 'We restored what you were typing.',

  actions: {
    continue: 'Continue',
    skip: 'Skip',
    back: 'Back',
    backToReview: 'Back to review',
    create: 'Create my business plan',
  },
  a11y: {
    progress: 'Step {current} of {total}',
    skipHint: 'Marks this question as skipped. You can come back to it from the review.',
    backHint: 'Go back to the previous question',
    editAnswer: 'Edit answer: {question}',
  },

  business_idea: {
    label: 'The idea',
    title: 'What’s your idea?',
    why: 'Everything in your plan starts here. A few plain sentences are enough — you can refine it later.',
    ideaLabel: 'Your idea, in your own words',
    ideaPlaceholder: 'For example: a home bakery selling sourdough loaves to the neighborhood, pre-ordered online',
    nameLabel: 'Working name',
    nameHint: 'Optional. You can change it anytime.',
  },
  country: {
    label: 'Country',
    title: 'Where will the business operate?',
    why: 'Your country shapes currency, taxes and licensing — and so the recommendations in your plan.',
    searchLabel: 'Search countries',
    searchPlaceholder: 'Country name in English or Hebrew',
    noResults: 'No country matches that name. Try another spelling, or skip this question.',
    currencyNote: 'Your business currency will be {currency}. You can change it anytime in business settings.',
    selected: 'Selected: {country}',
  },
  starting_budget: {
    label: 'Starting budget',
    title: 'How much can you invest to get started?',
    why: 'So the plan fits the budget you actually have. A small amount, or zero, is a perfectly good answer.',
    amountLabel: 'Rough amount',
    amountHint: 'A ballpark figure is fine.',
    currencyLabel: 'Currency',
    currencySheetTitle: 'Budget currency',
  },
  experience: {
    label: 'Experience',
    title: 'How much experience do you have in this field?',
    why: 'It tells us how much to explain at each step, and what we can keep short.',
    options: {
      none: { label: 'None yet', description: 'Both the field and running a business are new to me' },
      some: { label: 'Some experience', description: 'I’ve tried it, but not professionally' },
      industry: { label: 'Professional experience', description: 'I’ve worked in this field' },
      founder: { label: 'I’ve started a business before', description: 'I’ve founded or run my own business' },
    },
    detailsLabel: 'Anything we should know?',
    detailsHint: 'Optional.',
    detailsPlaceholder: 'For example: six years in a restaurant kitchen, no management experience',
  },
  target_customers: {
    label: 'Customers',
    title: 'Who are your customers?',
    why: 'A focused picture of your customers is the basis for realistic pricing, marketing and sales estimates.',
    inputLabel: 'Your customers, in your own words',
    hint: 'The more concrete, the more accurate your plan.',
    example:
      'For example: young parents in the city who work from home and want healthy dinners delivered two or three times a week.',
  },
  primary_goal: {
    label: 'Goal',
    title: 'What’s your main goal?',
    why: 'Your goal sets the pace, the priorities and the scope of the plan.',
    options: {
      side_income: { label: 'Extra income', description: 'Alongside a job or studies' },
      full_time: { label: 'A full-time living', description: 'The business becomes my main work' },
      scale: { label: 'A business that grows', description: 'A team, investment and expansion' },
      impact: { label: 'Social impact', description: 'Solving a problem I care about' },
      other: { label: 'Something else', description: 'You can add details below' },
    },
    detailsLabel: 'Want to add details?',
    detailsHint: 'Optional.',
    detailsPlaceholder: 'For example: reach $3,000 a month in revenue within a year',
  },
  weekly_hours: {
    label: 'Weekly time',
    title: 'How many hours a week can you give the business?',
    why: 'So the tasks in your roadmap fit the time you really have.',
    options: {
      lt5: 'Less than 5 hours',
      h5_10: '5–10 hours',
      h10_20: '10–20 hours',
      h20_40: '20–40 hours',
      gt40: 'More than 40 hours',
    },
  },
  launch_timeline: {
    label: 'Launch timing',
    title: 'When do you want to be up and running?',
    why: 'We use it to lay out your roadmap for the first 30, 60 and 90 days.',
    options: {
      m1: 'Within a month',
      m3: 'Within 3 months',
      m6: 'Within 6 months',
      m12: 'Within a year',
      unsure: 'Not sure yet',
    },
  },

  currencies: {
    ILS: 'Israeli new shekel',
    USD: 'US dollar',
    EUR: 'Euro',
    GBP: 'British pound',
    CAD: 'Canadian dollar',
    AUD: 'Australian dollar',
  },

  review: {
    overline: 'Review',
    title: 'One last look',
    body: 'Here are your answers. Tap any row to change it.',
    skipped: 'Skipped',
    unanswered: 'Not answered yet',
    workingName: 'Working name: {name}',
    note: 'Your plan will be drafted with AI from these answers. It’s a working draft: you can edit every part, and its numbers are estimates only.',
  },

  limit: {
    title: 'You’ve reached your business limit',
    bodyFree: {
      one: 'The free plan includes one active business; Pro allows up to {pro}. To start a new one, you can archive an existing business.',
      other:
        'The free plan includes up to {count} active businesses; Pro allows up to {pro}. To start a new one, you can archive an existing business.',
    },
    bodyPro: 'Your plan allows up to {count} active businesses. To start a new one, you can archive an existing business.',
    manage: 'Manage businesses',
    subscription: 'Plan details',
  },

  errors: {
    ideaTooShort: 'Describe your idea in a few words (at least 3 characters).',
    chooseOne: 'Choose one of the options.',
    countryRequired: 'Choose a country from the list, or skip this question.',
    amountRequired: 'Enter an amount, or skip this question.',
    customersRequired: 'Describe your customers, or skip this question.',
    saveFailed: 'We couldn’t save that. What you typed is kept on this device — try again.',
    loadFailed: 'We couldn’t load your previous answers.',
    completeFailed: 'We couldn’t finish setting up. Please try again.',
    offline: 'You’re offline. What you typed is saved on this device; you can continue once you’re back online.',
  },

  businesses: {
    title: 'My businesses',
    new: 'New business',
    active: 'Active',
    incomplete: 'Setup not finished',
    makeActiveHint: 'Makes this the active business and opens Home',
    editA11y: 'Edit details of {name}',
    emptyTitle: 'No businesses yet',
    emptyBody: 'Each business gets its own business plan, roadmap and financial model.',
    emptyAction: 'Start a business',
    loadFailed: 'We couldn’t load your businesses.',
    count: { one: 'One active business', other: '{count} active businesses' },
    edit: {
      title: 'Business details',
      save: 'Save changes',
      stageHint: 'The stage helps tailor recommendations to what the business needs now.',
      stages: {
        idea: 'Still at the idea stage',
        planning: 'Building a plan and testing feasibility',
        launching: 'Getting ready to go to market',
        operating: 'Up and running, with customers',
        growing: 'Expanding the business',
      },
      countryNone: 'Not set',
      countrySheetTitle: 'Choose a country',
      currencySheetTitle: 'Choose a currency',
      currencyHint: 'All amounts for this business are shown in this currency. Changing it doesn’t convert amounts you’ve already entered.',
      useSuggestedCurrency: 'Switch to {currency}, the usual currency in {country}',
      archiveTitle: 'Archive',
      archiveBody: 'An archived business keeps all its data, but it’s hidden from lists and doesn’t count toward your business limit.',
      notFound: 'This business wasn’t found. It may have been archived.',
      offline: 'You’re offline. You can save changes once you’re back online.',
    },
  },
};

export default messages;
