import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Percussion", "instruments played by hitting, shaking or scraping, like drums", "כלי הקשה", "כלים שמנגנים בהם בהקשה, בניעור או בגירוד, כמו תופים"],
      ["Strings", "instruments whose sound comes from stretched, vibrating cords, like the violin and harp", "כלי מיתר", "כלים שמשמיעים צליל כשהמיתרים שלהם רוטטים, כמו כינור ונבל"],
      ["Woodwind", "wind instruments like the flute and clarinet, first made of wood", "כלי נשיפה מעץ", "כלי נשיפה כמו חליל וקלרינט, שנעשו במקור מעץ"],
      ["Brass", "metal wind instruments played by buzzing the lips, like the trumpet", "כלי נשיפה ממתכת", "כלים ממתכת שנושפים בהם תוך רטט של השפתיים, כמו חצוצרה"],
    ],
    q: [
      [["To which family does the piano belong in many school books?", "Both strings and percussion: hammers strike strings", ["Brass", "Woodwind", "None, it makes no sound"], "Pressing a key makes a felt hammer hit a string, so it is often grouped with both."],
        ["לאיזו משפחה משייכים את הפסנתר בספרי לימוד רבים?", "גם לכלי מיתר וגם לכלי הקשה: פטישים מכים במיתרים", ["כלי נשיפה ממתכת", "כלי נשיפה מעץ", "לאף משפחה, הוא לא משמיע צליל"], "לחיצה על קליד גורמת לפטיש לבד להכות במיתר, ולכן משייכים אותו לעיתים קרובות לשתי המשפחות."]],
      [["How do you make a sound on a violin?", "Draw a bow across the strings or pluck them", ["Blow into it", "Hit it with a stick", "Press a key"], "The bow rubs the strings and makes them vibrate."],
        ["איך משמיעים צליל בכינור?", "מעבירים קשת על המיתרים או פורטים עליהם", ["נושפים לתוכו", "מכים בו במקל", "לוחצים על קליד"], "הקשת משפשפת את המיתרים וגורמת להם לרטוט."]],
    ],
  },
  i: {
    t: [
      ["Orchestra", "a large group of musicians playing strings, woodwind, brass and percussion", "תזמורת", "הרכב גדול של נגנים על כלי מיתר, נשיפה והקשה"],
      ["Conductor", "the person who leads an orchestra with a baton", "מנצח", "האדם שמוביל את התזמורת בעזרת שרביט"],
      ["Choir", "a group of singers", "מקהלה", "קבוצה של זמרים"],
      ["Duet", "a piece for two performers", "דואט", "יצירה לשני מבצעים"],
    ],
    q: [
      [["Why does a double bass sound lower than a violin?", "Its strings are longer and thicker, so they vibrate more slowly", ["It is played louder", "It is made of metal", "It has more strings"], "Longer, heavier strings vibrate at a lower frequency, giving a lower pitch."],
        ["למה קונטרבס נשמע נמוך יותר מכינור?", "המיתרים שלו ארוכים ועבים יותר, ולכן רוטטים לאט יותר", ["מנגנים בו חזק יותר", "הוא עשוי ממתכת", "יש לו יותר מיתרים"], "מיתרים ארוכים וכבדים יותר רוטטים בתדירות נמוכה יותר, וזה נותן צליל נמוך יותר."]],
      [["Is a saxophone, made of brass, a brass instrument?", "No — it uses a reed, so it is a woodwind", ["Yes, because it is metal", "It is a string instrument", "It is percussion"], "Families are decided by how sound is made: a reed makes the saxophone a woodwind."],
        ["האם הסקסופון, שעשוי מפליז, הוא כלי נשיפה ממתכת?", "לא — יש לו פית עם עלה (קנה), ולכן הוא שייך לכלי הנשיפה מעץ", ["כן, כי הוא עשוי מתכת", "הוא כלי מיתר", "הוא כלי הקשה"], "המשפחה נקבעת לפי הדרך שבה נוצר הצליל: העלה הופך את הסקסופון לכלי נשיפה מעץ."]],
    ],
  },
  a: {
    t: [
      ["Timbre", "the special quality of a sound that lets us tell a flute from a violin playing the same note", "גוון צליל", "האיכות המיוחדת של צליל, שבזכותה מבחינים בין חליל לכינור שמנגנים אותו צליל"],
      ["Overtones", "higher, quieter frequencies sounding along with the main note, which shape the timbre", "צלילים עיליים", "תדירויות גבוהות ושקטות יותר שנשמעות יחד עם הצליל העיקרי ומעצבות את הגוון"],
      ["Resonance", "a body vibrating strongly at its natural frequency, like a guitar's hollow body amplifying the strings", "תהודה", "רטט חזק של גוף בתדירות הטבעית שלו, כמו גוף הגיטרה החלול שמגביר את המיתרים"],
      ["Transposing instrument", "an instrument whose written notes sound at a different pitch, like the B♭ clarinet", "כלי מעתיק", "כלי שהתווים הכתובים בשבילו נשמעים בגובה אחר, כמו קלרינט בסי במול"],
    ],
    q: [
      [["A flute and a violin play the same note at the same loudness. Why do they still sound different?", "Their overtones differ, giving each a different timbre", ["They play different pitches", "One is always louder", "Only the violin makes overtones"], "The mix of overtones and how the sound starts and fades give each instrument its colour."],
        ["חליל וכינור מנגנים אותו צליל באותה עוצמה. למה הם עדיין נשמעים שונה?", "הצלילים העיליים שלהם שונים, וזה נותן לכל אחד גוון אחר", ["הם מנגנים בגבהים שונים", "אחד תמיד חזק יותר", "רק לכינור יש צלילים עיליים"], "תערובת הצלילים העיליים והאופן שבו הצליל מתחיל ודועך נותנים לכל כלי את ה״צבע״ שלו."]],
      [["Halving the length of a vibrating string (same tension) makes its note…", "one octave higher", ["one octave lower", "twice as loud", "unchanged"], "Half the length vibrates twice as fast, and doubling the frequency raises the pitch by an octave."],
        ["קיצור מיתר רוטט לחצי מאורכו (באותו מתח) הופך את הצליל שלו…", "לגבוה יותר באוקטבה", ["לנמוך יותר באוקטבה", "לחזק פי שניים", "לא משנה אותו"], "חצי מהאורך רוטט מהר פי שניים, והכפלת התדירות מגביהה את הצליל באוקטבה."]],
    ],
  },
};
export default c;
