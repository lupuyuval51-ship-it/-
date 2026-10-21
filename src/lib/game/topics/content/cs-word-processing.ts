import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Word processor", "a program for typing, editing and printing documents", "מעבד תמלילים", "תוכנה להקלדה, לעריכה ולהדפסה של מסמכים"],
      ["Font", "the style of the letters, such as Arial or Times New Roman", "גופן", "הסגנון של האותיות, למשל Arial או David"],
      ["Bold", "thick, dark letters that make words stand out", "הדגשה", "אותיות עבות וכהות שגורמות למילים לבלוט"],
      ["Italic", "letters that lean to one side", "נטוי", "אותיות שמוטות הצידה"],
    ],
    q: [
      [["Which of these is a word processor?", "Microsoft Word or Google Docs", ["Microsoft Excel or Google Sheets", "Paint or another drawing app", "A calculator app"], "Word and Docs are made for writing documents. Excel and Sheets are spreadsheets for numbers and tables, and Paint is for drawing."],
        ["מה מבין אלה הוא מעבד תמלילים?", "Microsoft Word או Google Docs", ["Microsoft Excel או Google Sheets", "התוכנה Paint או תוכנת ציור אחרת", "אפליקציית מחשבון"], "התוכנות Word ו־Docs נועדו לכתיבת מסמכים. Excel ו־Sheets הם גיליונות אלקטרוניים למספרים ולטבלאות, ו־Paint נועד לציור."]],
      [["A red wavy line appears under a word. What does it usually mean?", "The word may be spelled wrong", ["The word is a link to a website", "The word will soon be deleted", "The word has been made bold"], "The spell checker draws a red wavy line under words it does not know. Right-click the word to see suggested spellings, but check them yourself: names are often marked too."],
        ["מתחת למילה מופיע קו אדום מסולסל. מה זה אומר בדרך כלל?", "ייתכן שהמילה כתובה בשגיאה", ["המילה היא קישור לאתר אינטרנט", "המילה תימחק בקרוב", "המילה הודגשה"], "בודק האיות מסמן בקו אדום מסולסל מילים שהוא לא מכיר. לחיצה ימנית על המילה מציגה הצעות לתיקון, אבל בדקו אותן בעצמכם: גם שמות מסומנים לעיתים קרובות."]],
      [["What does Save do?", "Keeps the file so you can open it again later", ["Prints the document out on paper", "Sends a copy of the document by email to a friend", "Makes every letter in the text bigger"], "Saving stores the document as a file on the computer or in the cloud. Without saving, new work can be lost if the program closes, although some online programs save for you automatically."],
        ["מה עושה הפעולה ״שמירה״?", "שומרת את הקובץ כדי שתוכלו לפתוח אותו שוב אחר כך", ["מדפיסה את המסמך על נייר", "שולחת עותק של המסמך לחבר בדואר אלקטרוני", "מגדילה כל אות בטקסט"], "שמירה מאחסנת את המסמך כקובץ במחשב או בענן. בלי שמירה, עבודה חדשה עלולה ללכת לאיבוד אם התוכנה נסגרת, אף שחלק מהתוכנות ברשת שומרות בשבילכם באופן אוטומטי."]],
      [["Which setting makes the letters bigger?", "Font size", ["Font colour", "Line spacing", "Bold"], "Font size sets how big the letters are, measured in points. Font colour changes the colour, and bold makes letters thicker but not much bigger."],
        ["איזו הגדרה מגדילה את האותיות?", "גודל הגופן", ["צבע הגופן", "ריווח בין שורות", "הדגשה"], "גודל הגופן קובע כמה גדולות האותיות, והוא נמדד בנקודות. צבע הגופן משנה את הצבע, והדגשה מעבה את האותיות אבל כמעט לא מגדילה אותן."]],
      [["A title is placed in the middle of the line. Which alignment is this?", "Centred", ["Justified", "Left-aligned", "Right-aligned"], "Centred text sits in the middle, with the same space on both sides. Titles are often centred, while normal paragraphs line up with one edge."],
        ["כותרת ממוקמת באמצע השורה. איזה יישור זה?", "יישור למרכז", ["יישור לשני הצדדים", "יישור לשמאל", "יישור לימין"], "טקסט מיושר למרכז עומד באמצע, עם אותו רווח משני הצדדים. כותרות ממורכזות לעיתים קרובות, ופסקאות רגילות מיושרות לאחד הצדדים."]],
    ],
    n: [
      [150, ["Your story must be 400 words long, and the word count shows 250. How many more words do you need?", "words", "400 − 250 = 150, so you still need to write 150 more words."],
        ["הסיפור שלכם צריך להיות באורך 400 מילים, ומונה המילים מראה 250. כמה מילים עוד חסרות?", "מילים", "400 − 250 = 150, ולכן אתם צריכים לכתוב עוד 150 מילים."]],
    ],
    s: [
      [["Make a title bigger", "Type the title", "Select the title with the mouse", "Choose a bigger font size", "Click somewhere else to see the result"],
        ["הגדלה של כותרת", "מקלידים את הכותרת", "מסמנים את הכותרת בעזרת העכבר", "בוחרים גודל גופן גדול יותר", "לוחצים במקום אחר כדי לראות את התוצאה"]],
    ],
  },
  i: {
    t: [
      ["Alignment", "how lines of text line up: to the left, to the right, in the centre or along both edges", "יישור", "האופן שבו שורות הטקסט מסתדרות: לשמאל, לימין, למרכז או לשני הצדדים"],
      ["Heading", "a title that starts a part of a document and tells what it is about", "כותרת", "שם קצר שפותח חלק במסמך ומספר במה הוא עוסק"],
      ["Bulleted list", "a list in which each item starts with a dot or another small symbol", "רשימת תבליטים", "רשימה שבה כל פריט מתחיל בנקודה או בסימן קטן אחר"],
      ["Table", "a grid of rows and columns for arranging information", "טבלה", "רשת של שורות ועמודות לסידור מידע"],
    ],
    q: [
      [["Hebrew is written from right to left. Which alignment do Hebrew paragraphs normally use?", "Right-aligned", ["Left-aligned", "Centred"], "Lines of Hebrew start at the right edge, so paragraphs are aligned to the right. English, which starts on the left, is normally aligned to the left."],
        ["עברית נכתבת מימין לשמאל. איזה יישור משמש בדרך כלל לפסקאות בעברית?", "יישור לימין", ["יישור לשמאל", "יישור למרכז"], "שורות בעברית מתחילות בקצה הימני, ולכן הפסקאות מיושרות לימין. אנגלית, שמתחילה משמאל, מיושרת בדרך כלל לשמאל."]],
      [["When is a numbered list better than a bulleted list?", "When the order of the items matters, like steps", ["When the list has more than three or four items in it", "When the items are pictures and not words", "When every item is written in bold"], "Numbers show an order, so they suit instructions or a top ten. Bullets suit items whose order does not matter, like a shopping list."],
        ["מתי רשימה ממוספרת עדיפה על רשימת תבליטים?", "כשהסדר של הפריטים חשוב, כמו בשלבים", ["כשיש ברשימה יותר משלושה או ארבעה פריטים", "כשהפריטים הם תמונות ולא מילים", "כשכל פריט כתוב בהדגשה"], "מספרים מראים סדר, ולכן הם מתאימים להוראות או לרשימת ״עשרת הגדולים״. תבליטים מתאימים לפריטים שהסדר שלהם לא חשוב, כמו רשימת קניות."]],
      [["You want the page number at the bottom of every page. Where do you put it?", "In the footer", ["In the header", "In the title", "In a table"], "The footer is an area at the bottom of every page, and the header is the same kind of area at the top. Whatever you put there appears on each page by itself."],
        ["אתם רוצים שמספר העמוד יופיע בתחתית כל עמוד. איפה שמים אותו?", "בכותרת התחתונה", ["בכותרת העליונה", "בכותרת של המסמך", "בתוך טבלה"], "הכותרת התחתונה היא אזור בתחתית כל עמוד, והכותרת העליונה היא אזור כזה בראש העמוד. מה שכותבים שם מופיע בכל עמוד מעצמו."]],
      [["What does Find and Replace do?", "Swaps one word for another throughout the text", ["Finds every spelling mistake and fixes them all at once", "Moves a word to the end of the document", "Changes the font of the whole document"], "You type the word to find and the word to put instead, and the program changes every place it appears. It is a quick way to fix a name you misspelled many times."],
        ["מה עושה הפעולה ״חיפוש והחלפה״?", "מחליפה מילה אחת באחרת בכל הטקסט", ["מוצאת את כל שגיאות האיות ומתקנת את כולן בבת אחת", "מעבירה מילה לסוף המסמך", "משנה את הגופן של כל המסמך"], "מקלידים את המילה שצריך למצוא ואת המילה שתבוא במקומה, והתוכנה משנה כל מקום שבו היא מופיעה. זו דרך מהירה לתקן שם שכתבתם בשגיאה פעמים רבות."]],
      [["What is a page break for?", "Starting the next text at the top of a new page", ["Splitting the document into two separate new files", "Deleting the page you are working on", "Drawing a line across the middle of the page"], "A page break pushes everything after it onto a new page, for example so that each chapter starts on its own page. Pressing Enter many times does this badly, because the text moves when you edit."],
        ["בשביל מה משמש מעבר עמוד?", "כדי שהטקסט הבא יתחיל בראש עמוד חדש", ["כדי לפצל את המסמך לשני קבצים חדשים ונפרדים", "כדי למחוק את העמוד שבו אתם עובדים", "כדי למתוח קו לרוחב אמצע העמוד"], "מעבר עמוד דוחף את כל מה שאחריו לעמוד חדש, למשל כדי שכל פרק יתחיל בעמוד משלו. לחיצה על Enter פעמים רבות עושה זאת רע, כי הטקסט זז כשעורכים."]],
    ],
    n: [
      [12, ["A table has 4 rows and 3 columns. How many cells does it have?", "cells", "Each of the 4 rows has 3 cells, so there are 4 × 3 = 12 cells."],
        ["בטבלה יש 4 שורות ו־3 עמודות. כמה תאים יש בה?", "תאים", "בכל אחת מ־4 השורות יש 3 תאים, ולכן יש 4 × 3 = 12 תאים."]],
    ],
    s: [
      [["Insert a table", "Put the cursor where the table should go", "Open the Insert menu", "Choose Table", "Pick the number of rows and columns", "Type the information into the cells"],
        ["הוספת טבלה", "מציבים את הסמן במקום שבו הטבלה צריכה להיות", "פותחים את התפריט ״הוספה״", "בוחרים ״טבלה״", "בוחרים את מספר השורות והעמודות", "מקלידים את המידע לתוך התאים"]],
    ],
  },
  a: {
    t: [
      ["PDF", "a file format that keeps a document looking the same on every device and is hard to edit", "קובץ PDF", "סוג קובץ שבו המסמך נראה אותו דבר בכל מכשיר, וקשה לערוך אותו"],
      ["Style", "a saved set of formatting, such as font, size and colour, applied in one click", "סגנון", "אוסף שמור של עיצוב, כמו גופן, גודל וצבע, שמחילים בלחיצה אחת"],
      ["Table of contents", "a list of a document's headings with the page number of each", "תוכן עניינים", "רשימה של כותרות המסמך, ולצד כל אחת מספר העמוד שלה"],
      ["Track changes", "a mode that records every edit so others can see it and accept or reject it", "מעקב אחר שינויים", "מצב שרושם כל עריכה, כדי שאחרים יוכלו לראות אותה ולקבל או לדחות אותה"],
    ],
    q: [
      [["Why use the built-in heading styles instead of just making titles big and bold?", "The program can build a table of contents from them", ["Heading styles make the saved file much smaller on disk", "Heading styles stop other people from editing", "Only heading styles can be printed on paper"], "When you use heading styles, the word processor knows which lines are headings, so it can list them with page numbers automatically and show them in a navigation pane."],
        ["למה כדאי להשתמש בסגנונות הכותרת המובנים במקום רק להגדיל ולהדגיש כותרות?", "התוכנה יכולה לבנות מהם תוכן עניינים", ["סגנונות כותרת מקטינים מאוד את הקובץ השמור", "סגנונות כותרת מונעים מאחרים לערוך", "רק סגנונות כותרת אפשר להדפיס על נייר"], "כשמשתמשים בסגנונות כותרת, מעבד התמלילים יודע אילו שורות הן כותרות, ולכן הוא יכול לרשום אותן עם מספרי עמודים באופן אוטומטי ולהציג אותן בחלונית ניווט."]],
      [["You send your project to a teacher and want it to look exactly the same on any computer. Which format is best?", "PDF", ["DOCX", "TXT", "MP3"], "A PDF keeps the fonts, pictures and layout fixed, so it looks the same everywhere. A DOCX file can shift if another computer lacks your fonts, TXT loses all formatting and MP3 is a sound file."],
        ["אתם שולחים את העבודה למורה ורוצים שהיא תיראה בדיוק אותו דבר בכל מחשב. איזה פורמט הכי מתאים?", "PDF", ["DOCX", "TXT", "MP3"], "קובץ PDF שומר על הגופנים, התמונות והפריסה, ולכן הוא נראה אותו דבר בכל מקום. קובץ DOCX עלול לזוז אם במחשב אחר חסרים הגופנים שלכם, TXT מאבד את כל העיצוב, ו־MP3 הוא קובץ קול."]],
      [["Why might a document look different when it is opened on another computer?", "That computer may not have the same fonts", ["Documents change their words when they are copied", "Every computer shows text in a different language", "A file shrinks a little each time it is opened"], "If a font is missing, the program swaps in another one with different letter widths, so lines and pages can break in other places. Saving as PDF or using common fonts avoids this."],
        ["למה מסמך עלול להיראות אחרת כשפותחים אותו במחשב אחר?", "ייתכן שאין במחשב ההוא את אותם גופנים", ["מסמכים משנים את המילים שלהם כשמעתיקים אותם", "כל מחשב מציג טקסט בשפה אחרת", "קובץ מתכווץ מעט בכל פעם שפותחים אותו"], "אם גופן חסר, התוכנה מחליפה אותו בגופן אחר שבו רוחב האותיות שונה, ולכן שורות ועמודים נשברים במקומות אחרים. שמירה כ־PDF או שימוש בגופנים נפוצים מונעים זאת."]],
      [["What happens to a paragraph when you choose justified alignment?", "Spaces are stretched so both edges are straight", ["All the text moves to the middle of the page, line by line", "Every line gets the same number of words", "The text is checked for spelling mistakes"], "Justified text lines up with both the left and the right margin. To do this the program widens the spaces between words, except on the last line of the paragraph."],
        ["מה קורה לפסקה כשבוחרים יישור לשני הצדדים?", "הרווחים נמתחים כך ששני הקצוות ישרים", ["כל הטקסט עובר לאמצע העמוד, שורה אחרי שורה", "בכל שורה יש אותו מספר מילים", "הטקסט נבדק לשגיאות איות"], "טקסט מיושר לשני הצדדים צמוד גם לשוליים הימניים וגם לשמאליים. כדי לעשות זאת התוכנה מרחיבה את הרווחים בין המילים, חוץ מאשר בשורה האחרונה של הפסקה."]],
      [["You typed “their” instead of “there”, but the spell checker marked nothing. Why?", "“Their” is also a real word", ["The spell checker only checks the first page", "The word was too short for the spell checker", "The spell checker only works on bold text"], "A basic spell checker only asks whether each word exists in its dictionary. “Their” is a real word, so the mistake is missed; careful proofreading, or a grammar checker, is needed to catch it."],
        ["כתבתם ״אני הולך אם חבר״ במקום ״עם חבר״, ובדיקת האיות לא סימנה דבר. למה?", "גם ״אם״ היא מילה תקינה במילון", ["בודק האיות בודק רק את העמוד הראשון", "המילה קצרה מדי בשביל בודק האיות", "בודק האיות עובד רק על טקסט מודגש"], "בודק איות פשוט בודק רק אם כל מילה קיימת במילון שלו. ״אם״ היא מילה אמיתית, ולכן הטעות מתפספסת; כדי לתפוס אותה צריך הגהה זהירה או בודק דקדוק."]],
    ],
    n: [
      [16, ["A4 paper is 21 cm wide. The left and right margins are 2.5 cm each. How wide is the space for text?", "cm", "The two margins take 2.5 + 2.5 = 5 cm, so the text has 21 − 5 = 16 cm."],
        ["רוחב דף A4 הוא 21 ס״מ. השוליים מימין ומשמאל הם 2.5 ס״מ כל אחד. מה רוחב המקום לטקסט?", "ס״מ", "שני השוליים תופסים 2.5 + 2.5 = 5 ס״מ, ולכן לטקסט נשארים 21 − 5 = 16 ס״מ."]],
    ],
    s: [
      [["Save a document as a PDF", "Finish writing and check the document", "Open the File menu", "Choose Save As or Export", "Pick PDF as the file type and save"],
        ["שמירת מסמך כקובץ PDF", "מסיימים לכתוב ובודקים את המסמך", "פותחים את התפריט ״קובץ״", "בוחרים ״שמירה בשם״ או ״ייצוא״", "בוחרים PDF כסוג הקובץ ושומרים"]],
    ],
  },
};
export default c;
