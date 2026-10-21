import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["HTML", "the language that describes the structure and content of a web page", "HTML", "השפה שמתארת את המבנה ואת התוכן של דף אינטרנט"],
      ["Tag", "a marker in angle brackets, like <p>, that tells the browser what a piece of content is", "תגית", "סימון בתוך סוגריים משולשים, כמו p או h1, שאומר לדפדפן מה הוא קטע תוכן"],
      ["Browser", "the program that reads HTML and CSS and draws the web page on the screen", "דפדפן", "התוכנה שקוראת HTML ו־CSS ומציירת את דף האינטרנט על המסך"],
      ["CSS", "the language that describes how a web page looks: colours, fonts, sizes and layout", "CSS", "השפה שמתארת איך דף אינטרנט נראה: צבעים, גופנים, גדלים ופריסה"],
    ],
    q: [
      [["In HTML, which tag makes the biggest heading?", "<h1>", ["<h6>", "<head>", "<p>"], "Headings go from <h1> (the biggest and most important) down to <h6>. <head> is a different part of the page."],
        ["ב־HTML, איזו תגית יוצרת את הכותרת הגדולה ביותר?", "h1", ["h6", "head", "p"], "הכותרות הולכות מ־h1 (הגדולה והחשובה ביותר) ועד h6. head הוא חלק אחר של הדף."]],
      [["In HTML, what does the tag <p> mark?", "A paragraph of text", ["A title for the browser tab", "A picture on the page", "A password box"], "<p> stands for paragraph. Pictures use <img>."],
        ["ב־HTML, מה מסמנת התגית p?", "פסקת טקסט", ["כותרת ללשונית הדפדפן", "תמונה בדף", "תיבת סיסמה"], "p הוא קיצור של paragraph, כלומר פסקה. לתמונות משתמשים בתגית img."]],
      [["In HTML, how can you tell a closing tag from an opening tag?", "A closing tag has a forward slash before its name, as in </p>", ["A closing tag is written in capital letters, as in <P>", "A closing tag has an exclamation mark before its name, as in <!p>", "A closing tag has a backslash after its name, as in <p\\>"], "A closing tag repeats the name after a forward slash: <p> opens a paragraph and </p> closes it."],
        ["ב־HTML, איך מבדילים תגית סוגרת מתגית פותחת?", "בתגית סוגרת יש לוכסן (/) לפני שם התגית", ["תגית סוגרת נכתבת באותיות גדולות, כמו P", "בתגית סוגרת יש סימן קריאה לפני שם התגית", "בתגית סוגרת יש לוכסן הפוך אחרי שם התגית"], "תגית סוגרת חוזרת על שם התגית הפותחת עם לוכסן לפניו: פסקה נפתחת בתגית p ונסגרת בתגית /p."]],
      [["Which CSS property changes the colour of text?", "color", ["font-color", "background-color", "fill"], "color sets the colour of text, background-color colours the area behind it, and fill is for shapes in SVG pictures. There is no CSS property called font-color."],
        ["איזו תכונת CSS משנה את צבע הטקסט?", "color", ["font-color", "background-color", "fill"], "color קובעת את צבע הטקסט, background-color צובעת את האזור שמאחוריו, ו־fill מיועדת לצורות בתמונות SVG. אין ב־CSS תכונה בשם font-color."]],
      [["Which tag marks one item of a list in HTML?", "<li>", ["<ul>", "<item>", "<list>"], "The tag li marks one list item. It sits inside <ul> (a bulleted list) or <ol> (a numbered list), and there are no tags called item or list."],
        ["איזו תגית מסמנת ב־HTML פריט אחד של רשימה?", "li", ["ul", "item", "list"], "התגית li מסמנת פריט אחד ברשימה. היא נמצאת בתוך ul (רשימה עם נקודות) או ol (רשימה ממוספרת), ואין תגיות בשם item או list."]],
    ],
  },
  i: {
    t: [
      ["Attribute", "extra information written inside an opening tag, like href in a link", "מאפיין (attribute)", "מידע נוסף שנכתב בתוך תגית פותחת, כמו href בקישור"],
      ["Link", "an <a> element that takes the user to another page when it is clicked", "קישור", "רכיב שנכתב בתגית a ומעביר את המשתמש לדף אחר כשלוחצים עליו"],
      ["Selector", "the part of a CSS rule that chooses which elements to style, like p or .title", "בורר (selector)", "החלק בכלל CSS שבוחר אילו רכיבים לעצב, כמו p או .title"],
      ["CSS property", "a setting that a CSS rule changes, such as color or font-size", "תכונת CSS", "הגדרה שכלל עיצוב משנה, כמו color או font-size"],
    ],
    q: [
      [["In HTML, which attribute of <img> gives the address of the picture?", "src", ["alt", "href", "img"], "src (source) says where the image file is; alt is the text description, and href is used by links."],
        ["ב־HTML, איזה מאפיין של התגית img נותן את הכתובת של התמונה?", "src", ["alt", "href", "img"], "src (מקור) אומר איפה נמצא קובץ התמונה; alt הוא תיאור טקסטואלי, ו־href משמש קישורים."]],
      [["In CSS, what does  p { color: red; }  do?", "Makes the text of every paragraph red", ["Makes only the first paragraph on the page red", "Makes the background of the whole page red", "Deletes every paragraph from the page"], "The selector p chooses every <p> element, and color sets the colour of their text."],
        ["ב־CSS, מה עושה  p{color:red} ?", "צובע באדום את הטקסט של כל הפסקאות", ["צובע באדום רק את הפסקה הראשונה שבדף", "צובע באדום את הרקע של כל הדף", "מוחק את כל הפסקאות מהדף"], "הבורר p בוחר את כל הפסקאות בדף, ו־color קובע את צבע הטקסט שלהן."]],
      [['In CSS, which selector chooses every element with class="title"?', ".title", ["#title", "title", "*title"], "A dot selects by class. # selects by id, and a bare name like title selects elements with that tag name."],
        ['ב־CSS, איזה בורר בוחר כל רכיב עם class="title"?', ".title", ["#title", "title", "*title"], "נקודה בוחרת לפי class. # בוחר לפי id, ושם בלי סימן, כמו title, בוחר רכיבים לפי שם התגית."]],
      [['In CSS, which selector chooses the element with id="menu"?', "#menu", [".menu", "menu", "@menu"], "# selects by id; an id should be used by only one element on the page."],
        ['ב־CSS, איזה בורר בוחר את הרכיב עם id="menu"?', "#menu", [".menu", "menu", "@menu"], "# בוחר לפי id; כל id אמור להופיע רק ברכיב אחד בדף."]],
      [['A web page contains  <a href="shop.html">Buy now</a> . Which text does the visitor see and click?', "Buy now", ["shop.html", "href", '<a href="shop.html">'], "The text between the opening and the closing tag is what the visitor sees. The address shop.html sits in the href attribute and is not shown on the page."],
        ['בדף יש קישור שהמאפיין href שלו הוא shop.html והטקסט שבין התגיות הוא  Buy now . איזה טקסט המבקר רואה ולוחץ עליו?', "Buy now", ["shop.html", "href", "link"], "הטקסט שבין התגית הפותחת לתגית הסוגרת הוא מה שהמבקר רואה. הכתובת shop.html נמצאת במאפיין href ואינה מוצגת בדף."]],
      [["In CSS, what does  h1, h2 { color: blue; }  do?", "Makes both the h1 and the h2 headings on the page blue", ["Makes only the h2 headings that are inside an h1 blue", "Makes only the h1 headings blue, because it comes first", "Mixes two shades of blue, one for h1 and one for h2"], "A comma between selectors lists several of them, and the rule applies to all of them. Without the comma, h1 h2 would mean an h2 inside an h1."],
        ["ב־CSS, מה עושה  h1,h2{color:blue} ?", "צובע בכחול גם את כותרות h1 וגם את כותרות h2", ["צובע בכחול רק את כותרות h2 שנמצאות בתוך h1", "צובע בכחול רק את כותרות h1, כי הוא מופיע ראשון", "מערבב שני גוונים של כחול, אחד ל־h1 ואחד ל־h2"], "פסיק בין בוררים מונה כמה מהם, והכלל חל על כולם. בלי הפסיק, h1 h2 היה אומר h2 שנמצא בתוך h1."]],
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
      [['In CSS, a <p class="note"> gets both  p { color: blue; }  and  .note { color: green; } . What colour is its text?', "Green, because a class selector is more specific than a tag selector", ["Blue, because the p rule is written first and the first rule wins", "Blue, because tag selectors always win over class selectors, whatever the order", "A mix of blue and green"], "When rules clash, the more specific selector wins. A class beats a tag name whatever their order."],
        ['ב־CSS, על פסקה (p) שה־class שלה הוא note חלים גם  p{color:blue}  וגם  .note{color:green} . באיזה צבע הטקסט שלה?', "ירוק, כי בורר class ספציפי יותר מבורר של שם תגית", ["כחול, כי הכלל של p כתוב ראשון והראשון גובר", "כחול, כי בורר של שם תגית תמיד גובר על בורר class, בלי קשר לסדר", "תערובת של כחול וירוק"], "כשכללים מתנגשים, הבורר הספציפי יותר גובר. class גובר על שם תגית בלי קשר לסדר."]],
      [["In CSS, what is the difference between padding and margin?", "Padding is space inside the border; margin is space outside it", ["Padding is outside the border; margin is inside it", "They are two names for the same space around an element, and either can be used", "Margin works only on text"], "Padding pushes the content away from the border; margin pushes other elements away from the box."],
        ["ב־CSS, מה ההבדל בין padding ל־margin?", "padding הוא מרווח בתוך המסגרת; margin הוא מרווח מחוץ לה", ["padding מחוץ למסגרת; margin בתוכה", "אלה שני שמות לאותו מרווח סביב רכיב, ואפשר להשתמש בכל אחד מהם", "margin עובד רק על טקסט"], "padding מרחיק את התוכן מהמסגרת; margin מרחיק רכיבים אחרים מהקופסה."]],
      [["In HTML, why should an <img> have an alt attribute?", "It gives a text description for screen readers and for when the image fails to load", ["It makes the image load faster, because the browser can skip downloading the picture file", "It sets the size of the image, in the same way as width and height", "It changes the colours of the image so that it is easier to see for everyone"], "Screen readers read the alt text aloud, so people who cannot see the image still know what it shows."],
        ["ב־HTML, למה כדאי שלתגית img יהיה מאפיין alt?", "הוא נותן תיאור טקסטואלי לקוראי מסך ולמקרה שהתמונה לא נטענת", ["הוא גורם לתמונה להיטען מהר יותר, כי הדפדפן יכול לדלג על הורדת קובץ התמונה", "הוא קובע את הגודל של התמונה, באותו אופן כמו width ו־height", "הוא משנה את הצבעים של התמונה כך שיהיה קל יותר לראות אותה לכולם"], "קוראי מסך מקריאים את טקסט ה־alt בקול, כך שגם מי שלא רואה את התמונה יודע מה יש בה."]],
      [['In CSS, an element  <p id="intro" class="note">  gets both  .note { color: green; }  and  #intro { color: blue; } . What colour is its text?', "Blue, because an id selector is more specific than a class selector", ["Green, because the rule that is written first wins when two rules clash", "Green, because a class selector is more specific than an id selector", "A mix of blue and green"], "An id selector is more specific than a class selector, and the more specific rule wins whatever the order. So #intro beats .note and the text is blue."],
        ['ב־CSS, על פסקה (p) שה־id שלה הוא intro וה־class שלה הוא note חלים גם  .note{color:green}  וגם  #intro{color:blue} . באיזה צבע הטקסט שלה?', "כחול, כי בורר id ספציפי יותר מבורר class", ["ירוק, כי הכלל שכתוב ראשון גובר כשכללים מתנגשים", "ירוק, כי בורר class ספציפי יותר מבורר id", "תערובת של כחול וירוק"], "בורר id ספציפי יותר מבורר class, והכלל הספציפי יותר גובר בלי קשר לסדר. לכן #intro גובר על .note והטקסט כחול."]],
    ],
    n: [
      [124, ["In CSS (with the default box-sizing: content-box), a box has  width: 100px; padding: 10px; border: 2px solid black; . How wide is it on the screen, without the margin?", "px", "The width counts only the content, so padding and border are added on both sides: 100 + 2 × 10 + 2 × 2 = 124."], ["ב־CSS (עם ברירת המחדל content-box), לקופסה יש  width:100px;padding:10px;border:2px solid black . מה הרוחב שלה על המסך, בלי השוליים?", "px", "הרוחב כולל רק את התוכן, ולכן הריפוד והמסגרת מתווספים משני הצדדים: 100 + 2 × 10 + 2 × 2 = 124."]],
      [76, ["In CSS, a box has  box-sizing: border-box; width: 100px; padding: 10px; border: 2px solid black; . How wide is its content area, the space left for the text inside?", "px", "With border-box the width of 100px already includes the padding and the border, so the content gets what is left: 100 − 2 × 10 − 2 × 2 = 76."],
        ["ב־CSS, לקופסה יש  box-sizing:border-box;width:100px;padding:10px;border:2px solid black . מה הרוחב של אזור התוכן שלה, המקום שנשאר לטקסט בפנים?", "px", "עם border-box הרוחב של 100px כבר כולל את הריפוד ואת המסגרת, ולכן התוכן מקבל את מה שנשאר: 100 − 2 × 10 − 2 × 2 = 76."]],
    ],
    s: [
      [["The layers of the box model, from the inside out", "Content", "Padding", "Border", "Margin"],
        ["שכבות מודל הקופסה, מבפנים החוצה", "תוכן", "ריפוד", "מסגרת", "שוליים"]],
    ],
  },
};
export default c;
