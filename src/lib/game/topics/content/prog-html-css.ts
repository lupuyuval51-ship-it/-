import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["HTML", "the language that describes the structure and content of a web page", "HTML", "השפה שמתארת את המבנה ואת התוכן של דף אינטרנט"],
      ["Tag", "a marker in angle brackets, like <p>, that tells the browser what a piece of content is", "תגית", "סימון בתוך סוגריים משולשים, כמו <p>, שאומר לדפדפן מה הוא קטע תוכן"],
      ["Browser", "the program that reads HTML and CSS and draws the web page on the screen", "דפדפן", "התוכנה שקוראת HTML ו־CSS ומציירת את דף האינטרנט על המסך"],
      ["CSS", "the language that describes how a web page looks: colours, fonts, sizes and layout", "CSS", "השפה שמתארת איך דף אינטרנט נראה: צבעים, גופנים, גדלים ופריסה"],
    ],
    q: [
      [["In HTML, which tag makes the biggest heading?", "<h1>", ["<h6>", "<head>", "<p>"], "Headings go from <h1> (the biggest and most important) down to <h6>. <head> is a different part of the page."],
        ["ב־HTML, איזו תגית יוצרת את הכותרת הגדולה ביותר?", "<h1>", ["<h6>", "<head>", "<p>"], "הכותרות הולכות מ־<h1> (הגדולה והחשובה ביותר) ועד <h6>. <head> הוא חלק אחר של הדף."]],
      [["In HTML, what does the tag <p> mark?", "A paragraph of text", ["A page title", "A picture", "A password"], "<p> stands for paragraph. Pictures use <img>."],
        ["ב־HTML, מה מסמנת התגית <p>?", "פסקת טקסט", ["כותרת של הדף", "תמונה", "סיסמה"], "<p> הוא קיצור של paragraph, כלומר פסקה. לתמונות משתמשים ב־<img>."]],
      [["In HTML, which of these is a closing tag?", "</p>", ["<p>", "<\\p>", "<close p>"], "A closing tag repeats the name after a forward slash: <p> opens a paragraph and </p> closes it."],
        ["ב־HTML, איזו מהבאות היא תגית סוגרת?", "</p>", ["<p>", "<\\p>", "<close p>"], "תגית סוגרת חוזרת על השם אחרי לוכסן: <p> פותחת פסקה ו־</p> סוגרת אותה."]],
    ],
  },
  i: {
    t: [
      ["Attribute", "extra information written inside an opening tag, like href in a link", "מאפיין (attribute)", "מידע נוסף שנכתב בתוך תגית פותחת, כמו href בקישור"],
      ["Link", "an <a> element that takes the user to another page when it is clicked", "קישור", "רכיב <a> שמעביר את המשתמש לדף אחר כשלוחצים עליו"],
      ["Selector", "the part of a CSS rule that chooses which elements to style, like p or .title", "בורר (selector)", "החלק בכלל CSS שבוחר אילו רכיבים לעצב, כמו p או .title"],
      ["CSS property", "a setting that a CSS rule changes, such as color or font-size", "תכונת CSS", "הגדרה שכלל עיצוב משנה, כמו color או font-size"],
    ],
    q: [
      [["In HTML, which attribute of <img> gives the address of the picture?", "src", ["alt", "href", "img"], "src (source) says where the image file is; alt is the text description, and href is used by links."],
        ["ב־HTML, איזה מאפיין של <img> נותן את הכתובת של התמונה?", "src", ["alt", "href", "img"], "src (מקור) אומר איפה נמצא קובץ התמונה; alt הוא תיאור טקסטואלי, ו־href משמש קישורים."]],
      [["In CSS, what does  p { color: red; }  do?", "Makes the text of every paragraph red", ["Makes only the first paragraph red", "Makes the page background red", "Deletes every paragraph"], "The selector p chooses every <p> element, and color sets the colour of their text."],
        ["ב־CSS, מה עושה  p { color: red; } ?", "צובע באדום את הטקסט של כל הפסקאות", ["צובע באדום רק את הפסקה הראשונה", "צובע באדום את הרקע של הדף", "מוחק את כל הפסקאות"], "הבורר p בוחר את כל רכיבי <p>, ו־color קובע את צבע הטקסט שלהם."]],
      [['In CSS, which selector chooses every element with class="title"?', ".title", ["#title", "title", "*title"], "A dot selects by class. # selects by id, and a bare name like title selects elements with that tag name."],
        ['ב־CSS, איזה בורר בוחר כל רכיב עם class="title"?', ".title", ["#title", "title", "*title"], "נקודה בוחרת לפי class. # בוחר לפי id, ושם בלי סימן, כמו title, בוחר רכיבים לפי שם התגית."]],
      [['In CSS, which selector chooses the element with id="menu"?', "#menu", [".menu", "menu", "@menu"], "# selects by id; an id should be used by only one element on the page."],
        ['ב־CSS, איזה בורר בוחר את הרכיב עם id="menu"?', "#menu", [".menu", "menu", "@menu"], "# בוחר לפי id; כל id אמור להופיע רק ברכיב אחד בדף."]],
    ],
  },
  a: {
    t: [
      ["Box model", "the idea that every element is a rectangle made of content, padding, border and margin", "מודל הקופסה", "הרעיון שכל רכיב הוא מלבן שבנוי מתוכן, ריפוד, מסגרת ושוליים"],
      ["Padding", "space inside an element's border, between the border and the content", "ריפוד (padding)", "מרווח בתוך המסגרת של רכיב, בין המסגרת לבין התוכן"],
      ["Margin", "space outside an element's border, which keeps other elements away", "שוליים (margin)", "מרווח מחוץ למסגרת של רכיב, שמרחיק ממנו רכיבים אחרים"],
      ["Cascade", "the rules that decide which CSS rule wins when several apply: usually the more specific one, or the later one if equally specific", "מפל (cascade)", "הכללים שקובעים איזה כלל CSS גובר כשכמה חלים: בדרך כלל הספציפי יותר, או המאוחר יותר אם הם ספציפיים באותה מידה"],
    ],
    q: [
      [['In CSS, a <p class="note"> gets both  p { color: blue; }  and  .note { color: green; } . What colour is its text?', "Green, because a class selector is more specific than a tag selector", ["Blue, because the p rule comes first", "Blue, because tag selectors always win", "A mix of blue and green"], "When rules clash, the more specific selector wins. A class beats a tag name whatever their order."],
        ['ב־CSS, על <p class="note"> חלים גם  p { color: blue; }  וגם  .note { color: green; } . באיזה צבע הטקסט שלו?', "ירוק, כי בורר class ספציפי יותר מבורר של שם תגית", ["כחול, כי הכלל של p מופיע ראשון", "כחול, כי בורר של שם תגית תמיד גובר", "תערובת של כחול וירוק"], "כשכללים מתנגשים, הבורר הספציפי יותר גובר. class גובר על שם תגית בלי קשר לסדר."]],
      [["In CSS, what is the difference between padding and margin?", "Padding is space inside the border; margin is space outside it", ["Padding is outside the border; margin is inside it", "They are two names for the same space", "Margin works only on text"], "Padding pushes the content away from the border; margin pushes other elements away from the box."],
        ["ב־CSS, מה ההבדל בין padding ל־margin?", "padding הוא מרווח בתוך המסגרת; margin הוא מרווח מחוץ לה", ["padding מחוץ למסגרת; margin בתוכה", "אלה שני שמות לאותו מרווח", "margin עובד רק על טקסט"], "padding מרחיק את התוכן מהמסגרת; margin מרחיק רכיבים אחרים מהקופסה."]],
      [["In HTML, why should an <img> have an alt attribute?", "It gives a text description for screen readers and for when the image fails to load", ["It makes the image load faster", "It sets the size of the image", "It changes the colours of the image"], "Screen readers read the alt text aloud, so people who cannot see the image still know what it shows."],
        ["ב־HTML, למה כדאי שלתגית <img> יהיה מאפיין alt?", "הוא נותן תיאור טקסטואלי לקוראי מסך ולמקרה שהתמונה לא נטענת", ["הוא גורם לתמונה להיטען מהר יותר", "הוא קובע את הגודל של התמונה", "הוא משנה את הצבעים של התמונה"], "קוראי מסך מקריאים את טקסט ה־alt בקול, כך שגם מי שלא רואה את התמונה יודע מה יש בה."]],
    ],
    n: [
      [124, ["In CSS (with the default box-sizing: content-box), a box has  width: 100px; padding: 10px; border: 2px solid black; . How wide is it on the screen, without the margin?", "px", "The width counts only the content, so padding and border are added on both sides: 100 + 2 × 10 + 2 × 2 = 124."], ["ב־CSS (עם ברירת המחדל box-sizing: content-box), לקופסה יש  width: 100px; padding: 10px; border: 2px solid black; . מה הרוחב שלה על המסך, בלי השוליים?", "px", "הרוחב כולל רק את התוכן, ולכן הריפוד והמסגרת מתווספים משני הצדדים: 100 + 2 × 10 + 2 × 2 = 124."]],
    ],
  },
};
export default c;
