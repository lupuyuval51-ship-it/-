import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Synthesizer", "an electronic instrument that makes sounds from electric signals instead of strings or air", "סינתיסייזר", "כלי נגינה אלקטרוני שמפיק צלילים מאותות חשמליים במקום ממיתרים או מאוויר"],
      ["Tempo", "how fast the beat of a piece of music goes", "טמפו", "המהירות של הפעימה בקטע מוזיקה"],
      ["Loop", "a short piece of music that repeats again and again with no gap", "לופ", "קטע מוזיקה קצר שחוזר שוב ושוב בלי הפסקה"],
      ["Track", "one lane in a music program that holds one instrument or sound", "ערוץ", "נתיב אחד בתוכנת מוזיקה שמחזיק כלי נגינה אחד או צליל אחד"],
    ],
    q: [
      [["What does BPM stand for in music?", "Beats per minute", ["Bars per measure", "Bass per microphone", "Beeps per machine"], "BPM counts how many beats there are in one minute, so it tells you the tempo of the music."],
        ["מה פירוש הקיצור BPM במוזיקה?", "פעימות לדקה", ["תיבות למשקל", "בסים למיקרופון", "צפצופים למכונה"], "BPM הוא קיצור של Beats Per Minute: הוא סופר כמה פעימות יש בדקה אחת, ולכן הוא אומר מה הטמפו של המוזיקה."]],
      [["Which song has the fastest tempo?", "A song at 140 BPM", ["A song at 100 BPM", "A song at 70 BPM", "A song at 60 BPM"], "More beats per minute means a faster beat, and 140 is the biggest of these numbers."],
        ["לאיזה שיר יש הטמפו המהיר ביותר?", "שיר בקצב 140 BPM", ["שיר בקצב 100 BPM", "שיר בקצב 70 BPM", "שיר בקצב 60 BPM"], "יותר פעימות בדקה פירושן פעימה מהירה יותר, ו־140 הוא המספר הגדול ביותר מבין אלה."]],
      [["What is sound?", "Vibrations that travel through the air as waves", ["Tiny flashes of light that the ears can sense", "Small electric sparks that travel inside the ear", "Wind blowing very fast past the head"], "A vibrating object, like a string or a speaker, pushes the air back and forth, and that wave reaches our ears. Sound also travels through water and solids, but not through empty space."],
        ["מהו קול?", "רעידות שעוברות באוויר כגלים", ["הבזקי אור קטנטנים שהאוזניים מרגישות", "ניצוצות חשמל קטנים שעוברים בתוך האוזן", "רוח שנושבת מהר מאוד ליד הראש"], "חפץ שרוטט, כמו מיתר או רמקול, דוחף את האוויר קדימה ואחורה, והגל הזה מגיע לאוזניים שלנו. קול עובר גם במים ובמוצקים, אבל לא בחלל ריק."]],
      [["In a music app, what is a sample?", "A short recorded sound, such as a drum hit", ["A free trial version of the music app", "The written name of the singer of a song", "A special cable that plugs in a microphone"], "Samples are bits of real recordings that you can trigger, repeat and change, like one clap or one guitar chord."],
        ["באפליקציה ליצירת מוזיקה, מהי דגימה (sample)?", "צליל קצר שהוקלט, כמו מכה בתוף", ["גרסת ניסיון חינמית של האפליקציה", "השם הכתוב של הזמר או הזמרת של שיר", "כבל מיוחד שמחברים בו מיקרופון"], "דגימות הן קטעים קצרים מהקלטות אמיתיות שאפשר להפעיל, לחזור עליהם ולשנות אותם, כמו מחיאת כף אחת או אקורד אחד של גיטרה."]],
      [["How do the sound waves of a higher note vibrate?", "Faster: it has a higher frequency", ["Slower: it has a lower frequency", "At the same speed, but a lot louder", "Only in one straight line"], "Pitch depends on how many times the wave vibrates each second. More vibrations each second give a higher note."],
        ["איך רוטטים גלי הקול של צליל גבוה יותר?", "מהר יותר: התדירות שלו גבוהה יותר", ["לאט יותר: התדירות שלו נמוכה יותר", "באותה מהירות, אבל הרבה יותר חזק", "רק בקו ישר אחד"], "גובה הצליל תלוי בכמה פעמים הגל רוטט בכל שנייה. יותר רעידות בשנייה נותנות צליל גבוה יותר."]],
    ],
    n: [
      [60, ["A song is at 120 BPM. How many beats are there in 30 seconds?", "beats", "120 beats per minute is 2 beats per second, so 30 seconds hold 30 × 2 = 60 beats."],
        ["שיר מתנגן בקצב של 120 BPM. כמה פעימות יש ב־30 שניות?", "פעימות", "קצב של 120 פעימות לדקה הוא 2 פעימות בשנייה, ולכן ב־30 שניות יש 30 × 2 = 60 פעימות."]],
    ],
  },
  i: {
    t: [
      ["MIDI", "a standard way for instruments and computers to send musical instructions, such as which note to play", "MIDI", "תקן שבעזרתו כלי נגינה ומחשבים שולחים זה לזה הוראות מוזיקליות, כמו איזה תו לנגן"],
      ["Frequency", "how many times a sound wave vibrates each second, measured in hertz", "תדירות", "כמה פעמים גל קול רוטט בכל שנייה, נמדד בהרץ"],
      ["Digital audio workstation (DAW)", "a computer program for recording, arranging and mixing music", "תחנת עבודה דיגיטלית לשמע (DAW)", "תוכנת מחשב להקלטה, לעיבוד ולערבול של מוזיקה"],
      ["Mixing", "balancing the volume, the left–right position and the effects of all the tracks", "מיקס", "איזון של עוצמת הקול, המיקום בין שמאל לימין והאפקטים של כל הערוצים"],
    ],
    q: [
      [["What does a MIDI message carry?", "Instructions like which note to play, not sound", ["A full recording of the sound wave, like an MP3", "Only the words of the song", "The electricity that powers the speakers"], "MIDI sends commands such as note on, note off and how hard a key was pressed. A synthesizer or a computer turns them into sound."],
        ["מה נושאת הודעת MIDI?", "הוראות, כמו איזה תו לנגן, ולא צליל", ["הקלטה מלאה של גל הקול, כמו קובץ MP3", "רק את המילים של השיר", "את החשמל שמפעיל את הרמקולים"], "MIDI שולח פקודות כמו ״התחל תו״, ״סיים תו״ וכמה חזק נלחץ המקש. סינתיסייזר או מחשב הופכים אותן לצליל."]],
      [["A song is at 120 BPM. How long is one beat?", "Half a second", ["One second", "Two seconds", "A quarter of a second"], "120 beats fit into 60 seconds, so each beat lasts 60 ÷ 120 = 0.5 seconds, which is half a second."],
        ["שיר מתנגן בקצב 120 BPM. כמה זמן נמשכת פעימה אחת?", "חצי שנייה", ["שנייה אחת", "שתי שניות", "רבע שנייה"], "בדקה יש 60 שניות, ו־120 פעימות נכנסות בהן, ולכן כל פעימה נמשכת 60 ÷ 120 = 0.5 שניות, כלומר חצי שנייה."]],
      [["When mixing, what does panning change?", "Whether a sound comes more from the left or the right", ["How loud the whole song is, on both of the speakers", "How fast the song plays, in beats per minute", "Which notes the instrument plays in the tune"], "Panning places a sound between the left and right speakers, which helps each instrument have its own space."],
        ["במיקס, מה משנה הפנינג (panning)?", "אם צליל נשמע יותר מצד שמאל או מצד ימין", ["כמה חזק כל השיר נשמע בשני הרמקולים", "באיזו מהירות השיר מתנגן, בפעימות לדקה", "אילו תווים הכלי מנגן במנגינה"], "פנינג ממקם צליל בין הרמקול השמאלי לימני, וזה עוזר לכל כלי לקבל מקום משלו."]],
      [["Roughly which range of frequencies can young people hear?", "About 20 Hz to 20,000 Hz", ["About 200 Hz to 2,000 Hz", "About 20,000 Hz to 40,000 Hz", "About 1 Hz to 100 Hz"], "Human hearing runs from about 20 hertz, a very deep rumble, to about 20,000 hertz, a very high whistle. The top limit drops with age."],
        ["בערך באיזה טווח תדירויות יכולים צעירים לשמוע?", "בערך מ־20 הרץ עד 20,000 הרץ", ["בערך מ־200 הרץ עד 2,000 הרץ", "בערך מ־20,000 הרץ עד 40,000 הרץ", "בערך מ־1 הרץ עד 100 הרץ"], "השמיעה של בני אדם נעה מבערך 20 הרץ, רעם עמוק מאוד, עד בערך 20,000 הרץ, שריקה גבוהה מאוד. הגבול העליון יורד עם הגיל."]],
      [["Which wave shape gives the purest, smoothest tone, with no extra overtones?", "A sine wave", ["A square wave", "A sawtooth wave", "Random noise"], "A sine wave contains only one frequency. Square and sawtooth waves add many overtones, which make them sound buzzy."],
        ["איזו צורת גל נותנת את הצליל הטהור והחלק ביותר, בלי צלילים עיליים נוספים?", "גל סינוס", ["גל ריבועי", "גל משור", "רעש אקראי"], "גל סינוס מכיל תדירות אחת בלבד. גל ריבועי וגל משור מוסיפים הרבה צלילים עיליים, ולכן הם נשמעים מזמזמים."]],
    ],
    n: [
      [880, ["The A above middle C is tuned to 440 Hz. What is the frequency of the A one octave higher?", "Hz", "Going up one octave doubles the frequency: 440 × 2 = 880 Hz."],
        ["התו לה שמעל דו האמצעי מכוון ל־440 הרץ. מה התדירות של הלה שנמצא אוקטבה אחת מעליו?", "הרץ", "עלייה של אוקטבה אחת מכפילה את התדירות: 440 × 2 = 880 הרץ."]],
      [72, ["In MIDI, middle C is note number 60. What number is the C one octave higher?", "", "An octave has 12 semitones, and MIDI counts each semitone as 1, so 60 + 12 = 72."],
        ["ב־MIDI, דו האמצעי הוא תו מספר 60. מה המספר של הדו שנמצא אוקטבה אחת מעליו?", "", "באוקטבה יש 12 חצאי טונים, ו־MIDI סופר כל חצי טון כ־1, ולכן 60 + 12 = 72."]],
    ],
  },
  a: {
    t: [
      ["Sample rate", "how many times per second a recording measures the sound wave", "קצב דגימה", "כמה פעמים בשנייה הקלטה מודדת את גל הקול"],
      ["ADSR envelope", "how a note's loudness changes over time: attack, decay, sustain and release", "מעטפת ADSR", "האופן שבו עוצמת התו משתנה לאורך זמן: עלייה, דעיכה, החזקה ושחרור"],
      ["Low-pass filter", "an effect that lets deep sounds through and cuts the high ones", "מסנן מעביר נמוכים", "אפקט שמעביר צלילים עמוקים וחוסם את הגבוהים"],
      ["Quantize", "moving recorded notes onto the nearest point of a beat grid so the timing is exact", "קוונטיזציה", "הזזה של תווים מוקלטים לנקודה הקרובה ביותר ברשת הפעימות, כדי שהתזמון יהיה מדויק"],
    ],
    q: [
      [["Why must the sample rate be more than twice the highest frequency you want to record?", "Each cycle needs more than two measurements", ["Speakers always come in pairs, one left and one right", "Stereo sound uses two separate channels", "Every note must be recorded two times"], "To capture a wave you must catch both its ups and its downs, so you need more than two samples in each cycle. This is known as the Nyquist rule."],
        ["למה קצב הדגימה צריך להיות יותר מפי שניים מהתדירות הגבוהה ביותר שרוצים להקליט?", "כל מחזור של הגל צריך יותר משתי מדידות", ["רמקולים תמיד באים בזוגות, אחד משמאל ואחד מימין", "צליל סטריאו משתמש בשני ערוצים נפרדים", "צריך להקליט כל תו פעמיים"], "כדי ללכוד גל צריך לתפוס גם את העליות וגם את הירידות שלו, ולכן צריך יותר משתי דגימות בכל מחזור. זה נקרא כלל ניקוויסט."]],
      [["In an ADSR envelope, which stage is the sound fading after the key is let go?", "Release", ["Sustain", "Decay", "Attack"], "Release is the time the sound takes to die away once the key is released. Sustain is the level held while the key stays down."],
        ["במעטפת ADSR, איזה שלב הוא דעיכת הצליל אחרי שמשחררים את המקש?", "שחרור (Release)", ["החזקה (Sustain)", "דעיכה (Decay)", "עלייה (Attack)"], "השחרור הוא הזמן שלוקח לצליל לגווע אחרי שעוזבים את המקש. ההחזקה היא העוצמה שנשמרת כל זמן שהמקש לחוץ."]],
      [["A drum hit is loud at once, while a gently bowed violin note swells in slowly. Which ADSR stage differs most?", "Attack", ["Release", "Sustain", "Decay"], "Attack is how fast a note rises to full loudness. A drum has a very short attack, and a gently bowed note has a longer one."],
        ["מכה בתוף חזקה מיד, ואילו תו כינור שמנוגן בקשת בעדינות מתגבר לאט. באיזה שלב של ADSR ההבדל הגדול ביותר?", "עלייה (Attack)", ["שחרור (Release)", "החזקה (Sustain)", "דעיכה (Decay)"], "העלייה היא כמה מהר תו מגיע לעוצמה המלאה. לתוף יש עלייה קצרה מאוד, ולתו שמנוגן בעדינות בקשת יש עלייה ארוכה יותר."]],
      [["Why is a WAV file of a song much bigger than an MP3 of the same song?", "MP3 throws away details that people hardly hear", ["MP3 files hold shorter, cut-down versions of each song", "WAV files have pictures of the band inside", "WAV files are always recorded in mono"], "WAV usually stores every sample as it is. MP3 is lossy compression: it removes sounds the ear is unlikely to notice, so the file is several times smaller."],
        ["למה קובץ WAV של שיר גדול בהרבה מקובץ MP3 של אותו שיר?", "MP3 משמיט פרטים שאנשים כמעט לא שומעים", ["קובצי MP3 מכילים גרסאות קצרות וחתוכות של כל שיר", "בקובצי WAV יש בפנים תמונות של הלהקה", "קובצי WAV מוקלטים תמיד במונו"], "WAV שומר בדרך כלל כל דגימה כמו שהיא. MP3 הוא דחיסה מאבדת: הוא מוחק צלילים שהאוזן כנראה לא תשים לב אליהם, ולכן הקובץ קטן פי כמה."]],
      [["In MIDI, what range of values does the velocity of a note use?", "0 to 127", ["0 to 255", "1 to 100", "0 to 10"], "MIDI data bytes carry 7 bits, which give 128 values, from 0 to 127. Velocity says how hard the key was struck."],
        ["ב־MIDI, באיזה טווח ערכים משתמשת עוצמת ההקשה (velocity) של תו?", "0 עד 127", ["0 עד 255", "1 עד 100", "0 עד 10"], "בתי הנתונים של MIDI נושאים 7 ביטים, שנותנים 128 ערכים, מ־0 עד 127. עוצמת ההקשה אומרת כמה חזק נלחץ המקש."]],
    ],
    n: [
      [22050, ["CD audio takes 44,100 samples per second. Up to what frequency limit can it record sound?", "Hz", "The limit is half the sample rate: 44,100 ÷ 2 = 22,050 Hz, just above the top of human hearing."],
        ["שמע של תקליטור נדגם 44,100 פעמים בשנייה. עד איזו תדירות, לכל היותר, הוא יכול להקליט צליל?", "הרץ", "הגבול הוא חצי מקצב הדגימה: 44,100 ÷ 2 = 22,050 הרץ, קצת מעל גבול השמיעה של בני אדם."]],
      [8, ["At 90 BPM, how many seconds do 3 bars of 4 beats last?", "seconds", "3 bars of 4 beats are 12 beats. At 90 BPM each beat lasts 60 ÷ 90 = 2/3 of a second, so 12 beats last 12 × 2/3 = 8 seconds."],
        ["בקצב 90 BPM, כמה שניות נמשכות 3 תיבות של 4 פעימות?", "שניות", "בשלוש תיבות של 4 פעימות יש 12 פעימות. בקצב 90 BPM כל פעימה נמשכת 60 ÷ 90 = 2/3 שנייה, ולכן 12 פעימות נמשכות 12 × 2/3 = 8 שניות."]],
    ],
  },
};
export default c;
