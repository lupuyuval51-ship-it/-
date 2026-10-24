import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sprite", "a character or object in a project that you can give its own blocks of code", "דמות", "שחקן או חפץ בפרויקט שאפשר לתת לו לבני קוד משלו"],
      ["Stage", "the background area where the characters move and where the project is shown", "במה", "האזור שברקע, שבו הדמויות זזות ושבו מוצג הפרויקט"],
      ["Costume", "one of the looks a sprite can have; switching between them can make it seem to move", "תלבושת", "אחד המראות שיכולים להיות לדמות; מעבר ביניהם יכול לגרום לה להיראות כאילו היא זזה"],
    ],
    q: [
      [["Which block starts a script when you click the green flag?", "when green flag clicked", ["when this sprite clicked", "forever", "move 10 steps"], "when green flag clicked is an event block: the script under it starts each time someone clicks the green flag above the stage."],
        ["איזו לבנה מתחילה תסריט כשלוחצים על הדגל הירוק?", "״כאשר לוחצים על הדגל הירוק״", ["״כאשר לוחצים על דמות זו״", "״לעולמים״", "״זוז 10 צעדים״"], "״כאשר לוחצים על הדגל הירוק״ היא לבנת אירוע: התסריט שמתחתיה מתחיל בכל פעם שמישהו לוחץ על הדגל הירוק שמעל הבמה."]],
      [["What does the red stop sign next to the green flag do?", "Stops all the scripts that are running", ["Deletes the selected sprite from the project", "Saves the project on the computer", "Paints every sprite on the stage red"], "The stop sign ends every running script at once. It does not delete, save or paint anything."],
        ["מה עושה תמרור העצירה האדום שליד הדגל הירוק?", "עוצר את כל התסריטים שרצים", ["מוחק מהפרויקט את הדמות שנבחרה", "שומר את הפרויקט במחשב", "צובע באדום את כל הדמויות שעל הבמה"], "תמרור העצירה עוצר בבת אחת כל תסריט שרץ. הוא לא מוחק, לא שומר ולא צובע שום דבר."]],
      [["What does the block  move 10 steps  do?", "Moves the sprite 10 steps the way it is pointing", ["Moves the sprite 10 steps up, whatever way it points", "Makes the sprite grow 10 times bigger", "Makes the sprite wait for 10 seconds"], "move goes forward in the sprite's current direction. To go a different way, the sprite must first turn or point in a new direction."],
        ["מה עושה הלבנה ״זוז 10 צעדים״?", "מזיזה את הדמות 10 צעדים לכיוון שאליו היא פונה", ["מזיזה את הדמות 10 צעדים למעלה, לאן שלא תפנה", "מגדילה את הדמות פי 10", "גורמת לדמות לחכות 10 שניות"], "הלבנה מזיזה את הדמות קדימה בכיוון שאליו היא פונה עכשיו. כדי לזוז לכיוון אחר, הדמות צריכה קודם להסתובב או לפנות לכיוון חדש."]],
      [["Which block runs the blocks inside it again and again until the project is stopped?", "forever", ["repeat 10", "wait 1 seconds", "say Hello!"], "forever never ends by itself; it keeps repeating until the stop sign is clicked. repeat 10 stops after 10 rounds."],
        ["איזו לבנה מריצה את הלבנים שבתוכה שוב ושוב, עד שעוצרים את הפרויקט?", "״לעולמים״ (forever)", ["״חזור 10 פעמים״ (repeat)", "״חכה 1 שניות״ (wait)", "״אמור שלום!״ (say)"], "הלבנה ״לעולמים״ אף פעם לא נגמרת מעצמה: היא חוזרת שוב ושוב עד שלוחצים על תמרור העצירה. ״חזור 10 פעמים״ נעצרת אחרי 10 סיבובים."]],
      [["Which character appears in every new Scratch project?", "An orange cat", ["A blue dog", "A green dinosaur", "A pink bird"], "Each new project starts with one sprite: the orange Scratch Cat, which is also the mascot of Scratch."],
        ["איזו דמות מופיעה בכל פרויקט חדש בסקראץ׳?", "חתול כתום", ["כלב כחול", "דינוזאור ירוק", "ציפור ורודה"], "כל פרויקט חדש מתחיל עם דמות אחת: החתול הכתום של סקראץ׳, שהוא גם הקמע של סקראץ׳."]],
    ],
    n: [
      [40, ["A  repeat 4  block has  move 10 steps  inside it. How many steps does the sprite move in all?", "steps", "The move happens 4 times, 10 steps each time: 4 × 10 = 40 steps."],
        ["בתוך הלבנה ״חזור 4 פעמים״ יש לבנה ״זוז 10 צעדים״. כמה צעדים זזה הדמות בסך הכול?", "צעדים", "התנועה קורית 4 פעמים, 10 צעדים בכל פעם, ולכן 4 × 10 = 40 צעדים."]],
    ],
    s: [
      [["Making and testing a project", "Pick a sprite or draw one", "Drag blocks into its code area and snap them together", "Click the green flag to run the script", "Watch the stage and fix whatever goes wrong"],
        ["יוצרים ובודקים פרויקט", "בוחרים דמות או מציירים אחת", "גוררים לבנים לאזור הקוד שלה ומחברים אותן", "לוחצים על הדגל הירוק כדי להריץ את התסריט", "צופים בבמה ומתקנים את מה שלא עובד"]],
    ],
  },
  i: {
    t: [
      ["Backdrop", "a picture that fills the whole stage behind all the sprites", "רקע", "תמונה שממלאת את כל הבמה מאחורי כל הדמויות"],
      ["x position", "the number that says how far left or right a sprite is on the stage", "מיקום x", "המספר שאומר כמה ימינה או שמאלה נמצאת דמות על הבמה"],
      ["y position", "the number that says how far up or down a sprite is on the stage", "מיקום y", "המספר שאומר כמה למעלה או למטה נמצאת דמות על הבמה"],
    ],
    q: [
      [["What are the x and y of the exact middle of the stage?", "x: 0, y: 0", ["x: 0, y: 180", "x: 240, y: 180", "x: 480, y: 360"], "The middle of the stage is the point (0, 0). x goes from -240 on the left to 240 on the right, and y from -180 at the bottom to 180 at the top."],
        ["מהם x ו־y של הנקודה שנמצאת בדיוק באמצע הבמה?", "x: 0, y: 0", ["x: 0, y: 180", "x: 240, y: 180", "x: 480, y: 360"], "אמצע הבמה הוא הנקודה (0, 0). ציר x עובר ממינוס 240 בצד שמאל עד 240 בצד ימין, וציר y ממינוס 180 למטה עד 180 למעלה."]],
      [["A sprite runs  change y by 10 . Which way does it move?", "Up, by 10 steps", ["Down, by 10 steps", "Right, by 10 steps", "Nowhere; it grows bigger"], "y is the up-and-down position, and adding to y moves a sprite higher. A negative number, such as change y by -10, would move it down."],
        ["דמות מריצה ״שנה את ערך y ב־10״. לאן היא זזה?", "למעלה, 10 צעדים", ["למטה, 10 צעדים", "ימינה, 10 צעדים", "לשום מקום; היא גדלה"], "y הוא המיקום למעלה ולמטה, והוספה ל־y מזיזה את הדמות גבוה יותר. מספר שלילי, כמו שינוי של y במינוס 10, היה מזיז אותה למטה."]],
      [["Which block changes a sprite to its next look?", "next costume", ["next backdrop", "change size by 10", "show"], "next costume switches the sprite to the following costume in its list. next backdrop changes the picture of the stage instead."],
        ["איזו לבנה מחליפה דמות למראה הבא שלה?", "״התלבושת הבאה״", ["״הרקע הבא״", "״שנה גודל ב־10״", "״הצג״"], "״התלבושת הבאה״ מעבירה את הדמות לתלבושת הבאה ברשימה שלה. ״הרקע הבא״ מחליפה דווקא את התמונה של הבמה."]],
      [["Which block repeats the blocks inside it an exact number of times and then moves on?", "repeat 10", ["forever", "wait until", "if then"], "repeat runs the blocks inside it the number of times written in it, then carries on with the next block. forever never moves on."],
        ["איזו לבנה חוזרת על הלבנים שבתוכה מספר מדויק של פעמים ואז ממשיכה הלאה?", "״חזור 10 פעמים״", ["״לעולמים״", "״חכה עד ש...״", "״אם ... אז״"], "״חזור 10 פעמים״ מריצה את הלבנים שבתוכה כמספר הפעמים שכתוב בה, ואז ממשיכה ללבנה הבאה. ״לעולמים״ אף פעם לא ממשיכה הלאה."]],
      [["Blocks like  move 10 steps  and  turn 15 degrees  belong to which group?", "Motion, the blue blocks", ["Looks, the purple blocks", "Events, the yellow blocks", "Sound, the pink blocks"], "Motion blocks are blue, and they move or turn sprites. Looks blocks are purple, Events blocks yellow and Sound blocks pink."],
        ["לבנים כמו ״זוז 10 צעדים״ ו״הסתובב 15 מעלות״ שייכות לאיזו קבוצה?", "תנועה, הלבנים הכחולות", ["מראה, הלבנים הסגולות", "אירועים, הלבנים הצהובות", "צלילים, הלבנים הוורודות"], "לבני התנועה כחולות, והן מזיזות ומסובבות דמויות. לבני המראה סגולות, לבני האירועים צהובות ולבני הצלילים ורודות."]],
    ],
    n: [
      [80, ["A sprite starts at x: 50 and runs  change x by 10  three times. What is its x now?", "", "Each run adds 10 to x, so 50 + 10 + 10 + 10 = 80."],
        ["דמות מתחילה ב־x: 50 ומריצה שלוש פעמים ״שנה את ערך x ב־10״. מה ה־x שלה עכשיו?", "", "כל הרצה מוסיפה 10 ל־x, ולכן 50 + 10 + 10 + 10 = 80."]],
      [480, ["The stage goes from x = -240 at the left edge to x = 240 at the right edge. How many steps wide is it?", "steps", "From -240 up to 0 is 240 steps, and from 0 to 240 is 240 more: 240 + 240 = 480."],
        ["הבמה משתרעת מ־x שווה מינוס 240 בקצה השמאלי עד x שווה 240 בקצה הימני. כמה צעדים רוחבה?", "צעדים", "ממינוס 240 עד 0 יש 240 צעדים, ומ־0 עד 240 יש עוד 240, ולכן 240 + 240 = 480."]],
    ],
    s: [
      [["Directions in Scratch, turning clockwise from straight up", "0 (up)", "90 (right)", "180 (down)", "-90 (left)"],
        ["הכיוונים בסקראץ׳, בסיבוב עם כיוון השעון החל מלמעלה", "0 (למעלה)", "90 (ימינה)", "180 (למטה)", "מינוס 90 (שמאלה)"]],
    ],
  },
  a: {
    t: [
      ["Broadcast", "sending a message that other sprites or the stage can react to with a matching hat block", "שידור מסר", "שליחת הודעה שדמויות אחרות או הבמה יכולות להגיב לה בלבנת כובע מתאימה"],
      ["Clone", "a copy of a sprite that a script makes, which can run scripts of its own", "כפיל (clone)", "עותק של דמות שתסריט יוצר, ויכול להריץ תסריטים משלו"],
      ["Hat block", "a block with a rounded top that starts a script when its event happens", "לבנת כובע", "לבנה עם חלק עליון מעוגל, שמתחילה תסריט כשהאירוע שלה קורה"],
    ],
    q: [
      [["The cat sprite runs  broadcast start . Which block lets the dog sprite react to it?", "when I receive start", ["broadcast start and wait", "when this sprite clicked", "when green flag clicked"], "A message is heard through a when I receive block with the same message name. broadcast and wait also sends a message; it does not receive one."],
        ["דמות החתול מריצה ״שדר מסר התחלה״. איזו לבנה מאפשרת לדמות הכלב להגיב?", "״כאשר מתקבל מסר התחלה״", ["״שדר מסר התחלה וחכה״", "״כאשר לוחצים על דמות זו״", "״כאשר לוחצים על הדגל הירוק״"], "שומעים מסר בעזרת לבנת ״כאשר מתקבל מסר״ עם אותו שם של מסר. ״שדר מסר וחכה״ גם היא שולחת מסר, ולא מקבלת אותו."]],
      [["A variable is made  For all sprites . Who can use it?", "Every sprite and the stage", ["Only the sprite that made it", "Only the stage", "Only the clones of that sprite"], "For all sprites makes a global variable that every sprite, and the stage, can read and change. For this sprite only would limit it to one sprite."],
        ["משתנה נוצר עם האפשרות ״לכל הדמויות״. מי יכול להשתמש בו?", "כל הדמויות וגם הבמה", ["רק הדמות שיצרה אותו", "רק הבמה", "רק הכפילים של אותה דמות"], "״לכל הדמויות״ יוצרת משתנה כללי שכל דמות, וגם הבמה, יכולות לקרוא ולשנות. ״רק לדמות זו״ הייתה מגבילה אותו לדמות אחת."]],
      [["While a project runs, a sprite makes 5 clones of itself. What happens to them when the stop sign is clicked?", "They are deleted, and only the original sprite is left", ["They are saved and come back at the next click on the green flag", "They are added to the sprite list as 5 new sprites", "They stop moving, but stay on the stage until you delete them"], "Clones exist only while the project runs: the stop sign deletes every clone at once. A copy made with Duplicate in the right-click menu, by contrast, is a real new sprite that stays in the project."],
        ["בזמן שפרויקט רץ, דמות יוצרת 5 כפילים של עצמה. מה קורה להם כשלוחצים על תמרור העצירה?", "הם נמחקים, ונשארת רק הדמות המקורית", ["הם נשמרים וחוזרים בלחיצה הבאה על הדגל הירוק", "הם נוספים לרשימת הדמויות כ־5 דמויות חדשות", "הם מפסיקים לזוז, אבל נשארים על הבמה עד שמוחקים אותם"], "כפילים קיימים רק בזמן שהפרויקט רץ: תמרור העצירה מוחק את כל הכפילים בבת אחת. עותק שנוצר באפשרות ״שכפול״ בתפריט של הלחצן הימני, לעומת זאת, הוא דמות חדשה של ממש שנשארת בפרויקט."]],
      [["In the Pen extension, which block must run before a moving sprite leaves a line behind it?", "pen down", ["pen up", "erase all", "stamp"], "pen down makes the sprite draw wherever it moves, and pen up stops the drawing. stamp prints one picture of the sprite and draws no line."],
        ["בהרחבת העט, איזו לבנה צריכה לרוץ לפני שדמות שזזה משאירה אחריה קו?", "״עט מטה״", ["״עט מעלה״", "״מחק הכול״", "״חתום״"], "״עט מטה״ גורמת לדמות לצייר בכל מקום שהיא זזה, ו״עט מעלה״ מפסיקה את הציור. ״חתום״ מדפיסה תמונה אחת של הדמות ולא מציירת קו."]],
      [["Why put  if touching edge  inside a  forever  loop instead of using it once?", "Alone it checks once; inside forever it checks all the time", ["Alone it checks only when the green flag is clicked a second time", "forever makes the check run faster, but still only once", "if blocks are not allowed outside a forever loop"], "An if block tests its condition only at the moment it runs. Inside forever it runs again and again, so the sprite also reacts when it reaches the edge later on."],
        ["למה שמים את הלבנה ״אם נוגע בקצה״ בתוך לולאת ״לעולמים״ במקום להשתמש בה פעם אחת?", "לבד היא בודקת פעם אחת; בתוך ״לעולמים״ היא בודקת כל הזמן", ["לבד היא בודקת רק כשלוחצים על הדגל הירוק בפעם השנייה", "״לעולמים״ גורמת לבדיקה לרוץ מהר יותר, אבל עדיין רק פעם אחת", "אסור להשתמש בלבנת ״אם״ מחוץ ללולאת ״לעולמים״"], "לבנת ״אם״ בודקת את התנאי רק ברגע שהיא רצה. בתוך ״לעולמים״ היא רצה שוב ושוב, ולכן הדמות תגיב גם כשתגיע לקצה מאוחר יותר."]],
    ],
    n: [
      [2, ["score is 0. A script runs  change score by 5  three times, and then  set score to 2 . What is score at the end?", "", "The three changes make score 15, but set score to 2 then replaces that value completely, so the final score is 2."],
        ["הערך של score הוא 0. תסריט מריץ שלוש פעמים ״שנה score ב־5״, ואחר כך ״קבע score ל־2״. מה הערך של score בסוף?", "", "שלושת השינויים מביאים את score ל־15, אבל ״קבע score ל־2״ מחליפה את הערך הזה לגמרי, ולכן הערך הסופי הוא 2."]],
      [20, ["A sprite pointing in direction 90 is at x: -100. How many  move 10 steps  blocks does it need to reach x: 100?", "", "From -100 to 100 is 200 steps, and each block moves 10, so it needs 200 ÷ 10 = 20 blocks."],
        ["דמות שפונה לכיוון 90 נמצאת ב־x שווה מינוס 100. כמה לבנים של ״זוז 10 צעדים״ היא צריכה כדי להגיע ל־x שווה 100?", "", "ממינוס 100 עד 100 יש 200 צעדים, וכל לבנה מזיזה 10, ולכן צריך 200 ÷ 10 = 20 לבנים."]],
    ],
    s: [
      [["What happens after the cat runs  broadcast start and wait", "The message start goes out to the whole project at once", "Every script that is waiting for that message starts to run", "The cat waits while those scripts run", "When they have all finished, the cat runs its next block"],
        ["מה קורה אחרי שהחתול מריץ ״שדר מסר התחלה וחכה״", "המסר ״התחלה״ יוצא לכל הפרויקט בבת אחת", "כל תסריט שמחכה למסר הזה מתחיל לרוץ", "החתול מחכה בזמן שהתסריטים האלה רצים", "כשכולם מסתיימים, החתול מריץ את הלבנה הבאה שלו"]],
    ],
  },
};
export default c;
