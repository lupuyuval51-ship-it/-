import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Turtle", "a small arrow on the screen that moves where you tell it and draws a line behind it", "צב", "חץ קטן על המסך שזז לאן שאומרים לו ומצייר קו מאחוריו"],
      ["Pen down", "the setting in which every move leaves a line on the screen", "הורדת העט", "מצב שבו כל תנועה משאירה קו על המסך"],
      ["Pen up", "the setting in which the arrow moves without drawing anything", "הרמת העט", "מצב שבו החץ זז בלי לצייר כלום"],
    ],
    q: [
      [["What does the command  forward 100  do?", "Moves the turtle 100 steps the way it is facing", ["Moves the turtle 100 steps up to the top, whatever way it faces", "Turns the turtle 100 degrees to the right", "Makes the line 100 times thicker"], "forward moves the turtle straight ahead in its current direction, and draws a line if the pen is down."],
        ["מה עושה הפקודה  forward 100 ?", "מזיזה את הצב 100 צעדים לכיוון שאליו הוא פונה", ["מזיזה את הצב 100 צעדים למעלה, לא משנה לאן הוא פונה", "מסובבת את הצב 100 מעלות ימינה", "מעבה את הקו פי 100"], "forward מזיזה את הצב ישר קדימה בכיוון שאליו הוא פונה עכשיו, ומציירת קו אם העט למטה."]],
      [["What does the command  right 90  do?", "Turns the turtle a quarter turn to its right", ["Moves the turtle 90 steps over to the right", "Turns the turtle all the way around once", "Draws a line that is 90 steps long"], "right turns the turtle on the spot without moving it. 90 degrees is a quarter of a full turn of 360 degrees."],
        ["מה עושה הפקודה  right 90 ?", "מסובבת את הצב רבע סיבוב ימינה", ["מזיזה את הצב 90 צעדים הצידה ימינה", "מסובבת את הצב סיבוב שלם אחד", "מציירת קו באורך 90 צעדים"], "right מסובבת את הצב במקום בלי להזיז אותו. סיבוב של 90 מעלות הוא רבע מסיבוב שלם של 360 מעלות."]],
      [["Which commands draw a square?", "repeat 4 [forward 100 right 90]", ["repeat 4 [forward 100 right 45]", "repeat 3 [forward 100 right 90]", "repeat 4 [forward 100]"], "A square has 4 equal sides and 4 corners, and the turtle turns 90 degrees at each one: 4 × 90 = 360, one full turn."],
        ["אילו פקודות מציירות ריבוע?", "repeat 4 [forward 100 right 90]", ["repeat 4 [forward 100 right 45]", "repeat 3 [forward 100 right 90]", "repeat 4 [forward 100]"], "לריבוע יש 4 צלעות שוות ו־4 פינות, והצב מסתובב 90 מעלות בכל אחת מהן: 4 × 90 = 360, סיבוב שלם אחד."]],
      [["The pen is up and the turtle runs  forward 50 . What appears on the screen?", "No line at all, only the turtle moves", ["A line that is 50 steps long", "A dotted line from the start to the end", "A circle that is 50 steps wide"], "With the pen up, the turtle can move to a new place without leaving a line. pen down makes it draw again."],
        ["העט מורם והצב מריץ  forward 50 . מה מופיע על המסך?", "שום קו, רק הצב זז", ["קו באורך 50 צעדים", "קו מנוקד מנקודת ההתחלה עד הסוף", "עיגול ברוחב 50 צעדים"], "כשהעט מורם, הצב יכול לעבור למקום חדש בלי להשאיר קו. הפקודה pen down גורמת לו לצייר שוב."]],
      [["Which programming language made turtle drawing famous?", "Logo", ["Scratch", "Python", "HTML"], "Logo, first made in 1967 to teach children, is known for its turtle that draws as it moves. Python's turtle module copies that idea."],
        ["איזו שפת תכנות הפכה את ציור הצב למפורסם?", "Logo", ["Scratch", "Python", "HTML"], "שפת Logo, שנוצרה ב־1967 כדי ללמד ילדים, מוכרת בזכות הצב שמצייר כשהוא זז. המודול turtle של Python מעתיק את הרעיון הזה."]],
    ],
    n: [
      [360, ["How many degrees does the turtle turn in all while drawing a square with  right 90  at each of the 4 corners?", "degrees", "4 turns of 90 degrees each: 4 × 90 = 360 degrees, exactly one full turn."],
        ["כמה מעלות מסתובב הצב בסך הכול כשהוא מצייר ריבוע עם  right 90  בכל אחת מ־4 הפינות?", "מעלות", "4 פניות של 90 מעלות כל אחת: 4 × 90 = 360 מעלות, בדיוק סיבוב שלם."]],
      [200, ["How long is the whole path drawn by  repeat 4 [forward 50 right 90] ?", "steps", "The turtle draws 4 sides of 50 steps each: 4 × 50 = 200 steps."],
        ["מה האורך של כל המסלול שמצייר  repeat 4 [forward 50 right 90] ?", "צעדים", "הצב מצייר 4 צלעות של 50 צעדים כל אחת: 4 × 50 = 200 צעדים."]],
    ],
    s: [
      [["Drawing two separate lines with a gap between them", "Draw the first line: forward 50", "Lift the pen: pen up", "Cross the gap: forward 20", "Put the pen back down: pen down", "Draw the second line: forward 50"],
        ["מציירים שני קווים נפרדים עם רווח ביניהם", "מציירים את הקו הראשון: forward 50", "מרימים את העט: pen up", "עוברים את הרווח: forward 20", "מורידים שוב את העט: pen down", "מציירים את הקו השני: forward 50"]],
    ],
  },
  i: {
    t: [
      ["Exterior angle", "the angle the turtle turns through at each corner of a shape", "זווית חיצונית", "הזווית שהצב מסתובב בה בכל פינה של צורה"],
      ["Regular polygon", "a closed shape whose sides all have the same length and whose angles are all equal", "מצולע משוכלל", "צורה סגורה שכל הצלעות שלה באותו אורך וכל הזוויות שלה שוות"],
      ["Heading", "the direction the turtle is facing, measured in degrees", "כיוון הצב", "הצד שאליו הצב פונה, שנמדד במעלות"],
    ],
    q: [
      [["To draw an equilateral triangle, how many degrees should the turtle turn at each corner?", "120", ["60", "90", "180"], "The three turns must add up to a full 360 degrees, so each turn is 360 ÷ 3 = 120. The 60 degrees is the angle inside the triangle, not the turn."],
        ["כדי לצייר משולש שווה צלעות, בכמה מעלות צריך הצב להסתובב בכל פינה?", "120", ["60", "90", "180"], "שלוש הפניות צריכות להשלים יחד 360 מעלות, ולכן כל פנייה היא 360 ÷ 3 = 120. הזווית של 60 מעלות היא הזווית שבתוך המשולש, ולא הפנייה."]],
      [["Which code draws a regular hexagon?", "repeat 6 [forward 50 right 60]", ["repeat 6 [forward 50 right 120]", "repeat 6 [forward 50 right 90]", "repeat 5 [forward 50 right 60]"], "A hexagon has 6 sides, so the turtle repeats 6 times and turns 360 ÷ 6 = 60 degrees at each corner."],
        ["איזה קוד מצייר משושה משוכלל?", "repeat 6 [forward 50 right 60]", ["repeat 6 [forward 50 right 120]", "repeat 6 [forward 50 right 90]", "repeat 5 [forward 50 right 60]"], "למשושה יש 6 צלעות, ולכן הצב חוזר 6 פעמים ומסתובב 360 ÷ 6 = 60 מעלות בכל פינה."]],
      [["Why does  repeat 360 [forward 1 right 1]  look like a circle?", "360 tiny straight steps with tiny turns look smooth", ["Turning by 1 degree makes the pen draw a curved line", "repeat 360 is a special code that always draws a circle", "The turtle rounds off every corner when its steps are short"], "Each step is a tiny straight line, and the turns add up to 360 degrees. The corners are so small that the eye sees a smooth curve."],
        ["למה  repeat 360 [forward 1 right 1]  נראה כמו עיגול?", "360 צעדים ישרים וזעירים עם פניות זעירות נראים חלקים", ["פנייה של מעלה אחת גורמת לעט לצייר קו מעוגל", "repeat 360 הוא קוד מיוחד שתמיד מצייר עיגול", "הצב מעגל כל פינה כשהצעדים שלו קצרים מספיק"], "כל צעד הוא קו ישר וזעיר, והפניות מסתכמות ב־360 מעלות. הפינות כל כך קטנות שהעין רואה קו מעוגל וחלק."]],
      [["What is the rule for the turn at each corner of any regular polygon?", "360 divided by the number of sides", ["180 divided by the number of sides", "90 times the number of sides", "The number of sides times 10"], "Going once around a simple closed shape, the turtle makes one full turn of 360 degrees, shared equally between the corners."],
        ["מהו הכלל לגודל הפנייה בכל פינה של מצולע משוכלל?", "360 חלקי מספר הצלעות", ["180 חלקי מספר הצלעות", "90 כפול מספר הצלעות", "מספר הצלעות כפול 10"], "כשהצב מקיף פעם אחת צורה סגורה ופשוטה, הוא מסתובב סיבוב שלם של 360 מעלות, שמתחלק שווה בשווה בין הפינות."]],
      [["The turtle runs  left 90  and then  right 90 . Which way does it face now?", "The same way as at the start", ["The opposite way, backwards", "A quarter turn to the left of the start", "A quarter turn to the right of the start"], "The right turn undoes the left turn of the same size, so the heading is back where it began."],
        ["הצב מריץ  left 90  ואחר כך  right 90 . לאיזה כיוון הוא פונה עכשיו?", "לאותו כיוון כמו בהתחלה", ["לכיוון ההפוך, אחורה", "רבע סיבוב שמאלה מההתחלה", "רבע סיבוב ימינה מההתחלה"], "הפנייה ימינה מבטלת את הפנייה שמאלה באותו גודל, ולכן הצב חוזר לפנות לכיוון שבו התחיל."]],
    ],
    n: [
      [72, ["How many degrees should the turtle turn at each corner of a regular pentagon?", "degrees", "A pentagon has 5 corners and the turns add up to 360 degrees: 360 ÷ 5 = 72."],
        ["בכמה מעלות צריך הצב להסתובב בכל פינה של מחומש משוכלל?", "מעלות", "למחומש יש 5 פינות, והפניות מסתכמות ב־360 מעלות: 360 ÷ 5 = 72."]],
    ],
    s: [
      [["Order these regular shapes by the turn at each corner, biggest turn first", "Triangle", "Square", "Pentagon", "Hexagon", "Octagon"],
        ["סדרו את המצולעים המשוכללים לפי הפנייה בכל פינה, מהפנייה הגדולה ביותר", "משולש", "ריבוע", "מחומש", "משושה", "מתומן"]],
    ],
  },
  a: {
    t: [
      ["Total turning", "all the turns of a closed path added up; for a simple shape it is always 360 degrees", "סך כל הפניות", "חיבור של כל הסיבובים במסלול סגור; בצורה פשוטה הוא תמיד 360 מעלות"],
      ["Interior angle", "the angle inside a shape at one corner; together with the turn there it makes 180 degrees", "זווית פנימית", "הזווית שבתוך הצורה באחת הפינות; יחד עם הפנייה באותה פינה היא משלימה ל־180 מעלות"],
      ["Procedure", "a named set of commands, such as square, that can be run again with one word", "פרוצדורה", "אוסף פקודות עם שם, כמו square, שאפשר להריץ שוב במילה אחת"],
    ],
    q: [
      [["Which commands draw a five-pointed star?", "repeat 5 [forward 100 right 144]", ["repeat 5 [forward 100 right 72]", "repeat 5 [forward 100 right 108]", "repeat 6 [forward 100 right 60]"], "Turning 144 degrees five times makes 720 degrees, two full turns, so the lines cross and form a star. right 72 would draw a pentagon."],
        ["אילו פקודות מציירות כוכב בעל חמישה קודקודים?", "repeat 5 [forward 100 right 144]", ["repeat 5 [forward 100 right 72]", "repeat 5 [forward 100 right 108]", "repeat 6 [forward 100 right 60]"], "חמש פניות של 144 מעלות נותנות 720 מעלות, שני סיבובים שלמים, ולכן הקווים חוצים זה את זה ויוצרים כוכב. עם right 72 היה מצויר מחומש."]],
      [["While drawing that star, how far does the turtle turn in all?", "Two full turns (720 degrees)", ["One full turn (360 degrees)", "Five full turns (1800 degrees)", "Half a turn (180 degrees)"], "5 × 144 = 720 degrees, which is 2 × 360. A star like this goes around its centre twice, while a simple shape goes around once."],
        ["בזמן שהוא מצייר את הכוכב הזה, כמה מסתובב הצב בסך הכול?", "שני סיבובים שלמים (720 מעלות)", ["סיבוב שלם אחד (360 מעלות)", "חמישה סיבובים שלמים (1800 מעלות)", "חצי סיבוב (180 מעלות)"], "5 × 144 = 720 מעלות, שהם 2 × 360. כוכב כזה מקיף את המרכז שלו פעמיים, וצורה פשוטה מקיפה אותו פעם אחת."]],
      [["Each inside angle of a regular hexagon is 120 degrees. Why does the turtle turn only 60 degrees at each corner?", "It turns by 180 minus the inside angle", ["It turns by the inside angle divided by the sides", "The turtle can only turn 60 degrees at a time", "Every shape turns 60 degrees at each corner"], "The turn and the inside angle lie along one straight line, so together they make 180 degrees: 180 - 120 = 60."],
        ["כל זווית פנימית במשושה משוכלל היא 120 מעלות. למה הצב מסתובב רק 60 מעלות בכל פינה?", "הוא מסתובב 180 פחות הזווית הפנימית", ["הוא מסתובב בזווית הפנימית חלקי מספר הצלעות", "הצב יכול להסתובב רק 60 מעלות בכל פעם", "כל צורה מסתובבת 60 מעלות בכל פינה"], "הפנייה והזווית הפנימית יושבות על קו ישר אחד, ולכן יחד הן 180 מעלות: 180 פחות 120 הם 60."]],
      [["The turtle runs  forward 100, right 90, forward 100, right 90, forward 100 . How far is it from where it started?", "100 steps", ["141 steps", "300 steps", "0 steps: it is back at the start"], "It has drawn three sides of a square, so it stands at the fourth corner, just one side away from the start: 100 steps."],
        ["הצב מריץ  forward 100, right 90, forward 100, right 90, forward 100 . כמה הוא רחוק מהמקום שבו התחיל?", "100 צעדים", ["141 צעדים", "300 צעדים", "0 צעדים: הוא חזר להתחלה"], "הוא צייר שלוש צלעות של ריבוע, ולכן הוא עומד בפינה הרביעית, במרחק צלע אחת בלבד מההתחלה: 100 צעדים."]],
      [["A procedure  square  draws a square and ends facing the way it began. What does  repeat 36 [square right 10]  draw?", "36 squares turned around one corner, like a flower", ["One big square that is 36 times larger than the first", "36 squares in one straight row", "A single circle with no corners"], "Each square starts after a 10-degree turn, and 36 × 10 = 360, so the squares spread all the way around their shared corner."],
        ["הפרוצדורה  square  מציירת ריבוע ומסיימת כשהיא פונה לכיוון שבו התחילה. מה מצייר  repeat 36 [square right 10] ?", "36 ריבועים מסובבים סביב פינה אחת, כמו פרח", ["ריבוע אחד גדול, פי 36 מהריבוע הראשון", "36 ריבועים בשורה ישרה אחת", "עיגול אחד בלי פינות"], "כל ריבוע מתחיל אחרי פנייה של 10 מעלות, ו־36 × 10 = 360, ולכן הריבועים מתפרשים מסביב לכל הפינה המשותפת שלהם."]],
    ],
    n: [
      [135, ["How many degrees is each inside angle of a regular octagon?", "degrees", "The turtle turns 360 ÷ 8 = 45 degrees at each corner, and the inside angle is 180 - 45 = 135 degrees."],
        ["כמה מעלות יש בכל זווית פנימית של מתומן משוכלל?", "מעלות", "הצב מסתובב 360 ÷ 8 = 45 מעלות בכל פינה, והזווית הפנימית היא 180 פחות 45, כלומר 135 מעלות."]],
      [15, ["A regular polygon is drawn with  right 24  at every corner. How many sides does it have?", "", "The turns must add up to 360 degrees, so there are 360 ÷ 24 = 15 corners, and so 15 sides."],
        ["מצולע משוכלל מצויר עם  right 24  בכל פינה. כמה צלעות יש לו?", "", "הפניות צריכות להסתכם ב־360 מעלות, ולכן יש 360 ÷ 24 = 15 פינות, וכך גם 15 צלעות."]],
    ],
  },
};
export default c;
