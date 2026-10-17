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
    ],
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
    ],
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
    ],
  },
};
export default c;
