import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Paris", "the capital of France, home of the Eiffel Tower", "פריז", "בירת צרפת, שבה נמצא מגדל אייפל"],
      ["London", "the capital of the United Kingdom, on the River Thames", "לונדון", "בירת הממלכה המאוחדת, על נהר התמזה"],
      ["Rome", "the capital of Italy, with the ancient Colosseum", "רומא", "בירת איטליה, שבה נמצא הקולוסיאום העתיק"],
      ["Madrid", "the capital of Spain, in the centre of the country", "מדריד", "בירת ספרד, במרכז המדינה"],
    ],
    q: [
      [["What is the capital of Germany?", "Berlin", ["Munich", "Hamburg", "Vienna"], "Berlin is Germany's capital; Vienna is the capital of Austria."],
        ["מהי בירת גרמניה?", "ברלין", ["מינכן", "המבורג", "וינה"], "ברלין היא בירת גרמניה; וינה היא בירת אוסטריה."]],
      [["What is the capital of Greece?", "Athens", ["Sparta", "Thessaloniki", "Rome"], "Athens is the capital and largest city of Greece."],
        ["מהי בירת יוון?", "אתונה", ["ספרטה", "סלוניקי", "רומא"], "אתונה היא הבירה והעיר הגדולה ביותר ביוון."]],
    ],
  },
  i: {
    t: [
      ["Warsaw", "the capital of Poland, on the River Vistula", "ורשה", "בירת פולין, על נהר הוויסלה"],
      ["Lisbon", "the capital of Portugal, on the Atlantic coast", "ליסבון", "בירת פורטוגל, לחוף האוקיינוס האטלנטי"],
      ["Vienna", "the capital of Austria, on the Danube", "וינה", "בירת אוסטריה, על נהר הדנובה"],
      ["Prague", "the capital of the Czech Republic, famous for its old bridges", "פראג", "בירת צ׳כיה, שמפורסמת בגשרים העתיקים שלה"],
    ],
    q: [
      [["What is the capital of the Netherlands (by its constitution)?", "Amsterdam", ["Rotterdam", "Brussels", "Copenhagen"], "Amsterdam is the constitutional capital, although the government sits in The Hague."],
        ["מהי בירת הולנד (לפי החוקה שלה)?", "אמסטרדם", ["רוטרדם", "בריסל", "קופנהגן"], "אמסטרדם היא הבירה לפי החוקה, אף שהממשלה יושבת בהאג."]],
      [["Which of these capitals is on the River Danube?", "Budapest", ["Bucharest", "Prague", "Warsaw"], "The Danube flows through Vienna, Bratislava, Budapest and Belgrade. Bucharest lies on a smaller river north of the Danube, Prague on the Vltava and Warsaw on the Vistula."],
        ["איזו מהבירות האלה שוכנת על נהר הדנובה?", "בודפשט", ["בוקרשט", "פראג", "ורשה"], "הדנובה זורם דרך וינה, ברטיסלבה, בודפשט ובלגרד. בוקרשט שוכנת על נהר קטן יותר מצפון לדנובה, פראג על נהר הוולטאווה וורשה על נהר הוויסלה."]],
    ],
  },
  a: {
    t: [
      ["Bern", "the federal city and seat of government of Switzerland", "ברן", "העיר הפדרלית ומקום מושב הממשלה של שווייץ"],
      ["Helsinki", "the capital of Finland, on the Baltic Sea", "הלסינקי", "בירת פינלנד, לחוף הים הבלטי"],
      ["Reykjavík", "the capital of Iceland, the northernmost capital of a sovereign state", "רייקיאוויק", "בירת איסלנד, הבירה הצפונית ביותר של מדינה ריבונית"],
      ["Brussels", "the capital of Belgium, where many European Union institutions are based", "בריסל", "בירת בלגיה, שבה יושבים רבים ממוסדות האיחוד האירופי"],
    ],
    q: [
      [["What is the capital of Switzerland — not its biggest city?", "Bern", ["Zurich", "Geneva", "Basel"], "Zurich is the largest city and Geneva hosts UN offices, but the government sits in Bern."],
        ["מהי בירת שווייץ — שאינה העיר הגדולה בה?", "ברן", ["ציריך", "ז׳נבה", "בזל"], "ציריך היא העיר הגדולה וז׳נבה מארחת משרדי או״ם, אבל הממשלה יושבת בברן."]],
      [["Which capital city is divided by a river into Buda and Pest?", "Budapest", ["Bucharest", "Belgrade", "Bratislava"], "Buda on the west bank and Pest on the east were united in 1873."],
        ["איזו בירה מחולקת בידי נהר לבודה ולפשט?", "בודפשט", ["בוקרשט", "בלגרד", "ברטיסלבה"], "בודה בגדה המערבית ופשט בגדה המזרחית אוחדו ב־1873."]],
    ],
  },
};
export default c;
