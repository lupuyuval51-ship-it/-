/**
 * Device mode: the app with its server inside (no account, no server, data only on this phone).
 * Start-up screens (`DeviceGate`), the first-run welcome, the "data on this phone" settings and the texts
 * that replace server-only ones in device mode.
 */
const device = {
  /** Name of the hidden device account until the welcome screen sets one. */
  defaultName: 'Me',
  boot: {
    title: 'Getting LUPU-FIT ready',
    database: 'Opening your data on this phone…',
    migrating: 'Updating your data for the new version…',
    migratingNote: 'This happens once after an update. Your data is kept.',
    firstLaunch: 'Setting up LUPU-FIT on this phone. The first launch takes a little longer.',
    content: 'Loading exercises, foods and dishes…',
    account: 'Almost there…',
    progress: 'Start-up step {current} of {total}',
    local: 'Your data stays on this phone. No account and no server are needed.',
  },
  locked: {
    title: 'LUPU-FIT is open in another tab',
    body: 'Your data can be open in one place at a time. Close LUPU-FIT in the other tab or window, and it opens here by itself.',
    waiting: 'Waiting for the other tab to close…',
  },
  failed: {
    title: "LUPU-FIT couldn't start",
    unsupported: 'This browser cannot run the version that works on the phone (it needs WebAssembly, IndexedDB and Web Locks). Update the browser or Android System WebView.',
    storage_full: "The phone's storage is full. Free up some space and try again. Your data has not been deleted.",
    storage: "The app couldn't open its storage on this phone. If this is a private window, open LUPU-FIT in a regular one.",
    migration: 'Updating your data for the new version failed. Your data is kept; try again.',
    account: "The app couldn't sign in on this phone. Try again.",
    unknown: 'Something went wrong while starting. Try again.',
    keepTrying: 'If it keeps happening, close LUPU-FIT completely and open it again, or restart the phone. Nothing is deleted when the app fails to start.',
    retry: 'Try again',
    details: 'Technical details',
  },
  welcome: {
    title: 'Welcome to LUPU-FIT',
    body: 'Workout plans, live workouts, a food diary and a coach, all on this phone. No account, no sign-in.',
    nameLabel: 'What should we call you?',
    nameHint: 'Shown only in the app. You can change it in the settings.',
    nameRequired: 'Enter a name or a nickname.',
    start: 'Continue',
    local: 'Your data is kept on this phone, not on a server.',
    restoreTitle: 'Coming from another phone?',
    restoreBody: 'If you saved a LUPU-FIT backup file, restore it to bring back your plans, workouts and food diary.',
    restore: 'Restore from a backup file',
  },
  /** Settings: what replaces the account, security and privacy sections. */
  settings: {
    subtitle: 'Your answers, preferences, targets and data.',
    preferencesTitle: 'Name & preferences',
    preferencesSubtitle: 'Name, language, appearance, units and time zone.',
    workoutSubtitle: 'How the live workout screen behaves on this phone.',
    dataTitle: 'Your data on this phone',
    dataSubtitle: 'Backup, restore and erasing.',
    onlyHere:
      'Everything you record in LUPU-FIT is stored only on this phone. There is no account and no server, so nothing is copied to other devices.',
    lossWarning:
      'If the app is uninstalled, or the phone is lost or reset, the data is gone, unless you have a backup file. Save one from time to time and keep it somewhere safe, such as Google Drive, your e-mail or a computer.',
    androidBackup:
      "Android's own backup may also bring the app's data back on a new phone, but that depends on the phone's backup settings and on how much data there is, so it is not guaranteed. A backup file is the reliable way.",
    backupTitle: 'Backup file',
    backupHint: 'One readable file (JSON) with everything: profile, plans, workout history, records, food diary, saved meals, coach conversations and achievements.',
    saveBackup: 'Save backup file',
    lastBackup: 'Last backup file saved: {date}.',
    noBackupYet: 'No backup file has been saved on this phone yet.',
    backupSaved: 'Backup file saved',
    backupShared: 'Backup file handed over for saving',
    restoreTitle: 'Restore from a backup file',
    restoreHint: 'Brings back everything from a LUPU-FIT backup file, for example from your previous phone. It replaces what is on this phone now.',
    restore: 'Restore from a backup file',
    legalTitle: 'Privacy and terms',
    eraseTitle: 'Erase all data on this phone',
    eraseHint: 'Deletes everything LUPU-FIT stored on this phone and starts over, like a new install.',
    erase: 'Erase all data',
  },
  erase: {
    step1Title: 'Erase all data on this phone?',
    step1Body:
      'This deletes your profile, plans, workout history, records, food diary, saved meals, coach conversations and achievements from this phone. There is no copy anywhere else.',
    backupFirst: 'Save a backup file first',
    continue: 'Continue',
    step2Title: 'Last check',
    step2Body: 'Erasing cannot be undone. Only a backup file you saved can bring the data back.',
    confirm: 'Erase everything',
    erasing: 'Erasing…',
  },
  restore: {
    title: 'Restore from a backup file',
    from: 'Backup file from {date}.',
    contains: 'It contains:',
    profile: 'Your profile and settings',
    plans: { one: '{count} workout plan', other: '{count} workout plans' },
    workouts: { one: '{count} finished workout', other: '{count} finished workouts' },
    foods: { one: '{count} food diary entry', other: '{count} food diary entries' },
    weights: { one: '{count} weigh-in', other: '{count} weigh-ins' },
    coach: { one: '{count} coach conversation', other: '{count} coach conversations' },
    replaceWarning: 'Restoring replaces everything that is on this phone now with the contents of the backup file.',
    confirm: 'Restore',
    restoring: 'Restoring your data…',
    done: 'Your backup was restored.',
    failed: "The backup couldn't be restored. Nothing on this phone was changed.",
    errors: {
      too_large: 'This file is too large to be a backup.',
      not_json: 'This file could not be read.',
      not_a_backup: 'This is not a LUPU-FIT backup file.',
      unsupported_version: 'This backup was made by a newer version of LUPU-FIT. Update the app, then try again.',
      no_snapshot: 'This backup file was made by the LUPU-FIT website and can only be restored there.',
      not_a_snapshot: 'This backup file is damaged or incomplete.',
      snapshot_invalid: 'This backup file holds values the app cannot use. Nothing on this phone was changed.',
    },
  },
  coach: {
    title: 'Coach',
    notice: 'The coach works on this phone: its answers come from your own data and the LUPU-FIT exercise library. AI conversations are not part of this version.',
  },
  nutrition: {
    dayEmptyBody: 'Search foods, scan a barcode or reuse a saved meal.',
    barcodeInternet: 'Barcode lookup needs internet. Only the barcode number is sent, to Open Food Facts (a free product database).',
    barcodeOffline: "You're offline, so barcodes can't be looked up right now. Search the built-in foods or add the food yourself; barcode lookup works again once you're connected.",
    barcodeFailed: "Open Food Facts couldn't be reached. Check the internet connection and try again, or add the food yourself.",
  },
  workouts: {
    explanationRules: "LUPU-FIT's training engine builds your plan from your profile, equipment and recorded performance. Free-text preferences are matched with keywords on this phone.",
  },
  errors: {
    network: 'Something went wrong on this phone. Try again; if it keeps happening, close LUPU-FIT and open it again.',
  },
  /** Android app: Android's share sheet opened to save a file (backup, export). */
  saveFile: {
    dialogTitle: 'Save or send the file',
  },
};

export default device;
