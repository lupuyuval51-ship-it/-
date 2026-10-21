import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sensor", "a part that lets a machine detect things, like light, touch or distance", "חיישן", "רכיב שמאפשר למכונה לזהות דברים, כמו אור, מגע או מרחק"],
      ["Motor", "a part that turns electricity into movement", "מנוע", "רכיב שהופך חשמל לתנועה"],
      ["Controller", "the small computer that decides what a machine does", "בקר", "המחשב הקטן שמחליט מה המכונה עושה"],
      ["Remote control", "steering a machine from a distance", "שלט רחוק", "הפעלה של מכונה מרחוק"],
    ],
    q: [
      [["A robot vacuum stops before hitting a wall. Which part notices the wall?", "A sensor", ["The motor", "The wheels", "The battery"], "Sensors detect obstacles; the controller then tells the motors to turn."],
        ["שואב אבק רובוטי נעצר לפני שהוא נתקע בקיר. איזה רכיב מבחין בקיר?", "חיישן", ["המנוע", "הגלגלים", "הסוללה"], "חיישנים מזהים מכשולים; הבקר אומר אז למנועים להסתובב."]],
      [["Which of these is a robot?", "A machine that senses, decides and moves by itself", ["A wind-up toy that walks the same way every time", "A calculator that works only when you press its keys", "A hammer"], "A robot senses its surroundings, decides what to do and then acts. A wind-up toy moves but senses nothing, and a calculator computes but cannot sense the world or move."],
        ["מה מהבאים הוא רובוט?", "מכונה שחשה, מחליטה וזזה בעצמה", ["צעצוע עם קפיץ שהולך תמיד באותה דרך בדיוק", "מחשבון שעובד רק כשלוחצים על המקשים שלו", "פטיש"], "רובוט חש את הסביבה, מחליט מה לעשות ואז פועל. צעצוע עם קפיץ זז אבל לא חש דבר, ומחשבון מחשב אבל לא יכול לחוש את העולם או לזוז."]],
      [["What does a robot's controller do?", "It decides what to do from what the sensors report", ["It turns electricity into movement of the wheels", "It stores all the electricity that keeps the robot running", "It detects light, touch or distance"], "The controller is the robot's small computer: it reads the sensors and decides what the motors should do. Motors make the movement, the battery stores the electricity and sensors do the detecting."],
        ["מה עושה הבקר של רובוט?", "הוא מחליט מה לעשות לפי מה שהחיישנים מדווחים", ["הוא הופך חשמל לתנועה של הגלגלים", "הוא אוגר את כל החשמל שמפעיל את הרובוט לאורך זמן", "הוא מזהה אור, מגע או מרחק"], "הבקר הוא המחשב הקטן של הרובוט: הוא קורא את החיישנים ומחליט מה המנועים צריכים לעשות. המנועים יוצרים את התנועה, הסוללה אוגרת את החשמל והחיישנים מזהים."]],
    ],
    n: [
      [60, ["A toy robot rolls 15 cm every second. How far does it go in 4 seconds?", "cm", "Each second adds another 15 cm, so in 4 seconds the robot rolls 4 × 15 = 60 cm."],
        ["רובוט צעצוע מתגלגל 15 ס״מ בכל שנייה. כמה הוא מתקדם ב־4 שניות?", "ס״מ", "כל שנייה מוסיפה עוד 15 ס״מ, ולכן ב־4 שניות הרובוט מתגלגל 4 × 15 = 60 ס״מ."]],
    ],
    s: [
      [["A robot vacuum meets a wall, in order", "Its sensor detects the wall ahead", "The controller decides to turn", "The motors turn the robot", "It drives on in a new direction"],
        ["שואב אבק רובוטי פוגש קיר, לפי הסדר", "החיישן מזהה את הקיר שלפניו", "הבקר מחליט להסתובב", "המנועים מסובבים את הרובוט", "הרובוט ממשיך לנסוע לכיוון חדש"]],
    ],
  },
  i: {
    t: [
      ["Actuator", "any part that makes a robot act, such as a motor, a gripper or a speaker", "מפעיל", "כל רכיב שגורם לרובוט לפעול, כמו מנוע, תפסנית או רמקול"],
      ["Feedback loop", "sensing the result of an action and adjusting the next action", "בקרה במשוב", "חישה של תוצאת פעולה ותיקון הפעולה הבאה לפיה"],
      ["Line follower", "a simple robot that uses light sensors to follow a dark line", "רובוט עוקב קו", "רובוט פשוט שמשתמש בחיישני אור כדי לעקוב אחרי קו כהה"],
      ["Autonomous", "able to work without a person controlling it", "אוטונומי", "מסוגל לפעול בלי שאדם שולט בו"],
    ],
    q: [
      [["A line-following robot has a light sensor on each side of a black line. It drifts, and now its right sensor sees the line. What should it do?", "Turn right to get back over the line", ["Turn left, away from the sensor that sees the line", "Keep driving straight ahead, but faster", "Stop and wait until the line moves back"], "The line is now under the right sensor, so the robot has drifted to the left of it. Steering towards the sensor that sees the line brings the line back between the two sensors."],
        ["לרובוט עוקב קו יש חיישן אור בכל צד של קו שחור. הוא סוטה, ועכשיו חיישן ימין שלו רואה את הקו. מה עליו לעשות?", "לפנות ימינה כדי לחזור אל מעל הקו", ["לפנות שמאלה, הרחק מהחיישן שרואה את הקו", "להמשיך ישר קדימה, אבל מהר יותר", "לעצור ולחכות שהקו יחזור למקומו"], "הקו נמצא עכשיו מתחת לחיישן ימין, כלומר הרובוט סטה שמאלה ממנו. פנייה לכיוון החיישן שרואה את הקו מחזירה את הקו אל בין שני החיישנים."]],
      [["Which pattern describes how most robots work?", "Sense → decide → act, again and again", ["Act → stop → forget", "Plan every move at the start, then never sense again", "Sense only, never act"], "Robots repeat a loop: read the sensors, decide, drive the actuators, and then read the sensors again to see what changed."],
        ["איזה דפוס מתאר איך רוב הרובוטים פועלים?", "חישה ← החלטה ← פעולה, שוב ושוב", ["פעולה ← עצירה ← שכחה", "לתכנן את כל התנועות בהתחלה, ואז לא לחוש אף פעם", "רק חישה, בלי פעולה"], "רובוטים חוזרים על לולאה: קוראים חיישנים, מחליטים, מפעילים את המפעילים, ואז קוראים שוב את החיישנים כדי לראות מה השתנה."]],
      [["A robot arm's gripper closes around a cup. What kind of part is the gripper?", "An actuator: it makes the robot act", ["A controller: it decides when to close", "A sensor: it notices the cup", "Neither: it is only a decoration"], "A gripper moves and holds things, so it is an actuator, like a motor or a speaker. The controller decides when it closes, and a sensor may tell the controller that the cup is there."],
        ["התפסנית של זרוע רובוטית נסגרת סביב כוס. איזה סוג של רכיב היא התפסנית?", "מפעיל: הוא גורם לרובוט לפעול", ["בקר: הוא המחשב שמחליט מתי להיסגר", "חיישן: הוא מבחין בכוס", "אף אחד מהם: הוא רק קישוט"], "תפסנית זזה ואוחזת בדברים, ולכן היא מפעיל, כמו מנוע או רמקול. הבקר מחליט מתי היא נסגרת, וחיישן יכול לדווח לבקר שהכוס נמצאת שם."]],
      [["Which of these is autonomous?", "A lawn-mowing robot that finds its own way around the garden", ["A drone that a person flies the whole time with a remote control", "A toy car on a cable that you steer with a joystick", "An electric scooter that its rider steers"], "An autonomous machine works without a person controlling it. A drone flown by remote control and a car steered with a joystick are controlled by people, even though they have motors."],
        ["מה מהבאים אוטונומי?", "רובוט כיסוח דשא שמוצא בעצמו את הדרך בגינה", ["רחפן שאדם מטיס בעזרת שלט רחוק לאורך כל הטיסה", "מכונית צעצוע על כבל שמכוונים בעזרת ג׳ויסטיק", "קורקינט חשמלי שהרוכב מכוון"], "מכונה אוטונומית פועלת בלי שאדם שולט בה. רחפן שמוטס בשלט רחוק ומכונית שמכוונים בג׳ויסטיק נשלטים בידי אנשים, אף שיש בהם מנועים."]],
    ],
    n: [
      [150, ["A robot's controller reads its sensors 50 times every second. How many readings does it make in 3 seconds?", "readings", "It repeats its loop 50 times in each second, so in 3 seconds it reads the sensors 3 × 50 = 150 times."],
        ["הבקר של רובוט קורא את החיישנים שלו 50 פעמים בכל שנייה. כמה קריאות הוא מבצע ב־3 שניות?", "קריאות", "הבקר חוזר על הלולאה 50 פעמים בכל שנייה, ולכן ב־3 שניות הוא קורא את החיישנים 3 × 50 = 150 פעמים."]],
    ],
  },
  a: {
    t: [
      ["PID controller", "a feedback controller that corrects using the current error, its history and its trend", "בקר PID", "בקר משוב שמתקן לפי השגיאה הנוכחית, ההיסטוריה שלה והמגמה שלה"],
      ["Degrees of freedom", "the number of independent ways a robot arm or joint can move", "דרגות חופש", "מספר הדרכים הבלתי תלויות שבהן זרוע רובוטית או מפרק יכולים לנוע"],
      ["Lidar", "a sensor that measures distances by timing laser pulses", "לידאר", "חיישן שמודד מרחקים לפי הזמן שלוקח לפולסים של לייזר לחזור"],
      ["Encoder", "a sensor that measures how far a wheel or motor has turned", "מקודד", "חיישן שמודד כמה גלגל או מנוע הסתובבו"],
    ],
    q: [
      [["A robot's wheel has a circumference of 20 cm. The encoder counts 5 full turns. How far did it travel?", "100 cm", ["25 cm", "4 cm", "200 cm"], "Distance = turns × circumference = 5 × 20 = 100 cm (if the wheel does not slip)."],
        ["היקף הגלגל של רובוט הוא 20 ס״מ. המקודד סופר 5 סיבובים שלמים. כמה הוא נסע?", "100 ס״מ", ["25 ס״מ", "4 ס״מ", "200 ס״מ"], "מרחק = סיבובים × היקף = 5 × 20 = 100 ס״מ (אם הגלגל לא מחליק)."]],
      [["Why do many self-driving cars combine cameras, radar and lidar?", "Each sensor has weaknesses, so combining them gives a more reliable picture", ["Cameras cannot see anything in daylight, so radar and lidar take over during the day", "The more sensors a car has, the faster it is allowed to drive", "Using only one kind of sensor is against the law everywhere"], "Cameras see colours and signs but struggle in darkness and glare, radar still works in rain and fog, and lidar measures exact distances. Combining them, called sensor fusion, covers each one's weak spots."],
        ["למה מכוניות אוטונומיות רבות משלבות מצלמות, מכ״ם ולידאר?", "לכל חיישן יש חולשות, והשילוב נותן תמונה אמינה יותר", ["מצלמות לא רואות דבר באור יום, ולכן מכ״ם ולידאר מחליפים אותן ביום", "ככל שיש למכונית יותר חיישנים, מותר לה לנסוע מהר יותר", "שימוש בסוג אחד בלבד של חיישן אסור בחוק בכל מקום"], "מצלמות רואות צבעים ושלטים אבל מתקשות בחושך ובסנוור, מכ״ם ממשיך לעבוד בגשם ובערפל, ולידאר מודד מרחקים מדויקים. השילוב, שנקרא מיזוג חיישנים, מכסה על נקודות התורפה של כל אחד מהם."]],
      [["A robot must stop 20 cm from a wall. Its controller sets the speed in proportion to the error, the distance still left to go. What happens to the speed as the robot gets closer?", "It slows down, because the error gets smaller", ["It stays the same all the way until the robot touches the wall", "It speeds up, because the wall is closer", "It jumps to full speed backwards at once"], "With proportional control, speed = a fixed number × error. As the gap to the 20 cm mark shrinks, so does the speed, and the robot glides to a stop instead of crashing. This is the P in a PID controller."],
        ["רובוט צריך לעצור 20 ס״מ לפני קיר. הבקר שלו קובע מהירות ביחס ישר לשגיאה, כלומר למרחק שעוד נשאר. מה קורה למהירות ככל שהרובוט מתקרב?", "היא יורדת, כי השגיאה קטנה", ["היא נשארת אותו דבר כל הדרך, עד שהרובוט נוגע בקיר", "היא עולה, כי הקיר קרוב יותר", "היא קופצת מיד למהירות מלאה אחורה"], "בבקרה יחסית, המהירות = מספר קבוע × השגיאה. ככל שהמרחק אל נקודת 20 הס״מ קטן, גם המהירות קטנה, והרובוט נעצר בעדינות במקום להתנגש. זה ה־P שבבקר PID."]],
    ],
    n: [
      [30, ["A lidar pulse comes back after 200 nanoseconds. Light travels about 30 cm in a nanosecond. How far away is the object?", "m", "In 200 ns light travels 200 × 30 = 6,000 cm, which is 60 m. That is the way there and back, so the object is 60 ÷ 2 = 30 m away."],
        ["פולס של לידאר חוזר אחרי 200 ננו־שניות. אור עובר כ־30 ס״מ בננו־שנייה. כמה רחוק העצם?", "מטר", "ב־200 ננו־שניות אור עובר 200 × 30 = 6,000 ס״מ, כלומר 60 מטר. זו הדרך הלוך וחזור, ולכן העצם נמצא במרחק 60 ÷ 2 = 30 מטר."]],
    ],
  },
};
export default c;
