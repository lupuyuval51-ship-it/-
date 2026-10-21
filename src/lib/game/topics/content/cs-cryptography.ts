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
      [["Why do we encrypt messages?", "So that only the intended person can read them", ["To make them shorter, so that they take up less space", "To send them faster over the internet", "To translate them into another language"], "Encryption keeps information private even if someone else intercepts it. An encrypted message is not shorter, faster or translated: it is only scrambled."],
        ["למה מצפינים הודעות?", "כדי שרק מי שההודעה מיועדת לו יוכל לקרוא אותה", ["כדי לקצר אותן, כך שיתפסו פחות מקום בזיכרון של המחשב", "כדי לשלוח אותן מהר יותר באינטרנט", "כדי לתרגם אותן לשפה אחרת"], "הצפנה שומרת על פרטיות המידע גם אם מישהו אחר מיירט אותו. הודעה מוצפנת לא נעשית קצרה יותר, מהירה יותר או מתורגמת: היא רק מעורבלת."]],
      [["A friend sends you GRJ, made with a Caesar cipher with a shift of 3. What did your friend write?", "DOG", ["JUM", "FQI", "JRG"], "To decrypt, move each letter 3 places back: G → D, R → O, J → G. Moving 3 places forward again would only scramble the message more."],
        ["חבר שולח לכם GRJ, שהוצפן בצופן קיסר עם הזזה של 3. מה החבר כתב?", "DOG", ["JUM", "FQI", "JRG"], "כדי לפענח, מזיזים כל אות 3 מקומות אחורה: G → D, R → O, J → G. הזזה של 3 מקומות קדימה שוב רק הייתה מערבלת את ההודעה עוד יותר."]],
      [["Why must the key of a cipher be kept secret?", "Anyone who has the key can unlock and read the messages", ["The key stops working as soon as a second person has seen it", "Only the sender uses the key; the reader never needs it", "A message locked with a known key deletes itself"], "The way a cipher works is often well known; what keeps the messages private is the key. Both the sender and the reader need it, and anyone else who learns it can read every message too."],
        ["למה צריך לשמור את המפתח של צופן בסוד?", "כל מי שיש לו את המפתח יכול לפתוח ולקרוא את ההודעות", ["המפתח מפסיק לעבוד ברגע שאדם נוסף ראה אותו", "רק השולח משתמש במפתח; מי שקורא אף פעם לא צריך אותו", "הודעה שננעלה במפתח ידוע מוחקת את עצמה"], "הדרך שבה צופן עובד ידועה לרוב; מה ששומר על ההודעות פרטיות הוא המפתח. גם השולח וגם הקורא צריכים אותו, וכל אדם אחר שיגלה אותו יוכל לקרוא את כל ההודעות."]],
    ],
    n: [
      [6, ["In a Caesar cipher every letter moves 4 places forward in the alphabet. B is the 2nd letter. What is the place in the alphabet of the letter that B turns into?", "", "2 + 4 = 6, and the 6th letter of the alphabet is F, so B turns into F.", "Add the shift to the letter's place."],
        ["בצופן קיסר כל אות זזה 4 מקומות קדימה באלף־בית. ב היא האות השנייה. מה המקום באלף־בית של האות ש־ב הופכת אליה?", "", "2 + 4 = 6, והאות השישית באלף־בית היא ו, ולכן ב הופכת ל־ו.", "הוסיפו את ההזזה למקום של האות."]],
    ],
    s: [
      [["Sending a secret message with a Caesar cipher, in order", "Agree on a secret shift with your friend", "Write the message in ordinary letters", "Move every letter forward by the shift", "Send the scrambled message", "Your friend moves every letter back by the shift and reads it"],
        ["שליחת הודעה סודית בצופן קיסר, לפי הסדר", "מסכמים עם החבר על הזזה סודית", "כותבים את ההודעה באותיות רגילות", "מזיזים כל אות קדימה לפי ההזזה", "שולחים את ההודעה המעורבלת", "החבר מזיז כל אות אחורה לפי ההזזה וקורא אותה"]],
    ],
  },
  i: {
    t: [
      ["Caesar cipher", "a code that shifts every letter the same number of places in the alphabet", "צופן קיסר", "צופן שמזיז כל אות אותו מספר מקומות באלפבית"],
      ["Brute force", "trying every possible key until one works", "כוח גס", "ניסיון של כל מפתח אפשרי עד שאחד מצליח"],
      ["Frequency analysis", "breaking a code by counting which symbols appear most often", "ניתוח תדירויות", "פיצוח צופן בספירה של הסימנים שמופיעים הכי הרבה"],
      ["Enigma", "the German cipher machine of the Second World War, first broken by Polish mathematicians and then at Bletchley Park", "אניגמה", "מכונת ההצפנה הגרמנית במלחמת העולם השנייה, שפוצחה קודם בידי מתמטיקאים פולנים ואחר כך בבלצ׳לי פארק"],
    ],
    q: [
      [["Why is a Caesar cipher easy to break?", "There are only 25 possible shifts to try", ["The scrambled message is always longer than the original", "It can be written only with numbers, never with letters", "Computers cannot read letters, only numbers"], "With the English alphabet there are only 25 useful shifts, so trying them all takes moments: a brute-force attack. The scrambled message is exactly as long as the original."],
        ["למה קל לפצח צופן קיסר?", "יש רק 25 הזזות אפשריות לנסות", ["ההודעה המוצפנת תמיד ארוכה יותר מההודעה המקורית", "אפשר לכתוב אותו רק במספרים, אף פעם לא באותיות", "מחשבים לא יודעים לקרוא אותיות, רק מספרים"], "באלפבית האנגלי יש רק 25 הזזות שימושיות, ולכן ניסיון של כולן לוקח רגעים: מתקפת כוח גס. ההודעה המוצפנת ארוכה בדיוק כמו המקורית."]],
      [["In English text, the most common letter is usually E. How does that help a code breaker?", "The most common symbol in the code probably stands for E", ["It shows that the key of the code must be the letter E itself", "It proves that the secret message was written in French", "It does not help, because the code hides every letter"], "This is frequency analysis, described by the Arab scholar al-Kindi in the 9th century. A simple substitution code always turns the same letter into the same symbol, so the letter counts give it away."],
        ["בטקסט באנגלית האות הנפוצה ביותר היא בדרך כלל E. איך זה עוזר למפצח צפנים?", "הסימן הנפוץ ביותר בצופן מייצג כנראה את E", ["זה מראה שהמפתח של הצופן חייב להיות האות E עצמה", "זה מוכיח שההודעה הסודית נכתבה בצרפתית", "זה לא עוזר, כי הצופן מסתיר כל אות"], "זהו ניתוח תדירויות, שתיאר המלומד הערבי אל־כִּנְדִי במאה ה־9. צופן החלפה פשוט הופך תמיד את אותה אות לאותו סימן, ולכן ספירת האותיות מסגירה אותו."]],
      [["With a Caesar shift of 3, what does YES become?", "BHV", ["AHV", "VBP", "ZFT"], "After Z the alphabet starts again at A, so Y goes on to Z, then A, then B: Y becomes B. E becomes H and S becomes V, which gives BHV."],
        ["בצופן קיסר עם הזזה של 3, למה הופכת המילה YES?", "BHV", ["AHV", "VBP", "ZFT"], "אחרי Z האלפבית מתחיל שוב ב־A, ולכן Y עוברת ל־Z, אחר כך ל־A ואז ל־B: Y הופכת ל־B. E הופכת ל־H ו־S הופכת ל־V, וכך מתקבל BHV."]],
      [["The Atbash cipher, found in the Hebrew Bible, swaps the first letter of the alphabet with the last, the second with the second-to-last, and so on. What does it turn ABC into?", "ZYX", ["BCD", "CBA", "XYZ"], "A swaps with Z, B with Y and C with X, so ABC becomes ZYX. The name comes from the Hebrew pairs aleph–tav and bet–shin, and the Book of Jeremiah writes Sheshach for Babel this way."],
        ["צופן אתב״ש, שמופיע בתנ״ך, מחליף את האות הראשונה באלף־בית באחרונה, את השנייה בזו שלפני האחרונה, וכן הלאה. למה הוא הופך את האותיות אבג?", "תשר", ["בגד", "גבא", "רשת"], "א מתחלפת ב־ת, ב ב־ש ו־ג ב־ר, ולכן אבג הופכות ל־תשר. מכאן השם אתב״ש: א־ת, ב־ש. כך בספר ירמיהו כתוב ״ששך״ במקום ״בבל״."]],
    ],
    n: [
      [3, ["A long English message was encrypted with a Caesar cipher, and its most common letter is H. E is the 5th letter of the alphabet and H is the 8th. What shift was most probably used?", "", "E is usually the most common letter in English, so H probably stands for E: 8 − 5 = 3. A shift of 3 is the one Julius Caesar is said to have used.", "Which letter is usually the most common in English?"],
        ["הודעה ארוכה באנגלית הוצפנה בצופן קיסר, והאות הנפוצה בה ביותר היא H. האות E היא החמישית באלפבית האנגלי, ו־H היא השמינית. באיזו הזזה השתמשו כנראה?", "", "באנגלית E היא בדרך כלל האות הנפוצה ביותר, ולכן H מייצגת כנראה את E: 8 − 5 = 3. לפי המסורת, יוליוס קיסר עצמו השתמש בהזזה של 3.", "איזו אות היא בדרך כלל הנפוצה ביותר באנגלית?"]],
    ],
    s: [
      [["Breaking a substitution code by frequency analysis, in order", "Count how often each symbol appears in the secret message", "Sort the symbols from the most common to the rarest", "Match the most common symbols with the most common letters of the language", "Try these guesses on short, common words", "Fix the guesses until the whole message makes sense"],
        ["פיצוח צופן החלפה בניתוח תדירויות, לפי הסדר", "סופרים כמה פעמים מופיע כל סימן בהודעה הסודית", "ממיינים את הסימנים מהנפוץ ביותר לנדיר ביותר", "מתאימים את הסימנים הנפוצים לאותיות הנפוצות בשפה", "בודקים את הניחושים על מילים קצרות ונפוצות", "מתקנים את הניחושים עד שכל ההודעה מובנת"]],
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
      [["Why do websites store a hash of your password instead of the password itself?", "If the database is stolen, the passwords are not directly revealed", ["It lets the site email your old password back to you if you forget it", "Hashes are shorter, so the login page loads faster", "It lets the staff check that your password is strong"], "The site hashes what you type and compares hashes; good systems also add salt and use slow hash functions. That is also why a good site can only reset a forgotten password, never send it back."],
        ["למה אתרים שומרים גיבוב של הסיסמה ולא את הסיסמה עצמה?", "אם מאגר הנתונים נגנב, הסיסמאות לא נחשפות ישירות", ["כדי שהאתר יוכל לשלוח לכם במייל את הסיסמה הישנה אם תשכחו אותה", "גיבוב קצר יותר, ולכן דף הכניסה נטען מהר יותר", "כדי שהעובדים יוכלו לבדוק שהסיסמה שלכם חזקה"], "האתר מגבב את מה שהקלדתם ומשווה גיבובים; מערכות טובות גם מוסיפות ״מלח״ ומשתמשות בפונקציות גיבוב איטיות. זו גם הסיבה שאתר טוב יכול רק לאפס סיסמה שנשכחה, ואף פעם לא לשלוח אותה בחזרה."]],
      [["Each extra bit in a key doubles the number of possible keys. How many keys does a 10-bit key have?", "1,024", ["100", "2,048", "20", "10"], "2¹⁰ = 1,024: ten doublings of 1, not 10 × 10 and not eleven doublings. A 128-bit key has 2¹²⁸ possibilities, far too many to try."],
        ["כל ביט נוסף במפתח מכפיל את מספר המפתחות האפשריים. כמה מפתחות יש למפתח של 10 ביטים?", "1,024", ["100", "2,048", "20", "10"], "2¹⁰ = 1,024: עשר הכפלות של 1, לא 10 × 10 ולא אחת־עשרה הכפלות. למפתח של 128 ביטים יש 2¹²⁸ אפשרויות, הרבה יותר מדי כדי לנסות."]],
      [["Alice wants Bob to send her a secret over the internet. With public-key cryptography, which key should Bob use to lock the message?", "Alice's public key", ["Alice's private key", "Bob's private key", "Bob's public key"], "Anyone may lock a message with Alice's public key, but only her private key, which stays with her and is never sent, can unlock it. So Bob needs no secret of hers at all."],
        ["נועה רוצה שעידו ישלח לה סוד דרך האינטרנט. בהצפנה במפתח ציבורי, באיזה מפתח עידו צריך לנעול את ההודעה?", "המפתח הציבורי של נועה", ["המפתח הפרטי של נועה", "המפתח הפרטי של עידו", "המפתח הציבורי של עידו"], "כל אחד יכול לנעול הודעה במפתח הציבורי של נועה, אבל רק המפתח הפרטי שלה, שנשאר תמיד אצלה ולא נשלח לאף אחד, יכול לפתוח אותה. כך עידו לא צריך לדעת שום סוד שלה."]],
      [["To sign a message digitally, so that anyone can check who sent it, which key does the sender use?", "The sender's own private key", ["The sender's own public key", "The receiver's public key", "A password that everyone knows"], "Only the sender holds the private key, so only they can make the signature, and anyone can check it with the matching public key. If even one letter of the message changes, the check fails."],
        ["כדי לחתום על הודעה חתימה דיגיטלית, כך שכל אחד יוכל לבדוק מי שלח אותה, באיזה מפתח השולח משתמש?", "המפתח הפרטי של השולח עצמו", ["המפתח הציבורי של השולח עצמו", "המפתח הציבורי של המקבל", "סיסמה שכולם מכירים"], "רק לשולח יש את המפתח הפרטי, ולכן רק הוא יכול ליצור את החתימה, וכל אחד יכול לבדוק אותה במפתח הציבורי המתאים. אם אפילו אות אחת בהודעה משתנה, הבדיקה נכשלת."]],
      [["Two users of a site choose the same password. Why does a good site add a different random “salt” to each password before hashing it?", "So the two users' stored hashes come out different", ["So the site can turn the hashes back into the passwords later", "So the two users find their passwords easier to remember", "So the hashes are shorter and take less space on the server"], "Without salt, equal passwords give equal hashes, and attackers can look them up in ready-made tables of common passwords. A random salt for each user makes every stored hash unique."],
        ["שני משתמשים באתר בוחרים אותה סיסמה. למה אתר טוב מוסיף לכל סיסמה ״מלח״ אקראי שונה לפני שהוא מגבב אותה?", "כדי שהגיבובים השמורים של שני המשתמשים ייצאו שונים", ["כדי שהאתר יוכל להחזיר אחר כך את הגיבובים לסיסמאות", "כדי ששני המשתמשים יזכרו את הסיסמאות שלהם בקלות רבה יותר", "כדי שהגיבובים יהיו קצרים יותר ויתפסו פחות מקום בשרת"], "בלי מלח, סיסמאות זהות נותנות גיבובים זהים, ותוקפים יכולים לחפש אותם בטבלאות מוכנות של סיסמאות נפוצות. מלח אקראי לכל משתמש הופך כל גיבוב שמור לייחודי."]],
      [["In a chat app with end-to-end encryption, who can read the messages you send?", "Only you and the people you send them to", ["Anyone who works at the company that runs the app", "Anyone who is connected to the same Wi-Fi network", "The phone company that carries the data to the app"], "The keys exist only on the users' own devices, so the app's servers pass on scrambled data that they cannot read. Someone holding your unlocked phone could still read it, though."],
        ["באפליקציית צ׳אט עם הצפנה מקצה לקצה, מי יכול לקרוא את ההודעות שאתם שולחים?", "רק אתם והאנשים שאליהם אתם שולחים אותן", ["כל מי שעובד בחברה שמפעילה את האפליקציה", "כל מי שמחובר לאותה רשת Wi-Fi כמוכם", "חברת הטלפון שמעבירה את הנתונים לאפליקציה"], "המפתחות נמצאים רק במכשירים של המשתמשים, ולכן השרתים של האפליקציה מעבירים מידע מעורבל שהם לא יכולים לקרוא. עם זאת, מי שמחזיק בטלפון שלכם כשהוא לא נעול עדיין יכול לקרוא אותו."]],
    ],
    n: [
      [66, ["A computer tries 1,000 keys every second. A cipher has 2¹⁶ = 65,536 possible keys. In the worst case, how many seconds does it need to try them all, to the nearest second?", "seconds", "65,536 ÷ 1,000 ≈ 66 seconds. Each extra bit doubles the time, so a 128-bit key would take far longer than the age of the universe, even for the fastest computers.", "Divide the number of keys by the keys tried each second."],
        ["מחשב מנסה 1,000 מפתחות בכל שנייה. לצופן יש 2¹⁶ = 65,536 מפתחות אפשריים. במקרה הגרוע, כמה שניות הוא צריך כדי לנסות את כולם, מעוגל לשנייה שלמה?", "שניות", "65,536 ÷ 1,000 ≈ 66 שניות. כל ביט נוסף מכפיל את הזמן, ולכן מפתח של 128 ביטים היה דורש זמן ארוך בהרבה מגיל היקום, גם למחשבים המהירים ביותר.", "חלקו את מספר המפתחות במספר המפתחות שנבדקים בכל שנייה."], 1],
    ],
    s: [
      [["Checking that a downloaded file was not changed, in order", "The publisher works out the file's hash and shows it on its website", "You download the file", "Your computer works out the hash of the file you got", "You compare it with the hash shown on the website", "If the two hashes match, you can trust the file"],
        ["בדיקה שקובץ שהורדתם לא שונה, לפי הסדר", "המפרסם מחשב את הגיבוב של הקובץ ומציג אותו באתר שלו", "אתם מורידים את הקובץ", "המחשב שלכם מחשב את הגיבוב של הקובץ שקיבלתם", "משווים אותו לגיבוב שמוצג באתר", "אם שני הגיבובים זהים, אפשר לסמוך על הקובץ"]],
    ],
  },
};
export default c;
