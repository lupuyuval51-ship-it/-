import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Pixel", "one tiny square of a single colour; a digital picture is made of a grid of them", "פיקסל", "ריבוע זעיר בצבע אחד; תמונה דיגיטלית בנויה מרשת של ריבועים כאלה"],
      ["Resolution", "the number of pixels in a picture, which decides how much detail it can show", "רזולוציה", "מספר הפיקסלים בתמונה, שקובע כמה פרטים היא יכולה להציג"],
      ["Frame", "one still picture in a video; showing many of them quickly makes things look as if they move", "פריים", "תמונה נייחת אחת בתוך סרטון; כשמציגים הרבה כאלה במהירות, נדמה שהדברים זזים"],
      ["Digital", "stored as numbers, using only 0s and 1s, so that a computer can work with it", "דיגיטלי", "שמור כמספרים, באמצעות אפסים ואחדים בלבד, כדי שמחשב יוכל לעבוד איתו"],
    ],
    q: [
      [["You zoom far into a digital photo and see tiny coloured squares. What are they?", "Pixels, the dots the picture is built from", ["Frames, the pictures that make up a video", "Dust on the screen", "Mistakes made by the camera"], "A digital picture is a grid of pixels, and each pixel has a single colour. Zoom in far enough and you can see them one by one."],
        ["מגדילים מאוד תמונה דיגיטלית ורואים ריבועים צבעוניים קטנים. מה הם?", "פיקסלים, הנקודות שמהן התמונה בנויה", ["פריימים, התמונות שמרכיבות סרטון", "אבק על המסך", "טעויות של המצלמה"], "תמונה דיגיטלית היא רשת של פיקסלים, וכל פיקסל הוא בצבע אחד. אם מגדילים מספיק, אפשר לראות אותם אחד אחד."]],
      [["Two photos show the same scene. Photo A has 4,000 × 3,000 pixels and photo B has 400 × 300 pixels. Which one can show more detail?", "Photo A, because it has more pixels", ["They show exactly the same detail, because the scene is the same", "Photo B, because fewer pixels make a neater picture", "It depends only on the colours in the photo"], "More pixels means more tiny dots to describe the scene, so finer details can be shown. Photo A has 100 times as many pixels as photo B."],
        ["שתי תמונות מציגות את אותו נוף. בתמונה א׳ יש 4,000 × 3,000 פיקסלים ובתמונה ב׳ יש 400 × 300 פיקסלים. איזו מהן יכולה להציג יותר פרטים?", "תמונה א׳, כי יש בה יותר פיקסלים", ["הן מציגות בדיוק אותם פרטים, כי הנוף זהה", "תמונה ב׳, כי פחות פיקסלים עושים תמונה מסודרת יותר", "זה תלוי רק בצבעים שבתמונה"], "יותר פיקסלים הם יותר נקודות קטנות שמתארות את הנוף, ולכן אפשר להציג פרטים עדינים יותר. בתמונה א׳ יש פי 100 פיקסלים מאשר בתמונה ב׳."]],
      [["Why does a cartoon look as if it moves, although it is made of still pictures?", "Many slightly different pictures are shown very quickly one after another", ["Each picture has tiny motors inside it", "The screen moves the picture from side to side", "The pictures are printed on moving paper"], "Our eyes and brain blend fast-changing still pictures into smooth motion. Videos and cartoons show many frames every second."],
        ["למה סרט מצויר נראה כאילו הוא זז, למרות שהוא בנוי מתמונות נייחות?", "מציגים במהירות רבה הרבה תמונות ששונות זו מזו רק מעט, בזו אחר זו", ["בכל תמונה יש מנועים זעירים", "המסך מזיז את התמונה מצד לצד", "התמונות מודפסות על נייר שזז"], "העיניים והמוח שלנו מחברים תמונות נייחות שמתחלפות מהר לתנועה רציפה. סרטונים וסרטים מצוירים מציגים פריימים רבים בכל שנייה."]],
    ],
  },
  i: {
    t: [
      ["RGB colour", "describing a pixel's colour by how much red, green and blue light it gives off", "צבעי RGB", "תיאור הצבע של פיקסל לפי כמות האור האדום, הירוק והכחול שהוא מפיק"],
      ["Compression", "making a file smaller so it takes up less space and is quicker to send", "דחיסה", "הקטנת קובץ כדי שיתפוס פחות מקום ויישלח מהר יותר"],
      ["File format", "the agreed way data is arranged in a file, often shown by its ending, such as .jpg or .mp3", "פורמט קובץ", "הדרך המוסכמת לסדר את המידע בקובץ, שלרוב מופיעה בסיומת שלו, כמו .jpg או .mp3"],
      ["Sample", "one measurement of a sound wave; a recording takes many thousands of them every second", "דגימה", "מדידה אחת של גל קול; בהקלטה מודדים אלפים רבים כאלה בכל שנייה"],
      ["Frame rate", "how many still pictures a video shows each second", "קצב פריימים", "כמה תמונות נייחות סרטון מציג בכל שנייה"],
    ],
    q: [
      [["On a screen, a pixel shows red, green and blue light all at full brightness. What colour do you see?", "White", ["Black", "Brown", "Dark green"], "Screens mix light, not paint. Full red, green and blue light together look white; when all three are off, the pixel looks black."],
        ["על מסך, פיקסל מפיק אור אדום, ירוק וכחול, כולם בעוצמה מלאה. איזה צבע רואים?", "לבן", ["שחור", "חום", "ירוק כהה"], "מסכים מערבבים אור, לא צבע. אור אדום, ירוק וכחול מלאים יחד נראים לבנים; כששלושתם כבויים, הפיקסל נראה שחור."]],
      [["Which of these files is most likely a photo?", "beach.jpg", ["song.mp3", "film.mp4", "notes.txt"], "The ending .jpg (JPEG) is a common format for photos. .mp3 is usually music, .mp4 video and .txt plain text."],
        ["איזה מהקבצים האלה הוא כנראה תמונה?", "beach.jpg", ["song.mp3", "film.mp4", "notes.txt"], "הסיומת .jpg (JPEG) היא פורמט נפוץ לתמונות. .mp3 הוא לרוב מוזיקה, .mp4 סרטון ו־.txt טקסט פשוט."]],
      [["Why are photos and videos usually compressed before they are sent over the internet?", "Smaller files take less storage and travel faster", ["Compression makes the colours brighter", "Compressed files cannot be copied", "Compression makes the picture bigger on the screen"], "Big files take longer to send and fill up storage. Compression shrinks them so they upload, download and stream faster."],
        ["למה בדרך כלל דוחסים תמונות וסרטונים לפני ששולחים אותם באינטרנט?", "קבצים קטנים יותר תופסים פחות מקום ועוברים מהר יותר", ["הדחיסה הופכת את הצבעים לבהירים יותר", "אי אפשר להעתיק קבצים דחוסים", "הדחיסה מגדילה את התמונה על המסך"], "קבצים גדולים נשלחים לאט יותר וממלאים את האחסון. דחיסה מקטינה אותם, כך שאפשר להעלות, להוריד ולהזרים אותם מהר יותר."]],
    ],
    n: [
      [1024, ["A small icon is 32 pixels wide and 32 pixels tall. How many pixels does it have?", "pixels", "32 × 32 = 1024 pixels."],
        ["סמל קטן ברוחב 32 פיקסלים ובגובה 32 פיקסלים. כמה פיקסלים יש בו?", "פיקסלים", "32 × 32 = 1024 פיקסלים."]],
      [300, ["A video plays at 30 frames per second. How many frames are shown in 10 seconds?", "frames", "30 × 10 = 300 frames."],
        ["סרטון מוצג בקצב של 30 פריימים בשנייה. כמה פריימים מוצגים ב־10 שניות?", "פריימים", "30 × 10 = 300 פריימים."]],
    ],
    s: [[["How a digital camera takes a photo", "Light enters through the lens", "The sensor measures the light at millions of tiny points", "Each point becomes a pixel with numbers for its colour", "The numbers are saved in a file", "A screen reads the file and lights up its own pixels"],
      ["איך מצלמה דיגיטלית מצלמת תמונה", "האור נכנס דרך העדשה", "החיישן מודד את האור במיליוני נקודות זעירות", "כל נקודה הופכת לפיקסל עם מספרים שמתארים את הצבע שלו", "המספרים נשמרים בקובץ", "מסך קורא את הקובץ ומאיר את הפיקסלים שלו"]]],
  },
  a: {
    t: [
      ["Lossy compression", "shrinking a file by throwing away detail that people are unlikely to notice; the original cannot be fully restored", "דחיסה מאבדת מידע", "הקטנת קובץ על ידי השמטת פרטים שאנשים כנראה לא ישימו לב אליהם; אי אפשר לשחזר את המקור במלואו"],
      ["Lossless compression", "shrinking a file in a way that lets the exact original be rebuilt, bit for bit", "דחיסה ללא איבוד מידע", "הקטנת קובץ בדרך שמאפשרת לשחזר את המקור בדיוק, ביט אחר ביט"],
      ["Colour depth", "the number of bits used to store the colour of each pixel", "עומק צבע", "מספר הביטים שמשמשים לשמירת הצבע של כל פיקסל"],
      ["Vector graphics", "pictures stored as shapes, lines and curves described by numbers, so they can be enlarged without blurring", "גרפיקה וקטורית", "תמונות שנשמרות כצורות, קווים ועקומות שמתוארים במספרים, ולכן אפשר להגדיל אותן בלי טשטוש"],
    ],
    q: [
      [["Each pixel stores its red level in 8 bits. How many different shades of red can it show?", "256", ["255", "16", "8"], "8 bits give 2⁸ = 256 different values, numbered 0 to 255. That is why 255, the largest value, is one less than the number of shades."],
        ["כל פיקסל שומר את רמת האדום שלו ב־8 ביטים. כמה גוונים שונים של אדום הוא יכול להציג?", "256", ["255", "16", "8"], "8 ביטים נותנים 2⁸ = 256 ערכים שונים, ממוספרים מ־0 עד 255. לכן 255, הערך הגדול ביותר, קטן באחד ממספר הגוונים."]],
      [["A company logo must look sharp on a pen and on a huge billboard. Which kind of image is best?", "A vector image, because shapes can be redrawn sharply at any size", ["A small photo with few pixels, enlarged to fit", "A screenshot of the logo", "A video of the logo"], "A pixel image enlarged too far becomes blocky or blurry. A vector image stores shapes, so the computer redraws them crisply at any size."],
        ["לוגו של חברה צריך להיראות חד גם על עט וגם על שלט חוצות ענק. איזה סוג תמונה מתאים ביותר?", "תמונה וקטורית, כי אפשר לצייר מחדש את הצורות בחדות בכל גודל", ["תמונה קטנה עם מעט פיקסלים, שמגדילים אותה", "צילום מסך של הלוגו", "סרטון של הלוגו"], "תמונת פיקסלים שמגדילים יותר מדי נראית מרובעת או מטושטשת. תמונה וקטורית שומרת צורות, והמחשב מצייר אותן מחדש בחדות בכל גודל."]],
      [["A JPEG photo is edited and saved again and again. Why does its quality slowly get worse?", "JPEG compression is lossy, so each save throws away a little more detail", ["Files wear out each time they are opened", "Each save turns the photo black and white", "The file grows until the computer cannot show it"], "Lossy formats such as JPEG drop detail to save space. Saving again repeats the process, so small losses add up."],
        ["עורכים תמונת JPEG ושומרים אותה שוב ושוב. למה האיכות שלה יורדת לאט לאט?", "דחיסת JPEG מאבדת מידע, ולכן בכל שמירה נעלמים עוד כמה פרטים", ["קבצים נשחקים בכל פעם שפותחים אותם", "כל שמירה הופכת את התמונה לשחור־לבן", "הקובץ גדל עד שהמחשב לא מצליח להציג אותו"], "פורמטים שמאבדים מידע, כמו JPEG, משמיטים פרטים כדי לחסוך מקום. כל שמירה חוזרת על התהליך, והאובדנים הקטנים מצטברים."]],
      [["Why must a program or a text document be compressed only with lossless compression?", "Changing even one bit could change a word or break the program", ["Lossless files are always much smaller", "Lossy compression only works on paper", "Text cannot be compressed at all"], "We do not notice a few missing details in a photo, but a single changed bit in text or code can change its meaning or stop it working. ZIP files are lossless."],
        ["למה תוכנה או מסמך טקסט מותר לדחוס רק בדחיסה ללא איבוד מידע?", "שינוי של ביט אחד בלבד יכול לשנות מילה או לשבש את התוכנה", ["קבצים בדחיסה ללא איבוד תמיד קטנים בהרבה", "דחיסה מאבדת מידע עובדת רק על נייר", "אי אפשר לדחוס טקסט בכלל"], "בתמונה לא שמים לב לכמה פרטים חסרים, אבל ביט אחד ששונה בטקסט או בקוד יכול לשנות את המשמעות או לגרום לתוכנה להפסיק לעבוד. קובצי ZIP נדחסים ללא איבוד מידע."]],
    ],
    n: [
      [3, ["An uncompressed photo is 1,000 × 1,000 pixels and uses 3 bytes per pixel. How many megabytes (millions of bytes) is that?", "MB", "1,000 × 1,000 = 1,000,000 pixels, and × 3 bytes = 3,000,000 bytes, which is 3 MB."],
        ["תמונה לא דחוסה בגודל 1,000 × 1,000 פיקסלים, ו־3 בתים לכל פיקסל. כמה מגה־בייט (מיליוני בתים) זה?", "MB", "1,000 × 1,000 = 1,000,000 פיקסלים, וכפול 3 בתים = 3,000,000 בתים, כלומר 3 MB."]],
      [88200, ["A CD records 44,100 samples every second on each channel. How many samples does one channel record in 2 seconds?", "samples", "44,100 × 2 = 88,200 samples."],
        ["בתקליטור שמע נשמרות 44,100 דגימות בכל שנייה בכל ערוץ. כמה דגימות נשמרות בערוץ אחד ב־2 שניות?", "דגימות", "44,100 × 2 = 88,200 דגימות."]],
    ],
  },
};
export default c;
