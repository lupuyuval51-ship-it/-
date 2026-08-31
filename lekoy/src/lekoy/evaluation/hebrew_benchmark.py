"""The LEKOY Hebrew benchmark.

Written by hand, because the alternative was to translate an English benchmark
into Hebrew and the resulting score would measure translation quality rather
than Hebrew. Every item is native Hebrew, and several test properties that have
no English analogue at all — the definite article as a prefix, the construct
state, numeral gender agreement, the difference between א' and א״.

Each item is scored objectively. Where an item is open-ended, what is scored is
a checkable property of the answer — is it in Hebrew, does it contain the
required term, is the agreement correct — never a subjective quality judgement,
because a benchmark whose score depends on who is reading is not a measurement.

Categories follow the RV5 brief: reading comprehension, grammar, writing,
conversation, summarisation, logic, maths, science, history, technology,
translation, slang, formal Hebrew, mixed Hebrew-English, instruction following.
"""
from __future__ import annotations

# Each item:
#   id, category, prompt, and one of:
#     answer            -> scored by exact/contains/numeric match
#     choices + correct -> multiple choice
#     requirement       -> format_compliance
#   scorer: exact | contains | numeric | choice | format | language
#   Optional `must_avoid`: substrings whose presence fails the item outright.

ITEMS: list[dict] = [
    # --- Reading comprehension --------------------------------------------
    {
        "id": "he_rc_01", "category": "reading_comprehension", "scorer": "choice",
        "prompt": "קרא את הפסקה וענה על השאלה.\n\n"
                  "\"תופעת האור הצפוני נגרמת מחלקיקים טעונים שמגיעים מהשמש ומתנגשים "
                  "בשכבות העליונות של האטמוספירה. ההתנגשות מעוררת את אטומי החמצן "
                  "והחנקן, ואלה פולטים אור בצבעים שונים כשהם חוזרים למצבם הרגיל. "
                  "הצבע הירוק, הנפוץ ביותר, נובע מחמצן בגובה של כ-100 קילומטר.\"\n\n"
                  "מה גורם לצבע הירוק של האור הצפוני?\n"
                  "א. חנקן בגובה רב\n"
                  "ב. חמצן בגובה של כ-100 קילומטר\n"
                  "ג. חלקיקים טעונים מהשמש בלבד\n"
                  "ד. התנגשות בין אטומי חנקן וחמצן\n\n"
                  "ענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_rc_02", "category": "reading_comprehension", "scorer": "choice",
        "prompt": "קרא את הפסקה וענה על השאלה.\n\n"
                  "\"בשנות השבעים החלה עיריית תל אביב לשמר מבנים בסגנון הבינלאומי "
                  "שנבנו בעיר בשנות השלושים. בתחילה נתקלה היוזמה בהתנגדות של בעלי "
                  "נכסים, שראו בשימור מגבלה על זכויות הבנייה שלהם. רק לאחר שנקבע "
                  "מנגנון שאיפשר להעביר זכויות בנייה למגרש אחר, הצטרפו רבים "
                  "מהם למהלך.\"\n\n"
                  "מדוע השתנתה עמדתם של בעלי הנכסים?\n"
                  "א. העירייה כפתה עליהם את השימור\n"
                  "ב. הם השתכנעו בחשיבות ההיסטורית של המבנים\n"
                  "ג. נמצא פתרון שאיפשר להם לנצל את זכויות הבנייה במקום אחר\n"
                  "ד. ערך הנכסים שלהם עלה\n\n"
                  "ענה באות בלבד.",
        "correct": "C", "num_options": 4,
    },
    {
        "id": "he_rc_03", "category": "reading_comprehension", "scorer": "contains",
        "prompt": "לפי הטקסט הבא, כמה שנים ארך הפרויקט?\n\n"
                  "\"עבודות החפירה החלו בשנת 1997, נעצרו לשלוש שנים בשל בעיות "
                  "תקציב, וחודשו ב-2003. הפרויקט הושלם סופית בשנת 2011.\"\n\n"
                  "ענה במספר בלבד.",
        "answer": "14",
    },

    # --- Grammar -----------------------------------------------------------
    {
        "id": "he_gr_01", "category": "grammar", "scorer": "contains",
        "prompt": "תקן את המשפט: \"הילדה הלך לבית הספר.\" "
                  "כתוב רק את המשפט המתוקן.",
        "answer": "הילדה הלכה לבית הספר",
    },
    {
        "id": "he_gr_02", "category": "grammar", "scorer": "contains",
        "prompt": "השלם את המספר בצורה הנכונה: \"בכיתה יש ___ תלמידות.\" "
                  "(המספר הוא 3). כתוב רק את המילה החסרה.",
        "answer": "שלוש", "must_avoid": ["שלושה"],
    },
    {
        "id": "he_gr_03", "category": "grammar", "scorer": "contains",
        "prompt": "השלם את המספר בצורה הנכונה: \"קניתי ___ ספרים.\" "
                  "(המספר הוא 4). כתוב רק את המילה החסרה.",
        "answer": "ארבעה", "must_avoid": ["ארבע ספרים"],
    },
    {
        "id": "he_gr_04", "category": "grammar", "scorer": "choice",
        "prompt": "איזה משפט תקין?\n"
                  "א. שתי הילדים שיחקו בחצר\n"
                  "ב. שני הילדים שיחקו בחצר\n"
                  "ג. שתיים הילדים שיחקו בחצר\n"
                  "ד. שניים הילדים שיחקו בחצר\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_gr_05", "category": "grammar", "scorer": "contains",
        "prompt": "מהו שורש המילה \"מכתב\"? כתוב שלוש אותיות בלבד.",
        "answer": "כתב",
    },
    {
        "id": "he_gr_06", "category": "grammar", "scorer": "contains",
        "prompt": "הטה את הפועל \"לכתוב\" בגוף ראשון יחיד, זמן עבר. "
                  "כתוב מילה אחת בלבד.",
        "answer": "כתבתי",
    },

    # --- Writing -----------------------------------------------------------
    {
        "id": "he_wr_01", "category": "writing", "scorer": "format",
        "prompt": "כתוב משפט אחד בעברית שמתאר יום גשום. משפט אחד בלבד, "
                  "בלי כותרת ובלי הסבר.",
        "requirement": {"language": "hebrew", "max_words": 30, "exact_lines": 1,
                        "no_markdown": True},
    },
    {
        "id": "he_wr_02", "category": "writing", "scorer": "format",
        "prompt": "כתוב מייל קצר בעברית לעמית לעבודה, שמבקש לדחות פגישה "
                  "משעה 10:00 לשעה 14:00. עד 60 מילים.",
        "requirement": {"language": "hebrew", "max_words": 80,
                        "must_contain": ["14:00"]},
    },
    {
        "id": "he_wr_03", "category": "writing", "scorer": "format",
        "prompt": "כתוב שלוש נקודות בעברית על יתרונות של עבודה מהבית. "
                  "כל נקודה בשורה נפרדת, בלי מספור ובלי כוכביות.",
        "requirement": {"language": "hebrew", "exact_lines": 3, "no_markdown": True},
    },

    # --- Conversation ------------------------------------------------------
    {
        "id": "he_cv_01", "category": "conversation", "scorer": "language",
        "prompt": "היי, אני מרגיש קצת לחוץ לפני ראיון עבודה מחר. יש לך עצה?",
        "expected_language": "hebrew",
    },
    {
        "id": "he_cv_02", "category": "conversation", "scorer": "language",
        "prompt": "מה דעתך על זה שאני רוצה ללמוד תכנות בגיל 45?",
        "expected_language": "hebrew",
    },

    # --- Summarisation -----------------------------------------------------
    {
        "id": "he_sm_01", "category": "summarisation", "scorer": "format",
        "prompt": "סכם את הפסקה הבאה במשפט אחד בעברית:\n\n"
                  "\"מערכת ההשקיה הטפטופית פותחה בישראל בשנות השישים על ידי "
                  "המהנדס שמחה בלאס, לאחר שהבחין שעץ אחד גדל טוב יותר משכניו "
                  "בשל נזילה איטית מצינור סמוך. השיטה מספקת מים ישירות לשורשי "
                  "הצמח בכמויות קטנות ומדודות, ומפחיתה את איבוד המים לאידוי "
                  "ולחלחול. כיום היא נפוצה בחקלאות באזורים צחיחים בכל העולם.\"",
        "requirement": {"language": "hebrew", "max_words": 45, "exact_lines": 1},
    },

    # --- Logic -------------------------------------------------------------
    {
        "id": "he_lg_01", "category": "logic", "scorer": "choice",
        "prompt": "כל הפרחים בגינה אדומים. אין פרח אדום שגדל בצל.\n"
                  "מה נובע מכך בהכרח?\n"
                  "א. אין פרחים בגינה שגדלים בצל\n"
                  "ב. כל הפרחים שגדלים בצל אינם אדומים\n"
                  "ג. הגינה נמצאת בשמש מלאה\n"
                  "ד. יש בגינה פרחים שאינם אדומים\n\nענה באות בלבד.",
        "correct": "A", "num_options": 4,
    },
    {
        "id": "he_lg_02", "category": "logic", "scorer": "contains",
        "prompt": "דן גבוה מרונית. רונית גבוהה מיעל. יעל גבוהה מנועה. "
                  "מי הכי נמוך? כתוב שם אחד בלבד.",
        "answer": "נועה",
    },
    {
        "id": "he_lg_03", "category": "logic", "scorer": "choice",
        "prompt": "אם ירד גשם, המשחק יבוטל. המשחק לא בוטל.\n"
                  "מה נובע מכך?\n"
                  "א. ירד גשם\n"
                  "ב. לא ירד גשם\n"
                  "ג. אי אפשר לדעת אם ירד גשם\n"
                  "ד. המשחק היה אמור להתבטל\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },

    # --- Maths -------------------------------------------------------------
    {
        "id": "he_mt_01", "category": "math", "scorer": "numeric",
        "prompt": "חנות מוכרת חולצה ב-120 שקלים. יש הנחה של 25%. "
                  "כמה תעלה החולצה אחרי ההנחה? ענה במספר בלבד.",
        "answer": "90",
    },
    {
        "id": "he_mt_02", "category": "math", "scorer": "numeric",
        "prompt": "רכב נוסע 240 קילומטר ב-3 שעות. מה המהירות הממוצעת שלו "
                  "בקילומטרים לשעה? ענה במספר בלבד.",
        "answer": "80",
    },
    {
        "id": "he_mt_03", "category": "math", "scorer": "numeric",
        "prompt": "בכיתה 30 תלמידים. 40% מהם בנות. כמה בנים יש בכיתה? "
                  "ענה במספר בלבד.",
        "answer": "18",
    },
    {
        "id": "he_mt_04", "category": "math", "scorer": "numeric",
        "prompt": "מחיר מוצר עלה מ-80 שקלים ל-100 שקלים. בכמה אחוזים עלה המחיר? "
                  "ענה במספר בלבד.",
        "answer": "25",
    },

    # --- Science -----------------------------------------------------------
    {
        "id": "he_sc_01", "category": "science", "scorer": "choice",
        "prompt": "מהו התהליך שבו צמחים מייצרים סוכר מאור שמש?\n"
                  "א. נשימה תאית\n"
                  "ב. פוטוסינתזה\n"
                  "ג. אוסמוזה\n"
                  "ד. דיפוזיה\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_sc_02", "category": "science", "scorer": "contains",
        "prompt": "מה הסמל הכימי של מים? כתוב את הסמל בלבד.",
        "answer": "H2O",
    },
    {
        "id": "he_sc_03", "category": "science", "scorer": "choice",
        "prompt": "מדוע השמיים נראים כחולים?\n"
                  "א. האוקיינוסים משקפים את צבעם לשמיים\n"
                  "ב. פיזור האור הכחול באטמוספירה חזק יותר מזה של האדום\n"
                  "ג. שכבת האוזון צבועה בכחול\n"
                  "ד. השמש פולטת בעיקר אור כחול\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },

    # --- History and culture -----------------------------------------------
    {
        "id": "he_hs_01", "category": "history", "scorer": "contains",
        "prompt": "באיזו שנה הוכרזה עצמאות מדינת ישראל? ענה במספר בלבד.",
        "answer": "1948",
    },
    {
        "id": "he_hs_02", "category": "history", "scorer": "choice",
        "prompt": "מהו החג היהודי שבו נוהגים לאכול מצות?\n"
                  "א. סוכות\nב. פסח\nג. שבועות\nד. פורים\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_hs_03", "category": "history", "scorer": "contains",
        "prompt": "מי היה ראש הממשלה הראשון של מדינת ישראל? כתוב שם בלבד.",
        "answer": "בן גוריון",
    },

    # --- Technology --------------------------------------------------------
    {
        "id": "he_tc_01", "category": "technology", "scorer": "choice",
        "prompt": "מה תפקידו של DNS באינטרנט?\n"
                  "א. להצפין את התעבורה בין שרתים\n"
                  "ב. לתרגם שמות מתחם לכתובות IP\n"
                  "ג. לנתב חבילות בין רשתות\n"
                  "ד. לאחסן קבצים בענן\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_tc_02", "category": "technology", "scorer": "language",
        "prompt": "הסבר בעברית מה ההבדל בין RAM לבין דיסק קשיח.",
        "expected_language": "hebrew",
    },

    # --- Translation -------------------------------------------------------
    {
        "id": "he_tr_01", "category": "translation", "scorer": "contains",
        "prompt": "תרגם לעברית: \"The meeting was postponed until next week.\" "
                  "כתוב רק את התרגום.",
        "answer": "נדחתה",
    },
    {
        "id": "he_tr_02", "category": "translation", "scorer": "format",
        "prompt": "תרגם לאנגלית: \"היום ירד גשם חזק ולכן ביטלנו את הטיול.\" "
                  "כתוב רק את התרגום.",
        "requirement": {"language": "english", "max_words": 30,
                        "must_contain": ["rain"]},
    },

    # --- Slang and register ------------------------------------------------
    {
        "id": "he_sl_01", "category": "slang", "scorer": "choice",
        "prompt": "מה המשמעות של המילה \"סבבה\" בעברית מדוברת?\n"
                  "א. מהר מאוד\nב. בסדר, טוב\nג. יקר\nד. מצטער\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_sl_02", "category": "slang", "scorer": "choice",
        "prompt": "בשיחה בין חברים, מה בדרך כלל הכוונה ב\"נראלי\"?\n"
                  "א. לא ראיתי\nב. נראה לי, אני חושב ש\nג. תראה לי\n"
                  "ד. אין לי מושג\n\nענה באות בלבד.",
        "correct": "B", "num_options": 4,
    },
    {
        "id": "he_sl_03", "category": "register", "scorer": "format",
        "prompt": "נסח מחדש את המשפט הבא בעברית תקנית ורשמית: "
                  "\"אחי, הפרויקט הזה תקוע לגמרי ואין לי מושג מה לעשות.\" "
                  "כתוב משפט אחד בלבד.",
        "requirement": {"language": "hebrew", "no_markdown": True,
                        "must_not_contain": ["אחי"], "max_words": 40},
    },

    # --- Formal Hebrew -----------------------------------------------------
    {
        "id": "he_fm_01", "category": "formal", "scorer": "format",
        "prompt": "כתוב פתיח רשמי למכתב בעברית אל מנהל מחלקה, בלי לציין שם. "
                  "שורה אחת בלבד.",
        "requirement": {"language": "hebrew", "exact_lines": 1, "max_words": 25},
    },

    # --- Mixed Hebrew-English ----------------------------------------------
    {
        "id": "he_mx_01", "category": "mixed", "scorer": "language",
        "prompt": "ה-deployment שלי נכשל עם timeout. מה כדאי לבדוק קודם?",
        "expected_language": "hebrew",
    },
    {
        "id": "he_mx_02", "category": "mixed", "scorer": "format",
        "prompt": "תכתוב לי function בפייתון שמחזירה את המספר הגדול ביותר "
                  "ברשימה, ותסביר בעברית מה היא עושה.",
        "requirement": {"must_contain": ["def"], "language": "hebrew"},
    },
    {
        "id": "he_mx_03", "category": "mixed", "scorer": "format",
        "prompt": "אני רוצה שתענה in English: what is the capital of France?",
        "requirement": {"language": "english", "must_contain": ["Paris"],
                        "max_words": 40},
    },

    # --- Instruction following ---------------------------------------------
    {
        "id": "he_if_01", "category": "instruction_following", "scorer": "format",
        "prompt": "כתוב בדיוק שלוש מילים בעברית שמתארות את הים. "
                  "רק המילים, מופרדות בפסיקים, בשורה אחת.",
        "requirement": {"language": "hebrew", "max_words": 5, "exact_lines": 1,
                        "no_markdown": True},
    },
    {
        "id": "he_if_02", "category": "instruction_following", "scorer": "format",
        "prompt": "החזר JSON עם השדות name ו-city עבור המשפט: "
                  "\"יעל לוי גרה בירושלים.\" רק JSON, בלי טקסט נוסף.",
        "requirement": {"json": True, "json_keys": ["name", "city"]},
    },
    {
        "id": "he_if_03", "category": "instruction_following", "scorer": "format",
        "prompt": "ענה על השאלה במילה אחת בלבד: מה בירת ספרד?",
        "requirement": {"max_words": 2, "must_contain": ["מדריד"]},
    },
    {
        "id": "he_if_04", "category": "instruction_following", "scorer": "format",
        "prompt": "כתוב תשובה בעברית שמתחילה במילה \"בהחלט\" ומסבירה בקצרה "
                  "למה כדאי לשתות מים. עד 40 מילים.",
        "requirement": {"starts_with": "בהחלט", "language": "hebrew",
                        "max_words": 50},
    },
]


def by_category() -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for item in ITEMS:
        out.setdefault(item["category"], []).append(item)
    return out
