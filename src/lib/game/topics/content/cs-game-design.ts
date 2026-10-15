import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Goal", "what the player is trying to reach in a game, like getting to the exit or collecting every star", "מטרה", "מה שהשחקן מנסה להשיג במשחק, כמו להגיע ליציאה או לאסוף את כל הכוכבים"],
      ["Rules", "what tells players what they may and may not do in a game", "חוקי המשחק", "מה שקובע מה מותר לשחקנים לעשות במשחק ומה אסור"],
      ["Feedback", "a sign, such as a sound, a flash or a change in score, that shows the player what just happened", "משוב", "סימן, כמו צליל, הבהוב או שינוי בניקוד, שמראה לשחקן מה בדיוק קרה"],
      ["Playtest", "letting real players try a game to find out what is fun and what is confusing", "בדיקת משחק עם שחקנים", "לתת לשחקנים אמיתיים לנסות את המשחק כדי לגלות מה כיף בו ומה מבלבל"],
    ],
    q: [
      [["A coin makes a “ding” and the score goes up when you touch it. Why do designers add this?", "To show the player right away that something good happened", ["To make the game harder", "To hide the rules", "To end the level"], "Sounds, points and flashes are feedback: they tell players what their action did."],
        ["מטבע משמיע ״דינג״ והניקוד עולה כשנוגעים בו. למה מעצבים מוסיפים את זה?", "כדי להראות לשחקן מיד שקרה משהו טוב", ["כדי להפוך את המשחק לקשה יותר", "כדי להסתיר את החוקים", "כדי לסיים את השלב"], "צלילים, נקודות והבהובים הם משוב: הם מראים לשחקנים מה עשתה הפעולה שלהם."]],
      [["Why do designers ask friends to try a game before it is finished?", "To see what is fun and what confuses people", ["To make the game run faster", "So the designer can stop working on it", "To find out which computer is the fastest"], "Watching real players shows where they get stuck or bored, so the designer can fix it."],
        ["למה מעצבים מבקשים מחברים לנסות משחק לפני שהוא מוכן?", "כדי לראות מה כיף ומה מבלבל אנשים", ["כדי שהמשחק ירוץ מהר יותר", "כדי שהמעצב יוכל להפסיק לעבוד עליו", "כדי לגלות איזה מחשב הוא המהיר ביותר"], "כשצופים בשחקנים אמיתיים רואים איפה הם נתקעים או משתעממים, וכך המעצב יכול לתקן."]],
    ],
  },
  i: {
    t: [
      ["Game mechanic", "an action or rule the player uses to play, such as jumping, collecting or trading", "מכניקת משחק", "פעולה או כלל שהשחקן משתמש בהם כדי לשחק, כמו קפיצה, איסוף או מסחר"],
      ["Difficulty curve", "how quickly a game gets harder as the player moves forward", "עקומת קושי", "הקצב שבו המשחק נעשה מאתגר יותר ככל שהשחקן מתקדם"],
      ["Tutorial", "the opening part of a game that teaches the controls and rules one step at a time", "שלב הדרכה", "החלק הפותח של המשחק, שמלמד את השליטה ואת החוקים צעד אחר צעד"],
      ["Reward", "something a player gets for success, such as points, a new item or a new area", "תגמול", "משהו שהשחקן מקבל על הצלחה, כמו נקודות, חפץ חדש או אזור חדש"],
    ],
    q: [
      [["In playtests, most players give up in the very first level because it is too hard. What is the best fix?", "Make the first level easier and teach one skill at a time", ["Add more enemies to the first level", "Remove the goal of the level", "Hide the score"], "A gentle start lets players learn the controls before the game gets harder: a smooth difficulty curve."],
        ["בבדיקות עם שחקנים, רוב השחקנים מוותרים כבר בשלב הראשון כי הוא קשה מדי. מה התיקון הטוב ביותר?", "להקל את השלב הראשון וללמד מיומנות אחת בכל פעם", ["להוסיף עוד אויבים לשלב הראשון", "לבטל את המטרה של השלב", "להסתיר את הניקוד"], "התחלה רכה מאפשרת לשחקנים ללמוד את השליטה לפני שהמשחק מתקשה: עקומת קושי מתונה."]],
      [["Which of these is a game mechanic?", "Jumping over gaps", ["The colour of the menu", "The name of the studio", "The price of the game"], "A mechanic is something the player does or a rule of play; colours, names and prices are not part of how the game is played."],
        ["מה מהבאים הוא מכניקת משחק?", "קפיצה מעל בורות", ["הצבע של התפריט", "השם של חברת המשחקים", "המחיר של המשחק"], "מכניקה היא משהו שהשחקן עושה או כלל של המשחק; צבעים, שמות ומחירים אינם חלק מאופן המשחק."]],
      [["Why do many games let players try a new skill in a safe place before a hard test?", "So players can practise without being punished for mistakes", ["So the game is shorter", "Because players never make mistakes", "To save memory on the computer"], "Practising safely first builds confidence; the harder challenge then feels fair instead of frustrating."],
        ["למה משחקים רבים נותנים לשחקן לנסות מיומנות חדשה במקום בטוח לפני מבחן קשה?", "כדי שאפשר יהיה להתאמן בלי להיענש על טעויות", ["כדי שהמשחק יהיה קצר יותר", "כי שחקנים אף פעם לא טועים", "כדי לחסוך זיכרון במחשב"], "תרגול בטוח קודם בונה ביטחון, ואז האתגר הקשה מרגיש הוגן ולא מתסכל."]],
    ],
    s: [[["Making a game, in order", "Come up with an idea", "Build a quick, simple version", "Let players try it", "Fix and improve it", "Release the game"],
      ["יצירת משחק, לפי הסדר", "להעלות רעיון", "לבנות גרסה מהירה ופשוטה", "לתת לשחקנים לנסות אותה", "לתקן ולשפר", "לפרסם את המשחק"]]],
  },
  a: {
    t: [
      ["Prototype", "a quick, rough early version of a game, built to test an idea", "אב טיפוס", "גרסה מוקדמת, מהירה וגסה של משחק, שבונים כדי לבדוק רעיון"],
      ["Game balance", "tuning numbers and rules so that no strategy or character is far stronger than the rest", "איזון המשחק", "כוונון של מספרים וחוקים כך שאף אסטרטגיה או דמות לא תהיה חזקה הרבה יותר מהשאר"],
      ["Positive feedback loop", "when success makes further success easier, so the leader pulls further and further ahead", "לולאת משוב חיובי", "מצב שבו הצלחה מקלה על הצלחות נוספות, כך שהמוביל מתרחק עוד ועוד"],
      ["Flow", "deep focus that comes when a challenge matches the player's skill, neither too easy nor too hard", "זרימה (פלואו)", "ריכוז עמוק שנוצר כשהאתגר מתאים ליכולת של השחקן: לא קל מדי ולא קשה מדי"],
    ],
    q: [
      [["In a racing game, players in last place get stronger speed boosts. What is this rule for?", "To keep the race close, so players behind still have a chance", ["To help the leader win more easily", "To end the race sooner", "To punish players who are behind"], "It is a catch-up rule: it shrinks the gap between players, so the race stays exciting for everyone."],
        ["במשחק מרוצים, מי שבמקום האחרון מקבל האצות חזקות יותר. בשביל מה הכלל הזה?", "כדי שהמרוץ יישאר צמוד ולשחקנים מאחור עדיין יהיה סיכוי", ["כדי לעזור למוביל לנצח בקלות", "כדי לסיים את המרוץ מהר יותר", "כדי להעניש את השחקנים שמאחור"], "זה כלל של סגירת פערים: הוא מקטין את הפער בין השחקנים, כך שהמרוץ נשאר מרתק לכולם."]],
      [["In playtests of a fighting game, one character wins most of the matches. What should the designer do?", "Weaken that character a little and test again", ["Make that character even stronger", "Remove all the other characters", "Stop playtesting the game"], "Balancing is done in small steps: change a little, then test again, until no character is clearly the best."],
        ["בבדיקות של משחק קרבות, דמות אחת מנצחת ברוב הקרבות. מה כדאי למעצב לעשות?", "להחליש מעט את הדמות ולבדוק שוב", ["לחזק את הדמות עוד יותר", "להוציא את כל שאר הדמויות", "להפסיק לבדוק את המשחק"], "איזון נעשה בצעדים קטנים: משנים מעט ובודקים שוב, עד שאף דמות אינה הטובה ביותר בבירור."]],
      [["Why do designers build a rough prototype before making the final art?", "Testing early is cheap, and changes are easy before much work is done", ["Players prefer rough graphics", "Final art can never be changed later", "It makes the final game run faster"], "If the idea is not fun, it is better to find out after a few days of work than after months of drawing and coding."],
        ["למה מעצבים בונים אב טיפוס גס לפני שמכינים את הגרפיקה הסופית?", "בדיקה מוקדמת זולה, וקל לשנות לפני שהושקעה עבודה רבה", ["שחקנים מעדיפים גרפיקה גסה", "אי אפשר אף פעם לשנות גרפיקה סופית", "זה גורם למשחק הסופי לרוץ מהר יותר"], "אם הרעיון לא כיף, עדיף לגלות את זה אחרי כמה ימי עבודה ולא אחרי חודשים של ציור ותכנות."]],
    ],
    n: [[75, ["In a playtest, 45 of 60 players finish level 3. What percentage of the players finish it?", "%", "45 ÷ 60 = 0.75, so 75% of the players finish the level."],
      ["בבדיקה עם שחקנים, 45 מתוך 60 שחקנים מסיימים את שלב 3. כמה אחוזים מהשחקנים מסיימים אותו?", "%", "45 ÷ 60 = 0.75, ולכן 75% מהשחקנים מסיימים את השלב."]]],
  },
};
export default c;
