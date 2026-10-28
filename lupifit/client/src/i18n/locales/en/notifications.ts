/** Owned by the notifications feature. Hebrew (he/notifications.ts) must have exactly the same keys. */
const notifications = {
  title: 'Notifications',
  subtitle: 'Milestones, records and goals from your training.',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  allRead: 'All notifications marked as read',
  delete: 'Delete notification',
  deleteTitle: 'Delete this notification?',
  deleted: 'Notification deleted',
  unread: 'Unread',
  unreadCount: { zero: 'No unread notifications', one: '{count} unread', other: '{count} unread' },
  bellLabel: { zero: 'Notifications', one: 'Notifications, {count} unread', other: 'Notifications, {count} unread' },
  empty: {
    title: "You're all caught up",
    body: 'Achievements, personal records and weekly goals will appear here.',
  },
  kinds: {
    achievement: 'Achievement unlocked: {title}',
    level_up: 'Level up! You reached level {level}.',
    personal_record: 'New personal record on {exercise} — {recordType}: {value}',
    personal_record_previous: 'New personal record on {exercise} — {recordType}: {value} (previous {previous})',
    weekly_goal: 'Weekly goal reached: {completed} of {goal} workouts this week.',
    reminder: 'Reminder',
    info: 'Update from LUPIFIT',
  },
  relative: {
    justNow: 'Just now',
  },
  reminders: {
    workoutTitle: 'Time to train',
    workoutBody: "It's one of your workout days — your next session is waiting.",
    mealTitle: 'Time to log your meal',
    mealBody: 'Logging now keeps your nutrition on track.',
    open: 'Open',
  },
};

export default notifications;
