import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Primary colours (paint)", "red, yellow and blue: the paint colours you cannot mix from others", "צבעי יסוד (בצבעי מים וגואש)", "אדום, צהוב וכחול: הצבעים שאי אפשר לקבל מערבוב של צבעים אחרים"],
      ["Secondary colour", "a colour made by mixing two primaries, like green, orange or purple", "צבע משני", "צבע שמתקבל מערבוב של שני צבעי יסוד, כמו ירוק, כתום או סגול"],
      ["Palette", "the board on which a painter mixes paint, or a set of colours", "פלטה", "הלוח שעליו צייר מערבב צבעים, או אוסף של צבעים"],
      ["Shade", "a colour made darker by adding black", "גוון כהה", "צבע שהוכהה בהוספת שחור"],
    ],
    q: [
      [["Which two paint colours mix to make green?", "Blue and yellow", ["Red and blue", "Red and yellow", "Black and white"], "Blue + yellow = green; red + blue = purple; red + yellow = orange."],
        ["אילו שני צבעים מתערבבים לירוק?", "כחול וצהוב", ["אדום וכחול", "אדום וצהוב", "שחור ולבן"], "כחול + צהוב = ירוק; אדום + כחול = סגול; אדום + צהוב = כתום."]],
      [["Mixing red and yellow paint makes…", "orange", ["purple", "green", "brown"], "Red and yellow are primaries; together they make the secondary colour orange."],
        ["ערבוב צבע אדום וצבע צהוב יוצר…", "כתום", ["סגול", "ירוק", "חום"], "אדום וצהוב הם צבעי יסוד; יחד הם יוצרים את הצבע המשני כתום."]],
      [["What colour do you get when you add white paint to red paint?", "Pink", ["Dark red", "Purple", "Green"], "Adding white makes a colour lighter, so red with white gives pink. Adding black instead makes a darker shade of the colour."],
        ["איזה צבע מקבלים כשמוסיפים צבע לבן לצבע אדום?", "ורוד", ["אדום כהה", "סגול", "ירוק"], "הוספת לבן מבהירה את הצבע, ולכן אדום עם לבן נותן ורוד. הוספת שחור, לעומת זאת, יוצרת גוון כהה יותר של הצבע."]],
      [["You mix lots of different paint colours together on your palette. Which colour do you usually end up with?", "A muddy brown", ["A bright rainbow colour", "Pure white", "Clear, like water"], "Each paint soaks up some of the light, so a mix of many paints soaks up most of it and leaves a dull, muddy brown. That is why painters mix only the colours they need."],
        ["מערבבים על הפלטה הרבה צבעים שונים יחד. איזה צבע מקבלים בדרך כלל?", "חום עכור", ["צבע קשת זוהר", "לבן נקי", "שקוף, כמו מים"], "כל צבע בולע חלק מהאור, ולכן תערובת של צבעים רבים בולעת את רובו ומשאירה חום עמום ועכור. בגלל זה ציירים מערבבים רק את הצבעים שהם צריכים."]],
    ],
    s: [[["The colours of a rainbow, from the outer edge of the bow to the inner edge", "Red", "Orange", "Yellow", "Green", "Blue", "Violet"],
      ["צבעי הקשת בענן, מהשפה החיצונית של הקשת אל השפה הפנימית", "אדום", "כתום", "צהוב", "ירוק", "כחול", "סגול"]]],
  },
  i: {
    t: [
      ["Colour wheel", "a circle that arranges colours to show how they relate", "מעגל הצבעים", "עיגול שמסדר את הצבעים כדי להראות את הקשרים ביניהם"],
      ["Complementary colours", "colours opposite each other on the wheel, like blue and orange", "צבעים משלימים", "צבעים שנמצאים זה מול זה על המעגל, כמו כחול וכתום"],
      ["Warm colours", "reds, oranges and yellows, which feel lively and close", "צבעים חמים", "אדומים, כתומים וצהובים, שמרגישים חיים וקרובים"],
      ["Cool colours", "blues, greens and purples, which feel calm and distant", "צבעים קרים", "כחולים, ירוקים וסגולים, שמרגישים רגועים ורחוקים"],
    ],
    q: [
      [["What is the complementary colour of red on the painter's wheel?", "Green", ["Orange", "Blue", "Pink"], "Red sits opposite green on the traditional colour wheel."],
        ["מהו הצבע המשלים של אדום במעגל הצבעים של הציירים?", "ירוק", ["כתום", "כחול", "ורוד"], "על מעגל הצבעים המסורתי האדום נמצא מול הירוק."]],
      [["A painter wants a calm, peaceful sea picture. Which colours suit best?", "Cool colours like blues and greens", ["Bright reds and oranges", "Only black", "Neon yellow"], "Cool colours tend to feel calm and recede into the distance."],
        ["צייר רוצה ציור ים רגוע ושליו. אילו צבעים מתאימים ביותר?", "צבעים קרים כמו כחולים וירוקים", ["אדומים וכתומים עזים", "רק שחור", "צהוב זוהר"], "צבעים קרים נוטים להרגיש רגועים ונראים רחוקים."]],
      [["On the painter's colour wheel, which colour is opposite yellow?", "Purple", ["Orange", "Green", "Red"], "A primary colour's complement is the secondary colour made from the other two primaries: for yellow that is red + blue, which makes purple."],
        ["במעגל הצבעים של הציירים, איזה צבע נמצא מול הצהוב?", "סגול", ["כתום", "ירוק", "אדום"], "הצבע המשלים של צבע יסוד הוא הצבע המשני שמתקבל משני צבעי היסוד האחרים: לצהוב זה אדום + כחול, כלומר סגול."]],
      [["In landscape paintings, why are faraway mountains often painted in pale blues?", "The air makes distant things look paler and bluer", ["Most mountains are made of a special bluish kind of rock", "Blue paint was cheaper than green paint", "Painters were not allowed to use green"], "Light that crosses a lot of air is scattered, so faraway hills really do look paler and more bluish. Painters copy this effect, called aerial perspective, to show distance."],
        ["בציורי נוף, למה מציירים לעיתים קרובות הרים רחוקים בכחול חיוור?", "האוויר גורם לדברים רחוקים להיראות חיוורים וכחלחלים יותר", ["רוב ההרים עשויים מסוג מיוחד של סלע כחלחל שאין במקומות אחרים", "צבע כחול היה זול יותר מצבע ירוק", "לציירים היה אסור להשתמש בירוק"], "אור שעובר דרך שכבה עבה של אוויר מתפזר, ולכן גבעות והרים רחוקים באמת נראים חיוורים וכחלחלים יותר. ציירים מחקים את התופעה הזאת, שנקראת פרספקטיבה אווירית, כדי להראות מרחק."]],
    ],
    n: [[12, ["A colour wheel has 3 primary and 3 secondary colours. Mixing a primary with a secondary next to it gives a tertiary colour, such as red-orange. How many colours are on the full wheel?", "colours", "There is one tertiary colour in each of the 6 gaps between a primary and a secondary, so 3 + 3 + 6 = 12 colours."],
      ["במעגל צבעים יש 3 צבעי יסוד ו־3 צבעים משניים. ערבוב של צבע יסוד עם צבע משני שלידו נותן צבע שלישוני, כמו אדום־כתום. כמה צבעים יש במעגל המלא?", "צבעים", "בכל אחד מ־6 המרווחים שבין צבע יסוד לצבע משני יש צבע שלישוני אחד, ולכן 3 + 3 + 6 = 12 צבעים."]]],
  },
  a: {
    t: [
      ["RGB", "the primary colours of light — red, green and blue — used by screens", "RGB", "צבעי היסוד של האור — אדום, ירוק וכחול — שבהם משתמשים מסכים"],
      ["Additive mixing", "mixing coloured light, where adding more light makes it brighter, up to white", "ערבוב חיבורי", "ערבוב של אורות צבעוניים, שבו הוספת אור מבהירה עד ללבן"],
      ["Subtractive mixing", "mixing paints or inks, where each one absorbs light, so mixtures get darker", "ערבוב חיסורי", "ערבוב של צבעים או דיו, שבו כל אחד בולע אור, ולכן התערובות כהות יותר"],
      ["CMYK", "cyan, magenta, yellow and black: the ink colours used in printing", "CMYK", "ציאן, מג׳נטה, צהוב ושחור: צבעי הדיו שבהם משתמשים בהדפסה"],
    ],
    q: [
      [["On a screen, red light and green light together look…", "yellow", ["brown", "purple", "black"], "Light mixes additively: red + green light = yellow; all three primaries = white."],
        ["על מסך, אור אדום ואור ירוק יחד נראים…", "צהוב", ["חום", "סגול", "שחור"], "אור מתערבב בערבוב חיבורי: אדום + ירוק = צהוב; כל שלושת צבעי היסוד = לבן."]],
      [["Why do printers use black ink as well as cyan, magenta and yellow?", "Mixing the three gives a muddy dark colour, and black ink is sharper and cheaper", ["Black cannot be printed otherwise at all", "Black ink makes colours brighter", "It is required by law"], "Real inks mixed together do not make a clean black, and text needs crisp black."],
        ["למה מדפסות משתמשות גם בדיו שחור ולא רק בציאן, מג׳נטה וצהוב?", "ערבוב השלושה נותן צבע כהה ועכור, ודיו שחור חד וזול יותר", ["בלי זה אי אפשר להדפיס בכלל", "דיו שחור מבהיר צבעים", "החוק מחייב זאת"], "דיו אמיתי מעורבב לא יוצר שחור נקי, וטקסט צריך שחור חד."]],
      [["Why does a ripe red apple look red in white sunlight?", "It reflects mostly red light and absorbs the rest", ["It absorbs red light and reflects all the other colours", "It gives off its own red light, like a small lamp", "The air around the apple is coloured red"], "White light contains all the colours. The apple's skin absorbs most of them and reflects mainly red light into our eyes. In blue light alone the apple would look very dark."],
        ["למה תפוח אדום ובשל נראה אדום באור שמש לבן?", "הוא מחזיר בעיקר אור אדום ובולע את השאר", ["הוא בולע אור אדום ומחזיר את כל שאר הצבעים", "הוא מפיק אור אדום משלו, כמו מנורה קטנה", "האוויר סביב התפוח צבוע באדום"], "אור לבן מכיל את כל הצבעים. קליפת התפוח בולעת את רובם ומחזירה אל העיניים שלנו בעיקר אור אדום. באור כחול בלבד התפוח היה נראה כהה מאוד."]],
      [["A printer prints cyan ink and yellow ink on top of each other on white paper. Which colour does the mix look?", "Green", ["Blue", "Orange", "White"], "Cyan ink absorbs red light and yellow ink absorbs blue light, so the only light that both let the white paper reflect is green."],
        ["מדפסת מדפיסה דיו ציאן ודיו צהוב זה על זה על נייר לבן. באיזה צבע נראית התערובת?", "ירוק", ["כחול", "כתום", "לבן"], "דיו ציאן בולע אור אדום ודיו צהוב בולע אור כחול, ולכן האור היחיד ששניהם מניחים לנייר הלבן להחזיר הוא ירוק."]],
    ],
    n: [[256, ["On a screen, red, green and blue are each set to a whole number from 0 to 255 (both included). How many different settings can one of these colour channels have?", "settings", "From 0 to 255 there are 255 + 1 = 256 settings. With three channels that makes 256 × 256 × 256, about 16.7 million colours."],
      ["על מסך, כל אחד מהצבעים אדום, ירוק וכחול מקבל מספר שלם מ־0 עד 255 (כולל שניהם). כמה ערכים שונים יכול לקבל ערוץ צבע אחד כזה?", "ערכים", "מ־0 עד 255 יש 255 + 1 = 256 ערכים. עם שלושה ערוצים זה 256 × 256 × 256, כ־16.7 מיליון צבעים."]]],
  },
};
export default c;
