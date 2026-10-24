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
      [["Which planet is closest to the sun?", "Mercury", ["Venus", "Mars", "Jupiter"], "Mercury is the innermost planet, so it is the closest one to the sun and travels around it on the shortest path."],
        ["איזה כוכב לכת הכי קרוב לשמש?", "חמה (מרקורי)", ["נוגה (ונוס)", "מאדים (מארס)", "צדק (יופיטר)"], "חמה (מרקורי) הוא כוכב הלכת הפנימי ביותר, ולכן הוא הקרוב ביותר לשמש ונע סביבה במסלול הקצר ביותר."]],
      [["Which is the largest planet?", "Jupiter", ["Saturn", "Earth", "Neptune"], "Jupiter is the biggest planet; more than 1,000 Earths could fit inside it."],
        ["מהו כוכב הלכת הגדול ביותר?", "צדק", ["שבתאי", "כדור הארץ", "נפטון"], "צדק הוא כוכב הלכת הגדול ביותר; יותר מ־1,000 כדורי ארץ היו נכנסים בתוכו."]],
      [["What makes day and night on Earth?", "Earth spins once around its axis about every 24 hours", ["The sun travels around Earth once a day", "The Moon covers the sun every night", "Earth moves close to the sun and then far away from it each day"], "As Earth turns, the side facing the sun has day and the side facing away has night. One full turn takes about 24 hours."],
        ["מה גורם ליום וללילה על כדור הארץ?", "כדור הארץ מסתובב סביב צירו פעם אחת בערך כל 24 שעות", ["השמש מקיפה את כדור הארץ פעם ביום", "הירח מכסה את השמש בכל לילה", "כדור הארץ מתקרב לשמש ואז מתרחק ממנה שוב ושוב בכל יום"], "כשכדור הארץ מסתובב, באזור שפונה אל השמש יש יום, ובאזור שפונה ממנה יש לילה. סיבוב שלם אורך בערך 24 שעות."]],
      [["Which planet is famous for its bright rings?", "Saturn", ["Mars", "Venus", "Mercury"], "Saturn's rings are made of countless pieces of ice and rock. Jupiter, Uranus and Neptune have rings too, but theirs are much too faint to see easily."],
        ["איזה כוכב לכת מפורסם בטבעות הבהירות שלו?", "שבתאי", ["מאדים", "נוגה", "חמה"], "הטבעות של שבתאי עשויות ממספר עצום של חתיכות קרח וסלע. גם לצדק, לאורנוס ולנפטון יש טבעות, אבל הן קלושות מכדי לראות אותן בקלות."]],
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
      [["Why does Mars look red?", "Its soil is rich in iron oxide (rust)", ["It is so hot that it glows red like hot metal", "It is covered in lava", "It reflects red light from the sun only"], "Iron minerals in the Martian dust have oxidised — rusted — giving it a red colour."],
        ["למה מאדים נראה אדום?", "האדמה שלו עשירה בתחמוצת ברזל (חלודה)", ["הוא חם כל כך שהוא זוהר באדום כמו מתכת לוהטת", "הוא מכוסה לבה", "הוא מחזיר רק אור אדום מהשמש"], "מינרלים של ברזל באבק של מאדים עברו חמצון — החלידו — וזה נותן לו צבע אדום."]],
      [["Why does the Moon look like a thin crescent on some nights and like a full circle on others?", "We see more or less of its sunlit half as it circles Earth", ["Earth's shadow falls on a different part of the Moon each night, so part of it is dark", "The Moon changes its size every month", "Clouds hide different parts of it each night"], "The sun always lights half of the Moon. As the Moon orbits Earth, we see more or less of that lit half, and these are the phases. Earth's shadow covers the Moon only in a lunar eclipse."],
        ["למה הירח נראה בלילות מסוימים כמגל דק ובלילות אחרים כעיגול מלא?", "אנחנו רואים יותר או פחות מהחצי המואר שלו כשהוא מקיף את כדור הארץ", ["צל כדור הארץ נופל בכל לילה על חלק אחר של הירח, ולכן חלק ממנו חשוך", "הירח משנה את גודלו מדי חודש", "עננים מסתירים בכל לילה חלקים אחרים שלו"], "השמש מאירה תמיד חצי מהירח. כשהירח מקיף את כדור הארץ, אנחנו רואים יותר או פחות מהחצי המואר, וכך נוצרות הפאזות. צל כדור הארץ מכסה את הירח רק בליקוי ירח."]],
      [["Which planet takes the least time to go once around the sun?", "Mercury, which is closest to the sun", ["Venus, which is hotter than Mercury", "Mars, which is red and cold", "Neptune, which is the farthest planet"], "Mercury is closest to the sun, so its orbit is the shortest and it moves the fastest. One Mercury year is only about 88 Earth days."],
        ["איזה כוכב לכת משלים הקפה אחת סביב השמש בזמן הקצר ביותר?", "חמה, שהכי קרוב לשמש", ["נוגה, שחם יותר מחמה", "מאדים, שאדום וקר", "נפטון, כוכב הלכת הרחוק ביותר"], "חמה הוא הקרוב ביותר לשמש, ולכן המסלול שלו הקצר ביותר והוא נע הכי מהר. שנה אחת בחמה נמשכת רק כ־88 ימים של כדור הארץ."]],
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
      [["Why do the outer planets take much longer to orbit the sun?", "Their orbits are longer and they move more slowly", ["They are much heavier, and heavy objects move slowly", "They spin faster on their axes", "The sun pushes them away"], "Farther from the sun, the path is longer and the sun's pull is weaker, so the planets move more slowly: Neptune takes about 165 years."],
        ["למה לכוכבי הלכת החיצוניים לוקח הרבה יותר זמן להקיף את השמש?", "המסלול שלהם ארוך יותר והם נעים לאט יותר", ["הם כבדים הרבה יותר, וגופים כבדים נעים לאט יותר", "הם מסתובבים מהר יותר סביב צירם", "השמש דוחפת אותם"], "רחוק יותר מהשמש המסלול ארוך יותר והמשיכה חלשה יותר, ולכן כוכבי הלכת נעים לאט יותר: לנפטון לוקח כ־165 שנה."]],
      [["Earth is closest to the sun in early January. Why is it winter then in Israel?", "Seasons come from the tilt of Earth's axis, not the distance", ["The sun itself gives out much less energy in January than in July", "Israel is in the southern half of Earth", "Clouds block the sun only in winter"], "The tilt makes the sun's rays hit the northern half more slantingly in December–January, spreading the heat — whatever the distance."],
        ["כדור הארץ הכי קרוב לשמש בתחילת ינואר. למה אז חורף בישראל?", "העונות נובעות מנטיית ציר כדור הארץ, ולא מהמרחק", ["השמש עצמה פולטת הרבה פחות אנרגיה בינואר מאשר ביולי", "ישראל נמצאת בחצי הדרומי של כדור הארץ", "עננים מסתירים את השמש רק בחורף"], "בגלל הנטייה, קרני השמש פוגעות בחצי הצפוני באלכסון רב יותר בדצמבר–ינואר והחום מתפזר — בלי קשר למרחק."]],
      [["Astronauts on the International Space Station float, although gravity there is almost as strong as on the ground. Why?", "The station and the astronauts are falling around Earth together, so nothing presses them to the floor", ["There is no gravity at all in space, so nothing pulls the astronauts down", "The station is so far up that Earth's gravity cannot reach it, so nothing pulls on the astronauts at all", "The engines of the station push the astronauts upwards all the time"], "At about 400 km up, gravity is still roughly 90 % as strong as on the ground. The station is in constant free fall around Earth, and the astronauts fall with it, so they feel weightless."],
        ["אסטרונאוטים בתחנת החלל הבין־לאומית צפים, אף שהכבידה שם כמעט חזקה כמו על הקרקע. למה?", "התחנה והאסטרונאוטים נופלים יחד סביב כדור הארץ, ולכן שום דבר לא לוחץ אותם אל הרצפה", ["בחלל אין כבידה בכלל, ולכן שום דבר לא מושך את האסטרונאוטים למטה", "התחנה גבוהה כל כך שהכבידה של כדור הארץ לא מגיעה אליה, ולכן שום דבר לא מושך את האסטרונאוטים", "המנועים של התחנה דוחפים את האסטרונאוטים כלפי מעלה כל הזמן"], "בגובה של כ־400 ק״מ הכבידה עדיין חזקה בערך 90% מכפי שהיא על הקרקע. התחנה נמצאת בנפילה חופשית מתמדת סביב כדור הארץ, והאסטרונאוטים נופלים איתה, ולכן הם מרגישים חסרי משקל."]],
      [["A light-year is a unit of what?", "Distance", ["Time", "Speed", "Brightness"], "A light-year is how far light travels in one year, about 9.5 trillion km. Although its name has the word “year” in it, it measures distance and not time."],
        ["שנת אור היא יחידה למדידה של מה?", "מרחק", ["זמן", "מהירות", "בהירות"], "שנת אור היא המרחק שהאור עובר בשנה אחת, כ־9.5 טריליון ק״מ. אף על פי שבשמה יש המילה ״שנה״, היא מודדת מרחק ולא זמן."]],
    ],
    n: [[1.3, ["The Moon is about 384,000 km from Earth, and light travels about 300,000 km every second. About how many seconds does light from the Moon take to reach Earth?", "seconds", "384,000 ÷ 300,000 is about 1.3 seconds. Radio waves travel at the speed of light too, so a message between Earth and the Moon took about 1.3 seconds each way."],
      ["הירח נמצא במרחק של כ־384,000 ק״מ מכדור הארץ, והאור נע כ־300,000 ק״מ בכל שנייה. בערך כמה שניות לוקח לאור מהירח להגיע לכדור הארץ?", "שניות", "384,000 ÷ 300,000 הם בערך 1.3 שניות. גם גלי רדיו נעים במהירות האור, ולכן הודעה בין כדור הארץ לירח נמשכת כ־1.3 שניות לכל כיוון."], 0.1]],
  },
};
export default c;
