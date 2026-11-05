import type { Messages } from '../../types';
import type he from '../he/business';

/** Business records (English). */
const messages: Messages<typeof he> = {
  fields: {
    name: 'Business name',
    nameHint: 'You can change this anytime.',
    idea: 'The idea',
    stage: 'Stage',
    country: 'Country',
    currency: 'Currency',
  },
  stage: {
    idea: 'Idea',
    planning: 'Planning',
    launching: 'Launching',
    operating: 'Operating',
    growing: 'Growing',
  },
  active: {
    label: 'Active business',
    switch: 'Switch business',
    switched: 'Switched to {name}',
  },
  create: {
    title: 'New business',
    submit: 'Create business',
    created: 'Business created',
  },
  update: {
    saved: 'Changes saved',
  },
  archive: {
    action: 'Archive',
    confirmTitle: 'Archive {name}?',
    confirmBody: 'It won’t be deleted, but it will be hidden from lists and won’t count toward your business limit.',
    confirm: 'Archive',
    done: 'Business archived',
  },
  untitled: 'Untitled business',
};

export default messages;
