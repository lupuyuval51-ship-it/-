import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Rhythm", "the pattern of long and short sounds in music", "מקצב", "התבנית של צלילים ארוכים וקצרים במוזיקה"],
      ["Melody", "a tune: a line of notes one after another", "לחן", "מנגינה: שורה של צלילים בזה אחר זה"],
      ["Tempo", "how fast or slow the music is", "טמפו", "עד כמה המוזיקה מהירה או איטית"],
      ["Pitch", "how high or low a sound is", "גובה צליל", "עד כמה צליל גבוה או נמוך"],
    ],
    q: [
      [["Which family of instruments makes sound by vibrating strings?", "Strings, like the violin and guitar", ["Percussion, like the drum", "Brass, like the trumpet", "Woodwind, like the flute"], "Bowing or plucking strings makes them vibrate; a hollow body makes the sound louder."],
        ["איזו משפחת כלים מפיקה צליל מרטט של מיתרים?", "כלי קשת ופריטה, כמו כינור וגיטרה", ["כלי הקשה, כמו תוף", "כלי נשיפה ממתכת, כמו חצוצרה", "כלי נשיפה מעץ, כמו חליל"], "הקשת או הפריטה גורמות למיתרים לרטוט; גוף חלול מגביר את הצליל."]],
      [["How many notes are in the basic scale do-re-mi-fa-sol-la-si (ti)?", "7", ["5", "8", "12"], "Do, re, mi, fa, sol, la, si: seven notes, and then do comes again an octave higher."],
        ["כמה צלילים יש בסולם הבסיסי דו־רה־מי־פה־סול־לה־סי?", "7", ["5", "8", "12"], "דו, רה, מי, פה, סול, לה, סי: שבעה צלילים, ואז דו חוזר באוקטבה גבוהה יותר."]],
    ],
  },
  i: {
    t: [
      ["Octave", "the distance from one note to the next note with the same name, higher or lower", "אוקטבה", "המרחק מצליל אחד אל הצליל הבא באותו שם, גבוה או נמוך יותר"],
      ["Staff", "the five lines on which music is written", "חמשה", "חמשת הקווים שעליהם כותבים תווים"],
      ["Treble clef", "the sign at the start of a staff for higher notes, also called the G clef", "מפתח סול", "הסימן בתחילת החמשה לצלילים גבוהים"],
      ["Dynamics", "how loud or soft music is played, like piano (soft) and forte (loud)", "עוצמה (דינמיקה)", "עד כמה חזק או חלש מנגנים, כמו פיאנו (חלש) ופורטה (חזק)"],
    ],
    q: [
      [["A whole note lasts as long as how many quarter notes?", "4", ["2", "3", "8"], "Whole = 2 halves = 4 quarters."],
        ["תו שלם נמשך כמו כמה רבעים?", "4", ["2", "3", "8"], "שלם = 2 חצאים = 4 רבעים."]],
      [["A song is marked “forte”. How should it be played?", "Loudly", ["Softly", "Quickly", "Slowly"], "Forte means loud; piano means soft."],
        ["שיר מסומן ״פורטה״. איך מנגנים אותו?", "בעוצמה חזקה", ["בשקט", "מהר", "לאט"], "פורטה פירושו חזק; פיאנו פירושו חלש."]],
    ],
    n: [[3, ["In 3/4 time, how many quarter-note beats are in each bar?", "", "The top number shows the beats per bar: 3 quarter-note beats, as in a waltz."], ["במשקל 3/4, כמה פעמות של רבע יש בכל תיבה?", "", "המספר העליון מראה כמה פעמות יש בתיבה: 3 פעמות של רבע, כמו בוולס."]]],
  },
  a: {
    t: [
      ["Major scale", "a scale built from the steps whole–whole–half–whole–whole–whole–half, often heard as bright", "סולם מז׳ור", "סולם שבנוי מהמרווחים טון–טון–חצי–טון–טון–טון–חצי, שנשמע לרוב בהיר"],
      ["Chord", "three or more notes played together", "אקורד", "שלושה צלילים או יותר שמנוגנים יחד"],
      ["Semitone", "the smallest step in Western music, like from one piano key to the very next", "חצי טון", "הצעד הקטן ביותר במוזיקה המערבית, כמו מקליד אחד בפסנתר לזה שצמוד אליו"],
      ["Time signature", "the two numbers at the start of a piece that show the beats in each bar", "משקל (בתווים)", "שני המספרים בתחילת היצירה שמראים כמה פעמות יש בכל תיבה"],
    ],
    q: [
      [["Which notes make the C major chord?", "C, E, G", ["C, D, E", "C, F, A", "C, E♭, G"], "A major chord takes the 1st, 3rd and 5th notes of the major scale: C, E and G (C, E♭, G is C minor)."],
        ["אילו צלילים בונים את אקורד דו מז׳ור?", "דו, מי, סול", ["דו, רה, מי", "דו, פה, לה", "דו, מי במול, סול"], "אקורד מז׳ור בנוי מהצליל הראשון, השלישי והחמישי בסולם המז׳ור: דו, מי וסול (דו, מי במול, סול הוא דו מינור)."]],
      [["How many semitones are in one octave?", "12", ["7", "8", "10"], "Counting every white and black key from one C to the next gives 12 semitones."],
        ["כמה חצאי טונים יש באוקטבה אחת?", "12", ["7", "8", "10"], "אם סופרים כל קליד לבן ושחור מדו אחד לדו הבא, מקבלים 12 חצאי טונים."]],
    ],
  },
};
export default c;
