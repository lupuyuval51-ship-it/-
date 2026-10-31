import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Circuit", "a complete loop that electricity can flow around", "מעגל חשמלי", "לולאה סגורה שהחשמל יכול לזרום בה"],
      ["Battery", "a store of chemical energy that pushes electricity around a circuit", "סוללה", "מאגר של אנרגיה כימית שדוחף את החשמל במעגל"],
      ["Switch", "a part that opens or closes a gap in a circuit to turn it off or on", "מתג", "רכיב שפותח או סוגר רווח במעגל כדי לכבות או להדליק אותו"],
      ["Conductor", "a material that lets electricity flow through it easily, like copper", "מוליך", "חומר שחשמל זורם דרכו בקלות, כמו נחושת"],
      ["Insulator", "a material that does not let electricity flow through it, like plastic", "מבודד", "חומר שחשמל לא זורם דרכו, כמו פלסטיק"],
    ],
    q: [
      [["A bulb is connected to a battery, but one wire is loose. What happens?", "The bulb stays off because the loop is broken", ["The bulb glows half as bright, because half of the loop is still joined", "The battery gets very hot, because the electricity has nowhere to go", "The bulb flashes on and off"], "Electricity only flows around a complete loop; a gap stops the current everywhere in a simple circuit."],
        ["נורה מחוברת לסוללה, אבל חוט אחד מנותק. מה קורה?", "הנורה לא נדלקת כי המעגל פתוח", ["הנורה דולקת בחצי עוצמה, כי חצי מהמעגל עדיין מחובר", "הסוללה מתחממת מאוד, כי לחשמל אין לאן ללכת", "הנורה מהבהבת"], "חשמל זורם רק במעגל סגור; רווח במעגל פשוט עוצר את הזרם בכולו."]],
      [["Why are electric wires covered in plastic?", "Plastic is an insulator and keeps us safe from shocks", ["Plastic makes the electricity flow faster along the wire", "So that the wires are heavier and harder to bend", "Plastic stores electricity for later"], "The copper inside conducts; the plastic outside insulates so the current cannot pass into us."],
        ["למה חוטי חשמל מצופים בפלסטיק?", "פלסטיק הוא מבודד ושומר עלינו מהתחשמלות", ["הפלסטיק מזרז את זרימת החשמל לאורך החוט כולו", "כדי שהחוטים יהיו כבדים וקשים יותר לכיפוף", "הפלסטיק אוגר חשמל לשימוש מאוחר יותר"], "הנחושת שבפנים מוליכה; הפלסטיק שבחוץ מבודד כך שהזרם לא יעבור אלינו."]],
      [["Which of these is a good conductor of electricity?", "A copper wire", ["A rubber glove", "A wooden spoon", "A plastic ruler"], "Metals such as copper let electric current flow through them easily. Rubber, wood and plastic are insulators, which is why they are used for handles and to cover wires."],
        ["איזה מהחפצים האלה מוליך חשמל היטב?", "חוט נחושת", ["כפפת גומי", "כף עץ", "סרגל פלסטיק"], "מתכות כמו נחושת מאפשרות לזרם חשמלי לזרום דרכן בקלות. גומי, עץ ופלסטיק הם מבודדים, ולכן משתמשים בהם לידיות ולציפוי חוטים."]],
      [["You notice that the cable of a lamp is torn and the wire inside can be seen. What should you do?", "Keep away from it, do not touch it, and tell an adult", ["Wrap it in a wet cloth so that it cools down", "Plug it in for a moment to check whether it still works", "Touch the wire gently to see whether it is hot"], "Torn insulation can leave the metal wire exposed, and touching it can give a dangerous electric shock. An adult should switch off the power and replace the cable. Water makes the danger even greater."],
        ["אתם מבחינים שהכבל של מנורה קרוע ואפשר לראות את החוט שבפנים. מה צריך לעשות?", "להתרחק ממנו, לא לגעת בו ולספר למבוגר", ["לעטוף אותו בבד רטוב כדי שיתקרר", "לחבר אותו לחשמל לרגע כדי לבדוק אם הוא עדיין עובד", "לגעת בחוט בעדינות כדי לבדוק אם הוא חם"], "בידוד קרוע יכול להשאיר את חוט המתכת חשוף, ומגע בו עלול לגרום להתחשמלות מסוכנת. מבוגר צריך לנתק את החשמל ולהחליף את הכבל. מים מגדילים את הסכנה עוד יותר."]],
    ],
  },
  i: {
    t: [
      ["Current", "the flow of electric charge around a circuit, measured in amperes", "זרם", "זרימה של מטען חשמלי במעגל, נמדדת באמפר"],
      ["Voltage", "the electrical push that drives current, measured in volts", "מתח", "הדחיפה החשמלית שמניעה זרם, נמדדת בוולט"],
      ["Series circuit", "a circuit with only one path, so all parts share the same current", "חיבור בטור", "מעגל עם מסלול אחד בלבד, כך שבכל הרכיבים עובר אותו זרם"],
      ["Parallel circuit", "a circuit with several branches, each with its own path back to the battery", "חיבור במקביל", "מעגל עם כמה ענפים, ולכל אחד מסלול משלו בחזרה לסוללה"],
    ],
    q: [
      [["Two bulbs are in series and one breaks. What happens to the other?", "It goes out too", ["It glows brighter", "It stays the same", "It glows dimmer but stays on"], "In series there is only one path; a broken bulb breaks the loop for everything."],
        ["שתי נורות מחוברות בטור ואחת נשרפת. מה קורה לשנייה?", "גם היא כבה", ["היא דולקת חזק יותר", "היא נשארת אותו דבר", "היא נחלשת אבל נשארת דולקת"], "בחיבור בטור יש מסלול אחד בלבד; נורה שרופה פותחת את המעגל לכולם."]],
      [["Why are the lights in a house wired in parallel?", "Each one can be switched on and off on its own", ["So that they use fewer wires and cost less to install", "So that all of the lamps glow dimmer and save electricity", "So that all the lamps go out when one of them breaks"], "Each branch has its own path, so one lamp off or broken does not affect the others, and each gets the full voltage."],
        ["למה המנורות בבית מחוברות במקביל?", "כדי שאפשר להדליק ולכבות כל אחת בנפרד", ["כדי להשתמש בפחות חוטים ולהוזיל את ההתקנה", "כדי שכל המנורות יהיו עמומות יותר ויחסכו חשמל", "כדי שכל המנורות יכבו כשאחת מהן נשרפת"], "לכל ענף מסלול משלו, ולכן מנורה כבויה או שרופה לא משפיעה על האחרות, וכל אחת מקבלת את המתח המלא."]],
      [["Why is it dangerous to touch a plug or a switch with wet hands?", "Wet skin lets a much bigger current pass through your body", ["Water makes the switch slippery, and that is the only danger", "Water turns the current into steam inside the wire", "Water makes the electricity in the wall run out"], "Dry skin resists the flow of electricity quite well, but wet skin and tap water, which contains dissolved salts, conduct it much better. A current that passes through the body can stop the heart, so keep your hands dry near sockets."],
        ["למה מסוכן לגעת בתקע או במתג בידיים רטובות?", "עור רטוב מאפשר לזרם הרבה יותר גדול לעבור דרך הגוף", ["המים הופכים את המתג לחלקלק, וזו הסכנה היחידה", "המים הופכים את הזרם לקיטור בתוך החוט", "המים גורמים לחשמל שבקיר להיגמר"], "עור יבש מתנגד לזרימת חשמל די טוב, אבל עור רטוב ומי ברז, שיש בהם מלחים מומסים, מוליכים הרבה יותר טוב. זרם שעובר בגוף יכול לעצור את הלב, ולכן שומרים על ידיים יבשות ליד שקעים."]],
      [["Two identical bulbs are connected in series to one battery. Compared with a single bulb on the same battery, how do they glow?", "Dimmer, because the battery's push is shared between them", ["Brighter, because there are more bulbs to give light", "The same, because the battery has not changed", "They do not light at all, because the current has to split in two"], "In series the same current goes through both bulbs and the battery's voltage is shared between them, so each bulb gets only half of it and glows dimmer. In parallel each bulb would get the full voltage and glow normally."],
        ["שתי נורות זהות מחוברות בטור לסוללה אחת. בהשוואה לנורה אחת על אותה סוללה, איך הן דולקות?", "בעוצמה חלשה יותר, כי הדחיפה של הסוללה מתחלקת ביניהן", ["בעוצמה חזקה יותר, כי יש יותר נורות שנותנות אור", "באותה עוצמה, כי הסוללה לא השתנתה", "הן לא נדלקות בכלל, כי הזרם צריך להתפצל לשניים"], "בחיבור בטור עובר אותו זרם בשתי הנורות, והמתח של הסוללה מתחלק ביניהן, ולכן כל נורה מקבלת רק חצי ממנו ודולקת בעוצמה חלשה יותר. בחיבור במקביל כל נורה הייתה מקבלת את המתח המלא ודולקת בעוצמה רגילה."]],
    ],
    s: [[["The energy changes in a torch, in order", "The battery stores chemical energy", "The battery pushes electric current around the circuit", "The bulb turns the electrical energy into light and heat"],
      ["שינויי האנרגיה בפנס, לפי הסדר", "הסוללה אוגרת אנרגיה כימית", "הסוללה דוחפת זרם חשמלי במעגל", "הנורה הופכת את האנרגיה החשמלית לאור ולחום"]]],
  },
  a: {
    t: [
      ["Resistance", "how much a part opposes the current, measured in ohms", "התנגדות", "עד כמה רכיב מעכב את הזרם, נמדדת באוהם"],
      ["Ohm's law", "voltage equals current times resistance: V = I × R", "חוק אוהם", "המתח שווה למכפלת הזרם בהתנגדות: V = I × R"],
      ["Power", "the rate at which energy is transferred, in watts: P = V × I", "הספק", "הקצב שבו מועברת אנרגיה, בוואט: P = V × I"],
      ["Short circuit", "a path with almost no resistance, which lets a dangerously large current flow", "קצר", "מסלול כמעט בלי התנגדות, שמאפשר לזרם גדול ומסוכן לזרום"],
    ],
    q: [
      [["What does a fuse or circuit breaker do?", "It cuts the circuit when the current gets too large", ["It stores extra electricity for when the power goes out", "It raises the voltage when a device needs more power", "It changes the electricity from AC into DC"], "Too much current heats wires and can start a fire; the fuse melts or the breaker trips and stops it."],
        ["מה עושה נתיך או מפסק זרם אוטומטי?", "מנתק את המעגל כשהזרם גדול מדי", ["אוגר חשמל עודף לשעה שהחשמל נפסק", "מעלה את המתח כשמכשיר צריך יותר הספק", "הופך זרם חילופין לזרם ישר"], "זרם גדול מדי מחמם חוטים ועלול לגרום לשריפה; הנתיך נמס או המפסק ״קופץ״ ועוצר אותו."]],
      [["A kettle is rated 2000 W and is used for 0.5 hours. How much energy does it use?", "1 kWh", ["4 kWh", "2 kWh", "0.25 kWh"], "Energy = power × time = 2 kW × 0.5 h = 1 kWh."],
        ["קומקום בהספק של 2000 W פועל חצי שעה. כמה אנרגיה הוא צורך?", "1 קוט״ש", ["4 קוט״ש", "2 קוט״ש", "0.25 קוט״ש"], "אנרגיה = הספק × זמן = 2 קילוואט × 0.5 שעה = 1 קוט״ש."]],
      [["A bird sits on a bare high-voltage power line and is not harmed. Why not?", "Both its feet touch the same wire, so almost no current flows through it", ["Its feathers are such good insulators that they protect it from any voltage, however high", "Birds are too light for any current to flow through them", "The voltage in power lines is too low to harm anything"], "Current flows only when there is a voltage difference across a body. The bird's feet are on the same wire, so there is almost no voltage between them. A person who touches the line and the ground at the same time gives the current a path to the ground, and that can be deadly."],
        ["ציפור יושבת על קו מתח גבוה חשוף ולא נפגעת. למה?", "שתי רגליה נוגעות באותו חוט, ולכן כמעט לא זורם זרם דרכה", ["נוצותיה מבודדות כל כך טוב שהן מגינות עליה מכל מתח, גבוה ככל שיהיה", "ציפורים קלות מדי מכדי שזרם יזרום דרכן", "המתח בקווי חשמל נמוך מכדי לפגוע במשהו"], "זרם זורם רק כשיש הפרש מתחים על פני גוף. רגלי הציפור נמצאות על אותו חוט, ולכן כמעט אין מתח ביניהן. אדם שנוגע בקו ובקרקע בו־זמנית נותן לזרם מסלול אל הקרקע, וזה עלול להיות קטלני."]],
    ],
    n: [[2, ["A 12 V battery drives current through a 6 Ω resistor. What is the current?", "A", "Ohm's law: I = V ÷ R = 12 ÷ 6 = 2 A. A larger resistance would let less current through."], ["סוללה של 12 וולט מעבירה זרם דרך נגד של 6 אוהם. מה הזרם?", "אמפר", "לפי חוק אוהם: I = V ÷ R = 12 ÷ 6 = 2 אמפר. נגד גדול יותר היה מעביר פחות זרם."]],
      [4, ["Two 6 Ω resistors are connected in parallel to a 12 V battery. What is the total current from the battery?", "A", "Each resistor has the full 12 V across it, so each carries 12 ÷ 6 = 2 A. The two currents add up: 2 + 2 = 4 A."],
        ["שני נגדים של 6 אוהם מחוברים במקביל לסוללה של 12 וולט. מהו הזרם הכולל שיוצא מהסוללה?", "אמפר", "על כל נגד פועל המתח המלא של 12 וולט, ולכן בכל אחד עובר זרם של 12 ÷ 6 = 2 אמפר. שני הזרמים מצטרפים: 2 + 2 = 4 אמפר."]],
      [36, ["A small motor is connected to a 12 V battery and takes a current of 3 A. What power does it use?", "W", "Power = voltage × current = 12 V × 3 A = 36 W. Every second the motor takes 36 joules of energy from the battery."],
        ["מנוע קטן מחובר לסוללה של 12 וולט וצורך זרם של 3 אמפר. באיזה הספק הוא פועל?", "ואט", "הספק = מתח × זרם = 12 וולט × 3 אמפר = 36 ואט. בכל שנייה המנוע לוקח מהסוללה 36 ג׳אול של אנרגיה."]],
    ],
  },
};
export default c;
