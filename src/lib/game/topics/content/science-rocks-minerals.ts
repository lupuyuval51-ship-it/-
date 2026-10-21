import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Rock", "a hard natural material that makes up mountains and much of Earth's crust", "סלע", "חומר טבעי וקשה שממנו עשויים הרים וחלק גדול מקרום כדור הארץ"],
      ["Mineral", "a natural, non-living solid with its own chemical makeup, such as quartz or salt", "מינרל", "חומר טבעי מוצק ובלתי חי עם הרכב כימי משלו, כמו קוורץ או מלח"],
      ["Fossil", "the remains or imprint of a plant or animal that lived long ago, kept in stone", "מאובן", "שריד או טביעה של צמח או בעל חיים שחיו לפני זמן רב, ששמורים בתוך אבן"],
      ["Lava", "hot melted rock that flows out of a volcano", "לבה", "סלע מותך וחם שזורם מתוך הר געש"],
    ],
    q: [
      [["In which of these rocks are you most likely to find a fossil shell?", "Limestone", ["Granite", "Obsidian", "Basalt", "Quartzite"], "Limestone is often made of layers of shells and other remains of sea creatures. Granite, obsidian and basalt form from cooled melted rock, and quartzite is changed by great heat and pressure. Both would destroy a shell."],
        ["באיזה מהסלעים האלה הכי סביר למצוא קונכייה מאובנת?", "אבן גיר", ["גרניט", "אובסידיאן", "בזלת", "קוורציט"], "אבן גיר עשויה לעיתים קרובות משכבות של קונכיות ושל שרידי יצורי ים אחרים. גרניט, אובסידיאן ובזלת נוצרים מסלע מותך שהתקרר, וקוורציט משתנה בגלל חום ולחץ גדולים. החום היה משמיד קונכייה בשני המקרים."]],
      [["What happens to lava when it cools down?", "It hardens into solid rock", ["It becomes a fossil", "It turns into water as it loses heat", "It stays liquid forever"], "Melted rock becomes solid as it cools. Basalt, for example, forms when lava cools."],
        ["מה קורה ללבה כשהיא מתקררת?", "היא מתקשה והופכת לסלע מוצק", ["היא הופכת למאובן", "היא הופכת למים כשהיא מאבדת חום", "היא נשארת נוזלית לנצח"], "סלע מותך מתקשה כשהוא מתקרר. בזלת, למשל, נוצרת כשלבה מתקררת."]],
      [["Which of these can slowly break a rock into smaller pieces?", "Frozen water in a crack, which pushes the crack wider", ["Only a person with a hammer or a strong drill can ever break a rock", "Moonlight, which warms the rock at night", "Nothing, because rocks never change"], "When water in a crack freezes, it expands and pushes the rock apart. Over many years, wind, rain and the roots of plants also break rocks into smaller pieces."],
        ["איזה מהדברים האלה יכול לפורר סלע לחתיכות קטנות לאט לאט?", "מים קפואים בתוך סדק, שדוחפים את הסדק ומרחיבים אותו", ["רק אדם עם פטיש או מקדחה חזקה יכול אי פעם לשבור סלע", "אור הירח, שמחמם את הסלע בלילה", "שום דבר, כי סלעים אף פעם לא משתנים"], "כשמים בתוך סדק קופאים הם מתפשטים ודוחפים את הסלע לצדדים. במשך שנים רבות גם רוח, גשם ושורשי צמחים מפוררים סלעים לחתיכות קטנות יותר."]],
      [["Which of these rocks is so light, and so full of air holes, that it can float on water?", "Pumice, a volcanic rock full of tiny holes", ["Granite, a very hard rock with large crystals", "Marble, a smooth rock used for statues", "Limestone, a rock made of sea shells"], "Pumice forms when frothy lava cools quickly and traps many gas bubbles. The holes make it so light that a piece can float on water."],
        ["איזה מהסלעים האלה קל כל כך ויש בו כל כך הרבה חורי אוויר שהוא יכול לצוף על מים?", "פומיס, סלע געשי מלא חורים זעירים", ["גרניט, סלע קשה מאוד עם גבישים גדולים", "שיש, סלע חלק שמשתמשים בו לפסלים", "אבן גיר, סלע שעשוי מקונכיות ים"], "פומיס נוצר כשלבה מוקצפת מתקררת מהר ולוכדת בועות גז רבות. החורים הופכים אותו לקל כל כך שחתיכה ממנו יכולה לצוף על מים."]],
    ],
  },
  i: {
    t: [
      ["Igneous rock", "rock that forms when melted rock cools and hardens, such as granite and basalt", "סלע יסוד (מגמתי)", "סלע שנוצר כשסלע מותך מתקרר ומתקשה, כמו גרניט ובזלת"],
      ["Sedimentary rock", "rock made of layers of sand, mud or shells pressed and cemented together over a long time, such as sandstone", "סלע משקע", "סלע שנוצר משכבות של חול, בוץ או קונכיות שנדחסו והתלכדו במשך זמן רב, כמו אבן חול"],
      ["Metamorphic rock", "rock changed by great heat and pressure without melting, such as slate, which forms from shale", "סלע מותמר", "סלע שהשתנה בגלל חום ולחץ גדולים בלי שנמס, כמו צפחה שנוצרת מפצלים"],
      ["Hardness", "how well a mineral resists being scratched", "קשיות", "עד כמה מינרל עמיד בפני שריטה"],
    ],
    q: [
      [["On the Mohs scale of hardness, diamond is 10 and talc is 1. Which can scratch the other?", "Diamond can scratch talc", ["Talc can scratch diamond", "Each can scratch the other", "Neither can scratch the other"], "A harder mineral scratches a softer one. Diamond is the hardest natural mineral, and talc is so soft that a fingernail can scratch it."],
        ["בסולם הקשיות של מוס, יהלום הוא 10 וטלק הוא 1. מי מהם יכול לשרוט את השני?", "יהלום יכול לשרוט טלק", ["טלק יכול לשרוט יהלום", "כל אחד מהם יכול לשרוט את השני", "אף אחד מהם לא יכול לשרוט את השני"], "מינרל קשה יותר שורט מינרל רך יותר. יהלום הוא המינרל הטבעי הקשה ביותר, וטלק רך כל כך שאפשר לשרוט אותו בציפורן."]],
      [["Marble is a metamorphic rock. Which rock does it form from?", "Limestone", ["Sandstone", "Granite", "Basalt"], "Heat and pressure change the calcite in limestone into the larger, interlocking crystals of marble."],
        ["שיש הוא סלע מותמר. מאיזה סלע הוא נוצר?", "מאבן גיר", ["מאבן חול", "מגרניט", "מבזלת"], "חום ולחץ הופכים את הקלציט שבאבן הגיר לגבישים גדולים ושלובים זה בזה של שיש."]],
      [["Why are most fossils found in sedimentary rocks?", "Remains get buried gently in mud or sand instead of being melted", ["Sedimentary rocks are always the oldest rocks", "Animals lived only on sandstone", "Igneous and metamorphic rocks are all too young to contain any fossils"], "Mud and sand cover remains softly and slowly turn to rock around them; the heat that makes igneous rock would destroy them."],
        ["למה רוב המאובנים נמצאים בסלעי משקע?", "השרידים נקברים בעדינות בבוץ או בחול במקום להינמס", ["סלעי משקע הם תמיד הסלעים העתיקים ביותר", "בעלי חיים חיו רק על אבן חול", "סלעי יסוד וסלעים מותמרים צעירים מכדי שיהיו בהם מאובנים בכלל"], "בוץ וחול מכסים את השרידים ברכות והופכים לאט לסלע סביבם; החום שיוצר סלעי יסוד היה משמיד אותם."]],
      [["Which of these is a mineral and not a rock?", "Quartz, found in sand and in granite", ["Granite, used for kitchen counters", "Sandstone, used for building walls", "Basalt, a dark rock from old volcanoes"], "A mineral is one natural substance with its own chemical makeup, such as quartz. Granite, sandstone and basalt are rocks, which are made of one or more minerals."],
        ["איזה מהבאים הוא מינרל ולא סלע?", "קוורץ, שנמצא בחול ובגרניט", ["גרניט, שמשתמשים בו למשטחי מטבח", "אבן חול, שבונים ממנה קירות", "בזלת, סלע כהה מהרי געש ישנים"], "מינרל הוא חומר טבעי אחד עם הרכב כימי משלו, כמו קוורץ. גרניט, אבן חול ובזלת הם סלעים, והם עשויים ממינרל אחד או מכמה מינרלים."]],
      [["Why are river pebbles round and smooth?", "Moving water rolls them along and knocks the sharp corners off", ["The river heats them until they melt a little", "Fish nibble at their sharp corners", "They grow round as new layers slowly form around them, like a pearl"], "Stones carried along by moving water bump into each other and the river bed, and this wears away their corners over a long time. Pebbles on a beach are smooth for the same reason."],
        ["למה חלוקי נחל עגולים וחלקים?", "מים זורמים מגלגלים אותם ומשברים מהם את הפינות החדות", ["הנהר מחמם אותם עד שהם נמסים מעט", "דגים מכרסמים את הפינות החדות שלהם", "הם גדלים עגולים כשנוצרות סביבם שכבות חדשות לאט לאט, כמו פנינה"], "אבנים שהמים נושאים נתקלות זו בזו ובקרקעית הנהר, וזה שוחק את הפינות שלהן במשך זמן רב. חלוקי נחל על החוף חלקים מאותה סיבה."]],
    ],
    s: [[["From a rock to sandstone", "Weathering breaks rock into grains", "Rivers carry the grains to the sea", "The grains settle in layers", "The layers are buried and pressed", "Minerals cement the grains into rock"],
      ["מסלע לאבן חול", "בליה מפוררת סלע לגרגרים", "נהרות נושאים את הגרגרים לים", "הגרגרים שוקעים בשכבות", "השכבות נקברות ונדחסות", "מינרלים מלכדים את הגרגרים לסלע"]]],
  },
  a: {
    t: [
      ["Weathering", "the breaking down of rock where it lies, by water, ice, heat, plants or chemicals", "בליה", "התפוררות של סלע במקומו בגלל מים, קרח, חום, צמחים או חומרים כימיים"],
      ["Erosion", "the carrying away of loose pieces of rock by water, wind or ice", "סחיפה", "הובלה של חלקי סלע מפוררים ממקומם על ידי מים, רוח או קרח"],
      ["Rock cycle", "the slow, endless process in which rocks change from one kind into another", "מחזור הסלעים", "התהליך האיטי והמתמשך שבו סלעים משתנים מסוג אחד לסוג אחר"],
      ["Crystal", "a solid whose atoms are arranged in a regular, repeating pattern", "גביש", "מוצק שהאטומים שלו מסודרים בתבנית קבועה שחוזרת על עצמה"],
    ],
    q: [
      [["Granite has large crystals, but the crystals in basalt are too small to see. Why?", "Granite cooled slowly deep underground; basalt cooled quickly at the surface", ["Granite cooled very quickly at the surface; basalt cooled slowly deep underground", "Basalt is much older than granite", "Granite was pressed under heavy layers of mud"], "Slow cooling gives crystals time to grow large. Lava that cools fast at the surface forms only tiny crystals."],
        ["לגרניט יש גבישים גדולים, אבל הגבישים בבזלת קטנים מכדי לראות אותם. למה?", "גרניט התקרר לאט עמוק מתחת לפני הקרקע; בזלת התקררה מהר על פני השטח", ["גרניט התקרר מהר מאוד על פני השטח; בזלת התקררה לאט עמוק מתחת לפני הקרקע", "בזלת עתיקה הרבה יותר מגרניט", "גרניט נדחס מתחת לשכבות כבדות של בוץ"], "קירור איטי נותן לגבישים זמן לגדול. לבה שמתקררת מהר על פני השטח יוצרת רק גבישים זעירים."]],
      [["A geologist finds three undisturbed layers of sedimentary rock. Which layer is usually the oldest?", "The bottom layer", ["The top layer", "The middle layer", "They are all the same age"], "Layers settle one on top of another, so unless they were later folded or flipped, the lowest layer was laid down first."],
        ["גאולוגית מוצאת שלוש שכבות של סלע משקע שלא הופרעו. איזו שכבה היא בדרך כלל העתיקה ביותר?", "השכבה התחתונה", ["השכבה העליונה", "השכבה האמצעית", "כולן באותו גיל"], "שכבות שוקעות זו על גבי זו, ולכן אם הן לא קומטו או התהפכו מאוחר יותר, השכבה הנמוכה ביותר הונחה ראשונה."]],
      [["A drop of vinegar fizzes on a rock sample. Which rock is it most likely to be?", "Limestone", ["Granite", "Slate", "Quartzite", "Basalt"], "Limestone is made mostly of calcium carbonate, which reacts with acid and gives off bubbles of carbon dioxide. Granite, slate, quartzite and basalt hold no carbonate, so vinegar does nothing to them."],
        ["טיפת חומץ מבעבעת על דגימת סלע. איזה סלע זה כנראה?", "אבן גיר", ["גרניט", "צפחה", "קוורציט", "בזלת"], "אבן גיר עשויה בעיקר מסידן פחמתי, שמגיב עם חומצה ומשחרר בועות של פחמן דו־חמצני. בגרניט, בצפחה, בקוורציט ובבזלת אין סידן פחמתי, ולכן החומץ לא משפיע עליהם."]],
      [["Can a piece of granite ever become sandstone?", "Yes: grains of weathered granite can settle, be buried and be cemented into sandstone", ["No: an igneous rock can only stay igneous for ever, or be changed into a metamorphic rock by heat", "Yes, but only if the granite is first melted into lava and then cooled again", "No, because sandstone is made only from the shells of sea animals"], "This is the rock cycle. Weathering and erosion break granite into grains, rivers carry them away, they settle in layers, and over a long time they are buried, pressed and cemented into sandstone."],
        ["האם גרניט יכול אי פעם להפוך לאבן חול?", "כן: גרגרים מגרניט שבלה יכולים לשקוע, להיקבר ולהתלכד לאבן חול", ["לא: סלע יסוד יכול להישאר סלע יסוד לנצח, או להפוך לסלע מותמר בגלל חום", "כן, אבל רק אם הגרניט נמס קודם ללבה ואז מתקרר שוב", "לא, כי אבן חול עשויה רק מקונכיות של חיות ים"], "זהו מחזור הסלעים. בליה וסחיפה מפרקות גרניט לגרגרים, נהרות נושאים אותם, הם שוקעים בשכבות, ובמשך זמן רב הם נקברים, נדחסים ומתלכדים לאבן חול."]],
      [["A river carries sand grains from a mountain down to the sea. Which process is this?", "Erosion, the carrying away of loose pieces of rock", ["Weathering, the breaking up of rock where it lies", "Metamorphism, the change of rock by great heat and pressure", "Crystallisation, the growth of crystals as hot liquid cools"], "Erosion moves loose pieces of rock from one place to another. Weathering is what breaks the rock up in the first place, without moving it."],
        ["נהר נושא גרגרי חול מההר אל הים. איזה תהליך זה?", "סחיפה, הובלה של חלקי סלע מפוררים", ["בליה, התפוררות של סלע במקומו", "מטמורפוזה, שינוי של סלע בגלל חום ולחץ גדולים", "התגבשות, גידול של גבישים כשנוזל חם מתקרר"], "סחיפה מעבירה חלקי סלע מפוררים ממקום אחד למקום אחר. בליה היא מה שמפרק את הסלע מלכתחילה, בלי להזיז אותו."]],
    ],
    n: [[50, ["Mud settles on a lake floor at about 2 mm a year. How many years does it take to build a layer 10 cm thick?", "years", "10 cm = 100 mm, and 100 ÷ 2 = 50 years. Mud and sand pile up very slowly, so a thick layer of rock holds a very long history."],
      ["בוץ שוקע על קרקעית אגם בקצב של כ־2 מ״מ בשנה. כמה שנים נדרשות כדי שתיווצר שכבה בעובי 10 ס״מ?", "שנים", "10 ס״מ = 100 מ״מ, ו־100 ÷ 2 = 50 שנים. בוץ וחול נערמים לאט מאוד, ולכן שכבת סלע עבה שומרת היסטוריה ארוכה מאוד."]]],
  },
};
export default c;
