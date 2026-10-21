import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["City", "a large town where many people live and work", "עיר", "יישוב גדול שבו אנשים רבים גרים ועובדים"],
      ["Village", "a small settlement in the countryside", "כפר", "יישוב קטן באזור כפרי"],
      ["Population", "the number of people living in a place", "אוכלוסייה", "מספר האנשים שגרים במקום"],
      ["Capital city", "the city where a country's government is based", "עיר בירה", "העיר שבה יושבת הממשלה של המדינה"],
    ],
    q: [
      [["Which country has the largest population in the world (since about 2023)?", "India", ["China", "the USA", "Russia"], "India passed China around 2023; each has more than 1.4 billion people."],
        ["לאיזו מדינה יש האוכלוסייה הגדולה בעולם (מאז 2023 בערך)?", "הודו", ["סין", "ארצות הברית", "רוסיה"], "הודו עקפה את סין בסביבות 2023; בכל אחת יותר מ־1.4 מיליארד בני אדם."]],
      [["About how many people live on Earth today?", "About 8 billion", ["About 8 million", "About 800 million", "About 80 billion"], "The world population passed 8 billion in November 2022."],
        ["בערך כמה בני אדם חיים היום על כדור הארץ?", "כ־8 מיליארד", ["כ־8 מיליון", "כ־800 מיליון", "כ־80 מיליארד"], "אוכלוסיית העולם עברה את 8 המיליארד בנובמבר 2022."]],
      [["On which continent do the most people live?", "Asia", ["Africa", "Europe", "South America"], "About six in every ten people on Earth live in Asia, including the two biggest countries, India and China. Africa comes second."],
        ["באיזו יבשת גרים הכי הרבה בני אדם?", "אסיה", ["אפריקה", "אירופה", "דרום אמריקה"], "בערך שישה מכל עשרה בני אדם בכדור הארץ גרים באסיה, ובה גם שתי המדינות הגדולות ביותר, הודו וסין. אפריקה נמצאת במקום השני."]],
    ],
    n: [[30000, ["A village has 300 people. A city has 100 times as many people. How many people live in the city?", "people", "300 × 100 = 30,000, so 30,000 people live in the city: a hundred villages' worth."],
      ["בכפר גרים 300 איש. בעיר גרים פי 100 אנשים. כמה אנשים גרים בעיר?", "איש", "300 × 100 = 30,000, ולכן בעיר גרים 30,000 איש: כמו מאה כפרים כאלה."]]],
  },
  i: {
    t: [
      ["Population density", "the number of people per square kilometre", "צפיפות אוכלוסין", "מספר האנשים לכל קמ״ר"],
      ["Urbanisation", "the growing share of people living in towns and cities", "עיור", "החלק ההולך וגדל של אנשים שגרים בעיירות ובערים"],
      ["Birth rate", "the number of births per 1,000 people in a year", "שיעור ילודה", "מספר הלידות לכל 1,000 איש בשנה"],
      ["Migration", "people moving from one place to live in another", "הגירה", "מעבר של אנשים ממקום אחד כדי לגור במקום אחר"],
    ],
    q: [
      [["A country has 10 million people on 20,000 km². What is its population density?", "500 people per km²", ["200 people per km²", "2,000 people per km²", "50 people per km²"], "Density is people divided by area: 10,000,000 ÷ 20,000 = 500 people per km²."],
        ["במדינה גרים 10 מיליון איש על שטח של 20,000 קמ״ר. מהי צפיפות האוכלוסין?", "500 איש לקמ״ר", ["200 איש לקמ״ר", "2,000 איש לקמ״ר", "50 איש לקמ״ר"], "צפיפות היא מספר האנשים חלקי השטח: 10,000,000 ÷ 20,000 = 500 איש לקמ״ר."]],
      [["In about which year did more than half of the world's people first live in towns and cities?", "About 2007", ["About 1980", "About 1950", "About 1900"], "Around 2007 the share of people living in towns and cities passed 50%, and it keeps rising: today it is about 57%."],
        ["בערך באיזו שנה גרו לראשונה יותר ממחצית בני האדם בעולם בעיירות ובערים?", "בסביבות 2007", ["בסביבות 1980", "בסביבות 1950", "בסביבות 1900"], "בסביבות 2007 עבר חלקם של האנשים שגרים בעיירות ובערים את ה־50%, והוא ממשיך לעלות: היום הוא כ־57%."]],
      [["Which of these countries has one of the lowest population densities in the world?", "Mongolia", ["Bangladesh", "South Korea", "the Netherlands"], "Mongolia is huge, with wide grasslands and deserts, but only about 3.5 million people live there: about 2 people per km². Bangladesh, South Korea and the Netherlands are among the most crowded countries."],
        ["לאיזו מהמדינות האלה יש אחת מצפיפויות האוכלוסין הנמוכות בעולם?", "מונגוליה", ["בנגלדש", "דרום קוריאה", "הולנד"], "מונגוליה ענקית, עם ערבות ומדבריות רחבים, אבל גרים בה רק כ־3.5 מיליון איש: כ־2 איש לקמ״ר. בנגלדש, דרום קוריאה והולנד הן מהמדינות הצפופות בעולם."]],
    ],
    n: [[12, ["A town of 50,000 people has 600 births in a year. What is its birth rate, in births per 1,000 people?", "per 1,000", "50,000 people are 50 groups of 1,000, and 600 ÷ 50 = 12, so the birth rate is 12 per 1,000."],
      ["בעיר שבה 50,000 תושבים נולדו 600 תינוקות בשנה. מהו שיעור הילודה, בלידות לכל 1,000 איש?", "לכל 1,000", "50,000 איש הם 50 קבוצות של 1,000, ו־600 ÷ 50 = 12, ולכן שיעור הילודה הוא 12 לכל 1,000."]]],
  },
  a: {
    t: [
      ["Push factors", "reasons that make people want to leave the place where they live", "גורמי דחייה", "סיבות שגורמות לאנשים לרצות לעזוב את המקום שבו הם גרים"],
      ["Pull factors", "reasons that draw people to move to a new place", "גורמי משיכה", "סיבות שמושכות אנשים לעבור למקום חדש"],
      ["Natural increase", "births minus deaths in a population", "ריבוי טבעי", "מספר הלידות פחות מספר הפטירות באוכלוסייה"],
      ["Megacity", "a city with more than 10 million inhabitants", "מגה־עיר", "עיר עם יותר מ־10 מיליון תושבים"],
    ],
    q: [
      [["A town has 2,000 births and 800 deaths in a year, and no migration. What is the natural increase?", "1,200", ["2,800", "800", "2,000"], "Natural increase = births − deaths = 2,000 − 800 = 1,200."],
        ["בעיר נולדו 2,000 תינוקות ונפטרו 800 איש בשנה, בלי הגירה. מהו הריבוי הטבעי?", "1,200", ["2,800", "800", "2,000"], "ריבוי טבעי = לידות − פטירות = 2,000 − 800 = 1,200."]],
      [["Which is a pull factor for moving to a big city?", "More job opportunities", ["Drought in the village", "War at home", "Lack of schools at home"], "Pull factors attract people to the destination; the others push people away from home."],
        ["מה מהבאים הוא גורם משיכה למעבר לעיר גדולה?", "יותר הזדמנויות תעסוקה", ["בצורת בכפר", "מלחמה בבית", "מחסור בבתי ספר ליד הבית"], "גורמי משיכה מושכים אנשים למקום החדש; האחרים דוחפים אנשים לעזוב את ביתם."]],
      [["In many rich countries, such as Japan and Italy, the population is getting older. Why?", "Fewer babies are born, and people live longer", ["Many more babies are born there than in poorer countries", "The census there counts only adults, not children", "People there age faster because of the cold weather"], "When families have fewer children and good medicine helps people live longer, the share of older people grows. In Japan almost three in every ten people are 65 or older."],
        ["במדינות עשירות רבות, כמו יפן ואיטליה, האוכלוסייה מזדקנת. למה?", "נולדים פחות תינוקות, ואנשים חיים יותר שנים", ["נולדים שם הרבה יותר תינוקות מאשר במדינות עניות", "המפקד שם סופר רק מבוגרים ולא ילדים", "אנשים שם מזדקנים מהר יותר בגלל מזג האוויר הקר"], "כשבמשפחות יש פחות ילדים ורפואה טובה עוזרת לאנשים לחיות יותר שנים, החלק של המבוגרים באוכלוסייה גדל. ביפן כמעט שלושה מכל עשרה אנשים הם בני 65 ומעלה."]],
    ],
    n: [[25, ["A city grows from 2 million to 2.5 million people. By what percentage did its population grow?", "%", "It grew by 0.5 million, and 0.5 ÷ 2 = 0.25, which is 25% of the population it started with."],
      ["עיר גדלה מ־2 מיליון ל־2.5 מיליון תושבים. בכמה אחוזים גדלה האוכלוסייה שלה?", "%", "היא גדלה ב־0.5 מיליון, ו־0.5 ÷ 2 = 0.25, כלומר 25% מהאוכלוסייה שהייתה בה בהתחלה."]]],
  },
};
export default c;
