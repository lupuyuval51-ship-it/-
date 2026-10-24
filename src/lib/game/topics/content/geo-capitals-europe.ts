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
      [["What is the capital of Ireland?", "Dublin", ["Belfast", "Cork", "Edinburgh"], "Dublin, on the east coast, is the capital of Ireland. Belfast is the capital of Northern Ireland, which is part of the United Kingdom, Cork is a city in the south of Ireland and Edinburgh is the capital of Scotland."],
        ["מהי בירת אירלנד?", "דבלין", ["בלפסט", "קורק", "אדינבורו"], "דבלין, בחוף המזרחי, היא בירת אירלנד. בלפסט היא בירת צפון אירלנד, שהיא חלק מהממלכה המאוחדת, קורק היא עיר בדרום אירלנד ואדינבורו היא בירת סקוטלנד."]],
      [["Which river flows through the middle of Paris?", "The Seine", ["The Loire", "The Rhine", "The Danube"], "The Seine flows through Paris on its way to the English Channel. The Loire is the longest river in France but does not pass Paris, the Rhine runs along France's border with Germany and the Danube flows through central and eastern Europe."],
        ["איזה נהר זורם דרך מרכז פריז?", "הסן", ["הלואר", "הריין", "הדנובה"], "הסן זורם דרך פריז בדרכו אל תעלת למאנש. הלואר הוא הנהר הארוך ביותר בצרפת, אבל הוא לא עובר בפריז, הריין זורם לאורך הגבול של צרפת עם גרמניה והדנובה זורם במרכז אירופה ובמזרחה."]],
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
      [["What is the capital of Norway?", "Oslo", ["Bergen", "Stockholm", "Copenhagen"], "Oslo, at the head of a long fjord, is the capital of Norway. Bergen is a big port on Norway's west coast, Stockholm is the capital of Sweden and Copenhagen is the capital of Denmark."],
        ["מהי בירת נורווגיה?", "אוסלו", ["ברגן", "שטוקהולם", "קופנהגן"], "אוסלו, בקצה של פיורד ארוך, היא בירת נורווגיה. ברגן היא עיר נמל גדולה בחוף המערבי של נורווגיה, שטוקהולם היא בירת שוודיה וקופנהגן היא בירת דנמרק."]],
      [["What is the capital of Romania?", "Bucharest", ["Budapest", "Bratislava", "Sofia"], "Bucharest is the capital of Romania. Budapest is the capital of Hungary, Bratislava of Slovakia and Sofia of Bulgaria; the names that start with B are easy to mix up."],
        ["מהי בירת רומניה?", "בוקרשט", ["בודפשט", "ברטיסלבה", "סופיה"], "בוקרשט היא בירת רומניה. בודפשט היא בירת הונגריה, ברטיסלבה היא בירת סלובקיה וסופיה היא בירת בולגריה; קל לבלבל בין השמות שמתחילים באות ב."]],
    ],
  },
  a: {
    t: [
      ["Valletta", "the capital of Malta, a walled city built by the Knights of St John in the 1500s", "ואלטה", "בירת מלטה, עיר מבוצרת שבנו אבירי מסדר יוחנן הקדוש במאה ה־16"],
      ["Helsinki", "the capital of Finland, on the Baltic Sea", "הלסינקי", "בירת פינלנד, לחוף הים הבלטי"],
      ["Reykjavík", "the capital of Iceland, the northernmost capital of a sovereign state", "רייקיאוויק", "בירת איסלנד, הבירה הצפונית ביותר של מדינה ריבונית"],
      ["Brussels", "the capital of Belgium, where many European Union institutions are based", "בריסל", "בירת בלגיה, שבה יושבים רבים ממוסדות האיחוד האירופי"],
    ],
    q: [
      [["What is the capital of Switzerland — not its biggest city?", "Bern", ["Zurich", "Geneva", "Basel"], "Zurich is the largest city and Geneva hosts UN offices, but the government sits in Bern."],
        ["מהי בירת שווייץ — שאינה העיר הגדולה בה?", "ברן", ["ציריך", "ז׳נבה", "בזל"], "ציריך היא העיר הגדולה וז׳נבה מארחת משרדי או״ם, אבל הממשלה יושבת בברן."]],
      [["Which capital city is divided by a river into Buda and Pest?", "Budapest", ["Bucharest", "Belgrade", "Bratislava"], "Buda on the west bank and Pest on the east were united in 1873."],
        ["איזו בירה מחולקת בידי נהר לבודה ולפשט?", "בודפשט", ["בוקרשט", "בלגרד", "ברטיסלבה"], "בודה בגדה המערבית ופשט בגדה המזרחית אוחדו ב־1873."]],
      [["Which country's capital is Ljubljana?", "Slovenia", ["Slovakia", "Croatia", "Serbia"], "Ljubljana is the capital of Slovenia. Slovakia, whose name is very similar, has Bratislava as its capital; the capital of Croatia is Zagreb and the capital of Serbia is Belgrade."],
        ["של איזו מדינה הבירה היא לובליאנה?", "סלובניה", ["סלובקיה", "קרואטיה", "סרביה"], "לובליאנה היא בירת סלובניה. לסלובקיה, ששמה דומה מאוד, הבירה היא ברטיסלבה; בירת קרואטיה היא זאגרב ובירת סרביה היא בלגרד."]],
      [["What is the capital of Estonia, the northernmost of the three Baltic states?", "Tallinn", ["Riga", "Vilnius", "Minsk"], "Tallinn, on the Gulf of Finland, is the capital of Estonia. Riga is the capital of Latvia, Vilnius of Lithuania and Minsk of neighbouring Belarus."],
        ["מהי בירת אסטוניה, הצפונית מבין שלוש המדינות הבלטיות?", "טאלין", ["ריגה", "וילניוס", "מינסק"], "טאלין, לחוף המפרץ הפיני, היא בירת אסטוניה. ריגה היא בירת לטביה, וילניוס היא בירת ליטא ומינסק היא בירת בלארוס השכנה."]],
    ],
  },
};
export default c;
