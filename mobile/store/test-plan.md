# Real-device test plan (about 15 minutes)

Run on at least one **older/low-end** phone and one recent phone. Tick each line.

1. Install from the Internal testing link. App opens in Hebrew; icon and name look right.
2. Turn on airplane mode. Everything below must still work.
3. *New game*: paste notes (≥ 6 lines "term: meaning") → progress bar → game starts. Repeat with a topic from the topic library (no notes needed).
4. Movement: joystick moves smoothly, camera drags to look, *Run* and *Action* buttons respond. Frame rate feels steady (note the phone model if not).
5. Open a station, answer wrong then right: sound plays, phone vibrates, score updates, explanation appears.
6. Collect a gem, open a gate, finish a mission: sounds and vibration.
7. Android **Back** button: closes a panel → pauses → leaves the game; other screens go back one screen; from the library the app goes to the background (Home-like) and resumes warm.
8. Press Home during a game and return: the game is paused and resumes where it was. Rotate the phone: layout stays usable.
9. Kill the app (swipe away) and reopen: the game is listed "in progress" with a percentage and resumes with the same score.
10. Finish a game: results screen, stars, review of mistakes, *Practise only these*.
11. Home screen → *Review my mistakes*: only missed questions; right-first-try ones leave for later.
12. Settings: language he/en, theme (device/light/dark), graphics quality A/B/C, sound, music, vibration; changes stick after restart.
13. Delete one game; *Delete all games*.
14. Light theme and dark theme both readable; large system font size (Android *Display size/Font size*) does not break screens.
15. TalkBack on: library, create form and a question can be read and operated.
16. Android 15 or 16 phone: the header is below the status bar and the bottom controls above the gesture bar, in portrait and landscape; the keyboard never covers the notes box (New game) or the e-mail/password fields; switching the system between light and dark keeps the status-bar icons readable.
17. Settings → Backup → *Export my games* opens the Android share sheet (save to Drive/Files); *Import from a file* restores it. Full release checks: `docs/play-release.md`.
