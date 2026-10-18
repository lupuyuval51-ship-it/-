import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Normal distribution", "a symmetric, bell-shaped distribution in which most values are near the mean and fewer lie far from it", "התפלגות נורמלית", "התפלגות סימטרית בצורת פעמון, שבה רוב הערכים קרובים לממוצע ומעטים רחוקים ממנו"],
      ["Bell curve", "the shape of a normal distribution's graph: highest in the middle and falling away evenly on both sides", "עקומת פעמון", "הצורה של גרף ההתפלגות הנורמלית: הגבוה ביותר באמצע ויורד באותו אופן לשני הצדדים"],
      ["Standard deviation (σ)", "the typical distance of the values from the mean; it sets how wide the bell is", "סטיית תקן (σ)", "המרחק הטיפוסי של הערכים מהממוצע; היא קובעת את רוחב הפעמון"],
    ],
    q: [
      [["In a normal distribution, where is the highest point of the bell curve?", "At the mean", ["One standard deviation above the mean", "At the smallest value", "Always at zero"], "The normal curve is symmetric about the mean, and the most common values are there, so the peak is at the mean. In a normal distribution the mean, the median and the mode are all equal."],
        ["בהתפלגות נורמלית, איפה נמצאת הנקודה הגבוהה ביותר של עקומת הפעמון?", "בממוצע", ["סטיית תקן אחת מעל הממוצע", "בערך הקטן ביותר", "תמיד באפס"], "העקומה הנורמלית סימטרית סביב הממוצע, והערכים השכיחים ביותר נמצאים שם, ולכן הפסגה נמצאת בממוצע. בהתפלגות נורמלית הממוצע, החציון והשכיח שווים."]],
      [["About what percentage of the values lie within one standard deviation of the mean?", "68%", ["95%", "50%", "34%"], "By the 68–95–99.7 rule, about 68% of the values lie within 1 standard deviation of the mean, 95% within 2 and 99.7% within 3. 34% is the share on just one side."],
        ["בערך כמה אחוזים מהערכים נמצאים במרחק של עד סטיית תקן אחת מהממוצע?", "68%", ["95%", "50%", "34%"], "לפי כלל 68–95–99.7, בערך 68% מהערכים נמצאים במרחק של עד סטיית תקן אחת מהממוצע, 95% עד שתיים ו־99.7% עד שלוש. 34% הם החלק שבצד אחד בלבד."]],
      [["Suppose the heights of a group are normal with mean 165 cm and standard deviation 7 cm. Between which heights are about 95% of them?", "151 cm and 179 cm", ["158 cm and 172 cm", "144 cm and 186 cm", "160 cm and 170 cm"], "95% lie within 2 standard deviations of the mean: 165 − 2 × 7 = 151 and 165 + 2 × 7 = 179. 158 to 172 is only 1 standard deviation each way, about 68%."],
        ["נניח שהגבהים בקבוצה מתפלגים נורמלית עם ממוצע 165 ס״מ וסטיית תקן 7 ס״מ. בין אילו גבהים נמצאים בערך 95% מהם?", "בין 151 ס״מ ל־179 ס״מ", ["בין 158 ס״מ ל־172 ס״מ", "בין 144 ס״מ ל־186 ס״מ", "בין 160 ס״מ ל־170 ס״מ"], "95% נמצאים במרחק של עד 2 סטיות תקן מהממוצע: 165 − 2 × 7 = 151 ו־165 + 2 × 7 = 179. בין 158 ל־172 יש רק סטיית תקן אחת לכל צד, כלומר בערך 68%."]],
      [["In a normal distribution, what percentage of the values are above the mean?", "50%", ["68%", "34%", "100%"], "The bell curve is symmetric about the mean, so exactly half of the area, 50%, lies on each side of it."],
        ["בהתפלגות נורמלית, כמה אחוזים מהערכים גדולים מהממוצע?", "50%", ["68%", "34%", "100%"], "עקומת הפעמון סימטרית סביב הממוצע, ולכן בדיוק חצי מהשטח, 50%, נמצא בכל צד שלו."]],
      [["Two normal curves have the same mean, but curve A is taller and narrower than curve B. What does that tell you?", "A's values are less spread out than B's", ["A's values are more spread out than B's", "A's mean is larger than B's", "A contains more values than B"], "The area under each curve is the same, 100%. A narrow, tall curve keeps most values close to the mean, so A has the smaller standard deviation."],
        ["לשתי עקומות נורמליות יש אותו ממוצע, אבל עקומה A גבוהה וצרה יותר מעקומה B. מה זה אומר?", "הערכים של A פחות מפוזרים מאלה של B", ["הערכים של A מפוזרים יותר מאלה של B", "הממוצע של A גדול מזה של B", "ב־A יש יותר ערכים מאשר ב־B"], "השטח מתחת לכל עקומה זהה, 100%. עקומה צרה וגבוהה שומרת את רוב הערכים קרוב לממוצע, ולכן ל־A סטיית התקן הקטנה יותר."]],
    ],
    n: [
      [80, ["Test scores are normal with mean 70 and standard deviation 10. Which score is one standard deviation above the mean?", "", "One standard deviation above the mean is the mean plus σ: 70 + 10 = 80."],
        ["הציונים במבחן מתפלגים נורמלית עם ממוצע 70 וסטיית תקן 10. איזה ציון נמצא סטיית תקן אחת מעל הממוצע?", "", "סטיית תקן אחת מעל הממוצע היא הממוצע ועוד σ: 70 + 10 = 80."]],
      [99.7, ["About what percentage of the values lie within 3 standard deviations of the mean?", "%", "By the 68–95–99.7 rule, about 99.7% of the values lie within 3 standard deviations of the mean; only 0.3% are further out."],
        ["בערך כמה אחוזים מהערכים נמצאים במרחק של עד 3 סטיות תקן מהממוצע?", "%", "לפי כלל 68–95–99.7, בערך 99.7% מהערכים נמצאים במרחק של עד 3 סטיות תקן מהממוצע; רק 0.3% רחוקים יותר."]],
    ],
  },
  i: {
    t: [
      ["Z-score", "how many standard deviations a value lies from the mean: z = (x − μ) ÷ σ", "ציון תקן", "כמה סטיות תקן ערך רחוק מהממוצע: z = (x − μ) ÷ σ"],
      ["68–95–99.7 rule", "in normal data about 68%, 95% and 99.7% of the values lie within 1, 2 and 3 standard deviations of the mean", "כלל 68–95–99.7", "בנתונים נורמליים בערך 68%, 95% ו־99.7% מהערכים נמצאים במרחק של עד 1, 2 ו־3 סטיות תקן מהממוצע"],
      ["Percentile", "the value below which a given percentage of the data lies", "אחוזון", "הערך שאחוז מסוים מהנתונים נמצא מתחתיו"],
    ],
    q: [
      [["What does a z-score of −2 mean?", "The value is 2 standard deviations below the mean", ["The value is 2 standard deviations above the mean", "The value is 2 points below the mean", "The value itself is negative"], "A z-score counts standard deviations from the mean, and the minus sign means below it. With mean 50 and σ = 5, for example, z = −2 is the value 40."],
        ["מה פירושו של ציון תקן z = −2?", "הערך נמצא 2 סטיות תקן מתחת לממוצע", ["הערך נמצא 2 סטיות תקן מעל לממוצע", "הערך נמוך ב־2 נקודות מהממוצע", "הערך עצמו שלילי"], "ציון תקן סופר סטיות תקן מהממוצע, והמינוס פירושו מתחת לממוצע. למשל, עם ממוצע 50 ו־σ = 5, ציון התקן −2 שייך לערך 40."]],
      [["Ron scored 75 in maths, where the class mean was 65 and σ = 5, and 80 in history, where the mean was 70 and σ = 10. In which subject did he do better compared with his class?", "Maths: 2 standard deviations above the mean", ["Both equally, since each score is 10 above the mean", "History, because 80 is higher than 75", "They cannot be compared, the tests are different"], "Maths: z = (75 − 65) ÷ 5 = 2. History: z = (80 − 70) ÷ 10 = 1. Both scores are 10 points above the mean, but in maths that is twice as far compared with the spread of the class."],
        ["רון קיבל 75 במתמטיקה, שבה הממוצע בכיתה היה 65 ו־σ = 5, ו־80 בהיסטוריה, שבה הממוצע היה 70 ו־σ = 10. באיזה מקצוע הוא הצליח יותר ביחס לכיתה שלו?", "במתמטיקה: 2 סטיות תקן מעל הממוצע", ["בשניהם באותה מידה, כי כל ציון גבוה ב־10 מהממוצע", "בהיסטוריה, כי 80 גבוה מ־75", "אי אפשר להשוות, המבחנים שונים"], "במתמטיקה z = (75 − 65) ÷ 5 = 2, ובהיסטוריה z = (80 − 70) ÷ 10 = 1. שני הציונים גבוהים ב־10 נקודות מהממוצע, אבל במתמטיקה זה מרחק כפול ביחס לפיזור של הכיתה."]],
      [["Scores are normal with mean 100 and standard deviation 15. Using the 68–95–99.7 rule, about what percentage score above 130?", "2.5%", ["5%", "16%", "0.15%"], "130 is (130 − 100) ÷ 15 = 2 standard deviations above the mean. 95% lie within 2 standard deviations, so 5% lie outside, half on each side: 2.5% above 130."],
        ["ציונים מתפלגים נורמלית עם ממוצע 100 וסטיית תקן 15. לפי כלל 68–95–99.7, בערך כמה אחוזים מקבלים יותר מ־130?", "2.5%", ["5%", "16%", "0.15%"], "הציון 130 נמצא (130 − 100) ÷ 15 = 2 סטיות תקן מעל הממוצע. 95% נמצאים בטווח של 2 סטיות תקן, ולכן 5% נמצאים מחוץ לו, חצי בכל צד: 2.5% מעל 130."]],
      [["Scores are normal with mean 50 and σ = 10. Which score is at about the 84th percentile?", "60", ["84", "70", "40"], "50% of the scores are below the mean, and another 34% lie between the mean and one standard deviation above it. So about 84% score below 50 + 10 = 60."],
        ["ציונים מתפלגים נורמלית עם ממוצע 50 ו־σ = 10. איזה ציון נמצא בערך באחוזון ה־84?", "60", ["84", "70", "40"], "50% מהציונים נמצאים מתחת לממוצע, ועוד 34% בין הממוצע לסטיית תקן אחת מעליו. לכן בערך 84% מקבלים פחות מ־50 + 10 = 60."]],
      [["Which of these is most likely to be roughly normally distributed?", "The heights of adult women in one country", ["The incomes of all the people in a country", "The results of rolling one fair die", "The ages of all the people in a school"], "Heights of adults of one sex cluster around a typical value and thin out evenly on both sides. Incomes have a long tail of very high values, and every face of a fair die is equally likely, so neither looks like a bell."],
        ["איזה מהבאים צפוי להתפלג בערך נורמלית?", "הגבהים של נשים בוגרות במדינה אחת", ["ההכנסות של כל האנשים במדינה", "התוצאות של הטלת קובייה הוגנת אחת", "הגילים של כל האנשים בבית ספר"], "גבהים של מבוגרים מאותו מין מתקבצים סביב ערך טיפוסי והולכים ומתמעטים באופן שווה לשני הצדדים. להכנסות יש זנב ארוך של ערכים גבוהים מאוד, ובקובייה הוגנת לכל פאה אותה הסתברות, ולכן אף אחת מהן לא נראית כמו פעמון."]],
    ],
    n: [
      [1.5, ["A test has mean 60 and standard deviation 8. Dana scored 72. What is her z-score?", "", "z = (72 − 60) ÷ 8 = 12 ÷ 8 = 1.5: her score is 1.5 standard deviations above the mean."],
        ["במבחן הממוצע הוא 60 וסטיית התקן 8. דנה קיבלה 72. מהו ציון התקן שלה?", "", "ציון התקן הוא z = (72 − 60) ÷ 8 = 12 ÷ 8 = 1.5: הציון שלה גבוה ב־1.5 סטיות תקן מהממוצע."]],
      [47.5, ["Scores are normal with mean 50 and standard deviation 10. Using the 68–95–99.7 rule, about what percentage score between 50 and 70?", "%", "50 to 70 runs from the mean to 2 standard deviations above it. That is half of the central 95%: 95 ÷ 2 = 47.5%."],
        ["ציונים מתפלגים נורמלית עם ממוצע 50 וסטיית תקן 10. לפי כלל 68–95–99.7, בערך כמה אחוזים מקבלים בין 50 ל־70?", "%", "התחום מ־50 עד 70 הוא מהממוצע ועד 2 סטיות תקן מעליו. זה חצי מ־95% שבמרכז: 95 ÷ 2 = 47.5%."]],
    ],
    s: [[["Comparing two results from different tests, in order", "Find the mean and the standard deviation of each test", "Subtract each test's mean from the score on it", "Divide each difference by its test's standard deviation", "Compare the two z-scores: the larger one is the better result"],
      ["השוואה בין תוצאות של שני מבחנים שונים, לפי הסדר", "מוצאים את הממוצע ואת סטיית התקן של כל מבחן", "מחסרים מכל ציון את הממוצע של המבחן שלו", "מחלקים כל הפרש בסטיית התקן של המבחן שלו", "משווים את שני ציוני התקן: הגדול מביניהם הוא התוצאה הטובה יותר"]]],
  },
  a: {
    t: [
      ["Standard normal distribution", "the normal distribution with mean 0 and standard deviation 1, the scale of z-scores", "התפלגות נורמלית סטנדרטית", "ההתפלגות הנורמלית שהממוצע שלה 0 וסטיית התקן שלה 1, הסולם של ציוני התקן"],
      ["Area under the curve", "the share of the values in an interval; under a normal curve the total area is 1, or 100%", "שטח מתחת לעקומה", "החלק של הערכים בתחום מסוים; השטח הכולל שמתחת לעקומה נורמלית הוא 1, כלומר 100%"],
      ["Tail", "a far end of a distribution, where the values are rare", "זנב", "קצה רחוק של התפלגות, שבו הערכים נדירים"],
    ],
    q: [
      [["Scores are normal with mean 70 and σ = 6. Using the 68–95–99.7 rule, about what percentage score between 64 and 82?", "81.5%", ["95%", "68%", "47.5%"], "64 is one standard deviation below the mean and 82 is two above it. From one below to the mean is 34% and from the mean to two above is 47.5%, so the total is 34 + 47.5 = 81.5%."],
        ["ציונים מתפלגים נורמלית עם ממוצע 70 ו־σ = 6. לפי כלל 68–95–99.7, בערך כמה אחוזים מקבלים בין 64 ל־82?", "81.5%", ["95%", "68%", "47.5%"], "הציון 64 נמצא סטיית תקן אחת מתחת לממוצע, ו־82 נמצא שתי סטיות תקן מעליו. מסטיית תקן אחת מתחת ועד הממוצע יש 34%, ומהממוצע ועד שתי סטיות תקן מעליו יש 47.5%, ובסך הכול 34 + 47.5 = 81.5%."]],
      [["In a normal distribution with mean 40, about 16% of the values are above 52. What is the standard deviation?", "12", ["6", "16", "52"], "Above one standard deviation over the mean lie 50% − 34% = 16% of the values. So 52 is one standard deviation above 40, and σ = 52 − 40 = 12."],
        ["בהתפלגות נורמלית שהממוצע שלה 40, בערך 16% מהערכים גדולים מ־52. מהי סטיית התקן?", "12", ["6", "16", "52"], "מעל הנקודה שנמצאת סטיית תקן אחת מעל הממוצע נמצאים 50% − 34% = 16% מהערכים. לכן 52 נמצא סטיית תקן אחת מעל 40, ו־σ = 52 − 40 = 12."]],
      [["A machine makes bolts with mean length 50 mm and σ = 0.5 mm. One bolt is 52 mm long. What should an inspector conclude?", "z = 4: such a bolt is extremely rare", ["z = 2: about 1 bolt in 40 is this long", "Only 2 mm off, so nothing unusual", "z = 0.04: almost every bolt is like it"], "z = (52 − 50) ÷ 0.5 = 4. Even 3 standard deviations from the mean is rare, outside the central 99.7%, so a bolt 4 standard deviations away suggests that something is wrong with the machine."],
        ["מכונה מייצרת ברגים באורך ממוצע של 50 מ״מ עם σ = 0.5 מ״מ. בורג אחד אורכו 52 מ״מ. מה צריך הבודק להסיק?", "z = 4: בורג כזה נדיר מאוד", ["z = 2: בערך בורג אחד מכל 40 ארוך כל כך", "הוא חורג רק ב־2 מ״מ, אז אין בזה שום דבר מיוחד", "z = 0.04: כמעט כל בורג הוא כזה"], "לפי החישוב z = (52 − 50) ÷ 0.5 = 4. אפילו 3 סטיות תקן מהממוצע זה נדיר, מחוץ ל־99.7% שבמרכז, ולכן בורג שנמצא 4 סטיות תקן מהממוצע מרמז שמשהו לא תקין במכונה."]],
      [["Why can the 68–95–99.7 rule not be used for the incomes in a country?", "The distribution of incomes is skewed, not bell-shaped", ["The rule works only when the mean is a small whole number like 0 or 1", "Incomes have no mean, because some people earn nothing at all", "The rule works only for exam results"], "The rule describes the bell curve only. Incomes are skewed: most people are bunched at moderate values and a few earn far more, so the shares within 1, 2 and 3 standard deviations are different."],
        ["למה אי אפשר להשתמש בכלל 68–95–99.7 עבור ההכנסות במדינה?", "התפלגות ההכנסות אסימטרית ואינה בצורת פעמון", ["הכלל עובד רק כשהממוצע הוא מספר שלם קטן, כמו 0 או 1", "להכנסות אין ממוצע, כי יש אנשים שלא מרוויחים כלום", "הכלל עובד רק לציוני מבחנים"], "הכלל מתאר רק את עקומת הפעמון. התפלגות ההכנסות אסימטרית: רוב האנשים מרוכזים בערכים בינוניים ומעטים מרוויחים הרבה יותר, ולכן האחוזים בטווח של 1, 2 ו־3 סטיות תקן שונים."]],
      [["Scores are normal: 2.5% score below 40 and 2.5% score above 80. Using the 68–95–99.7 rule, what are the mean and the standard deviation?", "Mean 60, σ = 10", ["Mean 60, σ = 20", "Mean 60, σ = 40", "Mean 40, σ = 20"], "By symmetry the mean is halfway between the cut-offs: (40 + 80) ÷ 2 = 60. Each cut-off is 2 standard deviations away, so 2σ = 20 and σ = 10."],
        ["ציונים מתפלגים נורמלית: 2.5% מקבלים פחות מ־40, ו־2.5% מקבלים יותר מ־80. לפי כלל 68–95–99.7, מהם הממוצע וסטיית התקן?", "ממוצע 60, σ = 10", ["ממוצע 60, σ = 20", "ממוצע 60, σ = 40", "ממוצע 40, σ = 20"], "בגלל הסימטריה הממוצע נמצא באמצע בין שתי נקודות החיתוך: (40 + 80) ÷ 2 = 60. כל אחת מהן נמצאת 2 סטיות תקן מהממוצע, ולכן 2σ = 20 ו־σ = 10."]],
    ],
    n: [
      [88, ["Exam scores are normal with mean 72 and standard deviation 8. Using the 68–95–99.7 rule, what score is at the 97.5th percentile?", "", "97.5% below means 2.5% above, which is 2 standard deviations above the mean: 72 + 2 × 8 = 88."],
        ["ציוני מבחן מתפלגים נורמלית עם ממוצע 72 וסטיית תקן 8. לפי כלל 68–95–99.7, איזה ציון נמצא באחוזון ה־97.5?", "", "97.5% מתחת פירושו 2.5% מעל, כלומר 2 סטיות תקן מעל הממוצע: 72 + 2 × 8 = 88."]],
      [71, ["A score has a z-score of −1.5 on a test with mean 80 and σ = 6. What is the score?", "", "Turn the z-score back into a score: x = μ + z·σ = 80 + (−1.5) × 6 = 80 − 9 = 71."],
        ["לציון במבחן שהממוצע שלו 80 ו־σ = 6 יש ציון תקן −1.5. מהו הציון?", "", "הופכים את ציון התקן בחזרה לציון: x = μ + z·σ = 80 + (−1.5) × 6 = 80 − 9 = 71."]],
    ],
    s: [[["From the most typical score to the most unusual (mean 50, σ = 10)", "52", "41", "65", "28", "85"],
      ["מהציון הטיפוסי ביותר ועד החריג ביותר (ממוצע 50, σ = 10)", "52", "41", "65", "28", "85"]]],
  },
};
export default c;
