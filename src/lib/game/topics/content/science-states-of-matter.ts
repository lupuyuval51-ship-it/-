import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Solid", "a state of matter with its own fixed shape and volume, like ice", "מוצק", "מצב צבירה עם צורה ונפח קבועים משלו, כמו קרח"],
      ["Liquid", "a state of matter that flows and can be poured, like water or milk", "נוזל", "מצב צבירה שזורם ואפשר לשפוך אותו, כמו מים או חלב"],
      ["Gas", "a state of matter that you usually cannot see, like the air around you", "גז", "מצב צבירה שבדרך כלל אי אפשר לראות, כמו האוויר שסביבנו"],
      ["Melting", "a change from solid to liquid when something is heated", "התכה", "מעבר ממוצק לנוזל כשמחממים"],
      ["Freezing", "a change from liquid to solid when something is cooled", "קיפאון", "מעבר מנוזל למוצק כשמקררים"],
    ],
    q: [
      [["Ice cream left in the sun turns runny. Which change is this?", "Melting", ["Freezing", "Evaporation", "Condensation"], "The heat turns the solid ice cream into a liquid. A change from solid to liquid is called melting."],
        ["גלידה שנשארה בשמש הופכת לנוזלית. איזה שינוי זה?", "התכה", ["קיפאון", "התאדות", "עיבוי"], "החום הופך את הגלידה המוצקה לנוזל. מעבר ממוצק לנוזל נקרא התכה."]],
      [["At what temperature does pure water freeze at sea level?", "0 °C", ["100 °C", "10 °C", "−100 °C"], "Pure water freezes (and ice melts) at 0 °C at normal air pressure."],
        ["באיזו טמפרטורה קופאים מים טהורים בגובה פני הים?", "0 °C", ["100 °C", "10 °C", "−100 °C"], "מים טהורים קופאים (וקרח נמס) ב־0 °C בלחץ אוויר רגיל."]],
      [["You pour juice from a bottle into a glass. What happens to the juice?", "Its shape changes, but its amount stays the same", ["It stays in the exact shape it had inside the bottle", "It spreads out to fill the whole glass, like a gas", "Half of it turns into a gas and floats away"], "A liquid flows and takes the shape of its container, but it does not shrink or spread out: the amount of juice (its volume) stays the same."],
        ["שופכים מיץ מבקבוק לכוס. מה קורה למיץ?", "הצורה שלו משתנה, אבל הכמות נשארת אותה כמות", ["הוא שומר על הצורה המדויקת שהייתה לו בתוך הבקבוק", "הוא מתפשט וממלא את כל הכוס, כמו גז", "חצי ממנו הופך לגז ועף"], "נוזל זורם ומקבל את צורת הכלי, אבל הוא לא מתכווץ ולא מתפשט: כמות המיץ (הנפח שלו) נשארת זהה."]],
      [["A balloon is filled with air. Which describes the air inside?", "It spreads out to fill all the space in the balloon", ["It lies in a heap at the bottom, like sand in a bag", "It stays packed in a small ball in the middle of the balloon", "It has turned into a liquid"], "Air is a gas. Gas particles move freely and spread out until they fill the whole space they are in, so the air fills every part of the balloon."],
        ["ממלאים בלון באוויר. מה מתאר את האוויר שבפנים?", "הוא מתפשט וממלא את כל החלל שבבלון", ["הוא שוכב בערימה בתחתית, כמו חול בשקית", "הוא נשאר דחוס בכדור קטן באמצע הבלון", "הוא הפך לנוזל"], "אוויר הוא גז. חלקיקי גז נעים בחופשיות ומתפשטים עד שהם ממלאים את כל החלל שבו הם נמצאים, ולכן האוויר ממלא כל חלק של הבלון."]],
    ],
    s: [[["A block of ice turns into steam, in order", "A block of ice is heated", "The ice melts into liquid water", "The water is heated until it boils", "Steam, a gas, rises from the water"],
      ["גוש קרח הופך לאדים, לפי הסדר", "מחממים גוש קרח", "הקרח נמס והופך למים נוזליים", "ממשיכים לחמם את המים עד שהם רותחים", "אדים, שהם גז, עולים מהמים"]]],
  },
  i: {
    t: [
      ["Evaporation", "a liquid slowly turning into gas at its surface, even below boiling point", "התאדות", "נוזל שהופך לאט לגז מפני השטח שלו, גם מתחת לנקודת הרתיחה"],
      ["Condensation", "a gas cooling and turning back into a liquid, as when clouds form high in the sky", "עיבוי", "גז שמתקרר והופך בחזרה לנוזל, כמו כשנוצרים עננים גבוה בשמיים"],
      ["Boiling point", "the temperature at which a liquid bubbles and turns into gas throughout", "נקודת רתיחה", "הטמפרטורה שבה נוזל מבעבע והופך לגז בכל נפחו"],
      ["Particles", "the tiny pieces, far too small to see, that all matter is made of", "חלקיקים", "החלקים הזעירים, קטנים מכדי לראות אותם, שמהם בנוי כל חומר"],
    ],
    q: [
      [["Why does a cold drink can get wet on the outside on a hot day?", "Water vapour in the air condenses on the cold can", ["Drink from inside seeps slowly through tiny holes in the metal", "The cold metal makes water come out of itself, like sweat", "Ice inside the can melts and runs down the outside"], "Air contains water vapour; it cools on the cold surface and condenses into droplets."],
        ["למה פחית שתייה קרה נרטבת מבחוץ ביום חם?", "אדי מים מהאוויר מתעבים על הפחית הקרה", ["משקה מבפנים מחלחל לאט דרך חורים זעירים במתכת", "המתכת הקרה מוציאה מים מעצמה, כמו זיעה", "קרח שבפנים נמס וזורם החוצה על דופן הפחית"], "באוויר יש אדי מים; הם מתקררים על המשטח הקר ומתעבים לטיפות."]],
      [["In which state are the particles packed most tightly and only vibrate in place?", "Solid", ["Liquid", "Gas", "All are the same"], "In a solid, particles are held in fixed positions and only vibrate; in liquids they slide past each other; in gases they fly freely."],
        ["באיזה מצב צבירה החלקיקים צפופים ביותר ורק רוטטים במקומם?", "מוצק", ["נוזל", "גז", "בכולם זה אותו דבר"], "במוצק החלקיקים מוחזקים במקומות קבועים ורק רוטטים; בנוזל הם מחליקים זה על פני זה; בגז הם נעים בחופשיות."]],
      [["A wet towel dries faster on a warm, windy day than on a cool, still one. Why?", "Warmth and wind both make the water evaporate faster", ["The wind shakes the water out of the cloth as tiny drops", "The warm air heats the water in the towel until it boils", "Only the warmth helps; the wind just makes the towel colder"], "In evaporation the fastest particles escape from the surface. Warmth gives more particles enough energy to escape, and wind carries the water vapour away so that more can follow. The water never needs to boil."],
        ["מגבת רטובה מתייבשת מהר יותר ביום חם עם רוח מאשר ביום קריר בלי רוח. למה?", "חום ורוח גורמים שניהם למים להתאדות מהר יותר", ["הרוח מנערת את המים מתוך הבד בטיפות זעירות מאוד", "האוויר החם מחמם את המים שבמגבת עד שהם רותחים", "רק החום עוזר; הרוח רק מקררת את המגבת"], "בהתאדות החלקיקים המהירים ביותר בורחים מפני השטח. חום נותן ליותר חלקיקים מספיק אנרגיה כדי לברוח, והרוח מרחיקה את אדי המים כך שעוד חלקיקים יכולים לצאת. המים לא צריכים לרתוח בכלל."]],
      [["What happens to the particles of a liquid when it is heated?", "They move faster", ["They grow bigger, so the liquid expands", "They stop moving and stick together", "They turn into different kinds of particles"], "Heat gives the particles more energy, so they move faster. The particles themselves do not change: they just spread a little further apart."],
        ["מה קורה לחלקיקים של נוזל כשמחממים אותו?", "הם נעים מהר יותר", ["הם גדלים, ולכן הנוזל מתפשט", "הם מפסיקים לנוע ונדבקים זה לזה", "הם הופכים לסוג אחר של חלקיקים"], "חום נותן לחלקיקים יותר אנרגיה, ולכן הם נעים מהר יותר. החלקיקים עצמם לא משתנים: הם רק מתרחקים מעט זה מזה."]],
      [["Why does ice float on liquid water?", "Ice is less dense than liquid water", ["Ice is colder than the water, and cold things float", "Ice particles are bigger than water particles", "Ice is made of water that has lost its weight"], "When water freezes it expands by about 9 %: the same particles take up more space, so a block of ice is less dense than the same amount of liquid water and floats."],
        ["למה קרח צף על מים נוזליים?", "קרח פחות צפוף ממים נוזליים", ["קרח קר יותר מהמים, ודברים קרים צפים", "החלקיקים של קרח גדולים מהחלקיקים של מים", "קרח עשוי ממים שאיבדו את המשקל שלהם"], "כשמים קופאים הם מתפשטים בכ־9%: אותם חלקיקים תופסים יותר מקום, ולכן גוש קרח פחות צפוף מאותה כמות של מים נוזליים והוא צף."]],
    ],
    n: [[100, ["At sea level, at what temperature does pure water boil?", "°C", "At normal air pressure, pure water boils at 100 °C. The Celsius scale was set up so that water freezes at 0 °C and boils at 100 °C."], ["בגובה פני הים, באיזו טמפרטורה רותחים מים טהורים?", "°C", "בלחץ אוויר רגיל, מים טהורים רותחים ב־100 °C. סולם צלזיוס נבנה כך שמים קופאים ב־0 °C ורותחים ב־100 °C."]]],
  },
  a: {
    t: [
      ["Sublimation", "a change straight from solid to gas without becoming liquid, as when frozen food slowly dries out in a freezer", "המראה", "מעבר ישיר ממוצק לגז בלי לעבור דרך נוזל, כמו כשמזון קפוא מתייבש לאט במקפיא"],
      ["Deposition", "a change straight from gas to solid, like frost forming on a window", "ריבוץ", "מעבר ישיר מגז למוצק, כמו כפור שנוצר על חלון"],
      ["Latent heat", "energy taken in or given out when a substance changes state, for example from solid to liquid", "חום כמוס", "אנרגיה שנקלטת או נפלטת כשחומר עובר ממצב צבירה אחד לאחר, למשל ממוצק לנוזל"],
      ["Plasma", "a state of matter made of electrically charged particles, as in a flash of lightning", "פלזמה", "מצב צבירה של חלקיקים טעונים חשמלית, כמו בהבזק של ברק"],
    ],
    q: [
      [["While ice is melting in a glass, its temperature…", "stays at 0 °C until all of it has melted", ["keeps rising slowly, a little every minute", "drops a little below 0 °C, because melting cools the glass", "quickly jumps to the temperature of the room"], "The heat taken in is used to break the solid apart (latent heat), so the temperature stays at 0 °C during melting."],
        ["בזמן שקרח נמס בכוס, הטמפרטורה שלו…", "נשארת 0 °C עד שכולו נמס", ["עולה בהתמדה, קצת בכל דקה", "יורדת מעט מתחת ל־0 °C, כי ההתכה מקררת", "קופצת במהירות לטמפרטורת החדר"], "החום שנקלט משמש לפירוק המבנה המוצק (חום כמוס), ולכן הטמפרטורה נשארת 0 °C בזמן ההתכה."]],
      [["High on a mountain, water boils at a lower temperature than at sea level because…", "the air pressure is lower", ["the air at the top is colder", "there is less gravity", "the water is purer"], "Boiling happens when the vapour pressure of the water equals the air pressure; lower pressure is reached at a lower temperature."],
        ["על הר גבוה, מים רותחים בטמפרטורה נמוכה יותר מאשר בגובה פני הים, כי…", "לחץ האוויר נמוך יותר", ["האוויר בפסגה קר יותר מלמטה", "יש פחות כוח משיכה", "המים טהורים יותר"], "רתיחה קורית כשלחץ האדים של המים שווה ללחץ האוויר; לחץ נמוך יותר מושג בטמפרטורה נמוכה יותר."]],
      [["Steam at 100 °C causes worse burns than boiling water at 100 °C. Why?", "Steam releases extra latent heat when it condenses on the skin", ["Steam is made of tiny drops that are hotter than 100 °C", "Steam particles move faster, so they hit the skin much harder than water does", "Steam is made of a different substance from water"], "When steam condenses into water on the skin it gives out its latent heat on top of the heat of hot water."],
        ["אדים ב־100 °C גורמים לכוויות קשות יותר ממים רותחים ב־100 °C. למה?", "האדים משחררים חום כמוס נוסף כשהם מתעבים על העור", ["האדים מורכבים מטיפות זעירות שחמות מ־100 °C", "חלקיקי האדים נעים מהר יותר, ולכן פוגעים בעור חזק יותר ממים", "אדים עשויים מחומר שונה ממים"], "כשהאדים מתעבים למים על העור הם פולטים את החום הכמוס שלהם, בנוסף לחום של המים החמים."]],
      [["Dry ice, solid carbon dioxide, left on a table slowly shrinks into a cold fog without leaving any puddle. What is this change called?", "Sublimation", ["Evaporation", "Condensation", "Melting"], "Dry ice goes straight from solid to gas without becoming a liquid first. That is sublimation. The white fog is tiny drops of water that condense from the air around the very cold gas."],
        ["קרח יבש, פחמן דו־חמצני מוצק, נשאר על שולחן ומצטמק לאט לערפל קר בלי להשאיר שלולית. איך נקרא השינוי הזה?", "המראה", ["התאדות", "עיבוי", "התכה"], "קרח יבש עובר ישר ממוצק לגז בלי להפוך קודם לנוזל. זו המראה. הערפל הלבן הוא טיפות מים זעירות שמתעבות מהאוויר סביב הגז הקר מאוד."]],
      [["Which of these is made mostly of plasma?", "The Sun", ["A cloud", "Liquid mercury", "Steam"], "Plasma is a gas so hot that its atoms break into charged particles. The Sun and other stars are plasma, and so is the glow of lightning. Clouds are drops of water and steam is a gas."],
        ["איזה מהבאים עשוי בעיקר מפלזמה?", "השמש", ["ענן", "כספית נוזלית", "אדי מים"], "פלזמה היא גז חם כל כך שהאטומים שלו מתפרקים לחלקיקים טעונים. השמש וכוכבים אחרים הם פלזמה, וכך גם הזוהר של ברק. ענן הוא טיפות מים, ואדי מים הם גז."]],
      [["Food cooks faster in a pressure cooker, a pot with a tightly sealed lid. Why?", "The water inside boils at a higher temperature, about 120 °C", ["The water inside boils at a lower temperature, so it bubbles sooner", "The sealed lid stops the water from boiling, so all of its heat goes into the food", "The pot is made of thicker metal, which makes any water boil hotter"], "The sealed lid traps the steam, so the pressure inside rises, and the higher the pressure, the higher the temperature at which water boils. At about 120 °C instead of 100 °C, food cooks faster. On a mountain the opposite happens."],
        ["אוכל מתבשל מהר יותר בסיר לחץ, סיר שהמכסה שלו אטום היטב. למה?", "המים שבתוכו רותחים בטמפרטורה גבוהה יותר, בערך 120 °C", ["המים שבתוכו רותחים בטמפרטורה נמוכה יותר, ולכן מבעבעים מוקדם יותר", "המכסה האטום מונע מהמים לרתוח, ולכן כל החום שלהם עובר לאוכל", "הסיר עשוי ממתכת עבה יותר, והיא גורמת לכל מים לרתוח בחום גבוה יותר"], "המכסה האטום כולא את האדים, ולכן הלחץ בפנים עולה, וככל שהלחץ גבוה יותר, הטמפרטורה שבה מים רותחים גבוהה יותר. בכ־120 °C במקום 100 °C האוכל מתבשל מהר יותר. על הר קורה ההפך."]],
    ],
    n: [[1670, ["Melting 1 gram of ice at 0 °C takes about 334 joules of energy. How many joules are needed to melt 5 grams?", "J", "334 × 5 = 1,670, so melting 5 g of ice at 0 °C takes about 1,670 joules, without any rise in temperature.", "Multiply the energy for 1 gram by 5."],
      ["התכה של גרם אחד של קרח ב־0 °C דורשת כ־334 ג׳אול של אנרגיה. כמה ג׳אול דרושים להמסת 5 גרם?", "J", "334 × 5 = 1,670, ולכן התכה של 5 גרם קרח ב־0 °C דורשת כ־1,670 ג׳אול, בלי שום עלייה בטמפרטורה.", "מכפילים את האנרגיה של גרם אחד ב־5."], 5]],
  },
};
export default c;
