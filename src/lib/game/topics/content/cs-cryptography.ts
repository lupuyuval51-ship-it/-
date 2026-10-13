import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Code (secret)", "a way of changing a message so that only certain people can read it", "צופן", "דרך לשנות הודעה כך שרק אנשים מסוימים יוכלו לקרוא אותה"],
      ["Key", "the secret information needed to lock or unlock a message", "מפתח", "המידע הסודי שצריך כדי לנעול הודעה או לפתוח אותה"],
      ["Plaintext", "the original, readable message", "טקסט גלוי", "ההודעה המקורית, שאפשר לקרוא"],
      ["Ciphertext", "the scrambled message after it has been encrypted", "טקסט מוצפן", "ההודעה המעורבלת אחרי ההצפנה"],
    ],
    q: [
      [["In a Caesar cipher with a shift of 1, what does CAT become?", "DBU", ["BZS", "CAT", "TAC"], "Each letter moves one place forward: C → D, A → B, T → U."],
        ["בצופן קיסר עם הזזה של 1, למה הופכת המילה CAT?", "DBU", ["BZS", "CAT", "TAC"], "כל אות זזה מקום אחד קדימה: C → D, A → B, T → U."]],
      [["Why do we encrypt messages?", "So that only the intended person can read them", ["To make them longer", "To send them faster", "To translate them"], "Encryption keeps information private even if someone else intercepts it."],
        ["למה מצפינים הודעות?", "כדי שרק מי שההודעה מיועדת לו יוכל לקרוא אותה", ["כדי להאריך אותן", "כדי לשלוח אותן מהר יותר", "כדי לתרגם אותן"], "הצפנה שומרת על פרטיות המידע גם אם מישהו אחר מיירט אותו."]],
    ],
  },
  i: {
    t: [
      ["Caesar cipher", "a code that shifts every letter the same number of places in the alphabet", "צופן קיסר", "צופן שמזיז כל אות אותו מספר מקומות באלפבית"],
      ["Brute force", "trying every possible key until one works", "כוח גס", "ניסיון של כל מפתח אפשרי עד שאחד מצליח"],
      ["Frequency analysis", "breaking a code by counting which symbols appear most often", "ניתוח תדירויות", "פיצוח צופן בספירה של הסימנים שמופיעים הכי הרבה"],
      ["Enigma", "the German cipher machine of the Second World War whose codes were broken at Bletchley Park", "אניגמה", "מכונת ההצפנה הגרמנית במלחמת העולם השנייה, שצפניה פוצחו בבלצ׳לי פארק"],
    ],
    q: [
      [["Why is a Caesar cipher easy to break?", "There are only 25 possible shifts to try", ["It uses numbers", "It is too long", "Computers cannot read letters"], "With the English alphabet, trying all 25 shifts takes moments: a brute-force attack."],
        ["למה קל לפצח צופן קיסר?", "יש רק 25 הזזות אפשריות לנסות", ["הוא משתמש במספרים", "הוא ארוך מדי", "מחשבים לא יודעים לקרוא אותיות"], "באלפבית האנגלי, ניסיון של כל 25 ההזזות לוקח רגעים: מתקפת כוח גס."]],
      [["In English text, the most common letter is usually E. How does that help a code breaker?", "The most common symbol in a simple substitution code probably stands for E", ["It shows the key is E", "It proves the message is in French", "It doesn't help at all"], "This is frequency analysis, described by the Arab scholar al-Kindi in the 9th century."],
        ["בטקסט באנגלית האות הנפוצה ביותר היא בדרך כלל E. איך זה עוזר למפצח צפנים?", "הסימן הנפוץ ביותר בצופן החלפה פשוט מייצג כנראה את E", ["זה מראה שהמפתח הוא E", "זה מוכיח שההודעה בצרפתית", "זה לא עוזר בכלל"], "זהו ניתוח תדירויות, שתיאר המלומד הערבי אל־כִּנְדִי במאה ה־9."]],
    ],
  },
  a: {
    t: [
      ["Public-key cryptography", "a system with a public key for locking and a private key for unlocking", "הצפנה במפתח ציבורי", "שיטה עם מפתח ציבורי לנעילה ומפתח פרטי לפתיחה"],
      ["Hash function", "a function that turns any data into a fixed-length fingerprint that is hard to reverse", "פונקציית גיבוב", "פונקציה שהופכת כל מידע ל״טביעת אצבע״ באורך קבוע, שקשה לשחזר ממנה את המקור"],
      ["Digital signature", "a cryptographic proof of who sent a message and that it was not changed", "חתימה דיגיטלית", "הוכחה קריפטוגרפית מי שלח הודעה ושהיא לא שונתה"],
      ["End-to-end encryption", "encryption in which only the sender and receiver hold the keys, not the service in between", "הצפנה מקצה לקצה", "הצפנה שבה רק השולח והמקבל מחזיקים במפתחות, ולא השירות שבאמצע"],
    ],
    q: [
      [["Why do websites store a hash of your password instead of the password itself?", "If the database is stolen, the passwords are not directly revealed", ["Hashes are shorter to type", "It lets staff read passwords", "It makes logging in slower on purpose only"], "The site hashes what you type and compares hashes; good systems also add salt and use slow hash functions."],
        ["למה אתרים שומרים גיבוב של הסיסמה ולא את הסיסמה עצמה?", "אם מאגר הנתונים נגנב, הסיסמאות לא נחשפות ישירות", ["גיבוב קצר יותר להקלדה", "זה מאפשר לעובדים לקרוא סיסמאות", "רק כדי להאט את הכניסה בכוונה"], "האתר מגבב את מה שהקלדתם ומשווה גיבובים; מערכות טובות גם מוסיפות ״מלח״ ומשתמשות בפונקציות גיבוב איטיות."]],
      [["Each extra bit in a key doubles the number of possible keys. How many keys does a 10-bit key have?", "1,024", ["10", "100", "20"], "2¹⁰ = 1,024; a 128-bit key has 2¹²⁸ possibilities, far too many to try."],
        ["כל ביט נוסף במפתח מכפיל את מספר המפתחות האפשריים. כמה מפתחות יש למפתח של 10 ביטים?", "1,024", ["10", "100", "20"], "2¹⁰ = 1,024; למפתח של 128 ביטים יש 2¹²⁸ אפשרויות, הרבה יותר מדי כדי לנסות."]],
    ],
  },
};
export default c;
