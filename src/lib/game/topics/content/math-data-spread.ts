import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Spread", "how far the values in a set of data are scattered from each other", "פיזור", "עד כמה הערכים בקבוצת נתונים רחוקים זה מזה"],
      ["Range", "the largest value minus the smallest value of a set of data", "טווח", "הערך הגדול ביותר פחות הערך הקטן ביותר בקבוצת נתונים"],
      ["Quartiles", "the three values that split ordered data into four equal parts: Q1, Q2 (the median) and Q3", "רבעונים", "שלושת הערכים שמחלקים נתונים מסודרים לארבעה חלקים שווים: Q1, Q2 (החציון) ו־Q3"],
      ["Interquartile range", "Q3 − Q1, the upper quartile minus the lower one: the width of the middle half of the data", "טווח בין־רבעוני", "ההפרש Q3 − Q1, כלומר הרבעון העליון פחות התחתון: הרוחב של חצי הנתונים האמצעי"],
    ],
    q: [
      [["What is the range of 4, 9, 2, 7, 12?", "10", ["12", "7", "8"], "The largest value is 12 and the smallest is 2, so the range is 12 − 2 = 10. 7 is the median, a measure of the middle, not of spread."],
        ["מהו הטווח של 4, 9, 2, 7, 12?", "10", ["12", "7", "8"], "הערך הגדול ביותר הוא 12 והקטן ביותר הוא 2, ולכן הטווח הוא 12 − 2 = 10. המספר 7 הוא החציון, מדד למרכז ולא לפיזור."]],
      [["What is the median of 1, 4, 6, 13?", "5", ["6", "4", "10"], "The two middle values are 4 and 6, and the median is halfway between them: (4 + 6) ÷ 2 = 5. The mean, 24 ÷ 4 = 6, is pulled up by the 13."],
        ["מהו החציון של 1, 4, 6, 13?", "5", ["6", "4", "10"], "שני הערכים האמצעיים הם 4 ו־6, והחציון נמצא באמצע ביניהם: (4 + 6) ÷ 2 = 5. הממוצע, 24 ÷ 4 = 6, נמשך כלפי מעלה בגלל ה־13."]],
      [["Which measure of spread hardly changes when one value becomes extremely large?", "The interquartile range", ["The range, from smallest to largest", "The standard deviation", "The total of all the values"], "The interquartile range uses only the middle half of the data, Q3 − Q1, so a single extreme value at one end barely moves it. The range depends directly on the largest value, and the standard deviation uses every value, so both grow."],
        ["איזה מדד פיזור כמעט לא משתנה כשערך אחד נעשה גדול מאוד?", "הטווח הבין־רבעוני", ["הטווח, מהקטן ביותר ועד הגדול ביותר", "סטיית התקן", "הסכום של כל הערכים"], "הטווח הבין־רבעוני משתמש רק בחצי האמצעי של הנתונים, Q3 − Q1, ולכן ערך קיצוני אחד באחד הקצוות כמעט לא מזיז אותו. הטווח תלוי ישירות בערך הגדול ביותר, וסטיית התקן משתמשת בכל הערכים, ולכן שניהם גדלים."]],
      [["In a box plot, what does the box show?", "The middle half of the data, from Q1 to Q3", ["All the data, from the smallest to the largest value", "Only the values that are above the mean", "The quarter of the data around the mean"], "The box runs from the lower quartile Q1 to the upper quartile Q3, with a line at the median, so it holds the middle 50% of the data. The whiskers reach out to the smallest and largest values."],
        ["בדיאגרמת קופסה, מה מראה הקופסה?", "את חצי הנתונים האמצעי, מ־Q1 עד Q3", ["את כל הנתונים, מהערך הקטן ביותר ועד הגדול ביותר", "רק את הערכים שגדולים מהממוצע", "את רבע הנתונים שסביב הממוצע"], "הקופסה נמתחת מהרבעון התחתון Q1 עד הרבעון העליון Q3, עם קו בחציון, ולכן יש בה 50% האמצעיים של הנתונים. השפמים מגיעים עד הערך הקטן ביותר ועד הגדול ביותר."]],
      [["Two classes both have a mean test score of 70. In class A the scores go from 40 to 100, in class B from 65 to 75. Which is true?", "Class B's results are more alike", ["Every student in class A did better than in class B", "The two classes have exactly the same spread", "Class B has the bigger range of the two"], "The means are equal, but class B's range is 75 − 65 = 10 against class A's 100 − 40 = 60. Class B's scores are bunched close to the mean; class A's are much more spread out."],
        ["בשתי כיתות הציון הממוצע במבחן הוא 70. בכיתה א׳ הציונים הם בין 40 ל־100, ובכיתה ב׳ בין 65 ל־75. מה נכון?", "הציונים בכיתה ב׳ דומים יותר זה לזה", ["כל התלמידים בכיתה א׳ הצליחו יותר מאלה שבכיתה ב׳", "לשתי הכיתות יש בדיוק אותו פיזור", "בכיתה ב׳ הטווח גדול יותר"], "הממוצעים שווים, אבל הטווח בכיתה ב׳ הוא 75 − 65 = 10, ובכיתה א׳ הוא 100 − 40 = 60. הציונים בכיתה ב׳ צפופים סביב הממוצע, ובכיתה א׳ הם מפוזרים הרבה יותר."]],
    ],
    n: [
      [8, ["The lower quartile of a data set is 12 and the upper quartile is 20. What is the interquartile range?", "", "The interquartile range is Q3 − Q1 = 20 − 12 = 8: the width of the middle half of the data."],
        ["הרבעון התחתון של קבוצת נתונים הוא 12 והרבעון העליון הוא 20. מהו הטווח הבין־רבעוני?", "", "הטווח הבין־רבעוני הוא Q3 − Q1 = 20 − 12 = 8: הרוחב של חצי הנתונים האמצעי."]],
    ],
  },
  i: {
    t: [
      ["Box plot", "a diagram that shows the minimum, Q1, the median, Q3 and the maximum of a set of data", "דיאגרמת קופסה", "תרשים שמראה את הערך הקטן ביותר, את Q1, את החציון, את Q3 ואת הערך הגדול ביותר של קבוצת נתונים"],
      ["Outlier", "a value far from the rest; a common test is more than 1.5 × IQR below Q1 or above Q3", "ערך חריג", "ערך שרחוק מכל השאר; בדיקה מקובלת: יותר מפי 1.5 מהטווח הבין־רבעוני מתחת ל־Q1 או מעל Q3"],
      ["Variance", "the mean of the squared distances of the values from their mean", "שונות", "הממוצע של ריבועי המרחקים של הערכים מהממוצע שלהם"],
      ["Standard deviation", "the square root of the variance: a typical distance of the values from the mean", "סטיית תקן", "השורש הריבועי של השונות: מרחק טיפוסי של הערכים מהממוצע"],
    ],
    q: [
      [["With Q1 = 10 and Q3 = 18, which value is an outlier by the 1.5 × IQR rule?", "31", ["29", "−1", "27"], "IQR = 18 − 10 = 8 and 1.5 × 8 = 12. Values below 10 − 12 = −2 or above 18 + 12 = 30 are outliers, so of these only 31 qualifies."],
        ["כאשר Q1 = 10 ו־Q3 = 18, איזה ערך הוא חריג, אם חריג הוא ערך שרחוק מהקופסה ביותר מפי 1.5 מהטווח הבין־רבעוני?", "31", ["29", "−1", "27"], "הטווח הבין־רבעוני הוא 18 − 10 = 8, ו־1.5 × 8 = 12. ערכים מתחת ל־10 − 12 = −2 או מעל 18 + 12 = 30 הם חריגים, ולכן מבין אלה רק 31 חריג."]],
      [["5 is added to every value in a data set. What happens to the standard deviation?", "It stays the same", ["It increases by 5", "It increases by 25", "It is multiplied by 5"], "Adding 5 to every value moves the whole set up without changing the distances between the values or from the mean, so the spread is unchanged. The mean, however, goes up by 5."],
        ["מוסיפים 5 לכל ערך בקבוצת נתונים. מה קורה לסטיית התקן?", "היא לא משתנה", ["היא גדלה ב־5", "היא גדלה ב־25", "היא מוכפלת ב־5"], "הוספת 5 לכל ערך מזיזה את כל הקבוצה למעלה בלי לשנות את המרחקים בין הערכים או מהממוצע, ולכן הפיזור לא משתנה. הממוצע, לעומת זאת, גדל ב־5."]],
      [["Why is the standard deviation often preferred to the variance for describing spread?", "It is in the same units as the data", ["It is always the larger of the two numbers", "It ignores the extreme values", "It can be negative"], "The variance is a mean of squared distances, so for heights in cm it is in cm². Its square root, the standard deviation, is back in cm and easier to compare with the data."],
        ["למה מעדיפים לעיתים קרובות את סטיית התקן על פני השונות כדי לתאר פיזור?", "היא באותן יחידות כמו הנתונים", ["היא תמיד המספר הגדול מבין השניים", "היא מתעלמת מהערכים הקיצוניים", "היא יכולה להיות שלילית"], "השונות היא ממוצע של מרחקים בריבוע, ולכן כשהגבהים בס״מ היא בסמ״ר. השורש שלה, סטיית התקן, חוזר להיות בס״מ, וקל יותר להשוות אותו לנתונים."]],
      [["Which data set has the larger standard deviation: A = 5, 5, 5, 5 or B = 1, 5, 5, 9?", "B", ["A", "They are equal", "It cannot be told without working out the means"], "In A every value equals the mean, 5, so its standard deviation is 0. B has the same mean, 5, but 1 and 9 lie 4 away from it, so B is more spread out."],
        ["לאיזו קבוצת נתונים סטיית תקן גדולה יותר: A = 5, 5, 5, 5 או B = 1, 5, 5, 9?", "B", ["A", "הן שוות", "אי אפשר לדעת בלי לחשב את הממוצעים"], "ב־A כל ערך שווה לממוצע, 5, ולכן סטיית התקן היא 0. ל־B אותו ממוצע, 5, אבל 1 ו־9 רחוקים ממנו 4, ולכן B מפוזרת יותר."]],
      [["In a box plot the median line is much closer to Q1 than to Q3. What does this suggest?", "The quarter just above the median is more spread out than the quarter below it", ["The quarter just below the median is more spread out than the quarter above it", "The data are perfectly symmetric", "There are no outliers"], "Between Q1 and the median lies a quarter of the data, and so does between the median and Q3. If the second gap is wider, those higher values are more spread out: the data are skewed towards high values."],
        ["בדיאגרמת קופסה קו החציון קרוב הרבה יותר ל־Q1 מאשר ל־Q3. מה זה מרמז?", "הרבע שמעל החציון מפוזר יותר מהרבע שמתחתיו", ["הרבע שמתחת לחציון מפוזר יותר מהרבע שמעליו", "הנתונים סימטריים לגמרי", "אין ערכים חריגים"], "בין Q1 לחציון נמצא רבע מהנתונים, וגם בין החציון ל־Q3. אם הרווח השני רחב יותר, הערכים הגבוהים האלה מפוזרים יותר: יש לנתונים זנב לכיוון הערכים הגבוהים."]],
    ],
    n: [
      [7, ["Data: 3, 5, 5, 8, 10, 12, 12, 20. What is the interquartile range?", "", "The lower half 3, 5, 5, 8 has median Q1 = 5 and the upper half 10, 12, 12, 20 has median Q3 = 12, so the interquartile range is 12 − 5 = 7."],
        ["הנתונים: 3, 5, 5, 8, 10, 12, 12, 20. מהו הטווח הבין־רבעוני?", "", "לחצי התחתון 3, 5, 5, 8 יש חציון Q1 = 5, ולחצי העליון 10, 12, 12, 20 יש חציון Q3 = 12, ולכן הטווח הבין־רבעוני הוא 12 − 5 = 7."]],
      [2, ["Data: 2, 4, 4, 4, 5, 5, 7, 9, with mean 5. What is the standard deviation, dividing by the number of values?", "", "The squared distances from 5 are 9, 1, 1, 1, 0, 0, 4 and 16, which add up to 32. The variance is 32 ÷ 8 = 4, so the standard deviation is √4 = 2."],
        ["הנתונים: 2, 4, 4, 4, 5, 5, 7, 9, והממוצע 5. מהי סטיית התקן, כשמחלקים במספר הערכים?", "", "ריבועי המרחקים מ־5 הם 9, 1, 1, 1, 0, 0, 4 ו־16, וסכומם 32. השונות היא 32 ÷ 8 = 4, ולכן סטיית התקן היא √4 = 2."]],
    ],
  },
  a: {
    t: [
      ["Deviation from the mean", "the difference between a value and the mean; these differences always add up to 0", "סטייה מהממוצע", "ההפרש בין ערך לבין הממוצע; סכום ההפרשים האלה הוא תמיד 0"],
      ["Symmetric distribution", "data whose two sides mirror each other around the middle, so the mean and the median are equal or close", "התפלגות סימטרית", "נתונים ששני הצדדים שלהם הם תמונת ראי זה של זה סביב האמצע, ולכן הממוצע והחציון שווים או קרובים"],
      ["Mean absolute deviation", "the mean of how far the values are from their mean, with every distance counted as positive", "ממוצע הסטיות המוחלטות", "הממוצע של המרחקים של הערכים מהממוצע שלהם, כשכל מרחק נספר כחיובי"],
    ],
    q: [
      [["Temperatures in °C have a standard deviation of 5. They are converted to °F with F = 1.8C + 32. What is the new standard deviation?", "9", ["41", "5", "37"], "Multiplying by 1.8 stretches every distance from the mean by 1.8, so 5 becomes 9. Adding 32 shifts all the values equally and does not change the spread, which is why 41 is wrong."],
        ["לטמפרטורות במעלות צלזיוס יש סטיית תקן 5. ממירים אותן לפרנהייט לפי F = 1.8C + 32. מהי סטיית התקן החדשה?", "9", ["41", "5", "37"], "כפל ב־1.8 מותח כל מרחק מהממוצע פי 1.8, ולכן 5 הופך ל־9. הוספת 32 מזיזה את כל הערכים באותה מידה ולא משנה את הפיזור, ולכן 41 שגוי."]],
      [["A data set has mean 50 and standard deviation 4. A new value of exactly 50 is added. What happens to the standard deviation?", "It gets slightly smaller", ["It stays exactly the same", "It gets slightly larger", "It becomes 0"], "The new value adds 0 to the sum of squared distances but adds one to the count, so the mean squared distance, and with it the standard deviation, gets a little smaller. The mean stays 50."],
        ["לקבוצת נתונים ממוצע 50 וסטיית תקן 4. מוסיפים ערך חדש ששווה בדיוק 50. מה קורה לסטיית התקן?", "היא קטנה מעט", ["היא נשארת בדיוק אותו דבר", "היא גדלה מעט", "היא נעשית 0"], "הערך החדש מוסיף 0 לסכום ריבועי המרחקים, אבל מגדיל את מספר הערכים ב־1, ולכן הממוצע של ריבועי המרחקים, ואיתו סטיית התקן, קטן מעט. הממוצע נשאר 50."]],
      [["In a class of 20, the top score was typed as 95 instead of 59, and 59 is still the highest score. Which of these does NOT change when the mistake is corrected?", "The median", ["The mean", "The range", "The standard deviation"], "The median depends only on the middle of the ordered list, and the corrected 59 is still at the top of it, so the median stays put. The mean, the range and the standard deviation all use the top score, so they all drop."],
        ["בכיתה של 20 תלמידים הציון הגבוה ביותר הוקלד בטעות 95 במקום 59, ו־59 עדיין הציון הגבוה ביותר. מה מהבאים לא משתנה כשמתקנים את הטעות?", "החציון", ["הממוצע", "הטווח", "סטיית התקן"], "החציון תלוי רק באמצע הרשימה המסודרת, וה־59 המתוקן עדיין בראש הרשימה, ולכן החציון לא זז. הממוצע, הטווח וסטיית התקן משתמשים כולם בציון הגבוה ביותר, ולכן כולם יורדים."]],
      [["Set A has range 40 and IQR 10; set B has range 20 and IQR 15. Which statement is true?", "A has the wider ends, but B has the wider middle half", ["A is more spread out than B, both at the ends and in the middle", "B is more spread out than A, both at the ends and in the middle", "Both sets are spread out in exactly the same way"], "The range, 40 against 20, shows that A reaches further out at the ends. The IQR, 15 against 10, shows that B's middle half is wider. Different measures can disagree, so it is worth giving more than one."],
        ["לקבוצה A טווח 40 וטווח בין־רבעוני 10, ולקבוצה B טווח 20 וטווח בין־רבעוני 15. איזו טענה נכונה?", "הקצוות של A רחבים יותר, והאמצע של B רחב יותר", ["A מפוזרת יותר מ־B, גם בקצוות וגם בחצי האמצעי", "B מפוזרת יותר מ־A, גם בקצוות וגם בחצי האמצעי", "שתי הקבוצות מפוזרות בדיוק באותה צורה"], "הטווח, 40 לעומת 20, מראה ש־A מגיעה רחוק יותר בקצוות. הטווח הבין־רבעוני, 15 לעומת 10, מראה שהחצי האמצעי של B רחב יותר. מדדים שונים יכולים לא להסכים, ולכן כדאי לדווח על יותר ממדד אחד."]],
      [["Why do we square the deviations when working out the variance, instead of just averaging them?", "Because the deviations from the mean always add up to 0", ["Because squaring makes each deviation smaller and easier to work with", "Because negative values cannot be added together", "Because the mean is always a square number"], "Values above the mean give positive deviations and values below it give negative ones, and they always cancel exactly, so their average is 0. Squaring makes every deviation count as positive."],
        ["למה מעלים את הסטיות בריבוע כשמחשבים שונות, במקום פשוט לחשב את הממוצע שלהן?", "כי סכום הסטיות מהממוצע הוא תמיד 0", ["כי העלאה בריבוע מקטינה כל סטייה ומקלה על החישוב", "כי אי אפשר לחבר מספרים שליליים", "כי הממוצע הוא תמיד מספר ריבועי"], "ערכים מעל הממוצע נותנים סטיות חיוביות, וערכים מתחתיו נותנים סטיות שליליות, והן תמיד מתבטלות בדיוק, ולכן הממוצע שלהן הוא 0. העלאה בריבוע הופכת כל סטייה לחיובית."]],
    ],
    n: [
      [190, ["Five numbers have mean 6 and variance 2 (dividing by the number of values). What is the sum of their squares?", "", "Variance = (mean of the squares) − (mean)², so the mean of the squares is 2 + 6² = 38, and the sum of the five squares is 5 × 38 = 190."],
        ["לחמישה מספרים יש ממוצע 6 ושונות 2 (כשמחלקים במספר הערכים). מהו סכום הריבועים שלהם?", "", "השונות שווה לממוצע הריבועים פחות ריבוע הממוצע, ולכן ממוצע הריבועים הוא 2 + 6² = 38, וסכום חמשת הריבועים הוא 5 × 38 = 190."]],
      [2, ["The values 4, 8, 6 and 2 have mean 5. What is their mean absolute deviation?", "", "The distances from 5 are 1, 3, 1 and 3, and their mean is (1 + 3 + 1 + 3) ÷ 4 = 8 ÷ 4 = 2."],
        ["לערכים 4, 8, 6 ו־2 יש ממוצע 5. מהו ממוצע הסטיות המוחלטות שלהם?", "", "המרחקים מ־5 הם 1, 3, 1 ו־3, והממוצע שלהם הוא (1 + 3 + 1 + 3) ÷ 4 = 8 ÷ 4 = 2."]],
    ],
    s: [[["Working out a standard deviation, in order", "Find the mean of the data", "Subtract the mean from each value", "Square each of these deviations", "Find the mean of the squares: this is the variance", "Take the square root of the variance"],
      ["חישוב סטיית תקן, לפי הסדר", "מחשבים את הממוצע של הנתונים", "מחסרים את הממוצע מכל ערך", "מעלים בריבוע כל אחת מהסטיות", "מחשבים את הממוצע של הריבועים: זו השונות", "מוציאים שורש ריבועי מהשונות"]]],
  },
};
export default c;
