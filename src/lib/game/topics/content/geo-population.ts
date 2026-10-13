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
    ],
  },
  i: {
    t: [
      ["Population density", "the number of people per square kilometre", "צפיפות אוכלוסין", "מספר האנשים לכל קמ״ר"],
      ["Urbanisation", "the growing share of people living in towns and cities", "עיור", "החלק ההולך וגדל של אנשים שגרים בעיירות ובערים"],
      ["Birth rate", "the number of births per 1,000 people in a year", "שיעור ילודה", "מספר הלידות לכל 1,000 איש בשנה"],
      ["Migration", "people moving from one place to live in another", "הגירה", "מעבר של אנשים ממקום אחד כדי לגור במקום אחר"],
    ],
    q: [
      [["A country has 10 million people on 20,000 km². What is its population density?", "500 people per km²", ["200 people per km²", "2,000 people per km²", "50 people per km²"], "10,000,000 ÷ 20,000 = 500 people per km²."],
        ["במדינה גרים 10 מיליון איש על שטח של 20,000 קמ״ר. מהי צפיפות האוכלוסין?", "500 איש לקמ״ר", ["200 איש לקמ״ר", "2,000 איש לקמ״ר", "50 איש לקמ״ר"], "10,000,000 ÷ 20,000 = 500 איש לקמ״ר."]],
      [["Since about 2007, where does more than half of the world's population live?", "In towns and cities", ["In villages", "On farms only", "At sea"], "Urbanisation passed 50% around 2007 and keeps rising."],
        ["מאז 2007 בערך, איפה גרה יותר ממחצית אוכלוסיית העולם?", "בעיירות ובערים", ["בכפרים", "רק בחוות", "בים"], "שיעור העיור עבר את 50% בסביבות 2007 וממשיך לעלות."]],
    ],
  },
  a: {
    t: [
      ["Push factors", "reasons that make people leave a place, like war or lack of jobs", "גורמי דחייה", "סיבות שגורמות לאנשים לעזוב מקום, כמו מלחמה או מחסור בעבודה"],
      ["Pull factors", "reasons that attract people to a place, like jobs or safety", "גורמי משיכה", "סיבות שמושכות אנשים למקום, כמו עבודה או ביטחון"],
      ["Natural increase", "births minus deaths in a population", "ריבוי טבעי", "מספר הלידות פחות מספר הפטירות באוכלוסייה"],
      ["Megacity", "a city with more than 10 million inhabitants", "מגה־עיר", "עיר עם יותר מ־10 מיליון תושבים"],
    ],
    q: [
      [["A town has 2,000 births and 800 deaths in a year, and no migration. What is the natural increase?", "1,200", ["2,800", "800", "2,000"], "Natural increase = births − deaths = 2,000 − 800 = 1,200."],
        ["בעיר נולדו 2,000 תינוקות ונפטרו 800 איש בשנה, בלי הגירה. מהו הריבוי הטבעי?", "1,200", ["2,800", "800", "2,000"], "ריבוי טבעי = לידות − פטירות = 2,000 − 800 = 1,200."]],
      [["Which is a pull factor for moving to a big city?", "More job opportunities", ["Drought in the village", "War at home", "Lack of schools at home"], "Pull factors attract people to the destination; the others push people away from home."],
        ["מה מהבאים הוא גורם משיכה למעבר לעיר גדולה?", "יותר הזדמנויות תעסוקה", ["בצורת בכפר", "מלחמה בבית", "מחסור בבתי ספר בבית"], "גורמי משיכה מושכים אנשים למקום החדש; האחרים דוחפים אנשים לעזוב את ביתם."]],
    ],
  },
};
export default c;
