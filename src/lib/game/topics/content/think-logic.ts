import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Deduction", "reaching a conclusion that must be true from what you already know", "דדוקציה", "הגעה למסקנה שחייבת להיות נכונה מתוך מה שכבר ידוע"],
      ["Elimination", "solving by crossing out the options that cannot be right", "שיטת הפסילה", "פתרון בעזרת מחיקה של האפשרויות שלא יכולות להיות נכונות"],
      ["Statement", "a sentence that is either true or false", "טענה", "משפט שהוא נכון או לא נכון"],
      ["Logic grid", "a table for matching people and things by marking yes and no", "טבלת היגיון", "טבלה להתאמה בין אנשים לדברים בעזרת סימוני כן ולא"],
    ],
    q: [
      [["Dan, Noa and Eli each have one pet: a cat, a dog or a fish. Dan's pet lives in water. Noa is allergic to cats. Who has the cat?", "Eli", ["Noa", "Dan", "Nobody has the cat"], "Dan has the fish (it lives in water). Noa cannot have the cat, so she has the dog. That leaves the cat for Eli."],
        ["לדן, לנועה ולאלי יש חיית מחמד אחת לכל אחד: חתול, כלב או דג. חיית המחמד של דן חיה במים. נועה אלרגית לחתולים. למי יש את החתול?", "לאלי", ["לנועה", "לדן", "לאף אחד אין חתול"], "לדן יש את הדג (הוא חי במים). לנועה לא יכול להיות חתול, ולכן יש לה את הכלב. נשאר החתול — לאלי."]],
      [["All birds have feathers. A penguin is a bird. So…", "a penguin has feathers", ["a penguin can fly", "every animal with feathers is a penguin", "penguins are not birds"], "If something is true of all birds and a penguin is a bird, it must be true of the penguin. Nothing was said about flying."],
        ["לכל הציפורים יש נוצות. פינגווין הוא ציפור. לכן…", "לפינגווין יש נוצות", ["פינגווין יכול לעוף", "כל בעל חיים עם נוצות הוא פינגווין", "פינגווינים הם לא ציפורים"], "אם משהו נכון לכל הציפורים והפינגווין הוא ציפור, זה חייב להיות נכון גם לגביו. על תעופה לא נאמר דבר."]],
    ],
    n: [[2, ["Three friends stand in a line. Ron is not first. Gal is last. In which place (1, 2 or 3) does Ron stand?", "", "Gal is in place 3 and Ron is not in place 1, so Ron must be in place 2."], ["שלושה חברים עומדים בתור. רון לא ראשון. גל אחרון. באיזה מקום (1, 2 או 3) עומד רון?", "", "גל במקום 3 ורון לא במקום 1, ולכן רון חייב להיות במקום 2."]]],
  },
  i: {
    t: [
      ["Premise", "a statement that an argument starts from", "הנחת יסוד", "טענה שממנה טיעון יוצא לדרך"],
      ["Conclusion", "the statement that follows from the premises", "מסקנה", "הטענה שנובעת מהנחות היסוד"],
      ["If–then statement", "a sentence saying one thing happens whenever another does, like “if it rains, the ground gets wet”", "משפט אם–אז", "משפט שאומר שדבר אחד קורה בכל פעם שדבר אחר קורה, כמו ״אם יורד גשם, האדמה נרטבת״"],
      ["Counterexample", "one case that shows a general claim is false", "דוגמה נגדית", "מקרה אחד שמראה שטענה כללית אינה נכונה"],
    ],
    q: [
      [["“If it rains, the ground gets wet.” The ground is wet. Must it have rained?", "No — something else, like a sprinkler, could have wet it", ["Yes, it must have rained", "Only if it is winter", "The ground cannot be wet"], "“If A then B” does not mean “if B then A”. A wet ground has other possible causes."],
        ["״אם יורד גשם, האדמה נרטבת.״ האדמה רטובה. האם בהכרח ירד גשם?", "לא — משהו אחר, כמו ממטרה, יכול היה להרטיב אותה", ["כן, בהכרח ירד גשם", "רק אם זה חורף", "האדמה לא יכולה להיות רטובה"], "״אם א׳ אז ב׳״ לא אומר ״אם ב׳ אז א׳״. לאדמה רטובה יכולות להיות סיבות אחרות."]],
      [["Which number is a counterexample to “All prime numbers are odd”?", "2", ["9", "3", "7"], "2 is prime and even, so one case is enough to show the claim is false. (9 is odd but not prime.)"],
        ["איזה מספר הוא דוגמה נגדית לטענה ״כל המספרים הראשוניים הם אי־זוגיים״?", "2", ["9", "3", "7"], "2 הוא מספר ראשוני וזוגי, ומקרה אחד מספיק כדי להראות שהטענה שגויה. (9 אי־זוגי אבל אינו ראשוני.)"]],
    ],
    s: [[["Solving a logic grid puzzle", "Read all the clues", "Mark every certain “no” with a cross", "Mark a “yes” where only one option is left", "Use each “yes” to cross out the rest of its row and column", "Check the answer against every clue"],
      ["פתרון חידת טבלת היגיון", "קוראים את כל הרמזים", "מסמנים באיקס כל ״לא״ ודאי", "מסמנים ״כן״ במקום שבו נשארה רק אפשרות אחת", "בעזרת כל ״כן״ מוחקים את שאר השורה והעמודה שלו", "בודקים את התשובה מול כל הרמזים"]]],
  },
  a: {
    t: [
      ["Valid argument", "an argument in which true premises guarantee a true conclusion", "טיעון תקף", "טיעון שבו הנחות יסוד נכונות מבטיחות מסקנה נכונה"],
      ["Converse", "an if–then sentence turned around: if B, then A", "המשפט ההפוך", "משפט אם–אז שבו מחליפים בין התנאי לתוצאה: אם ב׳, אז א׳"],
      ["Contrapositive", "“if not B, then not A”, which is always true when “if A, then B” is true", "קונטרפוזיציה", "״אם לא ב׳, אז לא א׳״ — תמיד נכון כאשר ״אם א׳, אז ב׳״ נכון"],
      ["Paradox", "a statement or situation that seems to contradict itself, like “this sentence is false”", "פרדוקס", "טענה או מצב שנראים כאילו הם סותרים את עצמם, כמו ״המשפט הזה שקרי״"],
    ],
    q: [
      [["On an island, knights always tell the truth and knaves always lie. Ben says: “Ann and I are both knaves.” What are they?", "Ben is a knave and Ann is a knight", ["Both are knaves", "Both are knights", "Ben is a knight and Ann is a knave"], "A knight could never say he is a knave, so Ben is a knave and his sentence is false. Then they are not both knaves, so Ann is a knight."],
        ["באי אחד האבירים תמיד אומרים אמת והנוכלים תמיד משקרים. בן אומר: ״אני ואנה שנינו נוכלים.״ מה הם?", "בן נוכל ואנה אבירה", ["שניהם נוכלים", "שניהם אבירים", "בן אביר ואנה נוכלת"], "אביר לעולם לא יגיד שהוא נוכל, ולכן בן נוכל והמשפט שלו שקרי. אם כך, הם לא שניהם נוכלים — ואנה אבירה."]],
      [["“If an animal is a fish, then it lives in water.” Which sentence must also be true?", "If an animal does not live in water, then it is not a fish", ["If an animal lives in water, then it is a fish", "If an animal is not a fish, then it does not live in water", "Every animal lives in water"], "This is the contrapositive, which always has the same truth as the original. The converse (lives in water → fish) can be false: think of a dolphin."],
        ["״אם בעל חיים הוא דג, אז הוא חי במים.״ איזה משפט חייב להיות נכון גם הוא?", "אם בעל חיים לא חי במים, אז הוא לא דג", ["אם בעל חיים חי במים, אז הוא דג", "אם בעל חיים אינו דג, אז הוא לא חי במים", "כל בעלי החיים חיים במים"], "זו הקונטרפוזיציה, שתמיד נכונה בדיוק כמו המשפט המקורי. המשפט ההפוך (חי במים ← דג) יכול להיות שגוי: חשבו על דולפין."]],
      [["“All cats are animals. Some animals are black.” Does it follow that some cats are black?", "No — the black animals might all be other animals", ["Yes, it must follow", "Yes, because cats are animals", "No, because no cats are black"], "The argument is not valid: the premises allow the black animals to be, say, crows only. Real cats may be black, but these premises do not prove it."],
        ["״כל החתולים הם בעלי חיים. חלק מבעלי החיים שחורים.״ האם נובע מכך שחלק מהחתולים שחורים?", "לא — ייתכן שכל בעלי החיים השחורים הם בעלי חיים אחרים", ["כן, זה חייב לנבוע", "כן, כי חתולים הם בעלי חיים", "לא, כי אין חתולים שחורים"], "הטיעון אינו תקף: לפי ההנחות ייתכן שבעלי החיים השחורים הם, למשל, רק עורבים. במציאות יש חתולים שחורים, אבל ההנחות האלה לא מוכיחות את זה."]],
    ],
    n: [[10, ["5 people each shake hands once with every other person. How many handshakes are there?", "handshakes", "Each person shakes 4 hands: 5 × 4 = 20, but every handshake was counted twice, so 20 ÷ 2 = 10."], ["5 אנשים לוחצים יד פעם אחת לכל אחד מהאחרים. כמה לחיצות ידיים יש?", "לחיצות", "כל אחד לוחץ 4 ידיים: 5 × 4 = 20, אבל כל לחיצה נספרה פעמיים, ולכן 20 ÷ 2 = 10."]]],
  },
};
export default c;
