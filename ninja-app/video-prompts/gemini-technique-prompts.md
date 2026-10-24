# פרומטים לסרטוני טכניקה: NINJA CIRCUIT

67 פרומטים לתרגילי האפליקציה, 11 להדגמת טעויות נפוצות ושני פרומטים לתמונות ייחוס. כל פרומט עומד בפני עצמו ומוכן להדבקה ב־Gemini במצב יצירת סרטון.

## לפני שמתחילים

- **הסרטונים הם הדגמה, לא מאמן.** מודלי וידאו נוטים לטעות בתנועה: ספירת חזרות, כיוון התנועה, ידיים ואצבעות. צפו בכל סרטון מול "מה לבדוק" ויצרו שוב אם משהו לא נכון. כדאי ליצור 2–3 גרסאות לכל תרגיל.
- **תרגילים שמסומנים "קשה ל־AI"** (שכיבות סמיכה ביד אחת, לאץ׳, קיר ענק, בהונות למוט ועוד) יוצאים שגויים לעיתים קרובות. אפשר לדלג עליהם ולצלם אדם אמיתי.
- **לפני שמציגים את הסרטונים באפליקציה כהוראת ביצוע, כדאי שמאמן יעבור עליהם.** טכניקה שגויה בסרטון יכולה לגרום לפציעה.
- הפרומטים באנגלית כי מודלי הווידאו מבינים אותה הכי טוב. אורך סרטון כ־8 שניות. אם אפשר לבחור יחס מסך, בחרו אנכי 9:16, ואם אי אפשר, בחרו 16:9 וחתכו אחר כך.
- יש הגבלה יומית על כמות הסרטונים ב־Gemini. בדקו אותה בחשבון שלכם.

## איך עובדים

1. (אופציונלי) צרו את שתי תמונות הייחוס, והעלו את תמונת הספורטאי עם כל פרומט אם Gemini מאפשר. כך הספורטאי נראה אותו דבר בכל הסרטונים.
2. העתיקו פרומט והדביקו אותו ב־Gemini.
3. בדקו את התוצאה מול "מה לבדוק".
4. שמרו בשם הקובץ שמופיע ליד התרגיל (למשל `pullup.mp4`), כדי שאפשר יהיה לחבר את הסרטונים לאפליקציה לפי שם.

## תמונות ייחוס

### תמונת ייחוס: הספורטאי

- **קובץ:** `ref-athlete.png`
- **מה לבדוק בסרטון:** פנים רגועות, ידיים לצדדים, כל הגוף בפריים, תאורה אחידה. אם Gemini מאפשר, השתמשו בתמונה הזו בכל סרטון.

```text
Photorealistic full-body portrait photo, vertical 9:16, of an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. The athlete stands relaxed with the arms at the sides and a neutral expression, in a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Shot at eye level from about 4 m away, bright even front lighting, background slightly out of focus. Natural human anatomy, correct hands. No text, no logos, no watermarks, no other people.
```

### תמונת ייחוס: האולם

- **קובץ:** `ref-gym.png`
- **מה לבדוק בסרטון:** אולם ריק עם מוט מתח, טבעות, מתקן קופים, קיר ענק וקורות. אפשר להשתמש בו כרקע עקבי.

```text
Photorealistic wide photo, vertical 9:16, of an empty modern dark ninja-warrior training gym: matte black walls, a steel truss overhead, a pull-up bar rig, gymnastic rings, overhead monkey bars, a curved warped wall in the background, a low balance beam, plyometric boxes, thick dark-blue crash mats on the floor, and soft cyan and orange LED strip lights glowing along the structures. Bright even lighting, no people, no text, no logos, no watermarks.
```

## חימום

### ג׳אמפינג ג׳קס

- **קובץ:** `jacks.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** קצב קליל, נחיתה רכה על כריות כפות הרגליים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Jumping jacks (a warm-up exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall, feet together, arms down at the sides.
Action: Perform easy, steady jumping jacks at a relaxed rhythm of about 1.5 jumps per second for the whole clip: the feet jump out to just wider than the shoulders while the straight arms sweep overhead, then the feet jump back together as the arms return to the sides. Land softly on the balls of the feet with slightly bent knees.
Show clearly: soft quiet landings, upright torso, relaxed shoulders, arms fully overhead.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הליכה במקום עם ברכיים גבוהות

- **קובץ:** `march.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** ברכיים לגובה המותן, הידיים עובדות בקצב.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: High-knee march (a warm-up exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall in the middle of the frame.
Action: March in place at about 2 steps per second: lift each knee to hip height, alternating legs, with the opposite arm swinging forward in rhythm. Stay tall, do not lean back.
Show clearly: knee up to hip height, tall posture, arms swing opposite to the legs.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### סיבובי ידיים

- **קובץ:** `arm-circles.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** 15 שניות קדימה ו־15 אחורה, מעגלים שהולכים וגדלים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Arm circles (a warm-up exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall, arms extended straight out to the sides at shoulder height, palms down.
Action: 0-4 s: draw small circles forward with both straight arms, growing steadily larger. 4-8 s: reverse and draw circles backward, again growing from small to large.
Show clearly: arms stay straight and at shoulder height, shoulders relaxed away from the ears, circles grow gradually.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### חימום פרקי ידיים ואצבעות

- **קובץ:** `wrist-prep.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** תקריב
- **מה לבדוק בסרטון:** סיבובי פרקים, פתיחה וסגירה של אגרופים ומתיחת אצבעות עדינה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Wrist & finger prep (a warm-up exercise).
Camera: static medium close-up from the waist up, hands and forearms clearly visible, camera does not move.
Setup: Standing, both arms held out in front at chest height.
Action: 0-3 s: slow wrist circles with the fingers interlaced. 3-5 s: open both hands wide and close them into fists, three times. 5-8 s: extend the right arm palm-up and gently pull the fingers back with the left hand, a gentle stretch.
Show clearly: slow controlled circles, full open-and-close of the hands, gentle pull only with no force.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### משיכות שכמות

- **קובץ:** `scap-pulls.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מאחור
- **מה לבדוק בסרטון:** תלייה בידיים ישרות: מושכים את השכמות למטה ואחורה בלי לכופף מרפקים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Scapular pulls (a warm-up exercise).
Camera: static shot from directly behind the athlete at shoulder height, the whole body and the bar fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand shoulder-width grip, arms fully straight, feet off the floor.
Action: Keeping the elbows locked straight, pull the shoulder blades down and back so the body rises about 5 cm, hold for 1 second, then relax back down to the full hang. Do 3 slow repetitions.
Show clearly: elbows stay straight, only the shoulder blades move, head stays neutral, no swinging.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### ניתורי קרסול

- **קובץ:** `pogo.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** קפיצות קטנות ומהירות, ברכיים כמעט ישרות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Pogo hops (a warm-up exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall, knees almost straight, arms relaxed.
Action: Perform small, quick pogo hops at about 3 hops per second, bouncing only from the ankles with the heels barely touching the floor and the legs nearly straight. The torso stays still.
Show clearly: movement from the ankles only, nearly straight legs, quiet light landings.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### לאנג׳ עם סיבוב

- **קובץ:** `lunge-twist.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** צעד קדימה, ברך אחורית מתקרבת לרצפה, מסובבים את הגו לצד הרגל הקדמית.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Lunge with twist (a warm-up exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall, hands clasped together in front of the chest.
Action: 0-4 s: step the right foot forward into a lunge, lower the back knee toward the floor with the torso upright, rotate the chest and clasped hands over the front (right) knee, rotate back to centre and push back up to standing. 4-8 s: the same on the left side.
Show clearly: upright torso, rotation comes from the chest and not the lower back, front knee stays over the ankle.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## אחיזה

### תלייה מתה

- **קובץ:** `dead-hang.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** אחיזה מלאה עם האגודל וכתפיים פעילות. לא שוקעים בכתפיים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Dead hang (a grip exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip at shoulder width, thumbs wrapped around the bar, arms fully straight, feet off the floor, legs together.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement. The shoulders are active: pulled slightly down and away from the ears, not shrugged up. At the end the athlete lets go and drops gently onto the mat.
Show clearly: thumbs wrapped around the bar, shoulders active and away from the ears, arms straight, body still with no swinging.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### תלייה על מגבות

- **קובץ:** `towel-hang.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** שתי מגבות על המוט ואחיזה חזקה. מדמה חבלים ואחיזות רכות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Towel hang (a grip exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Two small hand towels are draped over a pull-up bar, one in front of each shoulder. The athlete hangs from the hanging ends of the towels with one fist gripping each towel, arms straight, feet off the floor.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement.
Show clearly: crushing grip on the towels, arms straight, body still.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### תלייה עם החלפת ידיים

- **קובץ:** `hang-switch.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** בתלייה משחררים יד אחת לרגע ותופסים שוב, לסירוגין.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Hand-switch hang (a grip exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand shoulder-width grip, arms straight, feet off the floor.
Action: Keeping the body as still as possible, briefly let go with the right hand for about half a second and give it a small shake, then re-grip the bar firmly. Then do the same with the left hand, then once more with the right. The other hand never lets go.
Show clearly: the gripping hand stays tight, only small controlled movement, the body does not swing.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתקן קופים

- **קובץ:** `monkey.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** תנופה קטנה מהאגן, מבט לשלב הבא, תפיסה מלאה לפני שמשחררים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Monkey bars (a grip exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Under a row of overhead monkey bars (horizontal rungs about 40 cm apart), the athlete hanging from the first rung.
Action: Travel forward across 4 rungs with a smooth, continuous rhythm: a small swing from the hips, the leading hand reaches and grabs the next rung while the other hand releases, eyes on the next rung, the grip fully closed before every release.
Show clearly: swing driven from the hips, full grip before letting go, eyes on the next rung, smooth rhythm.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הליכת חקלאי

- **קובץ:** `farmer-carry.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** משקל כבד בכל יד, גב זקוף, צעדים קצרים ושקטים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Farmer carry (a grip exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Standing tall holding a heavy dumbbell in each hand at the sides.
Action: Walk forward with short, quiet steps along the mat for the whole clip, back tall, shoulders pulled back and down, the weights hanging still at the sides without swinging, head neutral.
Show clearly: tall back, shoulders back and down, tight grip, short quiet steps.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### סחיטת מגבת

- **קובץ:** `towel-wring.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** תקריב
- **מה לבדוק בסרטון:** סוחטים מגבת בכוח לשני הכיוונים, כמו לייבש אותה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Towel wring (a grip exercise).
Camera: static medium close-up from the waist up, hands and forearms clearly visible, camera does not move.
Setup: Holding a rolled towel horizontally with both hands wide apart in front of the chest.
Action: 0-4 s: twist the hands in opposite directions as hard as possible, wringing the towel, forearms visibly working. 4-8 s: twist in the other direction.
Show clearly: wide grip, full twisting range, visible forearm tension.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### פתיחה וסגירה מהירה של אגרופים

- **קובץ:** `fist-squeeze.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** תקריב
- **מה לבדוק בסרטון:** ידיים מושטות קדימה, פותחים וסוגרים מהר עד שמרגישים צריבה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Rapid fist clench (a grip exercise).
Camera: static medium close-up from the waist up, hands and forearms clearly visible, camera does not move.
Setup: Both arms extended forward at chest height, palms down.
Action: Rapidly open both hands wide with the fingers fully spread, then close them into tight fists, about 3 open-close cycles per second for the whole clip.
Show clearly: full opening and a full fist every time, arms relaxed, forearm tension visible.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### תלייה על חבל

- **קובץ:** `rope-hang.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** שתי ידיים על החבל, אחת מעל השנייה, גוף רגוע.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Rope hang (a grip exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a thick climbing rope with both hands stacked one above the other, feet off the floor and crossed, arms straight.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement.
Show clearly: hands stacked one above the other, tight grip, body still, shoulders active.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### תלייה בטבעות

- **קובץ:** `rings-hang.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** הטבעות זזות, אז מייצבים כתפיים ושומרים על גוף שקט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Ring hang (a grip exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from two gymnastic rings at shoulder width, arms straight, feet off the floor.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement.
Show clearly: the rings stay steady, shoulders active, arms straight.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### טרוורס בקיר טיפוס

- **קובץ:** `boulder.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** תנועה רצופה לרוחב הקיר, ידיים ישרות ככל האפשר, הרגליים עובדות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Bouldering traverse (a grip exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Facing a low climbing wall with large colourful holds, the athlete gripping two holds with the hands about 1.2 m above the mat.
Action: Traverse sideways along the wall at a steady pace, with the feet always within about 1 metre of the mat: hand, foot, hand, foot. The arms stay as straight as possible and the legs do most of the work, hips close to the wall.
Show clearly: straight arms, the legs push, hips close to the wall, smooth continuous movement.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## משיכה

### מתח שלילי

- **קובץ:** `neg-pullup.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** קופצים למעלה ויורדים לאט, 4 שניות לכל ירידה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Negative pull-up (a pulling exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Under a pull-up bar, the athlete is already at the top position with an overhand shoulder-width grip and the chin above the bar.
Action: 0-1 s: hold the top position with the chin over the bar and the chest high. 1-6 s: lower very slowly and steadily until the arms are fully straight in a dead hang. 6-8 s: let go and drop onto the mat.
Show clearly: slow steady lowering of about 4 seconds, no dropping, chest stays up, full range down to straight arms.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתח

- **קובץ:** `pullup.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** מתחילים מתלייה מלאה, סנטר מעל המוט, בלי טלטולים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Pull-up (a pulling exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip at shoulder width, arms straight, legs together and still.
Action: Do 2 strict pull-ups: first pull the shoulder blades down, then drive the elbows toward the ribs until the chin is clearly above the bar (about 1.5 s), pause briefly, then lower with control (about 2 s) to fully straight arms. No swinging, no kicking.
Show clearly: full range from straight arms to chin over the bar, no kipping, controlled lowering, neck neutral.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתח באחיזה הפוכה

- **קובץ:** `chinup.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** כפות הידיים אליכם, סנטר מעל המוט. יותר עבודה לשרירי הזרוע.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Chin-up (a pulling exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an underhand grip (palms facing the athlete) at shoulder width, arms straight, legs together and still.
Action: Do 2 strict chin-ups: pull until the chin is clearly above the bar with the elbows staying close to the body (about 1.5 s), pause briefly, then lower with control (about 2 s) to fully straight arms.
Show clearly: palms facing the athlete, elbows close to the ribs, chin over the bar, controlled lowering, no kipping.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתח באחיזה רחבה

- **קובץ:** `wide-pullup.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** ידיים רחבות מהכתפיים. תנועה קצרה יותר שבונה גב ואחיזה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Wide-grip pull-up (a pulling exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip about 1.5 times shoulder width, arms straight, legs together and still.
Action: Do 2 strict wide-grip pull-ups: pull until the chin is above the bar (a shorter range than a normal pull-up) with the elbows pointing out and down, pause briefly, then lower with control to straight arms.
Show clearly: hands clearly wider than the shoulders, chin over the bar, controlled lowering, no swinging.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתח עם מגבות

- **קובץ:** `towel-pullup.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** מגבת על המוט בכל יד. אחיזה קשה שמדמה חבלים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Towel pull-up (a pulling exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Two hand towels draped over a pull-up bar, one in front of each shoulder; the athlete grips the hanging ends of the towels with both fists, arms straight, feet off the floor.
Action: Do 2 slow pull-ups holding the towels, bringing the chin up level with the hands, then lowering under control to straight arms; the grip stays tight the whole time.
Show clearly: strong crush grip on the towels, chin up to hand height, controlled lowering, no swinging.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### חתירה אוסטרלית

- **קובץ:** `aus-row.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** מוט נמוך, גוף ישר כמו קרש, מושכים את החזה למוט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Australian row (a pulling exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Lying on the back under a bar set at waist height, the athlete holds the bar overhand at shoulder width with straight arms, heels on the floor, the body straight like a plank.
Action: Do 3 rows: pull the chest up to the bar while keeping the body in one straight line, squeeze the shoulder blades together for a moment, then lower slowly to straight arms.
Show clearly: body straight like a plank, hips do not sag, chest touches the bar, slow lowering.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### חתירה עם מגבת בדלת

- **קובץ:** `towel-row.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** מגבת סביב ידית של דלת סגורה ויציבה, נשענים אחורה ומושכים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Door towel row (a pulling exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Facing a sturdy closed door that opens away from the athlete, holding both ends of a towel that is looped around the door handle, arms straight, leaning back about 30 degrees with the body in a straight line and the feet planted.
Action: Do 3 rows: pull the chest toward the handle with the elbows driving back, squeeze the shoulder blades, then lower slowly with control.
Show clearly: body in a straight line, elbows drive back, shoulder blades squeeze, slow lowering.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### Y-T-W בשכיבה על הבטן

- **קובץ:** `ytw.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלמעלה בזווית
- **מה לבדוק בסרטון:** שוכבים על הבטן ומרימים ידיים בצורות Y, T ו־W, עם החזקה קצרה למעלה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Prone Y-T-W raises (a pulling exercise).
Camera: static high angle looking down at about 45 degrees from roughly 2 m up, the whole body and the mat fully in frame, camera does not move.
Setup: Lying face down on a mat, forehead hovering just above the floor, arms stretched overhead in a Y shape, thumbs pointing up.
Action: 0-3 s: lift both arms off the floor in the Y shape, hold briefly, lower. 3-5.5 s: arms out to the sides in a T shape, thumbs up, lift, hold, lower. 5.5-8 s: bend the elbows into a W shape, squeezing the shoulder blades together, lift, hold, lower.
Show clearly: neck neutral, thumbs up, shoulder blades squeeze, the lower back stays relaxed with no arching.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתח מתפרץ

- **קובץ:** `explosive-pullup.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** מושכים הכי מהר שאפשר, חזה למוט, וירידה מבוקרת.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Explosive pull-up (a pulling exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand shoulder-width grip, arms straight.
Action: Do 2 explosive pull-ups: pull as fast and powerfully as possible (about 0.6 s) until the chest reaches the bar, then lower slowly under control (about 2 s) to straight arms.
Show clearly: fast powerful pull, chest to the bar, controlled lowering, no kicking.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### טיפוס חבל

- **קובץ:** `rope-climb.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** נעילת חבל עם הרגליים ועזרה מהן. בשלב מתקדם, ידיים בלבד.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Rope climb (a pulling exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing at the base of a thick climbing rope that hangs from the ceiling, a crash mat below.
Action: Climb about 2.5 m up the rope in 2-3 pulls using the foot-lock technique: pull the knees up, pinch the rope between the feet (the rope over the top of one foot and under the sole of the other), stand up by pushing with the legs while the hands reach higher, then repeat.
Show clearly: the feet lock the rope, the legs do most of the work, the hands reach high and stay in control.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## דחיפה

### שכיבות סמיכה

- **קובץ:** `pushup.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** גוף ישר, מרפקים בזווית 45 מעלות, חזה כמעט נוגע ברצפה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Push-ups (a pushing exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank on a mat: hands directly under the shoulders, the body in one straight line from head to heels, feet hip-width apart.
Action: Do 3 push-ups at a steady pace: lower in about 1.5 s with the elbows at roughly 45 degrees from the torso until the chest almost touches the floor, then press up in about 1 s to straight arms.
Show clearly: straight line from head to heels, elbows about 45 degrees, chest almost touching the floor, full lockout.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה איטיות

- **קובץ:** `pu-tempo.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** 3 שניות ירידה, עצירה קצרה למטה ועלייה חזקה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Tempo push-ups (a pushing exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank on a mat: hands directly under the shoulders, the body in one straight line from head to heels.
Action: Show one full slow push-up and the start of a second: lower very slowly over 3 seconds, pause for 1 second with the chest about 2 cm above the floor, then press up powerfully in 1 second.
Show clearly: very slow 3-second lowering, a pause just above the floor, strong press, body stays straight.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה בידיים רחבות

- **קובץ:** `pu-wide.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** ידיים רחבות מהכתפיים, גוף ישר מהראש עד העקבים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Wide push-ups (a pushing exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank with the hands about 1.5 times shoulder-width apart, the body in one straight line from head to heels.
Action: Do 3 wide push-ups: the chest lowers between the hands with the elbows bending outward at about 60-70 degrees, then press back up to straight arms.
Show clearly: hands clearly wider than the shoulders, body straight, chest nearly touching the floor.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה על הברכיים

- **קובץ:** `pu-knee.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** ברכיים על הרצפה, קו ישר מהראש עד הברכיים, חזה כמעט נוגע ברצפה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Knee push-ups (a pushing exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: On a mat with the knees on the floor, hands under the shoulders, the body in one straight line from head to knees (the hips not piked up), ankles crossed in the air.
Action: Do 3 knee push-ups at a steady pace: lower in about 1.5 s until the chest almost touches the floor, then press up to straight arms.
Show clearly: a straight line from head to knees, hips neither sagging nor piked, chest nearly touching the floor.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה יהלום

- **קובץ:** `pu-diamond.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** ידיים צמודות מתחת לחזה בצורת יהלום, מרפקים קרובים לגוף.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Diamond push-ups (a pushing exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank with the hands together directly under the chest, forming a diamond with the thumbs and index fingers touching, the body straight.
Action: Do 3 diamond push-ups: lower with the elbows tucked close to the ribs until the chest almost touches the hands, then press up to straight arms.
Show clearly: hands form a diamond, elbows tucked close to the body, body stays straight.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה עם מחיאת כף

- **קובץ:** `pu-clap.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** דוחפים חזק עד שהידיים עוזבות את הרצפה, מוחאים כף ונוחתים רך עם מרפקים מכופפים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Clap push-ups (a pushing exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank on thick mats, hands under the shoulders, body straight.
Action: Do 2 clap push-ups: lower until the chest is close to the floor, then press up explosively so that both hands leave the floor, clap quickly in the air, and land softly on both hands with the elbows bending straight into the next repetition.
Show clearly: explosive press, hands clear the floor, a quick clap, soft landing with bent elbows, body stays straight.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה קשת (ארצ׳ר)

- **קובץ:** `pu-archer.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** ידיים רחבות: יורדים לצד אחד כשהיד השנייה נשארת ישרה, ואז מחליפים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Archer push-ups (a pushing exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank with the hands very wide (about twice shoulder width), fingers pointing slightly outward, feet wider than the hips.
Action: Do 4 archer push-ups, alternating sides: lower the body toward the right hand by bending the right elbow while the left arm stays completely straight along the floor, press back up, then lower toward the left hand with the right arm straight. Right, left, right, left.
Show clearly: one arm bends while the other stays straight, the hips stay level, controlled movement.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבת סמיכה ביד אחת עם עזרה

- **קובץ:** `pu-one-assist.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** רגליים פשוקות לרוחב, יד אחת מתחת לחזה והשנייה מאחורי הגב. יורדים לאט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Assisted one-arm push-up (a pushing exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A wide plank with the feet very wide apart (about 1.2 m), the right hand directly under the chest, the left hand resting with its fingertips lightly on the mat beside the chest for a little help; the body is straight.
Action: Do 2 slow assisted one-arm push-ups on the right arm: lower in about 2 s with a slight natural rotation of the torso, then press up in about 1 s, with the left fingertips giving only light help.
Show clearly: feet wide apart, light help from the free fingertips, slow lowering, hips stay level.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבת סמיכה ביד אחת

- **קובץ:** `pu-one.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** רגליים פשוקות, גוף יציב ובלי סיבוב באגן. ירידה ועלייה מבוקרות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: One-arm push-up (a pushing exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A plank with the feet only slightly wider than the shoulders, the right hand directly under the chest, the left hand resting behind the lower back; the body is straight and the hips are square to the floor.
Action: Do 2 one-arm push-ups on the right arm: lower in about 2 s with a straight body and no twisting, then press up in about 1 s to a straight arm.
Show clearly: the free hand stays behind the back, hips square to the floor with no twisting, slow lowering, full press.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבת סמיכה ביד אחת עם מחיאת כף

- **קובץ:** `pu-one-clap.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** דחיפה מתפרצת, היד עוזבת את הרצפה, מוחאת כף ונוחתת רך. רק אחרי שהגרסה בלי מחיאה קלה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: One-arm clap push-up (a pushing exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A one-arm plank on thick mats: the right hand directly under the chest, feet wide apart, the left hand held close in front of the chest.
Action: Do 1 one-arm clap push-up: lower under control, then press up explosively so that the working hand leaves the floor, claps against the other hand held in front of the chest, and lands softly again on the working hand.
Show clearly: an explosive press, a hand clap against the free hand, a soft landing on a bent elbow, body stays straight.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## ליבה

### הולו הולד

- **קובץ:** `hollow.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** גב תחתון צמוד לרצפה, ידיים ורגליים מורמות, כמו בננה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Hollow hold (a core exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Lying on the back on a mat, arms stretched overhead beside the ears, legs straight and together.
Action: In the first second lift the shoulders, arms and straight legs about 15-20 cm off the floor into a shallow banana shape, with the lower back pressed firmly into the mat. Hold perfectly still for about 6 seconds with the chin slightly tucked, then lower back down.
Show clearly: lower back stays glued to the floor, legs straight, a shallow banana shape, ribs down.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### דד באג

- **קובץ:** `dead-bug.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלמעלה בזווית
- **מה לבדוק בסרטון:** גב צמוד לרצפה, מושיטים לאט יד ורגל נגדיות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Dead bug (a core exercise).
Camera: static high angle looking down at about 45 degrees from roughly 2 m up, the whole body and the mat fully in frame, camera does not move.
Setup: Lying on the back, arms pointing straight up at the ceiling, hips and knees bent at 90 degrees (tabletop).
Action: Do 4 slow repetitions: lower the right arm overhead and the left leg straight out toward the floor at the same time without touching it, keeping the lower back pressed to the mat; return to the start; then the opposite arm and leg. Right, left, right, left.
Show clearly: the lower back stays pressed down, slow movement, opposite arm and leg, breathe out as the limbs extend.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הרמות ברכיים בתלייה

- **קובץ:** `hang-knee.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** בלי תנופה: מרימים ברכיים לחזה ויורדים לאט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Hanging knee raises (a core exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar, arms straight, body still, legs together.
Action: Do 3 hanging knee raises: curl the knees up toward the chest by tilting the pelvis, then lower slowly with control. No swinging.
Show clearly: no swinging, the pelvis tilts, knees reach the chest, slow lowering.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### בהונות למוט

- **קובץ:** `toes-bar.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** מכווצים בטן, מרימים רגליים ישרות עד שהבהונות נוגעות במוט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Toes-to-bar (a core exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip, arms straight.
Action: Do 2 toes-to-bar: keep the legs straight, lift them in a controlled motion until the toes touch the bar, then lower slowly under control. Minimal swinging.
Show clearly: straight legs, the toes touch the bar, controlled lowering, minimal swing.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### פלאנק

- **קובץ:** `plank.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** קו ישר מהראש עד העקבים, בטן ועכוז מכווצים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Plank (a core exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A forearm plank on a mat: elbows directly under the shoulders, forearms parallel, the body in one straight line from head to heels, glutes and abs tight, neck neutral looking at the floor.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement.
Show clearly: a straight line from head to heels, hips neither sagging nor piked, tight glutes and abs, relaxed neck.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### פלאנק צידי

- **קובץ:** `side-plank.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** אגן גבוה, כתף מעל המרפק, נשימה רגועה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Side plank (a core exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A side plank on the right forearm: the elbow directly under the shoulder, feet stacked, hips lifted so the body forms a straight diagonal line, the free hand on the hip.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement.
Show clearly: hips lifted in a straight line, elbow under the shoulder, no sagging, steady breathing.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## רגליים

### קפיצות סקוואט

- **קובץ:** `squat-jump.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** יורדים לסקוואט, מתפוצצים למעלה ונוחתים שקט ורך.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Squat jumps (a leg exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall, feet shoulder-width apart.
Action: Do 2 squat jumps: sink into a squat with the thighs about parallel to the floor and the arms swinging back, explode upward with full extension and the arms swinging up, then land softly and quietly with bent knees, flowing straight into the next squat.
Show clearly: knees track over the toes, full extension at the top, a soft quiet landing.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### קפיצה למרחק

- **קובץ:** `broad-jump.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** תנופת ידיים, קפיצה קדימה ונחיתה יציבה על שתי רגליים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Broad jump (a leg exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Standing at a line on the mat, feet hip-width apart.
Action: Swing the arms back and sink into a quarter squat, then swing the arms forward and jump forward as far as possible with a full hip extension, land on both feet with bent knees and hold the landing still for 1 second.
Show clearly: arm swing, full extension, a soft landing held for 1 second, knees track over the toes.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### קפיצה על ספסל או ארגז

- **קובץ:** `box-jump.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** קופצים למעלה ויורדים בצעד, לא בקפיצה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Box jump (a leg exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing facing a sturdy plyometric box about 50 cm high, feet shoulder-width apart.
Action: Do 2 box jumps: swing the arms and jump onto the box, landing softly on both whole feet in a quiet athletic squat, stand up fully on the box, then STEP down backward one foot at a time (do not jump down) and reset.
Show clearly: a soft landing with the whole foot on the box, stand tall at the top, step down and do not jump down.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### סקוואט בולגרי

- **קובץ:** `split-squat.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** רגל אחורית על כיסא, יורדים לאט עם גב זקוף.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Bulgarian split squat (a leg exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing in a split stance a long stride in front of a bench, the top of the rear foot resting on the bench behind, hands on the hips (a Bulgarian split squat).
Action: Do 3 repetitions: lower straight down in about 2 s until the rear knee almost touches the floor, torso upright, the front knee over the middle of the front foot; then press back up.
Show clearly: upright torso, the front knee over the middle of the foot, the rear knee nearly touches the floor, controlled.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### גשר עכוז

- **קובץ:** `glute-bridge.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** דוחפים דרך העקבים, מרימים את האגן ומחזיקים שנייה למעלה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Glute bridge (a leg exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Lying on the back, knees bent, feet flat on the floor hip-width apart, arms along the sides.
Action: Do 3 repetitions: push through the heels and lift the hips until the body forms a straight line from the knees to the shoulders, squeeze the glutes and hold for 1 second, then lower slowly.
Show clearly: a straight line from knees to shoulders, squeeze the glutes, ribs down, no over-arching.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### ישיבה על קיר

- **קובץ:** `wall-sit.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** ירכיים מקבילות לרצפה, גב צמוד לקיר.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Wall sit (a leg exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Back flat against a wall, thighs parallel to the floor, knees at 90 degrees directly above the ankles, arms crossed in front of the chest (not resting on the thighs).
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement.
Show clearly: thighs parallel to the floor, knees above the ankles, back flat on the wall, hands not on the thighs.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### ספרינט 15 מטר

- **קובץ:** `sprint.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** האצה מלאה, חוזרים בהליכה ונחים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: 15 m sprint (a leg exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Standing in a split-stance start position on a clear straight 15 m track, leaning forward.
Action: Sprint 15 m with a powerful acceleration: a strong forward lean at the start that rises gradually, high knee drive, a fast arm swing; then slow down and stop at the end line.
Show clearly: forward lean while accelerating, powerful arm drive, landing on the balls of the feet.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### ריצה לקיר ענק

- **קובץ:** `warped-run.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** ריצה בקו ישר, 2–3 צעדים על הקיר, יד מושטת לשפה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Warped wall runs (a leg exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: The athlete stands about 10 m from a curved warped wall about 3.5 m tall, with a padded landing area below.
Action: Run toward the wall in a straight line, plant the foot on the curve for two to three steps up the wall, and reach with the outstretched hand toward the top edge; the clip ends as the hand catches the top edge.
Show clearly: a straight fast approach, planted steps up the wall, reaching for the top lip.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## איזון

### עמידה על רגל אחת

- **קובץ:** `single-leg.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** מתקדמים? עוצמים עיניים או עומדים על כרית.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Single-leg stand (a balance exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing on the right leg with the left knee lifted slightly so the foot is off the floor, arms held slightly out for balance, eyes looking forward.
Action: Hold the position perfectly still for about 6 seconds, with only natural breathing movement. Tiny natural balance adjustments are fine.
Show clearly: hips level, a soft standing knee, eyes forward, steady.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הליכה על קו, עקב־בוהן

- **קובץ:** `line-walk.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** 4 מטרים על קו ישר, מבט קדימה, ידיים לצדדים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Heel-to-toe line walk (a balance exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A straight strip of tape on the floor; the athlete stands at the start of the line with the arms held out to the sides.
Action: Walk heel-to-toe along the line with slow controlled steps (about 6 steps), each heel touching the toes of the other foot, eyes looking forward.
Show clearly: heel touches toe on every step, arms out for balance, eyes forward, slow and controlled.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הליכה על קורה

- **קובץ:** `beam-walk.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** מבט לסוף הקורה, צעדים קצרים, גוף רגוע.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Beam walk (a balance exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A low balance beam about 20 cm high and 10 cm wide lying on the mat; the athlete stands at one end with the arms out.
Action: Walk the length of the beam with short steps, arms out for balance, eyes on the end of the beam, relaxed body.
Show clearly: short steps, eyes on the end of the beam, arms out, relaxed body.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### קפיצות דיוק

- **קובץ:** `precision-jumps.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** מסמנים נקודות על הרצפה וקופצים לנחיתה שקטה בדיוק על הסימן.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Precision jumps (a balance exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Three small squares of coloured tape on the mat, spaced about 1 m apart in a zig-zag; the athlete stands on the first one.
Action: Jump from square to square, landing quietly on the balls of both feet exactly on each mark, and freeze for a second after each landing; three jumps in total.
Show clearly: land exactly on the mark, a quiet landing, freeze for a second, knees soft.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### ניתורים צידיים

- **קובץ:** `lateral-bounds.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** קפיצה מרגל לרגל לצדדים, עוצרים שנייה בכל נחיתה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Lateral bounds (a balance exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing on the right leg, the left foot off the floor.
Action: Do 4 skater bounds from side to side: push off one leg to leap sideways, land on the opposite leg with a soft knee, freeze for half a second, the arms swinging across the body; the trailing leg stays off the floor.
Show clearly: land on one leg with a soft knee, freeze on each landing, knee over the toes, arms swing.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מדרגות מחומשות

- **קובץ:** `q-steps.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** שומרים על תנופה: מרגל לרגל באלכסון, בלי לעצור.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Quintuple steps (a balance exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: A row of five angled foam stepping pads about 1 m apart, placed along a padded floor; the athlete stands at the first pad.
Action: Cross the pads quickly in a bounding rhythm, one foot per pad, left-right-left-right, touching each pad lightly with the ball of the foot and keeping the momentum without stopping.
Show clearly: one foot per pad, light touches on the ball of the foot, continuous momentum, eyes ahead.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## תנופה

### תנופה במוט (קיפ)

- **קובץ:** `kip-swing.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** התנועה מהאגן: חזה קדימה ורגליים מאחור, ואז הפוך. ידיים ישרות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Kip swing (a swinging exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip, arms straight.
Action: Do 3 smooth kipping swings: swing the feet forward into a slight hollow shape with the chest back, then swing back into a slight arch with the chest pushed forward through the arms and the legs behind, driving the movement from the hips. The arms stay straight throughout.
Show clearly: arms stay straight, the movement comes from the hips, a smooth rhythm, no pulling with the arms.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### תנופה בטבעות

- **קובץ:** `ring-swing.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** תנופה מבוקרת קדימה ואחורה, כתפיים פעילות.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Ring swings (a swinging exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from two gymnastic rings at shoulder width, arms straight.
Action: Do 3 controlled forward and backward swings like a pendulum, keeping the shoulders active (pulled down, not shrugged) and the body tight; the rings stay close together.
Show clearly: shoulders active, a tight body, a controlled pendulum swing, the rings stay together.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מעבר בין טבעות

- **קובץ:** `ring-traverse.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מצלמה נעה
- **מה לבדוק בסרטון:** תנופה, תופסים את הטבעת הבאה ביד הקדמית ורק אז משחררים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Ring traverse (a swinging exercise).
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Under a row of three gymnastic rings hanging from a rig about 1 m apart, the athlete hanging from the first ring.
Action: Travel across the rings: swing forward, reach and grab the second ring with the lead hand, release the rear hand, swing again, then grab the third ring; the swing keeps going.
Show clearly: use the swing, the lead hand grabs before the rear hand lets go, eyes on the next ring.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### לאץ׳: שחרור ותפיסה

- **קובץ:** `lache.mp4`
- **סיכוי לצאת נכון:** קשה ל־AI
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** תנופה גדולה, שחרור בשיא התנופה קדימה ומבט על המוט הבא.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Lache bar-to-bar (a swinging exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Under two horizontal bars of a ninja rig about 1.5 m apart, with a deep foam pit below; the athlete hangs from the first bar.
Action: Swing back and forward twice, and at the peak of the forward swing release the first bar, fly forward and catch the second bar with both hands; the clip ends as the athlete hangs from the second bar.
Show clearly: a big swing, release at the peak of the forward swing, eyes on the next bar, catch with both hands.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## שחרור

### מתיחת אמות

- **קובץ:** `stretch-forearm.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** תקריב
- **מה לבדוק בסרטון:** יד ישרה, מושכים בעדינות את האצבעות אחורה. 20 שניות לכל כיוון.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Forearm stretch (a stretching and recovery exercise).
Camera: static medium close-up from the waist up, hands and forearms clearly visible, camera does not move.
Setup: Standing, the right arm extended straight forward at chest height with the palm facing up.
Action: 0-4 s: with the left hand gently pull the right fingers down and back so the forearm stretches. 4-8 s: turn the right palm down and gently pull the fingers back toward the body. A gentle stretch, no force.
Show clearly: straight arm, a gentle pull only, no pain, relaxed shoulders.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתיחת כתפיים וחזה

- **קובץ:** `stretch-shoulder.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים בזווית
- **מה לבדוק בסרטון:** יד על משקוף, מסובבים את הגוף החוצה לאט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Shoulder & chest stretch (a stretching and recovery exercise).
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing in a doorway with the right forearm resting vertically against the door frame, the elbow bent at 90 degrees at shoulder height.
Action: Slowly turn the body away from the frame to open the chest and the front of the shoulder, hold the stretch for about 5 seconds, then release.
Show clearly: elbow at shoulder height, a slow turn, a gentle stretch across the chest.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתיחת מכופפי ירך

- **קובץ:** `stretch-hip.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** ברך על הרצפה, אגן קדימה, גב זקוף.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Hip flexor stretch (a stretching and recovery exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Half-kneeling on a mat: the right knee on the floor (on a pad), the left foot flat forward with the knee at 90 degrees, torso upright, hands on the front thigh.
Action: Tuck the pelvis slightly and shift the hips gently forward until a stretch is felt at the front of the right hip; hold for about 6 seconds with a tall torso.
Show clearly: a tall torso, the pelvis tucked, the stretch at the front of the hip.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתיחה אחורית לרגליים

- **קובץ:** `stretch-ham.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מהצד
- **מה לבדוק בסרטון:** רגל ישרה על משטח נמוך, מתכופפים מהאגן עם גב ישר.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Hamstring stretch (a stretching and recovery exercise).
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing facing a low bench; the right heel rests on the bench with the leg straight and toes up; the left leg is straight and standing.
Action: Hinge forward from the hips with a flat back, reaching the hands toward the toes until a stretch is felt behind the right thigh; hold for about 5 seconds.
Show clearly: a flat back, hinge from the hips, the knee straight but not locked.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### פתיחת בית חזה בשכיבה צידית

- **קובץ:** `open-book.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלמעלה בזווית
- **מה לבדוק בסרטון:** שוכבים על הצד, ברכיים מכופפות, פותחים את היד העליונה כמו ספר.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Open book (a stretching and recovery exercise).
Camera: static high angle looking down at about 45 degrees from roughly 2 m up, the whole body and the mat fully in frame, camera does not move.
Setup: Lying on the left side on a mat, hips and knees bent to 90 degrees and stacked, both arms stretched forward with the palms together.
Action: Do 3 repetitions: lift the right arm and open it across the chest like opening a book toward the other side while the eyes follow the hand and the knees stay stacked; pause for 1 second at the end, then return.
Show clearly: the knees stay stacked, the eyes follow the hand, the rotation comes from the upper back.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### נשימה 4-4-4

- **קובץ:** `breathe.mp4`
- **סיכוי לצאת נכון:** סיכוי טוב
- **מצלמה:** מלפנים
- **מה לבדוק בסרטון:** שאיפה 4 שניות, החזקה 4, נשיפה 4.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Exercise: Box breathing (a stretching and recovery exercise).
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Sitting cross-legged on a mat, hands resting on the knees, back tall, eyes closed or soft.
Action: Slow box breathing: breathe in through the nose for 4 seconds so that the belly and ribs gently expand, then hold the breath for 4 seconds with calm shoulders (the clip shows the first half of a 4-4-4 breathing cycle).
Show clearly: the belly and ribs expand, calm shoulders, a slow even rhythm.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

## טעויות נפוצות

תייגו את הסרטונים האלה באדום באפליקציה כ"טעות נפוצה", ותמיד הציגו אותם אחרי הסרטון הנכון של אותו תרגיל.

### משיכות שכמות: כיפוף מרפקים ותנופה

- **קובץ:** `scap-pulls-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מאחור
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: תלייה בידיים ישרות: מושכים את השכמות למטה ואחורה בלי לכופף מרפקים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Scapular pulls (a warm-up exercise), performed with bad form on purpose so that viewers learn what to avoid: bending the elbows and swinging.
Camera: static shot from directly behind the athlete at shoulder height, the whole body and the bar fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand shoulder-width grip, arms fully straight, feet off the floor.
Action: The athlete bends the elbows to pull the body up like a small pull-up and swings the legs, instead of moving only the shoulder blades. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### תלייה מתה: כתפיים פסיביות ומכווצות

- **קובץ:** `dead-hang-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: אחיזה מלאה עם האגודל וכתפיים פעילות. לא שוקעים בכתפיים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Dead hang (a grip exercise), performed with bad form on purpose so that viewers learn what to avoid: passive, shrugged shoulders.
Camera: static front-on shot, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip at shoulder width, thumbs wrapped around the bar, arms fully straight, feet off the floor, legs together.
Action: The athlete hangs with the shoulders shrugged up to the ears, loose arms, and the body slowly swinging from side to side. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הליכת חקלאי: הטיה ותנופת משקולות

- **קובץ:** `farmer-carry-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מצלמה נעה
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: משקל כבד בכל יד, גב זקוף, צעדים קצרים ושקטים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Farmer carry (a grip exercise), performed with bad form on purpose so that viewers learn what to avoid: leaning and swinging.
Camera: smooth, slow lateral tracking shot that follows the athlete at the same speed, the whole body always in frame, no zoom.
Setup: Standing tall holding a heavy dumbbell in each hand at the sides.
Action: The athlete leans to one side with a rounded upper back and shrugged shoulders, and the weights swing back and forth. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### מתח: חצי חזרות עם בעיטות

- **קובץ:** `pullup-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מלפנים בזווית
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: מתחילים מתלייה מלאה, סנטר מעל המוט, בלי טלטולים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Pull-up (a pulling exercise), performed with bad form on purpose so that viewers learn what to avoid: half reps with kicking.
Camera: static three-quarter front angle, camera at chest height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Hanging from a pull-up bar with an overhand grip at shoulder width, arms straight, legs together and still.
Action: The athlete does 2 sloppy pull-ups: kicking and swinging the legs, stopping with the chin below the bar, not straightening the arms at the bottom, and craning the neck forward. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### חתירה אוסטרלית: אגן שוקע וטווח קצר

- **קובץ:** `aus-row-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: מוט נמוך, גוף ישר כמו קרש, מושכים את החזה למוט.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Australian row (a pulling exercise), performed with bad form on purpose so that viewers learn what to avoid: sagging hips and short range.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Lying on the back under a bar set at waist height, the athlete holds the bar overhand at shoulder width with straight arms, heels on the floor, the body straight like a plank.
Action: The hips sag toward the floor, the body bends at the waist, and the athlete only pulls halfway without the chest reaching the bar. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### שכיבות סמיכה: אגן שוקע ומרפקים פתוחים

- **קובץ:** `pushup-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: גוף ישר, מרפקים בזווית 45 מעלות, חזה כמעט נוגע ברצפה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Push-ups (a pushing exercise), performed with bad form on purpose so that viewers learn what to avoid: sagging hips and flared elbows.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A high plank on a mat: hands directly under the shoulders, the body in one straight line from head to heels, feet hip-width apart.
Action: The hips sag toward the floor, the elbows flare straight out to the sides at 90 degrees, the head drops forward, and the range is only half. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### הולו הולד: קשת בגב התחתון

- **קובץ:** `hollow-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: גב תחתון צמוד לרצפה, ידיים ורגליים מורמות, כמו בננה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Hollow hold (a core exercise), performed with bad form on purpose so that viewers learn what to avoid: arched lower back.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Lying on the back on a mat, arms stretched overhead beside the ears, legs straight and together.
Action: The legs are lifted but the lower back arches away from the mat leaving a visible gap, the knees are slightly bent, and the neck strains forward. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### פלאנק: אגן שוקע

- **קובץ:** `plank-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: קו ישר מהראש עד העקבים, בטן ועכוז מכווצים.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Plank (a core exercise), performed with bad form on purpose so that viewers learn what to avoid: sagging hips.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: A forearm plank on a mat: elbows directly under the shoulders, forearms parallel, the body in one straight line from head to heels, glutes and abs tight, neck neutral looking at the floor.
Action: The hips sag toward the floor, the lower back is arched, and the head hangs down. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### קפיצות סקוואט: ברכיים נכנסות פנימה

- **קובץ:** `squat-jump-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: יורדים לסקוואט, מתפוצצים למעלה ונוחתים שקט ורך.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Squat jumps (a leg exercise), performed with bad form on purpose so that viewers learn what to avoid: knees collapsing inward.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing tall, feet shoulder-width apart.
Action: On landing the knees collapse inward toward each other, the legs are stiff, and the landing is loud and heavy. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### קפיצה על ספסל או ארגז: קפיצה חזרה למטה

- **קובץ:** `box-jump-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: קופצים למעלה ויורדים בצעד, לא בקפיצה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Box jump (a leg exercise), performed with bad form on purpose so that viewers learn what to avoid: jumping down hard.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Standing facing a sturdy plyometric box about 50 cm high, feet shoulder-width apart.
Action: After standing on the box the athlete jumps down and lands with stiff straight legs in a heavy, loud landing. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

### גשר עכוז: קשת מוגזמת בגב

- **קובץ:** `glute-bridge-mistake.mp4`
- **סיכוי לצאת נכון:** יוצא לפעמים
- **מצלמה:** מהצד
- **מה אמור להיראות:** הסרטון מציג טעות בכוונה. הנכון: דוחפים דרך העקבים, מרימים את האגן ומחזיקים שנייה למעלה.

```text
Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.

Common-mistake demonstration of Glute bridge (a leg exercise), performed with bad form on purpose so that viewers learn what to avoid: over-arching the back.
Camera: static side-on profile shot, camera at hip height about 3 m away, the whole body and all equipment fully in frame, camera does not move.
Setup: Lying on the back, knees bent, feet flat on the floor hip-width apart, arms along the sides.
Action: The hips are pushed too high so the lower back arches sharply and the ribs flare up. Keep the movement realistic and not dangerous.

No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.
```

