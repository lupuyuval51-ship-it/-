import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Doctor", "a person who finds out what illness someone has and treats it", "רופא", "אדם שמגלה איזו מחלה יש למישהו ומטפל בה"],
      ["Nurse", "a health worker who cares for patients, checks how they are and gives them medicines", "אח או אחות", "איש צוות שמטפל בחולים, בודק איך הם מרגישים ונותן להם תרופות"],
      ["Dentist", "a health expert who looks after teeth and gums", "רופא שיניים", "מומחה בריאות שמטפל בשיניים ובחניכיים"],
      ["Paramedic", "an emergency worker who treats people at the scene and in the ambulance", "פראמדיק", "איש צוות חירום שמטפל באנשים במקום האירוע ובאמבולנס"],
    ],
    q: [
      [["Who hands you your medicine at the pharmacy?", "A pharmacist", ["A dentist", "A firefighter", "A pilot"], "Pharmacists are experts in medicines. They hand them out, check that the dose is right and explain how to take them."],
        ["מי נותן לכם את התרופה בבית המרקחת?", "רוקח", ["רופא שיניים", "כבאי", "טייס"], "רוקחים הם מומחים לתרופות. הם מוסרים אותן, בודקים שהמינון נכון ומסבירים איך לקחת אותן."]],
      [["Who checks your eyesight and can tell if you need glasses?", "An optometrist or an eye doctor", ["A dentist who looks after teeth", "A pharmacist who sells medicine", "A vet who looks after pets"], "Optometrists and eye doctors test how well you see, and can tell if glasses would help."],
        ["מי בודק את הראייה שלכם ויכול לומר אם אתם צריכים משקפיים?", "אופטומטריסט או רופא עיניים", ["רופא שיניים שמטפל בשיניים", "רוקח שמוכר תרופות בבית מרקחת", "וטרינר שמטפל בחיות מחמד"], "אופטומטריסטים ורופאי עיניים בודקים כמה טוב אתם רואים, ויכולים לומר אם משקפיים יעזרו."]],
      [["Who is trained to help a mother give birth to her baby?", "A midwife", ["A physiotherapist", "A pharmacist", "A dentist"], "Midwives look after women during pregnancy and birth and care for the newborn baby in its first days."],
        ["מי מוכשרת לעזור לאם ללדת את התינוק שלה?", "מיילדת", ["פיזיותרפיסטית", "רוקחת", "רופאת שיניים"], "מיילדות מלוות נשים בהיריון ובלידה, ומטפלות בתינוק שנולד בימים הראשונים שלו."]],
      [["What does a stethoscope help a doctor do?", "Listen to the heart and lungs", ["Look deep inside the ears and nose", "Measure how tall a child has grown", "Take a photo of the bones in the arm"], "A stethoscope carries the sounds of the heartbeat and breathing to the doctor's ears, so the doctor can hear if something is wrong."],
        ["במה הסטטוסקופ עוזר לרופא?", "להקשיב ללב ולריאות", ["להסתכל עמוק לתוך האוזניים והאף", "למדוד כמה ילד גדל לגובה", "לצלם את העצמות שביד"], "הסטטוסקופ מעביר את קולות פעימות הלב והנשימה לאוזני הרופא, כך שהוא יכול לשמוע אם משהו לא תקין."]],
      [["Why do doctors and nurses wash their hands so often?", "To stop germs from spreading between patients", ["To keep their hands warm during a long day at work", "To make their hands smell nice for visitors", "Because the soap makes their skin stronger"], "Hands touch many people and things. Washing them between patients is one of the best ways to stop infections from spreading in clinics and hospitals."],
        ["למה רופאים ואחיות שוטפים ידיים כל כך הרבה?", "כדי למנוע מחיידקים לעבור בין המטופלים", ["כדי לשמור על ידיים חמות במשך יום עבודה ארוך", "כדי שלידיים יהיה ריח נעים בשביל המבקרים", "כי הסבון מחזק את העור שלהם"], "הידיים נוגעות בהרבה אנשים וחפצים. שטיפה בין מטופל למטופל היא אחת הדרכים הטובות ביותר לעצור זיהומים במרפאות ובבתי חולים."]],
      [["What do we call a doctor who specialises in children?", "A paediatrician", ["A dentist", "A vet", "A pilot"], "A paediatrician looks after the health of babies, children and teenagers, from check-ups and vaccines to treating illnesses."],
        ["איך קוראים לרופא שמתמחה בילדים?", "רופא ילדים", ["רופא שיניים", "וטרינר", "טייס"], "רופא ילדים שומר על הבריאות של תינוקות, ילדים ובני נוער, מבדיקות וחיסונים ועד טיפול במחלות."]],
    ],
  },
  i: {
    t: [
      ["Pharmacist", "an expert in medicines who checks prescriptions and explains how to take them", "רוקח", "מומחה לתרופות שבודק מרשמים ומסביר איך לקחת את התרופות"],
      ["Physiotherapist", "a therapist who helps people move well again after an injury or operation, using exercises", "פיזיותרפיסט", "מטפל שעוזר לאנשים לחזור לזוז היטב אחרי פציעה או ניתוח, בעזרת תרגילים"],
      ["Speech therapist", "a therapist who helps with speaking, understanding language and swallowing", "קלינאי תקשורת", "מטפל שעוזר בדיבור, בהבנת שפה ובבליעה"],
      ["Dietitian", "an expert in food and eating who plans healthy menus to suit a person's needs", "דיאטן", "מומחה לתזונה ולאכילה שבונה תפריט בריא שמתאים לצרכים של כל אדם"],
    ],
    q: [
      [["Who takes X-ray pictures in a hospital?", "A radiographer", ["A lab technician", "A midwife", "A pharmacist"], "Radiographers operate X-ray, CT and other scanners, take the images safely and pass them to doctors to read."],
        ["מי מצלם צילומי רנטגן בבית החולים?", "טכנאי רנטגן", ["טכנאי מעבדה", "מיילדת", "רוקח"], "טכנאי רנטגן מפעילים את מכשירי הרנטגן, ה־CT ומכשירי הדימות האחרים, מצלמים בבטחה ומעבירים את התמונות לרופאים לפענוח."]],
      [["Who is in charge of putting a patient safely to sleep for an operation?", "An anaesthetist", ["The surgeon who operates", "A radiographer", "A dietitian"], "The anaesthetist gives the medicines that put the patient to sleep and watches breathing and heartbeat during the whole operation, while the surgeon operates."],
        ["מי אחראי להרדים את המטופל בבטחה לפני ניתוח?", "רופא מרדים", ["המנתח שמבצע את הניתוח", "טכנאי רנטגן", "דיאטן"], "הרופא המרדים נותן את התרופות שמרדימות את המטופל ומשגיח על הנשימה ועל הדופק לאורך כל הניתוח, בזמן שהמנתח מנתח."]],
      [["After an illness a girl finds it hard to hold a pencil and get dressed. Who helps with everyday skills like these?", "An occupational therapist", ["A speech and language therapist", "A radiographer", "A dentist"], "Occupational therapists help people do everyday activities, such as writing, dressing and eating, as independently as possible."],
        ["אחרי מחלה קשה לילדה להחזיק עיפרון ולהתלבש. מי עוזר בכישורים יומיומיים כאלה?", "מרפאה בעיסוק", ["קלינאית תקשורת", "טכנאית רנטגן", "רופאת שיניים"], "מרפאות ומרפאים בעיסוק עוזרים לאנשים לבצע פעולות יומיומיות, כמו כתיבה, התלבשות ואכילה, באופן עצמאי ככל האפשר."]],
      [["Who was Florence Nightingale?", "A British nurse who founded modern nursing", ["A Greek doctor who wrote a famous oath for doctors", "The French doctor who invented the stethoscope", "The first woman to fly alone across an ocean"], "In the 1850s, during the Crimean War, Florence Nightingale improved hygiene in army hospitals and later set up a school that shaped modern nursing."],
        ["מי הייתה פלורנס נייטינגייל?", "אחות בריטית שייסדה את הסיעוד המודרני", ["רופאה יוונית שכתבה שבועה מפורסמת לרופאים", "הרופאה הצרפתייה שהמציאה את הסטטוסקופ", "האישה הראשונה שטסה לבד מעל אוקיינוס"], "בשנות ה־50 של המאה ה־19, בזמן מלחמת קרים, פלורנס נייטינגייל שיפרה את ההיגיינה בבתי החולים של הצבא, ואחר כך הקימה בית ספר שעיצב את הסיעוד המודרני."]],
      [["In Israel, which organisation runs the national ambulance service and blood services?", "Magen David Adom", ["The Israel Fire and Rescue Service", "The Israel Police", "The Israel Postal Company"], "Magen David Adom (MDA) answers the emergency number 101, runs the ambulances and collects and supplies blood for the country."],
        ["איזה ארגון בישראל מפעיל את שירות האמבולנסים הארצי ואת שירותי הדם?", "מגן דוד אדום", ["כבאות והצלה לישראל", "משטרת ישראל", "דואר ישראל"], "מגן דוד אדום (מד״א) עונה למספר החירום 101, מפעיל את האמבולנסים ואוסף ומספק דם לכל המדינה."]],
      [["What does a psychologist do?", "Helps people with thoughts, feelings and behaviour, mainly by talking", ["Fixes broken bones by setting them in a hard plaster cast for several weeks", "Fills holes in teeth and cleans them with special tools", "Tests blood samples in a laboratory to look for germs"], "Psychologists listen, assess and use talking therapies to help with worries, sadness, stress or behaviour. They help the mind, not bones or teeth."],
        ["מה עושה פסיכולוג?", "עוזר לאנשים במחשבות, ברגשות ובהתנהגות, בעיקר בעזרת שיחה", ["מקבע עצמות שבורות בעזרת גבס קשה שנשאר על היד או הרגל כמה שבועות", "סותם חורים בשיניים ומנקה אותן בכלים מיוחדים", "בודק דגימות דם במעבדה כדי לחפש חיידקים"], "פסיכולוגים מקשיבים, מאבחנים ומטפלים בשיחה כדי לעזור בדאגות, בעצב, בלחץ או בהתנהגות. הם עוזרים לנפש, לא לעצמות או לשיניים."]],
    ],
    s: [[["What happens after someone calls for an ambulance, in order", "Someone calls 101 and explains what happened", "The call centre sends the nearest ambulance", "The paramedics treat the patient at the scene", "The ambulance takes the patient to hospital", "Doctors and nurses in the emergency room continue the care"],
      ["מה קורה אחרי שמזמינים אמבולנס, לפי הסדר", "מישהו מתקשר ל־101 ומסביר מה קרה", "המוקד שולח את האמבולנס הקרוב ביותר", "הפראמדיקים מטפלים במטופל במקום", "האמבולנס מביא את המטופל לבית החולים", "הרופאים והאחיות בחדר המיון ממשיכים את הטיפול"]]],
  },
  a: {
    t: [
      ["Surgeon", "a doctor who treats illness or injury by operating", "מנתח", "רופא שמטפל במחלה או בפציעה בעזרת ניתוח"],
      ["Psychiatrist", "a medical doctor who treats mental illness and can prescribe medicine for it", "פסיכיאטר", "רופא שמטפל במחלות נפש ויכול לרשום להן תרופות"],
      ["Family doctor", "a doctor in the community who is the first stop for most health problems", "רופא משפחה", "רופא בקהילה שאליו פונים ראשונים ברוב בעיות הבריאות"],
      ["Hippocratic Oath", "a promise of good conduct for doctors, named after an ancient Greek physician", "שבועת היפוקרטס", "הבטחה להתנהגות ראויה של רופאים, שנקראת על שם רופא יווני קדום"],
    ],
    q: [
      [["In an emergency room, a man with sudden chest pain arrives after a girl with a sprained ankle. Who is usually seen first?", "The man, because his problem may be life-threatening", ["The girl, because she arrived at the emergency room first", "Whoever is younger, because children always go first", "Whoever shouts the loudest in the waiting room"], "Emergency rooms use triage: patients are sorted by how urgent their condition is. Chest pain can be a heart attack, so it comes before a sprain."],
        ["בחדר המיון מגיע גבר עם כאב פתאומי בחזה, אחרי נערה עם נקע בקרסול. את מי בדרך כלל בודקים קודם?", "את הגבר, כי הבעיה שלו עלולה לסכן חיים", ["את הנערה, כי היא הגיעה ראשונה לחדר המיון", "את הצעיר מביניהם, כי ילדים תמיד נכנסים קודם", "את מי שצועק הכי חזק בחדר ההמתנה"], "בחדר המיון עושים מיון (טריאז׳): מטופלים מסודרים לפי מידת הדחיפות של מצבם. כאב בחזה יכול להיות התקף לב, ולכן הוא קודם לנקע."]],
      [["Who invented the stethoscope, in 1816?", "René Laennec", ["Louis Pasteur", "Florence Nightingale", "Hippocrates"], "The French doctor René Laennec rolled up paper to listen to a patient's chest in 1816 and then built a wooden tube, the first stethoscope."],
        ["מי המציא את הסטטוסקופ, ב־1816?", "רנה לאנק", ["לואי פסטר", "פלורנס נייטינגייל", "היפוקרטס"], "הרופא הצרפתי רנה לאנק גלגל נייר כדי להקשיב לחזה של מטופלת ב־1816, ואחר כך בנה צינור מעץ, הסטטוסקופ הראשון."]],
      [["A family doctor sends a patient to a heart specialist. What is this called?", "A referral", ["A prescription", "A diagnosis", "A vaccination"], "A referral is a doctor's request for another professional, such as a specialist, to see the patient. A prescription is for medicine."],
        ["רופא משפחה שולח מטופל לרופא מומחה ללב. איך קוראים לזה?", "הפניה", ["מרשם", "אבחנה", "חיסון"], "הפניה היא בקשה של רופא שאיש מקצוע אחר, כמו רופא מומחה, יבדוק את המטופל. מרשם, לעומת זאת, הוא לתרופה."]],
      [["What does 'informed consent' mean in health care?", "The patient agrees to a treatment after being told its benefits and risks", ["The doctor decides everything alone and tells the patient only after the treatment", "The patient signs a form without being told what the treatment is", "The hospital informs the newspapers about every treatment it gives"], "Patients have the right to understand a treatment, its benefits, risks and other options, and then decide. For children, parents usually give consent."],
        ["מה פירוש ״הסכמה מדעת״ בטיפול רפואי?", "המטופל מסכים לטיפול אחרי שהסבירו לו את התועלת ואת הסיכונים", ["הרופא מחליט הכול לבד ומספר למטופל מה הוא עשה רק אחרי שהטיפול נגמר", "המטופל חותם על טופס בלי שמסבירים לו מה הטיפול", "בית החולים מודיע לעיתונים על כל טיפול שהוא נותן"], "למטופלים יש זכות להבין את הטיפול, את התועלת, את הסיכונים ואת האפשרויות האחרות, ואז להחליט. אצל ילדים ההורים נותנים בדרך כלל את ההסכמה."]],
      [["Why are medical records kept confidential?", "Health information is private, shared only with the care team or with permission", ["So that the patient can never see or ask about their own medical information at all", "Because doctors are not allowed to read what other doctors wrote", "Because medical records are only kept for a few days"], "Health workers must keep patients' information private. It is shared only with the care team or with the patient's permission, and patients can see their own records."],
        ["למה שומרים על סודיות של מידע רפואי?", "מידע על בריאות הוא פרטי, ומשתפים אותו רק עם המטפלים או ברשות המטופל", ["כדי שהמטופל לעולם לא יוכל לראות או לשאול על המידע הרפואי של עצמו בכלל", "כי לרופאים אסור לקרוא מה שרופאים אחרים כתבו", "כי שומרים תיקים רפואיים רק כמה ימים"], "אנשי צוות רפואי חייבים לשמור על פרטיות המטופלים. משתפים את המידע רק עם הצוות המטפל או ברשות המטופל, ומטופלים יכולים לראות את התיק שלהם."]],
      [["What does a medical laboratory scientist do?", "Tests blood and other samples to help find out what is wrong", ["Designs and builds new hospital buildings and their operating rooms", "Drives the ambulance to the hospital as fast as possible", "Cooks healthy meals for the patients in the wards"], "Many diagnoses depend on lab results. Laboratory scientists analyse blood, urine and other samples and report the results to the doctors."],
        ["מה עושה עובד מעבדה רפואית?", "בודק דגימות דם ודגימות אחרות כדי לעזור לגלות מה הבעיה", ["מתכנן ובונה מבנים חדשים לבית החולים ואת חדרי הניתוח שלהם", "נוהג באמבולנס לבית החולים מהר ככל האפשר", "מבשל ארוחות בריאות למטופלים במחלקות"], "אבחנות רבות תלויות בתוצאות מעבדה. עובדי מעבדה רפואית בודקים דם, שתן ודגימות אחרות ומדווחים לרופאים על התוצאות."]],
    ],
    n: [[72, ["A nurse counts 18 heartbeats in 15 seconds. What is the pulse in beats per minute?", "beats/min", "A minute has 4 periods of 15 seconds, so 18 × 4 = 72 beats per minute, a normal resting pulse."], ["אחות סופרת 18 פעימות לב ב־15 שניות. מה הדופק בפעימות לדקה?", "פעימות לדקה", "בדקה יש 4 פרקי זמן של 15 שניות, ולכן 18 × 4 = 72 פעימות לדקה, דופק תקין במנוחה."]]],
  },
};
export default c;
