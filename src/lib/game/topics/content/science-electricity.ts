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
      [["A bulb is connected to a battery, but one wire is loose. What happens?", "The bulb stays off because the loop is broken", ["The bulb glows half as bright", "The battery explodes", "The bulb flashes"], "Electricity only flows around a complete loop; a gap stops the current everywhere in a simple circuit."],
        ["נורה מחוברת לסוללה, אבל חוט אחד מנותק. מה קורה?", "הנורה לא נדלקת כי המעגל פתוח", ["הנורה דולקת בחצי עוצמה", "הסוללה מתפוצצת", "הנורה מהבהבת"], "חשמל זורם רק במעגל סגור; רווח במעגל פשוט עוצר את הזרם בכולו."]],
      [["Why are electric wires covered in plastic?", "Plastic is an insulator and keeps us safe from shocks", ["Plastic makes electricity flow faster", "To make the wires heavier", "Plastic stores electricity"], "The copper inside conducts; the plastic outside insulates so the current cannot pass into us."],
        ["למה חוטי חשמל מצופים בפלסטיק?", "פלסטיק הוא מבודד ושומר עלינו מהתחשמלות", ["הפלסטיק מזרז את זרימת החשמל", "כדי שהחוטים יהיו כבדים יותר", "הפלסטיק אוגר חשמל"], "הנחושת שבפנים מוליכה; הפלסטיק שבחוץ מבודד כך שהזרם לא יעבור אלינו."]],
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
      [["Why are the lights in a house wired in parallel?", "Each one can be switched on and off on its own", ["It uses fewer wires", "It makes all of them dimmer", "It stops current from flowing"], "Each branch has its own path, so one lamp off or broken does not affect the others, and each gets the full voltage."],
        ["למה המנורות בבית מחוברות במקביל?", "כדי שאפשר להדליק ולכבות כל אחת בנפרד", ["כדי להשתמש בפחות חוטים", "כדי שכולן יהיו עמומות יותר", "כדי לעצור את הזרם"], "לכל ענף מסלול משלו, ולכן מנורה כבויה או שרופה לא משפיעה על האחרות, וכל אחת מקבלת את המתח המלא."]],
    ],
  },
  a: {
    t: [
      ["Resistance", "how much a part opposes the current, measured in ohms", "התנגדות", "עד כמה רכיב מעכב את הזרם, נמדדת באוהם"],
      ["Ohm's law", "voltage equals current times resistance: V = I × R", "חוק אוהם", "המתח שווה למכפלת הזרם בהתנגדות: V = I × R"],
      ["Power", "the rate at which energy is transferred, in watts: P = V × I", "הספק", "הקצב שבו מועברת אנרגיה, בוואט: P = V × I"],
      ["Short circuit", "a path with almost no resistance, which lets a dangerously large current flow", "קצר", "מסלול כמעט בלי התנגדות, שמאפשר לזרם גדול ומסוכן לזרום"],
    ],
    q: [
      [["What does a fuse or circuit breaker do?", "It cuts the circuit when the current gets too large", ["It stores extra electricity", "It raises the voltage", "It turns AC into DC"], "Too much current heats wires and can start a fire; the fuse melts or the breaker trips and stops it."],
        ["מה עושה נתיך או מפסק זרם אוטומטי?", "מנתק את המעגל כשהזרם גדול מדי", ["אוגר חשמל עודף", "מעלה את המתח", "הופך זרם חילופין לזרם ישר"], "זרם גדול מדי מחמם חוטים ועלול לגרום לשריפה; הנתיך נמס או המפסק ״קופץ״ ועוצר אותו."]],
      [["A kettle is rated 2000 W and is used for 0.5 hours. How much energy does it use?", "1 kWh", ["4 kWh", "2 kWh", "0.25 kWh"], "Energy = power × time = 2 kW × 0.5 h = 1 kWh."],
        ["קומקום בהספק של 2000 W פועל חצי שעה. כמה אנרגיה הוא צורך?", "1 קוט״ש", ["4 קוט״ש", "2 קוט״ש", "0.25 קוט״ש"], "אנרגיה = הספק × זמן = 2 קילוואט × 0.5 שעה = 1 קוט״ש."]],
    ],
    n: [[2, ["A 12 V battery drives current through a 6 Ω resistor. What is the current?", "A", "Ohm's law: I = V ÷ R = 12 ÷ 6 = 2 A."], ["סוללה של 12 וולט מעבירה זרם דרך נגד של 6 אוהם. מה הזרם?", "אמפר", "לפי חוק אוהם: I = V ÷ R = 12 ÷ 6 = 2 אמפר."]]],
  },
};
export default c;
