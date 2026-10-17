import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Data", "facts or numbers collected to answer a question", "נתונים", "עובדות או מספרים שנאספו כדי לענות על שאלה"],
      ["Tally", "counting with marks, grouped in fives", "סימון קווים", "ספירה בעזרת קווים, שמקובצים בחמישיות"],
      ["Bar chart", "a graph that compares amounts with bars of different heights", "דיאגרמת עמודות", "גרף שמשווה כמויות בעזרת עמודות בגבהים שונים"],
      ["Mode", "the value that appears most often", "שכיח", "הערך שמופיע הכי הרבה פעמים"],
    ],
    q: [
      [["Shoe sizes: 34, 35, 35, 36, 35, 37. What is the mode?", "35", ["34", "36", "37"], "35 appears three times — more than any other size."],
        ["מידות נעליים: 34, 35, 35, 36, 35, 37. מהו השכיח?", "35", ["34", "36", "37"], "35 מופיע שלוש פעמים — יותר מכל מידה אחרת."]],
      [["In a bar chart, what does the tallest bar show?", "The largest amount", ["The smallest amount", "The first category", "The average"], "Bar height shows the amount, so the tallest bar is the biggest group."],
        ["בדיאגרמת עמודות, מה מראה העמודה הגבוהה ביותר?", "את הכמות הגדולה ביותר", ["את הכמות הקטנה ביותר", "את הקטגוריה הראשונה", "את הממוצע"], "גובה העמודה מראה את הכמות, ולכן העמודה הגבוהה ביותר היא הקבוצה הגדולה ביותר."]],
    ],
  },
  i: {
    t: [
      ["Mean", "the sum of all the values divided by how many there are", "ממוצע", "סכום כל הערכים חלקי מספר הערכים"],
      ["Median", "the middle value when the data are put in order", "חציון", "הערך האמצעי כשמסדרים את הנתונים לפי הסדר"],
      ["Range", "the largest value minus the smallest value", "טווח", "הערך הגדול ביותר פחות הערך הקטן ביותר"],
      ["Pie chart", "a circle divided into slices that show parts of a whole", "דיאגרמת עוגה", "עיגול שמחולק לפרוסות שמראות חלקים של שלם"],
    ],
    q: [
      [["Test scores: 70, 80, 90. What is the mean?", "80", ["70", "90", "240"], "(70 + 80 + 90) ÷ 3 = 240 ÷ 3 = 80."],
        ["ציונים: 70, 80, 90. מהו הממוצע?", "80", ["70", "90", "240"], "(70 + 80 + 90) ÷ 3 = 240 ÷ 3 = 80."]],
      [["What is the median of 3, 9, 4, 7, 1?", "4", ["9", "7", "4.8"], "In order: 1, 3, 4, 7, 9 — the middle value is 4 (4.8 is the mean)."],
        ["מהו החציון של 3, 9, 4, 7, 1?", "4", ["9", "7", "4.8"], "בסדר עולה: 1, 3, 4, 7, 9 — הערך האמצעי הוא 4 (4.8 הוא הממוצע)."]],
    ],
    n: [[25, ["Temperatures this week ranged from 12 °C to 37 °C. What is the range?", "°C", "Range = largest − smallest = 37 − 12 = 25 °C."], ["הטמפרטורות השבוע נעו בין 12 °C ל־37 °C. מהו הטווח?", "°C", "טווח = הגדול ביותר − הקטן ביותר = 37 − 12 = 25 °C."]]],
  },
  a: {
    t: [
      ["Outlier", "a value far away from the rest of the data", "ערך חריג", "ערך שרחוק מאוד משאר הנתונים"],
      ["Sample", "the part of a group that is actually studied, to learn about the whole group", "מדגם", "החלק מתוך קבוצה שנבדק בפועל, כדי ללמוד על הקבוצה כולה"],
      ["Bias", "a problem in how data are collected that pushes results in one direction", "הטיה", "בעיה באופן איסוף הנתונים שמטה את התוצאות לכיוון מסוים"],
      ["Correlation", "a link in which two quantities tend to change together", "מתאם", "קשר שבו שני גדלים נוטים להשתנות יחד"],
    ],
    q: [
      [["Salaries in a small company: 8, 9, 9, 10 and 64 (thousand ₪). Which average best describes a typical salary?", "The median, 9", ["The mean, 20", "The range, 56", "The largest value, 64"], "The outlier 64 pulls the mean up to 20; the median, 9, is not affected by it."],
        ["משכורות בחברה קטנה: 8, 9, 9, 10 ו־64 (אלפי ₪). איזה מדד מתאר הכי טוב משכורת טיפוסית?", "החציון, 9", ["הממוצע, 20", "הטווח, 56", "הערך הגדול ביותר, 64"], "הערך החריג 64 מושך את הממוצע ל־20; החציון, 9, אינו מושפע ממנו."]],
      [["Ice-cream sales and drownings both rise in summer. What does this show?", "A correlation, probably caused by hot weather, not that ice cream causes drowning", ["Ice cream causes drowning", "Drowning makes people buy ice cream", "The data must be wrong"], "Correlation is not causation: a third factor (heat, more swimming) drives both."],
        ["מכירות גלידה ומקרי טביעה עולים שניהם בקיץ. מה זה מראה?", "מתאם, שנגרם כנראה ממזג האוויר החם — לא שגלידה גורמת לטביעה", ["גלידה גורמת לטביעה", "טביעה גורמת לאנשים לקנות גלידה", "הנתונים בהכרח שגויים"], "מתאם אינו סיבתיות: גורם שלישי (חום, יותר שחייה) משפיע על שניהם."]],
      [["A survey about school sport asks only members of the football team. What is the problem?", "The sample is biased", ["The sample is too random", "There is no problem", "The mean will be zero"], "Football players are not typical of all pupils, so the results lean one way."],
        ["סקר על ספורט בבית הספר שואל רק את חברי קבוצת הכדורגל. מה הבעיה?", "המדגם מוטה", ["המדגם אקראי מדי", "אין בעיה", "הממוצע יהיה אפס"], "שחקני כדורגל אינם מייצגים את כל התלמידים, ולכן התוצאות מוטות לכיוון אחד."]],
    ],
  },
};
export default c;
