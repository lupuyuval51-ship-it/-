# Ready-made workouts. Spliced into index.html by tools/gen-fitness.py.
# W(id, cat, place, level 0-2, minutes, needs, he title, en title, he blurb, en blurb, warm, cool, rounds, items)
# items: "exercise" uses that exercise's default dose for the workout level; "exercise:sets:amount:rest" overrides it.
# rounds > 0 makes the main block a circuit (each exercise once per round).
READY = []
def W(id, cat, place, lvl, mins, needs, he, en, bhe, ben, warm, cool, rounds, items):
    READY.append((id, cat, place, lvl, mins, needs, he, en, bhe, ben, warm, cool, rounds, items))

# ───────────── HOME (25) ─────────────
W('h-full-start','full','home',0,20,[],'סטארט לכל הגוף','Full Body Starter','אימון עדין שמעסיק את כל הגוף, בלי ציוד ובלי לחץ.','A gentle whole-body session with no equipment and no pressure.','full','full',0,
  ['bw-squat','pu-knee','reverse-lunge','glute-bridge','dead-bug','plank'])
W('h-full-noeq','full','home',1,30,[],'כל הגוף בלי ציוד','No-Equipment Full Body','סט מלא שבונה כוח בכל הגוף עם משקל הגוף בלבד.','A complete bodyweight session that builds strength everywhere.','full','full',0,
  ['bw-squat','pushup','reverse-lunge','superman','plank-shoulder-tap','glute-bridge','mountain-climber'])
W('h-full-burn','full','home',2,40,[],'שריפה לכל הגוף','Full Body Burn','אימון מתקדם בעצימות גבוהה: דופק למעלה וכוח בכל שריר.','An advanced high-intensity session: heart rate up and strength everywhere.','full','full',0,
  ['burpee','jump-lunge','pu-tempo','pike-pushup','single-leg-bridge','v-up','bear-crawl'])
W('h-full-db','full','home',1,35,['weights'],'כל הגוף עם משקולות','Dumbbell Full Body','זוג משקולות ואימון שלם: רגליים, חזה, גב וכתפיים.','One pair of dumbbells and a complete session: legs, chest, back and shoulders.','full','full',0,
  ['goblet-squat','db-floor-press','db-rdl','db-row','db-shoulder-press','woodchop'])
W('h-full-circuit','full','home',1,25,[],'מעגל כל הגוף','Total Body Circuit','שלושה סיבובים מהירים של תרגילים לכל הגוף.','Three fast rounds of whole-body moves.','full','full',3,
  ['bw-squat:1:15:15','pushup:1:10:15','mountain-climber:1:40:15','reverse-lunge:1:10:15','plank-shoulder-tap:1:16:15'])
W('h-abs-express','abs','home',0,10,[],'בטן אקספרס','Abs Express','אימון קצר וממוקד לבטן.','A short, focused session for your abs.','core','core',0,
  ['crunch:2:15:30','heel-touch:2:20:30','dead-bug:2:10:30','reverse-crunch:2:12:30','plank:2:30:30'])
W('h-core-base','abs','home',0,15,[],'יסודות הליבה','Core Foundations','בונים ליבה יציבה לפני שמעמיסים: בטן, גב תחתון ואלכסונים.','Build a stable core before loading it: abs, lower back and obliques.','core','core',0,
  ['dead-bug','bird-dog','glute-bridge','plank','side-plank','superman'])
W('h-abs-six','abs','home',1,20,[],'שורף שש קוביות','Six-Pack Burner','מעגל בטן אינטנסיבי לשרירי הבטן העליונים והתחתונים.','An intense ab circuit for your upper and lower abs.','core','core',3,
  ['bicycle-crunch:1:20:15','leg-raise:1:12:15','russian-twist:1:20:15','plank-shoulder-tap:1:20:15','v-up:1:12:15'])
W('h-abs-lower','abs','home',1,15,[],'בטן תחתונה ואלכסונים','Lower Abs & Obliques','הרמות, פרפר ואלכסונים לאזור שקשה לעבוד עליו.','Raises, flutter kicks and obliques for the hardest-to-reach area.','core','core',0,
  ['reverse-crunch','flutter-kick','heel-touch','side-plank','russian-twist'])
W('h-abs-plank','abs','home',2,20,[],'אתגר פלאנק וחלול','Plank & Hollow Challenge','החזקות ותנועות שבונות ליבה כמו פלדה.','Holds and drills that forge a steel core.','core','core',0,
  ['hollow','plank','side-plank','plank-shoulder-tap','v-up','bear-crawl'])
W('h-legs-base','legs','home',0,20,[],'יסודות רגליים וישבן','Legs & Glutes Basics','סקוואטים, לאנג׳ים וגשרים, בדיוק מה שצריך להתחיל.','Squats, lunges and bridges: exactly what you need to start.','lower','lower',0,
  ['bw-squat','reverse-lunge','glute-bridge','wall-sit','calf-raise'])
W('h-legs-day','legs','home',1,30,[],'יום רגליים בבית','Leg Day at Home','אימון רגליים מלא בלי ציוד, שגם ירגיש אחרי יומיים.','A full leg session with no equipment that you will feel for two days.','lower','lower',0,
  ['sumo-squat','walking-lunge','single-leg-rdl','lateral-lunge','wall-sit','calf-raise'])
W('h-legs-fire','legs','home',2,30,[],'אש בגפיים התחתונים','Lower Body Fire','קפיצות ותרגילים חד־רגליים לרגליים חזקות ומתפרצות.','Jumps and single-leg work for strong, explosive legs.','lower','lower',0,
  ['squat-jump','jump-lunge','single-leg-rdl','skater-hop','curtsy-lunge','wall-sit'])
W('h-lunge','legs','home',1,25,[],'פיצוץ לאנג׳ים','Lunge Blast','ארבע וריאציות של לאנג׳ לרגליים ולישבן.','Four lunge variations for your legs and glutes.','lower','lower',0,
  ['reverse-lunge','walking-lunge','lateral-lunge','curtsy-lunge','glute-bridge'])
W('h-pushup-power','upper','home',1,20,[],'כוח שכיבות סמיכה','Push-Up Power','סולם וריאציות של שכיבות סמיכה לחזה, כתפיים ותלת ראשי.','A ladder of push-up variations for chest, shoulders and triceps.','upper','upper',0,
  ['pushup','pu-wide','pu-diamond','pike-pushup','pu-tempo'])
W('h-upper-noeq','upper','home',1,25,[],'פלג גוף עליון בלי ציוד','Upper Body, No Equipment','דחיפות ומשיכות עם משקל הגוף בלבד.','Pushing and pulling with just your bodyweight.','upper','upper',0,
  ['pushup','pike-pushup','superman','reverse-snow-angel','plank-shoulder-tap','pu-diamond'])
W('h-arms-db','upper','home',1,25,['weights'],'זרועות וכתפיים (משקולות)','Arms & Shoulders (Dumbbells)','זוג משקולות לכתפיים, דו ראשי ותלת ראשי.','A pair of dumbbells for shoulders, biceps and triceps.','upper','upper',0,
  ['db-shoulder-press','lateral-raise','db-curl','hammer-curl','db-tricep-ext','db-reverse-fly'])
W('h-hiit','cardio','home',1,15,[],'HIIT שורף שומן','HIIT Fat Burner','ארבעה סיבובים קצרים ועצימים, מושלם ליום עמוס.','Four short, intense rounds, perfect for a busy day.','cardio','full',4,
  ['high-knees:1:30:10','bw-squat:1:20:10','mountain-climber:1:30:10','star-jump:1:20:10'])
W('h-lowimpact','cardio','home',0,20,[],'קרדיו עדין למפרקים','Low-Impact Cardio','בלי קפיצות ובלי רעש, מתאים לדירה ולברכיים רגישות.','No jumping and no noise: apartment- and knee-friendly.','cardio','full',3,
  ['step-jack:1:40:15','skater-step:1:40:15','shadow-boxing:1:40:15','sumo-squat:1:12:15','march:1:40:15'])
W('h-tabata','cardio','home',2,20,[],'טבטה מתפרץ','Tabata Blast','20 שניות מקסימום, 10 שניות מנוחה. קשה וקצר.','20 seconds all-out, 10 seconds rest. Hard and short.','cardio','full',4,
  ['burpee:1:6:10','mountain-climber:1:20:10','star-jump:1:12:10','high-knees:1:20:10','jump-lunge:1:10:10'])
W('h-cardio-core','cardio','home',1,25,[],'קרדיו ובטן','Cardio & Core','מעגל שמשלב דופק גבוה עם עבודת בטן.','A circuit that mixes a high heart rate with ab work.','cardio','core',3,
  ['high-knees:1:30:15','bicycle-crunch:1:20:15','skater-hop:1:16:15','mountain-climber:1:30:15','russian-twist:1:20:15'])
W('h-booty','women','home',1,25,[],'שריפת ישבן','Booty Burn','גשרים, בעיטות ופולסים שמדליקים את הישבן.','Bridges, kicks and pulses that light up your glutes.','lower','lower',0,
  ['glute-bridge','single-leg-bridge','donkey-kick','fire-hydrant','frog-pump','sumo-squat'])
W('h-lean-legs','women','home',1,30,[],'רגליים חטובות וישבן','Lean Legs & Glutes','רצף רגליים וישבן שמחטב ובונה כוח.','A leg and glute sequence that tones and builds strength.','lower','lower',0,
  ['sumo-squat','reverse-lunge','curtsy-lunge','glute-bridge','lateral-lunge','wall-sit','calf-raise'])
W('h-toned-arms','women','home',0,20,[],'זרועות וליבה מחוטבות','Toned Arms & Core','שכיבות על הברכיים, גב עליון ובטן, בלי ציוד.','Knee push-ups, upper back and abs, no equipment.','upper','core',0,
  ['pu-knee','superman','plank','bicycle-crunch','reverse-snow-angel','dead-bug'])
W('h-stretch','stretch','home',0,15,[],'מתיחות וגמישות לכל הגוף','Full-Body Stretch & Mobility','פותחים ירכיים, גב וכתפיים. טוב בבוקר ובערב.','Open your hips, back and shoulders. Good morning or night.','none','none',0,
  ['cat-cow:1:10:10','childs-pose','stretch-hip','stretch-ham','quad-stretch','thread-needle','spinal-twist'])

# ───────────── GYM (25) ─────────────
W('g-full-machine','full','gym',0,40,['machine'],'כל הגוף במכונות','Full Body Machines','מכונות בטוחות ואימון מלא למי שמתחיל במכון.','Safe machines and a full session for gym beginners.','full','full',0,
  ['leg-press','chest-press-machine','lat-pulldown','shoulder-press-machine','seated-row','plank'])
W('g-full-db','full','gym',1,40,['weights'],'כל הגוף עם משקולות','Full Body Dumbbells','שישה תרגילי יסוד עם משקולות יד.','Six core lifts with dumbbells.','full','full',0,
  ['goblet-squat','db-chest-press','db-row','db-rdl','db-shoulder-press','plank'])
W('g-full-bar','full','gym',2,55,['barbell'],'כוח כל הגוף עם מוט','Full Body Barbell Strength','סקוואט, לחיצה, חתירה ודדליפט: האימון הקלאסי.','Squat, press, row and deadlift: the classic session.','full','full',0,
  ['barbell-squat','bench-press','barbell-row','overhead-press','romanian-deadlift','plank'])
W('g-strength-exp','full','gym',1,30,['weights'],'כוח אקספרס','Strength Express','30 דקות, ארבעה תרגילים ענקיים.','Thirty minutes, four big movements.','full','full',0,
  ['goblet-squat','db-chest-press','db-row','farmer-carry'])
W('g-chest-tri','upper','gym',1,45,['barbell'],'חזה ותלת ראשי','Chest & Triceps','לחיצות, פרפר ותלת ראשי ליום חזה מלא.','Presses, flyes and triceps for a full chest day.','upper','upper',0,
  ['bench-press','incline-db-press','pec-fly','tricep-pushdown','db-tricep-ext','pushup'])
W('g-back-bi','upper','gym',1,45,['machine'],'גב ודו ראשי','Back & Biceps','משיכות וחתירות לגב רחב ומוצק.','Pulls and rows for a wide, solid back.','upper','upper',0,
  ['lat-pulldown','seated-row','db-row','face-pull','db-curl','hammer-curl'])
W('g-shoulder-arms','upper','gym',1,40,['weights'],'כתפיים וזרועות','Shoulders & Arms','לחיצות והרמות לכתפיים ולזרועות.','Presses and raises for shoulders and arms.','upper','upper',0,
  ['db-shoulder-press','lateral-raise','db-reverse-fly','db-curl','tricep-pushdown','face-pull'])
W('g-push','upper','gym',2,50,['barbell'],'יום דחיפה','Push Day','חזה, כתפיים ותלת ראשי בנפח גבוה.','Chest, shoulders and triceps at high volume.','upper','upper',0,
  ['bench-press','overhead-press','incline-db-press','lateral-raise','tricep-pushdown','pec-fly'])
W('g-pull','upper','gym',2,50,['barbell'],'יום משיכה','Pull Day','גב, אחורי כתף ודו ראשי.','Back, rear delts and biceps.','upper','upper',0,
  ['barbell-row','lat-pulldown','seated-row','face-pull','db-curl','hammer-curl'])
W('g-upper-power','upper','gym',2,45,['barbell','bar'],'כוח לפלג גוף עליון','Upper Body Power','מתח, חזה וחתירה לכוח עליון.','Pull-ups, pressing and rowing for upper-body strength.','upper','upper',0,
  ['pullup','bench-press','barbell-row','overhead-press','hammer-curl'])
W('g-leg-heavy','legs','gym',2,50,['barbell'],'יום רגליים כבד','Heavy Leg Day','סקוואט, דדליפט רומני וכוח לשוקיים.','Squats, Romanian deadlifts and calves.','lower','lower',0,
  ['barbell-squat','romanian-deadlift','leg-press','leg-curl','calf-raise-heavy'])
W('g-quads','legs','gym',1,40,['machine'],'מיקוד ארבע ראשי','Quads Focus','לג פרס, פשיטות ולאנג׳ים לירכיים קדמיות.','Leg press, extensions and lunges for your front thighs.','lower','lower',0,
  ['leg-press','leg-extension','bulgarian-split','walking-lunge','calf-raise-heavy'])
W('g-hams-glutes','legs','gym',1,40,['barbell'],'ירכיים אחוריות וישבן','Hamstrings & Glutes','היפ־תראסט ודדליפט רומני לישבן ולירך האחורית.','Hip thrusts and Romanian deadlifts for glutes and hamstrings.','lower','lower',0,
  ['romanian-deadlift','barbell-hip-thrust','leg-curl','cable-kickback','hip-abduction'])
W('g-leg-machines','legs','gym',0,35,['machine'],'רגליים במכונות','Leg Machines','מכונות בטוחות לרגליים, מושלם למתחילים.','Safe machines for legs, perfect for beginners.','lower','lower',0,
  ['leg-press','leg-extension','leg-curl','hip-abduction','calf-raise-heavy'])
W('g-lower-strength','legs','gym',2,50,['barbell'],'כוח רגליים','Lower Body Strength','דדליפט, סקוואט ועלייה על ספסל.','Deadlift, squat and step-ups.','lower','lower',0,
  ['deadlift','barbell-squat','db-step-up','kettlebell-swing','calf-raise-heavy'])
W('g-abs','abs','gym',1,20,['machine'],'בטן וליבה במכון','Gym Abs & Core','כבל, תלייה ופלאנק לבטן חזקה.','Cable, hanging and plank work for a strong midsection.','core','core',0,
  ['cable-crunch','hanging-leg-raise','woodchop','plank','russian-twist','dead-bug'])
W('g-hang-core','abs','gym',2,20,['bar'],'ליבה בתלייה','Hanging Core','תלייה, הרמות ופלאנקים לליבה מתקדמת.','Hangs, raises and planks for an advanced core.','core','core',0,
  ['hanging-leg-raise','hang-knee','hollow','side-plank','plank'])
W('g-treadmill','cardio','gym',1,25,['cardiom'],'אינטרוולים על הליכון','Treadmill Intervals','דקה מהירה, דקה קלה, שש פעמים.','One fast minute, one easy minute, six times.','cardio','full',0,
  ['treadmill-intervals'])
W('g-bike-row','cardio','gym',1,25,['cardiom'],'אופניים וחתירה','Bike & Row HIIT','שני מכשירים ואינטרוולים עצימים.','Two machines and intense intervals.','cardio','full',0,
  ['bike-intervals','rowing-intervals'])
W('g-cardio-circuit','cardio','gym',1,30,['weights'],'מעגל קרדיו וכוח','Cardio & Strength Circuit','קטלבל, סקוואט וחתירה בקצב מעגל.','Kettlebell, squats and rows at circuit pace.','cardio','full',3,
  ['kettlebell-swing:1:15:20','goblet-squat:1:12:20','db-row:1:10:20','mountain-climber:1:30:20','plank:1:30:20'])
W('g-glute-builder','women','gym',1,40,['barbell'],'בונה ישבן','Glute Builder','היפ־תראסט, בולגרי ובעיטות בכבל.','Hip thrusts, split squats and cable kickbacks.','lower','lower',0,
  ['barbell-hip-thrust','db-rdl','bulgarian-split','cable-kickback','hip-abduction'])
W('g-lower-sculpt','women','gym',1,40,['weights'],'חיטוב פלג גוף תחתון','Lower Body Sculpt','רגליים וישבן מחוטבים עם משקולות ומכונות.','Toned legs and glutes with dumbbells and machines.','lower','lower',0,
  ['goblet-squat','db-lunge','leg-curl','hip-abduction','calf-raise-heavy'])
W('g-upper-tone','women','gym',0,35,['machine'],'חיטוב פלג גוף עליון','Upper Body Tone','משיכות, לחיצות וזרועות קלות להרגשה חזקה.','Pulls, presses and light arm work for a strong, toned look.','upper','upper',0,
  ['lat-pulldown','db-shoulder-press','db-chest-press','lateral-raise','tricep-pushdown','db-curl'])
W('g-full-tone','women','gym',1,40,['weights'],'חיטוב כל הגוף','Full Body Tone','אימון מלא עם משקולות לגוף מחוטב.','A complete dumbbell session for a toned physique.','full','full',0,
  ['goblet-squat','db-row','db-chest-press','db-rdl','plank','bicycle-crunch'])
W('g-stretch','stretch','gym',0,15,[],'מתיחות ושחרור אחרי אימון','Post-Lift Stretch & Recovery','מתיחות לשרירים שעבדו, כדי לחזור חזקים.','Stretches for the muscles you just worked.','none','none',0,
  ['childs-pose','stretch-hip','stretch-ham','quad-stretch','figure-four','chest-stretch','spinal-twist'])

# ───────────── NINJA (12) ─────────────
W('n-grip','ninja','ninja',1,20,['bar'],'בונה אחיזה','Grip Builder','תליות ולחיצות לאחיזה שלא משחררת מכשול.','Hangs and squeezes for a grip that never lets go of an obstacle.','ninja','ninja',0,
  ['dead-hang','towel-hang','fist-squeeze','farmer-carry','towel-wring'])
W('n-pull-ladder','ninja','ninja',1,25,['bar'],'סולם מתחים','Pull-Up Ladder','מתחים, שליליים וחתירות בעומס עולה.','Pull-ups, negatives and rows with rising load.','ninja','ninja',0,
  ['pullup','neg-pullup','chinup','aus-row','hang-knee'])
W('n-warped','ninja','ninja',2,25,['bar'],'כוח לקיר הענק','Warped Wall Power','משיכות מתפרצות וקפיצות לקיר.','Explosive pulls and jumps for the warped wall.','ninja','ninja',0,
  ['explosive-pullup','box-jump','broad-jump','sprint','hollow'])
W('n-balance','ninja','ninja',0,20,[],'איזון ונחיתות','Balance & Landings','דיוק ושליטה על מכשולי איזון.','Precision and control for balance obstacles.','ninja','ninja',0,
  ['beam-walk','line-walk','single-leg','precision-jumps','q-steps'])
W('n-swing','ninja','ninja',2,25,['rings'],'תנופה וטבעות','Swing & Rings','תנופה מהאגן ומעברים בין טבעות.','Hip-driven swing and ring transitions.','ninja','ninja',0,
  ['kip-swing','ring-swing','ring-traverse','hang-switch','toes-bar'])
W('n-course','ninja','ninja',1,30,[],'מעגל מסלול','Course Conditioning Circuit','מעגל בקצב מסלול לסיבולת מכשולים.','A course-paced circuit for obstacle endurance.','ninja','ninja',3,
  ['sprint:1:20:15','aus-row:1:8:15','squat-jump:1:10:15','dead-hang:1:20:15','lateral-bounds:1:8:15','plank:1:30:15'])
W('n-legs','ninja','ninja',1,25,[],'רגליים למכשולים','Obstacle Legs','כוח ופיצוץ לרגליים.','Strength and power for your legs.','ninja','ninja',0,
  ['split-squat','broad-jump','lateral-bounds','wall-sit','glute-bridge','single-leg'])
W('n-core','ninja','ninja',1,15,['bar'],'ליבה לטיפוס','Core for Climbing','בטן שמחזיקה את הגוף על המוט.','Abs that keep your body tight on the bar.','core','core',0,
  ['hang-knee','hollow','toes-bar','side-plank','dead-bug'])
W('n-forearm','ninja','ninja',0,15,['bar'],'אמות ואצבעות','Forearm & Finger Strength','חיזוק האמות והאצבעות והגנה על הפרקים.','Strengthen forearms and fingers and protect your joints.','ninja','ninja',0,
  ['fist-squeeze','towel-wring','towel-hang','dead-hang','stretch-forearm'])
W('n-home','ninja','ninja',0,20,[],'נינג׳ה בבית','Ninja Home Basics','אימון נינג׳ה בלי ציוד, רק מגבת.','A ninja session with no equipment, just a towel.','ninja','ninja',0,
  ['bw-squat','pushup','towel-wring','fist-squeeze','glute-bridge','plank','single-leg'])
W('n-mobility','ninja','ninja',0,15,[],'ניידות נינג׳ה','Ninja Mobility','כתפיים, אמות וירכיים לתנועה חופשית.','Shoulders, forearms and hips for free movement.','none','none',0,
  ['open-book','stretch-shoulder','stretch-forearm','stretch-hip','scap-pulls'])
W('n-full','ninja','ninja',2,40,['bar'],'מפגש נינג׳ה מלא','Ninja Full Session','מתח, אחיזה, קפיצה ואיזון באימון אחד.','Pull, grip, jump and balance in one session.','ninja','ninja',0,
  ['pullup','dead-hang','pushup','broad-jump','hollow','beam-walk'])
