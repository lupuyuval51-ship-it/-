import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Tokyo", "the capital of Japan, one of the biggest cities in the world", "טוקיו", "בירת יפן, אחת הערים הגדולות בעולם"],
      ["Cairo", "the capital of Egypt, on the river Nile", "קהיר", "בירת מצרים, על נהר הנילוס"],
      ["Washington, D.C.", "the capital of the United States, home of the White House", "וושינגטון הבירה", "בירת ארצות הברית, שבה נמצא הבית הלבן"],
      ["Beijing", "the capital of China, with the Forbidden City", "בייג׳ינג", "בירת סין, שבה נמצאת העיר האסורה"],
    ],
    q: [
      [["What is the capital of India?", "New Delhi", ["Mumbai", "Bangalore", "Kathmandu"], "New Delhi is India's capital; Mumbai is its biggest city, and Kathmandu is the capital of Nepal."],
        ["מהי בירת הודו?", "ניו דלהי", ["מומבאי", "בנגלור", "קטמנדו"], "ניו דלהי היא בירת הודו; מומבאי היא העיר הגדולה בה, וקטמנדו היא בירת נפאל."]],
      [["What is the capital of Mexico?", "Mexico City", ["Guadalajara", "Cancún", "Madrid"], "Mexico City is the capital; Madrid is the capital of Spain, which ruled Mexico for about 300 years."],
        ["מהי בירת מקסיקו?", "מקסיקו סיטי", ["גוודלחרה", "קנקון", "מדריד"], "מקסיקו סיטי היא הבירה; מדריד היא בירת ספרד, ששלטה במקסיקו כ־300 שנה."]],
    ],
  },
  i: {
    t: [
      ["Canberra", "the capital of Australia, a city planned and built to be the capital", "קנברה", "בירת אוסטרליה, עיר שתוכננה ונבנתה מראש כדי להיות הבירה"],
      ["Ottawa", "the capital of Canada", "אוטווה", "בירת קנדה"],
      ["Brasília", "the capital of Brazil, a planned city opened in 1960", "ברזיליה", "בירת ברזיל, עיר מתוכננת שנחנכה ב־1960"],
      ["Buenos Aires", "the capital of Argentina, on the Río de la Plata", "בואנוס איירס", "בירת ארגנטינה, על חופי הריו דה לה פלטה"],
    ],
    q: [
      [["Sydney is the largest city in Australia. Is it the capital?", "No — the capital is Canberra", ["Yes, Sydney is the capital", "No — the capital is Melbourne", "No — the capital is Perth"], "Canberra has been the capital since the government moved there in 1927; Melbourne was only the temporary seat before that."],
        ["סידני היא העיר הגדולה ביותר באוסטרליה. האם היא הבירה?", "לא — הבירה היא קנברה", ["כן, סידני היא הבירה", "לא — הבירה היא מלבורן", "לא — הבירה היא פרת׳"], "קנברה היא הבירה מאז שהממשלה עברה אליה ב־1927; מלבורן הייתה לפני כן רק מקום מושב זמני."]],
      [["Nairobi is the capital of which country?", "Kenya", ["Tanzania", "Nigeria", "Peru"], "Nairobi is Kenya's capital and one of the largest cities in East Africa."],
        ["ניירובי היא בירת איזו מדינה?", "קניה", ["טנזניה", "ניגריה", "פרו"], "ניירובי היא בירת קניה ואחת הערים הגדולות במזרח אפריקה."]],
      [["Seoul is the capital of which country?", "South Korea", ["North Korea", "Japan", "Thailand"], "Seoul is the capital of South Korea; the capital of North Korea is Pyongyang."],
        ["סיאול היא בירת איזו מדינה?", "דרום קוריאה", ["צפון קוריאה", "יפן", "תאילנד"], "סיאול היא בירת דרום קוריאה; בירת צפון קוריאה היא פיונגיאנג."]],
    ],
  },
  a: {
    t: [
      ["Wellington", "the capital of New Zealand, the southernmost national capital in the world", "ולינגטון", "בירת ניו זילנד, עיר הבירה הדרומית ביותר בעולם"],
      ["Ulaanbaatar", "the capital of Mongolia, often called the coldest national capital", "אולן בטור", "בירת מונגוליה, שנחשבת לעיר הבירה הקרה ביותר"],
      ["Quito", "the capital of Ecuador, high in the Andes and close to the equator", "קיטו", "בירת אקוודור, גבוה בהרי האנדים וקרוב לקו המשווה"],
      ["Pretoria", "the seat of South Africa's government and one of the country's three capitals", "פרטוריה", "מקום מושב הממשלה של דרום אפריקה ואחת משלוש הבירות שלה"],
    ],
    q: [
      [["Why was Canberra built to be Australia's capital?", "As a compromise between the rival cities of Sydney and Melbourne", ["Because it was the oldest city in Australia", "Because it was the largest port", "Because it was the largest city"], "Sydney and Melbourne both wanted to be the capital, so a new city was built between them."],
        ["למה נבנתה קנברה כדי להיות בירת אוסטרליה?", "כפשרה בין הערים היריבות סידני ומלבורן", ["כי היא הייתה העיר העתיקה ביותר באוסטרליה", "כי היא הייתה הנמל הגדול ביותר", "כי היא הייתה העיר הגדולה ביותר"], "גם סידני וגם מלבורן רצו להיות הבירה, ולכן נבנתה עיר חדשה ביניהן."]],
      [["Abuja replaced Lagos as the capital in 1991. Which country is it?", "Nigeria", ["Ghana", "Kenya", "Egypt"], "Nigeria moved its capital from Lagos on the coast to Abuja, a planned city in the centre of the country."],
        ["אבוג׳ה החליפה את לאגוס כבירה ב־1991. באיזו מדינה מדובר?", "ניגריה", ["גאנה", "קניה", "מצרים"], "ניגריה העבירה את הבירה מלאגוס שעל החוף לאבוג׳ה, עיר מתוכננת במרכז המדינה."]],
      [["South Africa has three capital cities. Which is NOT one of them?", "Johannesburg", ["Pretoria", "Cape Town", "Bloemfontein"], "Pretoria is the seat of government, Cape Town of parliament and Bloemfontein of the Supreme Court of Appeal; Johannesburg is the largest city but not a capital."],
        ["לדרום אפריקה יש שלוש ערי בירה. איזו מהערים הבאות אינה אחת מהן?", "יוהנסבורג", ["פרטוריה", "קייפטאון", "בלומפונטיין"], "בפרטוריה יושבת הממשלה, בקייפטאון הפרלמנט ובבלומפונטיין בית המשפט העליון לערעורים; יוהנסבורג היא העיר הגדולה ביותר, אבל אינה בירה."]],
    ],
    n: [[2850, ["Quito is about how many metres above sea level?", "metres", "Quito lies at about 2,850 metres, one of the highest capital cities in the world."], ["קיטו נמצאת בגובה של כמה מטרים בערך מעל פני הים?", "מטרים", "קיטו נמצאת בגובה של כ־2,850 מטרים, אחת מערי הבירה הגבוהות בעולם."], 200]],
  },
};
export default c;
