import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Landmark", "a famous building or place that is easy to recognise and shows people where they are", "ציון דרך", "מבנה או מקום מפורסמים שקל לזהות, ושמראים לאנשים איפה הם נמצאים"],
      ["Monument", "a building or statue made to remember a person or an event", "אנדרטה", "מבנה או פסל שנבנו כדי להנציח אדם או אירוע"],
      ["Tourist", "a person who travels to visit places for fun", "תייר", "אדם שנוסע לבקר במקומות להנאתו"],
      ["Tower", "a very tall, narrow building or structure", "מגדל", "בניין או מבנה גבוהים וצרים מאוד"],
    ],
    q: [
      [["The Eiffel Tower is a famous landmark in which city?", "Paris", ["London", "Berlin", "Cairo"], "The Eiffel Tower stands in Paris, the capital of France. It was finished in 1889."],
        ["מגדל אייפל הוא אתר מפורסם באיזו עיר?", "פריז", ["לונדון", "ברלין", "קהיר"], "מגדל אייפל עומד בפריז, בירת צרפת. בנייתו הסתיימה ב־1889."]],
      [["Which landmark is a huge statue of a woman holding a torch, standing in the harbour of New York?", "The Statue of Liberty", ["The Eiffel Tower", "The Great Wall of China", "The Sydney Opera House"], "The Statue of Liberty was a gift from France to the United States. The Eiffel Tower is in Paris, the Great Wall is in China and the Opera House is in Sydney."],
        ["איזה אתר הוא פסל ענק של אישה שמחזיקה לפיד, שעומד בנמל של ניו יורק?", "פסל החירות", ["מגדל אייפל", "החומה הגדולה של סין", "בית האופרה של סידני"], "פסל החירות היה מתנה מצרפת לארצות הברית. מגדל אייפל נמצא בפריז, החומה הגדולה בסין ובית האופרה בסידני."]],
      [["The famous pyramids of Giza stand near which river?", "The Nile", ["The Amazon", "The Rhine", "The Thames"], "The pyramids stand just west of the Nile, near the city of Cairo in Egypt. They were built about 4,500 years ago as tombs for pharaohs."],
        ["הפירמידות המפורסמות בגיזה נמצאות ליד איזה נהר?", "הנילוס", ["האמזונאס", "הריין", "התמזה"], "הפירמידות עומדות מערבית לנילוס, ליד העיר קהיר שבמצרים. הן נבנו לפני כ־4,500 שנה כקברים לפרעונים."]],
      [["Why was the Great Wall of China built?", "To protect China from attackers coming from the north", ["To keep wild animals like tigers and wolves out of the farms", "To stop the sea from flooding the farms and towns of China", "So that it could be seen from the Moon"], "Rulers of China built and rebuilt the wall over many centuries to keep out raiders from the north. It is very long but narrow, so, despite a famous myth, it cannot be seen from the Moon."],
        ["למה נבנתה החומה הגדולה של סין?", "כדי להגן על סין מפני תוקפים שהגיעו מהצפון", ["כדי להרחיק חיות בר כמו נמרים וזאבים מהשדות", "כדי לעצור את הים מלהציף את השדות והערים של סין", "כדי שאפשר יהיה לראות אותה מהירח"], "שליטי סין בנו את החומה ושיפצו אותה במשך מאות שנים כדי לעצור פושטים שהגיעו מהצפון. היא ארוכה מאוד אבל צרה, ולכן, בניגוד לאגדה מפורסמת, אי אפשר לראות אותה מהירח."]],
    ],
  },
  i: {
    t: [
      ["World Heritage Site", "a place that UNESCO lists as so important to all people that it must be protected", "אתר מורשת עולמית", "מקום שאונסק״ו הכריז שהוא חשוב כל כך לכל האנושות, שחובה לשמור עליו"],
      ["Ruins", "the remains of old buildings that have partly fallen down", "חורבות", "שרידים של מבנים עתיקים שהתמוטטו בחלקם"],
      ["Temple", "a building where people worship a god or gods", "מקדש", "מבנה שבו אנשים מתפללים לאל או לאלים"],
      ["Skyscraper", "a very tall building with many floors, found in big cities", "גורד שחקים", "בניין גבוה מאוד עם קומות רבות, שנמצא בערים גדולות"],
    ],
    q: [
      [["The Taj Mahal, built of shining white marble in the 1600s, stands in which country?", "India", ["Pakistan", "Egypt", "Brazil"], "The Taj Mahal is in the city of Agra in India. Millions of people visit it every year."],
        ["הטאג׳ מהאל, שנבנה משיש לבן ונוצץ במאה ה־17, נמצא באיזו מדינה?", "הודו", ["פקיסטן", "מצרים", "ברזיל"], "הטאג׳ מהאל נמצא בעיר אגרה שבהודו. מיליוני אנשים מבקרים בו בכל שנה."]],
      [["Machu Picchu, a city built by the Inca high in the Andes mountains, is in which country?", "Peru", ["Mexico", "Spain", "Australia"], "The Inca built Machu Picchu in the 1400s, about 2,400 metres above sea level. It is one of the most famous sites in South America."],
        ["מאצ׳ו פיצ׳ו, עיר שבנו בני האינקה גבוה בהרי האנדים, נמצאת באיזו מדינה?", "פרו", ["מקסיקו", "ספרד", "אוסטרליה"], "בני האינקה בנו את מאצ׳ו פיצ׳ו במאה ה־15, בגובה של כ־2,400 מטר מעל פני הים. זה אחד האתרים המפורסמים ביותר בדרום אמריקה."]],
      [["The giant statue Christ the Redeemer, with its arms spread wide, looks out over which city?", "Rio de Janeiro", ["Lisbon", "Mexico City", "Rome"], "The statue stands on top of Corcovado mountain above Rio de Janeiro in Brazil. It was finished in 1931."],
        ["פסל הענק ״ישו הגואל״, שזרועותיו פרושות לצדדים, משקיף על איזו עיר?", "ריו דה ז׳ניירו", ["ליסבון", "מקסיקו סיטי", "רומא"], "הפסל עומד בראש הר קורקובדו, מעל ריו דה ז׳ניירו שבברזיל. הוא הושלם ב־1931."]],
      [["Petra, an ancient city carved into reddish sandstone cliffs, is in which country that borders Israel?", "Jordan", ["Egypt", "Lebanon", "Syria"], "Petra was carved by the Nabataeans about 2,000 years ago. It lies in southern Jordan and is a World Heritage Site."],
        ["פטרה, עיר עתיקה שנחצבה בצוקים של אבן חול אדמדמה, נמצאת באיזו מדינה שגובלת בישראל?", "ירדן", ["מצרים", "לבנון", "סוריה"], "את פטרה חצבו הנבטים לפני כ־2,000 שנה. היא נמצאת בדרום ירדן, והיא אתר מורשת עולמית."]],
      [["“Big Ben” is the nickname of the great bell inside a famous clock tower in which city?", "London", ["Paris", "Dublin", "New York"], "Many people call the whole tower Big Ben, but the name belongs to its largest bell. The tower is part of the Houses of Parliament in London."],
        ["״ביג בן״ הוא הכינוי של הפעמון הגדול שבתוך מגדל שעון מפורסם. באיזו עיר?", "לונדון", ["פריז", "דבלין", "ניו יורק"], "אנשים רבים קוראים למגדל כולו ביג בן, אבל השם שייך לפעמון הגדול שבו. המגדל הוא חלק מבנייני הפרלמנט בלונדון."]],
    ],
    n: [[11, ["The Eiffel Tower is about 330 metres tall. A building with 10 floors is about 30 metres tall. About how many times taller is the tower?", "", "330 ÷ 30 = 11, so the tower is about 11 times taller."],
      ["מגדל אייפל גבוה כ־330 מטר. בניין בן 10 קומות גבוה כ־30 מטר. פי כמה בערך המגדל גבוה יותר?", "", "330 ÷ 30 = 11, כלומר המגדל גבוה בערך פי 11."]]],
    s: [[["Landmarks by age, oldest first", "The pyramids of Giza in Egypt", "The Colosseum in Rome", "Machu Picchu in Peru", "The Taj Mahal in India", "The Eiffel Tower in Paris"],
      ["אתרים לפי גיל, מהעתיק לחדש", "הפירמידות בגיזה שבמצרים", "הקולוסיאום ברומא", "מאצ׳ו פיצ׳ו בפרו", "הטאג׳ מהאל בהודו", "מגדל אייפל בפריז"]]],
  },
  a: {
    t: [
      ["Mausoleum", "a large, grand building built as a tomb", "מאוזוליאום", "מבנה גדול ומפואר שנבנה כקבר"],
      ["Amphitheatre", "an open-air round or oval building with rows of seats rising around a central arena", "אמפיתיאטרון", "מבנה פתוח, עגול או סגלגל, שבו שורות מושבים עולות סביב זירה במרכז"],
      ["Restoration", "careful repair of an old building or artwork, so that it looks as it once did and lasts longer", "שחזור", "תיקון זהיר של מבנה או יצירה עתיקים, כדי שייראו כפי שנראו פעם ויחזיקו מעמד זמן רב יותר"],
      ["Overtourism", "having so many visitors that a place, or the life of the people who live there, is harmed", "תיירות־יתר", "מצב שבו מגיעים כל כך הרבה מבקרים, שהמקום או חיי התושבים בו נפגעים"],
    ],
    q: [
      [["Angkor Wat, one of the largest religious buildings in the world, is so important to its country that it appears on the national flag. Which country?", "Cambodia", ["Thailand", "Vietnam", "Indonesia"], "Angkor Wat was built in Cambodia in the 1100s, first as a Hindu temple and later used as a Buddhist one. It appears in the middle of Cambodia's flag."],
        ["אנגקור ואט, אחד המבנים הדתיים הגדולים בעולם, חשוב כל כך למדינה שלו שהוא מופיע על הדגל הלאומי. איזו מדינה?", "קמבודיה", ["תאילנד", "וייטנאם", "אינדונזיה"], "אנגקור ואט נבנה בקמבודיה במאה ה־12, תחילה כמקדש הינדי, ואחר כך שימש כמקדש בודהיסטי. הוא מופיע במרכז הדגל של קמבודיה."]],
      [["The step pyramid called El Castillo at Chichén Itzá in Mexico was built by which people?", "The Maya", ["The Inca", "The ancient Egyptians", "The Romans"], "The Maya built Chichén Itzá on the Yucatán Peninsula about 1,000 years ago. The Inca lived far to the south, in the Andes."],
        ["את פירמידת המדרגות ״אל קסטיו״ בצ׳יצ׳ן איצה שבמקסיקו בנו בני איזה עם?", "בני המאיה", ["בני האינקה", "המצרים הקדמונים", "הרומאים"], "בני המאיה בנו את צ׳יצ׳ן איצה בחצי האי יוקטן לפני כ־1,000 שנה. בני האינקה חיו רחוק משם דרומה, בהרי האנדים."]],
      [["Why does the Leaning Tower of Pisa lean?", "The soft ground under one side began to sink while it was being built", ["It was built leaning on purpose to attract tourists", "A strong earthquake pushed it over in the year 2000", "Strong sea winds slowly bent the stone"], "The tower began to tilt in the 1170s, soon after building started, because the soil under it is soft. Around the year 2000 engineers reduced the lean a little, so that it would not fall."],
        ["למה המגדל הנטוי של פיזה נוטה?", "האדמה הרכה שמתחת לצד אחד שלו התחילה לשקוע עוד בזמן הבנייה", ["בנו אותו נטוי בכוונה כדי למשוך תיירים", "רעידת אדמה חזקה הטתה אותו בשנת 2000", "רוחות ים חזקות כופפו את האבן לאט"], "המגדל התחיל לנטות בשנות ה־70 של המאה ה־12, זמן קצר אחרי תחילת הבנייה, כי הקרקע שמתחתיו רכה. בסביבות שנת 2000 מהנדסים הקטינו מעט את הנטייה, כדי שהמגדל לא ייפול."]],
      [["What do the Taj Mahal and the Great Pyramid of Giza have in common?", "Both were built as tombs", ["Both are in Asia", "Both are made mainly of steel", "Both were built in the 1900s"], "A grand tomb is called a mausoleum. The emperor Shah Jahan built the Taj Mahal for his wife Mumtaz Mahal, and the Great Pyramid was built for the pharaoh Khufu."],
        ["מה משותף לטאג׳ מהאל ולפירמידה הגדולה של גיזה?", "שניהם נבנו כקברים", ["שניהם נמצאים באסיה", "שניהם עשויים בעיקר מפלדה", "שניהם נבנו במאה ה־20"], "קבר מפואר נקרא מאוזוליאום. הקיסר שאה ג׳האן בנה את הטאג׳ מהאל לאשתו מומטאז מהאל, והפירמידה הגדולה נבנתה בשביל פרעה ח׳ופו."]],
      [["In the 1960s the great temples of Abu Simbel in Egypt were cut into huge blocks and rebuilt on higher ground. Why?", "A new dam on the Nile would have drowned them under a lake", ["An earthquake had cracked their walls", "Tourists could not see them from the road", "The desert sun was melting the statues"], "The Aswan High Dam created Lake Nasser. Countries around the world helped UNESCO move the temples, and the rescue helped lead to the idea of World Heritage Sites."],
        ["בשנות ה־60 של המאה ה־20 חתכו את המקדשים הגדולים של אבו סימבל שבמצרים לגושים ענקיים, והקימו אותם מחדש על קרקע גבוהה יותר. למה?", "סכר חדש על הנילוס היה מטביע אותם מתחת לאגם", ["רעידת אדמה סדקה את הקירות שלהם", "תיירים לא יכלו לראות אותם מהכביש", "שמש המדבר המיסה את הפסלים"], "סכר אסואן הגבוה יצר את אגם נאצר. מדינות מכל העולם עזרו לאונסק״ו להעביר את המקדשים, והמבצע הזה עזר להוליד את הרעיון של אתרי מורשת עולמית."]],
      [["In 2024 Venice in Italy began charging day visitors an entry fee on its busiest days. Why?", "To reduce the crowding and damage caused by too many tourists", ["To stop the people who live there from going out", "Because the city was about to close for good", "Because tourists are no longer allowed in Italy"], "This is a way of fighting overtourism. When too many visitors come, streets become packed, old buildings wear down and life gets hard for the people who live there."],
        ["ב־2024 התחילה ונציה שבאיטליה לגבות דמי כניסה ממבקרים ליום אחד בימים העמוסים ביותר. למה?", "כדי לצמצם את הצפיפות ואת הנזק שגורמים יותר מדי תיירים", ["כדי למנוע מהתושבים לצאת מהבית", "כי העיר עמדה להיסגר לתמיד", "כי באיטליה כבר אסור לקבל תיירים"], "זו דרך להיאבק בתיירות־יתר. כשמגיעים יותר מדי מבקרים, הרחובות נדחסים, מבנים עתיקים נשחקים ולתושבים קשה לחיות בעיר."]],
    ],
    n: [[93, ["The Statue of Liberty is about 46 metres tall from its feet to the tip of the torch, and its pedestal and base add about 47 metres. About how high above the ground is the torch?", "m", "Add the statue to what stands under it: 46 + 47 = 93, so the torch is about 93 metres above the ground."],
      ["פסל החירות גבוה כ־46 מטר מכפות הרגליים ועד קצה הלפיד, והכן והבסיס שלו מוסיפים כ־47 מטר. בערך באיזה גובה מעל הקרקע נמצא הלפיד?", "מטר", "מחברים את גובה הפסל לגובה של מה שעומד מתחתיו: 46 + 47 = 93, כלומר הלפיד נמצא כ־93 מטר מעל הקרקע."]]],
  },
};
export default c;
