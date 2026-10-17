import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Weather", "what the air is like at a place and time: hot or cold, wet or dry, windy or calm", "מזג אוויר", "מצב האוויר במקום ובזמן מסוימים: חם או קר, גשום או יבש, סוער או רגוע"],
      ["Thermometer", "a tool that measures temperature", "מדחום", "מכשיר שמודד טמפרטורה"],
      ["Wind", "air moving from one place to another", "רוח", "אוויר שנע ממקום למקום"],
      ["Forecast", "a prediction of what the weather will be", "תחזית", "ניבוי של מזג האוויר הצפוי"],
    ],
    q: [
      [["Which tool measures rainfall?", "A rain gauge", ["A thermometer", "A compass", "A ruler on the wall"], "A rain gauge collects rain so you can measure how many millimetres fell."],
        ["איזה מכשיר מודד כמות גשם?", "מד גשם", ["מדחום", "מצפן", "סרגל על הקיר"], "מד גשם אוסף את הגשם, וכך אפשר למדוד כמה מילימטרים ירדו."]],
      [["In Israel, in which season does most rain fall?", "Winter", ["Summer", "Spring only", "It rains equally all year"], "Israel has a Mediterranean climate: rainy winters and dry summers."],
        ["באיזו עונה יורד רוב הגשם בישראל?", "בחורף", ["בקיץ", "רק באביב", "יורד גשם באותה מידה כל השנה"], "בישראל אקלים ים־תיכוני: חורף גשום וקיץ יבש."]],
    ],
  },
  i: {
    t: [
      ["Air pressure", "the weight of the air pressing down; low pressure often brings clouds and rain", "לחץ אוויר", "המשקל של האוויר שלוחץ כלפי מטה; לחץ נמוך מביא לעיתים קרובות עננים וגשם"],
      ["Humidity", "the amount of water vapour in the air", "לחות", "כמות אדי המים שבאוויר"],
      ["Barometer", "a tool that measures air pressure", "ברומטר", "מכשיר שמודד לחץ אוויר"],
      ["Sharav (hamsin)", "a hot, dry, dusty spell of weather in Israel, often in spring and autumn", "שרב (חמסין)", "תקופה של מזג אוויר חם, יבש ומאובק בישראל, בעיקר באביב ובסתיו"],
    ],
    q: [
      [["Why does a sea breeze blow from the sea to the land on a sunny afternoon?", "Land heats faster, warm air rises over it and cooler sea air flows in", ["The sea pushes the wind", "The Moon pulls the air", "Clouds blow the air inland"], "Rising warm air over the land leaves lower pressure, and air moves in from the cooler sea."],
        ["למה בצהרי יום שמשי נושבת בריזה מהים אל היבשה?", "היבשה מתחממת מהר יותר, אוויר חם עולה מעליה ואוויר קריר מהים זורם פנימה", ["הים דוחף את הרוח", "הירח מושך את האוויר", "עננים נושבים פנימה"], "האוויר החם שעולה מעל היבשה משאיר לחץ נמוך יותר, ואוויר נכנס מהים הקריר."]],
      [["Why is it usually colder at the top of a mountain?", "Air gets thinner and cooler with height", ["The mountain is farther from the sun", "Snow makes the air cold", "Wind always blows there"], "Rising air expands and cools: in the lower atmosphere temperature falls about 6.5 °C per kilometre."],
        ["למה בדרך כלל קר יותר בפסגת הר?", "האוויר נעשה דליל וקר יותר ככל שעולים", ["ההר רחוק יותר מהשמש", "השלג מקרר את האוויר", "שם תמיד נושבת רוח"], "אוויר שעולה מתפשט ומתקרר: בשכבה התחתונה של האטמוספרה הטמפרטורה יורדת בכ־6.5 °C לכל קילומטר."]],
    ],
  },
  a: {
    t: [
      ["Front", "the boundary between two air masses of different temperature", "חזית", "הגבול בין שני גושי אוויר בטמפרטורות שונות"],
      ["Cyclone (low)", "an area of low pressure where air spirals inwards and rises, often bringing storms", "שקע ברומטרי", "אזור של לחץ נמוך שבו האוויר מסתחרר פנימה ועולה, ומביא לעיתים קרובות סערות"],
      ["Anticyclone (high)", "an area of high pressure with sinking air, usually bringing clear, settled weather", "רמה ברומטרית", "אזור של לחץ גבוה עם אוויר שוקע, שמביא לרוב מזג אוויר בהיר ויציב"],
      ["Coriolis effect", "the turning of winds caused by the Earth's rotation", "אפקט קוריוליס", "הסטת הרוחות שנגרמת מהסיבוב של כדור הארץ"],
    ],
    q: [
      [["What usually happens as a cold front passes?", "Temperatures drop and showers or storms are likely", ["It becomes hot and dry for weeks", "Air pressure rises sharply forever", "Nothing changes"], "Cold air pushes under warm air, lifting it fast and forming clouds and showers, then cooler air follows."],
        ["מה קורה בדרך כלל כשחזית קרה עוברת?", "הטמפרטורות יורדות וצפויים ממטרים או סופות", ["נהיה חם ויבש במשך שבועות", "הלחץ הברומטרי עולה בחדות לתמיד", "שום דבר לא משתנה"], "אוויר קר נדחק מתחת לאוויר החם, מרים אותו מהר ויוצר עננים וממטרים, ואחריו מגיע אוויר קריר יותר."]],
      [["Why do weather forecasts become less reliable more than about a week ahead?", "The atmosphere is chaotic: tiny errors grow over time", ["Satellites stop working", "Weather is random", "Forecasters only measure today"], "Small uncertainties in today's measurements grow quickly in the computer models."],
        ["למה תחזיות מזג אוויר פחות אמינות יותר משבוע קדימה?", "האטמוספרה כאוטית: טעויות זעירות גדלות עם הזמן", ["הלוויינים מפסיקים לעבוד", "מזג האוויר אקראי", "החזאים מודדים רק את היום"], "אי־ודאויות קטנות במדידות של היום גדלות מהר במודלים הממוחשבים."]],
    ],
  },
};
export default c;
