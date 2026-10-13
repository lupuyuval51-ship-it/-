import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sun", "the star at the centre of our solar system", "השמש", "הכוכב שבמרכז מערכת כוכבי הלכת שלנו"],
      ["Planet", "a large round body that travels around a star", "כוכב לכת", "גוף גדול ועגול שנע סביב כוכב"],
      ["Moon", "a natural body that travels around a planet", "ירח", "גוף טבעי שנע סביב כוכב לכת"],
      ["Orbit", "the curved path of one body around another", "מסלול", "הדרך המעוגלת שבה גוף אחד נע סביב גוף אחר"],
    ],
    q: [
      [["How many planets are in our solar system?", "8", ["9", "7", "12"], "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune: 8 planets (Pluto has been a dwarf planet since 2006)."],
        ["כמה כוכבי לכת יש במערכת השמש שלנו?", "8", ["9", "7", "12"], "חמה, נוגה, כדור הארץ, מאדים, צדק, שבתאי, אורנוס ונפטון: 8 כוכבי לכת (פלוטו נחשב כוכב לכת ננסי מאז 2006)."]],
      [["Which planet is closest to the sun?", "Mercury", ["Venus", "Earth", "Mars"], "Mercury is the innermost planet."],
        ["איזה כוכב לכת הכי קרוב לשמש?", "חמה (מרקורי)", ["נוגה", "כדור הארץ", "מאדים"], "חמה (מרקורי) הוא כוכב הלכת הפנימי ביותר."]],
      [["Which is the largest planet?", "Jupiter", ["Saturn", "Earth", "Neptune"], "Jupiter is the biggest planet; more than 1,000 Earths could fit inside it."],
        ["מהו כוכב הלכת הגדול ביותר?", "צדק", ["שבתאי", "כדור הארץ", "נפטון"], "צדק הוא כוכב הלכת הגדול ביותר; יותר מ־1,000 כדורי ארץ היו נכנסים בתוכו."]],
    ],
    n: [[365, ["About how many days does Earth take to go once around the sun?", "days", "One orbit takes about 365 days (365¼), which is one year."], ["בערך כמה ימים לוקח לכדור הארץ להקיף את השמש פעם אחת?", "ימים", "הקפה אחת נמשכת בערך 365 ימים (365 ורבע), וזו שנה."], 1]],
  },
  i: {
    t: [
      ["Rocky planets", "the four inner planets with solid surfaces: Mercury, Venus, Earth and Mars", "כוכבי לכת סלעיים", "ארבעת כוכבי הלכת הפנימיים עם קרקע מוצקה: חמה, נוגה, כדור הארץ ומאדים"],
      ["Gas giants", "the huge outer planets made mostly of gas: Jupiter and Saturn", "ענקי גז", "כוכבי הלכת החיצוניים והענקיים שעשויים בעיקר מגז: צדק ושבתאי"],
      ["Asteroid belt", "a ring of rocky bodies between Mars and Jupiter", "חגורת האסטרואידים", "טבעת של גופים סלעיים בין מאדים לצדק"],
      ["Dwarf planet", "a round body that orbits the sun but has not cleared its path of other objects, like Pluto", "כוכב לכת ננסי", "גוף עגול שמקיף את השמש אבל לא פינה את מסלולו מגופים אחרים, כמו פלוטו"],
    ],
    q: [
      [["Which planet is the hottest, even though it is not the closest to the sun?", "Venus", ["Mercury", "Mars", "Jupiter"], "Venus has a thick carbon-dioxide atmosphere that traps heat, so its surface is hotter than Mercury's."],
        ["איזה כוכב לכת הוא החם ביותר, אף שאינו הקרוב ביותר לשמש?", "נוגה", ["חמה", "מאדים", "צדק"], "לנוגה אטמוספרה עבה של פחמן דו־חמצני שלוכדת חום, ולכן פני השטח שלו חמים יותר משל חמה."]],
      [["Why does Mars look red?", "Its soil is rich in iron oxide (rust)", ["It is very hot", "It is covered in lava", "It reflects red light from the sun only"], "Iron minerals in the Martian dust have oxidised — rusted — giving it a red colour."],
        ["למה מאדים נראה אדום?", "האדמה שלו עשירה בתחמוצת ברזל (חלודה)", ["הוא חם מאוד", "הוא מכוסה לבה", "הוא מחזיר רק אור אדום מהשמש"], "מינרלים של ברזל באבק של מאדים עברו חמצון — החלידו — וזה נותן לו צבע אדום."]],
    ],
    s: [[["Order these planets from the sun outwards", "Mercury", "Venus", "Earth", "Mars", "Jupiter"], ["סדרו את כוכבי הלכת מהשמש והלאה", "חמה", "נוגה", "כדור הארץ", "מאדים", "צדק"]]],
  },
  a: {
    t: [
      ["Astronomical unit", "the average distance from Earth to the sun, about 150 million km", "יחידה אסטרונומית", "המרחק הממוצע מכדור הארץ לשמש, כ־150 מיליון ק״מ"],
      ["Light-year", "the distance light travels in one year, about 9.5 trillion km", "שנת אור", "המרחק שהאור עובר בשנה אחת, כ־9.5 טריליון ק״מ"],
      ["Gravity", "the pull between masses that keeps the planets in their orbits around the sun", "כבידה", "המשיכה בין מסות ששומרת על כוכבי הלכת במסלולם סביב השמש"],
      ["Ellipse", "the slightly stretched circle that is the shape of a planet's orbit", "אליפסה", "מעגל מעט מתוח, שזו צורת המסלול של כוכב לכת"],
    ],
    q: [
      [["Sunlight takes about how long to reach Earth?", "About 8 minutes", ["About 8 seconds", "About 8 hours", "About 8 days"], "Light travels about 300,000 km per second; 150 million km ÷ 300,000 km/s ≈ 500 s ≈ 8 minutes."],
        ["בערך כמה זמן לוקח לאור השמש להגיע לכדור הארץ?", "כ־8 דקות", ["כ־8 שניות", "כ־8 שעות", "כ־8 ימים"], "האור נע כ־300,000 ק״מ בשנייה; 150 מיליון ק״מ ÷ 300,000 ק״מ לשנייה ≈ 500 שניות ≈ 8 דקות."]],
      [["Why do the outer planets take much longer to orbit the sun?", "Their orbits are longer and they move more slowly", ["They are heavier", "They spin faster on their axes", "The sun pushes them away"], "Farther from the sun, the path is longer and the sun's pull is weaker, so the planets move more slowly: Neptune takes about 165 years."],
        ["למה לכוכבי הלכת החיצוניים לוקח הרבה יותר זמן להקיף את השמש?", "המסלול שלהם ארוך יותר והם נעים לאט יותר", ["הם כבדים יותר", "הם מסתובבים מהר יותר סביב צירם", "השמש דוחפת אותם"], "רחוק יותר מהשמש המסלול ארוך יותר והמשיכה חלשה יותר, ולכן כוכבי הלכת נעים לאט יותר: לנפטון לוקח כ־165 שנה."]],
      [["Earth is closest to the sun in early January. Why is it winter then in Israel?", "Seasons come from the tilt of Earth's axis, not the distance", ["The sun is weaker in January", "Israel is in the southern half of Earth", "Clouds block the sun only in winter"], "The tilt makes the sun's rays hit the northern half more slantingly in December–January, spreading the heat — whatever the distance."],
        ["כדור הארץ הכי קרוב לשמש בתחילת ינואר. למה אז חורף בישראל?", "העונות נובעות מנטיית ציר כדור הארץ, ולא מהמרחק", ["השמש חלשה יותר בינואר", "ישראל נמצאת בחצי הדרומי של כדור הארץ", "עננים מסתירים את השמש רק בחורף"], "בגלל הנטייה, קרני השמש פוגעות בחצי הצפוני באלכסון רב יותר בדצמבר–ינואר והחום מתפזר — בלי קשר למרחק."]],
    ],
  },
};
export default c;
