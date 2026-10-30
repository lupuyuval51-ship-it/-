/** Device mode: the app with its server inside (no account, no server). Start-up screens of `DeviceGate`. */
const device = {
  /** Name of the hidden device account (shown in the menu; can be changed in the settings). */
  defaultName: 'Me',
  boot: {
    title: 'Getting LUPU-FIT ready',
    database: 'Opening your data on this phone…',
    migrating: 'Updating your data for the new version…',
    firstLaunch: 'Setting up LUPU-FIT on this phone. The first launch takes a little longer.',
    content: 'Loading exercises, foods and dishes…',
    account: 'Almost there…',
    local: 'Your data stays on this phone. No account and no server are needed.',
  },
  locked: {
    title: 'LUPU-FIT is open in another tab',
    body: 'Your data can be open in one place at a time. Close LUPU-FIT in the other tab or window, and it opens here by itself.',
  },
  failed: {
    title: "LUPU-FIT couldn't start",
    unsupported: 'This browser cannot run the version that works on the phone (it needs WebAssembly, IndexedDB and Web Locks). Update the browser or Android System WebView.',
    storage_full: "The phone's storage is full. Free up some space and try again. Your data has not been deleted.",
    storage: "The app couldn't open its storage on this phone. If this is a private window, open LUPU-FIT in a regular one.",
    migration: 'Updating your data for the new version failed. Your data is kept; try again.',
    account: "The app couldn't sign in on this phone. Try again.",
    unknown: 'Something went wrong while starting. Try again.',
    retry: 'Try again',
    details: 'Technical details',
  },
};

export default device;
