import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Gross pay", "the full amount earned in the pay period, before anything is taken off", "שכר ברוטו", "הסכום המלא שהרווחתם בתקופת התשלום, לפני שמורידים ממנו משהו"],
      ["Net pay", "the money that actually reaches your bank account after everything is taken off", "שכר נטו", "הכסף שמגיע בפועל לחשבון הבנק שלכם אחרי שהורידו את כל מה שצריך"],
      ["Deduction", "an amount taken off the pay, such as income tax or a pension payment", "ניכוי", "סכום שמורידים מהשכר, כמו מס הכנסה או תשלום לפנסיה"],
      ["Payslip", "the monthly document from the employer that shows how the pay was worked out", "תלוש שכר", "מסמך חודשי מהמעסיק שמראה איך חושב השכר"],
    ],
    q: [
      [["Which of these figures on a payslip is normally the largest?", "Gross pay", ["Net pay", "Income tax", "The pension deduction"], "Net pay is what is left after tax and the other deductions are taken off the gross pay, so the gross figure is the largest: the tax and the deductions are only parts of it."],
        ["איזה מהסכומים האלה בתלוש השכר הוא בדרך כלל הגדול ביותר?", "השכר ברוטו", ["השכר נטו", "מס ההכנסה", "הניכוי לפנסיה"], "השכר נטו הוא מה שנשאר אחרי שמורידים מהברוטו מס וניכויים אחרים, ולכן הברוטו הוא הסכום הגדול ביותר: המס והניכויים הם רק חלקים ממנו."]],
      [["Who gives a worker a payslip?", "The employer", ["The tax authority", "The worker's bank", "The worker's old school"], "The employer works out the pay, takes off the deductions and gives the worker a payslip that shows how it was all calculated."],
        ["מי נותן לעובד תלוש שכר?", "המעסיק", ["רשות המסים", "הבנק של העובד", "בית הספר שבו העובד למד"], "המעסיק מחשב את השכר, מוריד ממנו את הניכויים ונותן לעובד תלוש שמראה איך הכול חושב."]],
      [["Where does the income tax taken from your pay end up?", "With the state, to pay for public services", ["With the employer, as part of the firm's profit", "In a savings account in your own name", "In the shops where you buy your food"], "The employer passes the income tax it takes from your pay on to the tax authority, and the state uses tax money for schools, roads, hospitals and other services."],
        ["לאן מגיע מס ההכנסה שמורידים מהשכר שלכם?", "למדינה, שמממנת בו שירותים ציבוריים", ["למעסיק, שמוסיף אותו לרווח של החברה שלו", "לחשבון חיסכון שנפתח על שמכם", "לחנויות שבהן אתם קונים אוכל"], "המעסיק מעביר את מס ההכנסה שהוריד מהשכר לרשות המסים, והמדינה משתמשת בכספי המסים לבתי ספר, לכבישים, לבתי חולים ולשירותים נוספים."]],
      [["Which line on a payslip is a deduction?", "Income tax", ["Overtime pay", "Base salary", "Hours worked"], "Income tax is taken off the pay. Overtime pay and base salary are added together to make the gross pay, and hours worked is only a count."],
        ["איזו שורה בתלוש השכר היא ניכוי?", "מס הכנסה", ["תשלום על שעות נוספות", "שכר יסוד", "מספר שעות העבודה"], "מס הכנסה יורד מהשכר. התשלום על שעות נוספות ושכר היסוד מצטרפים יחד לשכר ברוטו, ומספר שעות העבודה הוא רק נתון."]],
      [["Why is it worth checking your payslip every month?", "To catch mistakes in hours, pay or deductions", ["Because you must sign it and send it to the tax authority", "Because the bank will not pay you without seeing it", "Because a payslip works like a lottery ticket"], "Mistakes happen: a missing hour or a wrong deduction changes what you receive, and you can only ask for a fix for what you have noticed."],
        ["למה כדאי לבדוק את תלוש השכר בכל חודש?", "כדי לגלות טעויות בשעות, בשכר או בניכויים", ["כי צריך לחתום עליו ולשלוח אותו לרשות המסים", "כי בלי לראות אותו הבנק לא יעביר לכם כסף", "כי תלוש שכר הוא כמו כרטיס הגרלה"], "טעויות קורות: שעה שחסרה או ניכוי שגוי משנים את מה שתקבלו, ואפשר לבקש תיקון רק של מה ששמתם לב אליו."]],
    ],
    n: [
      [3200, ["A worker did 80 hours in a month at 40 ₪ an hour. What is the gross pay?", "₪", "Gross pay is the hours times the hourly rate: 80 × 40 = 3,200 ₪, before any deductions are taken off."],
        ["עובד עבד 80 שעות בחודש בשכר של 40 ₪ לשעה. מהו השכר ברוטו?", "₪", "שכר ברוטו הוא מספר השעות כפול השכר לשעה: 80 × 40 = 3,200 ₪, לפני שמורידים ממנו ניכויים."]],
    ],
    s: [
      [["From work to money in the bank", "You work your hours during the month", "The employer adds up your gross pay", "Tax and other deductions are taken off", "The net pay is paid into your bank account"],
        ["מהעבודה ועד הכסף בבנק", "עובדים את השעות במהלך החודש", "המעסיק מחשב את השכר ברוטו", "מורידים מהשכר מס וניכויים אחרים", "השכר נטו מועבר לחשבון הבנק"]],
    ],
  },
  i: {
    t: [
      ["National Insurance", "a compulsory payment from pay that funds state benefits such as old-age, unemployment and maternity pay", "ביטוח לאומי", "תשלום חובה מהשכר שמממן קצבאות של המדינה, כמו קצבת זקנה, דמי אבטלה ודמי לידה"],
      ["Health tax", "in Israel, a compulsory payment from pay that helps fund the health care every resident gets through a health fund", "מס בריאות", "בישראל, תשלום חובה מהשכר שעוזר לממן את שירותי הבריאות שכל תושב מקבל דרך קופת חולים"],
      ["Overtime", "hours worked beyond the normal working day, usually paid at a higher rate", "שעות נוספות", "שעות עבודה מעבר ליום העבודה הרגיל, שמשולמות בדרך כלל בתעריף גבוה יותר"],
      ["Employer contribution", "money the employer pays on top of your pay, for example into your pension, without taking it off your pay", "הפרשת מעסיק", "כסף שהמעסיק משלם מעבר לשכר שלכם, למשל לקרן הפנסיה, בלי להוריד אותו מהשכר"],
    ],
    q: [
      [["Your payslip's pension lines show your own contribution and an employer contribution. Which statement is true?", "Only your own part is taken off your gross pay", ["Both parts are taken off your gross pay", "Neither part ever reaches your pension fund", "The employer's part is sent to the tax authority instead"], "Your own contribution is a deduction; the employer's contribution is extra money paid into the same fund on top of your pay. Both reach your pension, but only yours lowers your net pay."],
        ["בשורות הפנסיה בתלוש מופיעים החלק שלכם וחלק המעסיק. מה נכון?", "רק החלק שלכם יורד מהשכר ברוטו", ["שני החלקים יורדים מהשכר ברוטו", "אף אחד מהחלקים לא מגיע לקרן הפנסיה", "חלק המעסיק מועבר לרשות המסים במקום לקרן"], "החלק שלכם הוא ניכוי, וחלק המעסיק הוא כסף נוסף שמשולם לאותה קרן מעבר לשכר. שניהם מגיעים לפנסיה, אבל רק החלק שלכם מקטין את השכר נטו."]],
      [["An hour is paid 40 ₪ and an overtime hour is paid at 125%. How much is one overtime hour worth?", "50 ₪", ["45 ₪", "60 ₪", "125 ₪"], "125% of 40 is 40 × 1.25 = 50 ₪: the normal 40 ₪ plus a quarter more (10 ₪). 60 ₪ would be 150%."],
        ["שעה רגילה משולמת 40 ₪ ושעה נוספת משולמת ב־125%. כמה שווה שעה נוספת אחת?", "50 ₪", ["45 ₪", "60 ₪", "125 ₪"], "125% מ־40 הם 40 × 1.25 = 50 ₪: ה־40 ₪ הרגילים ועוד רבע מהם (10 ₪). 60 ₪ היו 150%."]],
      [["Two workers have the same gross pay but different net pay. What could explain it?", "Their tax credits or deductions are different", ["One of them worked fewer hours that month", "The bank pays each of them at a different rate", "The payroll program picks net pay at random"], "With the same gross pay, the difference must come from what is taken off: different tax credits, a bigger pension deduction or a study-fund deduction. Fewer hours would have changed the gross pay itself."],
        ["לשני עובדים אותו שכר ברוטו אבל שכר נטו שונה. מה יכול להסביר את זה?", "נקודות הזיכוי או הניכויים שלהם שונים", ["אחד מהם עבד פחות שעות באותו חודש", "הבנק משלם לכל אחד מהם בשער אחר", "תוכנת השכר בוחרת את הנטו באקראי"], "כשהברוטו זהה, ההבדל חייב לבוא ממה שמורידים: נקודות זיכוי שונות, ניכוי גדול יותר לפנסיה או ניכוי לקרן השתלמות. פחות שעות היו משנות את הברוטו עצמו."]],
      [["What does the cumulative ('year to date') part of a payslip show?", "Totals since the start of the tax year", ["The figures for this month only, nothing earlier", "An estimate of next year's pay", "The employer's profit for the year"], "Cumulative figures add up all the months so far in the tax year, which in Israel is the calendar year. They help check the tax over the whole year."],
        ["מה מראים הנתונים המצטברים בתלוש השכר?", "סכומים מתחילת שנת המס", ["רק את הנתונים של החודש הזה, בלי חודשים קודמים", "הערכה של השכר בשנה הבאה", "את הרווח השנתי של המעסיק"], "הנתונים המצטברים מחברים את כל החודשים עד עכשיו בשנת המס, שבישראל היא השנה הקלנדרית. הם עוזרים לבדוק את המס על פני כל השנה."]],
      [["A payslip line says 'holiday balance: 8 days'. What does it mean?", "You still have 8 paid days off that you can take", ["You took 8 unpaid days off during this month", "You must work 8 extra days to make up for lost time", "Your employer owes you 8 days of overtime pay"], "The balance shows paid leave you have earned but not used yet. Checking it helps you plan holidays and make sure no days are missing."],
        ["בתלוש מופיעה השורה ״יתרת ימי חופשה: 8״. מה המשמעות?", "נשארו לכם 8 ימי חופשה בתשלום שאפשר לנצל", ["לקחתם החודש 8 ימי חופשה בלי תשלום", "אתם צריכים לעבוד 8 ימים נוספים כדי להשלים", "המעסיק חייב לכם 8 ימים של שעות נוספות"], "היתרה מראה ימי חופשה בתשלום שצברתם ועדיין לא ניצלתם. כדאי לבדוק אותה כדי לתכנן חופשות ולוודא שלא חסרים ימים."]],
    ],
    n: [
      [6500, ["Gross pay is 8,000 ₪ and all the deductions together come to 1,500 ₪. What is the net pay?", "₪", "Net pay is gross pay minus the deductions: 8,000 − 1,500 = 6,500 ₪."],
        ["השכר ברוטו הוא 8,000 ₪ וכל הניכויים יחד הם 1,500 ₪. מהו השכר נטו?", "₪", "שכר נטו הוא הברוטו פחות הניכויים: 8,000 − 1,500 = 6,500 ₪."]],
      [360, ["Gross pay is 6,000 ₪ and your pension deduction is 6%. How many shekels are deducted?", "₪", "6% of 6,000 is 0.06 × 6,000 = 360 ₪, which goes from your pay into your pension fund."],
        ["השכר ברוטו הוא 6,000 ₪ והניכוי שלכם לפנסיה הוא 6%. כמה שקלים מנוכים?", "₪", "6% מ־6,000 הם 0.06 × 6,000 = 360 ₪, שעוברים מהשכר שלכם לקרן הפנסיה."]],
    ],
  },
  a: {
    t: [
      ["Tax credit points", "units that lower the income tax a person in Israel pays; residents, parents and others receive them", "נקודות זיכוי", "יחידות שמקטינות את מס ההכנסה שאדם בישראל משלם; תושבים, הורים ואחרים מקבלים אותן"],
      ["Marginal tax rate", "the rate charged on the next shekel earned, set by the highest bracket the income reaches", "שיעור מס שולי", "השיעור שנגבה על השקל הבא שמרוויחים, לפי המדרגה הגבוהה ביותר שההכנסה מגיעה אליה"],
      ["Study fund", "in Israel, a savings fund that worker and employer pay into, which can usually be withdrawn after six years", "קרן השתלמות", "בישראל, קופת חיסכון שהעובד והמעסיק מפרישים אליה, ובדרך כלל אפשר למשוך ממנה אחרי שש שנים"],
      ["Employer cost", "the full price of a job to the employer: the gross pay plus the employer's own contributions", "עלות מעביד", "המחיר המלא של משרה למעסיק: השכר ברוטו ועוד ההפרשות שהוא משלם בעצמו"],
    ],
    q: [
      [["After a raise you move into a higher tax bracket. A friend says you will now take home less than before. What is wrong with that?", "Only the income above the threshold pays the higher rate", ["Nothing: crossing into a higher bracket raises the tax on every shekel", "Tax brackets apply to employers, not to workers", "Higher brackets actually have lower tax rates"], "Brackets work in slices: income below the threshold is still taxed at the lower rate and only the extra part pays more, so after a raise you still take home more than before."],
        ["אחרי העלאה במשכורת עברתם למדרגת מס גבוהה יותר. חבר אומר שעכשיו תקבלו נטו פחות מקודם. מה שגוי בדבריו?", "רק ההכנסה שמעל הסף משלמת את השיעור הגבוה", ["שום דבר: מעבר למדרגה גבוהה מעלה את המס על כל שקל", "מדרגות מס חלות על מעסיקים ולא על עובדים", "במדרגות הגבוהות שיעור המס בעצם נמוך יותר"], "המדרגות פועלות כמו פרוסות: ההכנסה שמתחת לסף ממוסה עדיין בשיעור הנמוך ורק החלק הנוסף משלם יותר, ולכן אחרי ההעלאה נשאר לכם יותר נטו מקודם."]],
      [["Your gross pay rises by 500 ₪. Your marginal tax rate is 20% and other deductions take another 7%. By how much does your net pay rise?", "365 ₪", ["400 ₪", "135 ₪", "500 ₪"], "Each extra shekel loses 20% + 7% = 27%, so you keep 73%: 0.73 × 500 = 365 ₪. 400 ₪ forgets the other deductions, and 135 ₪ is the part that is taken, not kept."],
        ["השכר ברוטו שלכם עולה ב־500 ₪. שיעור המס השולי שלכם הוא 20%, וניכויים אחרים לוקחים עוד 7%. בכמה עולה השכר נטו?", "365 ₪", ["400 ₪", "135 ₪", "500 ₪"], "מכל שקל נוסף יורדים 20% + 7% = 27%, ולכן נשארים לכם 73%: 0.73 × 500 = 365 ₪. 400 ₪ שוכח את הניכויים האחרים, ו־135 ₪ הם מה שיורד ולא מה שנשאר."]],
      [["A job's employer cost is 12,000 ₪ a month and the gross pay is 10,000 ₪. What does the 2,000 ₪ difference mainly pay for?", "The employer's own pension and National Insurance payments", ["The income tax that is taken from the worker's gross pay", "A yearly bonus that is paid straight into the worker's account", "The worker's own pension deduction"], "The employer pays its own share of pension, severance and National Insurance on top of the gross pay. Income tax and the worker's pension deduction come out of the 10,000 ₪, not on top of it."],
        ["עלות המעביד של משרה היא 12,000 ₪ בחודש והשכר ברוטו הוא 10,000 ₪. על מה משולם בעיקר ההפרש של 2,000 ₪?", "על ההפרשות של המעסיק עצמו לפנסיה ולביטוח לאומי", ["על מס ההכנסה שיורד מהשכר ברוטו של העובד", "על מענק שנתי שהמעסיק מעביר ישר לחשבון הבנק של העובד", "על הניכוי של העובד עצמו לפנסיה"], "המעסיק משלם את חלקו בפנסיה, בפיצויים ובביטוח הלאומי מעבר לשכר ברוטו. מס ההכנסה והניכוי של העובד לפנסיה יורדים מתוך 10,000 השקלים, ולא מתווספים עליהם."]],
      [["Your gross pay is 10,000 ₪, your pension deduction is 6% and the employer adds 6.5%. How much goes into your pension fund each month?", "1,250 ₪", ["600 ₪", "650 ₪", "1,000 ₪"], "6% of 10,000 is 600 ₪ from you and 6.5% is 650 ₪ from the employer: 600 + 650 = 1,250 ₪. Picking 600 ₪ forgets that the employer's part goes into the same fund."],
        ["השכר ברוטו שלכם הוא 10,000 ₪, הניכוי שלכם לפנסיה הוא 6% והמעסיק מוסיף 6.5%. כמה כסף נכנס לקרן הפנסיה שלכם בכל חודש?", "1,250 ₪", ["600 ₪", "650 ₪", "1,000 ₪"], "6% מ־10,000 הם 600 ₪ מכם, ו־6.5% הם 650 ₪ מהמעסיק: 600 + 650 = 1,250 ₪. מי שבוחר 600 ₪ שוכח שחלק המעסיק נכנס לאותה קרן."]],
      [["In Israel, why might the payslip from a second job show a much higher income tax than the first?", "Without tax coordination, it is taxed at the top rate", ["Second jobs always pay less per hour, so the tax share grows", "Each employer adds its own payroll fee to the income tax line", "The law does not let anyone hold two jobs at the same time"], "Credit points and the low brackets are normally used at the main job, so a second employer takes tax at the highest rate. Arranging tax coordination spreads the brackets correctly and can lower that tax."],
        ["בישראל, למה בתלוש של עבודה שנייה עשוי להופיע מס הכנסה גבוה בהרבה מאשר בראשונה?", "בלי תיאום מס היא ממוסה בשיעור המרבי", ["בעבודה שנייה תמיד משלמים פחות לשעה, ולכן אחוז המס עולה", "כל מעסיק מוסיף לשורת המס עמלה משלו על חישוב השכר", "החוק לא מרשה לאף אחד לעבוד בשתי עבודות בבת אחת"], "נקודות הזיכוי והמדרגות הנמוכות מנוצלות בדרך כלל בעבודה העיקרית, ולכן המעסיק השני מנכה מס בשיעור הגבוה ביותר. תיאום מס מחלק את המדרגות נכון ויכול להקטין את המס הזה."]],
    ],
    n: [
      [980, ["Income up to 7,000 ₪ a month is taxed at 10% and income above that at 14%. How much tax is due on 9,000 ₪?", "₪", "10% of 7,000 = 700 ₪, and 14% of the remaining 2,000 = 280 ₪, so the tax is 700 + 280 = 980 ₪."],
        ["הכנסה של עד 7,000 ₪ בחודש ממוסה ב־10%, והכנסה שמעל זה ב־14%. כמה מס משלמים על 9,000 ₪?", "₪", "10% מ־7,000 = 700 ₪, ו־14% מ־2,000 הנותרים = 280 ₪, ולכן המס הוא 700 + 280 = 980 ₪."]],
      [7110, ["Gross pay is 9,000 ₪. Income tax is 900 ₪, National Insurance and health tax together are 5% of gross, and the pension deduction is 6% of gross. What is the net pay?", "₪", "5% of 9,000 = 450 ₪ and 6% of 9,000 = 540 ₪. Net pay = 9,000 − 900 − 450 − 540 = 7,110 ₪."],
        ["השכר ברוטו הוא 9,000 ₪. מס ההכנסה הוא 900 ₪, ביטוח לאומי ומס בריאות יחד הם 5% מהברוטו, והניכוי לפנסיה הוא 6% מהברוטו. מהו השכר נטו?", "₪", "5% מ־9,000 = 450 ₪ ו־6% מ־9,000 = 540 ₪. נטו = 9,000 − 900 − 450 − 540 = 7,110 ₪."]],
    ],
    s: [
      [["Working out a monthly net pay", "Add base pay, overtime and allowances into the gross pay", "Apply the tax brackets to find the income tax", "Lower that tax by the value of the credit points", "Take the tax and the other deductions off the gross pay", "What remains is the net pay"],
        ["חישוב השכר נטו של חודש", "מחברים שכר יסוד, שעות נוספות ותוספות לשכר ברוטו", "מפעילים את מדרגות המס ומוצאים את מס ההכנסה", "מקטינים את המס לפי השווי של נקודות הזיכוי", "מורידים מהברוטו את המס ואת שאר הניכויים", "מה שנשאר הוא השכר נטו"]],
    ],
  },
};
export default c;
