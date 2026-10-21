import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Logarithm", "the power a base must be raised to in order to give a number: log₄ 16 = 2 because 4² = 16", "לוגריתם", "החזקה שצריך להעלות אליה בסיס כדי לקבל מספר: log₄ 16 = 2 כי 4² = 16"],
      ["Base of a logarithm", "the number that is raised to a power; in log₇ 49 = 2 it is 7", "בסיס הלוגריתם", "המספר שמעלים בחזקה; ב־log₇ 49 = 2 זה המספר 7"],
      ["Common logarithm", "a logarithm with base 10, usually written log without a base: log 1000 = 3", "לוגריתם עשרוני", "לוגריתם שהבסיס שלו 10, ולרוב כותבים אותו log בלי בסיס: log 1000 = 3"],
    ],
    q: [
      [["What is log₂ 8?", "3", ["4", "16", "1/3"], "log₂ 8 asks: 2 to which power gives 8? Since 2 × 2 × 2 = 2³ = 8, the answer is 3. 4 comes from dividing 8 by 2, which is not what a logarithm does."],
        ["כמה זה log₂ 8?", "3", ["4", "16", "1/3"], "הביטוי log₂ 8 שואל: באיזו חזקה צריך להעלות את 2 כדי לקבל 8? מכיוון ש־2 × 2 × 2 = 2³ = 8, התשובה היא 3. התשובה 4 מתקבלת מחילוק 8 ב־2, ולוגריתם הוא לא חילוק."]],
      [["Which equation means the same as log₅ 25 = 2?", "5² = 25", ["2⁵ = 25", "25² = 5", "5 × 2 = 25"], "A logarithm is a power: log₅ 25 = 2 says that 5 to the power 2 is 25, that is 5² = 25. The base of the logarithm is also the base of the power."],
        ["איזו משוואה אומרת אותו דבר כמו log₅ 25 = 2?", "5² = 25", ["2⁵ = 25", "25² = 5", "5 × 2 = 25"], "לוגריתם הוא מעריך של חזקה: log₅ 25 = 2 אומר ש־5 בחזקת 2 הוא 25, כלומר 5² = 25. הבסיס של הלוגריתם הוא גם הבסיס של החזקה."]],
      [["What is log 1, in base 10?", "0", ["1", "10", "−1"], "Any base to the power 0 gives 1, so 10⁰ = 1 and log 1 = 0. The same is true in every base."],
        ["כמה זה log 1 בבסיס 10?", "0", ["1", "10", "−1"], "כל בסיס בחזקת 0 שווה ל־1, ולכן 10⁰ = 1 ו־log 1 = 0. זה נכון בכל בסיס."]],
      [["Between which two whole numbers is log 500?", "2 and 3", ["5 and 6", "50 and 51", "250 and 251"], "500 lies between 10² = 100 and 10³ = 1000, so its logarithm lies between 2 and 3; it is about 2.7."],
        ["בין אילו שני מספרים שלמים נמצא log 500?", "בין 2 ל־3", ["בין 5 ל־6", "בין 50 ל־51", "בין 250 ל־251"], "המספר 500 נמצא בין 10² = 100 ל־10³ = 1000, ולכן הלוגריתם שלו נמצא בין 2 ל־3; הוא בערך 2.7."]],
      [["For which of these numbers is the logarithm not defined?", "0", ["1", "1/10", "10"], "No power of a positive base gives 0, so log 0 is not defined. log 1 = 0 is fine: there 0 is the answer, not the number inside."],
        ["לאיזה מהמספרים האלה הלוגריתם לא מוגדר?", "0", ["1", "1/10", "10"], "אף חזקה של בסיס חיובי לא נותנת 0, ולכן log 0 לא מוגדר. השוויון log 1 = 0 תקין לגמרי: שם 0 הוא התשובה, ולא המספר שבתוך הלוג."]],
    ],
    n: [
      [5, ["log₂ 32 = x. What is x?", "", "2⁵ = 2 × 2 × 2 × 2 × 2 = 32, so log₂ 32 = 5."],
        ["נתון ש־log₂ 32 = x. מהו x?", "", "מכיוון ש־2⁵ = 2 × 2 × 2 × 2 × 2 = 32, מקבלים log₂ 32 = 5."]],
      [81, ["log₃ x = 4. What is x?", "", "log₃ x = 4 means that 3⁴ = x, and 3⁴ = 3 × 3 × 3 × 3 = 81."],
        ["נתון ש־log₃ x = 4. מהו x?", "", "המשוואה log₃ x = 4 פירושה ש־3⁴ = x, ו־3⁴ = 3 × 3 × 3 × 3 = 81."]],
    ],
  },
  i: {
    t: [
      ["Logarithm of a product", "log(xy) = log x + log y: multiplying numbers adds their logs", "לוגריתם של מכפלה", "הכלל log(xy) = log x + log y: כשכופלים מספרים, הלוגים שלהם מתחברים"],
      ["Logarithm of a power", "log(xⁿ) = n·log x: an exponent inside the log comes out in front as a multiplier", "לוגריתם של חזקה", "הכלל log(xⁿ) = n·log x: מעריך שבתוך הלוג יוצא החוצה ככופל"],
      ["Natural logarithm", "the logarithm with base e ≈ 2.718, written ln", "לוגריתם טבעי", "הלוגריתם שהבסיס שלו הוא e ≈ 2.718, ונכתב ln"],
    ],
    q: [
      [["Simplify log 2 + log 5.", "1", ["log 7", "10", "log 2.5"], "By the product rule, log 2 + log 5 = log(2 × 5) = log 10, and log 10 = 1. Adding logs multiplies the numbers; it does not add them."],
        ["פשטו את log 2 + log 5.", "1", ["log 7", "10", "log 2.5"], "לפי הלוגריתם של מכפלה, log 2 + log 5 = log(2 × 5) = log 10, ו־log 10 = 1. חיבור לוגים כופל את המספרים, ולא מחבר אותם."]],
      [["Simplify log₃ 54 − log₃ 2.", "3", ["27", "log₃ 52", "log₃ 108"], "Subtracting logs divides the numbers: log₃(54 ÷ 2) = log₃ 27, and 3³ = 27, so the answer is 3. 27 is the number inside the log, not the log itself."],
        ["פשטו את log₃ 54 − log₃ 2.", "3", ["27", "log₃ 52", "log₃ 108"], "חיסור לוגים מחלק את המספרים: log₃(54 ÷ 2) = log₃ 27, ו־3³ = 27, ולכן התשובה היא 3. המספר 27 הוא מה שבתוך הלוג, ולא הלוג עצמו."]],
      [["Solve 2ˣ = 10.", "x = log 10 ÷ log 2 ≈ 3.32", ["x = log 2 ÷ log 10 ≈ 0.30", "x = 10 ÷ 2 = 5", "x = 10² = 100"], "Take the log of both sides: x·log 2 = log 10 = 1, so x = 1 ÷ log 2 ≈ 3.32. Check: 2³ = 8 and 2⁴ = 16, so x must be between 3 and 4."],
        ["פתרו את 2ˣ = 10.", "x = log 10 ÷ log 2 ≈ 3.32", ["x = log 2 ÷ log 10 ≈ 0.30", "x = 10 ÷ 2 = 5", "x = 10² = 100"], "מוציאים לוג משני האגפים: x·log 2 = log 10 = 1, ולכן x = 1 ÷ log 2 ≈ 3.32. בדיקה: 2³ = 8 ו־2⁴ = 16, ולכן x חייב להיות בין 3 ל־4."]],
      [["What is ln e³?", "3", ["e³", "1", "3e"], "ln is the logarithm with base e, so ln e³ asks: e to which power gives e³? The answer is 3."],
        ["כמה זה ln e³?", "3", ["e³", "1", "3e"], "הסימון ln מציין את הלוגריתם שהבסיס שלו e, ולכן ln e³ שואל: באיזו חזקה צריך להעלות את e כדי לקבל e³? התשובה היא 3."]],
      [["Write 3·log 2 as a single logarithm.", "log 8", ["log 6", "log 9", "log 5"], "By the power rule, n·log x = log(xⁿ), so 3·log 2 = log 2³ = log 8. log 6 would be log 2 + log 3."],
        ["כתבו את 3·log 2 כלוגריתם אחד.", "log 8", ["log 6", "log 9", "log 5"], "לפי הלוגריתם של חזקה, n·log x = log(xⁿ), ולכן 3·log 2 = log 2³ = log 8. לעומת זאת log 6 שווה ל־log 2 + log 3."]],
      [["The pH of a solution is −log c, where c is the concentration of hydrogen ions. If c becomes 100 times larger, how does the pH change?", "It falls by 2", ["It rises by 2", "It falls by 100", "It is divided by 100"], "log(100c) = log 100 + log c = 2 + log c, so −log c goes down by 2. That is why each step on the pH scale means a factor of 10 in concentration."],
        ["ה־pH של תמיסה הוא −log c, כאשר c הוא הריכוז של יוני המימן. אם c גדל פי 100, איך משתנה ה־pH?", "הוא יורד ב־2", ["הוא עולה ב־2", "הוא יורד ב־100", "הוא מתחלק ב־100"], "לפי חוקי הלוגריתמים log(100c) = log 100 + log c = 2 + log c, ולכן −log c קטן ב־2. זו הסיבה שכל צעד בסולם ה־pH פירושו שינוי פי 10 בריכוז."]],
    ],
    n: [
      [1.301, ["log 2 ≈ 0.301. Using the log rules, what is log 20, to three decimal places?", "", "20 = 2 × 10, so by the product rule log 20 = log 2 + log 10 ≈ 0.301 + 1 = 1.301."],
        ["נתון ש־log 2 ≈ 0.301. בעזרת חוקי הלוגריתמים, כמה זה log 20, בדיוק של שלוש ספרות אחרי הנקודה?", "", "לפי הלוגריתם של מכפלה: 20 = 2 × 10, ולכן log 20 = log 2 + log 10 ≈ 0.301 + 1 = 1.301."], 0.001],
      [8, ["log₄ x = 1.5. What is x?", "", "By the definition, x = 4 to the power 1.5 = (√4)³ = 2³ = 8."],
        ["נתון ש־log₄ x = 1.5. מהו x?", "", "לפי ההגדרה, x = 4 בחזקת 1.5, כלומר (√4)³ = 2³ = 8."]],
    ],
  },
  a: {
    t: [
      ["Change of base", "the rule that a logarithm in base a equals log x ÷ log a, so any base can be worked out with base 10", "מעבר בסיס", "הכלל שלפיו לוגריתם בבסיס a שווה ל־log x ÷ log a, כך שאפשר לחשב כל בסיס בעזרת בסיס 10"],
      ["Exponential equation", "an equation in which the unknown is in an exponent, like 3ˣ = 20", "משוואה מעריכית", "משוואה שבה הנעלם נמצא במעריך, כמו 3ˣ = 20"],
      ["Logarithmic scale", "a scale on which each equal step multiplies the value by the same number, often 10, like the pH and decibel scales", "סולם לוגריתמי", "סולם שבו כל צעד שווה כופל את הערך באותו מספר, לרוב ב־10, כמו סולם ה־pH וסולם הדציבלים"],
    ],
    q: [
      [["Solve log₂(x + 3) = 4.", "x = 13", ["x = 16", "x = 5", "x = 1"], "By the definition, x + 3 = 2⁴ = 16, so x = 13. Check: log₂ 16 = 4. 16 is the value of x + 3, not of x."],
        ["פתרו את log₂(x + 3) = 4.", "x = 13", ["x = 16", "x = 5", "x = 1"], "לפי ההגדרה x + 3 = 2⁴ = 16, ולכן x = 13. בדיקה: log₂ 16 = 4. המספר 16 הוא הערך של x + 3, ולא של x."]],
      [["Solve log x + log(x − 3) = 1.", "x = 5 only", ["x = 5 or x = −2", "x = −2 only", "x = 10"], "log(x(x − 3)) = 1 gives x(x − 3) = 10, so x² − 3x − 10 = 0 and x = 5 or x = −2. But log(−2) is not defined, so only x = 5 is a solution.", "Combine the two logs into one log first, then check each solution you find in the original equation."],
        ["פתרו את log x + log(x − 3) = 1.", "רק x = 5", ["x = 5 או x = −2", "רק x = −2", "x = 10"], "מ־log(x(x − 3)) = 1 מקבלים x(x − 3) = 10, כלומר x² − 3x − 10 = 0, ולכן x = 5 או x = −2. אבל log(−2) לא מוגדר, ולכן רק x = 5 הוא פתרון.", "מאחדים קודם את שני הלוגים ללוג אחד, ואחר כך בודקים כל פתרון שמצאתם במשוואה המקורית."]],
      [["Which is larger: log₂ 10 or log₃ 20?", "log₂ 10", ["log₃ 20", "They are equal", "It cannot be decided without a calculator"], "2³ = 8 is less than 10, so log₂ 10 is more than 3. 3³ = 27 is more than 20, so log₃ 20 is less than 3. Therefore log₂ 10 is larger."],
        ["מה גדול יותר: log₂ 10 או log₃ 20?", "log₂ 10", ["log₃ 20", "הם שווים", "אי אפשר לדעת בלי מחשבון"], "2³ = 8 קטן מ־10, ולכן log₂ 10 גדול מ־3. לעומת זאת 3³ = 27 גדול מ־20, ולכן log₃ 20 קטן מ־3. מכאן ש־log₂ 10 גדול יותר."]],
      [["If log 2 = a and log 3 = b, what is log 12?", "2a + b", ["a + 2b", "2ab", "a²b"], "12 = 2² × 3, so log 12 = 2·log 2 + log 3 = 2a + b. a + 2b would be log 18, since 18 = 2 × 3²."],
        ["אם log 2 = a ו־log 3 = b, כמה זה log 12?", "2a + b", ["a + 2b", "2ab", "a²b"], "מכיוון ש־12 = 2² × 3, מקבלים log 12 = 2·log 2 + log 3 = 2a + b. הביטוי a + 2b שווה ל־log 18, כי 18 = 2 × 3²."]],
      [["Why is log₂(−8) not defined?", "No power of 2 gives a negative number", ["It is −3, since 2⁻³ = −8", "Logarithms of even numbers do not exist", "8 is not a power of 2"], "Every power of 2 is positive, for example 2³ = 8 and 2⁻³ = 1/8. So no exponent gives −8, and the logarithm of a negative number is not defined among the real numbers."],
        ["למה log₂(−8) לא מוגדר?", "אין חזקה של 2 שנותנת מספר שלילי", ["הוא −3, כי 2⁻³ = −8", "לוגריתמים של מספרים זוגיים פשוט לא קיימים", "8 אינו חזקה של 2"], "כל חזקה של 2 חיובית, למשל 2³ = 8 ו־2⁻³ = 1/8. לכן אין מעריך שנותן −8, והלוגריתם של מספר שלילי לא מוגדר במספרים הממשיים."]],
      [["Solve 4ˣ − 5·2ˣ + 4 = 0.", "x = 0 or x = 2", ["x = 1 or x = 4", "x = 2 only", "x = −1 or x = −4"], "Since 4ˣ = (2ˣ)², put u = 2ˣ: u² − 5u + 4 = 0, so u = 1 or u = 4. Then 2ˣ = 1 gives x = 0 and 2ˣ = 4 gives x = 2. 1 and 4 are the values of u, not of x."],
        ["פתרו את 4ˣ − 5·2ˣ + 4 = 0.", "x = 0 או x = 2", ["x = 1 או x = 4", "רק x = 2", "x = −1 או x = −4"], "מכיוון ש־4ˣ = (2ˣ)², מציבים u = 2ˣ ומקבלים u² − 5u + 4 = 0, ולכן u = 1 או u = 4. מ־2ˣ = 1 מקבלים x = 0, ומ־2ˣ = 4 מקבלים x = 2. המספרים 1 ו־4 הם ערכים של u, ולא של x."]],
    ],
    n: [
      [1000, ["On the Richter scale, each step of 1 means 10 times the wave amplitude. How many times larger is the amplitude of a magnitude 7 earthquake than that of a magnitude 4 one?", "", "7 − 4 = 3 steps, and each step multiplies the amplitude by 10: 10³ = 1000 times."],
        ["בסולם ריכטר, כל צעד של 1 פירושו משרעת גלים גדולה פי 10. פי כמה גדולה משרעת הגלים ברעידת אדמה בעוצמה 7 מאשר ברעידה בעוצמה 4?", "", "ההפרש הוא 7 − 4 = 3 צעדים, וכל צעד כופל את המשרעת ב־10, ולכן פי 10³ = 1000."]],
      [12, ["Money grows by 6% a year. After how many whole years does it first double?", "years", "Solve 1.06ᵗ = 2: t = log 2 ÷ log 1.06 ≈ 0.301 ÷ 0.0253 ≈ 11.9. So the money first doubles after 12 years."],
        ["כסף גדל ב־6% בשנה. אחרי כמה שנים שלמות הוא מוכפל לראשונה?", "שנים", "פותרים 1.06ᵗ = 2: t = log 2 ÷ log 1.06 ≈ 0.301 ÷ 0.0253 ≈ 11.9. לכן הכסף מוכפל לראשונה אחרי 12 שנים."]],
    ],
    s: [[["Solving 5 × 3ˣ = 40 with logarithms, in order", "Divide both sides by 5: 3ˣ = 8", "Take the log of both sides: log 3ˣ = log 8", "Use the power rule: x·log 3 = log 8", "Divide: x = log 8 ÷ log 3 ≈ 1.89"],
      ["פתרון המשוואה 5 × 3ˣ = 40 בעזרת לוגריתמים, לפי הסדר", "מחלקים את שני האגפים ב־5: 3ˣ = 8", "מוציאים לוג משני האגפים: log 3ˣ = log 8", "משתמשים בלוגריתם של חזקה: x·log 3 = log 8", "מחלקים: x = log 8 ÷ log 3 ≈ 1.89"]]],
  },
};
export default c;
