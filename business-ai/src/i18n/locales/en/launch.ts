import type { Messages } from '../../types';
import type he from '../he/launch';

/** English strings for the `launch` feature. Must have exactly the keys of ../he/launch.ts. */
const messages: Messages<typeof he> = {
  title: 'Launch Center',
  header: {
    country: 'Business country',
    noCountry: 'No country selected',
    change: 'Change',
    changeA11y: 'Change the country in the business settings',
  },
  disclaimer: {
    title: 'Guidance only',
    body: 'This is general, educational information to help you find your way. It isn’t legal, tax or financial advice. Requirements depend on your type of business and location and change over time, so verify with the official source or a licensed professional before you decide anything.',
  },
  seed: {
    action: 'Add recommended items for {country}',
    more: {
      one: '1 recommended item isn’t on your list yet',
      other: '{count} recommended items aren’t on your list yet',
    },
    added: {
      zero: 'All recommended items are already on your list',
      one: 'Added 1 item to your list',
      other: 'Added {count} items to your list',
    },
    reviewed: 'Sources last reviewed on {date}',
  },
  generic: {
    title: 'Topics worth researching',
    note: 'We don’t have verified official sources for {country} yet, so no recommended items were added. These are the topics usually worth checking before opening a business — look them up on the country’s official government portal or ask a professional.',
    noCountryNote: 'Choose a country in your business settings to get location-specific recommendations. Meanwhile, these are the topics usually worth checking before opening a business.',
    setCountry: 'Choose a country',
    registration: 'How to register a business and which legal structures exist',
    tax: 'Registering with the tax authorities and ongoing reporting',
    licensing: 'Licenses and permits for your activity and location',
    privacy: 'Rules for keeping and using customers’ and employees’ personal data',
    insurance: 'Insurance that is required or worth considering',
    banking: 'Opening a business bank account and keeping business money separate',
  },
  categories: {
    registration: 'Registration',
    tax: 'Tax',
    licensing: 'Licensing',
    privacy: 'Privacy and data',
    insurance: 'Insurance',
    banking: 'Banking',
    other: 'Other',
  },
  status: {
    todo: 'To do',
    done: 'Done',
    not_applicable: 'Not applicable',
  },
  progress: '{done} of {total} done',
  progressA11y: 'Launch checklist progress: {done} of {total} done',
  progressNotApplicable: {
    one: '1 item marked not applicable',
    other: '{count} items marked not applicable',
  },
  row: {
    source: 'Source: {name}',
    openSourceA11y: 'Open source: {name}',
    toggleA11y: 'Mark item as done',
    openItemA11y: 'Item details',
  },
  empty: {
    title: 'Your checklist is empty',
    body: 'Track the official steps for opening your business here — registration, tax, licensing, privacy, insurance and banking — with a link to the official source for each item.',
  },
  addCustom: 'Add your own item',
  updated: 'Status updated',
  offline: 'You’re offline. You can view the checklist; changes will be possible once you’re back online.',
  openSourceFailed: 'We couldn’t open the link. Please try again.',
  noBusiness: 'Set up a business first to use the Launch Center.',
  item: {
    newTitle: 'New item',
    editTitle: 'Checklist item',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    categoryLabel: 'Topic',
    statusLabel: 'Status',
    notesLabel: 'Notes',
    notesHint: 'Your private notes, for example what you’ve checked and who you spoke to',
    sourceTitle: 'Source (optional)',
    sourceNameLabel: 'Source name',
    sourceUrlLabel: 'Link',
    sourceUrlHint: 'An address starting with https://',
    openSource: 'Open source',
    templateNote: 'This item is based on an official source reviewed on {date}. Check the source to make sure it’s still current.',
    create: 'Add to checklist',
    created: 'Item added',
    saved: 'Changes saved',
    delete: 'Delete item',
    deleteConfirmTitle: 'Delete this item?',
    deleteConfirmBody: 'It will be removed from your checklist. You can add recommended items again at any time.',
    deleted: 'Item deleted',
    notFoundTitle: 'Item not found',
    notFoundBody: 'It may have been deleted.',
    back: 'Back to the Launch Center',
  },
  form: {
    sourceUrlInvalid: 'Enter a link starting with http:// or https://',
    sourceUrlRequired: 'Add a link to the source',
  },
};

export default messages;
