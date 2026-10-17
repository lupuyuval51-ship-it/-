import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Question", "what a scientist wants to find out", "שאלת מחקר", "מה שמדען רוצה לגלות"],
      ["Prediction", "a guess about what will happen, made before the experiment", "ניבוי", "השערה על מה שיקרה, לפני הניסוי"],
      ["Experiment", "a test done to find out whether an idea is right", "ניסוי", "בדיקה שעושים כדי לגלות אם רעיון נכון"],
      ["Observation", "noticing and recording what happens", "תצפית", "שמים לב למה שקורה ורושמים אותו"],
    ],
    q: [
      [["Why do scientists write down their results?", "So they can check them and others can repeat the work", ["To make experiments longer", "Because results never change", "To hide them"], "Recorded results can be checked, compared and repeated."],
        ["למה מדענים רושמים את התוצאות שלהם?", "כדי שיוכלו לבדוק אותן ואחרים יוכלו לחזור על העבודה", ["כדי להאריך את הניסויים", "כי תוצאות אף פעם לא משתנות", "כדי להסתיר אותן"], "תוצאות רשומות אפשר לבדוק, להשוות ולשחזר."]],
      [["Which is a fair test of which ball bounces highest?", "Drop each ball from the same height onto the same floor", ["Throw each ball as hard as you like", "Drop them onto different floors", "Test only one ball"], "Keeping everything else the same makes the comparison fair."],
        ["מה מהבאים הוא ניסוי הוגן לבדיקה איזה כדור קופץ הכי גבוה?", "להפיל כל כדור מאותו גובה על אותה רצפה", ["לזרוק כל כדור בכוח שרוצים", "להפיל אותם על רצפות שונות", "לבדוק רק כדור אחד"], "כששומרים על כל השאר זהה, ההשוואה הוגנת."]],
    ],
    s: [[["Steps of an investigation", "Ask a question", "Make a prediction", "Do the experiment", "Record the results", "Draw a conclusion"], ["שלבי חקר", "שואלים שאלה", "משערים מה יקרה", "עורכים ניסוי", "רושמים את התוצאות", "מסיקים מסקנה"]]],
  },
  i: {
    t: [
      ["Hypothesis", "a testable explanation of why something happens", "השערה", "הסבר שאפשר לבדוק לשאלה למה משהו קורה"],
      ["Independent variable", "the one thing the scientist changes on purpose", "משתנה בלתי תלוי", "הדבר האחד שהחוקר משנה בכוונה"],
      ["Dependent variable", "what is measured to see the effect of the change", "משתנה תלוי", "מה שמודדים כדי לראות את השפעת השינוי"],
      ["Control variables", "everything kept the same so the test is fair", "משתנים קבועים", "כל מה ששומרים זהה כדי שהניסוי יהיה הוגן"],
    ],
    q: [
      [["You test how the amount of sunlight affects plant height. What is the dependent variable?", "The plant's height", ["The amount of sunlight", "The type of pot", "The water given"], "Height is measured to see the effect of changing the light."],
        ["בודקים איך כמות אור השמש משפיעה על גובה צמח. מהו המשתנה התלוי?", "הגובה של הצמח", ["כמות אור השמש", "סוג העציץ", "כמות המים שניתנת"], "את הגובה מודדים כדי לראות את השפעת שינוי האור."]],
      [["Why do scientists repeat an experiment several times?", "To check that the results are reliable and not a fluke", ["To use up materials", "Because the first time is always wrong", "To change the question"], "Repeats reveal random errors and make results more trustworthy."],
        ["למה מדענים חוזרים על ניסוי כמה פעמים?", "כדי לבדוק שהתוצאות אמינות ולא מקריות", ["כדי לנצל חומרים", "כי בפעם הראשונה תמיד טועים", "כדי לשנות את השאלה"], "חזרות חושפות טעויות מקריות והופכות את התוצאות לאמינות יותר."]],
    ],
  },
  a: {
    t: [
      ["Control group", "a group that does not get the treatment, used for comparison", "קבוצת ביקורת", "קבוצה שאינה מקבלת את הטיפול ומשמשת להשוואה"],
      ["Peer review", "experts checking a study before it is published", "ביקורת עמיתים", "בדיקה של מחקר בידי מומחים לפני שהוא מתפרסם"],
      ["Theory", "a well-tested explanation supported by much evidence, like the theory of evolution", "תאוריה", "הסבר שנבדק היטב ונתמך בראיות רבות, כמו תורת האבולוציה"],
      ["Placebo", "a fake treatment with no active ingredient, used to test a real one fairly", "פלצבו (תרופת דמה)", "טיפול מדומה בלי חומר פעיל, שמשמש לבדיקה הוגנת של טיפול אמיתי"],
    ],
    q: [
      [["In a medicine trial, why do patients not know whether they got the real pill or a placebo?", "So their expectations do not affect the results", ["To save money", "Because doctors forgot", "To make the pill taste better"], "Believing you were treated can itself make you feel better; blinding removes that bias."],
        ["בניסוי תרופה, למה המטופלים לא יודעים אם קיבלו את הכדור האמיתי או תרופת דמה?", "כדי שהציפיות שלהם לא ישפיעו על התוצאות", ["כדי לחסוך כסף", "כי הרופאים שכחו", "כדי שהכדור יהיה טעים יותר"], "עצם האמונה שקיבלת טיפול יכולה לגרום להרגשה טובה יותר; הסתרה מנטרלת את ההטיה הזאת."]],
      [["In science, “theory” means…", "a well-supported explanation tested many times", ["a wild guess", "something proven false", "a personal opinion"], "Scientific theories, like gravity or evolution, are backed by large bodies of evidence."],
        ["במדע, ״תאוריה״ פירושה…", "הסבר שנתמך היטב ונבדק פעמים רבות", ["ניחוש פרוע", "משהו שהופרך", "דעה אישית"], "תאוריות מדעיות, כמו הכבידה או האבולוציה, נשענות על גוף גדול של ראיות."]],
    ],
  },
};
export default c;
