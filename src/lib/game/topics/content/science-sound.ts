import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Vibration", "a quick back-and-forth movement that makes sound", "רטט", "תנועה מהירה הלוך ושוב שיוצרת קול"],
      ["Volume", "how loud or quiet a sound is", "עוצמת קול", "עד כמה קול חזק או שקט"],
      ["Echo", "a sound that bounces back off a hard surface", "הד", "קול שחוזר אחרי שפגע במשטח קשה"],
      ["Ear", "the body part that collects sound and sends signals to the brain", "אוזן", "איבר בגוף שקולט קול ושולח אותות למוח"],
    ],
    q: [
      [["Put your hand on your throat and hum. What do you feel?", "Vibrations", ["Only a little warmth", "Nothing at all", "A gentle wind"], "Your vocal cords vibrate to make the sound, and your fingers feel the shaking."],
        ["שימו יד על הגרון וזמזמו. מה מרגישים?", "רטט", ["רק קצת חום", "שום דבר בכלל", "רוח עדינה"], "מיתרי הקול רוטטים כדי ליצור את הקול, והאצבעות מרגישות את הרעידות."]],
      [["Can sound travel through empty space (a vacuum)?", "No, sound needs a material to travel through", ["Yes, it travels even faster there than in air", "Only very loud sounds, such as explosions, can", "Yes, as long as the source is very close"], "Sound is a vibration passed from particle to particle; in a vacuum there are no particles, so space is completely silent."],
        ["האם קול יכול לעבור בחלל ריק (ואקום)?", "לא, קול צריך חומר כדי לעבור בו", ["כן, הוא עובר שם אפילו מהר יותר מאשר באוויר", "רק קולות חזקים מאוד, כמו פיצוצים", "כן, אם מקור הקול קרוב מאוד"], "קול הוא רטט שעובר מחלקיק לחלקיק; בריק אין חלקיקים, ולכן בחלל שורקת דממה מוחלטת."]],
      [["You hit a drum harder. How does its sound change?", "It gets louder", ["It gets much higher in pitch, like a whistle", "It gets quieter, because the skin is pushed down", "It does not change at all"], "A harder hit makes the drum skin vibrate in a bigger way, and a bigger vibration means a louder sound. The pitch stays about the same."],
        ["מכים בתוף חזק יותר. איך משתנה הצליל שלו?", "הוא נעשה חזק יותר", ["הוא נעשה גבוה הרבה יותר, כמו שריקה", "הוא נעשה שקט יותר, כי העור נלחץ כלפי מטה", "הוא לא משתנה בכלל"], "מכה חזקה יותר גורמת לעור התוף לרטוט בתנודה גדולה יותר, ותנודה גדולה פירושה קול חזק יותר. גובה הצליל נשאר בערך אותו דבר."]],
      [["You watch fireworks far away. You see the flash first and hear the bang a moment later. Why?", "Light travels much faster than sound", ["The firework makes the sound after the light", "Our eyes work faster than our ears", "The air blocks sound for a few seconds"], "Light covers about 300,000 kilometres in a single second, while sound covers only about 340 metres, so the flash reaches you first."],
        ["צופים בזיקוקים מרחוק. רואים קודם את ההבזק ושומעים את הבום רגע אחר כך. למה?", "האור נע מהר הרבה יותר מהקול", ["הזיקוק יוצר את הקול רק אחרי האור", "העיניים שלנו עובדות מהר יותר מהאוזניים", "האוויר חוסם את הקול למשך כמה שניות"], "האור עובר כ־300,000 ק״מ בשנייה אחת, והקול עובר רק כ־340 מטרים, ולכן ההבזק מגיע אליכם קודם."]],
      [["Where would you hear the clearest echo?", "In a large empty hall with hard walls", ["In a small room full of curtains and soft sofas", "In a field with no walls or hills nearby", "Under a thick, warm blanket"], "An echo is sound that bounces off a hard surface and comes back. Soft things such as curtains and sofas soak the sound up, and in an open field nothing sends it back."],
        ["איפה תשמעו את ההד הברור ביותר?", "באולם גדול וריק עם קירות קשים", ["בחדר קטן מלא וילונות וספות רכות", "בשדה שאין בו קירות או גבעות בסביבה", "מתחת לשמיכה עבה וחמה"], "הד הוא קול שמקפץ ממשטח קשה וחוזר אליכם. חומרים רכים כמו וילונות וספות סופגים את הקול, ובשדה פתוח אין דבר שיחזיר אותו."]],
    ],
    s: [[["Making a sound travel to your ear, in order", "A guitar string is plucked and starts to vibrate", "The vibrating string pushes the air and starts a sound wave", "The sound wave travels through the air to your ear", "The wave makes your eardrum vibrate", "Your brain understands the signal as a sound"],
      ["איך קול מגיע אל האוזן, לפי הסדר", "פורטים על מיתר גיטרה והוא מתחיל לרטוט", "המיתר הרוטט דוחף את האוויר ויוצר גל קול", "גל הקול עובר באוויר עד האוזן", "הגל גורם לעור התוף לרטוט", "המוח מבין את האות כקול"]]],
  },
  i: {
    t: [
      ["Pitch", "how high or low a sound is, set by how fast the source vibrates", "גובה הצליל", "עד כמה צליל גבוה או נמוך, נקבע לפי מהירות הרטט של המקור"],
      ["Frequency", "the number of vibrations per second, measured in hertz (Hz)", "תדירות", "מספר התנודות בשנייה, נמדד בהרץ (Hz)"],
      ["Amplitude", "the size of a vibration; bigger means louder", "משרעת", "גודל התנודה; גדולה יותר פירושה קול חזק יותר"],
      ["Decibel", "the unit used to measure how loud a sound is", "דציבל", "היחידה שבה מודדים עד כמה קול חזק"],
    ],
    q: [
      [["A guitar string is tightened. What happens to its note?", "It gets higher", ["It gets lower", "It gets quieter only", "Nothing changes"], "A tighter string vibrates faster, so the frequency — and the pitch — rises."],
        ["מותחים מיתר של גיטרה. מה קורה לצליל?", "הוא נעשה גבוה יותר", ["הוא נעשה נמוך יותר", "רק שקט יותר", "שום דבר לא משתנה"], "מיתר מתוח יותר רוטט מהר יותר, ולכן התדירות — וגובה הצליל — עולים."]],
      [["Sound travels fastest through…", "steel", ["air", "water", "a vacuum"], "Sound moves about 340 m/s in air, about 1,500 m/s in water and around 5,000 m/s or more in steel."],
        ["קול עובר הכי מהר דרך…", "פלדה", ["אוויר", "מים", "ריק"], "קול נע כ־340 מ׳ לשנייה באוויר, כ־1,500 מ׳ לשנייה במים וכ־5,000 מ׳ לשנייה ויותר בפלדה."]],
      [["A ruler is pressed on a desk, its free end is pushed down and let go, and it buzzes. You slide it so that less of it sticks out over the edge. What happens to the buzz?", "The pitch rises, because a shorter part vibrates faster", ["The pitch gets lower, because there is less ruler left to move", "The pitch stays the same, because it is still the same ruler", "The buzz stops, because a short ruler cannot vibrate"], "The shorter the free end, the faster it vibrates, so its frequency and its pitch go up. Short strings and short pipes make high notes for the same reason."],
        ["מצמידים סרגל לשולחן, מכופפים את הקצה הבולט ומשחררים, והסרגל מזמזם. מחליקים אותו כך שפחות ממנו בולט מעבר לקצה. מה קורה לזמזום?", "גובה הצליל עולה, כי חלק קצר רוטט מהר יותר", ["גובה הצליל יורד, כי נשאר פחות סרגל שיכול לנוע", "גובה הצליל נשאר אותו דבר, כי זה עדיין אותו סרגל", "הזמזום נפסק, כי סרגל קצר לא יכול לרטוט"], "ככל שהקצה החופשי קצר יותר, הוא רוטט מהר יותר, ולכן התדירות וגובה הצליל עולים. מיתרים קצרים וצינורות קצרים משמיעים צלילים גבוהים מאותה סיבה."]],
      [["Why is it a good idea to turn down the volume of your headphones?", "Loud sound can permanently damage the hair cells in the ear", ["It wears out the battery and the speakers much faster", "It makes sound reach the brain more slowly", "It does no harm, because the ear repairs any damage within a few days"], "Tiny hair cells in the inner ear turn vibrations into signals for the brain. Very loud sound, or loud sound for a long time, destroys them, and the human ear cannot grow them back."],
        ["למה כדאי להנמיך את עוצמת הקול באוזניות?", "קול חזק עלול לפגוע לצמיתות בתאי השיער שבאוזן", ["זה שוחק את הסוללה ואת הרמקולים הרבה יותר מהר", "זה גורם לקול להגיע אל המוח לאט יותר", "זה לא מזיק, כי האוזן מתקנת כל נזק בתוך כמה ימים"], "תאי שיער זעירים באוזן הפנימית הופכים רטט לאותות למוח. קול חזק מאוד, או קול חזק לאורך זמן, הורס אותם, והאוזן האנושית לא יכולה לגדל אותם מחדש."]],
    ],
    n: [[100, ["A sound has a frequency of 50 Hz. How many vibrations does its source make in 2 seconds?", "", "50 Hz means 50 vibrations every second, so in 2 seconds there are 50 × 2 = 100 vibrations.", "Multiply the vibrations in one second by the number of seconds."],
      ["לקול יש תדירות של 50 הרץ. כמה רטטים עושה מקור הקול ב־2 שניות?", "", "50 הרץ פירושו 50 רטטים בכל שנייה, ולכן ב־2 שניות יש 50 × 2 = 100 רטטים.", "מכפילים את מספר הרטטים בשנייה אחת במספר השניות."]]],
  },
  a: {
    t: [
      ["Ultrasound", "sound above about 20,000 Hz, too high for people to hear", "על־קול", "קול מעל כ־20,000 הרץ, גבוה מכדי שבני אדם ישמעו"],
      ["Infrasound", "sound below about 20 Hz, too low for people to hear", "תת־קול", "קול מתחת לכ־20 הרץ, נמוך מכדי שבני אדם ישמעו"],
      ["Doppler effect", "the change in pitch heard when a sound source moves towards or away from you", "אפקט דופלר", "השינוי בגובה הצליל שנשמע כשמקור קול מתקרב או מתרחק"],
      ["Longitudinal wave", "a wave in which particles vibrate along the direction the wave travels, like sound", "גל אורכי", "גל שבו החלקיקים רוטטים לאורך כיוון ההתקדמות שלו, כמו קול"],
    ],
    q: [
      [["An ambulance siren sounds higher as it comes towards you and lower as it goes away. This is…", "the Doppler effect", ["an echo from the buildings", "refraction of light", "resonance"], "Waves are squeezed in front of a moving source (higher frequency) and stretched behind it (lower)."],
        ["הסירנה של אמבולנס נשמעת גבוהה כשהוא מתקרב ונמוכה כשהוא מתרחק. זה…", "אפקט דופלר", ["הד מהבניינים", "שבירת אור", "תהודה"], "הגלים נדחסים לפני מקור שנע (תדירות גבוהה יותר) ומתמתחים מאחוריו (נמוכה יותר)."]],
      [["A bat hears its echo 0.1 s after a click. Sound travels 340 m/s. How far away is the insect?", "17 m", ["34 m", "3.4 m", "340 m"], "The sound goes there and back: 340 × 0.1 = 34 m in total, so the insect is 17 m away."],
        ["עטלף שומע את ההד 0.1 שנייה אחרי צקצוק. הקול נע 340 מ׳ לשנייה. כמה רחוק החרק?", "17 מ׳", ["34 מ׳", "3.4 מ׳", "340 מ׳"], "הקול הולך וחוזר: 340 × 0.1 = 34 מ׳ בסך הכול, ולכן החרק במרחק 17 מ׳."]],
      [["Why is ultrasound used to look at a baby before birth?", "It forms images from echoes without harmful radiation", ["It is a gentle kind of X-ray that passes through the body", "It makes the baby's heartbeat louder so doctors can hear it", "It shines a very bright light through the mother's body"], "Ultrasound echoes from tissues build a picture, with no ionising radiation."],
        ["למה משתמשים בעל־קול כדי להסתכל על עובר לפני הלידה?", "הוא יוצר תמונות מהדים בלי קרינה מזיקה", ["זה סוג עדין של צילום רנטגן שעובר דרך הגוף", "הוא מגביר את פעימות הלב של העובר כדי שהרופאים ישמעו אותן", "הוא מאיר אור חזק מאוד דרך גוף האם"], "הדים של על־קול מהרקמות בונים תמונה, בלי קרינה מייננת."]],
      [["A dog whistle makes a sound at 25,000 Hz. People hear almost nothing, yet dogs come running. Why?", "Its pitch is higher than people can hear, but not too high for dogs", ["The sound is so low in pitch that people cannot hear it but dogs can", "Dogs are closer to the ground, so the sound reaches them first", "Sound cannot travel through the air to people, only to dogs"], "Human hearing stops at about 20,000 Hz, but dogs can hear up to about 45,000 Hz. A whistle at 25,000 Hz is ultrasound for us and a clear signal for a dog."],
        ["משרוקית לכלבים משמיעה צליל של 25,000 הרץ. בני אדם כמעט לא שומעים אותה, ובכל זאת כלבים באים בריצה. למה?", "גובה הצליל שלה גבוה ממה שבני אדם שומעים, אבל לא גבוה מדי לכלבים", ["הצליל נמוך כל כך שבני אדם לא שומעים אותו, אבל כלבים שומעים גם צלילים נמוכים מאוד","כלבים קרובים יותר לרצפה, ולכן הצליל מגיע אליהם קודם", "קול לא יכול לעבור באוויר אל בני אדם, רק אל כלבים"], "השמיעה האנושית נעצרת בכ־20,000 הרץ, אבל כלבים שומעים עד כ־45,000 הרץ. משרוקית של 25,000 הרץ היא על־קול עבורנו ואות ברור עבור כלב."]],
      [["How do noise-cancelling headphones reduce the rumble of an aircraft engine?", "They add an opposite sound wave that cancels the noise", ["They press so tightly that no air can vibrate against the ear", "They turn the noise into a higher pitch that people cannot hear", "They only block the sound with a thick layer of foam"], "A microphone picks up the noise and the headphones play a wave with the opposite shape. When a wave meets its opposite, the two cancel out, so much of the steady, low rumble disappears."],
        ["איך אוזניות לביטול רעש מפחיתות את זמזום המנוע במטוס?", "הן מוסיפות גל קול הפוך שמבטל את הרעש", ["הן לוחצות חזק כל כך שאוויר לא יכול לרטוט ליד האוזן", "הן הופכות את הרעש לצליל גבוה שבני אדם לא שומעים", "הן רק חוסמות את הקול בעזרת שכבה עבה של ספוג"], "מיקרופון קולט את הרעש, והאוזניות משמיעות גל בצורה הפוכה. כשגל פוגש את ההפוך לו, השניים מבטלים זה את זה, ולכן חלק גדול מהרעש הנמוך והקבוע נעלם."]],
    ],
    n: [[2, ["In air, a note travels at 340 m/s and has a frequency of 170 Hz. What is its wavelength, the length of one wave? (Wavelength = speed ÷ frequency.)", "m", "Wavelength = speed ÷ frequency = 340 ÷ 170 = 2 m. A higher note has a shorter wavelength.", "Divide the speed by the frequency."],
      ["באוויר צליל נע במהירות 340 מ׳ לשנייה ויש לו תדירות של 170 הרץ. מהו אורך הגל שלו, האורך של גל אחד? (אורך גל = מהירות ÷ תדירות.)", "מ׳", "אורך גל = מהירות ÷ תדירות = 340 ÷ 170 = 2 מ׳. לצליל גבוה יותר יש אורך גל קצר יותר.", "מחלקים את המהירות בתדירות."]]],
    s: [[["How a bat catches an insect in the dark, in order", "The bat sends out a very high squeak", "The sound travels through the air and hits the insect", "An echo bounces back to the bat", "The bat's brain uses the delay of the echo to work out the distance", "The bat flies to the insect and catches it"],
      ["איך עטלף תופס חרק בחושך, לפי הסדר", "העטלף משמיע צרחה גבוהה מאוד", "הקול עובר באוויר ופוגע בחרק", "הד חוזר אל העטלף", "המוח של העטלף משתמש בזמן ההמתנה להד כדי לחשב את המרחק", "העטלף עף אל החרק ותופס אותו"]]],
  },
};
export default c;
