# Ready workouts

213 ready-made workouts and 39 sport finisher blocks, generated from the data (`npm run docs:workouts`). Equipment, muscles and length are derived from the exercises, never typed in.

## How the app uses them

1. The user picks **where** they train: gym, home or park.
2. At home or in the park they tick **which equipment** they have (at the gym everything is assumed).
3. They pick **bodyweight** or **weights**.
4. They pick a muscle focus (chest, back, shoulders, biceps, triceps, arms, abs, core, glutes, quads, hamstrings, legs, upper body, full body, cardio), optionally a level and a time limit.
5. On the workout page the app asks whether they **train a specific sport**. If they do, the **last 10 minutes** are a finisher for that sport (physical preparation, not coaching in the sport).
6. Age, reported injuries and the under-18 rules adapt or hide workouts: exercises are swapped for easier alternatives or removed, older adults get a low-impact finisher.

## Numbers

| | |
|---|---|
| Workouts | 213 |
| Sport finisher blocks | 39 (13 sports x 3 variants) |
| Workouts that need no equipment | 61 |
| Library exercises used | 237 of 244 |
| By mode | bodyweight 88, weights 125 |
| By place | gym 206, home 139, park 153 |
| By level | beginner 73, intermediate 98, advanced 42 |

| Focus | Workouts |
|---|---|
| Chest (חזה) | 16 |
| Back (גב) | 16 |
| Shoulders (כתפיים) | 15 |
| Biceps (דו-ראשי) | 6 |
| Triceps (תלת-ראשי) | 6 |
| Arms (ידיים) | 7 |
| Abs (בטן) | 10 |
| Core (ליבה) | 12 |
| Glutes (ישבן) | 17 |
| Quads (ארבע-ראשי) | 10 |
| Hamstrings (ירך אחורי) | 11 |
| Legs (רגליים) | 21 |
| Upper body (פלג גוף עליון) | 17 |
| Full body (כל הגוף) | 31 |
| Cardio (קרדיו) | 18 |

## Chest (חזה) - 16 workouts

### Machine Chest Basics / יסודות חזה במכונות

`chest_gym_machine_basics` · beginner · weights · gym · 28 min · 4 exercises, 11 sets · gear: dumbbells, bench, cable_machine, chest_press_machine · muscles: chest

A gentle first chest session: a machine press, an incline dumbbell press, a cable fly and incline push-ups. Straight sets with moderate rest, built for learning the movements.

אימון חזה עדין למתחילים: לחיצה במכונה, לחיצה בשיפוע חיובי במשקולות יד, פרפר בכבלים ושכיבות סמיכה בידיים מוגבהות. סטים רגילים עם מנוחה בינונית, כדי ללמוד את התנועות.

- Machine Chest Press: 3 x 10-12, rest 60 s
- Incline Dumbbell Press: 3 x 10-12, rest 60 s
- Cable Chest Fly: 3 x 12-15, rest 45 s
- Incline Push-Up: 2 x 8-12, rest 45 s

### Smith Press and Fly / לחיצת סמית׳ ופרפר

`chest_gym_smith_press_and_fly` · beginner · weights · gym · 29 min · 4 exercises, 11 sets · gear: dumbbells, bench, smith_machine, dip_bars, resistance_bands · muscles: chest, triceps

A beginner chest session that moves from a fixed-path bar press to push-ups, assisted dips and a dumbbell fly. Straight sets, three sets or fewer per exercise.

אימון חזה למתחילים שעובר מלחיצה במסלול קבוע במכונת סמית׳ לשכיבות סמיכה, מקבילים בעזרת גומייה ופרפר במשקולות יד. סטים רגילים, עד שלושה סטים לתרגיל.

- Smith Machine Bench Press: 3 x 8-12, rest 75 s
- Push-Up: 3 x 6-12, rest 60 s
- Band-Assisted Dip: 2 x 6-10, rest 60 s
- Dumbbell Fly: 3 x 12-15, rest 45 s

### Barbell and Incline Builder / לחיצת מוט ושיפוע חיובי

`chest_gym_barbell_incline_builder` · intermediate · weights · gym · 35 min · 4 exercises, 14 sets · gear: barbell, dumbbells, bench · muscles: chest

Intermediate chest day led by a barbell bench press, followed by an incline dumbbell press, a dumbbell fly and a push-up finisher. Straight sets with moderate to heavy loads.

יום חזה בינוני שנפתח בלחיצת חזה במוט, ממשיך בלחיצה בשיפוע חיובי במשקולות יד ופרפר, ונסגר בשכיבות סמיכה. סטים רגילים עם משקלים בינוניים עד כבדים.

- Barbell Bench Press: 4 x 6-10, rest 90 s
- Incline Dumbbell Press: 4 x 8-12, rest 75 s
- Dumbbell Fly: 3 x 12-15, rest 45 s
- Push-Up: 3 x 10-20, rest 45 s

### Upper Chest Focus / דגש על החזה העליון

`chest_gym_upper_chest_focus` · intermediate · weights · gym · 38 min · 5 exercises, 15 sets · gear: barbell, dumbbells, bench, cable_machine, chest_press_machine · muscles: chest

Intermediate session that leads with an incline barbell press, then a flat dumbbell press, decline push-ups, a cable fly and a machine press to finish. Straight sets, moderate rest.

אימון בינוני שפותח בלחיצה בשיפוע חיובי במוט, ממשיך בלחיצת חזה במשקולות יד, שכיבות סמיכה ברגליים מוגבהות ופרפר בכבלים, ונסגר בלחיצה במכונה. סטים רגילים ומנוחה בינונית.

- Incline Barbell Bench Press: 4 x 6-10, rest 90 s
- Dumbbell Bench Press: 3 x 8-12, rest 75 s
- Decline Push-Up: 3 x 10-15, rest 60 s
- Cable Chest Fly: 3 x 12-15, rest 45 s
- Machine Chest Press: 2 x 12-15, rest 45 s

### Heavy Bench and Archer Push-ups / לחיצה כבדה ושכיבות סמיכה קשת

`chest_gym_heavy_bench_archer` · advanced · weights · gym · 55 min · 5 exercises, 19 sets · gear: barbell, dumbbells, bench, cable_machine, dip_bars · muscles: chest, triceps

Advanced chest session: heavy barbell bench sets, an incline press, dips and archer push-ups for one-sided strength, closing with a cable fly. Longer rests, quality reps only.

אימון חזה למתקדמים: סטים כבדים של לחיצת חזה במוט, לחיצה בשיפוע חיובי, מקבילים ושכיבות סמיכה קשת לכוח חד-צדדי, ופרפר בכבלים לסיום. מנוחות ארוכות, חזרות איכותיות בלבד.

- Barbell Bench Press: 5 x 5-8, rest 120 s
- Incline Dumbbell Press: 4 x 6-10, rest 90 s
- Parallel Bar Dip: 4 x 8-12, rest 90 s
- Archer Push-Up: 3 x 5-8, rest 90 s
- Cable Chest Fly: 3 x 10-12, rest 60 s

### Push-Up Foundations / יסודות שכיבות סמיכה

`chest_bw_push_up_foundations` · beginner · bodyweight · home / park / gym · 30 min · 5 exercises, 13 sets · gear: none · muscles: chest, upper_back, triceps, rear_delts

A first push-up session: an incline push-up, a knee push-up, shoulder-blade control and a halfway hold, finished with a back raise. Straight sets of three or fewer, built to learn good form.

אימון ראשון בשכיבות סמיכה: שכיבות בידיים מוגבהות ועל הברכיים, שליטה בשכמות והחזקה בחצי ירידה, ובסיום הרמת ידיים בשכיבה על הבטן. סטים רגילים, עד שלושה סטים, כדי ללמוד טכניקה נכונה.

- Incline Push-Up: 3 x 8-12, rest 60 s
- Knee Push-Up: 3 x 6-10, rest 60 s
- Scapular Push-Up: 2 x 8-12, rest 45 s
- Halfway Push-Up Hold: 3 x 20 s, rest 45 s
- Prone T Raise: 2 x 8-12, rest 45 s

### Push-Up Width Mix / שכיבות סמיכה ברוחבים שונים

`chest_bw_width_mix` · beginner · bodyweight · home / park / gym · 31 min · 5 exercises, 12 sets · gear: none · muscles: chest, abs, traps, triceps

Standard, wide and close-grip push-ups change how the chest, shoulders and triceps share the work. A back raise and a plank balance the session. Straight sets, with room to progress.

שכיבות סמיכה רגילות, רחבות וצרות משנות את חלוקת העבודה בין החזה, הכתפיים והתלת-ראשי. הרמת ידיים בשכיבה על הבטן ופלאנק מאזנים את האימון. סטים רגילים, עם מקום להתקדם.

- Push-Up: 3 x 5-8, rest 75 s
- Prone Y Raise: 2 x 8-10, rest 45 s
- Wide Push-Up: 3 x 8-12, rest 60 s
- Close-Grip Push-Up: 2 x 6-10, rest 60 s
- Plank: 2 x 30 s, rest 45 s

### Moving Push-Up Mix / שכיבות סמיכה בתנועה

`chest_bw_moving_push_ups` · intermediate · bodyweight · home / park / gym · 39 min · 6 exercises, 17 sets · gear: none · muscles: chest, obliques, abs, rear_delts

Push-up variations that add a sweeping hip-to-chest motion, a knee drive and a shoulder tap, so the chest works through more angles. A snow-angel raise and a side plank balance the session. Straight sets.

וריאציות של שכיבות סמיכה עם תנועה סוחפת מהאגן אל החזה, הבאת ברך לכיוון המרפק ונגיעה בכתף, כך שהחזה עובד בזוויות רבות. מלאך שלג הפוך ופלאנק צידי מאזנים את האימון. סטים רגילים.

- Hindu Push-Up: 3 x 8-10, rest 60 s
- Spider-Man Push-Up: 3 x 8-12, rest 60 s
- Push-Up with Shoulder Tap: 3 x 10-16, rest 60 s
- Wide Push-Up: 3 x 12-18, rest 45 s
- Reverse Snow Angel: 3 x 10-12, rest 45 s
- Side Plank: 2 x 30 s, rest 30 s

### Explosive Push-Up Power / כוח מתפרץ בשכיבות סמיכה

`chest_bw_explosive_decline` · intermediate · bodyweight · home / park / gym · 41 min · 5 exercises, 17 sets · gear: none · muscles: chest, abs, lower_back, upper_back

Starts fresh with a few fast, explosive push-ups, then builds volume with decline and slow-tempo push-ups. A swimmer and a hollow hold balance the session. For people who already do clean push-ups.

פותחים כשהגוף רענן עם מעט שכיבות סמיכה מהירות ומתפרצות, ואז מוסיפים נפח בשכיבות סמיכה ברגליים מוגבהות ובקצב איטי. שחיין בשכיבה והחזקת הולו מאזנים. למי שכבר מצליחים לבצע שכיבות סמיכה נקיות.

- Explosive Push-Up: 4 x 5-8, rest 90 s
- Decline Push-Up: 4 x 8-12, rest 75 s
- Push-Up: 3 x 12-20, rest 60 s
- Prone Swimmer: 3 x 12-20, rest 45 s
- Hollow Body Hold: 3 x 30 s, rest 45 s

### Dip and Decline Chest / מקבילים ושכיבות סמיכה ברגליים מוגבהות

`chest_bars_dip_and_decline` · intermediate · bodyweight · gym / park · 40 min · 5 exercises, 16 sets · gear: pull_up_bar, dip_bars · muscles: chest, triceps, abs, hip_flexors

A bar-based chest session: forward-leaning chest dips, decline and wide push-ups, an inverted row for balance and a hanging knee raise. Straight sets with moderate rest, for people with a solid push-up base.

אימון חזה על מוטות ומקבילים: מקבילים בהטיה קדימה, שכיבות סמיכה ברגליים מוגבהות וברוחב רחב, מתח אוסטרלי לאיזון והרמת ברכיים בתלייה. סטים רגילים עם מנוחה בינונית, למי שכבר יש בסיס טוב בשכיבות סמיכה.

- Chest Dip: 4 x 6-10, rest 90 s
- Decline Push-Up: 3 x 10-15, rest 75 s
- Wide Push-Up: 3 x 12-15, rest 60 s
- Inverted Row: 3 x 8-12, rest 60 s
- Hanging Knee Raise: 3 x 8-12, rest 45 s

### Rings and Archer Push-Ups / שכיבות סמיכה על טבעות וארצ׳ר

`chest_rings_archer_clap` · advanced · bodyweight · home / park · 43 min · 5 exercises, 16 sets · gear: gymnastic_rings · muscles: chest, abs, hip_flexors, lats

An advanced push-up session: clap push-ups while fresh, ring push-ups for stability, archer push-ups for one-sided strength, then a ring row and a V-up to balance. Needs a pair of gymnastic rings.

אימון שכיבות סמיכה מתקדם: מחיאות כף כשהגוף רענן, שכיבות סמיכה על טבעות ליציבות, שכיבות ארצ׳ר לכוח חד-צדדי, ולסיום חתירה בטבעות וי-אפ לאיזון. דורש זוג טבעות התעמלות.

- Clap Push-Up: 3 x 4-6, rest 90 s
- Ring Push-Up: 4 x 6-10, rest 90 s
- Archer Push-Up: 3 x 4-8, rest 90 s
- Ring Row: 3 x 8-12, rest 60 s
- V-Up: 3 x 10-15, rest 45 s

### Floor Press Chest Starter / התחלה בחזה מהרצפה

`chest_dumbbell_floor_starter` · beginner · weights · gym / home / park · 31 min · 5 exercises, 13 sets · gear: dumbbells · muscles: chest, triceps

A bench-free first chest session: floor press, squeeze press and floor fly with dumbbells, then incline push-ups and a short halfway hold. Straight sets, moderate loads.

אימון חזה ראשון בלי ספסל: לחיצה מהרצפה, לחיצה בהצמדת משקולות ופרפר על הרצפה, ואחר כך שכיבות סמיכה בידיים מוגבהות והחזקה קצרה. סטים רגילים ומשקל בינוני.

- Dumbbell Floor Press: 3 x 10-12, rest 60 s
- Dumbbell Squeeze Press: 3 x 10-12, rest 60 s
- Dumbbell Floor Fly: 2 x 12-15, rest 45 s
- Incline Push-Up: 3 x 8-12, rest 45 s
- Halfway Push-Up Hold: 2 x 20 s, rest 45 s

### Dumbbell Chest Builder / בניית חזה במשקולות

`chest_dumbbell_bench_builder` · intermediate · weights · gym / home / park · 40 min · 5 exercises, 16 sets · gear: dumbbells, bench · muscles: chest, lats

Classic bench chest work: an incline press and a flat press, decline push-ups, then a fly and a pullover for the stretch. Straight sets, mostly 8-12 reps, with 60-75 s rest. Needs a bench.

עבודת חזה קלאסית על ספסל: לחיצה בשיפוע חיובי ולחיצה שטוחה, שכיבות סמיכה ברגליים מוגבהות, ואז פרפר ופולאובר למתיחת החזה. סטים רגילים, בעיקר של 8-12 חזרות, עם מנוחה של 60-75 שניות. דורש ספסל.

- Incline Dumbbell Press: 4 x 8-12, rest 75 s
- Dumbbell Bench Press: 3 x 8-12, rest 75 s
- Decline Push-Up: 3 x 10-15, rest 60 s
- Dumbbell Fly: 3 x 10-12, rest 60 s
- Dumbbell Pullover: 3 x 10-12, rest 60 s

### Power Push and Floor Press / דחיפה מתפרצת ולחיצה מהרצפה

`chest_dumbbell_power_push` · intermediate · weights · gym / home / park · 42 min · 5 exercises, 17 sets · gear: dumbbells · muscles: chest, triceps, shoulders

Starts fresh with explosive push-ups, then a heavier floor press, Hindu push-ups, a squeeze press and a floor fly. No bench needed. Longer rests on the big lifts, short rests at the end.

פותחים עם שכיבות סמיכה מתפרצות כשהגוף רענן, ואז לחיצה כבדה יותר מהרצפה, שכיבות סמיכה הינדיות, לחיצה בהצמדה ופרפר על הרצפה. בלי ספסל. מנוחה ארוכה בתרגילים הגדולים וקצרה בסוף.

- Explosive Push-Up: 4 x 5-8, rest 75 s
- Dumbbell Floor Press: 4 x 8-10, rest 90 s
- Hindu Push-Up: 3 x 8-12, rest 60 s
- Dumbbell Squeeze Press: 3 x 10-12, rest 60 s
- Dumbbell Floor Fly: 3 x 12-15, rest 45 s

### Heavy Dumbbell Chest Day / יום חזה כבד במשקולות יד

`chest_dumbbell_heavy_archer` · advanced · weights · gym / home / park · 50 min · 5 exercises, 18 sets · gear: dumbbells, bench · muscles: chest, lats

Advanced strength work: a heavy bench press, archer push-ups, a squeeze press, then a pullover and a floor fly. Long rests; keep every rep controlled and stop a rep or two short of failure.

עבודת כוח למתקדמים: לחיצת חזה כבדה על ספסל, שכיבות סמיכה קשת (ארצ׳ר), לחיצה בהצמדה, ואז פולאובר ופרפר על הרצפה. מנוחות ארוכות; כל חזרה מבוקרת ולעצור חזרה או שתיים לפני כישלון.

- Dumbbell Bench Press: 5 x 6-8, rest 105 s
- Archer Push-Up: 4 x 5-8, rest 90 s
- Dumbbell Squeeze Press: 3 x 8-10, rest 75 s
- Dumbbell Pullover: 3 x 8-10, rest 75 s
- Dumbbell Floor Fly: 3 x 10-12, rest 60 s

### Band and Push-up Chest Builder / בניית חזה עם גומייה ושכיבות סמיכה

`chest_bands_push_up_and_press` · intermediate · weights · home / park / gym · 43 min · 6 exercises, 19 sets · gear: resistance_bands · muscles: chest, triceps, shoulders

Decline and Hindu push-ups paired with band presses and flies. Straight sets with moderate rest, finished by a triceps extension and a halfway push-up hold. Suits people who already do full push-ups.

שכיבות סמיכה ברגליים מוגבהות והינדיות לצד לחיצות ופרפר עם גומייה. סטים רגילים עם מנוחה בינונית, ובסיום פשיטת מרפקים והחזקה בחצי ירידה. מתאים כשיש כבר שליטה בשכיבות סמיכה מלאות.

- Decline Push-Up: 4 x 8-12, rest 75 s
- Resistance Band Chest Press: 4 x 12-15, rest 60 s
- Hindu Push-Up: 3 x 8-10, rest 60 s
- Resistance Band Chest Fly: 3 x 12-15, rest 45 s
- Band Triceps Extension: 3 x 12-15, rest 45 s
- Halfway Push-Up Hold: 2 x 30 s, rest 45 s

## Back (גב) - 16 workouts

### Cable Back Basics / יסודות גב בכבלים

`back_gym_cable_basics` · beginner · weights · gym · 33 min · 5 exercises, 13 sets · gear: dumbbells, bench, cable_machine, lat_pulldown_machine · muscles: lats, upper_back, glutes, lower_back

A beginner back session on the lat pulldown and cable row, with a one-arm dumbbell row, face pulls and a light lower-back finisher. Moderate rest and controlled pulling.

אימון גב למתחילים: פולי עליון וחתירה בפולי תחתון, חתירה חד-ידית במשקולת יד, פייס פול וסיום קל לגב התחתון. מנוחה בינונית ומשיכות מבוקרות.

- Lat Pulldown: 3 x 10-12, rest 60 s
- Seated Cable Row: 3 x 10-12, rest 60 s
- One-Arm Dumbbell Row: 3 x 10-12, rest 60 s
- Face Pull: 2 x 12-15, rest 45 s
- Superman: 2 x 8-12, rest 45 s

### Assisted Pull-up Introduction / היכרות עם מתח בעזרת גומייה

`back_gym_assisted_pull_up_intro` · beginner · weights · gym · 32 min · 5 exercises, 13 sets · gear: dumbbells, cable_machine, pull_up_bar, dip_bars, resistance_bands · muscles: upper_back, lats, rear_delts, traps

A beginner session that builds toward the first pull-up: band-assisted pull-ups and inverted rows, with face pulls, rear delt flies and shrugs for shoulder-blade control.

אימון למתחילים שבונה את הדרך למתח הראשון: עליות מתח בעזרת גומייה ומתח אוסטרלי, עם פייס פול, פרפר הפוך והרמת כתפיים לשליטה בשכמות.

- Band-Assisted Pull-Up: 3 x 5-8, rest 75 s
- Inverted Row: 3 x 8-12, rest 60 s
- Face Pull: 3 x 12-15, rest 45 s
- Dumbbell Rear Delt Fly: 2 x 12-15, rest 45 s
- Dumbbell Shrug: 2 x 12-15, rest 45 s

### Pull-ups and Rows / מתח וחתירות

`back_gym_pull_up_and_rows` · intermediate · weights · gym · 40 min · 5 exercises, 16 sets · gear: dumbbells, bench, cable_machine, pull_up_bar · muscles: upper_back, lats, rear_delts, traps

Intermediate back day built around pull-ups, a one-arm dumbbell row and a seated cable row, finished with face pulls and shrugs for the upper back. Straight sets.

יום גב בינוני סביב עליות מתח, חתירה חד-ידית במשקולת יד וחתירה בפולי תחתון, עם פייס פול והרמת כתפיים לגב העליון בסיום. סטים רגילים.

- Pull-Up: 4 x 5-8, rest 90 s
- One-Arm Dumbbell Row: 3 x 8-12, rest 75 s
- Seated Cable Row: 3 x 10-12, rest 60 s
- Face Pull: 3 x 12-15, rest 45 s
- Dumbbell Shrug: 3 x 10-12, rest 45 s

### Barbell Row and Lat Volume / חתירה במוט וגב רחב

`back_gym_barbell_row_lat_volume` · intermediate · weights · gym · 40 min · 5 exercises, 16 sets · gear: barbell, dumbbells, lat_pulldown_machine, dip_bars · muscles: lats, upper_back, rear_delts, glutes

A higher-volume back session: barbell rows, lat pulldowns and inverted rows for width and thickness, then rear delt flies and supermans for the rear shoulders and lower back.

אימון גב עם נפח גבוה יותר: חתירה במוט, פולי עליון ומתח אוסטרלי לרוחב ולעובי הגב, ואז פרפר הפוך וסופרמן לכתף האחורית ולגב התחתון.

- Barbell Bent-Over Row: 4 x 8-10, rest 90 s
- Lat Pulldown: 4 x 10-12, rest 75 s
- Inverted Row: 3 x 10-15, rest 60 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Superman: 2 x 10-12, rest 45 s

### Deadlift and Chin-up Day / יום דדליפט ועליות מתח באחיזה הפוכה

`back_gym_deadlift_chin_up` · intermediate · weights · gym · 38 min · 5 exercises, 14 sets · gear: barbell, cable_machine, pull_up_bar, resistance_bands · muscles: upper_back, lats, rear_delts, biceps

Intermediate back session that opens with deadlifts for the whole back chain, adds chin-ups and a seated cable row, and closes with face pulls and band pull-aparts.

אימון גב בינוני שנפתח בדדליפט לשרשרת הגב כולה, ממשיך בעליות מתח באחיזה הפוכה ובחתירה בפולי תחתון, ונסגר בפייס פול ובפתיחת גומייה.

- Deadlift: 3 x 6-8, rest 120 s
- Chin-Up: 3 x 6-10, rest 90 s
- Seated Cable Row: 3 x 10-12, rest 60 s
- Face Pull: 3 x 12-15, rest 45 s
- Band Pull-Apart: 2 x 15-20, rest 30 s

### Heavy Pulls and Muscle-up Practice / משיכות כבדות ותרגול מאסל-אפ

`back_gym_muscle_up_heavy_pulls` · advanced · weights · gym · 57 min · 5 exercises, 20 sets · gear: barbell, cable_machine, pull_up_bar · muscles: lats, upper_back, triceps, biceps

Advanced pulling session: muscle-up practice while fresh, then heavy barbell rows, chin-ups and a cable row, finished with face pulls. Long rests and strict form.

אימון משיכה למתקדמים: תרגול מאסל-אפ בתחילת האימון כשהגוף רענן, ואז חתירה כבדה במוט, עליות מתח באחיזה הפוכה וחתירה בכבל, ופייס פול לסיום. מנוחות ארוכות וטכניקה קפדנית.

- Muscle-Up: 5 x 2-4, rest 120 s
- Barbell Bent-Over Row: 5 x 5-8, rest 120 s
- Chin-Up: 4 x 6-10, rest 90 s
- Seated Cable Row: 3 x 8-10, rest 75 s
- Face Pull: 3 x 12-15, rest 45 s

### Floor Posture Builder / בניית יציבה על הרצפה

`back_bw_floor_posture` · beginner · bodyweight · home / park / gym · 31 min · 5 exercises, 13 sets · gear: none · muscles: upper_back, lower_back, glutes, rear_delts

No equipment and no bar: back-extension and shoulder-blade exercises done on a mat. It trains the upper back, rear shoulders and lower back with gentle straight sets, to learn control of the shoulder blades.

בלי ציוד ובלי מוט: תרגילי הרמה ושליטה בשכמות על מזרן. מחזקים את הגב העליון, הכתפיים האחוריות והגב התחתון בסטים רגילים ועדינים, כדי ללמוד לשלוט בשכמות.

- Superman: 3 x 8-12, rest 45 s
- Prone T Raise: 3 x 8-12, rest 45 s
- Prone Y Raise: 3 x 8-10, rest 45 s
- Scapular Push-Up: 2 x 8-12, rest 45 s
- Bird Dog: 2 x 6-8, rest 45 s

### Prone Pull Flow / זרימת משיכות בשכיבה על הבטן

`back_bw_prone_flow` · intermediate · bodyweight · home / park / gym · 36 min · 5 exercises, 17 sets · gear: none · muscles: upper_back, lower_back, rear_delts, abs

Higher-volume floor work for the back: a bear crawl to wake up the shoulders, then snow angels, swimmers and dolphin kicks with short rests. No equipment and no bar.

עבודת רצפה בנפח גבוה יותר לגב: זחילת דוב שמעירה את הכתפיים, ואחריה מלאכי שלג הפוכים, שחיין ובעיטות דולפין עם מנוחות קצרות. בלי ציוד ובלי מוט.

- Bear Crawl: 3 x 40 s, rest 60 s
- Reverse Snow Angel: 4 x 10-15, rest 45 s
- Prone Swimmer: 4 x 16-24, rest 45 s
- Prone Dolphin Kick: 3 x 12-16, rest 45 s
- Prone T Raise: 3 x 12-15, rest 45 s

### Hang and Row Basics / יסודות תלייה וחתירה

`back_bar_hang_row_basics` · beginner · bodyweight · gym / park · 33 min · 5 exercises, 13 sets · gear: pull_up_bar, dip_bars · muscles: lats, upper_back, forearms, glutes

A bar-based session that builds toward the first pull-up: slow negatives, inverted rows, scapular pull-ups and a hang, finished with a superman. Three sets or fewer. Needs a pull-up bar and a low bar.

אימון על מוטות שבונה את הבסיס למתח הראשון: מתח שלילי איטי, מתח אוסטרלי, משיכות שכמות בתלייה ותלייה על המוט, ובסיום סופרמן. עד שלושה סטים. דורש מוט מתח ומוט נמוך.

- Negative Pull-Up: 3 x 3-5, rest 75 s
- Inverted Row: 3 x 6-10, rest 75 s
- Scapular Pull-Up: 3 x 6-10, rest 60 s
- Dead Hang: 2 x 20 s, rest 45 s
- Superman: 2 x 8-12, rest 45 s

### Pull-Ups and Ring Rows / מתח וחתירה בטבעות

`back_bar_pull_up_rings` · intermediate · bodyweight · home / park · 39 min · 5 exercises, 17 sets · gear: pull_up_bar, gymnastic_rings · muscles: lats, upper_back, abs, forearms

A pull-up led back session: pull-ups for the lats, ring rows for the upper back, a Y raise, a hang for grip and a hanging knee raise. Straight sets with moderate rest. Needs a pull-up bar and gymnastic rings.

אימון גב שנפתח במתח: מתח לרחב הגבי, חתירה בטבעות לגב העליון, הרמת Y, תלייה לחיזוק האחיזה והרמת ברכיים בתלייה. סטים רגילים עם מנוחה בינונית. דורש מוט מתח וטבעות התעמלות.

- Pull-Up: 4 x 4-8, rest 90 s
- Ring Row: 4 x 8-12, rest 60 s
- Prone Y Raise: 3 x 10-12, rest 45 s
- Dead Hang: 3 x 35 s, rest 45 s
- Hanging Knee Raise: 3 x 8-12, rest 45 s

### Chin-Up and Wide-Grip Pull / מתח באחיזה הפוכה ורחבה

`back_bar_chin_wide_grip` · intermediate · bodyweight · home / park · 43 min · 5 exercises, 17 sets · gear: pull_up_bar, suspension_trainer · muscles: lats, upper_back, biceps, abs

Two pull-up grips that stress different parts of the back, then a suspension-trainer row, a T raise and a hanging oblique knee raise. Straight sets. Needs a pull-up bar and a suspension trainer.

שתי אחיזות במתח שמדגישות חלקים שונים בגב, ואחריהן חתירה ברצועות TRX, הרמת T והרמת ברכיים לצד בתלייה. סטים רגילים. דורש מוט מתח ורצועות השעיה.

- Chin-Up: 4 x 5-8, rest 90 s
- Wide-Grip Pull-Up: 3 x 4-8, rest 90 s
- Suspension Trainer Row: 4 x 10-14, rest 60 s
- Prone T Raise: 3 x 12-15, rest 45 s
- Hanging Oblique Knee Raise: 3 x 8-10, rest 45 s

### Archer and Muscle-Up Skills / ארצ׳ר ומאסל-אפ

`back_bar_archer_muscle_up` · advanced · bodyweight · gym / park · 46 min · 5 exercises, 16 sets · gear: pull_up_bar, dip_bars · muscles: lats, upper_back, abs, hip_flexors

An advanced pulling session: muscle-ups while fresh, archer pull-ups for one-sided strength, slow pull-ups, inverted rows and a hanging leg raise. Low reps and long rests, for people with strong, pain-free pull-ups.

אימון משיכה מתקדם: מאסל-אפ כשהגוף רענן, מתח ארצ׳ר לכוח חד-צדדי, מתח איטי, מתח אוסטרלי והרמת רגליים בתלייה. חזרות מעטות ומנוחות ארוכות, למי שמבצעים מתח חזק וללא כאבים.

- Muscle-Up: 3 x 2-4, rest 120 s
- Archer Pull-Up: 4 x 3-5, rest 90 s
- Pull-Up: 3 x 8-12, rest 90 s
- Inverted Row: 3 x 10-15, rest 60 s
- Hanging Leg Raise: 3 x 8-12, rest 60 s

### Dumbbell Row Basics / יסודות חתירה במשקולות

`back_dumbbell_row_basics` · beginner · weights · gym / home / park · 32 min · 5 exercises, 13 sets · gear: dumbbells, bench · muscles: lats, upper_back, rear_delts, glutes

A first back session built on two rows, a rear-delt fly, shrugs and a floor superman. Straight sets with light-to-moderate dumbbells. A bench or sturdy chair supports the one-arm row.

אימון גב ראשון שמבוסס על שתי חתירות, פרפר הפוך, הרמות כתפיים וסופרמן על הרצפה. סטים רגילים עם משקולות קלות עד בינוניות. לחתירה החד-ידית אפשר להשתמש בספסל או בכיסא יציב.

- Bent-Over Dumbbell Row: 3 x 10-12, rest 60 s
- One-Arm Dumbbell Row: 3 x 10-12, rest 60 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Dumbbell Shrug: 2 x 12-15, rest 45 s
- Superman: 2 x 10-12, rest 30 s

### Back Builder with Pullover / בניית גב עם פולאובר

`back_dumbbell_pullover_carry` · intermediate · weights · gym / home / park · 39 min · 5 exercises, 16 sets · gear: dumbbells, bench · muscles: lats, traps, upper_back, abs

Heavier back volume: chest-supported rows, renegade rows, a lat-focused pullover, Y raises and a farmer carry. 3-4 sets, mostly 8-12 reps, with 45-75 s rests. Needs a bench.

נפח גב גבוה יותר: חתירה בתמיכת חזה, חתירת רנגייד, פולאובר לגב הרחב, הרמות Y והליכת חקלאי. 3-4 סטים, בעיקר של 8-12 חזרות, עם מנוחה של 45-75 שניות. דורש ספסל.

- Chest-Supported Dumbbell Row: 4 x 8-12, rest 75 s
- Renegade Row: 3 x 6-10, rest 75 s
- Dumbbell Pullover: 3 x 10-12, rest 60 s
- Dumbbell Y Raise: 3 x 10-12, rest 45 s
- Farmer's Carry: 3 x 40 s, rest 45 s

### Archer Pull-Ups and Heavy Rows / מתח ארצ׳ר וחתירות כבדות

`back_dumbbell_archer_pull_ups` · advanced · weights · gym / home / park · 51 min · 6 exercises, 19 sets · gear: dumbbells, bench, pull_up_bar · muscles: lats, upper_back, rear_delts, forearms

An advanced pulling session: archer and wide-grip pull-ups on a bar, heavy dumbbell rows, a rear-delt fly and a dead hang to finish. Needs a pull-up bar and a bench.

אימון משיכות למתקדמים: עליות מתח ארצ׳ר ובאחיזה רחבה על מוט, חתירות כבדות במשקולות, פרפר הפוך ותלייה לסיום. דורש מוט מתח וספסל.

- Archer Pull-Up: 4 x 4-6, rest 90 s
- Wide-Grip Pull-Up: 3 x 6-10, rest 90 s
- Bent-Over Dumbbell Row: 4 x 6-8, rest 90 s
- One-Arm Dumbbell Row: 3 x 8-10, rest 75 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Dead Hang: 2 x 30 s, rest 45 s

### Band Row and Pulldown Basics / יסודות חתירה ומשיכה עם גומייה

`back_bands_row_and_pulldown_basics` · beginner · weights · home / park / gym · 34 min · 6 exercises, 15 sets · gear: resistance_bands · muscles: lats, upper_back, rear_delts, glutes

A beginner back session with only a resistance band: vertical and horizontal pulls, a face pull for the upper back and two light floor exercises. Two to three easy sets of each.

אימון גב למתחילים עם גומיית התנגדות בלבד: משיכות אנכיות ואופקיות, פייס פול לגב העליון ושני תרגילי רצפה קלים. שניים עד שלושה סטים קלים בכל תרגיל.

- Resistance Band Lat Pulldown: 3 x 10-15, rest 60 s
- Single-Arm Resistance Band Row: 3 x 10-12, rest 45 s
- Resistance Band Face Pull: 3 x 12-15, rest 45 s
- Resistance Band Straight-Arm Pulldown: 2 x 12-15, rest 45 s
- Prone Y Raise: 2 x 8-12, rest 30 s
- Superman: 2 x 8-12, rest 30 s

## Shoulders (כתפיים) - 15 workouts

### Shoulder Press Basics / יסודות לחיצת כתפיים

`shoulders_gym_press_basics` · beginner · weights · gym · 29 min · 4 exercises, 11 sets · gear: dumbbells, cable_machine · muscles: shoulders, rear_delts, triceps, traps

A beginner shoulder session: a dumbbell press, cable lateral raises, rear delt flies and shrugs. Light to moderate loads, three sets or fewer and moderate rest.

אימון כתפיים למתחילים: לחיצת כתפיים במשקולות יד, הרחקה לצד בכבל, פרפר הפוך והרמת כתפיים. משקלים קלים עד בינוניים, עד שלושה סטים לתרגיל ומנוחה בינונית.

- Dumbbell Shoulder Press: 3 x 10-12, rest 75 s
- Cable Lateral Raise: 3 x 12-15, rest 45 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Dumbbell Shrug: 2 x 12-15, rest 45 s

### Side Raise and Face Pull / הרחקה לצד ופייס פול

`shoulders_gym_side_raise_face_pull` · beginner · weights · gym · 26 min · 4 exercises, 11 sets · gear: dumbbells, cable_machine, resistance_bands · muscles: shoulders, rear_delts, upper_back, triceps

A beginner session for the side and rear shoulders: a light dumbbell press, lateral raises, face pulls and band pull-aparts. Higher reps and a controlled tempo.

אימון למתחילים לכתף הצדדית והאחורית: לחיצת כתפיים קלה במשקולות יד, הרחקות לצדדים, פייס פול ופתיחת גומייה. חזרות גבוהות יחסית וקצב מבוקר.

- Dumbbell Shoulder Press: 3 x 12-15, rest 60 s
- Dumbbell Lateral Raise: 3 x 12-15, rest 45 s
- Face Pull: 3 x 12-15, rest 45 s
- Band Pull-Apart: 2 x 15-20, rest 30 s

### Barbell Overhead Press Day / יום לחיצת כתפיים עם מוט

`shoulders_gym_barbell_overhead_day` · intermediate · weights · gym · 39 min · 5 exercises, 17 sets · gear: barbell, dumbbells, squat_rack, cable_machine · muscles: shoulders, rear_delts, triceps, traps

Intermediate shoulder session led by the standing barbell overhead press, followed by lateral raises, rear delt flies, face pulls and shrugs for the side and rear shoulders and the traps.

אימון כתפיים בינוני שנפתח בלחיצת כתפיים עם מוט בעמידה, וממשיך בהרחקות לצדדים, פרפר הפוך, פייס פול והרמת כתפיים לכתף הצדדית והאחורית ולטרפז.

- Barbell Overhead Press: 4 x 6-10, rest 90 s
- Dumbbell Lateral Raise: 4 x 12-15, rest 45 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Face Pull: 3 x 12-15, rest 45 s
- Dumbbell Shrug: 3 x 10-12, rest 45 s

### Arnold Press and Cable Raises / לחיצת ארנולד והרחקות בכבל

`shoulders_gym_arnold_cable_raises` · intermediate · weights · gym · 38 min · 5 exercises, 16 sets · gear: dumbbells, cable_machine · muscles: shoulders, rear_delts, triceps, upper_back

Intermediate shoulder session with the Arnold press and pike push-ups for pressing volume, then cable lateral raises, face pulls and rear delt flies. Moderate rest and a controlled tempo.

אימון כתפיים בינוני עם לחיצת ארנולד ושכיבות סמיכה פייק לנפח לחיצות, ואחריהן הרחקות לצד בכבל, פייס פול ופרפר הפוך. מנוחה בינונית וקצב מבוקר.

- Arnold Press: 4 x 8-12, rest 75 s
- Pike Push-Up: 3 x 8-12, rest 60 s
- Cable Lateral Raise: 3 x 12-15, rest 45 s
- Face Pull: 3 x 12-15, rest 45 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s

### Kettlebell and Band Shoulders / כתפיים עם קטלבל וגומיות

`shoulders_gym_kettlebell_band_endurance` · intermediate · weights · gym · 35 min · 5 exercises, 16 sets · gear: kettlebell, cable_machine, resistance_bands · muscles: shoulders, triceps, rear_delts, upper_back

A one-sided kettlebell overhead press, pike push-ups, band lateral raises and pull-aparts, finished with face pulls. Shorter rests and higher reps for shoulder endurance and stability.

לחיצת קטלבל חד-צדדית מעל הראש, שכיבות סמיכה פייק, הרחקות ופתיחות עם גומייה ופייס פול לסיום. מנוחות קצרות וחזרות גבוהות לסיבולת וליציבות הכתף.

- Kettlebell Overhead Press: 4 x 8-12, rest 75 s
- Pike Push-Up: 3 x 8-12, rest 45 s
- Band Lateral Raise: 3 x 15-20, rest 30 s
- Band Pull-Apart: 3 x 15-20, rest 30 s
- Face Pull: 3 x 12-15, rest 30 s

### Heavy Press and Handstand Push-ups / לחיצה כבדה ושכיבות סמיכה בעמידת ידיים

`shoulders_gym_heavy_press_handstand` · advanced · weights · gym · 59 min · 6 exercises, 22 sets · gear: barbell, dumbbells, squat_rack, cable_machine · muscles: shoulders, triceps, rear_delts, traps

Advanced shoulder session: wall handstand push-ups while fresh, then a heavy barbell overhead press, Arnold presses, cable lateral raises, face pulls and shrugs. Long rests on the main lifts.

אימון כתפיים למתקדמים: שכיבות סמיכה בעמידת ידיים על הקיר כשהגוף רענן, ואז לחיצת כתפיים כבדה עם מוט, לחיצת ארנולד, הרחקות בכבל, פייס פול והרמת כתפיים. מנוחות ארוכות בתרגילים המרכזיים.

- Wall Handstand Push-Up: 4 x 4-8, rest 120 s
- Barbell Overhead Press: 5 x 5-8, rest 120 s
- Arnold Press: 3 x 8-10, rest 90 s
- Cable Lateral Raise: 4 x 10-15, rest 45 s
- Face Pull: 3 x 12-15, rest 45 s
- Dumbbell Shrug: 3 x 8-12, rest 60 s

### Shoulder Stability Starter / יסודות יציבות הכתף

`shoulders_bw_stability_starter` · beginner · bodyweight · home / park / gym · 32 min · 5 exercises, 14 sets · gear: none · muscles: upper_back, shoulders, abs, hamstrings

A gentle shoulder session that builds control rather than load: an inchworm, scapular push-ups, Y and T raises and light shadow boxing. No equipment, three sets or fewer.

אימון כתפיים עדין שבונה שליטה ולא עומס: אינצ׳וורם, שכיבות סמיכה לשכמות, הרמות Y ו-T ואגרוף צללים קל. בלי ציוד, עד שלושה סטים.

- Inchworm: 3 x 5-8, rest 60 s
- Scapular Push-Up: 3 x 8-12, rest 45 s
- Prone Y Raise: 3 x 8-10, rest 45 s
- Prone T Raise: 3 x 8-12, rest 45 s
- Shadow Boxing: 2 x 40 s, rest 45 s

### Pike Press Builder / בניית כתפיים בשכיבות פייק

`shoulders_bw_pike_builder` · intermediate · bodyweight · home / park / gym · 41 min · 5 exercises, 18 sets · gear: none · muscles: shoulders, abs, chest, rear_delts

Overhead-style pressing with the body only: pike and Hindu push-ups lead, a bear crawl keeps the shoulders loaded, and a snow-angel raise and plank jumping jacks finish. No equipment.

דחיפה בסגנון מעל הראש בעזרת משקל הגוף: שכיבות סמיכה פייק והינדיות פותחות, זחילת דוב ממשיכה לעמוס על הכתפיים, ומלאך שלג הפוך וקפיצות פיסוק בפלאנק סוגרים. בלי ציוד.

- Pike Push-Up: 4 x 6-10, rest 90 s
- Hindu Push-Up: 4 x 8-10, rest 60 s
- Bear Crawl: 3 x 40 s, rest 60 s
- Reverse Snow Angel: 4 x 10-12, rest 45 s
- Plank Jumping Jack: 3 x 30 s, rest 45 s

### Handstand Push-Up Progression / התקדמות לשכיבות סמיכה בעמידת ידיים

`shoulders_bw_handstand_progression` · advanced · bodyweight · home / park / gym · 49 min · 6 exercises, 19 sets · gear: none · muscles: shoulders, triceps, upper_back, abs

An advanced shoulder session built around wall handstand push-ups, supported by pike and typewriter push-ups, scapular work and a hollow hold. For people who already control pike push-ups well. Needs a free wall.

אימון כתפיים מתקדם סביב שכיבות סמיכה בעמידת ידיים על הקיר, בתמיכת שכיבות פייק וטייפרייטר, עבודת שכמות והחזקת הולו. למי שכבר שולטים היטב בשכיבות פייק. נדרש קיר פנוי.

- Wall Handstand Push-Up: 4 x 3-6, rest 120 s
- Pike Push-Up: 3 x 8-12, rest 75 s
- Typewriter Push-Up: 3 x 4-6, rest 90 s
- Scapular Push-Up: 3 x 10-15, rest 45 s
- Prone Y Raise: 3 x 10-12, rest 45 s
- Hollow Body Hold: 3 x 40 s, rest 45 s

### Press and Raise Shoulder Basics / יסודות כתפיים: לחיצה והרמות

`shoulders_dumbbell_press_raise_basics` · beginner · weights · gym / home / park · 31 min · 5 exercises, 13 sets · gear: dumbbells · muscles: shoulders, rear_delts, triceps, upper_back

A beginner shoulder session covering the front, side and rear of the shoulder: a press, side and front raises, a rear-delt fly and scapular push-ups. Light dumbbells, 2-3 sets.

אימון כתפיים למתחילים שמכסה את החלק הקדמי, הצדדי והאחורי של הכתף: לחיצה, הרחקות והרמות קדמיות, פרפר הפוך ושכיבות סמיכה לשכמות. משקולות קלות, 2-3 סטים.

- Dumbbell Shoulder Press: 3 x 10-12, rest 60 s
- Dumbbell Lateral Raise: 3 x 12-15, rest 45 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Dumbbell Front Raise: 2 x 10-12, rest 45 s
- Scapular Push-Up: 2 x 10-12, rest 45 s

### Arnold Press Shoulder Day / יום כתפיים עם לחיצת ארנולד

`shoulders_dumbbell_arnold_day` · intermediate · weights · gym / home / park · 38 min · 5 exercises, 17 sets · gear: dumbbells · muscles: shoulders, traps, rear_delts

One rotating press followed by raises for the side, rear and upper-trap areas. Moderate loads, 3-4 sets of 8-15 reps, 45-75 s rests. Dumbbells only, no bench.

לחיצה מסתובבת אחת ואחריה הרמות לצד, לאחור ולטרפז העליון. משקל בינוני, 3-4 סטים של 8-15 חזרות עם מנוחה של 45-75 שניות. משקולות בלבד, בלי ספסל.

- Arnold Press: 4 x 8-12, rest 75 s
- Dumbbell Lateral Raise: 4 x 12-15, rest 45 s
- Dumbbell Y Raise: 3 x 10-12, rest 45 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s
- Dumbbell Shrug: 3 x 12-15, rest 45 s

### Push Press and Pike Push-Ups / פוש פרס ושכיבות סמיכה פייק

`shoulders_dumbbell_push_press_pike` · intermediate · weights · gym / home / park · 36 min · 5 exercises, 16 sets · gear: dumbbells · muscles: shoulders, triceps, traps

Two compound presses first, while fresh: a leg-assisted dumbbell push press and pike push-ups. Then upright rows and short-rest front and side raises to finish. Dumbbells only.

שני תרגילי לחיצה מורכבים בהתחלה כשהגוף רענן: פוש פרס עם עזרה מהרגליים ושכיבות סמיכה פייק. אחר כך חתירה אנכית והרמות קדמיות וצדדיות עם מנוחה קצרה. משקולות בלבד.

- Dumbbell Push Press: 4 x 8-10, rest 75 s
- Pike Push-Up: 3 x 8-12, rest 60 s
- Dumbbell Upright Row: 3 x 10-12, rest 60 s
- Dumbbell Front Raise: 3 x 10-12, rest 30 s
- Dumbbell Lateral Raise: 3 x 12-15, rest 30 s

### Handstand Push-Up Shoulder Strength / כוח כתפיים עם שכיבות סמיכה בעמידת ידיים

`shoulders_dumbbell_handstand_strength` · advanced · weights · gym / home / park · 47 min · 5 exercises, 18 sets · gear: dumbbells · muscles: shoulders, triceps, traps

Advanced shoulder strength: wall handstand push-ups while fresh, a heavy dumbbell press, upright rows, lateral raises and shrugs. Needs a free wall; keep a rep or two in reserve.

כוח כתפיים למתקדמים: שכיבות סמיכה בעמידת ידיים על הקיר כשהגוף רענן, לחיצה כבדה במשקולות, חתירה אנכית, הרחקות לצדדים והרמות כתפיים. דורש קיר פנוי; להשאיר חזרה או שתיים בעתודה.

- Wall Handstand Push-Up: 4 x 4-8, rest 105 s
- Dumbbell Shoulder Press: 4 x 6-8, rest 90 s
- Dumbbell Upright Row: 3 x 8-10, rest 75 s
- Dumbbell Lateral Raise: 4 x 10-12, rest 60 s
- Dumbbell Shrug: 3 x 10-12, rest 60 s

### Pike Press and Band Raises / שכיבות פייק והרמות כתפיים עם גומייה

`shoulders_bands_pike_and_raises` · intermediate · weights · home / park / gym · 37 min · 5 exercises, 16 sets · gear: resistance_bands · muscles: shoulders, triceps, rear_delts, upper_back

Pike push-ups and a band overhead press for the main work, then lateral raises, pull-aparts and an external rotation for the side and rear shoulder. Straight sets with moderate rest.

שכיבות סמיכה פייק ולחיצת כתפיים עם גומייה לעבודה העיקרית, ואחריהן הרחקות לצדדים, פתיחות גומייה וסיבוב חיצוני לכתף הצדדית והאחורית. סטים רגילים עם מנוחה בינונית.

- Pike Push-Up: 4 x 8-12, rest 75 s
- Band Overhead Press: 4 x 10-12, rest 60 s
- Band Lateral Raise: 3 x 12-15, rest 45 s
- Band Pull-Apart: 3 x 12-15, rest 45 s
- Band Shoulder External Rotation: 2 x 12-15, rest 30 s

### Kettlebell Press and Band Delts / לחיצת קטלבל וכתפיים עם גומייה

`shoulders_kettlebell_press_and_band_delts` · intermediate · weights · home / park / gym · 36 min · 5 exercises, 15 sets · gear: kettlebell, resistance_bands · muscles: shoulders, triceps, upper_back, rear_delts

One-arm kettlebell presses and pike push-ups lead, then band lateral raises and face pulls for the side and rear shoulder, with scapular push-ups to finish. Needs a kettlebell and a resistance band.

לחיצות כתפיים ביד אחת עם קטלבל ושכיבות פייק פותחות, ואחריהן הרחקות לצדדים ופייס פול עם גומייה לכתף הצדדית והאחורית, ובסיום שכיבות סמיכה לשכמות. נדרשים קטלבל וגומייה.

- Kettlebell Overhead Press: 4 x 6-10, rest 75 s
- Pike Push-Up: 3 x 8-12, rest 60 s
- Band Lateral Raise: 3 x 12-15, rest 45 s
- Resistance Band Face Pull: 3 x 12-15, rest 45 s
- Scapular Push-Up: 2 x 10-12, rest 30 s

## Biceps (דו-ראשי) - 6 workouts

### Biceps Curl Basics / יסודות לשריר הדו-ראשי

`biceps_gym_curl_basics` · beginner · weights · gym · 28 min · 4 exercises, 11 sets · gear: dumbbells, cable_machine · muscles: biceps, forearms, traps

A beginner biceps session: dumbbell, hammer and cable curls, plus a farmer carry for grip. Controlled reps with no swinging and moderate rest.

אימון דו-ראשי למתחילים: כפיפות במשקולות יד, פטישים וכפיפות בכבל, וסיום בהליכת חקלאי לחיזוק האחיזה. חזרות מבוקרות בלי נדנוד ומנוחה בינונית.

- Dumbbell Curl: 3 x 10-12, rest 60 s
- Hammer Curl: 3 x 10-12, rest 60 s
- Cable Biceps Curl: 3 x 12-15, rest 45 s
- Farmer's Carry: 2 x 30 s, rest 60 s

### Chin-ups and Barbell Curls / עליות מתח באחיזה הפוכה וכפיפות במוט

`biceps_gym_chin_up_barbell_curl` · intermediate · weights · gym · 39 min · 5 exercises, 16 sets · gear: barbell, dumbbells, cable_machine, pull_up_bar, resistance_bands · muscles: biceps, lats, forearms

Intermediate biceps session: chin-ups first while fresh, then barbell, hammer and cable curls with a band finisher. Straight sets with moderate rest.

אימון דו-ראשי בינוני: עליות מתח באחיזה הפוכה בתחילת האימון, אחריהן כפיפות במוט, פטישים וכפיפות בכבל, וסיום עם גומייה. סטים רגילים ומנוחה בינונית.

- Chin-Up: 4 x 5-8, rest 90 s
- Barbell Curl: 4 x 8-10, rest 75 s
- Hammer Curl: 3 x 10-12, rest 60 s
- Cable Biceps Curl: 3 x 12-15, rest 45 s
- Resistance Band Biceps Curl: 2 x 15-20, rest 30 s

### Chin-Up Biceps Focus / דו-ראשי במתח באחיזה הפוכה

`biceps_bar_chin_up_focus` · intermediate · bodyweight · gym / home / park · 32 min · 4 exercises, 10 sets · gear: pull_up_bar · muscles: lats, biceps, forearms, upper_back

A biceps session built on the chin-up with only a pull-up bar: a scapular activation set, five sets of chin-ups, one slow negative and hangs for grip. Needs some chin-up strength.

אימון דו-ראשי שנבנה על מתח באחיזה הפוכה עם מוט מתח בלבד: סט הפעלת שכמות, חמישה סטים של מתח, סט שלילי איטי ותלייה לחיזוק האחיזה. דורש מעט כוח במתח באחיזה הפוכה.

- Scapular Pull-Up: 1 x 6-8, rest 45 s
- Chin-Up: 5 x 4-8, rest 120 s
- Negative Pull-Up: 1 x 3-5, rest 90 s
- Dead Hang: 3 x 40 s, rest 60 s

### Dumbbell Curl Basics / יסודות כפיפות מרפקים

`biceps_dumbbell_curl_basics` · beginner · weights · gym / home / park · 27 min · 4 exercises, 10 sets · gear: dumbbells · muscles: biceps, forearms

A beginner biceps session: standard, hammer and concentration curls plus wrist curls for the forearms. Straight sets, light-to-moderate dumbbells, slow lowering.

אימון דו-ראשי למתחילים: כפיפות מרפקים רגילות, פטישים וכפיפות ריכוז, ובנוסף כפיפות שורשי כפות הידיים לאמות. סטים רגילים, משקולות קלות עד בינוניות והורדה איטית.

- Dumbbell Curl: 3 x 10-12, rest 60 s
- Hammer Curl: 3 x 10-12, rest 60 s
- Concentration Curl: 2 x 10-12, rest 45 s
- Dumbbell Wrist Curl: 2 x 12-15, rest 45 s

### Incline and Zottman Curls / כפיפות על ספסל משופע וזוטמן

`biceps_dumbbell_incline_zottman` · intermediate · weights · gym / home / park · 38 min · 5 exercises, 17 sets · gear: dumbbells, bench · muscles: biceps, forearms, traps

Longer-range biceps work: incline curls for the stretch, Zottman curls for biceps and forearms, cross-body hammer curls and a lighter finisher, then a farmer carry for grip. Needs a bench.

עבודה בטווח ארוך לדו-ראשי: כפיפות על ספסל משופע למתיחה, זוטמן לדו-ראשי ולאמות, פטיש חוצה גוף וגמר קל יותר, ובסוף הליכת חקלאי לאחיזה. דורש ספסל.

- Incline Dumbbell Curl: 4 x 8-12, rest 60 s
- Zottman Curl: 4 x 8-10, rest 60 s
- Cross-Body Hammer Curl: 3 x 10-12, rest 45 s
- Dumbbell Curl: 3 x 12-15, rest 30 s
- Farmer's Carry: 3 x 40 s, rest 45 s

### Chin-Up and Hammer Strength / כוח: מתח באחיזה הפוכה ופטישים

`biceps_dumbbell_chin_up_strength` · intermediate · weights · gym / home / park · 40 min · 5 exercises, 16 sets · gear: dumbbells, bench, pull_up_bar · muscles: biceps, forearms, lats

Heavier biceps work: chin-ups first while fresh, then hammer, incline and concentration curls, finishing with a dead hang for grip. Needs a pull-up bar and a bench.

עבודה כבדה יותר לדו-ראשי: עליות מתח באחיזה הפוכה בהתחלה כשהגוף רענן, ואחר כך פטישים, כפיפות על ספסל משופע וכפיפות ריכוז, ובסוף תלייה לאחיזה. דורש מוט מתח וספסל.

- Chin-Up: 4 x 5-8, rest 90 s
- Hammer Curl: 4 x 8-10, rest 60 s
- Incline Dumbbell Curl: 3 x 8-10, rest 60 s
- Concentration Curl: 3 x 10-12, rest 45 s
- Dead Hang: 2 x 30 s, rest 45 s

## Triceps (תלת-ראשי) - 6 workouts

### Triceps Pushdown Basics / יסודות לשריר התלת-ראשי

`triceps_gym_pushdown_basics` · beginner · weights · gym · 31 min · 4 exercises, 12 sets · gear: dumbbells, cable_machine, dip_bars, resistance_bands · muscles: triceps, chest

A beginner triceps session: assisted dips and a dumbbell floor press for the heavier work, then overhead dumbbell extensions and cable pushdowns. Controlled elbows throughout.

אימון תלת-ראשי למתחילים: מקבילים בעזרת גומייה ולחיצה מהרצפה במשקולות יד לעבודה הכבדה יותר, ואז פשיטת מרפקים מעל הראש ופשיטה בפולי עליון. שליטה במרפקים לאורך כל האימון.

- Band-Assisted Dip: 3 x 6-10, rest 75 s
- Dumbbell Floor Press: 3 x 10-12, rest 75 s
- Overhead Dumbbell Triceps Extension: 3 x 10-12, rest 60 s
- Triceps Pushdown: 3 x 12-15, rest 45 s

### Close-Grip Press and Skull Crushers / לחיצה באחיזה צרה וסקאל קראשר

`triceps_gym_close_grip_skull_crusher` · intermediate · weights · gym · 40 min · 5 exercises, 16 sets · gear: barbell, dumbbells, ez_bar, bench, cable_machine, dip_bars · muscles: triceps, chest

Intermediate triceps session: close-grip bench press and parallel bar dips for the heavy pressing, then EZ-bar skull crushers, overhead extensions and cable pushdowns. Straight sets.

אימון תלת-ראשי בינוני: לחיצת חזה באחיזה צרה ומקבילים ללחיצות הכבדות, ואחריהם סקאל קראשר עם מוט EZ, פשיטה מעל הראש ופשיטה בפולי עליון. סטים רגילים.

- Close-Grip Bench Press: 4 x 6-10, rest 90 s
- Parallel Bar Dip: 3 x 8-12, rest 75 s
- EZ-Bar Skull Crusher: 3 x 10-12, rest 60 s
- Overhead Dumbbell Triceps Extension: 3 x 10-12, rest 60 s
- Triceps Pushdown: 3 x 12-15, rest 45 s

### Close-Grip Triceps Basics / יסודות תלת-ראשי באחיזה צרה

`triceps_bw_close_grip_basics` · beginner · bodyweight · home / park / gym · 25 min · 4 exercises, 10 sets · gear: none · muscles: chest, triceps, abs, shoulders

A short triceps session for people learning push-ups: close-grip push-ups and a halfway hold carry the work, with scapular push-ups and a high plank. No equipment, three sets or fewer.

אימון תלת-ראשי קצר למי שלומדים שכיבות סמיכה: שכיבות באחיזה צרה והחזקה בחצי ירידה נושאות את העבודה, עם שכיבות סמיכה לשכמות ופלאנק גבוה. בלי ציוד, עד שלושה סטים.

- Scapular Push-Up: 2 x 8-12, rest 45 s
- Close-Grip Push-Up: 3 x 6-10, rest 75 s
- Halfway Push-Up Hold: 3 x 25 s, rest 45 s
- High Plank: 2 x 30 s, rest 45 s

### Diamond and Pike Triceps / תלת-ראשי ביהלום ובפייק

`triceps_bw_diamond_pike` · intermediate · bodyweight · home / park / gym · 37 min · 5 exercises, 15 sets · gear: none · muscles: triceps, shoulders, abs, chest

Triceps-led pressing with the body only: diamond and pike push-ups, then slow close-grip push-ups, a bear crawl and a high plank to finish. Straight sets, no equipment.

דחיפות שמעמיסות על התלת-ראשי בעזרת משקל הגוף: שכיבות יהלום ופייק, אחריהן שכיבות באחיזה צרה בקצב איטי, זחילת דוב ופלאנק גבוה לסיום. סטים רגילים, בלי ציוד.

- Diamond Push-Up: 4 x 6-12, rest 75 s
- Pike Push-Up: 3 x 6-10, rest 75 s
- Close-Grip Push-Up: 3 x 10-15, rest 60 s
- Bear Crawl: 3 x 30 s, rest 60 s
- High Plank: 2 x 45 s, rest 45 s

### Triceps Basics with Dumbbells / יסודות תלת-ראשי עם משקולות

`triceps_dumbbell_basics` · beginner · weights · gym / home / park · 32 min · 5 exercises, 13 sets · gear: dumbbells, bench · muscles: triceps, chest

A beginner triceps session: a tucked-elbow floor press and close-grip push-ups, then overhead extensions, bench dips and kickbacks. 2-3 sets, moderate loads. A bench or sturdy chair is used for the dips.

אימון תלת-ראשי למתחילים: לחיצה מהרצפה עם מרפקים צמודים ושכיבות סמיכה באחיזה צרה, ואחר כך פשיטות מעל הראש, מקבילים על ספסל וקיקבק. 2-3 סטים ומשקל בינוני. למקבילים אפשר להשתמש בספסל או בכיסא יציב.

- Dumbbell Floor Press: 3 x 10-12, rest 60 s
- Close-Grip Push-Up: 3 x 8-12, rest 45 s
- Overhead Dumbbell Triceps Extension: 3 x 10-12, rest 60 s
- Bench Dip: 2 x 8-12, rest 45 s
- Dumbbell Triceps Kickback: 2 x 12-15, rest 45 s

### Skull Crusher and Diamond Triceps / סקאל קראשר ויהלום לתלת-ראשי

`triceps_dumbbell_skull_crusher_diamond` · intermediate · weights · gym / home / park · 40 min · 5 exercises, 17 sets · gear: dumbbells, bench · muscles: triceps, shoulders

Intermediate triceps volume: diamond push-ups, skull crushers, pike push-ups, overhead extensions and short-rest kickbacks. Needs a bench for the skull crushers.

נפח לתלת-ראשי ברמה בינונית: שכיבות סמיכה יהלום, סקאל קראשר, שכיבות סמיכה פייק, פשיטות מעל הראש וקיקבק עם מנוחה קצרה. הסקאל קראשר דורש ספסל.

- Diamond Push-Up: 4 x 10-15, rest 60 s
- Dumbbell Skull Crusher: 4 x 8-12, rest 75 s
- Pike Push-Up: 3 x 8-12, rest 60 s
- Overhead Dumbbell Triceps Extension: 3 x 10-12, rest 60 s
- Dumbbell Triceps Kickback: 3 x 12-15, rest 30 s

## Arms (ידיים) - 7 workouts

### Arm Day Basics / יסודות לאימון ידיים

`arms_gym_alternating_basics` · beginner · weights · gym · 30 min · 4 exercises, 12 sets · gear: dumbbells, cable_machine · muscles: biceps, triceps, forearms

A beginner arm session that alternates biceps and triceps: dumbbell curls, cable pushdowns, hammer curls and overhead extensions. Straight sets with moderate rest.

אימון ידיים למתחילים שמחליף בין דו-ראשי לתלת-ראשי: כפיפות במשקולות יד, פשיטה בפולי עליון, פטישים ופשיטה מעל הראש. סטים רגילים ומנוחה בינונית.

- Dumbbell Curl: 3 x 10-12, rest 60 s
- Triceps Pushdown: 3 x 10-12, rest 60 s
- Hammer Curl: 3 x 10-12, rest 60 s
- Overhead Dumbbell Triceps Extension: 3 x 10-12, rest 60 s

### Arm Strength with Chins and Dips / כוח ידיים עם מתח ומקבילים

`arms_gym_chin_dip_strength` · intermediate · weights · gym · 43 min · 6 exercises, 18 sets · gear: barbell, ez_bar, bench, cable_machine, pull_up_bar, dip_bars · muscles: biceps, triceps, chest, lats

Intermediate arm session: chin-ups and dips as the main lifts, then barbell curls, skull crushers, cable curls and pushdowns. Biceps and triceps alternate throughout.

אימון ידיים בינוני: עליות מתח באחיזה הפוכה ומקבילים כתרגילים המרכזיים, ואז כפיפות במוט, סקאל קראשר, כפיפות בכבל ופשיטה בפולי עליון. מתחלפים בין דו-ראשי לתלת-ראשי.

- Chin-Up: 3 x 6-10, rest 90 s
- Parallel Bar Dip: 3 x 8-12, rest 75 s
- Barbell Curl: 3 x 8-10, rest 60 s
- EZ-Bar Skull Crusher: 3 x 10-12, rest 60 s
- Cable Biceps Curl: 3 x 12-15, rest 45 s
- Triceps Pushdown: 3 x 12-15, rest 45 s

### Chin-Up and Dip Arms / ידיים במתח באחיזה הפוכה ובמקבילים

`arms_bar_chin_up_dip` · intermediate · bodyweight · gym / park · 41 min · 5 exercises, 16 sets · gear: bench, pull_up_bar, dip_bars · muscles: triceps, lats, biceps, chest

Arm training on the bars: dips and chin-ups lead, followed by diamond push-ups, bench dips and a hang for grip. Straight sets alternating pushing and pulling. Needs a pull-up bar, dip bars and a bench.

אימון ידיים על המתקנים: מקבילים ומתח באחיזה הפוכה פותחים, ואחריהם שכיבות יהלום, מקבילים על ספסל ותלייה לחיזוק האחיזה. סטים רגילים, בסירוגין בין דחיפה למשיכה. דורש מוט מתח, מקבילים וספסל.

- Parallel Bar Dip: 4 x 6-10, rest 90 s
- Chin-Up: 4 x 5-8, rest 90 s
- Diamond Push-Up: 3 x 8-12, rest 60 s
- Bench Dip: 3 x 10-15, rest 60 s
- Dead Hang: 2 x 30 s, rest 45 s

### Alternating Arms Basics / יסודות ידיים לסירוגין

`arms_dumbbell_alternating_basics` · beginner · weights · gym / home / park · 32 min · 5 exercises, 13 sets · gear: dumbbells · muscles: triceps, biceps, forearms, chest

A beginner arm session that mixes biceps and triceps work: curls, overhead extensions, hammer curls, kickbacks and close-grip push-ups. 2-3 sets with light-to-moderate dumbbells.

אימון ידיים למתחילים שמשלב עבודה לדו-ראשי ולתלת-ראשי: כפיפות, פשיטות מעל הראש, פטישים, קיקבק ושכיבות סמיכה באחיזה צרה. 2-3 סטים עם משקולות קלות עד בינוניות.

- Dumbbell Curl: 3 x 10-12, rest 60 s
- Overhead Dumbbell Triceps Extension: 3 x 10-12, rest 60 s
- Hammer Curl: 3 x 10-12, rest 45 s
- Dumbbell Triceps Kickback: 2 x 12-15, rest 45 s
- Close-Grip Push-Up: 2 x 8-12, rest 45 s

### Incline Curl and Skull Crusher Arms / ידיים: כפיפה משופעת וסקאל קראשר

`arms_dumbbell_incline_skull_crusher` · intermediate · weights · gym / home / park · 34 min · 5 exercises, 14 sets · gear: dumbbells, bench · muscles: biceps, triceps, forearms

Alternates triceps and biceps work: diamond push-ups, incline curls, skull crushers and cross-body hammer curls, finished with wrist curls. 2-3 sets of 8-15 reps with 30-60 s rests. Needs a bench.

מתחלף בין עבודה לתלת-ראשי ולדו-ראשי: שכיבות סמיכה יהלום, כפיפות על ספסל משופע, סקאל קראשר ופטיש חוצה גוף, ובסוף כפיפות שורשי כפות הידיים. 2-3 סטים של 8-15 חזרות עם מנוחה של 30-60 שניות. דורש ספסל.

- Diamond Push-Up: 3 x 10-15, rest 60 s
- Incline Dumbbell Curl: 3 x 8-12, rest 60 s
- Dumbbell Skull Crusher: 3 x 8-12, rest 60 s
- Cross-Body Hammer Curl: 3 x 10-12, rest 45 s
- Dumbbell Wrist Curl: 2 x 12-15, rest 30 s

### Chin-Up and Floor Press Arms / ידיים: מתח באחיזה הפוכה ולחיצה מהרצפה

`arms_dumbbell_chin_up_floor_press` · intermediate · weights · gym / home / park · 44 min · 6 exercises, 18 sets · gear: dumbbells, bench, pull_up_bar · muscles: biceps, triceps, chest, forearms

Heavier arm work built on compound lifts: chin-ups and a tucked floor press first, then Zottman curls, bench dips, concentration curls and overhead extensions. Needs a pull-up bar and a bench.

עבודת ידיים כבדה יותר שמתחילה בתרגילים מורכבים: עליות מתח באחיזה הפוכה ולחיצה מהרצפה עם מרפקים צמודים, ואחר כך זוטמן, מקבילים על ספסל, כפיפות ריכוז ופשיטות מעל הראש. דורש מוט מתח וספסל.

- Chin-Up: 3 x 5-8, rest 90 s
- Dumbbell Floor Press: 3 x 8-10, rest 75 s
- Zottman Curl: 3 x 8-10, rest 60 s
- Bench Dip: 3 x 10-15, rest 60 s
- Concentration Curl: 3 x 10-12, rest 45 s
- Overhead Dumbbell Triceps Extension: 3 x 8-10, rest 45 s

### Band Curl and Extension Pairs / זוגות כפיפה ופשיטה עם גומייה

`arms_bands_curl_extension_pairs` · beginner · weights · home / park / gym · 32 min · 5 exercises, 14 sets · gear: resistance_bands · muscles: triceps, biceps, forearms, chest

Biceps and triceps trained in alternating order with one resistance band, finished with close-grip push-ups. Light, steady volume that suits a first arm session.

דו-ראשי ותלת-ראשי לסירוגין עם גומייה אחת, ובסיום שכיבות סמיכה באחיזה צרה. נפח קל ויציב שמתאים לאימון ידיים ראשון.

- Resistance Band Biceps Curl: 3 x 12-15, rest 45 s
- Band Triceps Extension: 3 x 12-15, rest 45 s
- Band Hammer Curl: 3 x 10-15, rest 45 s
- Band Overhead Triceps Extension: 3 x 10-15, rest 45 s
- Close-Grip Push-Up: 2 x 8-12, rest 60 s

## Abs (בטן) - 10 workouts

### Floor Abs Foundations / יסודות הבטן על הרצפה

`abs_bodyweight_floor_foundations` · beginner · bodyweight · home / park / gym · 33 min · 5 exercises, 14 sets · gear: none · muscles: abs, obliques

A first abs session on the floor: slow, controlled crunches, leg work and a short plank. Straight sets with generous rest, built for learning to brace the belly.

אימון בטן ראשון על הרצפה: כפיפות איטיות ומבוקרות, עבודת רגליים ופלאנק קצר. סטים רגילים עם מנוחה נוחה, כדי ללמוד לייצב את הבטן.

- Dead Bug: 3 x 6-8, rest 60 s
- Crunch: 3 x 10-15, rest 45 s
- Reverse Crunch: 3 x 8-12, rest 45 s
- Alternating Heel Touch: 2 x 10-12, rest 45 s
- Plank: 3 x 20 s, rest 45 s

### Climbers and Leg Lowers / מטפסים והורדות רגליים

`abs_bodyweight_climber_leg_lowers` · beginner · bodyweight · home / park / gym · 32 min · 5 exercises, 14 sets · gear: none · muscles: abs, hip_flexors, obliques

A beginner abs session that starts with a light mountain climber to wake up the belly, then moves to sit-ups, leg raises and a twist. Moderate rest, no holds beyond 30 seconds.

אימון בטן למתחילים שנפתח במטפס הרים קל להעיר את הבטן, ממשיך בסיט-אפ, הרמות רגליים וטוויסט. מנוחה בינונית וללא החזקות מעל 30 שניות.

- Mountain Climber: 3 x 25 s, rest 45 s
- Sit-Up: 3 x 8-12, rest 60 s
- Lying Leg Raise: 3 x 8-10, rest 60 s
- Russian Twist: 3 x 8-10, rest 45 s
- Streamline Hold (Lying): 2 x 20 s, rest 45 s

### Hollow Body Series / סדרת הולו בודי

`abs_bodyweight_hollow_series` · intermediate · bodyweight · home / park / gym · 35 min · 5 exercises, 16 sets · gear: none · muscles: abs, obliques, hip_flexors

A gymnastics-style abs session built around the hollow position: a held hollow, hollow rocks, V-ups, bicycle crunches and a side plank with hip dips. Straight sets, 45 seconds rest.

אימון בטן בסגנון התעמלות סביב עמדת הולו: החזקת הולו, הולו רוק, וי-אפ, כפיפות אופניים ופלאנק צידי עם הורדת אגן. סטים רגילים עם 45 שניות מנוחה.

- Hollow Body Hold: 4 x 30 s, rest 45 s
- Hollow Rock: 3 x 10-15, rest 45 s
- V-Up: 3 x 10-12, rest 45 s
- Bicycle Crunch: 3 x 12-16, rest 45 s
- Side Plank Hip Dip: 3 x 10-12, rest 45 s

### Short-Rest Abs / בטן עם מנוחות קצרות

`abs_bodyweight_short_rest_burn` · intermediate · bodyweight · home / park / gym · 33 min · 6 exercises, 18 sets · gear: none · muscles: abs, hip_flexors, obliques

A dense abs session with only 20 to 30 seconds between sets: climbers, reverse crunches, flutter kicks, bicycle crunches, V-ups and a high plank. Keep the pace steady and the form clean.

אימון בטן צפוף עם 20 עד 30 שניות בלבד בין הסטים: מטפס הרים, כפיפות הפוכות, בעיטות רפרוף, כפיפות אופניים, וי-אפ ופלאנק גבוה. לשמור על קצב יציב וטכניקה נקייה.

- Mountain Climber: 3 x 40 s, rest 20 s
- Reverse Crunch: 3 x 15-20, rest 25 s
- Flutter Kicks: 3 x 40 s, rest 20 s
- Bicycle Crunch: 3 x 16-20, rest 25 s
- V-Up: 3 x 10-15, rest 30 s
- High Plank: 3 x 45 s, rest 30 s

### Leg Lever Abs / בטן עם מנופי רגליים

`abs_bodyweight_leg_lever` · intermediate · bodyweight · home / park / gym · 37 min · 5 exercises, 16 sets · gear: none · muscles: abs, hip_flexors

Abs work with long levers: lying leg raises, V-ups, a dead bug and a hollow hold, finished with a sit-up burn-out. Slow lowering on every rep, 45 to 60 seconds rest.

עבודת בטן עם מנופים ארוכים: הרמות רגליים בשכיבה, וי-אפ, דד באג והחזקת הולו, ובסוף סיט-אפ לסיום. הורדה איטית בכל חזרה, מנוחה של 45 עד 60 שניות.

- Lying Leg Raise: 4 x 10-15, rest 60 s
- V-Up: 4 x 8-12, rest 60 s
- Dead Bug: 3 x 10-12, rest 45 s
- Hollow Body Hold: 3 x 35 s, rest 45 s
- Sit-Up: 2 x 15-20, rest 45 s

### Wiper and Hollow Challenge / אתגר מגבים והולו

`abs_bodyweight_wiper_hollow_challenge` · advanced · bodyweight · home / park / gym · 47 min · 5 exercises, 19 sets · gear: none · muscles: abs, obliques, hip_flexors

An advanced abs session: floor windshield wipers, long hollow holds, V-ups, hollow rocks and side plank hip dips. Four sets with longer rest, for people who already control the hollow position.

אימון בטן מתקדם: מגבי שמשה בשכיבה, החזקות הולו ארוכות, וי-אפ, הולו רוק ופלאנק צידי עם הורדת אגן. ארבעה סטים עם מנוחה ארוכה יותר, למי ששולט כבר בעמדת הולו.

- Floor Windshield Wiper: 4 x 5-8, rest 75 s
- Hollow Body Hold: 4 x 50 s, rest 60 s
- V-Up: 4 x 12-15, rest 60 s
- Hollow Rock: 4 x 15-20, rest 60 s
- Side Plank Hip Dip: 3 x 12-15, rest 60 s

### Hanging Knee Raise Abs / בטן עם הרמות ברכיים בתלייה

`abs_bar_hanging_knee_ladder` · intermediate · bodyweight · home / park / gym · 35 min · 5 exercises, 15 sets · gear: pull_up_bar · muscles: abs, hip_flexors, obliques

Abs from a pull-up bar: hanging knee raises and oblique knee raises, followed by reverse crunches, a hollow hold and a plank on the floor. A bar at home or in the park is all you need.

אימון בטן על מתח: הרמות ברכיים בתלייה והרמות ברכיים לצד, ואחריהן כפיפות הפוכות, החזקת הולו ופלאנק על הרצפה. מספיק מתח בבית או בפארק.

- Hanging Knee Raise: 4 x 8-12, rest 60 s
- Hanging Oblique Knee Raise: 3 x 6-8, rest 60 s
- Reverse Crunch: 3 x 12-15, rest 45 s
- Hollow Body Hold: 3 x 30 s, rest 45 s
- Plank: 2 x 45 s, rest 45 s

### Toes to Bar and L-Sit / רגליים למוט ואל-סיט

`abs_bar_toes_to_bar_lsit` · advanced · bodyweight · park / gym · 45 min · 5 exercises, 18 sets · gear: pull_up_bar, dip_bars · muscles: abs, hip_flexors, obliques

An advanced bar and dip-bar abs session: toes to bar, straight-leg hanging raises, L-sit holds and oblique raises. Longer rest between hard sets; stop a set when the swing takes over.

אימון בטן מתקדם על מתח ומקבילים: רגליים למוט, הרמות רגליים ישרות בתלייה, החזקות אל-סיט והרמות לצד. מנוחה ארוכה בין סטים קשים; להפסיק סט כשהנדנוד משתלט.

- Toes to Bar: 4 x 5-8, rest 90 s
- Hanging Leg Raise: 4 x 8-10, rest 75 s
- L-Sit: 4 x 15 s, rest 75 s
- Hanging Oblique Knee Raise: 3 x 8-10, rest 60 s
- Hollow Body Hold: 3 x 45 s, rest 60 s

### Abs with One Dumbbell / בטן עם משקולת יד אחת

`abs_dumbbell_one_dumbbell` · beginner · weights · gym / home / park · 29 min · 4 exercises, 12 sets · gear: dumbbells · muscles: abs, obliques

A beginner abs session that uses a single dumbbell: weighted crunches and woodchops, then reverse crunches and a dead bug on the floor. Straight sets with short rests.

אימון בטן למתחילים עם משקולת יד אחת: כפיפות בטן עם משקולת ווודצ׳ופ, ואחריהם כפיפות בטן הפוכות ודד באג על הרצפה. סטים רגילים עם מנוחות קצרות.

- Dumbbell Weighted Crunch: 3 x 12-15, rest 45 s
- Dumbbell Woodchop: 3 x 10-12, rest 45 s
- Reverse Crunch: 3 x 10-12, rest 45 s
- Dead Bug: 3 x 8-10, rest 45 s

### Loaded Abs Builder / בניית בטן עם משקולות

`abs_dumbbell_loaded_builder` · intermediate · weights · gym / home / park · 36 min · 5 exercises, 16 sets · gear: dumbbells · muscles: abs, hip_flexors, lats, obliques

An intermediate abs session: renegade rows first while fresh, then weighted crunches and side bends, with V-ups and a hollow hold on the floor. Straight sets with 45-60 s rest.

אימון בטן לרמה בינונית: קודם חתירת רנגייד כשהגוף רענן, ואחריה כפיפות בטן עם משקולת וכפיפות צד, ובסיום וי-אפ והחזקת הולו בודי על הרצפה. סטים רגילים עם מנוחות של 45-60 שניות.

- Renegade Row: 3 x 6-8, rest 60 s
- Dumbbell Weighted Crunch: 4 x 10-12, rest 45 s
- Dumbbell Side Bend: 3 x 10-12, rest 45 s
- V-Up: 3 x 10-12, rest 45 s
- Hollow Body Hold: 3 x 30 s, rest 45 s

## Core (ליבה) - 12 workouts

### Cable and Floor Core Basics / יסודות ליבה: כבל ורצפה

`core_gym_cable_floor_basics` · beginner · weights · gym · 28 min · 4 exercises, 12 sets · gear: cable_machine · muscles: abs, obliques

A beginner core session: two cable exercises that teach the trunk to resist twisting and to rotate under control, then a dead bug and a plank on the floor.

אימון ליבה למתחילים: שני תרגילי כבל שמלמדים את הגו לעמוד בפני סיבוב ולהסתובב בשליטה, ואחריהם דד באג ופלאנק על הרצפה.

- Pallof Press: 3 x 10-12, rest 45 s
- Cable Woodchop: 3 x 10-12, rest 45 s
- Dead Bug: 3 x 8-10, rest 30 s
- Plank: 3 x 30 s, rest 30 s

### Anti-Rotation and Wheel Core / ליבה: נגד סיבוב וגלגלת בטן

`core_gym_anti_rotation_wheel` · intermediate · weights · gym · 37 min · 4 exercises, 16 sets · gear: cable_machine, pull_up_bar, ab_wheel · muscles: abs, obliques, hip_flexors

An intermediate core session: ab wheel rollouts first while fresh, then Pallof presses and woodchops for the obliques, and hanging knee raises for the abs to finish. Four sets each, short rests.

אימון ליבה לרמה בינונית: קודם גלגלת בטן כשהגוף רענן, ואחריה פאלוף פרס ווודצ׳ופ לשרירים האלכסוניים, ובסיום הרמות ברכיים בתלייה לשרירי הבטן. ארבעה סטים לכל תרגיל ומנוחות קצרות.

- Ab Wheel Rollout: 4 x 8-12, rest 60 s
- Pallof Press: 4 x 10-12, rest 45 s
- Cable Woodchop: 4 x 10-12, rest 45 s
- Hanging Knee Raise: 4 x 10-15, rest 45 s

### Core Stability Basics / יסודות יציבות הליבה

`core_bodyweight_stability_basics` · beginner · bodyweight · home / park / gym · 33 min · 5 exercises, 14 sets · gear: none · muscles: abs, lower_back, glutes, obliques

A gentle core session for the front, sides and back: bird dog, dead bug, side plank, superman and a front plank. Slow reps and short holds, with a full minute of rest when needed.

אימון ליבה עדין לחזית, לצדדים ולגב: בירד דוג, דד באג, פלאנק צידי, סופרמן ופלאנק קדמי. חזרות איטיות והחזקות קצרות, ומנוחה של דקה לפי הצורך.

- Bird Dog: 3 x 6-8, rest 45 s
- Dead Bug: 3 x 6-8, rest 45 s
- Side Plank: 2 x 20 s, rest 45 s
- Superman: 3 x 8-10, rest 45 s
- Plank: 3 x 25 s, rest 45 s

### Waist and Lower Back Mix / מותניים וגב תחתון

`core_bodyweight_waist_and_back` · beginner · bodyweight · home / park / gym · 32 min · 5 exercises, 14 sets · gear: none · muscles: lower_back, obliques, abs, glutes

A beginner core mix that trains the waist and the lower back as well as the belly: climbers, heel touches, a dolphin kick, a side plank and a hip-hinge good morning.

מיקס ליבה למתחילים שמחזק את המותניים ואת הגב התחתון לצד הבטן: מטפס הרים, נגיעות עקב, בעיטת דולפין, פלאנק צידי וגוד מורנינג עם כיפוף מהמותניים.

- Mountain Climber: 3 x 20 s, rest 45 s
- Alternating Heel Touch: 3 x 8-10, rest 45 s
- Bodyweight Good Morning: 3 x 10-12, rest 45 s
- Prone Dolphin Kick: 3 x 8-10, rest 45 s
- Side Plank: 2 x 25 s, rest 45 s

### Plank Variations / וריאציות פלאנק

`core_bodyweight_plank_variations` · intermediate · bodyweight · home / park / gym · 35 min · 5 exercises, 15 sets · gear: none · muscles: abs, chest, lower_back, obliques

The plank in several forms: a held plank, a side plank with hip dips, shoulder taps, a bear crawl and a bird dog. Trains the whole trunk against gravity, with 45 seconds rest.

הפלאנק בכמה צורות: פלאנק סטטי, פלאנק צידי עם הורדת אגן, נגיעות כתף, זחילת דוב ובירד דוג. מאמן את כל הגו מול כוח הכבידה, עם 45 שניות מנוחה.

- Bear Crawl: 3 x 30 s, rest 45 s
- Push-Up with Shoulder Tap: 3 x 10-14, rest 45 s
- Plank: 3 x 50 s, rest 45 s
- Side Plank Hip Dip: 3 x 10-12, rest 45 s
- Bird Dog: 3 x 10-12, rest 45 s

### Rotational Core Work / ליבה בסיבובים

`core_bodyweight_rotation` · intermediate · bodyweight · home / park / gym · 38 min · 6 exercises, 17 sets · gear: none · muscles: obliques, abs, chest, hamstrings

A core session built on twisting and anti-twisting: Russian twists, spider-man push-ups, heel touches, bicycle crunches and a hollow hold, with a good morning for the lower back.

אימון ליבה שמבוסס על סיבובים ועמידה בפני סיבוב: טוויסט רוסי, שכיבות סמיכה ספיידרמן, נגיעות עקב, כפיפות אופניים והחזקת הולו, עם גוד מורנינג לגב התחתון.

- Spider-Man Push-Up: 3 x 6-10, rest 60 s
- Russian Twist: 3 x 12-16, rest 45 s
- Alternating Heel Touch: 3 x 14-18, rest 30 s
- Bicycle Crunch: 3 x 14-18, rest 30 s
- Hollow Body Hold: 3 x 30 s, rest 45 s
- Bodyweight Good Morning: 2 x 12-15, rest 45 s

### Front-to-Back Core / ליבה מלפנים ומאחור

`core_bodyweight_front_to_back` · intermediate · bodyweight · home / park / gym · 37 min · 6 exercises, 18 sets · gear: none · muscles: abs, lower_back, glutes, obliques

Balances the belly with the back: a hollow hold and dead bug in front, supermans and a prone swimmer behind, plus a bear crawl and side plank. Even work, steady tempo.

מאזן בין הבטן לגב: החזקת הולו ודד באג מלפנים, סופרמן ושחיין בשכיבה על הבטן מאחור, וגם זחילת דוב ופלאנק צידי. עבודה מאוזנת בקצב יציב.

- Bear Crawl: 3 x 30 s, rest 45 s
- Hollow Body Hold: 3 x 30 s, rest 45 s
- Dead Bug: 3 x 8-12, rest 30 s
- Superman: 3 x 12-15, rest 30 s
- Prone Swimmer: 3 x 12-16, rest 30 s
- Side Plank: 3 x 35 s, rest 45 s

### Chop, Bend and Brace / וודצ׳ופ, כפיפת צד ויציבות

`core_dumbbell_chop_brace` · beginner · weights · gym / home / park · 31 min · 4 exercises, 12 sets · gear: dumbbells · muscles: obliques, abs, lower_back

A beginner core session: woodchops and side bends with a dumbbell, then a bird dog and a side plank for stability. Straight sets with short rests, no bench needed.

אימון ליבה למתחילים: וודצ׳ופ וכפיפות צד עם משקולת יד, ואחריהם בירד דוג ופלאנק צידי ליציבות. סטים רגילים עם מנוחות קצרות וללא ספסל.

- Dumbbell Woodchop: 3 x 10-12, rest 45 s
- Dumbbell Side Bend: 3 x 10-12, rest 45 s
- Bird Dog: 3 x 8-10, rest 45 s
- Side Plank: 3 x 25 s, rest 45 s

### Loaded Core Stability / יציבות ליבה עם עומס

`core_dumbbell_loaded_stability` · intermediate · weights · gym / home / park · 44 min · 6 exercises, 18 sets · gear: dumbbells · muscles: abs, obliques, forearms, hamstrings

An intermediate core session built on stability under load: renegade rows, good mornings, woodchops and suitcase carries, then a side plank hip dip and a plank. Straight sets, 45-60 s rest.

אימון ליבה לרמה בינונית שבנוי על יציבות תחת עומס: חתירת רנגייד, גוד מורנינג, וודצ׳ופ והליכת מזוודה, ואחריהם פלאנק צידי עם הורדת אגן ופלאנק. סטים רגילים, מנוחות של 45-60 שניות.

- Renegade Row: 3 x 6-8, rest 60 s
- Dumbbell Good Morning: 3 x 10-12, rest 60 s
- Dumbbell Woodchop: 3 x 10-12, rest 45 s
- Suitcase Carry: 3 x 30 s, rest 45 s
- Side Plank Hip Dip: 3 x 10-12, rest 45 s
- Plank: 3 x 45 s, rest 45 s

### Core Flex and Extend / ליבה: כפיפה ופשיטה

`core_dumbbell_flex_extend` · intermediate · weights · gym / home / park · 35 min · 5 exercises, 15 sets · gear: dumbbells · muscles: abs, lower_back, hamstrings, obliques

An intermediate core session that trains the trunk in three directions: good mornings for extension, weighted crunches and a hollow rock for flexion, side bends for the sides, and a bird dog for stability.

אימון ליבה לרמה בינונית שמאמן את פלג הגוף בשלושה כיוונים: גוד מורנינג לפשיטה, כפיפות בטן עם משקולת והולו רוק לכפיפה, כפיפות צד לצדדים ובירד דוג ליציבות.

- Dumbbell Good Morning: 3 x 10-12, rest 60 s
- Dumbbell Weighted Crunch: 3 x 12-15, rest 45 s
- Dumbbell Side Bend: 3 x 10-12, rest 45 s
- Hollow Rock: 3 x 10-12, rest 45 s
- Bird Dog: 3 x 8-10, rest 45 s

### Ground and Bench Core / ליבה על הקרקע ועל הספסל

`core_park_ground_and_bench_core` · beginner · bodyweight · park / home / gym · 28 min · 5 exercises, 14 sets · gear: none · muscles: abs, hip_flexors, lower_back, obliques

Five simple core moves for the front, sides and lower back: plank, side plank, bird dog, mountain climbers and reverse crunches. Short holds, three sets at most.

חמישה תרגילי ליבה פשוטים לבטן, לצדדים ולגב התחתון: פלאנק, פלאנק צידי, בירד דוג, מטפס הרים וכפיפות בטן הפוכות. החזקות קצרות ולא יותר משלושה סטים.

- Plank: 3 x 25 s, rest 45 s
- Side Plank: 2 x 20 s, rest 30 s
- Bird Dog: 3 x 8-10, rest 30 s
- Mountain Climber: 3 x 20 s, rest 30 s
- Reverse Crunch: 3 x 10-12, rest 30 s

### Hang and Hold Core / ליבה: תלייה והחזקות

`core_park_hang_and_hold_core` · intermediate · bodyweight · park / home / gym · 36 min · 5 exercises, 16 sets · gear: pull_up_bar · muscles: abs, obliques, hip_flexors, glutes

Hanging knee raises and oblique raises on the bar, then hollow holds, side plank hip dips and supermans on the ground for the whole trunk. Controlled reps, no swinging.

הרמות ברכיים והרמות ברכיים לצד בתלייה על המוט, ואחר כך החזקות הולו בודי, פלאנק צידי עם הורדת אגן וסופרמן על הקרקע לכל הגו. חזרות מבוקרות, בלי נדנוד.

- Hanging Knee Raise: 4 x 8-12, rest 60 s
- Hanging Oblique Knee Raise: 3 x 6-10, rest 45 s
- Hollow Body Hold: 3 x 40 s, rest 45 s
- Side Plank Hip Dip: 3 x 8-12, rest 30 s
- Superman: 3 x 10-12, rest 30 s

## Glutes (ישבן) - 17 workouts

### Glute Starter on Machines / צעדים ראשונים לישבן עם מכונות

`glutes_gym_machine_starter` · beginner · weights · gym · 31 min · 4 exercises, 12 sets · gear: cable_machine, leg_press_machine · muscles: glutes, quadriceps, hamstrings

A gentle glute session for newcomers: leg press, cable pull-through, step-ups and a bridge. Straight sets with moderate rest so the form stays clean.

אימון ישבן עדין למתחילים: לחיצת רגליים, פול ת׳רו בכבל, עליות על מדרגה וגשר ישבן. סטים רגילים עם מנוחות בינוניות כדי לשמור על טכניקה נקייה.

- Leg Press: 3 x 10-15, rest 75 s
- Cable Pull-Through: 3 x 12-15, rest 60 s
- Step-Up: 3 x 8-10, rest 45 s
- Glute Bridge: 3 x 12-15, rest 45 s

### Smith Squat and Hinge Basics / יסודות סקוואט סמית׳ וציר ירך

`glutes_gym_smith_hinge_lunge` · beginner · weights · gym · 30 min · 4 exercises, 12 sets · gear: dumbbells, smith_machine · muscles: glutes, quadriceps, hamstrings, lower_back

A beginner glute and leg session built on a guided squat, a dumbbell hinge and long-stride lunges, with a floor extension to finish. Good for learning the patterns.

אימון בסיס לישבן ולרגליים: סקוואט מונחה במכונת סמית׳, דדליפט רומני עם משקולות, מכרעים בהליכה וסופרמן לסיום. מתאים ללימוד תבניות התנועה.

- Smith Machine Squat: 3 x 10-12, rest 75 s
- Dumbbell Romanian Deadlift: 3 x 10-12, rest 60 s
- Walking Lunge: 3 x 8-10, rest 45 s
- Superman: 3 x 10-12, rest 30 s

### Hip Thrust Builder / בניית ישבן עם היפ טראסט

`glutes_gym_hip_thrust_builder` · intermediate · weights · gym · 43 min · 5 exercises, 16 sets · gear: barbell, bench, cable_machine · muscles: glutes, hamstrings, quadriceps

A glute session led by the barbell hip thrust, followed by a Romanian deadlift, Bulgarian split squats, a cable pull-through and single-leg bridges. Straight sets, 45-90 s rest.

אימון ישבן שמתחיל בהיפ טראסט עם מוט, ממשיך בדדליפט רומני, סקוואט בולגרי ופול ת׳רו בכבל ונגמר בגשר ישבן על רגל אחת. סטים רגילים עם מנוחות של 45-90 שניות.

- Barbell Hip Thrust: 4 x 8-12, rest 90 s
- Romanian Deadlift: 3 x 8-10, rest 90 s
- Bulgarian Split Squat: 3 x 8-10, rest 60 s
- Cable Pull-Through: 3 x 12-15, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s

### Leg Press and Swing Glutes / ישבן עם לחיצת רגליים וסווינג

`glutes_gym_press_and_swing` · intermediate · weights · gym · 42 min · 5 exercises, 17 sets · gear: dumbbells, kettlebell, leg_press_machine · muscles: glutes, hamstrings, quadriceps

Glute work from several angles: leg press with high feet, kettlebell swings for hip power, loaded reverse lunges and single-leg hinges, with a bridge to finish. Moderate rest, steady pace.

עבודה לישבן מכמה זוויות: לחיצת רגליים עם רגליים גבוהות, קטלבל סווינג לכוח ירכיים, מכרעים לאחור עם משקולות ודדליפט רומני על רגל אחת, ובסוף גשר ישבן. מנוחות בינוניות וקצב יציב.

- Leg Press: 4 x 10-12, rest 75 s
- Kettlebell Swing: 4 x 12-15, rest 60 s
- Dumbbell Reverse Lunge: 3 x 8-10, rest 75 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Glute Bridge: 3 x 15-20, rest 30 s

### Heavy Hip Extension Day / יום כבד לפשיטת ירכיים

`glutes_gym_heavy_extension` · advanced · weights · gym · 55 min · 5 exercises, 17 sets · gear: barbell, dumbbells, bench · muscles: glutes, quadriceps, hamstrings, lower_back

An advanced glute session: deadlift and hip thrust as the heavy lifts, then loaded lunges, pistol squats and single-leg bridges. Long rests and controlled reps, no sets to failure.

אימון ישבן למתקדמים: דדליפט והיפ טראסט כתרגילים הכבדים, ואחריהם מכרעים עם משקולות, פיסטול סקוואט וגשר ישבן על רגל אחת. מנוחות ארוכות וחזרות בשליטה, בלי סטים עד כשל.

- Deadlift: 4 x 5-6, rest 150 s
- Barbell Hip Thrust: 4 x 6-8, rest 120 s
- Dumbbell Reverse Lunge: 3 x 8-10, rest 90 s
- Pistol Squat: 3 x 4-6, rest 90 s
- Single-Leg Glute Bridge: 3 x 12-15, rest 45 s

### Floor Glute Activation / הפעלת ישבן על הרצפה

`glutes_bw_floor_activation` · beginner · bodyweight · home / park / gym · 28 min · 5 exercises, 12 sets · gear: none · muscles: glutes, lower_back

A gentle floor session for the glutes: bridge, frog pump, donkey kicks, fire hydrants and a superman, in straight sets with short rests. No equipment and easy on the joints; suits newcomers.

אימון ישבן עדין על הרצפה: גשר ישבן, גשר צפרדע, בעיטות חמור, פייר הידרנט וסופרמן, בסטים רגילים עם מנוחות קצרות. בלי ציוד ועדין למפרקים; מתאים למתחילים.

- Glute Bridge: 3 x 12-15, rest 45 s
- Frog Pump: 3 x 15-20, rest 45 s
- Donkey Kick: 2 x 10-12, rest 30 s
- Fire Hydrant: 2 x 10-12, rest 30 s
- Superman: 2 x 10-12, rest 30 s

### Squat, Lunge and Hip Thrust Glutes / ישבן: סקוואט, מכרע והיפ טראסט

`glutes_bw_squat_lunge_thrust` · beginner · bodyweight · home / park / gym · 32 min · 5 exercises, 12 sets · gear: none · muscles: glutes, quadriceps, adductors

A standing and lying mix for newcomers: sumo squat, reverse lunge, step-up, hip thrust off a sofa or bench and a bridge march. Straight sets that teach the main glute patterns.

שילוב של עבודה בעמידה ובשכיבה למתחילים: סקוואט סומו, מכרע לאחור, עליות על מדרגה, היפ טראסט עם הגב על ספה או ספסל וגשר עם צעידה. סטים רגילים שמלמדים את תבניות התנועה העיקריות לישבן.

- Bodyweight Sumo Squat: 3 x 10-12, rest 60 s
- Reverse Lunge: 2 x 8-10, rest 60 s
- Step-Up: 2 x 8-10, rest 60 s
- Bodyweight Hip Thrust: 3 x 12-15, rest 45 s
- Glute Bridge March: 2 x 8-10, rest 45 s

### Lunge and Hinge Glutes / ישבן: מכרעים וציר ירך

`glutes_bw_lunge_and_hinge` · intermediate · bodyweight · home / park / gym · 39 min · 5 exercises, 14 sets · gear: none · muscles: glutes, quadriceps, hamstrings

Single-leg glute strength: Bulgarian split squat, single-leg hinge, curtsy lunge and single-leg hip thrust, with fire hydrants to finish. Straight sets, reps counted per side; for people with some leg-training experience.

כוח לישבן בעבודה על רגל אחת: סקוואט בולגרי, ציר ירך על רגל אחת, מכרע קורטסי והיפ טראסט על רגל אחת, ופייר הידרנט לסיום. סטים רגילים, החזרות לכל צד; מתאים לבעלי ניסיון באימוני רגליים.

- Bulgarian Split Squat: 3 x 8-12, rest 75 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Curtsy Lunge: 3 x 10-12, rest 60 s
- Single-Leg Hip Thrust: 3 x 10-12, rest 60 s
- Fire Hydrant: 2 x 15-20, rest 30 s

### High-Rep Glute Endurance / סיבולת ישבן בחזרות גבוהות

`glutes_bw_endurance_burn` · intermediate · bodyweight · home / park / gym · 35 min · 5 exercises, 17 sets · gear: none · muscles: glutes, quadriceps, adductors

High-rep glute work with short rests: Cossack squats, step-ups, single-leg bridges, frog pumps and donkey kicks. It relies on controlled reps and muscular fatigue rather than heavy loading.

עבודה לישבן בחזרות גבוהות ובמנוחות קצרות: סקוואט קוזאקי, עליות על מדרגה, גשר על רגל אחת, גשר צפרדע ובעיטות חמור. מתבססת על חזרות מבוקרות ועל עייפות השריר ולא על עומס כבד.

- Cossack Squat: 3 x 10-12, rest 30 s
- Step-Up: 4 x 12-15, rest 30 s
- Single-Leg Glute Bridge: 4 x 12-15, rest 30 s
- Frog Pump: 3 x 20-25, rest 20 s
- Donkey Kick: 3 x 15-20, rest 20 s

### Shrimp Squat and Bound Glute Power / כוח ישבן: שרימפ סקוואט וניתורים

`glutes_bw_shrimp_bound_power` · advanced · bodyweight · home / park / gym · 47 min · 5 exercises, 17 sets · gear: none · muscles: glutes, quadriceps, hamstrings

An advanced glute session: lateral bounds and broad jumps for power first, then shrimp squats, single-leg hip thrusts and single-leg hinges for strength. Land softly; needs solid single-leg control.

אימון ישבן מתקדם: ניתורים לצדדים וקפיצות לרוחק לכוח בתחילת האימון, ואחר כך שרימפ סקוואט, היפ טראסט וציר ירך על רגל אחת לכוח שריר. נחיתה רכה; דורש שליטה טובה על רגל אחת.

- Lateral Bound: 3 x 6-8, rest 60 s
- Broad Jump: 3 x 5-6, rest 75 s
- Shrimp Squat: 4 x 5-8, rest 90 s
- Single-Leg Hip Thrust: 4 x 8-10, rest 60 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s

### Floor Glute Starter / התחלה לישבן על הרצפה

`glutes_dumbbell_floor_starter` · beginner · weights · gym / home / park · 28 min · 4 exercises, 11 sets · gear: dumbbells · muscles: glutes, adductors, hamstrings, quadriceps

A glute session for newcomers that needs no bench: sumo squats and Romanian deadlifts with dumbbells, then a frog pump and donkey kicks on the floor. Straight sets with 45-60 s rest.

אימון ישבן למתחילים ללא ספסל: סקוואט סומו ודדליפט רומני עם משקולות יד, ואחריהם גשר צפרדע ובעיטות חמור על הרצפה. סטים רגילים עם מנוחות של 45-60 שניות.

- Dumbbell Sumo Squat: 3 x 12-15, rest 60 s
- Dumbbell Romanian Deadlift: 3 x 10-12, rest 60 s
- Frog Pump: 3 x 12-15, rest 45 s
- Donkey Kick: 2 x 10-12, rest 45 s

### Bench Hip Thrust Basics / יסודות היפ טראסט עם ספסל

`glutes_dumbbell_bench_thrust_basics` · beginner · weights · gym / home / park · 32 min · 5 exercises, 12 sets · gear: dumbbells, bench · muscles: glutes, quadriceps, hamstrings

A beginner glute session built around the dumbbell hip thrust on a bench, with a goblet squat and a Romanian deadlift, then step-ups and bridge marches with body weight. Moderate rest.

אימון ישבן למתחילים סביב היפ טראסט עם משקולת יד על ספסל, יחד עם גובלט סקוואט ודדליפט רומני, ואחריהם עליות על מדרגה וצעידות בגשר ישבן במשקל גוף. מנוחות בינוניות.

- Dumbbell Hip Thrust: 3 x 10-12, rest 60 s
- Goblet Squat: 3 x 10-12, rest 60 s
- Dumbbell Romanian Deadlift: 2 x 10-12, rest 60 s
- Step-Up: 2 x 8-10, rest 45 s
- Glute Bridge March: 2 x 8-10, rest 45 s

### Weighted Lunge and Hinge Glutes / ישבן: מכרעים וציר ירך עם משקולות

`glutes_dumbbell_lunge_hinge` · intermediate · weights · gym / home / park · 39 min · 5 exercises, 15 sets · gear: dumbbells · muscles: glutes, quadriceps, hamstrings

A bench-free intermediate glute session: a heavier Romanian deadlift, walking lunges and high step-ups with dumbbells, then single-leg bridges and fire hydrants. Straight sets, 30-75 s rest.

אימון ישבן לרמה בינונית ללא ספסל: דדליפט רומני כבד יותר, מכרעים בהליכה ועליות על מדרגה גבוהה עם משקולות, ואחריהם גשר ישבן על רגל אחת ופייר הידרנט. סטים רגילים, מנוחות של 30-75 שניות.

- Dumbbell Romanian Deadlift: 4 x 8-10, rest 75 s
- Dumbbell Walking Lunge: 3 x 10-12, rest 60 s
- Dumbbell Step-Up: 3 x 8-10, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s
- Fire Hydrant: 2 x 12-15, rest 30 s

### Light-Weight High-Rep Glutes / ישבן במשקולות קלות וחזרות רבות

`glutes_dumbbell_high_rep_endurance` · intermediate · weights · gym / home / park · 35 min · 5 exercises, 16 sets · gear: dumbbells · muscles: glutes, quadriceps, adductors, hamstrings

Lighter dumbbells, more reps and short rests: reverse lunges, sumo squats and Romanian deadlifts, then curtsy lunges and a bodyweight hip thrust. Straight sets that train muscular endurance.

משקולות קלות יותר, יותר חזרות ומנוחות קצרות: מכרעים לאחור, סקוואט סומו ודדליפט רומני, ואחריהם מכרעים קורטסי והיפ טראסט במשקל גוף. סטים רגילים שמאמנים סיבולת שרירים.

- Dumbbell Reverse Lunge: 4 x 12-15, rest 45 s
- Dumbbell Sumo Squat: 3 x 15-20, rest 45 s
- Dumbbell Romanian Deadlift: 3 x 12-15, rest 45 s
- Curtsy Lunge: 3 x 12-15, rest 30 s
- Bodyweight Hip Thrust: 3 x 15-20, rest 30 s

### Heavy Single-Leg Glutes / ישבן כבד על רגל אחת

`glutes_dumbbell_heavy_single_leg` · advanced · weights · gym / home / park · 50 min · 5 exercises, 17 sets · gear: dumbbells, bench · muscles: glutes, quadriceps, hamstrings

An advanced glute session: a heavy dumbbell hip thrust, shrimp squats, Bulgarian split squats and single-leg Romanian deadlifts, with single-leg hip thrusts to finish. Long rests, strict form.

אימון ישבן למתקדמים: היפ טראסט כבד עם משקולת יד, שרימפ סקוואט, סקוואט בולגרי ודדליפט רומני על רגל אחת, ובסיום היפ טראסט על רגל אחת. מנוחות ארוכות וטכניקה קפדנית.

- Dumbbell Hip Thrust: 4 x 6-8, rest 90 s
- Shrimp Squat: 3 x 5-6, rest 90 s
- Dumbbell Bulgarian Split Squat: 4 x 6-8, rest 90 s
- Dumbbell Single-Leg Romanian Deadlift: 3 x 6-8, rest 75 s
- Single-Leg Hip Thrust: 3 x 8-10, rest 60 s

### Banded Glute Strength Basics / יסודות כוח לישבן עם גומייה

`glutes_bands_strength_basics` · beginner · weights · home / park / gym · 35 min · 6 exercises, 15 sets · gear: resistance_bands · muscles: glutes, quadriceps

A beginner glute session: a band squat and band bridge for strength, then lateral walks, clamshells, a frog pump and donkey kicks for the sides and back of the hips. Easy sets, short rests.

אימון ישבן למתחילים: סקוואט וגשר ישבן עם גומייה לכוח, ואחריהם הליכות צידיות, צדפות, גשר צפרדע ובעיטות חמור לצדדי האגן ולישבן. סטים קלים ומנוחות קצרות.

- Band-Resisted Squat: 3 x 12-15, rest 60 s
- Band Glute Bridge: 3 x 12-15, rest 45 s
- Banded Lateral Walk: 3 x 10-12, rest 45 s
- Banded Clamshell: 2 x 12-15, rest 30 s
- Frog Pump: 2 x 15-20, rest 30 s
- Donkey Kick: 2 x 12-15, rest 30 s

### Kettlebell Squat and Bridge Basics / יסודות סקוואט וגשר ישבן עם קטלבל

`glutes_kettlebell_squat_and_bridge_basics` · beginner · weights · home / park / gym · 28 min · 4 exercises, 12 sets · gear: kettlebell · muscles: glutes, hamstrings, quadriceps

A beginner glute session: goblet squats and kettlebell deadlifts to learn the squat and the hinge, then glute bridges and frog pumps on the floor. Four exercises, three easy sets of each.

אימון ישבן למתחילים: גובלט סקוואט ודדליפט עם קטלבל ללימוד הסקוואט וציר הירך, ואחריהם גשר ישבן וגשר צפרדע על הרצפה. ארבעה תרגילים, שלושה סטים קלים בכל אחד.

- Kettlebell Goblet Squat: 3 x 10-12, rest 60 s
- Kettlebell Deadlift: 3 x 10-12, rest 60 s
- Glute Bridge: 3 x 12-15, rest 45 s
- Frog Pump: 3 x 15-20, rest 30 s

## Quads (ארבע-ראשי) - 10 workouts

### Leg Press and Goblet Quads / ארבע-ראשי עם לחיצת רגליים וגובלט

`quads_gym_press_goblet_basics` · beginner · weights · gym · 32 min · 5 exercises, 13 sets · gear: dumbbells, leg_press_machine, leg_extension_machine · muscles: quadriceps, glutes

A beginner quad session: goblet squat and leg press for the main work, then lunges, leg extensions and a wall sit to finish. Light loads, 2-3 sets, easy pace.

אימון ארבע-ראשי למתחילים: גובלט סקוואט ולחיצת רגליים כעבודה עיקרית, ואחריהם מכרעים, פשיטת ברכיים וכיסא על הקיר לסיום. משקלים קלים, 2-3 סטים וקצב רגוע.

- Goblet Squat: 3 x 10-12, rest 60 s
- Leg Press: 3 x 12-15, rest 75 s
- Reverse Lunge: 2 x 8-10, rest 45 s
- Leg Extension: 3 x 12-15, rest 45 s
- Wall Sit: 2 x 30 s, rest 45 s

### Barbell Squat Quad Day / יום ארבע-ראשי עם סקוואט מוט

`quads_gym_barbell_squat_day` · intermediate · weights · gym · 41 min · 5 exercises, 16 sets · gear: barbell, squat_rack, leg_press_machine, leg_extension_machine · muscles: quadriceps, glutes

A classic quad day: barbell back squat first, then leg press, Bulgarian split squats, leg extensions and a wall sit. Straight sets with moderate rest.

יום ארבע-ראשי קלאסי: סקוואט עם מוט בהתחלה, ואחריו לחיצת רגליים, סקוואט בולגרי, פשיטת ברכיים וכיסא על הקיר. סטים רגילים עם מנוחות בינוניות.

- Barbell Back Squat: 4 x 8-10, rest 90 s
- Leg Press: 3 x 10-12, rest 75 s
- Bulgarian Split Squat: 3 x 8-10, rest 60 s
- Leg Extension: 3 x 12-15, rest 45 s
- Wall Sit: 3 x 45 s, rest 45 s

### Tempo Squat and Single-Leg Quads / ארבע-ראשי: סקוואט בקצב מבוקר ועבודה על רגל אחת

`quads_gym_tempo_single_leg` · intermediate · weights · gym · 40 min · 5 exercises, 16 sets · gear: dumbbells, leg_extension_machine, smith_machine · muscles: quadriceps, glutes, adductors

Quad work built on a slow-lowering Smith squat, then dumbbell reverse lunges, step-ups and Cossack squats, with leg extensions to finish. Moderate loads and a controlled tempo.

עבודה לארבע-ראשי שמתחילה בסקוואט סמית׳ עם ירידה איטית, ממשיכה במכרע לאחור עם משקולות, עליות על מדרגה וסקוואט קוזאקי, ונגמרת בפשיטת ברכיים. משקלים בינוניים וקצב מבוקר.

- Smith Machine Squat: 4 x 8-10, rest 75 s
- Dumbbell Reverse Lunge: 3 x 8-10, rest 60 s
- Step-Up: 3 x 10-12, rest 45 s
- Cossack Squat: 3 x 8-10, rest 45 s
- Leg Extension: 3 x 12-15, rest 45 s

### Front Squat and Jump Power / סקוואט קדמי וכוח קפיצה

`quads_gym_front_squat_power` · advanced · weights · gym · 52 min · 5 exercises, 18 sets · gear: barbell, squat_rack, leg_press_machine, leg_extension_machine, plyo_box · muscles: quadriceps, glutes

An advanced quad session: a few box jumps while fresh, heavy front squats, pistol squats, leg press and leg extensions. Long rests, and every set stops short of failure.

אימון ארבע-ראשי למתקדמים: כמה קפיצות ארגז כשהגוף רענן, סקוואט קדמי כבד, פיסטול סקוואט, לחיצת רגליים ופשיטת ברכיים. מנוחות ארוכות, וכל סט נעצר לפני כשל.

- Box Jump: 3 x 4-6, rest 90 s
- Front Squat: 5 x 5-6, rest 120 s
- Pistol Squat: 3 x 4-6, rest 90 s
- Leg Press: 4 x 10-12, rest 90 s
- Leg Extension: 3 x 15-20, rest 45 s

### Chair Squat and Wall Sit Quads / ארבע-ראשי: סקוואט לכיסא וכיסא על הקיר

`quads_bw_chair_squat_wall_sit` · beginner · bodyweight · home / park / gym · 31 min · 5 exercises, 12 sets · gear: none · muscles: quadriceps, glutes, calves

A beginner quad session: chair squat, walking lunge, step-up and a wall sit, finishing with calf raises. Straight sets with moderate rest to build clean squat and lunge form.

אימון ארבע-ראשי למתחילים: סקוואט לכיסא, מכרעים בהליכה, עליות על מדרגה וכיסא על הקיר, ובסיום הרמות עקבים. סטים רגילים עם מנוחה בינונית כדי לבנות טכניקה נקייה של סקוואט ומכרע.

- Box Squat (Sit-to-Stand): 3 x 10-12, rest 60 s
- Walking Lunge: 2 x 8-10, rest 60 s
- Step-Up: 2 x 8-10, rest 60 s
- Wall Sit: 3 x 30 s, rest 45 s
- Standing Calf Raise: 2 x 15-20, rest 30 s

### Pause Squats and Split Jumps / סקוואט עם עצירה וקפיצות ספליט

`quads_bw_pause_squat_split_jump` · intermediate · bodyweight · home / park / gym · 45 min · 6 exercises, 19 sets · gear: none · muscles: quadriceps, glutes, adductors, calves

Intermediate quad work: split squat jumps first while fresh, then pause squats, Bulgarian split squats, lateral lunges, a wall sit and single-leg calf raises. The jumps are noisy, so land softly.

עבודת ארבע-ראשי ברמה בינונית: קפיצות ספליט בתחילת האימון כשהגוף רענן, ואחריהן סקוואט עם עצירה, סקוואט בולגרי, מכרע צידי, כיסא על הקיר והרמות עקבים על רגל אחת. הקפיצות רועשות, לכן לנחות בעדינות.

- Split Squat Jump: 3 x 8-10, rest 60 s
- Pause Squat: 4 x 10-12, rest 60 s
- Bulgarian Split Squat: 3 x 8-12, rest 60 s
- Lateral Lunge: 3 x 10-12, rest 45 s
- Wall Sit: 3 x 45 s, rest 45 s
- Single-Leg Calf Raise: 3 x 12-15, rest 30 s

### Pistol and Sissy Squat Quad Strength / כוח ארבע-ראשי: פיסטול וסיסי סקוואט

`quads_bw_pistol_sissy_strength` · advanced · bodyweight · home / park / gym · 45 min · 5 exercises, 16 sets · gear: none · muscles: quadriceps, glutes

Advanced quad strength: jump squats, pistol squats, Bulgarian split squats, sissy squats and a long wall sit. Demanding for the knees, so it needs a solid squat base and a thorough warm-up.

כוח ארבע-ראשי ברמה מתקדמת: סקוואט קפיצה, פיסטול סקוואט, סקוואט בולגרי, סיסי סקוואט וכיסא ארוך על הקיר. תובעני לברכיים, ולכן דורש בסיס סקוואט יציב וחימום יסודי.

- Jump Squat: 3 x 8-10, rest 60 s
- Pistol Squat: 4 x 5-8, rest 90 s
- Bulgarian Split Squat: 3 x 8-10, rest 75 s
- Sissy Squat: 3 x 8-10, rest 75 s
- Wall Sit: 3 x 60 s, rest 60 s

### Squat and Lunge Quad Basics / יסודות ארבע-ראשי: סקוואט ומכרעים

`quads_dumbbell_squat_lunge_basics` · beginner · weights · gym / home / park · 28 min · 5 exercises, 11 sets · gear: dumbbells · muscles: quadriceps, glutes, adductors, calves

A gentle quad session for beginners: a goblet squat, bodyweight walking lunges and a dumbbell sumo squat, then a wall sit and calf raises. Straight sets, moderate rest, no bench needed.

אימון עדין לארבע-ראשי למתחילים: גובלט סקוואט, מכרעים בהליכה במשקל גוף וסקוואט סומו עם משקולת, ובסיום כיסא על הקיר והרמות עקבים. סטים רגילים, מנוחות בינוניות וללא ספסל.

- Goblet Squat: 3 x 10-12, rest 60 s
- Walking Lunge: 2 x 8-10, rest 45 s
- Dumbbell Sumo Squat: 2 x 10-12, rest 60 s
- Wall Sit: 2 x 30 s, rest 45 s
- Dumbbell Calf Raise: 2 x 12-15, rest 30 s

### Front Squat and Lunge Quads / ארבע-ראשי: סקוואט קדמי ומכרעים

`quads_dumbbell_front_squat_lunge` · intermediate · weights · gym / home / park · 39 min · 5 exercises, 16 sets · gear: dumbbells · muscles: quadriceps, glutes, calves

An intermediate quad session: dumbbell front squats first, then walking lunges and step-ups, a wall sit and calf raises. Straight sets with 30-75 s rest.

אימון ארבע-ראשי לרמה בינונית: קודם סקוואט קדמי עם משקולות, ואחריו מכרעים בהליכה ועליות על מדרגה, כיסא על הקיר והרמות עקבים. סטים רגילים עם מנוחות של 30-75 שניות.

- Dumbbell Front Squat: 4 x 8-10, rest 75 s
- Dumbbell Walking Lunge: 3 x 10-12, rest 60 s
- Dumbbell Step-Up: 3 x 8-10, rest 60 s
- Wall Sit: 3 x 45 s, rest 45 s
- Dumbbell Calf Raise: 3 x 12-15, rest 30 s

### Front Squat, Split Squat and Pistol / סקוואט קדמי, סקוואט בולגרי ופיסטול

`quads_dumbbell_thruster_pistol` · advanced · weights · gym / home / park · 50 min · 5 exercises, 17 sets · gear: dumbbells, bench · muscles: glutes, quadriceps, calves

An advanced quad session: dumbbell front squats, Bulgarian split squats, assisted pistol squats and reverse lunges, with single-leg calf raises to finish. Long rests, demanding on the knees, so keep the form strict.

אימון ארבע-ראשי למתקדמים: סקוואט קדמי עם משקולות, סקוואט בולגרי, פיסטול סקוואט בעזרת משענת ומכרעים לאחור, ובסיום הרמות עקבים על רגל אחת. מנוחות ארוכות; תובעני לברכיים, לכן הטכניקה קפדנית.

- Dumbbell Front Squat: 4 x 6-8, rest 90 s
- Dumbbell Bulgarian Split Squat: 4 x 6-8, rest 90 s
- Pistol Squat: 3 x 5-6, rest 90 s
- Dumbbell Reverse Lunge: 3 x 6-8, rest 75 s
- Single-Leg Calf Raise: 3 x 10-12, rest 45 s

## Hamstrings (ירך אחורי) - 11 workouts

### Hinge and Curl Basics / יסודות ציר ירך וכפיפת ברכיים

`hamstrings_gym_hinge_curl_basics` · beginner · weights · gym · 33 min · 5 exercises, 14 sets · gear: dumbbells, cable_machine, leg_curl_machine · muscles: glutes, hamstrings, lower_back

A beginner hamstring session: dumbbell Romanian deadlift, cable pull-through and machine leg curls, with a bridge and a floor extension to finish. Light loads, clean form.

אימון לירך האחורית למתחילים: דדליפט רומני עם משקולות, פול ת׳רו בכבל וכפיפת ברכיים במכונה, ובסיום גשר ישבן וסופרמן. משקלים קלים וטכניקה נקייה.

- Dumbbell Romanian Deadlift: 3 x 10-12, rest 60 s
- Cable Pull-Through: 3 x 12-15, rest 60 s
- Lying Leg Curl: 3 x 10-15, rest 60 s
- Glute Bridge: 3 x 12-15, rest 45 s
- Superman: 2 x 10-12, rest 30 s

### Romanian Deadlift and Single-Leg Hinge / דדליפט רומני וציר ירך על רגל אחת

`hamstrings_gym_rdl_single_leg` · intermediate · weights · gym · 41 min · 5 exercises, 16 sets · gear: barbell, cable_machine, leg_curl_machine · muscles: glutes, hamstrings

A hamstring session built on the barbell Romanian deadlift, a single-leg hinge for balance, a cable pull-through and single-leg bridges, with machine leg curls to finish.

אימון לירך האחורית שבנוי על דדליפט רומני עם מוט, דדליפט רומני על רגל אחת לשיווי משקל, פול ת׳רו בכבל וגשר ישבן על רגל אחת, ובסיום כפיפת ברכיים במכונה.

- Romanian Deadlift: 4 x 8-10, rest 90 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Cable Pull-Through: 3 x 12-15, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s
- Lying Leg Curl: 3 x 10-12, rest 60 s

### Deadlift, Swing and Curl / דדליפט, סווינג וכפיפות ברכיים

`hamstrings_gym_deadlift_swing_curl` · intermediate · weights · gym · 45 min · 5 exercises, 18 sets · gear: barbell, kettlebell, leg_curl_machine · muscles: glutes, hamstrings, lower_back, quadriceps

A posterior-chain day: deadlift for strength, then leg curls, kettlebell swings for hip speed and long-stride lunges, with a floor extension to finish. Moderate to long rests.

יום לשרשרת האחורית: דדליפט לכוח, ואחריו כפיפת ברכיים, קטלבל סווינג למהירות ירכיים ומכרעים בצעד ארוך, ובסיום סופרמן. מנוחות בינוניות עד ארוכות.

- Deadlift: 4 x 6-8, rest 120 s
- Lying Leg Curl: 4 x 8-12, rest 60 s
- Kettlebell Swing: 4 x 12-15, rest 60 s
- Walking Lunge: 3 x 10-12, rest 60 s
- Superman: 3 x 12-15, rest 30 s

### Nordic and Heavy Hinge / נורדיק וציר ירך כבד

`hamstrings_gym_nordic_heavy_hinge` · advanced · weights · gym · 51 min · 5 exercises, 18 sets · gear: barbell, kettlebell, leg_curl_machine · muscles: hamstrings, glutes

An advanced hamstring session: heavy Romanian deadlifts, Nordic curls for eccentric strength, leg curls, kettlebell swings and single-leg bridges. Long rests, strict form.

אימון לירך האחורית למתקדמים: דדליפט רומני כבד, נורדיק קרל לכוח בירידה, כפיפת ברכיים, קטלבל סווינג וגשר ישבן על רגל אחת. מנוחות ארוכות וטכניקה קפדנית.

- Romanian Deadlift: 4 x 6-8, rest 120 s
- Kettlebell Swing: 4 x 10-12, rest 75 s
- Single-Leg Glute Bridge: 3 x 12-15, rest 45 s
- Nordic Hamstring Curl: 3 x 4-6, rest 120 s
- Lying Leg Curl: 4 x 8-10, rest 75 s

### Hinge and Bridge Basics / יסודות: ציר ירך וגשר

`hamstrings_bw_hinge_bridge_basics` · beginner · bodyweight · home / park / gym · 29 min · 5 exercises, 12 sets · gear: none · muscles: glutes, hamstrings, lower_back

Learn the hip hinge and the bridge: good morning, balance reach, glute bridge, bridge march and superman. Gentle work for the back of the legs and the glutes in straight sets, no equipment.

לימוד ציר הירך והגשר: גוד מורנינג, הושטת רגל בשיווי משקל, גשר ישבן, גשר עם צעידה וסופרמן. עבודה עדינה לירך האחורית ולישבן בסטים רגילים, בלי ציוד.

- Bodyweight Good Morning: 3 x 10-12, rest 45 s
- Single-Leg Balance Reach: 2 x 6-8, rest 45 s
- Glute Bridge: 3 x 12-15, rest 45 s
- Glute Bridge March: 2 x 8-10, rest 45 s
- Superman: 2 x 10-12, rest 30 s

### Slider Curls and Single-Leg Hinge / כפיפות החלקה וציר ירך על רגל אחת

`hamstrings_bw_slider_single_leg` · intermediate · bodyweight · home / gym · 35 min · 5 exercises, 15 sets · gear: none · muscles: hamstrings, glutes, calves, lower_back

Hamstrings with a single-leg hinge and towel slider curls, plus single-leg bridges, a good morning and butt kicks to finish. The slider curls need a smooth floor and a towel.

עבודה לירך האחורית עם ציר ירך על רגל אחת וכפיפות החלקה עם מגבת, וגם גשר על רגל אחת, גוד מורנינג ועקבים לישבן לסיום. לכפיפות ההחלקה צריך רצפה חלקה ומגבת.

- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Towel Slider Hamstring Curl: 3 x 8-12, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s
- Bodyweight Good Morning: 3 x 12-15, rest 45 s
- Butt Kicks: 3 x 30 s, rest 30 s

### Nordic and Single-Leg Hamstring Strength / כוח לירך האחורית: נורדיק ורגל אחת

`hamstrings_bw_nordic_single_leg` · advanced · bodyweight · home / park / gym · 43 min · 5 exercises, 17 sets · gear: none · muscles: hamstrings, glutes, lower_back

Advanced hamstring strength: single-leg hinge, Nordic curls, single-leg hip thrusts and heel walkouts, finished with a slow good morning. Nordic curls need the ankles anchored under a sofa or held by another person.

כוח לירך האחורית ברמה מתקדמת: ציר ירך על רגל אחת, נורדיק קרל, היפ טראסט על רגל אחת והליכת עקבים בגשר, ובסיום גוד מורנינג איטי. בנורדיק קרל צריך לעגן את הקרסוליים מתחת לספה או שאדם נוסף יחזיק אותם.

- Single-Leg Romanian Deadlift: 4 x 8-10, rest 60 s
- Nordic Hamstring Curl: 4 x 5-8, rest 90 s
- Single-Leg Hip Thrust: 3 x 10-12, rest 60 s
- Hamstring Walkout: 3 x 8-10, rest 60 s
- Bodyweight Good Morning: 3 x 12-15, rest 45 s

### Dumbbell Hinge Starter / התחלה בציר ירך עם משקולות

`hamstrings_dumbbell_hinge_starter` · beginner · weights · gym / home / park · 27 min · 4 exercises, 10 sets · gear: dumbbells, bench · muscles: glutes, hamstrings, lower_back

A beginner hamstring session: a Romanian deadlift and a dumbbell hip thrust to learn the hinge, then a single-leg balance reach and a floor superman. Light loads, clean form.

אימון לירך האחורית למתחילים: דדליפט רומני והיפ טראסט עם משקולת יד ללימוד תנועת הציר, ואחריהם הושטת רגל בשיווי משקל וסופרמן על הרצפה. משקלים קלים וטכניקה נקייה.

- Dumbbell Romanian Deadlift: 3 x 10-12, rest 60 s
- Dumbbell Hip Thrust: 3 x 10-12, rest 60 s
- Single-Leg Balance Reach: 2 x 8-10, rest 45 s
- Superman: 2 x 10-12, rest 45 s

### Hinge and Slider Hamstrings / ירך אחורית: ציר ירך והחלקה

`hamstrings_dumbbell_hinge_slider` · intermediate · weights · gym / home / park · 34 min · 4 exercises, 13 sets · gear: dumbbells · muscles: glutes, hamstrings

An intermediate hamstring session that needs no bench: Romanian deadlifts and single-leg hinges with dumbbells, towel slider curls for the knee-bending action, and single-leg bridges to finish.

אימון לירך האחורית לרמה בינונית ללא ספסל: דדליפט רומני ודדליפט רומני על רגל אחת עם משקולות, כפיפות ברכיים בהחלקה עם מגבת לפעולת הכפיפה, ובסיום גשר ישבן על רגל אחת.

- Dumbbell Romanian Deadlift: 4 x 8-10, rest 75 s
- Dumbbell Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Towel Slider Hamstring Curl: 3 x 8-10, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s

### Posterior Chain Strength / כוח לשרשרת האחורית

`hamstrings_dumbbell_posterior_chain` · advanced · weights · gym / home / park · 44 min · 5 exercises, 16 sets · gear: dumbbells, bench · muscles: hamstrings, glutes

An advanced hamstring session: heavy Romanian deadlifts, Nordic curls for eccentric strength, single-leg hinges, hamstring walkouts and a dumbbell hip thrust. Long rests, strict form.

אימון לירך האחורית למתקדמים: דדליפט רומני כבד, נורדיק קרל לכוח בירידה, ציר ירך על רגל אחת, הליכת עקבים בגשר והיפ טראסט עם משקולת. מנוחות ארוכות וטכניקה קפדנית.

- Dumbbell Romanian Deadlift: 4 x 6-8, rest 90 s
- Nordic Hamstring Curl: 3 x 5-6, rest 90 s
- Dumbbell Single-Leg Romanian Deadlift: 3 x 6-8, rest 75 s
- Hamstring Walkout: 3 x 6-8, rest 60 s
- Dumbbell Hip Thrust: 3 x 8-10, rest 75 s

### Kettlebell Hinge and Heel Walkout / ציר ירך עם קטלבל והליכת עקבים בגשר

`hamstrings_kettlebell_hinge_and_walkout` · intermediate · weights · home / park / gym · 41 min · 5 exercises, 16 sets · gear: kettlebell · muscles: hamstrings, glutes

Swings, deadlifts and cleans train the hips and hamstrings with the kettlebell; single-leg Romanian deadlifts and bridge walkouts add bodyweight hamstring work. Straight sets, moderate rest.

סווינג, דדליפט וקלין עם קטלבל לעבודה על הירכיים והירך האחורית, ואחריהם דדליפט רומני על רגל אחת והליכת עקבים החוצה בגשר. סטים רגילים עם מנוחה בינונית.

- Kettlebell Swing: 3 x 12-15, rest 60 s
- Kettlebell Deadlift: 4 x 8-10, rest 75 s
- Kettlebell Clean: 3 x 5-6, rest 60 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Hamstring Walkout: 3 x 6-10, rest 60 s

## Legs (רגליים) - 21 workouts

### Machine Leg Day / יום רגליים במכונות

`legs_gym_machine_legs_starter` · beginner · weights · gym · 30 min · 5 exercises, 12 sets · gear: leg_press_machine, leg_curl_machine, leg_extension_machine · muscles: glutes, quadriceps, hamstrings, calves

A beginner leg day on machines: leg press, leg curl and leg extension for quads and hamstrings, then a bridge and calf raises. Guided movements that are easy to learn.

יום רגליים למתחילים במכונות: לחיצת רגליים, כפיפת ברכיים ופשיטת ברכיים לארבע-ראשי ולירך האחורית, ואחריהן גשר ישבן והרמות עקבים. תנועות מונחות שקל ללמוד.

- Leg Press: 3 x 12-15, rest 75 s
- Lying Leg Curl: 3 x 12-15, rest 60 s
- Leg Extension: 2 x 12-15, rest 45 s
- Glute Bridge: 2 x 12-15, rest 45 s
- Standing Calf Raise: 2 x 15-20, rest 30 s

### Goblet, Hinge and Lunge Legs / רגליים: גובלט, ציר ירך ומכרעים

`legs_gym_goblet_hinge_legs` · beginner · weights · gym · 31 min · 5 exercises, 12 sets · gear: dumbbells, cable_machine · muscles: glutes, hamstrings, quadriceps, calves

A beginner leg session with free weights and a cable: goblet squat, dumbbell Romanian deadlift, cable pull-through, reverse lunges and calf raises. Two to three sets each.

אימון רגליים למתחילים עם משקולות וכבל: גובלט סקוואט, דדליפט רומני עם משקולות, פול ת׳רו בכבל, מכרע לאחור והרמות עקבים. שניים עד שלושה סטים לכל תרגיל.

- Goblet Squat: 3 x 10-12, rest 60 s
- Dumbbell Romanian Deadlift: 3 x 10-12, rest 60 s
- Cable Pull-Through: 2 x 12-15, rest 60 s
- Reverse Lunge: 2 x 8-10, rest 45 s
- Standing Calf Raise: 2 x 15-20, rest 30 s

### Squat and Romanian Deadlift Legs / רגליים: סקוואט ודדליפט רומני

`legs_gym_squat_rdl_day` · intermediate · weights · gym · 43 min · 5 exercises, 17 sets · gear: barbell, squat_rack, leg_press_machine, leg_curl_machine · muscles: glutes, quadriceps, hamstrings, calves

A balanced leg day: barbell squat for the quads, Romanian deadlift for the hamstrings and glutes, then leg press, leg curls and calf raises. Straight sets, moderate rest.

יום רגליים מאוזן: סקוואט עם מוט לארבע-ראשי, דדליפט רומני לירך האחורית ולישבן, ואחריהם לחיצת רגליים, כפיפת ברכיים והרמות עקבים. סטים רגילים ומנוחות בינוניות.

- Barbell Back Squat: 4 x 8-10, rest 90 s
- Romanian Deadlift: 3 x 8-10, rest 90 s
- Leg Press: 3 x 10-12, rest 75 s
- Lying Leg Curl: 3 x 10-12, rest 60 s
- Standing Calf Raise: 4 x 15-20, rest 45 s

### Single-Leg Strength Legs / רגליים: כוח על רגל אחת

`legs_gym_single_leg_strength` · intermediate · weights · gym · 45 min · 6 exercises, 18 sets · gear: dumbbells, cable_machine, leg_curl_machine · muscles: glutes, hamstrings, quadriceps, calves

A leg session that leans on one-leg work: reverse lunges, Bulgarian split squats and single-leg hinges, plus a cable pull-through, leg curls and single-leg calf raises. Each leg works on its own.

אימון רגליים שנשען על עבודה ברגל אחת: מכרע לאחור עם משקולות, סקוואט בולגרי ודדליפט רומני על רגל אחת, לצד פול ת׳רו בכבל, כפיפת ברכיים והרמות עקבים על רגל אחת. כל רגל עובדת בנפרד.

- Dumbbell Reverse Lunge: 3 x 8-10, rest 60 s
- Bulgarian Split Squat: 3 x 8-10, rest 60 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Cable Pull-Through: 3 x 12-15, rest 60 s
- Lying Leg Curl: 3 x 10-12, rest 60 s
- Single-Leg Calf Raise: 3 x 12-15, rest 30 s

### Box Jump and Smith Squat Legs / רגליים: קפיצות ארגז וסקוואט סמית׳

`legs_gym_jump_and_lift` · intermediate · weights · gym · 44 min · 6 exercises, 18 sets · gear: kettlebell, leg_curl_machine, smith_machine, plyo_box · muscles: glutes, quadriceps, hamstrings, calves

A leg day that starts with a few box jumps while fresh, then a Smith squat, kettlebell swings, leg curls, lunges and calf raises. Quick, athletic pace with moderate rest.

יום רגליים שמתחיל בכמה קפיצות ארגז כשהגוף רענן, ממשיך בסקוואט סמית׳, קטלבל סווינג, כפיפת ברכיים ומכרעים, ונגמר בהרמות עקבים. קצב אתלטי עם מנוחות בינוניות.

- Box Jump: 3 x 5-6, rest 60 s
- Smith Machine Squat: 4 x 8-10, rest 90 s
- Kettlebell Swing: 3 x 12-15, rest 60 s
- Lying Leg Curl: 3 x 10-12, rest 60 s
- Walking Lunge: 2 x 10-12, rest 60 s
- Standing Calf Raise: 3 x 15-20, rest 30 s

### Heavy Legs: Front Squat and Nordic / רגליים כבדות: סקוואט קדמי ונורדיק

`legs_gym_heavy_legs` · advanced · weights · gym · 53 min · 5 exercises, 17 sets · gear: barbell, dumbbells, squat_rack · muscles: glutes, hamstrings, quadriceps, calves

An advanced leg session: front squat and Romanian deadlift as the heavy lifts, then loaded lunges, Nordic curls and single-leg calf raises. Long rests, controlled reps.

אימון רגליים למתקדמים: סקוואט קדמי ודדליפט רומני כתרגילים הכבדים, ואחריהם מכרעים עם משקולות, נורדיק קרל והרמות עקבים על רגל אחת. מנוחות ארוכות וחזרות בשליטה.

- Front Squat: 4 x 5-6, rest 120 s
- Romanian Deadlift: 4 x 6-8, rest 120 s
- Dumbbell Reverse Lunge: 3 x 8-10, rest 75 s
- Nordic Hamstring Curl: 3 x 4-6, rest 120 s
- Single-Leg Calf Raise: 3 x 12-15, rest 45 s

### Squat, Hinge and Bridge Legs / רגליים: סקוואט, ציר ירך וגשר

`legs_bw_squat_hinge_bridge` · beginner · bodyweight · home / park / gym · 31 min · 5 exercises, 13 sets · gear: none · muscles: glutes, quadriceps, hamstrings, lower_back

A first full leg session built on squat, lunge, hinge and bridge patterns, with calf raises to finish. Straight sets, no equipment, easy to scale.

אימון רגליים ראשון המבוסס על תבניות של סקוואט, מכרע, ציר ירך וגשר, עם הרמות עקבים לסיום. סטים רגילים בלי ציוד, קל להתאים לרמה.

- Bodyweight Squat: 3 x 12-15, rest 45 s
- Reverse Lunge: 2 x 8-10, rest 60 s
- Bodyweight Good Morning: 3 x 10-12, rest 45 s
- Glute Bridge: 3 x 12-15, rest 45 s
- Standing Calf Raise: 2 x 15-20, rest 30 s

### Slow-Tempo Legs / רגליים בקצב איטי ומבוקר

`legs_bw_slow_tempo` · beginner · bodyweight · home / park / gym · 31 min · 5 exercises, 12 sets · gear: none · muscles: glutes, quadriceps, adductors, calves

A controlled-tempo leg session: pause squats, lateral lunges, balance reaches, frog pumps and slow calf raises. Slow reps and short pauses teach control; suits newcomers and a gradual return to training.

אימון רגליים בקצב מבוקר: סקוואט עם עצירה, מכרע צידי, הושטת רגל בשיווי משקל, גשר צפרדע והרמות עקבים איטיות. חזרות איטיות ועצירות קצרות מלמדות שליטה; מתאים למתחילים ולחזרה הדרגתית לאימונים.

- Pause Squat: 3 x 8-10, rest 60 s
- Lateral Lunge: 2 x 8-10, rest 60 s
- Single-Leg Balance Reach: 2 x 6-8, rest 45 s
- Frog Pump: 3 x 12-15, rest 45 s
- Standing Calf Raise: 2 x 12-15, rest 30 s

### Lunge, Cossack and Hinge Legs / רגליים: מכרעים, קוזאקי וציר ירך

`legs_bw_lunge_cossack_hinge` · intermediate · bodyweight · home / park / gym · 39 min · 5 exercises, 15 sets · gear: none · muscles: glutes, quadriceps, adductors, calves

Intermediate legs from several directions: walking lunges, Cossack squats, a single-leg hinge, single-leg bridges and single-leg calf raises. Straight sets with a single-leg emphasis; reps are per side.

רגליים ברמה בינונית מכמה כיוונים: מכרעים בהליכה, סקוואט קוזאקי, ציר ירך על רגל אחת, גשר על רגל אחת והרמות עקבים על רגל אחת. סטים רגילים עם דגש על רגל אחת; החזרות לכל צד.

- Walking Lunge: 3 x 10-12, rest 60 s
- Cossack Squat: 3 x 8-10, rest 60 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s
- Single-Leg Calf Raise: 3 x 12-15, rest 30 s

### Jumps and Bridge Finish Legs / רגליים: קפיצות וסיום בגשרים

`legs_bw_jumps_bridge_finish` · intermediate · bodyweight · home / park / gym · 37 min · 5 exercises, 15 sets · gear: none · muscles: glutes, quadriceps, hamstrings

Leg power first, then the posterior chain: jump squats and split squat jumps while fresh, followed by heel walkouts, single-leg hip thrusts and a wall sit. The jumps are noisy, so land softly.

קודם כוח ומהירות ברגליים ואחר כך השרשרת האחורית: סקוואט קפיצה וקפיצות ספליט כשהגוף רענן, ואחריהן הליכת עקבים בגשר, היפ טראסט על רגל אחת וכיסא על הקיר. הקפיצות רועשות, לכן לנחות בעדינות.

- Jump Squat: 3 x 8-10, rest 60 s
- Split Squat Jump: 3 x 6-8, rest 60 s
- Hamstring Walkout: 3 x 8-10, rest 60 s
- Single-Leg Hip Thrust: 3 x 10-12, rest 45 s
- Wall Sit: 3 x 45 s, rest 45 s

### Pistol, Nordic and Tuck-Jump Legs / רגליים: פיסטול, נורדיק וקפיצות ברכיים

`legs_bw_pistol_nordic_tuck` · advanced · bodyweight · home / park / gym · 51 min · 6 exercises, 19 sets · gear: none · muscles: glutes, quadriceps, adductors, calves

Advanced legs: tuck jumps, pistol squats, Cossack squats, single-leg hip thrusts, Nordic curls and single-leg calf raises. Demanding for the knees and ankles; only with a strong single-leg base and a full warm-up.

רגליים ברמה מתקדמת: קפיצות ברכיים לחזה, פיסטול סקוואט, סקוואט קוזאקי, היפ טראסט על רגל אחת, נורדיק קרל והרמות עקבים על רגל אחת. תובעני לברכיים ולקרסוליים; רק עם בסיס חזק על רגל אחת וחימום מלא.

- Tuck Jump: 3 x 5-6, rest 75 s
- Pistol Squat: 4 x 5-8, rest 90 s
- Cossack Squat: 3 x 8-10, rest 60 s
- Single-Leg Hip Thrust: 3 x 10-12, rest 60 s
- Nordic Hamstring Curl: 3 x 5-8, rest 90 s
- Single-Leg Calf Raise: 3 x 12-15, rest 30 s

### Dumbbell Leg Basics / יסודות רגליים עם משקולות יד

`legs_dumbbell_leg_basics` · beginner · weights · gym / home / park · 30 min · 5 exercises, 12 sets · gear: dumbbells · muscles: glutes, quadriceps, hamstrings, calves

A first full leg session: goblet squat, Romanian deadlift, reverse lunges, a glute bridge and calf raises. It covers squat, hinge and lunge patterns with light loads and no bench.

אימון רגליים מלא ראשון: גובלט סקוואט, דדליפט רומני, מכרעים לאחור, גשר ישבן והרמות עקבים. מכסה את תבניות הסקוואט, ציר הירך והמכרעים עם משקלים קלים וללא ספסל.

- Goblet Squat: 3 x 10-12, rest 60 s
- Dumbbell Romanian Deadlift: 3 x 10-12, rest 60 s
- Reverse Lunge: 2 x 8-10, rest 45 s
- Glute Bridge: 2 x 12-15, rest 45 s
- Dumbbell Calf Raise: 2 x 12-15, rest 30 s

### Bench Thrust and Side Lunge Legs / רגליים: היפ טראסט ומכרע צידי

`legs_dumbbell_bench_side_lunge` · beginner · weights · gym / home / park · 31 min · 5 exercises, 12 sets · gear: dumbbells, bench · muscles: glutes, adductors, quadriceps, calves

A beginner leg session with a bench: sumo squats and hip thrusts with dumbbells, side lunges, a single-leg balance reach and calf raises. Works the legs from the front, the back and the inner thigh.

אימון רגליים למתחילים עם ספסל: סקוואט סומו והיפ טראסט עם משקולות, מכרעים לצדדים, הושטת רגל בשיווי משקל והרמות עקבים. עובד על הרגליים מקדימה, מאחור ומהירך הפנימית.

- Dumbbell Sumo Squat: 3 x 10-12, rest 60 s
- Dumbbell Hip Thrust: 3 x 10-12, rest 60 s
- Lateral Lunge: 2 x 8-10, rest 45 s
- Single-Leg Balance Reach: 2 x 8-10, rest 45 s
- Dumbbell Calf Raise: 2 x 12-15, rest 30 s

### Complete Dumbbell Leg Day / יום רגליים מלא במשקולות יד

`legs_dumbbell_complete_day` · intermediate · weights · gym / home / park · 42 min · 5 exercises, 17 sets · gear: dumbbells · muscles: glutes, quadriceps, hamstrings, calves

A full intermediate leg day with no bench: goblet squats and Romanian deadlifts first, then walking lunges, single-leg bridges and high-rep calf raises. Straight sets, 30-75 s rest.

יום רגליים מלא לרמה בינונית וללא ספסל: קודם גובלט סקוואט ודדליפט רומני, ואחריהם מכרעים בהליכה, גשר ישבן על רגל אחת והרמות עקבים בחזרות גבוהות. סטים רגילים, מנוחות של 30-75 שניות.

- Goblet Squat: 4 x 10-12, rest 75 s
- Dumbbell Romanian Deadlift: 4 x 8-10, rest 75 s
- Dumbbell Walking Lunge: 3 x 8-10, rest 60 s
- Single-Leg Glute Bridge: 3 x 10-12, rest 45 s
- Dumbbell Calf Raise: 3 x 15-20, rest 30 s

### Lunges in Every Direction / מכרעים בכל הכיוונים

`legs_dumbbell_multi_direction_lunges` · intermediate · weights · gym / home / park · 39 min · 5 exercises, 16 sets · gear: dumbbells · muscles: glutes, quadriceps, adductors, calves

Intermediate legs built on lunges in different directions: reverse lunge with dumbbells, a single-leg hinge, then side and curtsy lunges with body weight, and calf raises to finish.

רגליים לרמה בינונית שבנויות על מכרעים בכיוונים שונים: מכרע לאחור עם משקולות, ציר ירך על רגל אחת, ואחריהם מכרעים לצדדים ומכרעי קורטסי במשקל גוף, ובסיום הרמות עקבים.

- Dumbbell Reverse Lunge: 4 x 8-10, rest 60 s
- Dumbbell Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Lateral Lunge: 3 x 8-10, rest 45 s
- Curtsy Lunge: 3 x 10-12, rest 45 s
- Dumbbell Calf Raise: 3 x 12-15, rest 30 s

### Heavy Front Squat Legs / רגליים כבדות עם סקוואט קדמי

`legs_dumbbell_heavy_front_squat` · advanced · weights · gym / home / park · 48 min · 5 exercises, 19 sets · gear: dumbbells · muscles: glutes, quadriceps, calves, hamstrings

An advanced leg day: heavy dumbbell front squats and Romanian deadlifts, loaded step-ups, sissy squats for the quads and calf raises to finish. Long rests, strict form.

יום רגליים למתקדמים: סקוואט קדמי ודדליפט רומני כבדים עם משקולות, עליות על מדרגה עם עומס, סיסי סקוואט לארבע-ראשי ובסיום הרמות עקבים. מנוחות ארוכות וטכניקה קפדנית.

- Dumbbell Front Squat: 5 x 6-8, rest 90 s
- Dumbbell Romanian Deadlift: 4 x 6-8, rest 90 s
- Dumbbell Step-Up: 3 x 6-8, rest 75 s
- Sissy Squat: 3 x 6-10, rest 60 s
- Dumbbell Calf Raise: 4 x 10-12, rest 45 s

### Bench Leg Basics / יסודות רגליים עם ספסל

`legs_park_bench_leg_basics` · beginner · bodyweight · park / home / gym · 33 min · 5 exercises, 14 sets · gear: none · muscles: glutes, quadriceps, hamstrings, lower_back

Sit-to-stand squats, step-ups, a hip hinge, hip thrusts from the bench and calf raises. Controlled bodyweight work for quads, glutes and hamstrings, three sets at most.

סקוואט לספסל, עליות לספסל, גוד מורנינג, היפ טראסט מהספסל והרמות עקבים. עבודה מבוקרת במשקל הגוף לארבע ראשי, לישבן ולירך האחורית, עד שלושה סטים.

- Box Squat (Sit-to-Stand): 3 x 10-12, rest 60 s
- Step-Up: 3 x 8-10, rest 60 s
- Bodyweight Good Morning: 3 x 10-12, rest 45 s
- Bodyweight Hip Thrust: 3 x 10-15, rest 45 s
- Standing Calf Raise: 2 x 12-15, rest 30 s

### Single-Leg Bench and Stairs / רגליים על רגל אחת: ספסל ומדרגות

`legs_park_single_leg_bench_stairs` · intermediate · bodyweight · park / home / gym · 39 min · 5 exercises, 17 sets · gear: none · muscles: glutes, quadriceps, calves, hamstrings

Bulgarian split squats, single-leg hip thrusts from the bench and stair runs for the legs, finished with hamstring walkouts and single-leg calf raises. Mostly one leg at a time.

סקוואט בולגרי, היפ טראסט על רגל אחת מהספסל וריצה במדרגות לרגליים, ובסיום הליכת עקבים בגשר והרמות עקבים על רגל אחת. רוב העבודה על רגל אחת בכל פעם.

- Bulgarian Split Squat: 4 x 8-10, rest 60 s
- Stair Run: 4 x 30 s, rest 60 s
- Single-Leg Hip Thrust: 3 x 8-12, rest 45 s
- Hamstring Walkout: 3 x 8-12, rest 45 s
- Single-Leg Calf Raise: 3 x 10-15, rest 30 s

### Sprints and Pistol Squats / ספרינטים ופיסטול סקוואט

`legs_park_sprints_pistol_strength` · advanced · bodyweight · park · 47 min · 5 exercises, 18 sets · gear: none · muscles: glutes, quadriceps, hamstrings, adductors

Short sprints while fresh, then pistol squats, single-leg deadlifts, Cossack squats and calf raises. Heavy on one-leg strength and balance; end a set when form breaks.

ספרינטים קצרים כשהגוף רענן, ואחריהם פיסטול סקוואט, דדליפט רומני על רגל אחת, סקוואט קוזאקי והרמות עקבים. דגש על כוח ושיווי משקל ברגל אחת; לסיים סט כשהטכניקה נשברת.

- Sprint Intervals: 5 x 15 s, rest 90 s
- Pistol Squat: 4 x 5-6, rest 90 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Cossack Squat: 3 x 6-8, rest 60 s
- Single-Leg Calf Raise: 3 x 10-15, rest 30 s

### Single-Leg Strength with Bands / כוח ברגל אחת עם גומייה

`legs_bands_single_leg_strength` · advanced · weights · home / park / gym · 53 min · 6 exercises, 21 sets · gear: resistance_bands · muscles: glutes, quadriceps, hamstrings

Shrimp squats for heavy single-leg work and Nordic curls for the hamstrings, backed by band squats, single-leg Romanian deadlifts, band bridges and lateral walks. Suits people with a solid squat and hinge.

שרימפ סקוואט לעבודה כבדה על רגל אחת ונורדיק קרל לירך האחורית, ולצדם סקוואט עם גומייה, דדליפט רומני על רגל אחת, גשר ישבן והליכות צידיות. מתאים כשיש בסיס כוח טוב בסקוואט ובציר ירך.

- Shrimp Squat: 4 x 5-8, rest 90 s
- Band-Resisted Squat: 4 x 12-20, rest 60 s
- Nordic Hamstring Curl: 3 x 4-6, rest 90 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Band Glute Bridge: 4 x 12-15, rest 45 s
- Banded Lateral Walk: 3 x 12-15, rest 45 s

### Kettlebell Squat, Deadlift and Lunge / סקוואט, דדליפט ומכרעים עם קטלבל

`legs_kettlebell_squat_deadlift_lunge` · intermediate · weights · home / park / gym · 44 min · 6 exercises, 18 sets · gear: kettlebell · muscles: glutes, quadriceps, hamstrings, calves

A lower-body session built on one kettlebell: goblet squat, deadlift and swings, with split squats, lateral lunges and calf raises so each leg works on its own. Straight sets, moderate rest.

אימון רגליים סביב קטלבל אחד: גובלט סקוואט, דדליפט וסווינג, יחד עם סקוואט בולגרי, מכרע צידי והרמות עקבים שעובדים על כל רגל בנפרד. סטים רגילים עם מנוחה בינונית.

- Kettlebell Goblet Squat: 4 x 10-12, rest 75 s
- Bulgarian Split Squat: 3 x 8-10, rest 60 s
- Kettlebell Deadlift: 3 x 10-12, rest 60 s
- Kettlebell Swing: 3 x 12-15, rest 60 s
- Lateral Lunge: 2 x 8-10, rest 45 s
- Single-Leg Calf Raise: 3 x 12-15, rest 30 s

## Upper body (פלג גוף עליון) - 17 workouts

### Upper Body Push-Pull Basics / יסודות לפלג גוף עליון

`upper_body_gym_push_pull_basics` · beginner · weights · gym · 39 min · 6 exercises, 16 sets · gear: dumbbells, cable_machine, lat_pulldown_machine, chest_press_machine · muscles: lats, triceps, chest, shoulders

A beginner upper-body session that alternates pushing and pulling: machine chest press, lat pulldown, dumbbell shoulder press and cable row, with a triceps and biceps finisher.

אימון פלג גוף עליון למתחילים שמחליף בין דחיפה למשיכה: לחיצת חזה במכונה, פולי עליון, לחיצת כתפיים וחתירה בכבל, עם סיום לתלת-ראשי ולדו-ראשי.

- Machine Chest Press: 3 x 10-12, rest 60 s
- Lat Pulldown: 3 x 10-12, rest 60 s
- Dumbbell Shoulder Press: 3 x 10-12, rest 75 s
- Seated Cable Row: 3 x 10-12, rest 60 s
- Triceps Pushdown: 2 x 12-15, rest 45 s
- Dumbbell Curl: 2 x 12-15, rest 45 s

### Barbell Push-Pull Strength / כוח דחיפה ומשיכה במוט

`upper_body_gym_barbell_push_pull` · intermediate · weights · gym · 50 min · 6 exercises, 20 sets · gear: barbell, dumbbells, bench, cable_machine, lat_pulldown_machine · muscles: lats, triceps, chest, upper_back

Intermediate upper-body session built on a barbell bench press and a barbell row, backed by a dumbbell shoulder press, a lat pulldown and triceps and biceps work. Straight sets.

אימון פלג גוף עליון בינוני שנשען על לחיצת חזה וחתירה במוט, עם לחיצת כתפיים, פולי עליון ועבודה לתלת-ראשי ולדו-ראשי. סטים רגילים.

- Barbell Bench Press: 4 x 6-10, rest 90 s
- Barbell Bent-Over Row: 4 x 6-10, rest 90 s
- Dumbbell Shoulder Press: 3 x 8-12, rest 75 s
- Lat Pulldown: 3 x 10-12, rest 75 s
- Triceps Pushdown: 3 x 12-15, rest 45 s
- Cable Biceps Curl: 3 x 12-15, rest 45 s

### Dips, Chins and Cables / מקבילים, מתח וכבלים

`upper_body_gym_dips_chins_cables` · intermediate · weights · gym · 41 min · 6 exercises, 18 sets · gear: dumbbells, bench, cable_machine, pull_up_bar, dip_bars · muscles: chest, lats, upper_back, biceps

Intermediate upper-body session with shorter rests: dips and chin-ups first, then an incline dumbbell press, cable row, cable lateral raises and face pulls. Pushing and pulling stay balanced.

אימון פלג גוף עליון בינוני עם מנוחות קצרות יותר: מקבילים ועליות מתח בהתחלה, ואחריהם לחיצה בשיפוע חיובי, חתירה בכבל, הרחקות בכבל ופייס פול. איזון בין דחיפה למשיכה.

- Parallel Bar Dip: 3 x 8-12, rest 60 s
- Chin-Up: 3 x 6-10, rest 60 s
- Incline Dumbbell Press: 3 x 8-12, rest 60 s
- Seated Cable Row: 3 x 10-12, rest 45 s
- Cable Lateral Raise: 3 x 12-15, rest 45 s
- Face Pull: 3 x 12-15, rest 45 s

### Heavy Barbell Upper Body / פלג גוף עליון כבד עם מוט

`upper_body_gym_heavy_barbell_archer` · advanced · weights · gym · 59 min · 5 exercises, 20 sets · gear: barbell, bench, cable_machine, pull_up_bar · muscles: lats, chest, upper_back, biceps

Advanced upper-body session: heavy barbell bench press and rows, chin-ups, archer push-ups for one-sided pressing strength and face pulls to balance the shoulders. Long rests on the main lifts.

אימון פלג גוף עליון למתקדמים: לחיצת חזה וחתירה כבדות במוט, עליות מתח באחיזה הפוכה, שכיבות סמיכה קשת לכוח לחיצה חד-צדדי ופייס פול לאיזון הכתפיים. מנוחות ארוכות בתרגילים המרכזיים.

- Barbell Bench Press: 5 x 5-8, rest 120 s
- Barbell Bent-Over Row: 5 x 5-8, rest 120 s
- Chin-Up: 4 x 6-10, rest 90 s
- Archer Push-Up: 3 x 5-8, rest 90 s
- Face Pull: 3 x 12-15, rest 45 s

### Muscle-up Skill and Strength / מאסל-אפ וכוח לפלג גוף עליון

`upper_body_gym_muscle_up_strength` · advanced · weights · gym · 56 min · 6 exercises, 21 sets · gear: barbell, dumbbells, bench, cable_machine, lat_pulldown_machine, pull_up_bar · muscles: lats, upper_back, triceps, chest

Advanced upper-body session that starts with muscle-up practice while fresh, then an incline barbell press, cable row, Arnold press, lat pulldown and cable pushdowns. Pushing and pulling stay balanced.

אימון פלג גוף עליון למתקדמים שפותח בתרגול מאסל-אפ כשהגוף רענן, וממשיך בלחיצה בשיפוע חיובי במוט, חתירה בכבל, לחיצת ארנולד, פולי עליון ופשיטה בפולי עליון. איזון בין דחיפה למשיכה.

- Muscle-Up: 4 x 2-4, rest 120 s
- Incline Barbell Bench Press: 4 x 6-8, rest 90 s
- Seated Cable Row: 4 x 8-10, rest 90 s
- Arnold Press: 3 x 8-10, rest 90 s
- Lat Pulldown: 3 x 10-12, rest 60 s
- Triceps Pushdown: 3 x 12-15, rest 45 s

### Floor Push and Pull / דחיפה ומשיכה על הרצפה

`upper_body_bw_floor_push_pull` · beginner · bodyweight · home / park / gym · 36 min · 6 exercises, 15 sets · gear: none · muscles: upper_back, rear_delts, chest, abs

A balanced no-equipment upper-body session that alternates pushing and pulling: incline and close-grip push-ups with back raises and a scapular push-up, ending with a bird dog. Three sets or fewer.

אימון פלג גוף עליון מאוזן בלי ציוד, בסירוגין בין דחיפה למשיכה: שכיבות סמיכה בידיים מוגבהות ובאחיזה צרה עם הרמות לגב ושכיבת סמיכה לשכמות, ובסיום בירד דוג. עד שלושה סטים.

- Incline Push-Up: 3 x 8-12, rest 60 s
- Reverse Snow Angel: 3 x 8-10, rest 45 s
- Close-Grip Push-Up: 2 x 6-10, rest 60 s
- Prone T Raise: 3 x 10-12, rest 45 s
- Scapular Push-Up: 2 x 8-12, rest 45 s
- Bird Dog: 2 x 6-8, rest 45 s

### Balanced Push-Pull Builder / בניית דחיפה ומשיכה מאוזנת

`upper_body_bw_balanced_push_pull` · intermediate · bodyweight · home / park / gym · 45 min · 6 exercises, 20 sets · gear: none · muscles: upper_back, chest, rear_delts, abs

Equal volume for pushing and pulling, so the chest and shoulders get as much attention as the upper back: decline and pike push-ups, a shoulder-tap push-up and three prone raises. Straight sets, no equipment.

נפח זהה לדחיפה ולמשיכה, כך שהחזה והכתפיים מקבלים אותו יחס כמו הגב העליון: שכיבות סמיכה ברגליים מוגבהות ופייק, שכיבת סמיכה עם נגיעה בכתף ושלוש הרמות בשכיבה על הבטן. סטים רגילים, בלי ציוד.

- Decline Push-Up: 4 x 8-12, rest 75 s
- Pike Push-Up: 3 x 6-10, rest 75 s
- Reverse Snow Angel: 4 x 10-12, rest 45 s
- Push-Up with Shoulder Tap: 3 x 10-16, rest 60 s
- Prone Y Raise: 3 x 10-12, rest 45 s
- Prone Swimmer: 3 x 12-16, rest 45 s

### Dumbbell Push-Pull Basics / יסודות דחיפה ומשיכה במשקולות

`upper_body_dumbbell_push_pull_basics` · beginner · weights · gym / home / park · 32 min · 5 exercises, 13 sets · gear: dumbbells · muscles: triceps, upper_back, chest, lats

A balanced beginner upper-body session: floor press and shoulder press for pushing, bent-over rows and a rear-delt fly for pulling, plus a prone Y raise for the upper back. No bench needed.

אימון פלג גוף עליון מאוזן למתחילים: לחיצה מהרצפה ולחיצת כתפיים לדחיפה, חתירה בהטיית גו ופרפר הפוך למשיכה, והרמת Y בשכיבה על הבטן לגב העליון. בלי ספסל.

- Dumbbell Floor Press: 3 x 10-12, rest 60 s
- Bent-Over Dumbbell Row: 3 x 10-12, rest 60 s
- Dumbbell Shoulder Press: 3 x 10-12, rest 60 s
- Dumbbell Rear Delt Fly: 2 x 12-15, rest 45 s
- Prone Y Raise: 2 x 10-12, rest 30 s

### Alternating Push and Pull / דחיפה ומשיכה לסירוגין

`upper_body_dumbbell_alternating_push_pull` · intermediate · weights · gym / home / park · 47 min · 6 exercises, 20 sets · gear: dumbbells, bench · muscles: upper_back, chest, biceps, forearms

Push and pull alternate through the session: incline press, chest-supported row, Arnold press and one-arm row, finished with skull crushers and hammer curls. 3-4 sets of 8-12 reps. Needs a bench.

דחיפה ומשיכה מתחלפות לאורך האימון: לחיצה בשיפוע חיובי, חתירה בתמיכת חזה, לחיצת ארנולד וחתירה חד-ידית, ובסיום סקאל קראשר ופטישים. 3-4 סטים של 8-12 חזרות. דורש ספסל.

- Incline Dumbbell Press: 4 x 8-12, rest 75 s
- Chest-Supported Dumbbell Row: 4 x 8-12, rest 75 s
- Arnold Press: 3 x 8-10, rest 60 s
- One-Arm Dumbbell Row: 3 x 8-12, rest 60 s
- Dumbbell Skull Crusher: 3 x 10-12, rest 45 s
- Hammer Curl: 3 x 10-12, rest 45 s

### Standing Press and Renegade Row / לחיצה בעמידה וחתירת רנגייד

`upper_body_dumbbell_push_press_renegade` · intermediate · weights · gym / home / park · 47 min · 6 exercises, 19 sets · gear: dumbbells, bench · muscles: chest, lats, shoulders, triceps

Compound upper-body strength: a standing push press, renegade rows, decline push-ups and chest-supported rows, then a pullover and a rear-delt fly. The core stays braced throughout. Needs a bench.

כוח מורכב לפלג גוף עליון: פוש פרס בעמידה, חתירת רנגייד, שכיבות סמיכה ברגליים מוגבהות וחתירה בתמיכת חזה, ואז פולאובר ופרפר הפוך. הליבה נשארת פעילה לאורך כל האימון. דורש ספסל.

- Dumbbell Push Press: 4 x 8-10, rest 75 s
- Renegade Row: 3 x 6-10, rest 75 s
- Decline Push-Up: 3 x 10-15, rest 60 s
- Chest-Supported Dumbbell Row: 3 x 8-12, rest 75 s
- Dumbbell Pullover: 3 x 10-12, rest 60 s
- Dumbbell Rear Delt Fly: 3 x 12-15, rest 45 s

### Power and Strength Upper Body / כוח והתפרצות לפלג גוף עליון

`upper_body_dumbbell_clap_heavy` · advanced · weights · gym / home / park · 57 min · 6 exercises, 20 sets · gear: dumbbells, bench · muscles: chest, lats, upper_back, triceps

Advanced upper-body day: clap push-ups while fresh, then a heavy bench press, bent-over rows, shoulder press and one-arm rows, finished with skull crushers. Long rests on the heavy lifts. Needs a bench.

יום פלג גוף עליון למתקדמים: שכיבות סמיכה עם מחיאת כף כשהגוף רענן, ואחר כך לחיצת חזה כבדה, חתירה בהטיית גו, לחיצת כתפיים וחתירה חד-ידית, ובסיום סקאל קראשר. מנוחה ארוכה בתרגילים הכבדים. דורש ספסל.

- Clap Push-Up: 3 x 4-6, rest 90 s
- Dumbbell Bench Press: 4 x 6-8, rest 105 s
- Bent-Over Dumbbell Row: 4 x 6-8, rest 105 s
- Dumbbell Shoulder Press: 3 x 6-8, rest 90 s
- One-Arm Dumbbell Row: 3 x 8-10, rest 75 s
- Dumbbell Skull Crusher: 3 x 8-10, rest 60 s

### Hang, Row and Push Basics / יסודות תלייה, מתח אוסטרלי ושכיבות סמיכה

`upper_body_park_hang_row_push_basics` · beginner · bodyweight · park / gym · 33 min · 5 exercises, 14 sets · gear: pull_up_bar, dip_bars · muscles: lats, upper_back, chest, forearms

Push-ups, bar rows and scapular pull-ups, a scapular push-up for shoulder control and a dead hang to finish. A gentle way to learn the basic pushing and pulling patterns.

שכיבות סמיכה, מתח אוסטרלי ומשיכות שכמות בתלייה, שכיבת סמיכה לשכמות לשליטה בכתף ותלייה על המוט לסיום. דרך עדינה ללמוד את דפוסי הדחיפה והמשיכה הבסיסיים.

- Push-Up: 3 x 6-10, rest 60 s
- Inverted Row: 3 x 8-10, rest 60 s
- Scapular Pull-Up: 3 x 6-8, rest 60 s
- Scapular Push-Up: 2 x 10-12, rest 45 s
- Dead Hang: 3 x 20 s, rest 45 s

### Chin-Ups with Decline and Pike Push-Ups / מתח באחיזה הפוכה עם שכיבות בשיפוע ופייק

`upper_body_park_chin_decline_pike` · intermediate · bodyweight · park / gym · 39 min · 5 exercises, 17 sets · gear: pull_up_bar, dip_bars · muscles: lats, upper_back, biceps, chest

Chin-ups and bar rows for the back and biceps, with decline and pike push-ups that change the angle for chest and shoulders, and a prone T raise for the rear shoulders. Straight sets, moderate rest.

מתח באחיזה הפוכה ומתח אוסטרלי לגב ולדו ראשי, עם שכיבות סמיכה בשיפוע ושכיבות פייק שמשנות את זווית העבודה לחזה ולכתפיים, והרמת T על הבטן לכתפיים האחוריות. סטים רגילים, מנוחה בינונית.

- Chin-Up: 4 x 5-8, rest 75 s
- Decline Push-Up: 4 x 8-12, rest 60 s
- Inverted Row: 3 x 10-12, rest 45 s
- Pike Push-Up: 3 x 6-10, rest 60 s
- Prone T Raise: 3 x 10-12, rest 30 s

### Dips and Wide Pull-Ups / מקבילים ומתח באחיזה רחבה

`upper_body_park_dips_wide_pull_ups` · intermediate · bodyweight · park / gym · 40 min · 5 exercises, 16 sets · gear: pull_up_bar, dip_bars · muscles: lats, chest, triceps, shoulders

Wide-grip pull-ups and chest dips as the main work, with Hindu push-ups for shoulder mobility and strength and bar rows. Finishes with a dead hang for grip and a relaxed stretch of the shoulders.

עליות מתח באחיזה רחבה ומקבילים לחזה כעבודה מרכזית, עם שכיבות סמיכה הינדיות לניידות וכוח בכתפיים ומתח אוסטרלי. מסתיים בתלייה על המוט לאחיזה ולמתיחה רגועה של הכתפיים.

- Wide-Grip Pull-Up: 4 x 5-8, rest 90 s
- Chest Dip: 4 x 6-10, rest 90 s
- Hindu Push-Up: 3 x 8-12, rest 45 s
- Inverted Row: 3 x 10-12, rest 45 s
- Dead Hang: 2 x 30 s, rest 45 s

### Archer Pull-Ups and Push-Ups / עליות מתח ושכיבות סמיכה קשת (ארצ׳ר)

`upper_body_park_archer_strength` · advanced · bodyweight · park / gym · 46 min · 5 exercises, 17 sets · gear: pull_up_bar, dip_bars · muscles: chest, lats, biceps, traps

Archer pull-ups and archer push-ups shift most of the load onto one arm at a time, backed by dips, chin-ups and a prone Y raise for the shoulder blades. For an advanced level; end each set before form breaks.

עליות מתח ושכיבות סמיכה קשת (ארצ׳ר) מעבירות את רוב העומס לזרוע אחת בכל פעם, בתוספת מקבילים, מתח באחיזה הפוכה והרמת Y על הבטן לשכמות. מתאים לרמה מתקדמת; לסיים כל סט לפני שהטכניקה נשברת.

- Archer Pull-Up: 4 x 4-6, rest 90 s
- Archer Push-Up: 4 x 5-8, rest 90 s
- Parallel Bar Dip: 3 x 8-12, rest 75 s
- Chin-Up: 3 x 5-8, rest 75 s
- Prone Y Raise: 3 x 10-12, rest 30 s

### Pull-up and Band Press Combo / שילוב מתח ולחיצות עם גומייה

`upper_body_bands_pull_up_and_press` · intermediate · weights · home / park / gym · 43 min · 6 exercises, 18 sets · gear: pull_up_bar, resistance_bands · muscles: upper_back, lats, chest, shoulders

Pull-ups and push-ups first, then band rows, an overhead press, a fly and pull-aparts. Pushing and pulling stay balanced. Needs a pull-up bar and a resistance band.

מתח ושכיבות סמיכה בהתחלה, ואחריהם חתירה, לחיצת כתפיים, פרפר ופתיחות עם גומייה. דחיפה ומשיכה נשארות מאוזנות. נדרשים מוט מתח וגומייה.

- Pull-Up: 4 x 5-8, rest 90 s
- Push-Up: 3 x 12-20, rest 60 s
- Resistance Band Row: 3 x 12-15, rest 60 s
- Band Overhead Press: 3 x 10-12, rest 60 s
- Resistance Band Chest Fly: 3 x 12-15, rest 45 s
- Band Pull-Apart: 2 x 15-20, rest 30 s

### Kettlebell Press, Chin-up and Row / לחיצת קטלבל, מתח וחתירה

`upper_body_kettlebell_press_chin_up_row` · intermediate · weights · home / park / gym · 45 min · 6 exercises, 18 sets · gear: kettlebell, pull_up_bar, resistance_bands · muscles: lats, upper_back, triceps, biceps

Chin-ups and a kettlebell press lead, followed by decline push-ups, a one-arm band row, a face pull and a triceps extension. Pushing and pulling stay balanced. Needs a kettlebell, a band and a pull-up bar.

מתח באחיזה הפוכה ולחיצת קטלבל פותחים, ואחריהם שכיבות סמיכה ברגליים מוגבהות, חתירה ביד אחת, פייס פול ופשיטת מרפקים עם גומייה. דחיפה ומשיכה נשארות מאוזנות. נדרשים קטלבל, גומייה ומוט מתח.

- Chin-Up: 4 x 5-8, rest 90 s
- Kettlebell Overhead Press: 3 x 6-8, rest 75 s
- Decline Push-Up: 3 x 10-15, rest 60 s
- Single-Arm Resistance Band Row: 3 x 10-12, rest 45 s
- Resistance Band Face Pull: 3 x 12-15, rest 45 s
- Band Triceps Extension: 2 x 12-15, rest 30 s

## Full body (כל הגוף) - 31 workouts

### Machine Full Body / כל הגוף על מכונות

`full_body_gym_machine_basics` · beginner · weights · gym · 33 min · 5 exercises, 14 sets · gear: lat_pulldown_machine, leg_press_machine, leg_curl_machine, chest_press_machine · muscles: abs, chest, glutes, lats

Fixed-path machines for legs, chest, back and hamstrings, then a plank for the core. Straight sets on stable equipment make it a calm, controlled way to start in the gym.

מכונות עם מסלול קבוע לרגליים, לחזה, לגב ולירך האחורית, ובסיום פלאנק לליבה. סטים רגילים על ציוד יציב הם דרך רגועה ומבוקרת להתחיל בחדר הכושר.

- Leg Press: 3 x 10-12, rest 60 s
- Machine Chest Press: 3 x 10-12, rest 60 s
- Lat Pulldown: 3 x 10-12, rest 60 s
- Lying Leg Curl: 2 x 12-15, rest 45 s
- Plank: 3 x 30 s, rest 45 s

### Dumbbell and Cable Basics / יסודות במשקולות יד ובכבלים

`full_body_gym_dumbbell_cable_basics` · beginner · weights · gym · 33 min · 5 exercises, 13 sets · gear: dumbbells, bench, cable_machine · muscles: glutes, chest, lats, quadriceps

Dumbbells and a cable for the whole body: goblet squat, chest press, row, Romanian deadlift and an anti-rotation core move. Three sets at most with moderate reps to learn the patterns with free weights.

משקולות יד וכבל לכל הגוף: גובלט סקוואט, לחיצת חזה, חתירה, דדליפט רומני ותרגיל ליבה נגד סיבוב. עד שלושה סטים ומספר חזרות בינוני כדי ללמוד את תבניות התנועה עם משקולות חופשיות.

- Goblet Squat: 3 x 10-12, rest 60 s
- Dumbbell Bench Press: 3 x 10-12, rest 60 s
- Seated Cable Row: 3 x 10-12, rest 60 s
- Dumbbell Romanian Deadlift: 2 x 10-12, rest 60 s
- Pallof Press: 2 x 10-12, rest 45 s

### Smith Machine Foundations / יסודות עם מכונת סמית׳

`full_body_gym_smith_foundation` · beginner · weights · gym · 36 min · 5 exercises, 13 sets · gear: dumbbells, bench, cable_machine, smith_machine · muscles: glutes, chest, lats, quadriceps

A fixed bar path on the Smith machine for squat and bench press, then a one-arm dumbbell row, a cable hip hinge and a dead bug. Easy to adjust and a controlled way to practise the basic patterns.

מסלול מוט קבוע במכונת סמית׳ לסקוואט וללחיצת חזה, ואחריהם חתירה חד-ידית, פול ת׳רו בכבל ודד באג. קל לכוונון ודרך מבוקרת לתרגל את תבניות התנועה הבסיסיות.

- Smith Machine Squat: 3 x 10-12, rest 75 s
- Smith Machine Bench Press: 3 x 10-12, rest 75 s
- One-Arm Dumbbell Row: 3 x 10-12, rest 60 s
- Cable Pull-Through: 2 x 12-15, rest 60 s
- Dead Bug: 2 x 8-10, rest 45 s

### Barbell Essentials / יסודות המוט

`full_body_gym_barbell_essentials` · intermediate · weights · gym · 43 min · 5 exercises, 16 sets · gear: barbell, squat_rack, bench, pull_up_bar · muscles: glutes, quadriceps, abs, chest

A classic barbell session: squat, bench press, bent-over row and overhead press for the whole body, then hanging knee raises. Three to four sets of 8-10 reps with 75-90 seconds of rest; suits lifters who already know the lifts.

אימון קלאסי עם מוט: סקוואט, לחיצת חזה, חתירה בהטיה ולחיצת כתפיים לכל הגוף, ובסוף הרמות ברכיים בתלייה. שלושה עד ארבעה סטים של 8–10 חזרות עם מנוחות של 75–90 שניות. מתאים למי שכבר מכיר את התרגילים.

- Barbell Back Squat: 4 x 8-10, rest 90 s
- Barbell Bench Press: 3 x 8-10, rest 90 s
- Barbell Bent-Over Row: 3 x 8-10, rest 75 s
- Barbell Overhead Press: 3 x 8-10, rest 75 s
- Hanging Knee Raise: 3 x 10-15, rest 60 s

### Hinge and Lunge Day / יום ציר ירך ומכרעים

`full_body_gym_hinge_lunge` · intermediate · weights · gym · 48 min · 6 exercises, 19 sets · gear: barbell, dumbbells, bench, cable_machine, lat_pulldown_machine · muscles: glutes, hamstrings, abs, chest

Built around the Romanian deadlift and reverse lunges for the legs and hips, with an incline press, a pulldown and two core moves. Straight sets of 8-12 reps with the heaviest work first.

בנוי סביב דדליפט רומני ומכרעים לאחור לרגליים ולאגן, עם לחיצה בשיפוע חיובי, פולי עליון ושני תרגילי ליבה. סטים של 8–12 חזרות, כשהעבודה הכבדה ביותר ראשונה.

- Romanian Deadlift: 4 x 8-10, rest 90 s
- Incline Dumbbell Press: 3 x 8-12, rest 75 s
- Lat Pulldown: 3 x 8-12, rest 75 s
- Dumbbell Reverse Lunge: 3 x 8-10, rest 60 s
- Cable Woodchop: 3 x 10-12, rest 45 s
- Plank: 3 x 45 s, rest 45 s

### Fast-Pace Full Body / כל הגוף בקצב מהיר

`full_body_gym_fast_pace` · intermediate · weights · gym · 45 min · 7 exercises, 22 sets · gear: dumbbells, kettlebell, cable_machine, lat_pulldown_machine, leg_press_machine, chest_press_machine, pull_up_bar · muscles: glutes, lats, hamstrings, abs

Seven exercises with 10-15 reps and only 45 seconds of rest keep the pace up: kettlebell swing and leg press for the legs, a chest press and an Arnold press, two pulls, and hanging knee raises for the core. Moderate weights.

שבעה תרגילים עם 10–15 חזרות ו־45 שניות מנוחה בלבד שומרים על קצב גבוה: קטלבל סווינג ולחיצת רגליים לרגליים, לחיצת חזה ולחיצת ארנולד, שתי משיכות והרמות ברכיים בתלייה לליבה. משקלים בינוניים.

- Kettlebell Swing: 4 x 12-15, rest 45 s
- Leg Press: 3 x 12-15, rest 45 s
- Machine Chest Press: 3 x 12-15, rest 45 s
- Lat Pulldown: 3 x 10-12, rest 45 s
- Arnold Press: 3 x 10-12, rest 45 s
- Seated Cable Row: 3 x 10-12, rest 45 s
- Hanging Knee Raise: 3 x 12-15, rest 45 s

### Front Squat Strength Day / יום כוח עם סקוואט קדמי

`full_body_gym_front_squat_strength` · advanced · weights · gym · 53 min · 5 exercises, 18 sets · gear: barbell, squat_rack, bench, pull_up_bar · muscles: glutes, chest, lats, quadriceps

Heavy full-body strength for experienced lifters: front squat, incline barbell press, pull-ups, Romanian deadlift and hanging leg raises. Four sets of 6-10 reps on the big lifts with 90-120 seconds of rest; end every set short of failure.

אימון כוח כבד לכל הגוף למתאמנים מנוסים: סקוואט קדמי, לחיצת חזה בשיפוע חיובי במוט, עליות מתח, דדליפט רומני והרמות רגליים בתלייה. ארבעה סטים של 6–10 חזרות בתרגילים הגדולים ומנוחות של 90–120 שניות; לסיים כל סט לפני כישלון.

- Front Squat: 4 x 6-8, rest 120 s
- Incline Barbell Bench Press: 4 x 6-8, rest 120 s
- Pull-Up: 4 x 6-10, rest 90 s
- Romanian Deadlift: 3 x 8-10, rest 90 s
- Hanging Leg Raise: 3 x 8-12, rest 60 s

### Deadlift, Dips and Pull-Ups / דדליפט, מקבילים ועליות מתח

`full_body_gym_deadlift_dips_pulls` · advanced · weights · gym · 57 min · 6 exercises, 22 sets · gear: barbell, dumbbells, cable_machine, pull_up_bar, dip_bars · muscles: glutes, abs, biceps, chest

A strength session built on the deadlift, with parallel-bar dips, chin-ups, dumbbell reverse lunges, cable face pulls and an L-sit hold. Long rests on the heavy work; for lifters with a solid base in lifting and bar work.

אימון כוח סביב דדליפט, עם מקבילים, עליות מתח באחיזה הפוכה, מכרעים לאחור עם משקולות יד, פייס פול בכבל והחזקת אל-סיט. מנוחות ארוכות בעבודה הכבדה; למתאמנים עם בסיס מוצק בהרמות ובעבודה על מתח ומקבילים.

- Deadlift: 4 x 5-6, rest 120 s
- Parallel Bar Dip: 4 x 8-12, rest 90 s
- Chin-Up: 4 x 6-10, rest 90 s
- Dumbbell Reverse Lunge: 3 x 8-10, rest 75 s
- Face Pull: 3 x 12-15, rest 45 s
- L-Sit: 4 x 20 s, rest 60 s

### Full Body Starter / התחלה לכל הגוף

`full_body_bodyweight_starter` · beginner · bodyweight · home / park / gym · 33 min · 5 exercises, 14 sets · gear: none · muscles: glutes, chest, quadriceps, rear_delts

A first full-body session: squat, incline push-up, glute bridge, a reverse snow angel and a dead bug. Easy exercises, three sets or fewer and 45 to 60 seconds of rest, to learn the basic patterns.

אימון ראשון לכל הגוף: סקוואט, שכיבות סמיכה בידיים מוגבהות, גשר ישבן, מלאך שלג הפוך ודד באג. תרגילים קלים, עד שלושה סטים ומנוחה של 45 עד 60 שניות, ללימוד דפוסי התנועה הבסיסיים.

- Bodyweight Squat: 3 x 10-12, rest 60 s
- Incline Push-Up: 3 x 8-12, rest 60 s
- Glute Bridge: 3 x 10-15, rest 45 s
- Reverse Snow Angel: 3 x 8-12, rest 45 s
- Dead Bug: 2 x 6-8, rest 45 s

### Quiet Full Body Flow / זרימה שקטה לכל הגוף

`full_body_bodyweight_quiet_flow` · beginner · bodyweight · home / park / gym · 34 min · 5 exercises, 15 sets · gear: none · muscles: abs, chest, glutes, hamstrings

A low-impact full-body session with no jumping, suited to apartments: reverse lunges, knee push-ups, a prone Y raise, good mornings and a high plank. Slow tempo, easy on the joints.

אימון שקט ונטול קפיצות לכל הגוף, מתאים לדירה: מכרע לאחור, שכיבות סמיכה על הברכיים, הרמת Y בשכיבה, גוד מורנינג ופלאנק גבוה. קצב איטי ועדין למפרקים.

- Reverse Lunge: 3 x 6-8, rest 60 s
- Knee Push-Up: 3 x 8-12, rest 60 s
- Prone Y Raise: 3 x 8-12, rest 45 s
- Bodyweight Good Morning: 3 x 10-12, rest 45 s
- High Plank: 3 x 25 s, rest 45 s

### Squat, Push, Pull Basics / סקוואט, דחיפה ומשיכה

`full_body_bodyweight_squat_push_pull` · beginner · bodyweight · home / park / gym · 32 min · 5 exercises, 14 sets · gear: none · muscles: glutes, abs, adductors, chest

Simple building blocks for the whole body: sumo squats, push-ups, a prone swimmer, a single-leg balance reach and mountain climbers. Moderate pace with 45 to 60 seconds rest.

אבני בניין פשוטות לכל הגוף: סקוואט סומו, שכיבות סמיכה, שחיין בשכיבה, הושטת רגל על רגל אחת ומטפס הרים. קצב בינוני עם 45 עד 60 שניות מנוחה.

- Bodyweight Sumo Squat: 3 x 10-12, rest 60 s
- Push-Up: 3 x 6-10, rest 60 s
- Prone Swimmer: 3 x 8-10, rest 45 s
- Single-Leg Balance Reach: 2 x 6-8, rest 45 s
- Mountain Climber: 3 x 20 s, rest 45 s

### Straight-Set Bodyweight Strength / כוח במשקל גוף בסטים רגילים

`full_body_bodyweight_straight_sets` · intermediate · bodyweight · home / park / gym · 38 min · 5 exercises, 15 sets · gear: none · muscles: glutes, abs, chest, hamstrings

Straight-set strength with harder single-leg and push variations: Bulgarian split squats, decline push-ups, single-leg Romanian deadlifts, a prone Y raise and a hollow hold.

אימון כוח בסטים רגילים עם וריאציות קשות יותר של רגל אחת ודחיפה: סקוואט בולגרי, שכיבות סמיכה ברגליים מוגבהות, דדליפט רומני על רגל אחת, הרמת Y והחזקת הולו.

- Bulgarian Split Squat: 3 x 8-10, rest 75 s
- Decline Push-Up: 3 x 8-12, rest 75 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Prone Y Raise: 3 x 12-15, rest 45 s
- Hollow Body Hold: 3 x 30 s, rest 45 s

### Dynamic Full Body Mix / מיקס דינמי לכל הגוף

`full_body_bodyweight_dynamic_mix` · intermediate · bodyweight · home / park / gym · 36 min · 5 exercises, 15 sets · gear: none · muscles: chest, glutes, quadriceps, abs

A faster full-body mix with some jumping: burpees, split squat jumps, Hindu push-ups, a prone swimmer and mountain climbers. Rest is 45 to 60 seconds; swap jumps for steps if the joints complain.

מיקס מהיר יותר לכל הגוף עם קצת קפיצות: ברפי, קפיצות ספליט, שכיבות סמיכה הינדיות, שחיין בשכיבה ומטפס הרים. מנוחה של 45 עד 60 שניות; אם המפרקים מתלוננים, להחליף קפיצות בצעדים.

- Burpee: 3 x 8-12, rest 60 s
- Split Squat Jump: 3 x 6-8, rest 60 s
- Hindu Push-Up: 3 x 8-12, rest 60 s
- Prone Swimmer: 3 x 12-16, rest 45 s
- Mountain Climber: 3 x 40 s, rest 45 s

### One-Sided Strength / כוח חד-צדדי

`full_body_bodyweight_one_sided` · intermediate · bodyweight · home / park / gym · 38 min · 5 exercises, 15 sets · gear: none · muscles: glutes, adductors, obliques, quadriceps

Single-leg and shoulder-focused full-body work: Cossack squats, pike push-ups, single-leg hip thrusts, a reverse snow angel and side plank hip dips. Makes left and right differences easy to notice.

עבודה חד-צדדית ועבודת כתפיים לכל הגוף: סקוואט קוזאקי, שכיבות סמיכה פייק, היפ טראסט על רגל אחת, מלאך שלג הפוך ופלאנק צידי עם הורדת אגן. מאפשר להבחין בהבדלים בין ימין לשמאל.

- Cossack Squat: 3 x 6-8, rest 60 s
- Pike Push-Up: 3 x 8-12, rest 60 s
- Single-Leg Hip Thrust: 3 x 8-12, rest 60 s
- Reverse Snow Angel: 3 x 12-15, rest 45 s
- Side Plank Hip Dip: 3 x 8-12, rest 45 s

### Advanced Bodyweight Strength / כוח מתקדם במשקל גוף

`full_body_bodyweight_advanced_strength` · advanced · bodyweight · home / park / gym · 49 min · 5 exercises, 18 sets · gear: none · muscles: abs, chest, glutes, quadriceps

Hard bodyweight skills in straight sets with long rest: pistol squats, archer push-ups, Nordic curls, a prone Y raise and a hollow hold. Use a wall or a pole for balance on pistols.

מיומנויות קשות במשקל גוף בסטים רגילים עם מנוחה ארוכה: פיסטול סקוואט, שכיבות סמיכה ארצ׳ר, נורדיק קרל, הרמת Y והחזקת הולו. בפיסטול אפשר להיעזר בקיר או בעמוד לשיווי משקל.

- Pistol Squat: 4 x 3-5, rest 90 s
- Archer Push-Up: 4 x 4-6, rest 90 s
- Nordic Hamstring Curl: 3 x 4-6, rest 90 s
- Prone Y Raise: 3 x 12-15, rest 45 s
- Hollow Body Hold: 4 x 45 s, rest 60 s

### Explosive Full Body / פיצוץ לכל הגוף

`full_body_bodyweight_explosive` · advanced · bodyweight · home / park / gym · 45 min · 5 exercises, 17 sets · gear: none · muscles: glutes, quadriceps, chest, abs

Power work for trained people: clap push-ups, tuck jumps and shrimp squats with full rest, then a prone T raise and hollow rocks. Quality over quantity; stop a set when the height drops.

עבודת כוח מתפרץ למתאמנים: שכיבות סמיכה עם מחיאה, קפיצות טאק ושרימפ סקוואט עם מנוחה מלאה, ואז הרמת T בשכיבה והולו רוק. איכות לפני כמות; להפסיק סט כשהגובה יורד.

- Clap Push-Up: 4 x 5-8, rest 90 s
- Tuck Jump: 4 x 6-8, rest 75 s
- Shrimp Squat: 3 x 3-5, rest 90 s
- Prone T Raise: 3 x 12-15, rest 45 s
- Hollow Rock: 3 x 12-18, rest 60 s

### Dumbbell Starter, No Bench / התחלה עם משקולות יד, בלי ספסל

`full_body_dumbbell_starter_no_bench` · beginner · weights · gym / home / park · 38 min · 6 exercises, 15 sets · gear: dumbbells · muscles: glutes, triceps, chest, lats

A first full-body session with one pair of dumbbells and a floor. A squat, a floor press, a row, a hinge, an overhead press and a dead bug, all in straight sets with easy rest.

אימון גוף מלא ראשון עם זוג משקולות יד ורצפה בלבד: סקוואט, לחיצת רצפה, חתירה, כפיפת ירך, לחיצה מעל הראש ודד באג. סטים רגילים עם מנוחה נוחה.

- Goblet Squat: 3 x 10-12, rest 60 s
- Dumbbell Floor Press: 3 x 10-12, rest 60 s
- Bent-Over Dumbbell Row: 3 x 10-12, rest 60 s
- Dumbbell Romanian Deadlift: 2 x 10-12, rest 60 s
- Dumbbell Shoulder Press: 2 x 10-12, rest 60 s
- Dead Bug: 2 x 8-10, rest 45 s

### Bench and Dumbbell Basics / יסודות עם ספסל ומשקולות

`full_body_dumbbell_bench_basics` · beginner · weights · gym / home / park · 34 min · 5 exercises, 14 sets · gear: dumbbells, bench · muscles: glutes, adductors, chest, quadriceps

A beginner full-body session that uses a bench: a wide-stance squat, a bench press, a chest-supported row, a hip thrust and a short plank. Three sets or fewer, steady pace.

אימון גוף מלא למתחילים עם ספסל: סקוואט רחב, לחיצת חזה על ספסל, חתירה עם תמיכה בחזה, דחיפת ירכיים ופלאנק קצר. עד שלושה סטים, בקצב יציב.

- Dumbbell Sumo Squat: 3 x 10-12, rest 60 s
- Dumbbell Bench Press: 3 x 10-12, rest 60 s
- Chest-Supported Dumbbell Row: 3 x 10-12, rest 60 s
- Dumbbell Hip Thrust: 3 x 12-15, rest 60 s
- Plank: 2 x 30 s, rest 45 s

### Front Squat and Renegade Row / סקוואט קדמי וחתירת רנגייד

`full_body_dumbbell_push_pull_squat` · intermediate · weights · gym / home / park · 43 min · 5 exercises, 16 sets · gear: dumbbells · muscles: glutes, quadriceps, abs, hamstrings

An intermediate full-body session built on a front squat, a push press and a renegade row, with a single-leg hinge and a side plank dip to finish. Straight sets with moderate rest.

אימון גוף מלא בינוני סביב סקוואט קדמי, לחיצת דחיפה וחתירת רנגייד, עם כפיפת ירך על רגל אחת ופלאנק צידי עם הורדת אגן לסיום. סטים רגילים עם מנוחה בינונית.

- Dumbbell Front Squat: 4 x 8-10, rest 75 s
- Dumbbell Push Press: 3 x 8-10, rest 75 s
- Renegade Row: 3 x 6-8, rest 75 s
- Dumbbell Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Side Plank Hip Dip: 3 x 10-12, rest 45 s

### Lunge, Arnold and Row Mix / שילוב לאנג׳, ארנולד וחתירה

`full_body_dumbbell_lunge_arnold_row` · intermediate · weights · gym / home / park · 43 min · 6 exercises, 18 sets · gear: dumbbells, bench · muscles: abs, chest, glutes, hamstrings

An intermediate full-body mix: walking lunges, an Arnold press, a one-arm row on a bench, good mornings, shoulder-tap push-ups and hollow rocks. Three sets each, brisk rest.

שילוב גוף מלא בינוני: לאנג׳ הליכה, לחיצת ארנולד, חתירה ביד אחת על ספסל, גוד מורנינג, שכיבות סמיכה עם נגיעת כתף והולו רוק. שלושה סטים לכל תרגיל, מנוחה קצרה.

- Dumbbell Walking Lunge: 3 x 10-12, rest 60 s
- Arnold Press: 3 x 8-12, rest 60 s
- One-Arm Dumbbell Row: 3 x 10-12, rest 60 s
- Dumbbell Good Morning: 3 x 10-12, rest 60 s
- Push-Up with Shoulder Tap: 3 x 10-14, rest 45 s
- Hollow Rock: 3 x 10-15, rest 45 s

### Clean, Split Squat and Suitcase Carry / קלין, סקוואט בולגרי והליכת מזוודה

`full_body_dumbbell_clean_split_squat_carry` · intermediate · weights · gym / home / park · 44 min · 5 exercises, 16 sets · gear: dumbbells, bench · muscles: glutes, hamstrings, shoulders, chest

An intermediate full-body session that starts with dumbbell cleans, then Bulgarian split squats, rows and incline presses, and ends with a one-sided suitcase carry. Needs a bench and floor space.

אימון גוף מלא בינוני שפותח בקלין ולחיצה עם משקולות, ממשיך בסקוואט בולגרי מפוצל, חתירה ולחיצה בשיפוע חיובי, ומסתיים בהליכת מזוודה על צד אחד. דורש ספסל ומקום פנוי.

- Dumbbell Clean and Press: 4 x 6-8, rest 90 s
- Dumbbell Bulgarian Split Squat: 3 x 8-10, rest 75 s
- Bent-Over Dumbbell Row: 3 x 10-12, rest 60 s
- Incline Dumbbell Press: 3 x 8-12, rest 60 s
- Suitcase Carry: 3 x 40 s, rest 60 s

### Man Maker Strength Day / יום כוח עם מן מייקר

`full_body_dumbbell_man_maker_strength` · advanced · weights · gym / home / park · 60 min · 6 exercises, 21 sets · gear: dumbbells · muscles: quadriceps, abs, chest, glutes

An advanced full-body session: man makers while fresh, heavy front squats, renegade rows, archer push-ups, single-leg hinges and floor wipers. Longer rest between demanding sets.

אימון גוף מלא מתקדם: מן מייקר בתחילת האימון, סקוואט קדמי כבד, חתירת רנגייד, שכיבות סמיכה קשת, כפיפת ירך על רגל אחת ומגבי שמשה בשכיבה. מנוחה ארוכה בין סטים תובעניים.

- Dumbbell Man Maker: 4 x 5-6, rest 105 s
- Dumbbell Front Squat: 4 x 6-8, rest 90 s
- Renegade Row: 4 x 6-8, rest 90 s
- Archer Push-Up: 3 x 5-8, rest 75 s
- Dumbbell Single-Leg Romanian Deadlift: 3 x 6-8, rest 75 s
- Floor Windshield Wiper: 3 x 6-10, rest 60 s

### Bench and Row Starter / התחלה עם ספסל ומתח אוסטרלי

`full_body_park_bench_bar_basics` · beginner · bodyweight · park / gym · 34 min · 5 exercises, 14 sets · gear: dip_bars · muscles: abs, chest, glutes, lats

A first park session for the whole body: step-ups and a hip hinge for the legs, incline push-ups, bar rows and a plank. Straight sets, three at most, with about a minute of rest.

אימון ראשון בפארק לכל הגוף: עליות לספסל וגוד מורנינג לרגליים, שכיבות סמיכה בידיים מוגבהות, מתח אוסטרלי ופלאנק. סטים רגילים, עד שלושה, עם כדקה של מנוחה.

- Step-Up: 3 x 8-10, rest 60 s
- Incline Push-Up: 3 x 8-12, rest 60 s
- Inverted Row: 3 x 8-10, rest 60 s
- Bodyweight Good Morning: 2 x 10-15, rest 45 s
- Plank: 3 x 25 s, rest 45 s

### Road to the First Pull-Up / הדרך למתח הראשון

`full_body_park_first_pull_up_path` · beginner · bodyweight · park / home / gym · 33 min · 5 exercises, 14 sets · gear: bench, pull_up_bar · muscles: abs, glutes, hip_flexors, lats

Lunges, bench dips and mountain climbers around slow negative pull-ups, a steady way to build towards a first full pull-up. Three sets at most, calm tempo and generous rest.

מכרעים, מקבילים על ספסל ומטפס הרים לצד עליות מתח שליליות איטיות, דרך יציבה לבנות כוח לקראת מתח מלא ראשון. עד שלושה סטים, קצב רגוע ומנוחה נדיבה.

- Walking Lunge: 3 x 8-10, rest 60 s
- Negative Pull-Up: 3 x 3-5, rest 75 s
- Bench Dip: 3 x 8-10, rest 60 s
- Mountain Climber: 3 x 20 s, rest 30 s
- Side Plank: 2 x 20 s, rest 30 s

### Pull, Dip and Single-Leg Strength / כוח: מתח, מקבילים ורגל אחת

`full_body_park_pull_dip_single_leg` · intermediate · bodyweight · park / gym · 46 min · 5 exercises, 17 sets · gear: pull_up_bar, dip_bars · muscles: glutes, chest, lats, triceps

Straight sets built on pull-ups and dips, with Bulgarian split squats and single-leg deadlifts for the legs and hanging knee raises for the core. The heaviest bodyweight work comes first.

סטים רגילים סביב עליות מתח ומקבילים, עם סקוואט בולגרי ודדליפט רומני על רגל אחת לרגליים והרמות ברכיים בתלייה לליבה. העבודה הקשה ביותר במשקל הגוף באה ראשונה.

- Pull-Up: 4 x 5-8, rest 90 s
- Parallel Bar Dip: 4 x 6-10, rest 90 s
- Bulgarian Split Squat: 3 x 8-10, rest 75 s
- Single-Leg Romanian Deadlift: 3 x 8-10, rest 60 s
- Hanging Knee Raise: 3 x 10-15, rest 45 s

### Chin-Ups and Burpees Mix / שילוב מתח באחיזה הפוכה וברפי

`full_body_park_chin_up_burpee_mix` · intermediate · bodyweight · park / home / gym · 41 min · 6 exercises, 19 sets · gear: pull_up_bar · muscles: quadriceps, abs, chest, glutes

Chin-ups and decline push-ups for strength, then jump squats and burpees to raise the pace, and bear crawls and V-ups to finish. Short rests keep the session moving.

מתח באחיזה הפוכה ושכיבות סמיכה ברגליים מוגבהות לכוח, אחר כך סקוואט קפיצה וברפי להעלאת הקצב, ובסיום זחילת דוב והרמות V. מנוחות קצרות שומרות על קצב רציף.

- Chin-Up: 4 x 5-8, rest 75 s
- Decline Push-Up: 3 x 10-12, rest 60 s
- Jump Squat: 3 x 10-12, rest 45 s
- Burpee: 3 x 8-10, rest 45 s
- Bear Crawl: 3 x 30 s, rest 30 s
- V-Up: 3 x 10-12, rest 40 s

### Stairs and Bars Mix / שילוב מדרגות ומתח

`full_body_park_stairs_and_bars` · intermediate · bodyweight · park / home / gym · 39 min · 5 exercises, 16 sets · gear: pull_up_bar · muscles: glutes, quadriceps, calves, abs

Pull-ups and push-ups for the upper body, Cossack squats and stair runs for the legs, and hanging oblique knee raises for the core. A varied mix at a steady pace with moderate rests.

עליות מתח ושכיבות סמיכה לפלג הגוף העליון, סקוואט קוזאקי וריצה במדרגות לרגליים, והרמות ברכיים לצד בתלייה לליבה. שילוב מגוון בקצב יציב ועם מנוחות בינוניות.

- Pull-Up: 3 x 5-8, rest 75 s
- Push-Up: 3 x 12-18, rest 60 s
- Cossack Squat: 3 x 6-8, rest 45 s
- Stair Run: 4 x 30 s, rest 60 s
- Hanging Oblique Knee Raise: 3 x 6-10, rest 45 s

### Explosive Calisthenics / קליסטניקס מתפרץ

`full_body_park_explosive_calisthenics` · advanced · bodyweight · park / home / gym · 49 min · 5 exercises, 18 sets · gear: pull_up_bar · muscles: glutes, quadriceps, chest, lats

Broad jumps and clap push-ups while fresh, then wide-grip pull-ups, shrimp squats and toes to bar. Suits an advanced level with a solid base in pull-ups, push-ups and single-leg strength.

קפיצות לרוחק ושכיבות סמיכה עם מחיאת כף כשהגוף רענן, ואחר כך עליות מתח באחיזה רחבה, שרימפ סקוואט ורגליים למוט. מתאים לרמה מתקדמת עם בסיס טוב בכוח משיכה, דחיפה ורגל אחת.

- Broad Jump: 4 x 4-6, rest 75 s
- Clap Push-Up: 4 x 5-6, rest 75 s
- Wide-Grip Pull-Up: 4 x 5-8, rest 90 s
- Shrimp Squat: 3 x 5-6, rest 90 s
- Toes to Bar: 3 x 5-8, rest 75 s

### Full-Body Band Circuit / מעגל גוף מלא עם גומייה

`full_body_bands_circuit` · beginner · weights · home / park / gym · 37 min · 6 exercises, 17 sets · gear: resistance_bands · muscles: glutes, upper_back, chest, lats

A simple full-body session with one resistance band: squat, press, row, bridge, face pull and dead bug. Short rests keep it moving, and no other gear is needed.

אימון גוף מלא פשוט עם גומייה אחת: סקוואט, לחיצה, חתירה, גשר ישבן, פייס פול ודד באג. מנוחות קצרות שומרות על קצב, ואין צורך בציוד נוסף.

- Band-Resisted Squat: 3 x 12-15, rest 45 s
- Resistance Band Chest Press: 3 x 12-15, rest 45 s
- Resistance Band Row: 3 x 12-15, rest 45 s
- Band Glute Bridge: 3 x 12-15, rest 45 s
- Resistance Band Face Pull: 3 x 12-15, rest 45 s
- Dead Bug: 2 x 8-10, rest 45 s

### Kettlebell Full-Body Foundations / יסודות קטלבל לכל הגוף

`full_body_kettlebell_foundations` · beginner · weights · home / park / gym · 32 min · 5 exercises, 14 sets · gear: kettlebell, resistance_bands · muscles: glutes, chest, hamstrings, lats

A first full-body kettlebell session: goblet squat and deadlift, incline push-ups, band rows and a short plank. Needs one kettlebell and one resistance band.

אימון כל הגוף ראשון עם קטלבל: גובלט סקוואט ודדליפט, שכיבות סמיכה בידיים מוגבהות, חתירה עם גומייה ופלאנק קצר. נדרשים קטלבל אחד וגומייה אחת.

- Kettlebell Goblet Squat: 3 x 10-12, rest 60 s
- Incline Push-Up: 3 x 8-12, rest 45 s
- Kettlebell Deadlift: 3 x 10-12, rest 60 s
- Resistance Band Row: 3 x 12-15, rest 45 s
- Plank: 2 x 30 s, rest 30 s

### Kettlebell Clean, Press and Pull-up / קלין, לחיצה ומתח עם קטלבל

`full_body_kettlebell_clean_press_pull` · advanced · weights · home / park / gym · 57 min · 6 exercises, 21 sets · gear: kettlebell, pull_up_bar · muscles: glutes, hamstrings, lats, shoulders

A strength-focused full-body session: kettlebell clean and press, pistol squats, pull-ups and swings, finished with hanging leg raises. Suits people confident with the clean and press who can do pull-ups.

אימון כל הגוף ממוקד כוח: קלין ולחיצה עם קטלבל, פיסטול סקוואט, מתח וסווינג, ובסיום הרמות רגליים בתלייה. מתאים כשיש ביטחון בקלין ובלחיצה ויכולת לבצע מתח.

- Kettlebell Clean: 4 x 5-6, rest 75 s
- Kettlebell Overhead Press: 4 x 5-8, rest 90 s
- Pistol Squat: 3 x 4-6, rest 75 s
- Pull-Up: 4 x 5-8, rest 90 s
- Kettlebell Swing: 3 x 12-15, rest 60 s
- Hanging Leg Raise: 3 x 8-12, rest 60 s

## Cardio (קרדיו) - 18 workouts

### Easy Machine Intervals / אינטרוולים קלים על מכשיר

`cardio_gym_easy_machine_intervals` · beginner · bodyweight · gym · 38 min · 6 exercises, 18 sets · gear: cardio_machine · muscles: glutes, quadriceps, abs, calves

Three one-minute efforts on a cardio machine of your choice with an easy minute between, then jumping jacks, squats, mountain climbers and a plank, finishing with a walk or easy jog. A pace where short sentences are still possible.

שלושה מאמצים של דקה על מכשיר אירובי לבחירה עם דקה קלה ביניהם, אחר כך קפיצות פיסוק, סקוואט, מטפס הרים ופלאנק, ובסיום הליכה או ריצה קלה. קצב שעדיין מאפשר לדבר במשפטים קצרים.

- Cardio Machine Intervals: 3 x 60 s, rest 60 s
- Jumping Jack: 3 x 30 s, rest 45 s
- Bodyweight Squat: 3 x 12-15, rest 45 s
- Mountain Climber: 3 x 30 s, rest 45 s
- Plank: 3 x 30 s, rest 45 s
- Brisk Walk / Jog: 3 x 60 s, rest 30 s

### Machine, Box and Rope Intervals / אינטרוולים: מכשיר, ארגז וחבל

`cardio_gym_machine_box_rope` · intermediate · bodyweight · gym · 45 min · 6 exercises, 20 sets · gear: pull_up_bar, plyo_box, jump_rope, cardio_machine · muscles: glutes, quadriceps, abs, hip_flexors

Box jumps first, while the legs are fresh, then four 90-second efforts on a cardio machine, burpees, mountain climbers and jump rope in short work blocks, closed with hanging knee raises. High-impact: for people used to jumping.

קפיצות על ארגז בהתחלה, כשהרגליים רעננות, אחר כך ארבעה מאמצים של 90 שניות על מכשיר אירובי, ברפי, מטפס הרים וקפיצה בחבל בבלוקי עבודה קצרים, ובסיום הרמות ברכיים בתלייה. עומס גבוה על המפרקים: מתאים למי שרגיל לקפוץ.

- Box Jump: 3 x 6-8, rest 60 s
- Cardio Machine Intervals: 4 x 90 s, rest 60 s
- Burpee: 3 x 8-10, rest 60 s
- Mountain Climber: 3 x 40 s, rest 30 s
- Jump Rope: 4 x 40 s, rest 30 s
- Hanging Knee Raise: 3 x 10-15, rest 45 s

### Quiet Low-Impact Cardio / קרדיו שקט בלי קפיצות

`cardio_home_quiet_low_impact` · beginner · bodyweight · home / park / gym · 30 min · 6 exercises, 17 sets · gear: none · muscles: shoulders, glutes, quadriceps, abs

Steady cardio with no jumping and little noise, built for small apartments. Straight sets of timed work with short rests. Suits beginners.

קרדיו רציף בלי קפיצות ובלי הרבה רעש, מתאים לדירה קטנה. סטים של עבודה בזמן עם מנוחות קצרות. מתאים למתחילים.

- High March in Place: 3 x 40 s, rest 20 s
- Step Jack: 3 x 40 s, rest 20 s
- Shadow Boxing: 3 x 45 s, rest 20 s
- Defensive Slide: 3 x 30 s, rest 30 s
- Butt Kicks: 3 x 30 s, rest 20 s
- Inchworm: 2 x 6-8, rest 45 s

### Walk-Jog Intervals / מרווחי הליכה וריצה קלה

`cardio_home_walk_jog_intervals` · beginner · bodyweight · home / park / gym · 30 min · 6 exercises, 17 sets · gear: none · muscles: quadriceps, calves, hip_flexors, glutes

Easy-paced intervals that alternate a brisk walk or jog with simple moves like jacks and shuffles. Straight sets, 30 seconds of rest. A first step into cardio.

מרווחים בקצב נוח: הליכה מהירה או ריצה קלה לסירוגין עם תנועות פשוטות כמו קפיצות פיסוק והזזות צד. סטים רציפים עם 30 שניות מנוחה. צעד ראשון בקרדיו.

- Brisk Walk / Jog: 3 x 60 s, rest 30 s
- Jumping Jack: 3 x 30 s, rest 30 s
- High Knees: 3 x 20 s, rest 30 s
- Lateral Shuffle: 3 x 30 s, rest 30 s
- A-Skip (Running Form Drill): 2 x 20 s, rest 30 s
- Mountain Climber: 3 x 20 s, rest 30 s

### Jump Rope Starter Circuit / מעגל פתיחה עם חבל קפיצה

`cardio_home_rope_starter` · beginner · bodyweight · home / park / gym · 28 min · 5 exercises, 15 sets · gear: jump_rope · muscles: calves, shoulders, glutes, hamstrings

Introduces the jump rope between easy bodyweight cardio moves. Straight sets, 30-45 seconds of rest. Suits beginners who want to learn the rhythm.

היכרות עם חבל הקפיצה בין תרגילי קרדיו קלים במשקל הגוף. סטים רציפים עם 30 עד 45 שניות מנוחה. מתאים למתחילים שרוצים ללמוד את הקצב.

- Jump Rope: 3 x 45 s, rest 45 s
- Jumping Jack: 3 x 30 s, rest 30 s
- High March in Place: 3 x 40 s, rest 20 s
- Butt Kicks: 3 x 30 s, rest 30 s
- Step Jack: 3 x 40 s, rest 30 s

### Bodyweight Tabata / טבטה במשקל הגוף

`cardio_home_tabata_classic` · intermediate · bodyweight · home / park / gym · 24 min · 6 exercises, 24 sets · gear: none · muscles: abs, quadriceps, hip_flexors, shoulders

Tabata-style rounds: 20 seconds of hard work and 10 seconds of rest, four rounds per move across six moves. For people with a base of fitness.

סבבים בסגנון טבטה: 20 שניות עבודה אינטנסיבית ו-10 שניות מנוחה, ארבעה סבבים לכל תרגיל בשישה תרגילים. מתאים למי שיש לו בסיס כושר.

- High Knees: 4 x 20 s, rest 10 s
- Plank Jumping Jack: 4 x 20 s, rest 10 s
- Lateral Shuffle: 4 x 20 s, rest 10 s
- Mountain Climber: 4 x 20 s, rest 10 s
- Pogo Hop (Ankle Hops): 4 x 20 s, rest 10 s
- Bear Crawl: 4 x 20 s, rest 10 s

### Every-Minute Cardio / קרדיו בכל דקה

`cardio_home_emom_minute` · intermediate · bodyweight · home / park / gym · 40 min · 6 exercises, 24 sets · gear: none · muscles: quadriceps, glutes, abs, hip_flexors

EMOM-style: each set starts on the minute, so the faster you finish the reps the longer you rest. Four sets of six full-body conditioning moves.

בסגנון EMOM: כל סט מתחיל בתחילת דקה, ככל שמסיימים את החזרות מהר יותר המנוחה ארוכה יותר. ארבעה סטים בשישה תרגילי קונדישנינג לכל הגוף.

- Burpee: 4 x 8-10, rest 30 s
- Jump Squat: 4 x 12-15, rest 30 s
- Squat Thrust: 4 x 10-12, rest 30 s
- Lateral Bound: 4 x 10-12, rest 30 s
- High Knees: 4 x 40 s, rest 20 s
- Mountain Climber: 4 x 40 s, rest 20 s

### Conditioning Rounds / סבבי קונדישנינג

`cardio_home_amrap_rounds` · intermediate · bodyweight · home / park / gym · 36 min · 6 exercises, 18 sets · gear: none · muscles: quadriceps, abs, glutes, shoulders

Three hard rounds of six conditioning moves with short rests, aiming for a steady pace rather than a sprint. Mixes jumps, crawling and floor work.

שלושה סבבים תובעניים של שישה תרגילי קונדישנינג עם מנוחות קצרות, בקצב יציב ולא בספרינט. משלב קפיצות, זחילה ועבודה על הרצפה.

- Burpee: 3 x 10-12, rest 45 s
- Split Squat Jump: 3 x 8-10, rest 45 s
- Sprawl: 3 x 8-10, rest 45 s
- Bear Crawl: 3 x 30 s, rest 30 s
- Plank Jumping Jack: 3 x 30 s, rest 30 s
- Jumping Jack: 3 x 45 s, rest 30 s

### Footwork Agility Cardio / קרדיו זריזות ועבודת רגליים

`cardio_home_footwork_agility` · intermediate · bodyweight · home / park / gym · 43 min · 7 exercises, 25 sets · gear: none · muscles: glutes, quadriceps, adductors, abs

Side-to-side steps, hops and quick direction changes that raise the heart rate while training coordination. Straight sets with moderate rests.

צעדי צד, דילוגים ושינויי כיוון מהירים שמעלים דופק ומאמנים קואורדינציה. סטים רציפים עם מנוחות בינוניות.

- Lateral Shuffle: 4 x 40 s, rest 20 s
- Carioca (Grapevine): 4 x 40 s, rest 20 s
- Defensive Slide: 4 x 30 s, rest 30 s
- Single-Leg Hop and Stick: 3 x 6-8, rest 45 s
- Pogo Hop (Ankle Hops): 4 x 30 s, rest 30 s
- Squat Thrust: 3 x 8-10, rest 45 s
- Shadow Boxing: 3 x 60 s, rest 30 s

### Rope Intervals Plus / מרווחי חבל קפיצה ועוד

`cardio_home_rope_intervals` · intermediate · bodyweight · home / park / gym · 35 min · 5 exercises, 17 sets · gear: jump_rope · muscles: abs, glutes, quadriceps, calves

Five one-minute rope intervals first, then bodyweight jumps and crawls. Straight sets with 30-45 seconds of rest. For people who can skip comfortably.

חמישה מרווחי חבל של דקה, ואחריהם קפיצות וזחילות במשקל הגוף. סטים רציפים עם 30 עד 45 שניות מנוחה. מתאים למי שקופץ בחבל בנוחות.

- Jump Rope: 5 x 60 s, rest 30 s
- Burpee: 3 x 8-10, rest 45 s
- Alternating Jump Lunge: 3 x 8-10, rest 45 s
- Mountain Climber: 3 x 40 s, rest 30 s
- Plank Jumping Jack: 3 x 30 s, rest 30 s

### Power Jump Intervals / מרווחי קפיצות עוצמה

`cardio_home_power_tabata` · advanced · bodyweight · home / park / gym · 42 min · 6 exercises, 26 sets · gear: none · muscles: quadriceps, glutes, abs, shoulders

Explosive jumps alternated with crawl and plank-jack intervals, so the legs get a break between landings. Four to five sets per move. For well-conditioned people with healthy joints.

קפיצות נפיצות לסירוגין עם מרווחי זחילה ופלאנק ג'אק, כך שהרגליים נחות בין הנחיתות. ארבעה עד חמישה סטים לתרגיל. מתאים למי שבכושר טוב ובמפרקים בריאים.

- Tuck Jump: 4 x 8-10, rest 45 s
- Bear Crawl: 4 x 40 s, rest 20 s
- Burpee: 4 x 10-12, rest 40 s
- Plank Jumping Jack: 5 x 40 s, rest 20 s
- Split Squat Jump: 4 x 10-12, rest 40 s
- High Knees: 5 x 20 s, rest 10 s

### Sprint and Power Circuit / מעגל ספרינטים ועוצמה

`cardio_home_sprint_power_circuit` · advanced · bodyweight · home / park / gym · 51 min · 7 exercises, 27 sets · gear: none · muscles: quadriceps, glutes, abs, hamstrings

Short all-out sprint intervals (needs room to run) mixed with one-leg hops, sprawls and lateral bounds. Four sets per move with long enough rests to keep quality. Advanced.

מרווחי ספרינט קצרים בעוצמה גבוהה (דורש מקום לרוץ) בשילוב דילוגים על רגל אחת, ספרול וקפיצות צד. ארבעה סטים לתרגיל עם מנוחות ארוכות מספיק לשמירה על איכות. למתקדמים.

- Sprint Intervals: 4 x 30 s, rest 60 s
- Single-Leg Hop and Stick: 4 x 6-8, rest 45 s
- Sprawl: 4 x 10-12, rest 45 s
- Lateral Bound: 4 x 10-12, rest 45 s
- Bear Crawl: 4 x 30 s, rest 30 s
- Pogo Hop (Ankle Hops): 3 x 30 s, rest 30 s
- Mountain Climber: 4 x 45 s, rest 30 s

### Man Maker Power Rounds / סבבי כוח עם מן מייקר

`cardio_dumbbell_man_maker_rounds` · advanced · weights · gym / home / park · 42 min · 6 exercises, 20 sets · gear: dumbbells · muscles: quadriceps, glutes, shoulders, chest

An advanced conditioning session that mixes loaded full-body lifts with burpees, mountain climbers and tuck jumps. Each exercise is done as straight sets with short rest. Keep the dumbbells light.

אימון כושר מתקדם שמשלב הרמות גוף מלא עם משקולות, ברפי, מטפס הרים וקפיצות ברכיים לחזה. כל תרגיל בסטים רגילים עם מנוחה קצרה. לבחור משקולות קלות.

- Dumbbell Man Maker: 4 x 5-6, rest 60 s
- Dumbbell Thruster: 4 x 10-12, rest 45 s
- Burpee: 3 x 10-12, rest 45 s
- Single-Arm Dumbbell Snatch: 3 x 8-10, rest 45 s
- Mountain Climber: 3 x 40 s, rest 30 s
- Tuck Jump: 3 x 8-10, rest 45 s

### Sprint and Clean Intervals / אינטרוולים של ספרינט וקלין

`cardio_dumbbell_sprint_and_clean_intervals` · advanced · weights · gym / home / park · 44 min · 6 exercises, 21 sets · gear: dumbbells · muscles: quadriceps, glutes, shoulders, hamstrings

An advanced interval session that mixes heavy-breathing work with loaded lifts: man makers, clean and presses, front squats, sprints, split squat jumps and bear crawls. Needs open space to run.

אימון אינטרוולים מתקדם שמשלב עבודה נשימתית עם הרמות במשקולות: מן מייקר, קלין ולחיצה, סקוואט קדמי, ספרינטים, קפיצות ספליט סקוואט וזחילת דוב. דורש מקום פנוי לריצה.

- Dumbbell Man Maker: 3 x 5-6, rest 75 s
- Dumbbell Clean and Press: 4 x 6-8, rest 60 s
- Dumbbell Front Squat: 3 x 8-10, rest 60 s
- Sprint Intervals: 5 x 20 s, rest 40 s
- Split Squat Jump: 3 x 8-10, rest 45 s
- Bear Crawl: 3 x 30 s, rest 45 s

### Easy Jog, Rope and Bench Intervals / אינטרוולים קלים: ריצה, חבל וספסל

`cardio_park_jog_rope_bench_intervals` · beginner · bodyweight · park · 37 min · 6 exercises, 18 sets · gear: jump_rope · muscles: calves, glutes, quadriceps, hip_flexors

Three jog-and-walk intervals, a jump-rope round, bench step-ups and light footwork drills. Work and rest are even and nothing is all-out, so it suits a first cardio session outdoors.

שלושה אינטרוולים של ריצה קלה והליכה, סבב קפיצות בחבל, עליות לספסל ותרגילי רגליים קלים. העבודה והמנוחה שווים ושום דבר לא במאמץ מרבי, כך שזה מתאים לאימון קרדיו ראשון בחוץ.

- Brisk Walk / Jog: 3 x 60 s, rest 60 s
- Step-Up: 3 x 8-10, rest 45 s
- Jump Rope: 3 x 45 s, rest 45 s
- Lateral Shuffle: 3 x 30 s, rest 30 s
- A-Skip (Running Form Drill): 3 x 30 s, rest 30 s
- Mountain Climber: 3 x 20 s, rest 30 s

### Stair Intervals and Burpees / אינטרוולים במדרגות וברפי

`cardio_park_stair_intervals_burpees` · intermediate · bodyweight · park · 39 min · 6 exercises, 20 sets · gear: none · muscles: quadriceps, glutes, calves, abs

Five stair-run intervals, then broad jumps, lateral shuffles, burpees, bear crawls and high knees. Walk down between efforts, warm up well and choose dry, even stairs.

חמישה אינטרוולים של ריצה במדרגות, ואחריהם קפיצות לרוחק, צעדים צידיים מהירים, ברפי, זחילת דוב והרמות ברכיים. ללכת למטה בין המאמצים, להתחמם היטב ולבחור מדרגות יבשות ואחידות.

- Stair Run: 5 x 45 s, rest 60 s
- Broad Jump: 3 x 6-8, rest 45 s
- Lateral Shuffle: 3 x 30 s, rest 30 s
- Burpee: 3 x 8-10, rest 45 s
- Bear Crawl: 3 x 30 s, rest 30 s
- High Knees: 3 x 30 s, rest 30 s

### Sprint Shuttles and Pull-Ups / ספרינטים הלוך וחזור ועליות מתח

`cardio_park_sprint_shuttles_pull_ups` · advanced · bodyweight · park · 45 min · 6 exercises, 22 sets · gear: pull_up_bar · muscles: quadriceps, glutes, abs, hamstrings

Short shuttle sprints at a fast but controlled pace, then tuck jumps, pull-ups, burpees and bear crawls to keep the heart rate high. For an advanced level that already runs and jumps regularly.

ספרינטים קצרים הלוך וחזור בקצב מהיר אך מבוקר, ואחריהם קפיצות ברכיים לחזה, עליות מתח, ברפי וזחילת דוב כדי לשמור על דופק גבוה. מתאים לרמה מתקדמת עם רקע קבוע בריצה ובקפיצות.

- Sprint Intervals: 5 x 15 s, rest 90 s
- Tuck Jump: 3 x 5-6, rest 60 s
- Pull-Up: 4 x 5-8, rest 60 s
- Burpee: 4 x 8-10, rest 45 s
- Bear Crawl: 3 x 30 s, rest 30 s
- Mountain Climber: 3 x 30 s, rest 30 s

### Kettlebell and Dumbbell Power Circuit / מעגל כוח וסווינג עם קטלבל ומשקולות

`cardio_kettlebell_dumbbell_power_circuit` · advanced · weights · home / park / gym · 40 min · 6 exercises, 22 sets · gear: dumbbells, kettlebell · muscles: glutes, quadriceps, chest, hamstrings

A hard conditioning session with short rests: dumbbell man makers, kettlebell cleans and swings, burpees, jump squats and mountain climbers. Needs good fitness and kettlebell technique, one kettlebell and light dumbbells.

אימון קרדיו קשה עם מנוחות קצרות: מן מייקר עם משקולות יד, קלין וסווינג עם קטלבל, ברפי, סקוואט קפיצה ומטפס הרים. מתאים כשיש כושר טוב וטכניקה בקטלבל. נדרשים קטלבל ומשקולות יד קלות.

- Dumbbell Man Maker: 4 x 5-8, rest 60 s
- Kettlebell Clean: 3 x 5-6, rest 30 s
- Kettlebell Swing: 4 x 15-20, rest 30 s
- Burpee: 4 x 8-12, rest 30 s
- Jump Squat: 3 x 10-12, rest 30 s
- Mountain Climber: 4 x 40 s, rest 20 s

## Sport finishers (10 minutes at the end of a workout)

### Soccer (כדורגל)

- **bodyweight** - Soccer: change of direction and leg stability / כדורגל: שינויי כיוון ויציבות רגליים (10.5 min, gear: none): Lateral Shuffle 2x40s; Single-Leg Hop and Stick 2x5-6; Towel Slider Hamstring Curl 2x6-10; Single-Leg Balance Reach 2x6-8; Plank 2x30s
- **gear** - Soccer: single-leg strength and hip stability / כדורגל: כוח ברגל אחת ויציבות אגן (10.3 min, gear: dumbbells, resistance_bands, jump_rope): Jump Rope 2x40s; Dumbbell Reverse Lunge 2x8-10; Towel Slider Hamstring Curl 2x6-10; Banded Lateral Walk 2x10-12; Plank 2x25s
- **gentle** - Soccer: gentle legs and trunk / כדורגל: רגליים וליבה בעדינות (10.7 min, gear: none): Step Jack 2x40s; Wall Sit 2x30s; Glute Bridge March 2x8-10; Bird Dog 2x6-8; Side Plank 2x20s

### Basketball (כדורסל)

- **bodyweight** - Basketball: jumping, landing and defense / כדורסל: קפיצה, נחיתה והגנה (10.3 min, gear: none): Defensive Slide 2x40s; Jump Squat 2x6-8; Single-Leg Romanian Deadlift 2x6-8; Single-Leg Hop and Stick 2x5-6; Hollow Body Hold 2x25s
- **gear** - Basketball: hip power and ankle stiffness / כדורסל: כוח אגן וקשיחות קרסול (10.0 min, gear: dumbbells, resistance_bands, medicine_ball, jump_rope): Jump Rope 2x40s; Goblet Squat 2x10-12; Banded Lateral Walk 2x10-12; Medicine Ball Slam 2x8-10; Plank 2x30s
- **gentle** - Basketball: gentle legs, calves and core / כדורסל: רגליים, תאומים וליבה בעדינות (10.3 min, gear: none): Step Jack 2x40s; Box Squat (Sit-to-Stand) 2x8-10; Standing Calf Raise 2x12-15; Bird Dog 2x6-8; Plank 2x30s

### Volleyball (כדורעף)

- **bodyweight** - Volleyball: jump, shoulders and rotation / כדורעף: קפיצה, כתפיים וסיבוב (10.2 min, gear: none): Lateral Shuffle 2x40s; Jump Squat 2x6-8; Scapular Push-Up 2x10-12; Russian Twist 2x10-12; Prone Swimmer 2x10-12
- **gear** - Volleyball: shoulder health and rotational power / כדורעף: בריאות כתפיים וכוח סיבובי (10.5 min, gear: dumbbells, resistance_bands, medicine_ball, jump_rope): Jump Rope 2x40s; Resistance Band Face Pull 2x12-15; Medicine Ball Rotational Throw (Wall) 2x6-8; Goblet Squat 2x10-12; Band Shoulder External Rotation 2x10-12
- **gentle** - Volleyball: gentle shoulders and trunk / כדורעף: כתפיים וגו בעדינות (10.3 min, gear: none): Shadow Boxing 2x40s; Scapular Push-Up 2x8-10; Bodyweight Squat 2x10-12; Alternating Heel Touch 2x10-12; Side Plank 2x20s

### Tennis / padel (טניס / פאדל)

- **bodyweight** - Tennis and padel: footwork, rotation and shoulders / טניס ופאדל: תנועת רגליים, סיבוב וכתפיים (10.7 min, gear: none): Lateral Shuffle 2x40s; Lateral Lunge 2x6-8; Scapular Push-Up 2x10-12; Russian Twist 2x10-12; Single-Leg Balance Reach 2x6-8
- **gear** - Tennis and padel: rotator cuff, forearms and trunk / טניס ופאדל: סובבי כתף, אמות וליבה (10.3 min, gear: dumbbells, resistance_bands, medicine_ball): Medicine Ball Rotational Throw (Wall) 2x6-8; Banded Lateral Walk 2x10-12; Dumbbell Wrist Curl 2x12-15; Band Shoulder External Rotation 2x10-12; Plank 2x25s
- **gentle** - Tennis and padel: gentle trunk and shoulders / טניס ופאדל: גו וכתפיים בעדינות (10.0 min, gear: none): High March in Place 2x40s; Shadow Boxing 2x40s; Alternating Heel Touch 2x10-12; Scapular Push-Up 2x8-10; Halfway Push-Up Hold 2x20s

### Running (ריצה)

- **bodyweight** - Running: single-leg strength and calves / ריצה: כוח רגל אחת ושוקיים (10.0 min, gear: none): A-Skip (Running Form Drill) 2x40s; Single-Leg Romanian Deadlift 2x8-10; Standing Calf Raise 2x12-15; Glute Bridge 2x12-15; Plank 2x40s
- **gear** - Running: loaded hinge, calves and carry / ריצה: כפיפת ירך עם משקל, שוקיים ונשיאה (10.0 min, gear: dumbbells, bench): A-Skip (Running Form Drill) 2x40s; Dumbbell Single-Leg Romanian Deadlift 2x8-10; Dumbbell Calf Raise 2x12-15; Dumbbell Hip Thrust 2x10-12; Farmer's Carry 2x40s
- **gentle** - Running: gentle low-impact legs and trunk / ריצה: רגליים וליבה בעצימות נמוכה (10.0 min, gear: none): Brisk Walk / Jog 2x40s; Standing Calf Raise 2x10-12; Wall Sit 2x40s; Glute Bridge March 2x8-10; Side Plank 2x20s

### Cycling (רכיבה על אופניים)

- **bodyweight** - Cycling: leg endurance, back and posture / רכיבה: סיבולת רגליים, גב ויציבה (10.0 min, gear: none): Wall Sit 2x40s; Single-Leg Glute Bridge 2x8-10; Superman 2x10-12; Prone Y Raise 2x10-12; Plank 2x40s
- **gear** - Cycling: loaded legs, hinge and upper back / רכיבה: רגליים עם משקל, כפיפת ירך וגב עליון (10.0 min, gear: dumbbells, bench, resistance_bands): Goblet Squat 2x10-12; Dumbbell Single-Leg Romanian Deadlift 2x8-10; Dumbbell Hip Thrust 2x10-12; Resistance Band Row 2x12-15; Plank 2x40s
- **gentle** - Cycling: gentle legs, posture and trunk / רכיבה: רגליים, יציבה וליבה בעצימות נמוכה (10.0 min, gear: none): Box Squat (Sit-to-Stand) 2x10-12; Glute Bridge 2x12-15; Scapular Push-Up 2x10-12; Bird Dog 2x8-10; Plank 2x40s

### Swimming (שחייה)

- **bodyweight** - Swimming: dry-land shoulders and streamline / שחייה: כתפיים וסטרימליין על היבשה (10.0 min, gear: none): Scapular Push-Up 2x10-12; Prone Swimmer 2x10-12; Side Plank 2x30s; Prone Dolphin Kick 2x12-15; Streamline Hold (Lying) 2x40s
- **gear** - Swimming: band lats and shoulder stability / שחייה: גב רחב בגומייה ויציבות כתפיים (10.0 min, gear: dumbbells, resistance_bands): Resistance Band Row 2x12-15; Dumbbell Y Raise 2x10-12; Band Pull-Apart 2x12-15; Prone Dolphin Kick 2x12-15; Streamline Hold (Lying) 2x40s
- **gentle** - Swimming: gentle shoulders, glutes and trunk / שחייה: כתפיים, ישבן וליבה בעצימות נמוכה (10.0 min, gear: none): Scapular Push-Up 2x10-12; Wall Push-Up 2x10-12; Donkey Kick 2x8-10; Glute Bridge 2x12-15; Plank 2x40s

### Boxing / kickboxing / krav maga (אגרוף / קיקבוקס / קרב מגע)

- **bodyweight** - Striking: rounds, legs and rotation / אומנויות לחימה: סבבים, רגליים וסיבוב (10.0 min, gear: none): Shadow Boxing 2x40s; Jump Squat 2x6-8; Push-Up with Shoulder Tap 2x8-12; Standing Knee Strike 2x8-10; Russian Twist 1x10-14
- **gear** - Striking: rope, rotation and shoulders / אומנויות לחימה: חבל, סיבוב וכתפיים (10.0 min, gear: kettlebell, resistance_bands, medicine_ball, jump_rope): Jump Rope 2x40s; Band Shoulder External Rotation 2x12-15; Medicine Ball Rotational Throw (Wall) 2x6-8; Kettlebell Swing 2x10-12; Band Pull-Apart 1x12-15
- **gentle** - Striking: gentle rounds and trunk / אומנויות לחימה: סבבים עדינים וליבה (10.0 min, gear: none): Shadow Boxing 2x40s; Close-Grip Push-Up 2x6-10; Step Jack 2x40s; Alternating Heel Touch 2x10-14; Scapular Push-Up 1x8-12

### Judo / BJJ / wrestling (ג׳ודו / BJJ / היאבקות)

- **bodyweight** - Grappling: hips, sprawls and trunk / היאבקות וגריפה: אגן, ספרול וליבה (10.0 min, gear: none): Hip Escape (Shrimp) 2x8-10; Sprawl 2x6-8; Bear Crawl 2x40s; Glute Bridge 2x10-12; Hollow Body Hold 1x40s
- **gear** - Grappling: grip, pull and hip drive / היאבקות וגריפה: אחיזה, משיכה והנעת אגן (10.0 min, gear: kettlebell, pull_up_bar, resistance_bands): Kettlebell Swing 2x12-15; Sprawl 2x6-8; Single-Arm Resistance Band Row 2x10-12; Dead Hang 2x30s; Hollow Body Hold 1x40s
- **gentle** - Grappling: gentle crawling and bridging / היאבקות וגריפה: זחילה וגשר עדינים (10.0 min, gear: none): Mountain Climber 2x40s; Bird Dog 2x8-10; Glute Bridge 2x10-12; Halfway Push-Up Hold 2x30s; Side Plank 2x20s

### Climbing (טיפוס)

- **bodyweight** - Climbing: shoulders, pushing and trunk / טיפוס: כתפיים, דחיפה וליבה (10.0 min, gear: none): Scapular Push-Up 2x8-12; Pike Push-Up 2x6-10; Prone Y Raise 2x10-12; Hollow Body Hold 2x30s; Side Plank 2x20s
- **gear** - Climbing: hangs, pulls and antagonists / טיפוס: תלייה, משיכה ושרירי נגד (10.0 min, gear: pull_up_bar, resistance_bands): Dead Hang 2x30s; Scapular Pull-Up 2x6-8; Push-Up 2x8-12; Hanging Knee Raise 2x6-10; Resistance Band Face Pull 2x12-15
- **gentle** - Climbing: gentle shoulders and trunk / טיפוס: כתפיים וליבה בעדינות (10.0 min, gear: none): Dead Bug 2x8-10; Scapular Push-Up 2x8-12; Wide Push-Up 2x6-10; Side Plank 2x20s; Plank 2x30s

### Surfing (גלישה)

- **bodyweight** - Surfing: paddle endurance and pop-up / גלישה: סיבולת חתירה וקימה על הלוח (10.7 min, gear: none): Prone Swimmer 2x12-16; Surf Pop-Up 2x6-8; Wall Sit 2x40s; Single-Leg Balance Reach 2x6-8; Streamline Hold (Lying) 2x40s
- **gear** - Surfing: band paddle and rotation / גלישה: חתירה עם גומייה וסיבוב גו (10.7 min, gear: dumbbells, resistance_bands): Resistance Band Straight-Arm Pulldown 2x12-15; Surf Pop-Up 2x6-8; Band Shoulder External Rotation 2x12-15; Dumbbell Woodchop 2x10-12; Side Plank 1x30s
- **gentle** - Surfing: gentle paddle and balance / גלישה: חתירה ושיווי משקל בעדינות (9.7 min, gear: none): Scapular Push-Up 2x8-12; Box Squat (Sit-to-Stand) 2x8-12; Bird Dog 1x8-10; High March in Place 2x30s; Dead Bug 2x8-10

### Calisthenics / street workout (קליסטניקס)

- **bodyweight** - Calisthenics: skill foundations / קליסתניקס: בסיס לשליטה בגוף (10.0 min, gear: none): Scapular Push-Up 2x8-12; Pike Push-Up 2x6-10; Bear Crawl 2x40s; Superman 2x10-12; Hollow Body Hold 2x30s
- **gear** - Calisthenics: pull-up bar basics / קליסתניקס: יסודות על מתח (10.3 min, gear: pull_up_bar): Scapular Pull-Up 2x6-10; Pike Push-Up 2x6-10; Negative Pull-Up 2x3-5; Hanging Knee Raise 2x6-10; Dead Hang 2x30s
- **gentle** - Calisthenics: gentle body control / קליסתניקס: שליטה בגוף בעדינות (9.7 min, gear: none): Scapular Push-Up 2x8-12; Incline Push-Up 2x8-12; Dead Bug 2x8-10; Bird Dog 1x8-10; Plank 2x30s

### Other sport / general fitness (ספורט אחר)

- **bodyweight** - All-round athlete: agility and power / ספורטאי רב-תחומי: זריזות וכוח (10.7 min, gear: none): Lateral Shuffle 2x40s; Push-Up 2x8-12; Split Squat Jump 2x6-8; Prone T Raise 2x10-12; Plank 2x40s
- **gear** - All-round athlete: strength and push-pull / ספורטאי רב-תחומי: כוח ודחיפה-משיכה (10.7 min, gear: dumbbells, kettlebell, resistance_bands): Kettlebell Swing 2x10-15; Resistance Band Row 2x12-15; Dumbbell Reverse Lunge 2x8-10; Push-Up 2x8-12; Plank 2x40s
- **gentle** - All-round athlete: gentle conditioning / ספורטאי רב-תחומי: כושר בעדינות (10.7 min, gear: none): Step Jack 2x40s; Bodyweight Squat 2x10-12; Incline Push-Up 2x8-12; Glute Bridge March 2x8-12; Side Plank 2x20s
