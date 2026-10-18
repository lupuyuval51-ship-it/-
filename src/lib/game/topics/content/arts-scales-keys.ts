import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Scale", "a set of notes played in order of pitch, going up or down step by step", "סולם", "סדרה של צלילים שמנגנים לפי הגובה שלהם, בעלייה או בירידה, צעד אחר צעד"],
      ["Sharp", "a sign that raises a note by a semitone", "דיאז", "סימן שמגביה צליל בחצי טון"],
      ["Flat", "a sign that lowers a note by a semitone", "במול", "סימן שמנמיך צליל בחצי טון"],
      ["Octave", "the gap between a note and the next note up or down with the same name", "אוקטבה", "המרווח בין צליל לבין הצליל הבא, למעלה או למטה, שיש לו אותו שם"],
    ],
    q: [
      [["Which major scale uses only the white keys of the piano?", "C major", ["G major", "F major", "D major"], "C major has no sharps or flats: C, D, E, F, G, A, B and C are all white keys. G major needs F sharp and F major needs B flat, and both of those are black keys."],
        ["איזה סולם מז׳ור מנוגן רק על הקלידים הלבנים של הפסנתר?", "דו מז׳ור", ["סול מז׳ור", "פה מז׳ור", "רה מז׳ור"], "בדו מז׳ור אין דיאזים ואין במולים: דו, רה, מי, פה, סול, לה, סי ודו הם כולם קלידים לבנים. סול מז׳ור צריך פה דיאז ופה מז׳ור צריך סי במול, ושניהם קלידים שחורים."]],
      [["How do major and minor scales usually sound different?", "Major tends to sound bright and minor darker or sadder", ["Major songs are always played faster than minor songs", "Minor pieces are always played more quietly than major pieces", "Major uses only black keys and minor only white"], "The difference is in the pattern of steps: a minor scale has a lower third note, which gives it a darker colour. Speed and loudness can be anything in either one."],
        ["במה נשמעים בדרך כלל מז׳ור ומינור שונים זה מזה?", "מז׳ור נשמע לרוב בהיר, ומינור כהה או עצוב יותר", ["שירים במז׳ור תמיד מנוגנים מהר יותר משירים במינור", "יצירות במינור תמיד מנוגנות בשקט רב יותר מיצירות במז׳ור", "מז׳ור משתמש רק בקלידים שחורים ומינור רק בלבנים"], "ההבדל הוא בתבנית הצעדים: בסולם מינורי הצליל השלישי נמוך יותר, וזה נותן לו צבע כהה יותר. המהירות והעוצמה יכולות להיות כל דבר בשניהם."]],
      [["On a piano, which black key lies between C and D?", "C sharp, also called D flat", ["D sharp, also called E flat", "F sharp, also called G flat", "A sharp, also called B flat"], "C sharp is C raised by a semitone, and D flat is D lowered by a semitone. Both land on the same black key, so it has two names."],
        ["על הפסנתר, איזה קליד שחור נמצא בין דו לרה?", "דו דיאז, שנקרא גם רה במול", ["רה דיאז, שנקרא גם מי במול", "פה דיאז, שנקרא גם סול במול", "לה דיאז, שנקרא גם סי במול"], "דו דיאז הוא דו שהוגבה בחצי טון, ורה במול הוא רה שהונמך בחצי טון. שניהם נופלים על אותו קליד שחור, ולכן יש לו שני שמות."]],
      [["Which pair of neighbouring white keys has no black key between them?", "E and F", ["C and D", "G and A", "F and G"], "On a piano the black keys come in groups of two and three. There is no black key between E and F, or between B and C, because those notes are only a semitone apart."],
        ["בין אילו שני קלידים לבנים שכנים אין קליד שחור?", "בין מי לפה", ["בין דו לרה", "בין סול ללה", "בין פה לסול"], "בפסנתר הקלידים השחורים מסודרים בקבוצות של שניים ושל שלושה. אין קליד שחור בין מי לפה, וגם לא בין סי לדו, כי המרחק בין הצלילים האלה הוא רק חצי טון."]],
      [["On a piano, which way do you move to play higher notes?", "To the right", ["To the left", "Up onto the black keys only", "Closer to your body"], "The lowest notes are at the left end of the keyboard and the highest at the right end, so each key to the right sounds a little higher."],
        ["לאיזה כיוון זזים על הפסנתר כדי לנגן צלילים גבוהים יותר?", "ימינה", ["שמאלה", "רק אל הקלידים השחורים", "אל הקלידים הקרובים לגוף"], "הצלילים הנמוכים נמצאים בקצה השמאלי של המקלדת והגבוהים בקצה הימני, ולכן כל קליד שמימין נשמע גבוה מעט יותר."]],
    ],
    n: [
      [8, ["The C major scale goes from C up to the next C. Counting both Cs, how many notes is that?", "notes", "C, D, E, F, G, A, B and C again: 8 notes. That is why this distance is called an octave, from the Latin word for 'eighth'."],
        ["סולם דו מז׳ור עולה מדו עד הדו הבא. אם סופרים את שני צלילי הדו, כמה צלילים יש בו?", "צלילים", "דו, רה, מי, פה, סול, לה, סי ושוב דו: 8 צלילים. בגלל זה המרווח הזה נקרא אוקטבה, מהמילה הלטינית שפירושה ״השמיני״."]],
    ],
    s: [[["The first six notes of the major scale in solfège, going up", "Do", "Re", "Mi", "Fa", "Sol", "La"],
      ["ששת הצלילים הראשונים של סולם מז׳ור בסולפג׳, בעלייה", "דו", "רה", "מי", "פה", "סול", "לה"]]],
  },
  i: {
    t: [
      ["Semitone", "the smallest step on a piano, from one key to the very next one, such as E to F", "חצי טון", "הצעד הקטן ביותר בפסנתר, מקליד אחד לקליד הצמוד אליו, כמו ממי לפה"],
      ["Whole tone", "a step made of two semitones, such as C to D", "טון שלם", "צעד שגודלו שני חצאי טונים, כמו מדו לרה"],
      ["Key signature", "the sharps or flats written at the start of every line of music, which hold for the whole piece", "סימני היתק", "הדיאזים או הבמולים שנכתבים בתחילת כל שורת תווים ותקפים לאורך כל היצירה"],
      ["Tonic", "the first note of a scale, the 'home' note that gives the key its name", "טוניקה", "הצליל הראשון של הסולם, צליל ה״בית״ שעל שמו נקרא הסולם"],
    ],
    q: [
      [["What is the pattern of whole tones (T) and semitones (S) in every major scale?", "T T S T T T S", ["T S T T S T T", "T T T S T T S", "S T T T S T T"], "From C: C–D (T), D–E (T), E–F (S), F–G (T), G–A (T), A–B (T), B–C (S). Every major scale uses this same pattern, starting from its own tonic."],
        ["מהי תבנית הטונים השלמים (ט) וחצאי הטונים (ח) בכל סולם מז׳ור?", "ט ט ח ט ט ט ח", ["ט ח ט ט ח ט ט", "ט ט ט ח ט ט ח", "ח ט ט ט ח ט ט"], "מדו: דו–רה (ט), רה–מי (ט), מי–פה (ח), פה–סול (ט), סול–לה (ט), לה–סי (ט), סי–דו (ח). כל סולם מז׳ור בנוי באותה תבנית, החל מהטוניקה שלו."]],
      [["The key signature of G major has one sharp. Which note does it raise?", "F, which becomes F sharp", ["C, which becomes C sharp", "G, which becomes G sharp", "B, which becomes B sharp"], "In a major scale the seventh note must be a semitone below the top note. Starting on G, that means F has to be raised: G A B C D E F♯ G."],
        ["בסימני ההיתק של סול מז׳ור יש דיאז אחד. איזה צליל הוא מגביה?", "פה, שהופך לפה דיאז", ["דו, שהופך לדו דיאז", "סול, שהופך לסול דיאז", "סי, שהופך לסי דיאז"], "בסולם מז׳ור הצליל השביעי צריך להיות חצי טון מתחת לצליל העליון. כשמתחילים מסול, צריך להגביה את פה: סול, לה, סי, דו, רה, מי, פה דיאז, סול."]],
      [["Which major key has just one flat, B flat, in its key signature?", "F major", ["B flat major", "D major", "C major"], "In F major the fourth note must be only a semitone above the third (A), so B is lowered to B flat. B flat major needs more than one flat, D major uses sharps instead, and C major has none."],
        ["לאיזה סולם מז׳ור יש רק במול אחד, סי במול, בסימני ההיתק?", "פה מז׳ור", ["סי במול מז׳ור", "רה מז׳ור", "דו מז׳ור"], "בפה מז׳ור הצליל הרביעי צריך להיות רק חצי טון מעל השלישי (לה), ולכן סי מונמך לסי במול. סי במול מז׳ור צריך יותר מבמול אחד, ברה מז׳ור יש דיאזים, ובדו מז׳ור אין בכלל."]],
      [["A piece has no sharps or flats in its key signature. Which keys could it be in?", "C major or A minor", ["G major or E minor", "F major or D minor", "Only C minor"], "C major and its relative minor, A minor, share an empty key signature. G major and E minor have one sharp, and F major and D minor have one flat."],
        ["בסימני ההיתק של יצירה אין דיאזים ואין במולים. באיזה סולם היא יכולה להיות?", "דו מז׳ור או לה מינור", ["סול מז׳ור או מי מינור", "פה מז׳ור או רה מינור", "רק דו מינור"], "לדו מז׳ור ולסולם המינורי המקביל לו, לה מינור, יש סימני היתק ריקים. לסול מז׳ור ולמי מינור יש דיאז אחד, ולפה מז׳ור ולרה מינור יש במול אחד."]],
      [["Why does the D major scale need F sharp and C sharp?", "To keep the major pattern of steps when starting on D", ["Because sharps make every scale sound brighter and happier", "Because the note D is itself a black key on the piano", "Because every scale has to contain exactly two sharps"], "Starting on D with white keys only would put the semitones in the wrong places. Raising F and C restores the T T S T T T S pattern: D E F♯ G A B C♯ D."],
        ["למה סולם רה מז׳ור צריך פה דיאז ודו דיאז?", "כדי לשמור על תבנית הצעדים של מז׳ור כשמתחילים מרה", ["כי דיאזים גורמים לכל סולם להישמע בהיר ושמח יותר מקודם", "כי הצליל רה עצמו הוא קליד שחור בפסנתר", "כי בכל סולם חייבים להיות בדיוק שני דיאזים"], "אם מתחילים מרה ומנגנים רק קלידים לבנים, חצאי הטונים נופלים במקומות הלא נכונים. הגבהת פה ודו מחזירה את התבנית ט ט ח ט ט ט ח: רה, מי, פה דיאז, סול, לה, סי, דו דיאז, רה."]],
    ],
    n: [
      [12, ["How many semitones are there in one octave?", "semitones", "Counting every white and black key from C up to the next C gives 12 semitone steps, which is why Western music has 12 different notes."],
        ["כמה חצאי טונים יש באוקטבה אחת?", "חצאי טונים", "אם סופרים כל קליד לבן ושחור מדו ועד הדו הבא, יש 12 צעדים של חצי טון, ולכן במוזיקה המערבית יש 12 צלילים שונים."]],
      [2, ["How many flats are in the key signature of B flat major?", "flats", "B flat major has 2 flats, B flat and E flat: B♭ C D E♭ F G A B♭."],
        ["כמה במולים יש בסימני ההיתק של סי במול מז׳ור?", "במולים", "בסי במול מז׳ור יש 2 במולים, סי במול ומי במול: סי במול, דו, רה, מי במול, פה, סול, לה, סי במול."]],
    ],
  },
  a: {
    t: [
      ["Circle of fifths", "a diagram of the 12 keys in which each key is a perfect fifth away from its neighbours", "מעגל הקווינטות", "תרשים של 12 הסולמות שבו כל סולם רחוק קווינטה זכה מהשכנים שלו"],
      ["Relative minor", "the minor key that shares the key signature of a major key and starts three semitones below it", "מינור מקביל", "הסולם המינורי שיש לו אותם סימני היתק כמו לסולם מז׳ור, ומתחיל שלושה חצאי טונים מתחתיו"],
      ["Harmonic minor", "a minor scale with its seventh note raised by a semitone", "מינור הרמוני", "סולם מינורי שהצליל השביעי שלו מוגבה בחצי טון"],
      ["Enharmonic notes", "two names for the same pitch, such as F sharp and G flat", "צלילים אנהרמוניים", "שני שמות שונים לאותו גובה צליל, כמו פה דיאז וסול במול"],
    ],
    q: [
      [["Moving one step clockwise around the circle of fifths (C, G, D, ...), what happens to the key signature?", "It gains one sharp or loses one flat", ["It gains one flat or loses one sharp", "It gains two sharps at every step", "It stays exactly the same"], "Each step clockwise goes up a fifth, and the new key needs one more sharp: C has none, G has one and D has two. On the flat side, the same move removes a flat."],
        ["כשזזים צעד אחד עם כיוון השעון במעגל הקווינטות (דו, סול, רה...), מה קורה לסימני ההיתק?", "נוסף דיאז אחד או יורד במול אחד", ["נוסף במול אחד או יורד דיאז אחד", "נוספים שני דיאזים בכל צעד", "הם נשארים בדיוק אותו דבר"], "כל צעד עם כיוון השעון עולה בקווינטה, והסולם החדש צריך עוד דיאז: לדו אין, לסול יש אחד ולרה שניים. בצד של הבמולים אותו צעד מוריד במול."]],
      [["Which major key has four sharps?", "E major", ["A major", "B major", "D major"], "Sharps are added in the order F, C, G, D. E major uses all four: E F♯ G♯ A B C♯ D♯ E. A major has three, B major five and D major two."],
        ["לאיזה סולם מז׳ור יש ארבעה דיאזים?", "מי מז׳ור", ["לה מז׳ור", "סי מז׳ור", "רה מז׳ור"], "הדיאזים נוספים בסדר פה, דו, סול, רה. במי מז׳ור יש את כל הארבעה: מי, פה דיאז, סול דיאז, לה, סי, דו דיאז, רה דיאז, מי. בלה מז׳ור יש שלושה, בסי מז׳ור חמישה וברה מז׳ור שניים."]],
      [["A relative minor starts three semitones below its major key. What is the relative minor of G major?", "E minor", ["B minor", "D minor", "G minor"], "Three semitones below G is E (G, F sharp, F, E). E minor shares G major's single sharp, F sharp. B minor is the relative minor of D major."],
        ["סולם מינור מקביל מתחיל שלושה חצאי טונים מתחת לסולם המז׳ור שלו. מהו המינור המקביל של סול מז׳ור?", "מי מינור", ["סי מינור", "רה מינור", "סול מינור"], "שלושה חצאי טונים מתחת לסול נמצא מי (סול, פה דיאז, פה, מי). למי מינור יש אותו דיאז יחיד של סול מז׳ור, פה דיאז. סי מינור הוא המינור המקביל של רה מז׳ור."]],
      [["Which note is raised in the A harmonic minor scale?", "G, which becomes G sharp", ["F, which becomes F sharp", "C, which becomes C sharp", "A, which becomes A sharp"], "A natural minor is A B C D E F G A. The harmonic minor raises the seventh note, G, to G sharp, so it leads strongly back up to A."],
        ["איזה צליל מוגבה בסולם לה מינור הרמוני?", "סול, שהופך לסול דיאז", ["פה, שהופך לפה דיאז", "דו, שהופך לדו דיאז", "לה, שהופך ללה דיאז"], "לה מינור טבעי הוא לה, סי, דו, רה, מי, פה, סול, לה. המינור ההרמוני מגביה את הצליל השביעי, סול, לסול דיאז, וכך הוא מוביל בחוזקה חזרה אל לה."]],
      [["A key signature has three flats. Which two keys share it?", "E flat major and C minor", ["A flat major and F minor", "B flat major and G minor", "C major and A minor"], "E flat major has three flats, and its relative minor, C minor, starts three semitones lower and shares them. A flat major has four flats and B flat major only two."],
        ["בסימני ההיתק יש שלושה במולים. לאילו שני סולמות הם שייכים?", "מי במול מז׳ור ודו מינור", ["לה במול מז׳ור ופה מינור", "סי במול מז׳ור וסול מינור", "דו מז׳ור ולה מינור"], "במי במול מז׳ור יש שלושה במולים, והמינור המקביל שלו, דו מינור, מתחיל שלושה חצאי טונים מתחתיו ומשתמש באותם במולים. בלה במול מז׳ור יש ארבעה במולים ובסי במול מז׳ור רק שניים."]],
    ],
    n: [
      [7, ["How many semitones make a perfect fifth, such as C up to G?", "semitones", "Count the steps up from C: C sharp, D, D sharp, E, F, F sharp, G. That is 7 semitones."],
        ["כמה חצאי טונים יש בקווינטה זכה, למשל מדו עד סול?", "חצאי טונים", "סופרים את הצעדים מדו למעלה: דו דיאז, רה, רה דיאז, מי, פה, פה דיאז, סול. אלה 7 חצאי טונים."]],
    ],
    s: [[["The first five flats, in the order they are added to key signatures", "B flat", "E flat", "A flat", "D flat", "G flat"],
      ["חמשת הבמולים הראשונים, לפי הסדר שבו הם נוספים לסימני ההיתק", "סי במול", "מי במול", "לה במול", "רה במול", "סול במול"]]],
  },
};
export default c;
