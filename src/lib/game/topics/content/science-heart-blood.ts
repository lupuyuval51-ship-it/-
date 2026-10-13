import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Heart", "the muscle that pumps blood around the body", "לב", "השריר שמזרים דם בכל הגוף"],
      ["Blood", "the red liquid that carries oxygen and food to every part of the body", "דם", "הנוזל האדום שמוביל חמצן ומזון לכל חלקי הגוף"],
      ["Pulse", "the beat you can feel in your wrist or neck each time the heart pumps", "דופק", "הפעימה שמרגישים בפרק כף היד או בצוואר בכל פעם שהלב שואב"],
      ["Blood vessels", "the tubes that carry blood around the body", "כלי דם", "הצינורות שמובילים דם בגוף"],
    ],
    q: [
      [["What happens to your heartbeat when you run?", "It gets faster", ["It stops", "It gets slower", "It stays exactly the same"], "Working muscles need more oxygen, so the heart pumps faster."],
        ["מה קורה לדופק כשרצים?", "הוא נעשה מהיר יותר", ["הוא נעצר", "הוא נעשה איטי יותר", "הוא נשאר בדיוק אותו דבר"], "שרירים שעובדים צריכים יותר חמצן, ולכן הלב פועם מהר יותר."]],
      [["About how big is your heart?", "About the size of your fist", ["About the size of your head", "About the size of a pea", "About the size of a football"], "A heart is roughly as big as its owner's clenched fist."],
        ["בערך מה גודל הלב שלכם?", "בערך בגודל האגרוף שלכם", ["בערך בגודל הראש", "בערך בגודל אפונה", "בערך בגודל כדורגל"], "הלב גדול בערך כמו האגרוף הקמוץ של בעליו."]],
    ],
  },
  i: {
    t: [
      ["Artery", "a blood vessel that carries blood away from the heart", "עורק", "כלי דם שמוביל דם מהלב החוצה"],
      ["Vein", "a blood vessel that carries blood back to the heart", "וריד", "כלי דם שמחזיר דם אל הלב"],
      ["Capillary", "a tiny, thin-walled blood vessel where substances pass in and out of the blood", "נימה", "כלי דם זעיר עם דופן דקה, שבו חומרים עוברים אל הדם וממנו"],
      ["Red blood cells", "cells that carry oxygen using haemoglobin", "תאי דם אדומים", "תאים שנושאים חמצן בעזרת המוגלובין"],
    ],
    q: [
      [["Which blood cells help fight infections?", "White blood cells", ["Red blood cells", "Platelets", "Plasma"], "White blood cells attack germs; red cells carry oxygen and platelets help blood clot."],
        ["אילו תאי דם עוזרים להילחם בזיהומים?", "תאי דם לבנים", ["תאי דם אדומים", "טסיות", "פלזמה"], "תאי דם לבנים תוקפים חיידקים; תאים אדומים נושאים חמצן וטסיות עוזרות לקרישת הדם."]],
      [["How many chambers does the human heart have?", "4", ["2", "3", "6"], "Two atria on top and two ventricles below."],
        ["כמה חדרים יש בלב האדם?", "4", ["2", "3", "6"], "שתי עליות למעלה ושני חדרים למטה."]],
    ],
  },
  a: {
    t: [
      ["Double circulation", "blood passes through the heart twice per round: once to the lungs and once to the body", "מחזור דם כפול", "הדם עובר בלב פעמיים בכל סיבוב: פעם אל הריאות ופעם אל הגוף"],
      ["Ventricle", "a lower chamber of the heart, which pumps blood out", "חדר הלב", "תא תחתון בלב, ששואב את הדם החוצה"],
      ["Atrium", "an upper chamber of the heart, which receives blood", "עלייה", "תא עליון בלב, שקולט את הדם"],
      ["Valve", "a flap that stops blood flowing backwards", "מסתם", "דש שמונע מהדם לזרום אחורה"],
    ],
    q: [
      [["Which vessel carries oxygen-poor blood from the heart to the lungs?", "The pulmonary artery", ["The aorta", "The pulmonary vein", "The vena cava"], "Arteries leave the heart: the pulmonary artery is the one artery that carries oxygen-poor blood."],
        ["איזה כלי דם מוביל דם דל חמצן מהלב לריאות?", "עורק הריאה", ["אבי העורקים", "וריד הריאה", "הווריד הנבוב"], "עורקים יוצאים מהלב: עורק הריאה הוא העורק היחיד שמוביל דם דל בחמצן."]],
      [["Why is the wall of the left ventricle thicker than the right?", "It must pump blood to the whole body, not just the lungs", ["It holds more valves", "It receives blood from the lungs only", "It is older"], "The left ventricle pushes blood around the whole body at higher pressure."],
        ["למה הדופן של החדר השמאלי עבה יותר מזו של הימני?", "הוא צריך לשאוב דם לכל הגוף, לא רק לריאות", ["יש בו יותר מסתמים", "הוא מקבל דם רק מהריאות", "הוא ותיק יותר"], "החדר השמאלי דוחף דם לכל הגוף בלחץ גבוה יותר."]],
    ],
    s: [[["The path of blood through the heart, from the body", "Vena cava", "Right atrium", "Right ventricle", "Pulmonary artery to the lungs", "Pulmonary vein back to the left atrium"], ["מסלול הדם בלב, מהגוף", "הווריד הנבוב", "העלייה הימנית", "החדר הימני", "עורק הריאה אל הריאות", "וריד הריאה בחזרה אל העלייה השמאלית"]]],
  },
};
export default c;
