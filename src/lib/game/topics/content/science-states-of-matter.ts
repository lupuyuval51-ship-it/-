import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Solid", "a state of matter with its own fixed shape and volume, like ice", "מוצק", "מצב צבירה עם צורה ונפח קבועים משלו, כמו קרח"],
      ["Liquid", "a state of matter that flows and takes the shape of its container, like water", "נוזל", "מצב צבירה שזורם ומקבל את צורת הכלי שבו הוא נמצא, כמו מים"],
      ["Gas", "a state of matter that spreads out to fill any space, like steam", "גז", "מצב צבירה שמתפשט וממלא כל חלל, כמו אדי מים"],
      ["Melting", "a change from solid to liquid when something is heated", "התכה", "מעבר ממוצק לנוזל כשמחממים"],
      ["Freezing", "a change from liquid to solid when something is cooled", "קיפאון", "מעבר מנוזל למוצק כשמקררים"],
    ],
    q: [
      [["Ice cream left in the sun turns runny. Which change is this?", "Melting", ["Freezing", "Evaporation", "Condensation"], "Heat turns the solid into a liquid: that is melting."],
        ["גלידה שנשארה בשמש הופכת לנוזלית. איזה שינוי זה?", "התכה", ["קיפאון", "התאדות", "עיבוי"], "החום הופך את המוצק לנוזל: זו התכה."]],
      [["At what temperature does pure water freeze at sea level?", "0 °C", ["100 °C", "10 °C", "−100 °C"], "Pure water freezes (and ice melts) at 0 °C at normal air pressure."],
        ["באיזו טמפרטורה קופאים מים טהורים בגובה פני הים?", "0 °C", ["100 °C", "10 °C", "−100 °C"], "מים טהורים קופאים (וקרח נמס) ב־0 °C בלחץ אוויר רגיל."]],
    ],
  },
  i: {
    t: [
      ["Evaporation", "a liquid slowly turning into gas at its surface, even below boiling point", "התאדות", "נוזל שהופך לאט לגז מפני השטח שלו, גם מתחת לנקודת הרתיחה"],
      ["Condensation", "a gas cooling and turning back into a liquid, like drops on a cold glass", "עיבוי", "גז שמתקרר והופך בחזרה לנוזל, כמו טיפות על כוס קרה"],
      ["Boiling point", "the temperature at which a liquid bubbles and turns into gas throughout", "נקודת רתיחה", "הטמפרטורה שבה נוזל מבעבע והופך לגז בכל נפחו"],
      ["Particles", "the tiny pieces that all matter is made of; they move faster when heated", "חלקיקים", "החלקים הזעירים שמהם בנוי כל חומר; הם נעים מהר יותר כשמחממים"],
    ],
    q: [
      [["Why does a cold drink can get wet on the outside on a hot day?", "Water vapour in the air condenses on the cold can", ["Water leaks through the metal", "The can sweats like skin", "The ice inside melts through the can"], "Air contains water vapour; it cools on the cold surface and condenses into droplets."],
        ["למה פחית שתייה קרה נרטבת מבחוץ ביום חם?", "אדי מים מהאוויר מתעבים על הפחית הקרה", ["מים מחלחלים דרך המתכת", "הפחית מזיעה כמו עור", "הקרח שבפנים נמס דרך הפחית"], "באוויר יש אדי מים; הם מתקררים על המשטח הקר ומתעבים לטיפות."]],
      [["In which state are the particles packed most tightly and only vibrate in place?", "Solid", ["Liquid", "Gas", "All are the same"], "In a solid, particles are held in fixed positions and only vibrate; in liquids they slide past each other; in gases they fly freely."],
        ["באיזה מצב צבירה החלקיקים צפופים ביותר ורק רוטטים במקומם?", "מוצק", ["נוזל", "גז", "בכולם זה אותו דבר"], "במוצק החלקיקים מוחזקים במקומות קבועים ורק רוטטים; בנוזל הם מחליקים זה על פני זה; בגז הם נעים בחופשיות."]],
    ],
    n: [[100, ["At sea level, at what temperature does pure water boil?", "°C", "At normal air pressure, pure water boils at 100 °C."], ["בגובה פני הים, באיזו טמפרטורה רותחים מים טהורים?", "°C", "בלחץ אוויר רגיל, מים טהורים רותחים ב־100 °C."]]],
  },
  a: {
    t: [
      ["Sublimation", "a change straight from solid to gas without becoming liquid, like dry ice", "המראה", "מעבר ישיר ממוצק לגז בלי לעבור דרך נוזל, כמו קרח יבש"],
      ["Deposition", "a change straight from gas to solid, like frost forming on a window", "ריבוץ", "מעבר ישיר מגז למוצק, כמו כפור שנוצר על חלון"],
      ["Latent heat", "energy taken in or given out during a change of state while the temperature stays the same", "חום כמוס", "אנרגיה שנקלטת או נפלטת בזמן מעבר בין מצבי צבירה בזמן שהטמפרטורה לא משתנה"],
      ["Plasma", "a very hot state of matter made of charged particles, found in stars and lightning", "פלזמה", "מצב צבירה חם מאוד של חלקיקים טעונים, שנמצא בכוכבים ובברקים"],
    ],
    q: [
      [["While ice is melting in a glass, its temperature…", "stays at 0 °C until all of it has melted", ["rises steadily", "falls below 0 °C", "jumps to 100 °C"], "The heat taken in is used to break the solid apart (latent heat), so the temperature stays at 0 °C during melting."],
        ["בזמן שקרח נמס בכוס, הטמפרטורה שלו…", "נשארת 0 °C עד שכולו נמס", ["עולה בהתמדה", "יורדת מתחת ל־0 °C", "קופצת ל־100 °C"], "החום שנקלט משמש לפירוק המבנה המוצק (חום כמוס), ולכן הטמפרטורה נשארת 0 °C בזמן ההתכה."]],
      [["High on a mountain, water boils at a lower temperature than at sea level because…", "the air pressure is lower", ["the air is colder", "there is less gravity", "the water is purer"], "Boiling happens when the vapour pressure of the water equals the air pressure; lower pressure is reached at a lower temperature."],
        ["על הר גבוה, מים רותחים בטמפרטורה נמוכה יותר מאשר בגובה פני הים, כי…", "לחץ האוויר נמוך יותר", ["האוויר קר יותר", "יש פחות כוח משיכה", "המים טהורים יותר"], "רתיחה קורית כשלחץ האדים של המים שווה ללחץ האוויר; לחץ נמוך יותר מושג בטמפרטורה נמוכה יותר."]],
      [["Steam at 100 °C causes worse burns than boiling water at 100 °C. Why?", "Steam releases extra latent heat when it condenses on the skin", ["Steam is hotter than 100 °C", "Steam moves faster", "Water cannot burn skin"], "When steam condenses into water on the skin it gives out its latent heat on top of the heat of hot water."],
        ["אדים ב־100 °C גורמים לכוויות קשות יותר ממים רותחים ב־100 °C. למה?", "האדים משחררים חום כמוס נוסף כשהם מתעבים על העור", ["אדים חמים יותר מ־100 °C", "אדים נעים מהר יותר", "מים לא יכולים לכוות"], "כשהאדים מתעבים למים על העור הם פולטים את החום הכמוס שלהם, בנוסף לחום של המים החמים."]],
    ],
  },
};
export default c;
