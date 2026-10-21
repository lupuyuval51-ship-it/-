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
      [["In a bar chart, what does the tallest bar show?", "The largest amount", ["The smallest amount", "The first category", "The average of all the bars"], "Bar height shows the amount, so the tallest bar is the biggest group."],
        ["בדיאגרמת עמודות, מה מראה העמודה הגבוהה ביותר?", "את הכמות הגדולה ביותר", ["את הכמות הקטנה ביותר", "את הקטגוריה הראשונה", "את הממוצע של כל העמודות"], "גובה העמודה מראה את הכמות, ולכן העמודה הגבוהה ביותר היא הקבוצה הגדולה ביותר."]],
      [["A class votes for a favourite fruit: apple 8, banana 5, orange 11, grape 6. Which fruit is the mode?", "Orange", ["Apple", "Banana", "Grape"], "The mode is the value that appears most often. Orange has the most votes, 11, so it is the mode of this data."],
        ["כיתה מצביעה על פרי מועדף: תפוח 8, בננה 5, תפוז 11, ענבים 6. איזה פרי הוא השכיח?", "תפוז", ["תפוח", "בננה", "ענבים"], "השכיח הוא הערך שמופיע הכי הרבה פעמים. לתפוז יש הכי הרבה קולות, 11, ולכן הוא השכיח בנתונים האלה."]],
      [["In a bar chart, two bars are exactly the same height. What does that tell you?", "The two categories have the same amount", ["The two categories are really the same thing", "The chart must contain a mistake", "Those two bars show the average of the others"], "Bar height shows the amount, so bars of equal height mean equal amounts. Two groups can be different and still have the same number of members."],
        ["בדיאגרמת עמודות, שתי עמודות בדיוק באותו גובה. מה זה אומר?", "בשתי הקטגוריות יש אותה כמות", ["שתי הקטגוריות הן בעצם אותו דבר", "בדיאגרמה בהכרח יש טעות", "שתי העמודות האלה מראות את הממוצע של האחרות"], "גובה העמודה מראה את הכמות, ולכן עמודות בגובה שווה פירושן כמויות שוות. שתי קבוצות יכולות להיות שונות ועדיין להכיל אותו מספר חברים."]],
    ],
    n: [
      [13, ["A tally chart shows 2 full groups of five and 3 more single marks. How many is that altogether?", "", "Each full group of five counts as 5, so 2 groups are 10, and 10 + 3 single marks = 13."],
        ["בסימון קווים יש 2 קבוצות מלאות של חמישה ועוד 3 קווים בודדים. כמה זה בסך הכול?", "", "כל קבוצה מלאה של חמישה שווה 5, ולכן 2 קבוצות הן 10, ו־10 ועוד 3 קווים בודדים הם 13."]],
      [5, ["In a bar chart, the bar for cats is 12 tall and the bar for dogs is 7 tall. How many more cats than dogs are there?", "", "Subtract the two bar heights: 12 − 7 = 5, so there are 5 more cats than dogs."],
        ["בדיאגרמת עמודות העמודה של החתולים בגובה 12 והעמודה של הכלבים בגובה 7. כמה חתולים יש יותר מכלבים?", "", "מחסרים את גובהי העמודות: 12 − 7 = 5, ולכן יש 5 חתולים יותר מכלבים."]],
    ],
    s: [
      [["Finding out your classmates' favourite sport, in order", "Decide what question to ask", "Ask everyone and make a tally mark for each answer", "Count the tally marks for each sport", "Draw a bar chart of the counts", "Say which sport is the most popular"],
        ["בירור הספורט האהוב על חברי הכיתה, לפי הסדר", "מחליטים איזו שאלה לשאול", "שואלים את כולם ומסמנים קו אחד לכל תשובה", "סופרים את הקווים של כל ענף ספורט", "משרטטים דיאגרמת עמודות של הספירות", "אומרים איזה ענף ספורט הכי פופולרי"]],
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
      [["Test scores: 70, 80, 90. What is the mean?", "80", ["70", "90", "240"], "Add the scores and divide by how many there are: (70 + 80 + 90) ÷ 3 = 240 ÷ 3 = 80."],
        ["ציונים: 70, 80, 90. מהו הממוצע?", "80", ["70", "90", "240"], "מחברים את הציונים ומחלקים במספרם: (70 + 80 + 90) ÷ 3 = 240 ÷ 3 = 80."]],
      [["What is the median of 3, 9, 4, 7, 1?", "4", ["9", "7", "4.8"], "In order: 1, 3, 4, 7, 9 — the middle value is 4 (4.8 is the mean)."],
        ["מהו החציון של 3, 9, 4, 7, 1?", "4", ["9", "7", "4.8"], "בסדר עולה: 1, 3, 4, 7, 9 — הערך האמצעי הוא 4 (4.8 הוא הממוצע)."]],
      [["The mean of 4 numbers is 6. What is the sum of the 4 numbers?", "24", ["10", "1.5", "6"], "The mean is the sum divided by how many numbers there are, so the sum is the mean times the count: 6 × 4 = 24."],
        ["הממוצע של 4 מספרים הוא 6. מהו סכום 4 המספרים?", "24", ["10", "1.5", "6"], "הממוצע הוא הסכום חלקי מספר הערכים, ולכן הסכום הוא הממוצע כפול מספר הערכים: 6 × 4 = 24."]],
      [["What is the median of 2, 4, 6, 10?", "5", ["5.5", "4", "6"], "With an even number of values the median is halfway between the two middle ones, 4 and 6: (4 + 6) ÷ 2 = 5. The mean, 5.5, is a different average."],
        ["מהו החציון של 2, 4, 6, 10?", "5", ["5.5", "4", "6"], "כשמספר הערכים זוגי, החציון נמצא באמצע בין שני הערכים האמצעיים, 4 ו־6: (4 + 6) ÷ 2 = 5. הממוצע, 5.5, הוא מדד אחר."]],
      [["A shoe shop wants to decide which size to order the most pairs of. Which measure is the most useful?", "The mode", ["The mean", "The median", "The range"], "The shop needs the size that is bought most often, and that is the mode. A mean such as 38.6 might not even be a real shoe size, and the range only shows how spread out the sizes are."],
        ["חנות נעליים רוצה להחליט איזו מידה להזמין בכמות הגדולה ביותר. איזה מדד שימושי ביותר?", "השכיח", ["הממוצע", "החציון", "הטווח"], "החנות צריכה את המידה שקונים הכי הרבה, וזה השכיח. ממוצע כמו 38.6 אולי בכלל לא מידת נעל אמיתית, והטווח מראה רק עד כמה המידות מפוזרות."]],
    ],
    n: [
      [25, ["Temperatures this week ranged from 12 °C to 37 °C. What is the range?", "°C", "Range = largest − smallest = 37 − 12 = 25 °C."], ["הטמפרטורות השבוע נעו בין 12 °C ל־37 °C. מהו הטווח?", "°C", "טווח = הגדול ביותר − הקטן ביותר = 37 − 12 = 25 °C."]],
      [10, ["A pie chart shows a survey of 40 pupils. One slice takes up a quarter of the circle. How many pupils does that slice stand for?", "pupils", "A quarter of the circle is a quarter of the pupils: 40 ÷ 4 = 10 pupils."],
        ["דיאגרמת עוגה מציגה סקר של 40 תלמידים. פרוסה אחת תופסת רבע מהעיגול. כמה תלמידים הפרוסה הזאת מייצגת?", "תלמידים", "רבע מהעיגול הוא רבע מהתלמידים: 40 ÷ 4 = 10 תלמידים."]],
      [8, ["The mean of the four numbers 5, 7, 8 and x is 7. What is x?", "", "Four numbers with a mean of 7 add up to 4 × 7 = 28. The three known numbers add up to 5 + 7 + 8 = 20, so x = 28 − 20 = 8."],
        ["הממוצע של ארבעת המספרים 5, 7, 8 ו־x הוא 7. מהו x?", "", "ארבעה מספרים עם ממוצע 7 מסתכמים ב־4 × 7 = 28. שלושת המספרים הידועים מסתכמים ב־5 + 7 + 8 = 20, ולכן x = 28 − 20 = 8."]],
    ],
    s: [
      [["Finding the median of a set of values", "List all the values", "Put them in order from the smallest to the largest", "Find the middle position of the list", "Read the value in the middle; if there are two, take the number halfway between them"],
        ["מציאת החציון של קבוצת ערכים", "רושמים את כל הערכים", "מסדרים אותם מהקטן לגדול", "מוצאים את המקום האמצעי ברשימה", "קוראים את הערך שבאמצע; אם יש שניים, לוקחים את המספר שנמצא באמצע ביניהם"]],
    ],
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
      [["Ice-cream sales and drownings both rise in summer. What does this show?", "A correlation caused by a third factor, hot weather", ["Ice cream causes drowning, because both rise together", "Drowning makes people buy more ice cream", "The data must be wrong, because the two have nothing in common"], "Correlation is not causation: a third factor (heat, more swimming) drives both."],
        ["מכירות גלידה ומקרי טביעה עולים שניהם בקיץ. מה זה מראה?", "מתאם שנובע מגורם שלישי, מזג האוויר החם", ["גלידה גורמת לטביעה, כי שניהם עולים יחד", "טביעה גורמת לאנשים לקנות יותר גלידה", "הנתונים בהכרח שגויים, כי אין קשר בין שני הדברים"], "מתאם אינו סיבתיות: גורם שלישי (חום, יותר שחייה) משפיע על שניהם."]],
      [["A survey about school sport asks only members of the football team. What is the problem?", "The sample is biased", ["The sample is too random", "There is no problem", "The mean will be zero"], "Football players are not typical of all pupils, so the results lean one way."],
        ["סקר על ספורט בבית הספר שואל רק את חברי קבוצת הכדורגל. מה הבעיה?", "המדגם מוטה", ["המדגם אקראי מדי", "אין בעיה", "הממוצע יהיה אפס"], "שחקני כדורגל אינם מייצגים את כל התלמידים, ולכן התוצאות מוטות לכיוון אחד."]],
      [["A bar chart's vertical axis starts at 90 instead of 0, so the bars for 92 and 96 look very different. What is misleading about it?", "Cutting the axis exaggerates a small gap: 96 is only about 4% more than 92", ["The bars should have been drawn as a pie chart instead, to show the parts", "The chart should show only the mean of all the bars instead of each bar", "The numbers 92 and 96 are too close together to be shown on a chart"], "When the axis starts at 90, the bars show only the part above 90, so 6 looks three times as big as 2, although 96 is only about 4% more than 92. A bar chart should start at 0, so that the heights match the amounts."],
        ["ציר ה־y בדיאגרמת עמודות מתחיל ב־90 ולא ב־0, ולכן העמודות של 92 ושל 96 נראות שונות מאוד. מה מטעה בכך?", "חיתוך הציר מגזים בפער קטן: 96 גדול מ־92 רק בכ־4%", ["צריך היה לשרטט במקום זה דיאגרמת עוגה כדי להראות חלקים", "צריך היה להציג רק את הממוצע של כל העמודות ולא כל עמודה", "המספרים 92 ו־96 קרובים מדי כדי להציג אותם בדיאגרמה"], "כשהציר מתחיל ב־90, העמודות מראות רק את החלק שמעל 90, ולכן 6 נראה פי 3 מ־2, אף ש־96 גדול מ־92 רק בכ־4%. דיאגרמת עמודות צריכה להתחיל ב־0, כדי שהגבהים יתאימו לכמויות."]],
      [["A school has 600 pupils. Which sample would give the fairest picture of their favourite lunch?", "50 pupils picked at random from the list of all 600", ["The first 50 pupils to arrive at the canteen today", "One whole class of 30 pupils, because it is easy to ask", "10 friends of the person doing the survey"], "Picking at random gives every pupil the same chance, so the sample is not biased. The first pupils in the canteen, one class or a group of friends may like different lunches from the rest of the school."],
        ["בבית ספר יש 600 תלמידים. איזה מדגם ייתן את התמונה ההוגנת ביותר על ארוחת הצהריים האהובה עליהם?", "50 תלמידים שנבחרו באקראי מרשימת כל 600 התלמידים", ["50 התלמידים הראשונים שהגיעו היום לחדר האוכל", "כיתה שלמה של 30 תלמידים, כי קל לשאול אותם", "10 חברים של מי שעורך את הסקר"], "בחירה באקראי נותנת לכל תלמיד אותו סיכוי, ולכן המדגם אינו מוטה. התלמידים הראשונים בחדר האוכל, כיתה אחת או קבוצת חברים עשויים לאהוב ארוחות אחרות מאלה של שאר בית הספר."]],
      [["As the temperature goes up, sales of hot chocolate go down. What kind of correlation is this?", "A negative correlation", ["A positive correlation", "No correlation at all", "A correlation that proves the heat is the cause"], "When one quantity goes up while the other goes down, the correlation is negative. Correlation alone does not prove that one thing causes the other."],
        ["ככל שהטמפרטורה עולה, מכירות השוקו החם יורדות. איזה מתאם זה?", "מתאם שלילי", ["מתאם חיובי", "אין שום מתאם", "מתאם שמוכיח שהחום הוא הסיבה"], "כשגודל אחד עולה והשני יורד, המתאם שלילי. מתאם לבדו אינו מוכיח שדבר אחד גורם לשני."]],
    ],
    n: [
      [75, ["The mean of 5 test scores is 70. A sixth score of 100 is added. What is the new mean?", "", "The first five scores add up to 5 × 70 = 350. With the sixth score the total is 350 + 100 = 450, and 450 ÷ 6 = 75."],
        ["הממוצע של 5 ציונים הוא 70. מוסיפים ציון שישי, 100. מהו הממוצע החדש?", "", "חמשת הציונים הראשונים מסתכמים ב־5 × 70 = 350. עם הציון השישי הסכום הוא 350 + 100 = 450, ו־450 ÷ 6 = 75."]],
      [80, ["One class has 10 pupils with a mean of 60 points. Another class has 20 pupils with a mean of 90 points. What is the mean of all 30 pupils together?", "points", "The totals are 10 × 60 = 600 and 20 × 90 = 1,800, so the 30 pupils have 2,400 points together: 2,400 ÷ 30 = 80. Averaging 60 and 90 to get 75 would ignore that the second class is bigger."],
        ["בכיתה אחת 10 תלמידים עם ממוצע של 60 נקודות, ובכיתה אחרת 20 תלמידים עם ממוצע של 90 נקודות. מהו הממוצע של כל 30 התלמידים יחד?", "נקודות", "הסכומים הם 10 × 60 = 600 ו־20 × 90 = 1,800, ולכן ל־30 התלמידים יחד 2,400 נקודות: 2,400 ÷ 30 = 80. ממוצע של 60 ו־90, שנותן 75, מתעלם מכך שהכיתה השנייה גדולה יותר."]],
    ],
  },
};
export default c;
