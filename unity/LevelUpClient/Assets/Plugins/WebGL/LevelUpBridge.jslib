// Unity -> page. The page validates every message (src/lib/game/unity/bridge.ts) and ignores anything unexpected.
mergeInto(LibraryManager.library, {
  LevelUp_PostMessage: function (ptr) {
    var json = UTF8ToString(ptr);
    if (typeof window !== "undefined" && typeof window.__levelupUnityMessage === "function") {
      window.__levelupUnityMessage(json);
    }
  },
});
