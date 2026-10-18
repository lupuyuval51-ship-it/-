import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Frame", "one single still picture in a row of pictures that together make a moving image", "פריים", "תמונה דוממת אחת מתוך רצף של תמונות שיחד יוצרות תמונה נעה"],
      ["Flip book", "a small pad of drawings that seem to move when its pages are flicked quickly", "ספר דפדוף", "פנקס קטן של ציורים שנראים זזים כשמדפדפים בו מהר"],
      ["Stop motion", "animation made by moving real objects a tiny bit between photos", "סטופ־מושן", "הנפשה שנוצרת כשמזיזים חפצים אמיתיים מעט מאוד בין צילום לצילום"],
    ],
    q: [
      [["Why do pictures shown quickly one after another look like movement?", "The brain joins small changes into smooth motion", ["The screen itself moves the pictures from side to side", "Each picture hides a tiny video inside it", "The eyes see only one colour at a time"], "When slightly different pictures follow each other fast enough, the brain fills the gaps and sees one continuous movement."],
        ["למה תמונות שמוצגות מהר אחת אחרי השנייה נראות כמו תנועה?", "המוח מחבר שינויים קטנים לתנועה חלקה", ["המסך עצמו מזיז את התמונות מצד לצד ובחזרה", "בכל תמונה מוסתר סרטון קטנטן", "העיניים רואות רק צבע אחד בכל פעם"], "כשתמונות ששונות זו מזו רק מעט מתחלפות מהר מספיק, המוח ממלא את הפערים ורואה תנועה אחת רציפה."]],
      [["What is the frame rate of an animation measured in?", "Frames per second (fps)", ["Pixels per inch of the screen (ppi)", "Kilobytes (KB)", "Degrees (°)"], "The frame rate says how many pictures are shown each second. Pixels per inch describe how sharp a screen or a print is."],
        ["במה מודדים את קצב הפריימים של הנפשה?", "פריימים לשנייה (fps)", ["פיקסלים לאינץ׳ של המסך (ppi)", "קילובייטים (KB)", "מעלות (°)"], "קצב הפריימים אומר כמה תמונות מוצגות בכל שנייה. פיקסלים לאינץ׳ מתארים עד כמה מסך או הדפסה חדים."]],
      [["In stop motion, what does the animator do between two photos?", "Moves the models a tiny bit", ["Draws a new picture by hand on paper", "Switches the camera off for one minute", "Paints the whole set a new colour"], "Each photo is one frame. Moving the models slightly between photos makes them seem to move by themselves when the photos are played in a row."],
        ["בסטופ־מושן, מה עושים המנפישים בין שני צילומים?", "מזיזים את הדמויות מעט מאוד", ["מציירים ביד תמונה חדשה על נייר", "מכבים את המצלמה לדקה אחת", "צובעים את כל התפאורה בצבע חדש"], "כל צילום הוא פריים אחד. הזזה קטנה של הדמויות בין הצילומים גורמת להן להיראות כאילו הן זזות מעצמן כשמציגים את הצילומים ברצף."]],
      [["Which of these is a famous kind of stop motion?", "Clay animation", ["Cartoons drawn on paper", "Live sports on TV", "Radio drama"], "In clay animation, figures made of soft modelling clay are moved a little between photos. Drawn cartoons are animated too, but not with photos of real objects."],
        ["איזה מאלה הוא סוג מפורסם של סטופ־מושן?", "הנפשת פלסטלינה", ["סרטים מצוירים על נייר", "שידור חי של ספורט בטלוויזיה", "תסכית ברדיו"], "בהנפשת פלסטלינה מזיזים מעט דמויות מחומר רך בין צילום לצילום. גם סרטים מצוירים הם הנפשה, אבל הם לא נוצרים מצילומים של חפצים אמיתיים."]],
      [["Showing more frames each second usually makes movement look how?", "Smoother", ["Slower and heavier", "Darker", "Louder"], "More frames per second means smaller changes between pictures, so movement looks smoother. The speed of the story stays the same."],
        ["הצגה של יותר פריימים בכל שנייה גורמת בדרך כלל לתנועה להיראות איך?", "חלקה יותר", ["איטית וכבדה יותר", "כהה יותר", "רועשת יותר"], "יותר פריימים בשנייה פירושם שינויים קטנים יותר בין התמונות, ולכן התנועה נראית חלקה יותר. מהירות הסיפור נשארת אותו דבר."]],
    ],
    n: [
      [24, ["How many frames per second have films in cinemas traditionally used?", "", "Since the late 1920s, cinema films have usually been shot and shown at 24 frames per second."],
        ["בכמה פריימים לשנייה השתמשו באופן מסורתי בסרטי קולנוע?", "", "מאז סוף שנות ה־20 של המאה ה־20, סרטי קולנוע צולמו והוקרנו בדרך כלל ב־24 פריימים לשנייה."]],
      [4, ["A flip book has 48 pages and is flicked at 12 pages per second. How many seconds does it last?", "seconds", "48 pages ÷ 12 pages per second = 4 seconds of animation."],
        ["לספר דפדוף יש 48 דפים, ומדפדפים בו בקצב של 12 דפים לשנייה. כמה שניות הוא נמשך?", "שניות", "48 דפים חלקי 12 דפים בכל שנייה נותנים 4 שניות של הנפשה."]],
    ],
  },
  i: {
    t: [
      ["Keyframe", "an important drawing or pose that marks the start or the end of a movement", "תמונת מפתח", "ציור או תנוחה חשובים שמסמנים את ההתחלה או את הסוף של תנועה"],
      ["In-betweens", "the drawings that fill the gap between two important poses so the motion is smooth", "תמונות ביניים", "הציורים שממלאים את הפער בין שתי תנוחות חשובות כדי שהתנועה תהיה חלקה"],
      ["Sprite sheet", "one image file that holds all the frames of a character, laid out in a grid", "גיליון דמויות", "קובץ תמונה אחד שמחזיק את כל הפריימים של דמות, מסודרים ברשת"],
      ["Onion skinning", "showing faint copies of the frames before and after the one being drawn", "עור בצל (onion skin)", "הצגה חיוורת של הפריימים שלפני ושאחרי זה שמציירים עכשיו"],
    ],
    q: [
      [["In animation software, what does tweening mean?", "The software makes the frames between two keyframes", ["The artist draws every single frame by hand, one by one", "Two animators share one computer to finish faster", "The film is played back twice as fast"], "The animator sets the keyframes and the program works out the in-between positions, which is where the word tween comes from."],
        ["בתוכנת הנפשה, מה פירוש המילה tweening?", "התוכנה יוצרת את הפריימים שבין שתי תמונות מפתח", ["האמן מצייר ביד כל פריים ופריים, אחד אחרי השני", "שני מנפישים חולקים מחשב אחד כדי לסיים מהר יותר", "הסרט מוצג במהירות כפולה"], "המנפישים קובעים את תמונות המפתח, והתוכנה מחשבת את המיקומים שביניהן. מכאן השם tween, מהמילה between, ״בין״."]],
      [["Why do animators turn on onion skinning?", "To see nearby frames while drawing the current one", ["To make the colours in every frame look brighter", "To hide mistakes from the audience when it is played", "To make the animation file much smaller"], "Seeing faint copies of the frames just before and after helps the animator place each drawing so that the movement stays steady."],
        ["למה מנפישים מפעילים את ״עור הבצל״?", "כדי לראות פריימים סמוכים בזמן שמציירים את הנוכחי", ["כדי שהצבעים בכל אחד מהפריימים ייראו בהירים וחזקים יותר", "כדי להסתיר טעויות מהקהל בזמן ההקרנה", "כדי שקובץ ההנפשה יהיה קטן בהרבה"], "עותקים חיוורים של הפריימים שממש לפני ואחרי עוזרים למנפישים למקם כל ציור כך שהתנועה תישאר יציבה."]],
      [["Why do games often keep a character's frames in one sprite sheet?", "Loading one big image is quicker than loading many small ones", ["A sprite sheet makes the character bigger on the screen", "Each frame in a sheet can use more colours than a separate image", "Players can only see frames that are kept in a sheet"], "One file means fewer things to load, and the game simply shows a different part of the same image for each frame."],
        ["למה משחקים שומרים לעיתים קרובות את כל הפריימים של דמות בגיליון דמויות אחד?", "טעינה של תמונה גדולה אחת מהירה יותר מטעינה של הרבה תמונות קטנות", ["גיליון דמויות מגדיל את הדמות על המסך", "כל פריים בגיליון יכול להשתמש ביותר צבעים מתמונה נפרדת", "שחקנים יכולים לראות רק פריימים שנמצאים בגיליון"], "קובץ אחד פירושו פחות דברים לטעון, והמשחק פשוט מציג חלק אחר של אותה תמונה בכל פריים."]],
      [["Which was the first feature-length film made entirely with computer animation, in 1995?", "Toy Story", ["Shrek", "Frozen", "Snow White and the Seven Dwarfs"], "Toy Story, made by Pixar, came out in 1995. Shrek came in 2001 and Frozen in 2013, while Snow White (1937) was drawn by hand."],
        ["מה היה הסרט הארוך הראשון שנעשה כולו בהנפשה ממוחשבת, ב־1995?", "צעצוע של סיפור", ["שרק", "לשבור את הקרח", "שלגייה ושבעת הגמדים"], "״צעצוע של סיפור״ של פיקסאר יצא ב־1995. ״שרק״ יצא ב־2001 ו״לשבור את הקרח״ ב־2013, ו״שלגייה״ (1937) צויר ביד."]],
    ],
    n: [
      [240, ["How many frames are in a 10-second clip at 24 frames per second?", "frames", "Each second has 24 frames, so 10 seconds have 10 × 24 = 240 frames."],
        ["כמה פריימים יש בקטע של 10 שניות בקצב של 24 פריימים לשנייה?", "פריימים", "בכל שנייה יש 24 פריימים, ולכן ב־10 שניות יש 10 × 24 = 240 פריימים."]],
      [12, ["Animating on twos at 24 frames per second means each drawing is shown for 2 frames. How many different drawings are there per second?", "drawings", "24 frames ÷ 2 frames per drawing = 12 drawings each second, which halves the work."],
        ["הנפשה ״בשתיים״ בקצב של 24 פריימים לשנייה פירושה שכל ציור מוצג במשך 2 פריימים. כמה ציורים שונים יש בכל שנייה?", "ציורים", "24 פריימים חלקי 2 פריימים לכל ציור נותנים 12 ציורים בשנייה, וכך העבודה נחצית."]],
    ],
    s: [
      [["Animating a bouncing ball", "Draw the keyframes: the ball at the top and on the floor", "Add the in-betweens between those poses", "Play it back to check the timing", "Fix the frames that look jumpy"],
        ["מנפישים כדור קופץ", "מציירים את תמונות המפתח: הכדור למעלה והכדור על הרצפה", "מוסיפים את תמונות הביניים בין התנוחות האלה", "מנגנים את ההנפשה כדי לבדוק את התזמון", "מתקנים את הפריימים שנראים קופצניים"]],
    ],
  },
  a: {
    t: [
      ["Easing", "changing the speed during a movement, for example starting slowly and then speeding up", "האצה והאטה (easing)", "שינוי המהירות במהלך תנועה, למשל התחלה איטית ואחריה תאוצה"],
      ["Rigging", "giving a 3D character a skeleton of joints so that it can be posed and moved", "בניית שלד (rigging)", "הוספת עצמות ומפרקים לדמות תלת־ממדית כדי שאפשר יהיה להזיז אותה ולהעמיד אותה בתנוחות"],
      ["Rendering", "the computer working out the finished images of a 3D scene, with light, colour and shadow", "רינדור", "החישוב שהמחשב עושה כדי ליצור את התמונות הסופיות של סצנה תלת־ממדית, עם אור, צבע וצל"],
    ],
    q: [
      [["With ease out, an object slows down at the end of its move. Near the end, are its positions in each frame closer together or further apart?", "Closer together, as it moves less each frame", ["Further apart, because it moves more in each frame", "Exactly the same distance apart", "There are no frames near the end"], "Slowing down means covering less distance in each frame, so the drawings bunch up near the end."],
        ["ב־ease out, חפץ מאט בסוף התנועה שלו. קרוב לסוף, המיקומים שלו בפריימים קרובים יותר זה לזה או רחוקים יותר?", "קרובים יותר, כי הוא זז פחות בכל פריים", ["רחוקים יותר, כי הוא זז יותר בכל פריים", "בדיוק באותו מרחק זה מזה", "קרוב לסוף אין בכלל פריימים"], "האטה פירושה מרחק קטן יותר בכל פריים, ולכן הציורים מצטופפים קרוב לסוף."]],
      [["A ball is drawn flattened when it hits the floor and longer when it falls fast. Which principle of animation is this?", "Squash and stretch", ["Slow in and slow out", "Onion skinning", "Rotoscoping"], "Squash and stretch, one of the classic principles of the Disney animators, shows weight and speed by changing an object's shape."],
        ["כדור מצויר שטוח כשהוא פוגע ברצפה, וארוך כשהוא נופל מהר. איזה עיקרון של הנפשה זה?", "מעיכה ומתיחה", ["כניסה איטית ויציאה איטית", "עור בצל", "רוטוסקופיה"], "מעיכה ומתיחה, אחד העקרונות הקלאסיים של מנפישי דיסני, מראה משקל ומהירות בעזרת שינוי הצורה של החפץ."]],
      [["When a ball is squashed, what should stay about the same so that it still looks solid?", "Its volume: wider as it gets flatter", ["Its height, which must never change at all", "Its position on the screen", "Its colour only"], "If the ball got flatter without getting wider, it would seem to shrink. Keeping the amount of ball the same makes it look like a real object."],
        ["כשכדור נמעך, מה צריך להישאר בערך אותו דבר כדי שעדיין ייראה מוצק?", "הנפח שלו: הוא רחב יותר ככל שהוא שטוח יותר", ["הגובה שלו, שצריך להישאר בדיוק כמו לפני הפגיעה", "המיקום שלו על המסך", "רק הצבע שלו"], "אם הכדור היה נעשה שטוח בלי להתרחב, הוא היה נראה כאילו הוא מתכווץ. שמירה על אותה כמות של כדור גורמת לו להיראות כמו חפץ אמיתי."]],
      [["What is rotoscoping?", "Tracing over filmed live action, frame by frame", ["Rotating a 3D model slowly around its own centre", "Drawing a background that scrolls past", "Playing a film backwards"], "Animators film real movement and then draw over each frame, which makes the animated motion very lifelike."],
        ["מהי רוטוסקופיה?", "ציור מעל צילום של שחקנים אמיתיים, פריים אחר פריים", ["סיבוב איטי של מודל תלת־ממדי סביב המרכז של עצמו, שוב ושוב", "ציור של רקע שגולל ועובר", "הקרנה של סרט מהסוף להתחלה"], "מנפישים מצלמים תנועה אמיתית ואז מציירים מעל כל פריים, וכך התנועה המונפשת נראית מאוד טבעית."]],
      [["Rendering one frame of a 3D film can take hours. Why do studios use render farms?", "Many computers render different frames at the same time", ["One computer renders each frame twice to check it is right", "Render farms make the colours brighter than normal", "Render farms store the finished film on paper"], "Each frame can be rendered on its own, so hundreds of computers working in parallel finish the film far sooner than one could."],
        ["רינדור של פריים אחד בסרט תלת־ממדי יכול להימשך שעות. למה אולפנים משתמשים בחוות רינדור?", "הרבה מחשבים מרנדרים פריימים שונים באותו זמן", ["מחשב אחד מרנדר כל פריים פעמיים כדי לוודא שהוא נכון", "חוות רינדור הופכות את הצבעים לבהירים מהרגיל", "חוות רינדור שומרות את הסרט הגמור על נייר"], "אפשר לרנדר כל פריים בנפרד, ולכן מאות מחשבים שעובדים במקביל מסיימים את הסרט הרבה לפני שמחשב אחד היה מסיים."]],
    ],
    n: [
      [50, ["At a steady speed, a ball is at x = 0 on frame 0 and at x = 100 on frame 10. What is its x on frame 5?", "", "From frame 0 to frame 10 is 10 steps, so it moves 100 ÷ 10 = 10 each frame. On frame 5 it has made 5 steps: 5 × 10 = 50."],
        ["כדור זז במהירות קבועה: בפריים 0 הוא ב־x = 0, ובפריים 10 הוא ב־x = 100. מהו ה־x שלו בפריים 5?", "", "מפריים 0 עד פריים 10 יש 10 צעדים, ולכן הוא זז 100 ÷ 10 = 10 בכל פריים. בפריים 5 הוא עשה 5 צעדים: 5 × 10 = 50."]],
      [17, ["A game runs at 60 frames per second. To the nearest whole number, how many milliseconds does each frame last?", "ms", "A second is 1000 milliseconds, and 1000 ÷ 60 is about 16.7, which rounds to 17."],
        ["משחק רץ בקצב של 60 פריימים לשנייה. בעיגול למספר שלם, כמה אלפיות שנייה נמשך כל פריים?", "אלפיות שנייה", "בשנייה יש 1000 אלפיות שנייה, ו־1000 ÷ 60 הוא בערך 16.7, ובעיגול 17."], 0.5],
    ],
    s: [
      [["Making a 3D animated character, in order", "Model the shape of the character", "Rig it with a skeleton of joints", "Animate its poses over time", "Render the finished frames"],
        ["יוצרים דמות מונפשת בתלת־ממד, לפי הסדר", "בונים את הצורה של הדמות (מידול)", "מוסיפים לה שלד של מפרקים", "מנפישים את התנוחות שלה לאורך הזמן", "מרנדרים את הפריימים הסופיים"]],
    ],
  },
};
export default c;
