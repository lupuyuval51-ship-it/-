import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Interest", "money paid for the use of money: a bank pays it on savings and charges it on loans", "ריבית", "תשלום על שימוש בכסף: הבנק משלם אותו על חיסכון וגובה אותו על הלוואה"],
      ["Interest rate", "the interest for a period, usually one year, written as a percentage of the money", "שיעור ריבית", "התשלום על הכסף לתקופה, בדרך כלל לשנה, שנכתב באחוזים מהסכום"],
      ["Deposit", "money left in the bank for an agreed time, which earns interest", "פיקדון", "כסף שמשאירים בבנק לזמן מוסכם, ומקבלים עליו ריבית"],
    ],
    q: [
      [["You save 200 ₪ at 5% interest a year. How much interest do you get after one year?", "10 ₪", ["20 ₪", "5 ₪", "205 ₪"], "5% means 5 out of every 100. 200 ₪ has two hundreds, so the interest is 2 × 5 = 10 ₪."],
        ["חסכתם 200 ₪ בריבית של 5% לשנה. כמה ריבית תקבלו אחרי שנה?", "10 ₪", ["20 ₪", "5 ₪", "205 ₪"], "5% פירושו 5 מכל 100. ב־200 ₪ יש שתי מאות, ולכן הריבית היא 2 × 5 = 10 ₪."]],
      [["You put money in a savings deposit. Who pays interest to whom?", "The bank pays you", ["You pay the bank", "Nobody pays anybody", "The shop pays the bank"], "The bank uses your money, for example to lend it to others, so it pays you interest. When you borrow from the bank, it is the other way round."],
        ["הפקדתם כסף בפיקדון חיסכון. מי משלם ריבית למי?", "הבנק משלם לכם", ["אתם משלמים לבנק", "אף אחד לא משלם לאף אחד", "החנות משלמת לבנק"], "הבנק משתמש בכסף שלכם, למשל כדי להלוות אותו לאחרים, ולכן הוא משלם לכם ריבית. כשאתם לווים מהבנק, זה הפוך."]],
      [["When you borrow money, why do you pay back more than you borrowed?", "You also pay interest, the price of borrowing", ["The bank always makes mistakes when it counts money", "Borrowed money doubles by law after a year", "You have to buy the bank a present"], "The lender lets you use money now and waits to get it back, so you pay extra for that. The extra is the interest."],
        ["כשלווים כסף, למה מחזירים יותר ממה שלווים?", "משלמים גם ריבית, המחיר של ההלוואה", ["כי הבנק תמיד טועה כשהוא סופר כסף", "כי לפי החוק כסף שלווים מוכפל אחרי שנה", "כי צריך לקנות לבנק מתנה"], "המלווה נותן לכם להשתמש בכסף עכשיו ומחכה לקבל אותו בחזרה, ולכן משלמים לו תוספת. התוספת הזאת היא הריבית."]],
      [["What does \"an interest rate of 3% a year\" mean?", "For every 100 ₪, 3 ₪ of interest is added each year", ["For every 3 ₪ you save, the bank adds 100 ₪ in a year", "Your money is multiplied by 3 at the end of each year", "You can take out only 3% of your money a year"], "Per cent means \"out of a hundred\", so 3% of 100 ₪ is 3 ₪. On 1,000 ₪ the interest would be 30 ₪ a year."],
        ["מה פירוש ״ריבית של 3% לשנה״?", "על כל 100 ₪ מתווספים 3 ₪ ריבית בכל שנה", ["על כל 3 ₪ שחוסכים, הבנק מוסיף 100 ₪ בשנה", "הכסף שלכם מוכפל פי 3 בסוף כל שנה", "מותר למשוך רק 3% מהכסף בשנה"], "אחוז פירושו ״מתוך מאה״, ולכן 3% מ־100 ₪ הם 3 ₪. על 1,000 ₪ הריבית תהיה 30 ₪ לשנה."]],
      [["Two deposits both earn 4% a year. Which one earns more interest in a year?", "A deposit of 1,000 ₪", ["Both earn exactly the same amount", "A deposit of 500 ₪", "A deposit of 100 ₪"], "The same rate gives more interest on more money: 4% of 1,000 ₪ is 40 ₪, but 4% of 500 ₪ is only 20 ₪."],
        ["שני פיקדונות מרוויחים 4% לשנה. איזה מהם מרוויח יותר ריבית בשנה?", "פיקדון של 1,000 ₪", ["שניהם מרוויחים בדיוק אותו סכום", "פיקדון של 500 ₪", "פיקדון של 100 ₪"], "אותו שיעור ריבית נותן יותר ריבית על יותר כסף: 4% מ־1,000 ₪ הם 40 ₪, אבל 4% מ־500 ₪ הם רק 20 ₪."]],
    ],
    n: [
      [30, ["You put 600 ₪ in a deposit at 5% a year. How much interest do you get after one year?", "₪", "5% means 5 out of every 100, so 5% of 600 = 600 × 5 ÷ 100 = 30 ₪."],
        ["הפקדתם 600 ₪ בפיקדון בריבית של 5% לשנה. כמה ריבית תקבלו אחרי שנה?", "₪", "5% פירושו 5 מכל 100, ולכן 5% מ־600 = 600 × 5 ÷ 100 = 30 ₪."]],
      [1050, ["You save 1,000 ₪ at 5% a year. How much money do you have in total after one year?", "₪", "The interest is 5% of 1,000 = 50 ₪, so the total is 1,000 + 50 = 1,050 ₪."],
        ["חסכתם 1,000 ₪ בריבית של 5% לשנה. כמה כסף יהיה לכם בסך הכול אחרי שנה?", "₪", "הריבית היא 5% מ־1,000 = 50 ₪, ולכן סך הכול 1,000 + 50 = 1,050 ₪."]],
    ],
    s: [[["Saving money in a bank deposit, in order", "Compare the interest rates that different banks offer", "Put your money into the deposit you chose", "Leave it there for the agreed time", "Get your money back together with the interest"],
      ["חוסכים כסף בפיקדון בבנק, לפי הסדר", "משווים את הריבית שבנקים שונים מציעים", "מפקידים את הכסף בפיקדון שבחרתם", "משאירים אותו שם לזמן המוסכם", "מקבלים את הכסף בחזרה יחד עם הריבית"]]],
  },
  i: {
    t: [
      ["Simple interest", "interest worked out only on the original amount, so it is the same every year", "ריבית פשוטה", "ריבית שמחושבת רק על הסכום המקורי, ולכן היא זהה בכל שנה"],
      ["Compound interest", "interest paid on the starting amount and also on the interest added in earlier years", "ריבית דריבית", "ריבית שמשולמת על הסכום ההתחלתי וגם על הריבית שנוספה בשנים הקודמות"],
      ["Balance", "the amount of money in an account at a given moment", "יתרה", "סכום הכסף שיש בחשבון ברגע מסוים"],
    ],
    q: [
      [["You save 2,000 ₪ at 4% simple interest for 3 years. How much interest do you earn in total?", "240 ₪", ["80 ₪", "120 ₪", "2,240 ₪"], "Each year the interest is 4% of 2,000 = 80 ₪. Over 3 years: 80 × 3 = 240 ₪. 2,240 ₪ is the balance, not the interest."],
        ["חסכתם 2,000 ₪ בריבית פשוטה של 4% לשנה למשך 3 שנים. כמה ריבית תרוויחו בסך הכול?", "240 ₪", ["80 ₪", "120 ₪", "2,240 ₪"], "בכל שנה הריבית היא 4% מ־2,000 = 80 ₪. במשך 3 שנים: 80 × 3 = 240 ₪. הסכום 2,240 ₪ הוא היתרה, ולא הריבית."]],
      [["5,000 ₪ earns 10% a year, compounded once a year. What is the balance after 2 years?", "6,050 ₪", ["6,000 ₪", "5,500 ₪", "7,000 ₪"], "Year 1: 5,000 + 500 = 5,500 ₪. Year 2: 10% of 5,500 is 550, so 5,500 + 550 = 6,050 ₪. 6,000 ₪ would be simple interest."],
        ["5,000 ₪ מרוויחים 10% בשנה בריבית דריבית שנתית. מה היתרה אחרי שנתיים?", "6,050 ₪", ["6,000 ₪", "5,500 ₪", "7,000 ₪"], "שנה 1: 5,000 + 500 = 5,500 ₪. שנה 2: 10% מ־5,500 הם 550, ולכן 5,500 + 550 = 6,050 ₪. הסכום 6,000 ₪ מתאים לריבית פשוטה."]],
      [["Why does compound interest grow faster than simple interest over many years?", "Each year's interest also starts earning interest", ["The interest rate automatically goes up every single year", "Simple interest is only paid once, in the very first year", "Compound interest is paid on loans but never on savings"], "With compounding, the base keeps growing: next year's interest is worked out on a bigger balance. With simple interest the base never changes."],
        ["למה ריבית דריבית גדלה מהר יותר מריבית פשוטה לאורך שנים רבות?", "גם הריבית של כל שנה מתחילה להרוויח ריבית", ["כי שיעור הריבית עולה מעצמו בכל שנה ושנה", "כי ריבית פשוטה משולמת רק פעם אחת, בשנה הראשונה", "כי ריבית דריבית משולמת על הלוואות ואף פעם לא על חיסכון"], "בריבית דריבית הבסיס כל הזמן גדל: הריבית של השנה הבאה מחושבת על יתרה גדולה יותר. בריבית פשוטה הבסיס לא משתנה."]],
      [["Dana and Yoni each put 1,000 ₪ once into a deposit at 6% compound interest. Dana does it at 15, Yoni at 25. Who has more at 65?", "Dana: her money grows for 10 more years", ["They have the same, since both saved 1,000 ₪", "Yoni, because money saved later earns more", "Nobody can tell without the bank's records"], "Dana's money compounds for 50 years and Yoni's for 40. Those extra 10 years at 6% almost double her balance, which is why starting early matters."],
        ["דנה ויוני הפקידו כל אחד פעם אחת 1,000 ₪ בפיקדון בריבית דריבית של 6%. דנה עשתה את זה בגיל 15, ויוני בגיל 25. למי יהיה יותר בגיל 65?", "לדנה: הכסף שלה גדל עוד 10 שנים", ["לשניהם אותו סכום, כי שניהם חסכו 1,000 ₪", "ליוני, כי כסף שחוסכים מאוחר מרוויח יותר", "אי אפשר לדעת בלי הרישומים של הבנק"], "הכסף של דנה צובר ריבית דריבית 50 שנה, ושל יוני 40 שנה. עשר השנים הנוספות ב־6% כמעט מכפילות את היתרה שלה, ולכן כדאי להתחיל מוקדם."]],
      [["Which option gives the most money after 2 years on 1,000 ₪?", "10% a year, compounded", ["10% a year, simple interest", "5% a year, compounded", "5% a year, simple interest"], "10% compounded gives 1,210 ₪, 10% simple gives 1,200 ₪, 5% compounded gives 1,102.50 ₪ and 5% simple gives 1,100 ₪."],
        ["איזו אפשרות נותנת הכי הרבה כסף אחרי שנתיים על 1,000 ₪?", "10% לשנה בריבית דריבית", ["10% לשנה בריבית פשוטה", "5% לשנה בריבית דריבית", "5% לשנה בריבית פשוטה"], "10% בריבית דריבית נותנים 1,210 ₪, 10% בריבית פשוטה נותנים 1,200 ₪, 5% בריבית דריבית נותנים 1,102.50 ₪ ו־5% בריבית פשוטה נותנים 1,100 ₪."]],
    ],
    n: [
      [1102.5, ["1,000 ₪ earns 5% a year, compounded once a year. What is the balance after 2 years?", "₪", "Year 1: 1,000 × 1.05 = 1,050 ₪. Year 2: 1,050 × 1.05 = 1,102.5 ₪, that is 1,102 shekels and 50 agorot."],
        ["1,000 ₪ מרוויחים 5% בשנה בריבית דריבית שנתית. מה היתרה אחרי שנתיים?", "₪", "שנה 1: 1,000 × 1.05 = 1,050 ₪. שנה 2: 1,050 × 1.05 = 1,102.5 ₪, כלומר 1,102 שקלים ו־50 אגורות."], 0.01],
      [5, ["At 5% simple interest a year, how many years does it take for 400 ₪ to earn 100 ₪ of interest?", "years", "Each year earns 5% of 400 = 20 ₪, and 100 ÷ 20 = 5 years."],
        ["בריבית פשוטה של 5% לשנה, כמה שנים צריך כדי ש־400 ₪ ירוויחו 100 ₪ ריבית?", "שנים", "בכל שנה מרוויחים 5% מ־400 = 20 ₪, ו־100 ÷ 20 = 5 שנים."]],
    ],
  },
  a: {
    t: [
      ["Rule of 72", "a shortcut: 72 divided by the yearly rate gives roughly the years needed to double", "כלל ה־72", "קיצור דרך: מחלקים את 72 בשיעור השנתי ומקבלים בערך את מספר השנים שנדרשות להכפלה"],
      ["Effective annual rate", "the true yearly rate once compounding during the year is included", "ריבית שנתית אפקטיבית", "השיעור השנתי האמיתי, כשמביאים בחשבון את הצבירה שקורית במהלך השנה"],
      ["Real interest rate", "roughly the rate minus inflation; it shows how much buying power really grows", "ריבית ריאלית", "בערך השיעור פחות האינפלציה; הוא מראה בכמה כוח הקנייה באמת גדל"],
    ],
    q: [
      [["Using the rule of 72, about how long does money take to double at 6% a year?", "About 12 years", ["About 6 years", "About 18 years", "About 72 years"], "72 ÷ 6 = 12. The exact answer is about 11.9 years, so the shortcut is very close. At 6% simple interest it would take about 16.7 years."],
        ["לפי כלל ה־72, בערך תוך כמה זמן כסף מוכפל בריבית של 6% לשנה?", "בערך 12 שנים", ["בערך 6 שנים", "בערך 18 שנים", "בערך 72 שנים"], "72 ÷ 6 = 12. התשובה המדויקת היא בערך 11.9 שנים, כך שקיצור הדרך קרוב מאוד. בריבית פשוטה של 6% זה היה לוקח כ־16.7 שנים."]],
      [["An unpaid credit-card debt grows at 18% a year, compounded. By the rule of 72, about how fast does it double?", "In about 4 years", ["In about 8 years", "In about 18 years", "In about 54 years"], "72 ÷ 18 = 4, so the debt doubles in about 4 years if nothing is paid. Compounding works against borrowers just as it works for savers."],
        ["חוב בכרטיס אשראי שלא משלמים גדל ב־18% לשנה בריבית דריבית. לפי כלל ה־72, תוך כמה זמן בערך הוא יוכפל?", "תוך כ־4 שנים", ["תוך כ־8 שנים", "תוך כ־18 שנים", "תוך כ־54 שנים"], "72 ÷ 18 = 4, ולכן החוב מוכפל בערך תוך 4 שנים אם לא משלמים כלום. ריבית דריבית עובדת נגד הלווים בדיוק כמו שהיא עובדת לטובת החוסכים."]],
      [["A bank pays 1% interest every month instead of 12% once a year. What happens to a deposit over a year?", "It grows a little more, because interest compounds each month", ["It grows exactly the same, because 12 months × 1% is still 12%", "It grows a little less, because each payment is smaller", "It grows twelve times more than with yearly interest"], "Each month's 1% is added and then earns interest too: 1.01 to the power 12 is about 1.1268, an effective rate of about 12.68%, a bit more than 12%."],
        ["בנק משלם ריבית של 1% בכל חודש במקום 12% פעם בשנה. מה קורה לפיקדון במשך שנה?", "הוא גדל קצת יותר, כי הריבית נצברת בכל חודש", ["הוא גדל בדיוק אותו דבר, כי 12 חודשים × 1% הם עדיין 12%", "הוא גדל קצת פחות, כי כל תשלום קטן יותר", "הוא גדל פי 12 יותר מאשר בריבית שנתית"], "ה־1% של כל חודש מתווסף ואז גם הוא מרוויח ריבית: 1.01 בחזקת 12 הוא בערך 1.1268, ריבית אפקטיבית של כ־12.68%, קצת יותר מ־12%."]],
      [["Your deposit pays 3% a year while prices rise by 5% a year. What is your real return, roughly?", "A loss of about 2% a year", ["A gain of about 2% a year", "A gain of about 3% a year", "A gain of about 8% a year"], "The real rate is roughly the interest rate minus inflation: 3% − 5% = −2%. You have more shekels, but they buy less than before."],
        ["הפיקדון שלכם משלם 3% לשנה והמחירים עולים ב־5% לשנה. מהי התשואה הריאלית שלכם, בערך?", "הפסד של כ־2% בשנה", ["רווח של כ־2% בשנה", "רווח של כ־3% בשנה", "רווח של כ־8% בשנה"], "הריבית הריאלית היא בערך הריבית פחות האינפלציה: 3% פחות 5% הם הפסד של 2%. יש לכם יותר שקלים, אבל הם קונים פחות מקודם."]],
      [["Money earns 8% a year, compounded. Using the rule of 72, roughly how many times bigger is it after 27 years?", "About 8 times", ["About 3 times", "About 6 times", "About 27 times"], "72 ÷ 8 = 9, so it doubles every 9 years. 27 years is 3 doublings: 2 × 2 × 2 = 8. Simple interest would give only about 3.16 times."],
        ["כסף מרוויח 8% לשנה בריבית דריבית. לפי כלל ה־72, פי כמה בערך הוא גדל אחרי 27 שנים?", "בערך פי 8", ["בערך פי 3", "בערך פי 6", "בערך פי 27"], "72 ÷ 8 = 9, ולכן הכסף מוכפל כל 9 שנים. 27 שנים הן 3 הכפלות: 2 × 2 × 2 = 8. בריבית פשוטה הכסף היה גדל רק בערך פי 3.16."]],
    ],
    n: [
      [8, ["Using the rule of 72, at what yearly interest rate does money double in about 9 years?", "%", "Turn the rule round: 72 ÷ 9 = 8, so a rate of about 8% a year doubles money in about 9 years."],
        ["לפי כלל ה־72, באיזה שיעור ריבית שנתי כסף מוכפל בערך תוך 9 שנים?", "%", "הופכים את הכלל: 72 ÷ 9 = 8, ולכן ריבית של כ־8% לשנה מכפילה כסף בערך תוך 9 שנים."]],
      [1331, ["1,000 ₪ earns 10% a year, compounded once a year. What is the balance after 3 years?", "₪", "1,000 → 1,100 → 1,210 → 1,331 ₪. Each year adds 10% of the new, bigger balance: 100, then 110, then 121."],
        ["1,000 ₪ מרוויחים 10% בשנה בריבית דריבית שנתית. מה היתרה אחרי 3 שנים?", "₪", "1,000, אחר כך 1,100, אחר כך 1,210 ובסוף 1,331 ₪. כל שנה מוסיפה 10% מהיתרה החדשה והגדולה יותר: 100, אחר כך 110 ואז 121."]],
    ],
    s: [[["Working out the total to repay on a loan with simple interest, in order", "Write the yearly rate as a decimal, for example 5% = 0.05", "Multiply the principal by that decimal to get one year's interest", "Multiply one year's interest by the number of years", "Add the total interest to the principal"],
      ["חישוב הסכום להחזר של הלוואה בריבית פשוטה, לפי הסדר", "כותבים את הריבית השנתית כשבר עשרוני, למשל 5% = 0.05", "כופלים את הקרן בשבר הזה ומקבלים את הריבית של שנה אחת", "כופלים את הריבית של שנה אחת במספר השנים", "מוסיפים את כל הריבית לקרן"]]],
  },
};
export default c;
