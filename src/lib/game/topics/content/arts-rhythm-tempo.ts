import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Beat", "the steady pulse you can clap or tap along to in a piece of music", "פעמה", "הדופק הקבוע שאפשר למחוא לפיו כפיים או להקיש לפיו ביצירה"],
      ["Rhythm", "the pattern of long and short sounds and silences in music", "מקצב", "התבנית של צלילים ארוכים וקצרים ושל שתיקות במוזיקה"],
      ["Tempo", "how fast or slow the music goes", "טמפו", "מהירות הנגינה: כמה מהר או לאט המוזיקה מתקדמת"],
      ["Rest", "a sign in written music that means: stay silent for a set time", "הפסק", "סימן בכתב התווים שפירושו: לשתוק למשך זמן קבוע"],
    ],
    q: [
      [["Which note lasts half as long as a half note?", "A quarter note", ["An eighth note", "A whole note", "A dotted half note"], "A half note lasts 2 beats and a quarter note lasts 1 beat, so a quarter note is half as long. An eighth note is shorter still: half of a quarter note."],
        ["איזה תו נמשך חצי מהזמן של תו חצי?", "תו רבע", ["תו שמינית", "תו שלם", "תו חצי מנוקד"], "תו חצי נמשך 2 פעמות ותו רבע נמשך פעמה אחת, ולכן תו רבע ארוך חצי ממנו. תו שמינית קצר עוד יותר: חצי מתו רבע."]],
      [["What does a tempo mark at the top of a piece tell the musician?", "How fast to play", ["How loudly to play", "Which key the piece is in", "Which instrument should play"], "A tempo mark, such as allegro or largo, sets the speed of the beat. Loudness is shown by dynamics marks such as piano and forte."],
        ["מה אומר לנגן סימן הטמפו שבראש היצירה?", "באיזו מהירות לנגן", ["באיזו עוצמה לנגן", "באיזה סולם כתובה היצירה", "איזה כלי צריך לנגן"], "סימן טמפו, כמו אלגרו או לרגו, קובע את מהירות הפעמה. עוצמת הנגינה מסומנת בסימני דינמיקה כמו פיאנו ופורטה."]],
      [["What does a metronome do?", "It clicks a steady beat at a speed you choose", ["It tunes the strings of a guitar or a violin for you", "It makes the music sound louder", "It writes down the notes you play"], "A metronome ticks evenly at a chosen number of beats per minute, so musicians can practise keeping a steady tempo."],
        ["מה עושה מטרונום?", "מקיש פעמה קבועה במהירות שבוחרים", ["מכוון בשבילכם את המיתרים של גיטרה או של כינור", "מגביר את עוצמת המוזיקה", "רושם את התווים שמנגנים"], "מטרונום מתקתק באופן אחיד במספר פעמות לדקה שבוחרים, וכך הנגנים מתאמנים לשמור על טמפו קבוע."]],
      [["What do the vertical bar lines across the staff do?", "They split the music into equal groups of beats", ["They show a singer or wind player where to breathe", "They mark which notes must be played more loudly", "They tell the player to stop playing"], "Bar lines split the music into bars (measures). In 4/4 time, for example, every bar holds 4 beats, which makes the music easier to read and count."],
        ["מה תפקידם של קווי התיבה, הקווים האנכיים שחוצים את החמשה?", "הם מחלקים את המוזיקה לקבוצות שוות של פעמות", ["הם מראים לזמר או לנגן בכלי נשיפה איפה לנשום", "הם מסמנים אילו תווים צריך לנגן בחוזקה רבה יותר", "הם אומרים לנגן להפסיק לנגן"], "קווי התיבה מחלקים את המוזיקה לתיבות. למשל, במשקל 4/4 יש בכל תיבה 4 פעמות, וכך קל יותר לקרוא את התווים ולספור."]],
      [["Which of these words, written at the start of a piece, tells the players its tempo?", "Allegro", ["Forte", "Crescendo", "Treble clef"], "Allegro is an Italian tempo mark meaning fast and lively. Forte (loud) and crescendo (getting louder) are about volume, and the treble clef shows the pitch of the notes."],
        ["איזו מהמילים האלה, שנכתבות בתחילת יצירה, אומרת לנגנים מה הטמפו?", "אלגרו", ["פורטה", "קרשנדו", "מפתח סול"], "אלגרו הוא סימן טמפו באיטלקית שפירושו מהיר ועליז. פורטה (חזק) וקרשנדו (התחזקות הדרגתית) עוסקים בעוצמה, ומפתח סול מראה את גובה התווים."]],
    ],
    n: [
      [4, ["How many quarter notes last as long as one whole note?", "", "A whole note lasts 4 beats and each quarter note lasts 1 beat, so 4 quarter notes fill the same time."],
        ["כמה תווי רבע נמשכים כמו תו שלם אחד?", "", "תו שלם נמשך 4 פעמות וכל תו רבע נמשך פעמה אחת, ולכן 4 תווי רבע ממלאים את אותו הזמן."]],
      [12, ["A piece in 4/4 time has 4 beats in every bar. How many beats are there in 3 bars?", "beats", "Each bar has 4 beats, so 3 bars have 3 × 4 = 12 beats."],
        ["ביצירה במשקל 4/4 יש 4 פעמות בכל תיבה. כמה פעמות יש ב־3 תיבות?", "פעמות", "בכל תיבה יש 4 פעמות, ולכן ב־3 תיבות יש 3 × 4 = 12 פעמות."]],
    ],
    s: [[["Note values from the longest to the shortest", "Whole note", "Half note", "Quarter note", "Eighth note", "Sixteenth note"],
      ["ערכי תווים מהארוך ביותר לקצר ביותר", "תו שלם", "תו חצי", "תו רבע", "תו שמינית", "תו שש־עשרית"]]],
  },
  i: {
    t: [
      ["Time signature", "the two numbers at the start of a piece: how many beats are in a bar and which note counts as one beat", "סימן משקל", "שני המספרים בתחילת היצירה: כמה פעמות יש בכל תיבה ואיזה תו נחשב לפעמה אחת"],
      ["Dotted note", "a note followed by a small dot, which makes it last half as long again", "תו מנוקד", "תו שאחריו נקודה קטנה, שמאריכה אותו במחצית מאורכו"],
      ["Tie", "a curved line joining two notes of the same pitch, played as one long sound", "קשת חיבור", "קו מעוקל שמחבר שני תווים באותו גובה, ומנגנים אותם כצליל ארוך אחד"],
    ],
    q: [
      [["In 3/4 time, what does the top number 3 tell you?", "There are 3 beats in each bar", ["Each bar lasts exactly 3 seconds", "The piece is divided into 3 big sections", "Three instruments play at the same time"], "The top number counts the beats in each bar and the bottom number shows the note that gets one beat: in 3/4 there are three quarter-note beats in every bar."],
        ["במשקל 3/4, מה אומר המספר העליון 3?", "שיש 3 פעמות בכל תיבה", ["שכל תיבה נמשכת בדיוק 3 שניות", "שהיצירה מחולקת ל־3 חלקים גדולים", "ששלושה כלים מנגנים באותו זמן"], "המספר העליון סופר את הפעמות בכל תיבה, והמספר התחתון מראה איזה תו מקבל פעמה אחת: ב־3/4 יש שלוש פעמות של רבע בכל תיבה."]],
      [["Which time signature gives a waltz its 'ONE-two-three, ONE-two-three' feel?", "3/4", ["4/4", "2/4", "5/4"], "A waltz has three beats in every bar with a strong first beat, which is exactly what 3/4 time gives. Marches are usually in 2/4 or 4/4."],
        ["איזה משקל נותן לוואלס את התחושה של ״אחת־שתיים־שלוש, אחת־שתיים־שלוש״?", "3/4", ["4/4", "2/4", "5/4"], "בוואלס יש שלוש פעמות בכל תיבה, והראשונה חזקה, וזה בדיוק מה שנותן משקל 3/4. מארשים כתובים בדרך כלל ב־2/4 או ב־4/4."]],
      [["Which tempo mark means 'at a walking pace'?", "Andante", ["Moderato", "Adagio", "Presto"], "Andante comes from the Italian 'andare', to walk. It is faster than adagio (slow) but slower than allegro, while moderato means a moderate speed."],
        ["איזה סימן טמפו פירושו ״בקצב הליכה״?", "אנדנטה", ["מודרטו", "אדג׳ו", "פרסטו"], "אנדנטה בא מהמילה האיטלקית ״אנדרה״, ללכת. הוא מהיר יותר מאדג׳ו (לאט) אבל איטי יותר מאלגרו, ואילו מודרטו פירושו מהירות בינונית."]],
      [["What does BPM on a metronome stand for?", "Beats per minute", ["Beats per measure", "Bars per minute", "Bass, piano and melody"], "BPM counts how many beats fit into one minute. At 60 BPM there is one beat every second; at 120 BPM there are two every second."],
        ["מה פירוש האותיות BPM על מטרונום?", "פעמות בדקה", ["פעמות בתיבה", "תיבות בדקה", "בס, פסנתר ומנגינה"], "BPM סופר כמה פעמות נכנסות בדקה אחת. ב־60 BPM יש פעמה אחת בכל שנייה, וב־120 BPM יש שתיים בכל שנייה."]],
      [["In 4/4 time, which group of notes fills exactly one bar?", "A half note and two quarter notes", ["A whole note followed by a quarter note", "Three half notes", "Two quarter notes"], "A half note is 2 beats and each quarter note is 1 beat: 2 + 1 + 1 = 4 beats. A whole note and a quarter note make 5 beats, and three half notes make 6."],
        ["במשקל 4/4, איזו קבוצת תווים ממלאת בדיוק תיבה אחת?", "תו חצי ושני תווי רבע", ["תו שלם ועוד תו רבע אחריו", "שלושה תווי חצי", "שני תווי רבע"], "תו חצי הוא 2 פעמות וכל תו רבע הוא פעמה אחת: 2 + 1 + 1 = 4 פעמות. תו שלם ותו רבע הם 5 פעמות, ושלושה תווי חצי הם 6."]],
    ],
    n: [
      [3, ["How many beats does a dotted half note last in 4/4 time?", "beats", "A half note lasts 2 beats. The dot adds half of that again, 1 more beat, so 2 + 1 = 3 beats."],
        ["כמה פעמות נמשך תו חצי מנוקד במשקל 4/4?", "פעמות", "תו חצי נמשך 2 פעמות. הנקודה מוסיפה עוד מחצית מאורכו, פעמה אחת, ולכן 2 + 1 = 3 פעמות."]],
      [120, ["A metronome is set to 60 BPM. How many clicks will it make in 2 minutes?", "clicks", "At 60 beats per minute it clicks 60 times each minute, so in 2 minutes it clicks 2 × 60 = 120 times."],
        ["מטרונום מכוון ל־60 BPM. כמה נקישות ישמיע ב־2 דקות?", "נקישות", "ב־60 פעמות לדקה הוא נוקש 60 פעמים בכל דקה, ולכן ב־2 דקות ישמיע 2 × 60 = 120 נקישות."]],
    ],
    s: [[["Tempo marks from the slowest to the fastest", "Largo", "Adagio", "Andante", "Allegro", "Presto"],
      ["סימני טמפו מהאיטי ביותר למהיר ביותר", "לרגו", "אדג׳ו", "אנדנטה", "אלגרו", "פרסטו"]]],
  },
  a: {
    t: [
      ["Syncopation", "stressing weak beats or the gaps between beats, against the expected pattern", "סינקופה", "הדגשה של פעמות חלשות או של המקומות שבין הפעמות, בניגוד לדפוס הצפוי"],
      ["Compound time", "a metre in which each beat divides into three equal parts, such as 6/8", "משקל מורכב", "משקל שבו כל פעמה מתחלקת לשלושה חלקים שווים, למשל 6/8"],
      ["Rubato", "a flexible tempo in which the player slightly speeds up and holds back for expression", "רובטו", "מהירות גמישה שבה הנגן מאיץ מעט ומאט מעט כדי להביע רגש"],
    ],
    q: [
      [["In 6/8 time, how many main beats do you usually feel in each bar?", "Two, each made of three eighth notes", ["Six, one for every eighth note", "Three, each made of two eighth notes", "Eight, one for every sixteenth note"], "6/8 is compound time: its six eighth notes are grouped in two sets of three, so you feel two main beats (ONE-and-a, TWO-and-a). Three groups of two would be 3/4."],
        ["במשקל 6/8, כמה פעמות עיקריות מרגישים בדרך כלל בכל תיבה?", "שתיים, כל אחת של שלוש שמיניות", ["שש, אחת לכל שמינית", "שלוש, וכל אחת מהן של שתי שמיניות", "שמונה, אחת לכל שש־עשרית"], "6/8 הוא משקל מורכב: שש השמיניות מקובצות לשתי קבוצות של שלוש, ולכן מרגישים שתי פעמות עיקריות. שלוש קבוצות של שתיים היו נותנות משקל 3/4."]],
      [["A piece is marked 'ritardando' near the end. What should the players do?", "Gradually slow down", ["Gradually speed up", "Gradually get quieter", "Repeat the last bar"], "Ritardando (often written rit.) means slowing down little by little. The opposite, accelerando, means speeding up, and getting quieter is called diminuendo."],
        ["בסוף היצירה כתוב ״ריטרדנדו״. מה צריכים הנגנים לעשות?", "להאט בהדרגה", ["להאיץ בהדרגה", "להחליש בהדרגה", "לחזור על התיבה האחרונה"], "ריטרדנדו (בקיצור rit.) פירושו האטה מעט־מעט. ההפך, אצ׳לרנדו, הוא האצה, והחלשה הדרגתית נקראת דימינואנדו."]],
      [["In much rock and pop music, the snare drum hits beats 2 and 4 of every 4/4 bar. What is this called?", "The backbeat", ["The downbeat", "A triplet", "A fermata"], "The backbeat puts the stress on the 'weak' beats 2 and 4, giving rock and pop their drive. The downbeat is beat 1, the first beat of the bar."],
        ["בהרבה שירי רוק ופופ תוף הסנר מכה בפעמות 2 ו־4 של כל תיבה במשקל 4/4. איך קוראים לזה?", "בקביט (פעמה אחורית)", ["דאונביט (פעמה ראשונה)", "טריולה", "פרמטה"], "הבקביט מדגיש את הפעמות ה״חלשות״ 2 ו־4, וזה נותן לרוק ולפופ את התנופה שלהם. הדאונביט הוא פעמה 1, הפעמה הראשונה בתיבה."]],
      [["What does a fermata (a dot under a curved arch) above a note mean?", "Hold the note longer than its written value", ["Play the note very short and detached from the next", "Play the note louder than the others", "Leave the note out completely"], "A fermata tells the player to pause on the note and hold it for as long as feels right, often guided by the conductor. Short, detached playing is called staccato."],
        ["מה פירוש פרמטה (נקודה מתחת לקשת מעוגלת) מעל תו?", "להחזיק את התו יותר מהאורך הכתוב שלו", ["לנגן את התו קצר מאוד ומנותק מהתו הבא", "לנגן את התו חזק יותר משאר התווים", "לדלג על התו לגמרי"], "פרמטה אומרת לנגן לעצור על התו ולהחזיק אותו כמה שמרגיש נכון, לרוב לפי המנצח. נגינה קצרה ומנותקת נקראת סטקטו."]],
      [["In 4/4 time, a group of three eighth notes marked '3' (a triplet) takes how long?", "One beat, the time of two ordinary eighth notes", ["One and a half beats, the time of three ordinary eighth notes", "Three beats, one for each note", "Half a beat"], "A triplet squeezes three notes into the time normally taken by two of the same kind. Two eighth notes make one quarter-note beat, so the triplet lasts one beat."],
        ["במשקל 4/4, כמה זמן נמשכת קבוצה של שלוש שמיניות שמסומנת ב־3 (טריולה)?", "פעמה אחת, הזמן של שתי שמיניות רגילות", ["פעמה וחצי, הזמן של שלוש שמיניות רגילות", "שלוש פעמות, אחת לכל תו", "חצי פעמה"], "טריולה דוחסת שלושה תווים לזמן שבו מנגנים בדרך כלל שניים מאותו סוג. שתי שמיניות הן פעמה אחת של רבע, ולכן הטריולה נמשכת פעמה אחת."]],
    ],
    n: [
      [0.5, ["A metronome mark says: quarter note = 120. How many seconds does each beat last?", "seconds", "120 beats fit into 60 seconds, so each beat lasts 60 ÷ 120 = 0.5 seconds."],
        ["סימון המטרונום הוא: רבע = 120. כמה שניות נמשכת כל פעמה?", "שניות", "120 פעמות נכנסות ב־60 שניות, ולכן כל פעמה נמשכת 60 ÷ 120 = 0.5 שניות."]],
      [120, ["A song in 4/4 time at 100 BPM is 50 bars long. How many seconds does it last?", "seconds", "50 bars × 4 beats = 200 beats. At 100 beats per minute that takes 2 minutes, which is 120 seconds."],
        ["שיר במשקל 4/4 ובמהירות 100 BPM נמשך 50 תיבות. כמה שניות הוא נמשך?", "שניות", "50 תיבות × 4 פעמות = 200 פעמות. ב־100 פעמות לדקה זה לוקח 2 דקות, כלומר 120 שניות."]],
    ],
  },
};
export default c;
