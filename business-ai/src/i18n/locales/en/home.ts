import type { Messages } from '../../types';
import type he from '../he/home';

/** English strings for the `home` feature. Must have exactly the keys of ../he/home.ts. */
const messages: Messages<typeof he> = {
  title: 'Home',
  businessA11y: 'Active business: {name}, stage {stage}. Opens your list of businesses.',
  noBusiness: {
    title: 'No active business yet',
    body: 'Pick one of your businesses or start a new one.',
    action: 'Go to businesses',
  },
  next: {
    heading: 'Next step',
    continueOnboarding: {
      title: 'Finish setting up your business',
      body: 'A few more answers and we can draft your business plan.',
      cta: 'Continue setup',
    },
    generatePlan: {
      title: 'Create your business plan',
      body: 'We’ll draft it from your answers. Every section is editable and shows where its information comes from.',
      cta: 'Create plan',
    },
    planGenerating: {
      title: 'Your plan is being written',
      body: 'This usually takes a minute or two. You can keep working in the app meanwhile.',
      cta: 'View progress',
    },
    retryPlan: {
      title: 'Plan generation didn’t finish',
      body: 'Nothing was lost. You can try again now.',
      cta: 'Try again',
    },
    createRoadmap: {
      title: 'Build your 90-day roadmap',
      body: 'Turn the plan into concrete, dated tasks across three 30-day phases.',
      cta: 'Go to roadmap',
    },
    overdueTask: {
      title: '{title}',
      body: {
        one: '1 day overdue. This is your most pressing task right now.',
        other: '{count} days overdue. This is your most pressing task right now.',
      },
      cta: 'Open task',
    },
    nextTask: {
      title: '{title}',
      dueToday: 'Due today.',
      dueTomorrow: 'Due tomorrow.',
      dueInDays: {
        one: 'Due in 1 day.',
        other: 'Due in {count} days.',
      },
      milestone: 'Moves milestone {milestone} forward.',
      noDate: 'Next on your roadmap by date and priority.',
      cta: 'Open task',
    },
    setupFinances: {
      title: 'Set up your finances',
      body: 'Starting capital, costs and pricing — to see how long your money lasts and when you break even.',
      cta: 'Set up finances',
    },
    askAdvisor: {
      title: 'Every roadmap task is done',
      body: 'Ask the advisor what to focus on next, based on where your business is now.',
      cta: 'Ask the advisor',
      prompt:
        'I’ve completed every task on my roadmap. Based on where my business is now, what should my next three priorities be, and which tasks should I add?',
    },
  },
  today: {
    heading: 'Today',
    allTasks: 'All tasks',
    empty: 'Nothing due today.',
    more: {
      one: 'and 1 more',
      other: 'and {count} more',
    },
  },
  roadmap: {
    heading: 'Roadmap',
    open: 'Open roadmap',
    phase: {
      days_30: 'First 30 days',
      days_60: 'Days 31–60',
      days_90: 'Days 61–90',
    },
    progress: '{done} of {total}',
    progressA11y: '{phase}: {done} of {total} tasks done',
    noTasks: 'No tasks',
    empty: 'No roadmap yet. It’s built from your business plan.',
  },
  budget: {
    heading: 'Budget',
    open: 'Open finances',
    estimateNote: 'Estimates from your assumptions, expected scenario. Not a guarantee of results.',
    startingCapital: 'Starting capital',
    startupCosts: 'Startup costs',
    monthlyFixed: 'Monthly fixed costs',
    runway: 'Runway',
    runwayMonths: {
      one: '1 month',
      other: '{count} months',
    },
    runwayLessThanMonth: 'Less than a month',
    runwayBeyond: {
      one: 'More than 1 month',
      other: 'More than {count} months',
    },
    empty: 'No financial details yet.',
    setup: 'Set up finances',
    actualHeading: 'Actual, {month}',
    actualIncome: 'Income',
    actualExpenses: 'Expenses',
    actualNet: 'Net',
    actualOpen: 'Open performance',
  },
  milestones: {
    heading: 'Upcoming milestones',
    empty: 'No open milestones.',
    noDate: 'No date',
  },
  workspace: {
    title: 'Workspace',
    groups: {
      work: 'Work',
      grow: 'Grow',
      manage: 'Manage',
      account: 'Account',
    },
    tasks: {
      title: 'Tasks',
      description: 'Every task for this business, by date and priority',
      count: {
        one: '{count} open',
        other: '{count} open',
      },
      none: 'None open',
    },
    roadmap: {
      title: 'Roadmap',
      description: 'Your 30/60/90-day phases and milestones',
    },
    marketing: {
      title: 'Marketing Studio',
      description: 'Copy for ads, social posts and your landing page',
    },
    launch: {
      title: 'Launch Center',
      description: 'Registration, tax and licensing, with official sources',
    },
    performance: {
      title: 'Performance',
      description: 'Actual income and expenses, compared with the plan',
    },
    transactions: {
      title: 'Transactions',
      description: 'Record your business income and expenses',
    },
    goals: {
      title: 'Goals',
      description: 'Business goals and progress toward them',
      count: {
        one: '{count} active',
        other: '{count} active',
      },
    },
    businesses: {
      title: 'Businesses',
      description: 'Switch, edit or start a business',
    },
    subscription: {
      title: 'Subscription',
      description: 'Plan limits and this month’s usage',
    },
    settings: {
      title: 'Settings',
      description: 'Language, appearance and account',
    },
  },
};

export default messages;
