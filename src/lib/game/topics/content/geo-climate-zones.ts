import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Desert", "a very dry place that gets little rain", "מדבר", "מקום יבש מאוד שיורד בו מעט גשם"],
      ["Rainforest", "a thick forest in a hot, very rainy place", "יער גשם", "יער סבוך במקום חם וגשום מאוד"],
      ["Polar region", "the icy, very cold area around the North or South Pole", "אזור קוטבי", "האזור הקפוא והקר מאוד סביב הקוטב הצפוני או הדרומי"],
      ["Season", "one of the parts of the year, such as summer or winter", "עונה", "אחד מחלקי השנה, כמו קיץ או חורף"],
    ],
    q: [
      [["Where are the hottest climates usually found?", "Near the equator", ["Near the poles", "On top of high mountains", "In the middle of oceans only"], "Sunlight hits the equator most directly all year."],
        ["איפה נמצאים בדרך כלל האקלימים החמים ביותר?", "ליד קו המשווה", ["ליד הקטבים", "על פסגות הרים גבוהים", "רק באמצע האוקיינוסים"], "אור השמש פוגע באזור קו המשווה בצורה הישירה ביותר כל השנה."]],
      [["Which animal is adapted to a polar climate?", "The polar bear", ["The camel", "The parrot", "The scorpion"], "Thick fur and fat keep polar bears warm in the Arctic."],
        ["איזה בעל חיים מותאם לאקלים קוטבי?", "דוב הקוטב", ["הגמל", "התוכי", "העקרב"], "פרווה עבה ושומן שומרים על דוב הקוטב חם בארקטי."]],
    ],
  },
  i: {
    t: [
      ["Tropical climate", "hot all year, often with very heavy rain", "אקלים טרופי", "חם כל השנה, ולעיתים קרובות עם גשם כבד מאוד"],
      ["Temperate climate", "mild, with clear seasons, found between the tropics and the polar regions", "אקלים ממוזג", "נוח, עם עונות ברורות, נמצא בין האזורים הטרופיים לאזורים הקוטביים"],
      ["Arid climate", "very dry, with less than about 250 mm of rain a year", "אקלים צחיח", "יבש מאוד, עם פחות מכ־250 מ״מ גשם בשנה"],
      ["Altitude", "height above sea level, which makes places cooler as it rises", "רום", "גובה מעל פני הים, שגורם למקומות להיות קרירים יותר ככל שהוא עולה"],
    ],
    q: [
      [["Why is it summer in Australia while it is winter in Israel?", "The two places are in different hemispheres, tilted towards the sun at opposite times", ["Australia is closer to the sun", "Australia has no winter", "Clocks are different there"], "When the Southern Hemisphere tilts towards the sun, the Northern Hemisphere tilts away."],
        ["למה באוסטרליה קיץ כשבישראל חורף?", "הן נמצאות בחצאי כדור שונים, שנוטים לכיוון השמש בזמנים הפוכים", ["אוסטרליה קרובה יותר לשמש", "באוסטרליה אין חורף", "השעונים שם אחרים"], "כשחצי הכדור הדרומי נוטה לכיוון השמש, החצי הצפוני נוטה ממנה."]],
      [["Kilimanjaro is near the equator but has snow on top. Why?", "It is very high, and air gets colder with altitude", ["It is in the Arctic", "Snow is imported", "The equator is cold"], "At almost 5,900 m the air is cold enough for ice even in the tropics."],
        ["הקילימנג׳רו קרוב לקו המשווה אבל בפסגתו יש שלג. למה?", "הוא גבוה מאוד, והאוויר מתקרר ככל שעולים", ["הוא נמצא בארקטי", "השלג מיובא", "קו המשווה קר"], "בגובה של כמעט 5,900 מ׳ האוויר קר מספיק לקרח גם באזור הטרופי."]],
    ],
  },
  a: {
    t: [
      ["Köppen classification", "the most widely used system for dividing the world's climates, based on temperature and rainfall", "סיווג קפן", "השיטה הנפוצה ביותר לחלוקת האקלימים בעולם, לפי טמפרטורה וכמות משקעים"],
      ["Rain shadow", "a dry area on the side of a mountain range facing away from the wet wind", "צל גשם", "אזור יבש בצד של רכס הרים שפונה הרחק מהרוח הלחה"],
      ["Continentality", "the effect of distance from the sea, giving bigger temperature swings inland", "יבשתיות", "ההשפעה של המרחק מהים, שגורמת לתנודות טמפרטורה גדולות יותר בפנים היבשה"],
      ["Ocean current", "a steady flow of sea water that carries heat, like the Gulf Stream", "זרם ימי", "זרימה קבועה של מי ים שנושאת חום, כמו זרם הגולף"],
    ],
    q: [
      [["Why is the Judean Desert dry, just east of the rainy Judean hills?", "It lies in the rain shadow: air loses its moisture over the hills and sinks warm and dry", ["It is below sea level, so rain cannot reach it", "Sand absorbs all clouds", "It is closer to the equator"], "Moist winds from the Mediterranean drop their rain on the western slopes; descending air on the east side warms and dries."],
        ["למה מדבר יהודה יבש, ממש ממזרח להרי יהודה הגשומים?", "הוא נמצא בצל גשם: האוויר מאבד את לחותו מעל ההרים ויורד חם ויבש", ["הוא מתחת לפני הים, ולכן הגשם לא מגיע אליו", "החול בולע את העננים", "הוא קרוב יותר לקו המשווה"], "רוחות לחות מהים התיכון מורידות את הגשם במדרונות המערביים; האוויר שיורד בצד המזרחי מתחמם ומתייבש."]],
      [["Why does Britain have milder winters than places at the same latitude in Canada?", "A warm ocean current (the Gulf Stream / North Atlantic Drift) and westerly winds from the sea", ["Britain is closer to the sun", "Britain has more mountains", "Canada has no winds"], "Warm Atlantic water and sea winds keep western Europe milder than the cold inland of North America."],
        ["למה החורפים בבריטניה מתונים יותר מאשר במקומות באותו קו רוחב בקנדה?", "זרם ימי חם (זרם הגולף וזרם צפון האוקיינוס האטלנטי) ורוחות מערביות מהים", ["בריטניה קרובה יותר לשמש", "בבריטניה יש יותר הרים", "בקנדה אין רוחות"], "מים חמים מהאטלנטי ורוחות ים שומרים על מערב אירופה מתון יותר מפנים היבשת הקר של צפון אמריקה."]],
    ],
  },
};
export default c;
