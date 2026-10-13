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
      [["Which of these is a robot?", "A machine that senses, decides and moves by itself", ["A hammer", "A paper map", "A spoon"], "Robots sense their surroundings, process information and act."],
        ["מה מהבאים הוא רובוט?", "מכונה שחשה, מחליטה וזזה בעצמה", ["פטיש", "מפה מנייר", "כף"], "רובוטים חשים את הסביבה, מעבדים מידע ופועלים."]],
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
      [["A line-following robot drifts so its right sensor sees the black line. What should it do?", "Turn right to get back on the line", ["Turn left", "Stop forever", "Speed up straight ahead"], "Steering towards the sensor that sees the line brings the robot back over it."],
        ["רובוט עוקב קו סוטה, וחיישן ימין שלו רואה את הקו השחור. מה עליו לעשות?", "לפנות ימינה כדי לחזור לקו", ["לפנות שמאלה", "לעצור לתמיד", "להאיץ ישר קדימה"], "פנייה לכיוון החיישן שרואה את הקו מחזירה את הרובוט מעליו."]],
      [["Which pattern describes how most robots work?", "Sense → decide → act, again and again", ["Act → stop → forget", "Decide once and never sense", "Sense only, never act"], "Robots repeat a loop: read sensors, compute, drive actuators."],
        ["איזה דפוס מתאר איך רוב הרובוטים פועלים?", "חישה ← החלטה ← פעולה, שוב ושוב", ["פעולה ← עצירה ← שכחה", "החלטה פעם אחת בלי לחוש אף פעם", "רק חישה, בלי פעולה"], "רובוטים חוזרים על לולאה: קוראים חיישנים, מחשבים ומפעילים את המפעילים."]],
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
      [["Why do self-driving cars combine cameras, radar and lidar?", "Each sensor has weaknesses, so combining them gives a more reliable picture", ["Using one would be illegal", "They need more weight", "Cameras cannot work in daylight"], "Sensor fusion covers for darkness, glare, rain and other conditions that fool a single sensor."],
        ["למה מכוניות אוטונומיות משלבות מצלמות, מכ״ם ולידאר?", "לכל חיישן יש חולשות, והשילוב נותן תמונה אמינה יותר", ["שימוש באחד בלבד אסור בחוק", "הן צריכות יותר משקל", "מצלמות לא עובדות באור יום"], "מיזוג חיישנים מפצה על חושך, סנוור, גשם ותנאים אחרים שמטעים חיישן יחיד."]],
    ],
  },
};
export default c;
