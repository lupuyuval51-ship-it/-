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
      [["Put your hand on your throat and hum. What do you feel?", "Vibrations", ["Heat only", "Nothing", "Wind"], "Your vocal cords vibrate to make the sound."],
        ["שימו יד על הגרון וזמזמו. מה מרגישים?", "רטט", ["רק חום", "כלום", "רוח"], "מיתרי הקול רוטטים כדי ליצור את הקול."]],
      [["Can sound travel through empty space (a vacuum)?", "No, sound needs a material to travel through", ["Yes, faster than in air", "Only loud sounds can", "Only at night"], "Sound is a vibration passed from particle to particle; in a vacuum there are no particles."],
        ["האם קול יכול לעבור בחלל ריק (ואקום)?", "לא, קול צריך חומר כדי לעבור בו", ["כן, מהר יותר מאשר באוויר", "רק קולות חזקים", "רק בלילה"], "קול הוא רטט שעובר מחלקיק לחלקיק; בריק אין חלקיקים."]],
    ],
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
    ],
  },
  a: {
    t: [
      ["Ultrasound", "sound above about 20,000 Hz, too high for people to hear", "על־קול", "קול מעל כ־20,000 הרץ, גבוה מכדי שבני אדם ישמעו"],
      ["Infrasound", "sound below about 20 Hz, too low for people to hear", "תת־קול", "קול מתחת לכ־20 הרץ, נמוך מכדי שבני אדם ישמעו"],
      ["Doppler effect", "the change in pitch heard when a sound source moves towards or away from you", "אפקט דופלר", "השינוי בגובה הצליל שנשמע כשמקור קול מתקרב או מתרחק"],
      ["Longitudinal wave", "a wave in which particles vibrate along the direction the wave travels, like sound", "גל אורכי", "גל שבו החלקיקים רוטטים לאורך כיוון ההתקדמות שלו, כמו קול"],
    ],
    q: [
      [["An ambulance siren sounds higher as it comes towards you and lower as it goes away. This is…", "the Doppler effect", ["an echo", "refraction of light", "resonance"], "Waves are squeezed in front of a moving source (higher frequency) and stretched behind it (lower)."],
        ["הסירנה של אמבולנס נשמעת גבוהה כשהוא מתקרב ונמוכה כשהוא מתרחק. זה…", "אפקט דופלר", ["הד", "שבירת אור", "תהודה"], "הגלים נדחסים לפני מקור שנע (תדירות גבוהה יותר) ומתמתחים מאחוריו (נמוכה יותר)."]],
      [["A bat hears its echo 0.1 s after a click. Sound travels 340 m/s. How far away is the insect?", "17 m", ["34 m", "3.4 m", "340 m"], "The sound goes there and back: 340 × 0.1 = 34 m in total, so the insect is 17 m away."],
        ["עטלף שומע את ההד 0.1 שנייה אחרי צקצוק. הקול נע 340 מ׳ לשנייה. כמה רחוק החרק?", "17 מ׳", ["34 מ׳", "3.4 מ׳", "340 מ׳"], "הקול הולך וחוזר: 340 × 0.1 = 34 מ׳ בסך הכול, ולכן החרק במרחק 17 מ׳."]],
      [["Why is ultrasound used to look at a baby before birth?", "It forms images from echoes without harmful radiation", ["It makes the baby louder", "It is a kind of X-ray", "It heats the baby gently"], "Ultrasound echoes from tissues build a picture, with no ionising radiation."],
        ["למה משתמשים בעל־קול כדי להסתכל על עובר לפני הלידה?", "הוא יוצר תמונות מהדים בלי קרינה מזיקה", ["הוא מגביר את קולו של העובר", "זה סוג של צילום רנטגן", "הוא מחמם את העובר בעדינות"], "הדים של על־קול מהרקמות בונים תמונה, בלי קרינה מייננת."]],
    ],
  },
};
export default c;
