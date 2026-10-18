import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Shekel", "the main unit of money in Israel, worth 100 agorot", "שקל", "יחידת הכסף הראשית בישראל, ששווה 100 אגורות"],
      ["Agora", "a small unit of Israeli money; 100 of them make one shekel", "אגורה", "יחידת כסף קטנה בישראל; 100 כאלה הן שקל אחד"],
      ["Price", "how much money you must pay to buy something", "מחיר", "כמה כסף צריך לשלם כדי לקנות משהו"],
      ["Change", "the money you get back when you pay more than the price", "עודף", "הכסף שמקבלים בחזרה כשמשלמים יותר מהמחיר"],
    ],
    q: [
      [["How many agorot are there in one shekel?", "100", ["10", "50", "1,000"], "One shekel is worth 100 agorot, just as one metre has 100 centimetres. Two half-shekel coins make one shekel."],
        ["כמה אגורות יש בשקל אחד?", "100", ["10", "50", "1,000"], "שקל אחד שווה 100 אגורות, כמו שבמטר אחד יש 100 סנטימטרים. שני מטבעות של חצי שקל הם שקל אחד."]],
      [["Which of these coins is worth the most?", "10 shekels", ["5 shekels", "2 shekels", "Half a shekel (50 agorot)"], "The 10-shekel coin has the highest value of the Israeli coins in everyday use. The 5-shekel coin is worth half of it, and half a shekel is only 50 agorot."],
        ["איזה מהמטבעות שווה הכי הרבה?", "10 שקלים", ["5 שקלים", "2 שקלים", "חצי שקל (50 אגורות)"], "למטבע של 10 שקלים יש הערך הגבוה ביותר מכל המטבעות שבשימוש יומיומי בישראל. מטבע של 5 שקלים שווה חצי ממנו, וחצי שקל הוא רק 50 אגורות."]],
      [["A pencil costs 3 shekels and a notebook costs 5 shekels. How much do they cost together?", "8 shekels", ["7 shekels", "2 shekels", "15 shekels"], "Add the prices: 3 + 5 = 8 shekels. 2 shekels is the difference between the prices, and 15 comes from multiplying them."],
        ["עיפרון עולה 3 שקלים ומחברת עולה 5 שקלים. כמה הם עולים יחד?", "8 שקלים", ["7 שקלים", "2 שקלים", "15 שקלים"], "מחברים את המחירים: 3 + 5 = 8 שקלים. 2 שקלים הם ההפרש בין המחירים, ואת 15 מקבלים אם כופלים אותם."]],
      [["You buy a ball for 6 shekels and pay with a 10-shekel coin. How much change do you get?", "4 shekels", ["5 shekels", "6 shekels", "16 shekels"], "Change is what you paid minus the price: 10 − 6 = 4 shekels. Counting up from 6 to 10 (7, 8, 9, 10) also gives 4."],
        ["קניתם כדור ב־6 שקלים ושילמתם במטבע של 10 שקלים. כמה עודף תקבלו?", "4 שקלים", ["5 שקלים", "6 שקלים", "16 שקלים"], "העודף הוא מה ששילמתם פחות המחיר: 10 − 6 = 4 שקלים. גם ספירה מ־6 עד 10 (7, 8, 9, 10) נותנת 4."]],
      [["Which is more money: three 2-shekel coins or one 5-shekel coin?", "Three 2-shekel coins", ["One 5-shekel coin", "They are worth the same"], "Three 2-shekel coins are 2 + 2 + 2 = 6 shekels, which is 1 shekel more than 5 shekels."],
        ["מה שווה יותר כסף: שלושה מטבעות של 2 שקלים או מטבע אחד של 5 שקלים?", "שלושה מטבעות של 2 שקלים", ["מטבע אחד של 5 שקלים", "בשני המקרים יש אותו סכום כסף"], "שלושה מטבעות של 2 שקלים הם 2 + 2 + 2 = 6 שקלים, שקל אחד יותר מ־5 שקלים."]],
    ],
    n: [
      [15, ["You have a 10-shekel coin and a 5-shekel coin. How many shekels do you have?", "shekels", "10 shekels and 5 shekels together make 10 + 5 = 15 shekels."],
        ["יש לכם מטבע של 10 שקלים ומטבע של 5 שקלים. כמה שקלים יש לכם?", "שקלים", "10 שקלים ועוד 5 שקלים הם יחד 10 + 5 = 15 שקלים."]],
      [3, ["How many half-shekel coins (50 agorot each) make 1 shekel and 50 agorot?", "", "1 shekel and 50 agorot is 150 agorot. Each half-shekel coin is 50 agorot, and 50 + 50 + 50 = 150, so you need 3 coins."],
        ["כמה מטבעות של חצי שקל (50 אגורות כל אחד) הם שקל ו־50 אגורות?", "", "שקל ו־50 אגורות הם 150 אגורות. כל מטבע של חצי שקל שווה 50 אגורות, ו־50 + 50 + 50 = 150, ולכן צריך 3 מטבעות."]],
    ],
    s: [[["Order from the smallest amount of money to the biggest", "A 10-agorot coin", "A half-shekel coin", "A 2-shekel coin", "A 20-shekel note", "A 100-shekel note"],
      ["סדרו מסכום הכסף הקטן ביותר ועד הגדול ביותר", "מטבע של 10 אגורות", "מטבע של חצי שקל", "מטבע של 2 שקלים", "שטר של 20 שקלים", "שטר של 100 שקלים"]]],
  },
  i: {
    t: [
      ["Banknote", "money printed on paper rather than made as a coin; in Israel there are notes of 20, 50, 100 and 200 shekels", "שטר", "כסף מודפס על נייר ולא מטבע; בישראל יש כאלה בערכים של 20, 50, 100 ו־200 שקלים"],
      ["Total", "the amount you get when you add all the prices together", "סך הכול", "הסכום שמקבלים כשמחברים את כל המחירים"],
      ["Counting on", "working out change by counting up from the price to the amount you paid", "ספירה קדימה", "חישוב העודף בעזרת ספירה מהמחיר ועד הסכום ששילמתם"],
    ],
    q: [
      [["An ice cream costs 7 shekels 50 agorot. You pay with a 10-shekel coin. How much change do you get?", "2 shekels 50 agorot", ["3 shekels 50 agorot", "2 shekels", "17 shekels 50 agorot"], "Count on from 7 shekels 50 agorot: 50 agorot more makes 8 shekels, then 2 more shekels makes 10. The change is 2 shekels 50 agorot."],
        ["גלידה עולה 7 שקלים ו־50 אגורות. שילמתם במטבע של 10 שקלים. כמה עודף תקבלו?", "2 שקלים ו־50 אגורות", ["3 שקלים ו־50 אגורות", "2 שקלים", "17 שקלים ו־50 אגורות"], "סופרים קדימה מ־7 שקלים ו־50 אגורות: עוד 50 אגורות הם 8 שקלים, ועוד 2 שקלים הם 10. העודף הוא 2 שקלים ו־50 אגורות."]],
      [["Which is the same amount as 350 agorot?", "3 shekels 50 agorot", ["30 shekels 50 agorot", "35 shekels", "3 shekels 5 agorot"], "100 agorot make a shekel, so 300 agorot are 3 shekels and 50 agorot are left over: 3 shekels 50 agorot."],
        ["איזה סכום שווה ל־350 אגורות?", "3 שקלים ו־50 אגורות", ["30 שקלים ו־50 אגורות", "35 שקלים", "3 שקלים ו־5 אגורות"], "100 אגורות הן שקל, ולכן 300 אגורות הן 3 שקלים, ונשארות עוד 50 אגורות: 3 שקלים ו־50 אגורות."]],
      [["A sandwich costs 12 shekels and a juice costs 6 shekels 50 agorot. What is the total?", "18 shekels 50 agorot", ["17 shekels 50 agorot", "18 shekels 5 agorot", "5 shekels 50 agorot"], "Add the shekels: 12 + 6 = 18. Then add the 50 agorot: 18 shekels 50 agorot. 5 shekels 50 agorot is the difference, not the total."],
        ["כריך עולה 12 שקלים ומיץ עולה 6 שקלים ו־50 אגורות. מה סך הכול?", "18 שקלים ו־50 אגורות", ["17 שקלים ו־50 אגורות", "18 שקלים ו־5 אגורות", "5 שקלים ו־50 אגורות"], "מחברים את השקלים: 12 + 6 = 18. מוסיפים את 50 האגורות: 18 שקלים ו־50 אגורות. 5 שקלים ו־50 אגורות הם ההפרש, לא סך הכול."]],
      [["You pay for a 37-shekel book with a 50-shekel note. Which coins could be your change?", "A 10-shekel coin, a 2-shekel coin and a 1-shekel coin", ["A 10-shekel coin, a 2-shekel coin and two 1-shekel coins", "A 10-shekel coin and a 2-shekel coin", "A 10-shekel coin and a 5-shekel coin"], "The change is 50 − 37 = 13 shekels, and 10 + 2 + 1 = 13. Two 1-shekel coins would make 14, one shekel too much."],
        ["שילמתם על ספר שעולה 37 שקלים בשטר של 50 שקלים. אילו מטבעות יכולים להיות העודף שלכם?", "מטבע של 10 שקלים, מטבע של 2 שקלים ומטבע של שקל", ["מטבע של 10 שקלים, מטבע של 2 שקלים ושני מטבעות של שקל", "מטבע של 10 שקלים ומטבע של 2 שקלים", "מטבע של 10 שקלים ומטבע של 5 שקלים"], "העודף הוא 50 − 37 = 13 שקלים, ו־10 + 2 + 1 = 13. שני מטבעות של שקל היו נותנים 14, שקל אחד יותר מדי."]],
      [["Which costs less in total: 3 notebooks at 4 shekels each, or 2 notebooks at 7 shekels each?", "3 notebooks at 4 shekels each", ["2 notebooks at 7 shekels each", "Both cost exactly the same"], "3 × 4 = 12 shekels and 2 × 7 = 14 shekels, so the 3 notebooks cost 2 shekels less in total."],
        ["מה זול יותר בסך הכול: 3 מחברות ב־4 שקלים כל אחת, או 2 מחברות ב־7 שקלים כל אחת?", "3 מחברות ב־4 שקלים כל אחת", ["2 מחברות ב־7 שקלים כל אחת", "שתי האפשרויות עולות אותו דבר"], "3 × 4 = 12 שקלים ו־2 × 7 = 14 שקלים, ולכן 3 המחברות עולות בסך הכול 2 שקלים פחות."]],
    ],
    n: [
      [7, ["You have 20 shekels and buy a toy for 13 shekels. How much money is left?", "shekels", "20 − 13 = 7 shekels. Counting on from 13, you need 7 more to reach 20."],
        ["יש לכם 20 שקלים, ואתם קונים צעצוע ב־13 שקלים. כמה כסף נשאר?", "שקלים", "20 − 13 = 7 שקלים. אם סופרים קדימה מ־13, צריך עוד 7 כדי להגיע ל־20."]],
      [450, ["How many agorot are there in 4 shekels 50 agorot?", "agorot", "4 shekels are 4 × 100 = 400 agorot, and 50 agorot more make 450 agorot."],
        ["כמה אגורות יש ב־4 שקלים ו־50 אגורות?", "אגורות", "4 שקלים הם 4 × 100 = 400 אגורות, ועוד 50 אגורות הן 450 אגורות."]],
    ],
    s: [[["Counting on to find the change from 50 shekels for a price of 37 shekels 50 agorot", "Start at the price: 37 shekels 50 agorot", "Add 50 agorot to reach 38 shekels", "Add 2 shekels to reach 40 shekels", "Add 10 shekels to reach 50 shekels", "Add up the steps: the change is 12 shekels 50 agorot"],
      ["סופרים קדימה כדי למצוא את העודף מ־50 שקלים למחיר של 37 שקלים ו־50 אגורות", "מתחילים מהמחיר: 37 שקלים ו־50 אגורות", "מוסיפים 50 אגורות ומגיעים ל־38 שקלים", "מוסיפים 2 שקלים ומגיעים ל־40 שקלים", "מוסיפים 10 שקלים ומגיעים ל־50 שקלים", "מחברים את הצעדים: העודף הוא 12 שקלים ו־50 אגורות"]]],
  },
  a: {
    t: [
      ["Unit price", "the price of one item or of one kilogram, used to compare offers", "מחיר ליחידה", "המחיר של פריט אחד או של קילוגרם אחד, שבעזרתו משווים בין הצעות"],
      ["Discount", "an amount taken off the usual price", "הנחה", "סכום שמורידים מהמחיר הרגיל"],
      ["Budget", "the amount of money you plan to spend and must not go over", "תקציב", "סכום הכסף שמתכננים להוציא ושאסור לעבור אותו"],
    ],
    q: [
      [["Pack A has 3 yogurts for 12 shekels. Pack B has 4 yogurts for 14 shekels. In which pack is each yogurt cheaper?", "Pack B: 3 shekels 50 agorot each", ["Pack A, because the price of the whole pack is lower", "Pack A: 4 shekels each", "Both packs cost the same per yogurt"], "Find the price of one yogurt: 12 ÷ 3 = 4 shekels in pack A and 14 ÷ 4 = 3 shekels 50 agorot in pack B. Pack A costs less in total only because it has fewer yogurts."],
        ["באריזה א׳ יש 3 יוגורטים ב־12 שקלים. באריזה ב׳ יש 4 יוגורטים ב־14 שקלים. באיזו אריזה כל יוגורט זול יותר?", "אריזה ב׳: 3 שקלים ו־50 אגורות ליוגורט", ["אריזה א׳, כי המחיר של האריזה כולה נמוך יותר", "אריזה א׳: 4 שקלים ליוגורט", "בשתי האריזות יוגורט עולה אותו מחיר"], "מוצאים את המחיר של יוגורט אחד: 12 ÷ 3 = 4 שקלים באריזה א׳, ו־14 ÷ 4 = 3 שקלים ו־50 אגורות באריזה ב׳. אריזה א׳ זולה יותר בסך הכול רק כי יש בה פחות יוגורטים."]],
      [["A shirt costs 80 shekels. In a sale it is 20 shekels cheaper. You pay with a 100-shekel note. How much change do you get?", "40 shekels", ["20 shekels", "60 shekels", "120 shekels"], "First find the sale price: 80 − 20 = 60 shekels. Then the change: 100 − 60 = 40 shekels. 20 shekels is the change without the discount."],
        ["חולצה עולה 80 שקלים. במבצע היא זולה ב־20 שקלים. שילמתם בשטר של 100 שקלים. כמה עודף תקבלו?", "40 שקלים", ["20 שקלים", "60 שקלים", "120 שקלים"], "קודם מוצאים את מחיר המבצע: 80 − 20 = 60 שקלים. אחר כך את העודף: 100 − 60 = 40 שקלים. 20 שקלים הם העודף בלי ההנחה."]],
      [["Noa has a budget of 50 shekels. She wants a game for 32 shekels 90 agorot and a book for 18 shekels 50 agorot. Can she buy both?", "No: together they cost 51 shekels 40 agorot", ["Yes: together they cost 49 shekels 40 agorot", "Yes, because each one costs less than 50 shekels", "No: she would need 14 shekels 40 agorot more"], "Add the shekels: 32 + 18 = 50. Add the agorot: 90 + 50 = 140 agorot, which is 1 shekel 40 agorot. The total is 51 shekels 40 agorot, over the budget."],
        ["לנועה יש תקציב של 50 שקלים. היא רוצה משחק ב־32 שקלים ו־90 אגורות וספר ב־18 שקלים ו־50 אגורות. האם היא יכולה לקנות את שניהם?", "לא: יחד הם עולים 51 שקלים ו־40 אגורות", ["כן: יחד הם עולים 49 שקלים ו־40 אגורות", "כן, כי כל אחד מהם עולה פחות מ־50 שקלים", "לא: היא צריכה עוד 14 שקלים ו־40 אגורות"], "מחברים את השקלים: 32 + 18 = 50. מחברים את האגורות: 90 + 50 = 140 אגורות, שהן שקל ו־40 אגורות. סך הכול 51 שקלים ו־40 אגורות, יותר מהתקציב."]],
      [["Prices are often written with a point, like ₪12.90. What does ₪4.05 mean?", "4 shekels and 5 agorot", ["4 shekels and 50 agorot", "405 shekels", "45 agorot"], "The two digits after the point are agorot: ₪4.05 is 4 shekels and 05 agorot, which is 5 agorot. 50 agorot would be written ₪4.50."],
        ["מחירים נכתבים פעמים רבות עם נקודה, כמו 12.90 ₪. מה פירוש 4.05 ₪?", "4 שקלים ו־5 אגורות", ["4 שקלים ו־50 אגורות", "405 שקלים", "45 אגורות"], "שתי הספרות שאחרי הנקודה הן אגורות: 4.05 ₪ הם 4 שקלים ו־05 אגורות, כלומר 5 אגורות. 50 אגורות היו נכתבות 4.50 ₪."]],
      [["3 friends split the cost of a 45-shekel pizza equally. Dan pays his share with a 20-shekel note. How much change does Dan get?", "5 shekels", ["15 shekels", "25 shekels", "10 shekels"], "Each share is 45 ÷ 3 = 15 shekels. Dan pays 20, so his change is 20 − 15 = 5 shekels. 15 shekels is his share, not his change."],
        ["3 חברים מתחלקים שווה בשווה במחיר של פיצה שעולה 45 שקלים. דן משלם את החלק שלו בשטר של 20 שקלים. כמה עודף יקבל דן?", "5 שקלים", ["15 שקלים", "25 שקלים", "10 שקלים"], "החלק של כל אחד הוא 45 ÷ 3 = 15 שקלים. דן משלם 20, ולכן העודף שלו הוא 20 − 15 = 5 שקלים. 15 שקלים הם החלק שלו, לא העודף."]],
    ],
    n: [
      [6, ["Pencils cost 2 shekels 50 agorot each. How many pencils can you buy with 15 shekels?", "", "2 shekels 50 agorot is 250 agorot and 15 shekels is 1,500 agorot. 1,500 ÷ 250 = 6, so you can buy 6 pencils."],
        ["עיפרון עולה 2 שקלים ו־50 אגורות. כמה עפרונות אפשר לקנות ב־15 שקלים?", "", "2 שקלים ו־50 אגורות הם 250 אגורות, ו־15 שקלים הם 1,500 אגורות. 1,500 ÷ 250 = 6, ולכן אפשר לקנות 6 עפרונות."]],
      [8, ["A cinema ticket costs 35 shekels and popcorn costs 17 shekels. You pay with a 50-shekel note and a 10-shekel coin. How much change do you get?", "shekels", "35 + 17 = 52 shekels. You paid 50 + 10 = 60 shekels, so the change is 60 − 52 = 8 shekels."],
        ["כרטיס לקולנוע עולה 35 שקלים ופופקורן עולה 17 שקלים. שילמתם בשטר של 50 שקלים ובמטבע של 10 שקלים. כמה עודף תקבלו?", "שקלים", "35 + 17 = 52 שקלים. שילמתם 50 + 10 = 60 שקלים, ולכן העודף הוא 60 − 52 = 8 שקלים."]],
    ],
    s: [[["Bags of apples: order from the cheapest price per kilogram to the most expensive", "4 kg for 14 shekels", "3 kg for 12 shekels", "2 kg for 9 shekels", "1 kg for 5 shekels"],
      ["שקיות תפוחים: סדרו מהמחיר הזול ביותר לקילוגרם ועד היקר ביותר", "4 קילוגרם ב־14 שקלים", "3 קילוגרם ב־12 שקלים", "2 קילוגרם ב־9 שקלים", "קילוגרם אחד ב־5 שקלים"]]],
  },
};
export default c;
