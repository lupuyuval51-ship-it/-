import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Subject (nose)", "the part of a sentence that tells who or what does the action or is being described", "נושא", "החלק במשפט שמציין מי או מה עושה את הפעולה או מתואר בו"],
      ["Predicate (nasu)", "the part that says what the subject does or what is said about it, often the verb", "נשוא", "החלק שאומר מה עושה הנושא או מה נאמר עליו, לרוב הפועל"],
      ["Attribute (levai)", "a word joined to a noun to describe it, usually an adjective, like אדום in כדור אדום", "לוואי", "מילה שמצטרפת לשם עצם ומתארת אותו, לרוב שם תואר, כמו ״אדום״ ב״כדור אדום״"],
      ["Adverbial (te'ur)", "a part that adds details about the action: when, where, how or why it happens", "תיאור", "חלק במשפט שמוסיף פרטים על הפעולה: מתי, איפה, איך או למה היא קורית"],
    ],
    q: [
      [["In הילדה קוראת ספר (the girl is reading a book), what is the subject?", "הילדה", ["ספר", "קוראת", "קוראת ספר"], "Ask who is reading: הילדה. She is the subject; קוראת is the predicate and ספר is what she reads, the object."],
        ["במשפט ״הילדה קוראת ספר״, מהו הנושא?", "הילדה", ["ספר", "קוראת", "קוראת ספר"], "שואלים מי קוראת? – הילדה. היא הנושא; ״קוראת״ היא הנשוא, ו״ספר״ הוא מה שהיא קוראת, המושא."]],
      [["In הכלב נבח בחצר (the dog barked in the yard), what is the predicate?", "נבח", ["הכלב", "בחצר", "הכלב נבח"], "The predicate says what the subject did: נבח. הכלב is the subject, and בחצר tells where it happened."],
        ["במשפט ״הכלב נבח בחצר״, מהו הנשוא?", "נבח", ["הכלב", "בחצר", "הכלב נבח"], "הנשוא אומר מה עשה הנושא: ״נבח״. ״הכלב״ הוא הנושא, ו״בחצר״ מספר איפה זה קרה."]],
      [["In קניתי כובע ירוק (I bought a green hat), which word is an attribute?", "ירוק", ["כובע", "קניתי", "אני"], "ירוק describes the noun כובע, so it is an attribute (לוואי). כובע is what was bought, and קניתי is the predicate."],
        ["במשפט ״קניתי כובע ירוק״, איזו מילה היא לוואי?", "ירוק", ["כובע", "קניתי", "אני"], "״ירוק״ מתאר את שם העצם ״כובע״, ולכן הוא לוואי. ״כובע״ הוא מה שקניתי, ו״קניתי״ הוא הנשוא."]],
      [["In מחר נטייל בגליל (tomorrow we will hike in the Galilee), which part tells when?", "מחר", ["בגליל", "נטייל", "נטייל בגליל"], "מחר answers the question when?, so it is an adverbial of time. בגליל answers where?, and נטייל is the predicate."],
        ["במשפט ״מחר נטייל בגליל״, איזה חלק אומר מתי?", "מחר", ["בגליל", "נטייל", "נטייל בגליל"], "״מחר״ עונה על השאלה מתי?, ולכן הוא תיאור זמן. ״בגליל״ עונה על השאלה איפה?, ו״נטייל״ הוא הנשוא."]],
      [["In הילדים שיחקו בפארק (the children played in the park), what kind of part is בפארק?", "An adverbial of place", ["An adverbial of time", "An adverbial of manner", "The subject"], "בפארק answers where did they play?, so it is an adverbial of place. The subject is הילדים and the predicate is שיחקו."],
        ["במשפט ״הילדים שיחקו בפארק״, איזה חלק במשפט הוא ״בפארק״?", "תיאור מקום", ["תיאור זמן", "תיאור אופן", "נושא"], "״בפארק״ עונה על השאלה איפה שיחקו?, ולכן הוא תיאור מקום. הנושא הוא ״הילדים״ והנשוא הוא ״שיחקו״."]],
      [["In כתבתי מכתב (I wrote a letter) there is no separate word for the subject. Who is the subject?", "אני – the ending ־תי shows it", ["מכתב – it is the only noun", "כתבתי – the verb is the subject too", "אתה – the reader of the letter"], "The ending ־תי of כתבתי shows that the speaker did the action, so the subject is אני even though it is not written. מכתב is what was written, the object."],
        ["במשפט ״כתבתי מכתב״ אין מילה נפרדת לנושא. מי הנושא?", "אני – הסיומת ־תי מראה זאת", ["מכתב – זה שם העצם היחיד", "כתבתי – הפועל הוא גם הנושא", "אתה – מי שיקרא את המכתב"], "הסיומת ־תי בפועל ״כתבתי״ מראה שהדובר עשה את הפעולה, ולכן הנושא הוא ״אני״ אף שהמילה לא נכתבה. ״מכתב״ הוא מה שנכתב – המושא."]],
    ],
  },
  i: {
    t: [
      ["Direct object", "the part the action falls on directly, with no preposition, often marked by את: קראתי את הספר", "מושא ישיר", "החלק שהפעולה חלה עליו ישירות, בלי מילת יחס, ולעיתים קרובות מסומן במילה ״את״: ״קראתי את הספר״"],
      ["Indirect object", "an object joined to the verb by a fixed preposition, as לחבר in חיכיתי לחבר", "מושא עקיף", "מושא שמתחבר לפועל בעזרת מילת יחס קבועה, כמו ״לחבר״ ב״חיכיתי לחבר״"],
      ["Adverbial of manner", "a part that tells how the action is done, like במהירות", "תיאור אופן", "חלק שמספר איך נעשית הפעולה, כמו ״במהירות״"],
      ["Adverbial of reason", "a part that tells why something happens, like מפני הרעש", "תיאור סיבה", "חלק שמספר למה משהו קורה, כמו ״מפני הרעש״"],
    ],
    q: [
      [["In דני נתן לרינה מתנה (Dani gave Rina a present), what is מתנה?", "A direct object", ["An indirect object", "The subject", "The predicate"], "מתנה is what Dani gave, and it joins the verb with no preposition, so it is a direct object. לרינה, with the preposition ל, is the indirect object."],
        ["במשפט ״דני נתן לרינה מתנה״, מהי ״מתנה״?", "מושא ישיר", ["מושא עקיף", "נושא", "נשוא"], "״מתנה״ היא מה שדני נתן, והיא מתחברת לפועל בלי מילת יחס, ולכן היא מושא ישיר. ״לרינה״, עם מילת היחס ל, הוא המושא העקיף."]],
      [["In דיברנו על הסרט (we talked about the film), what is על הסרט?", "An indirect object", ["An adverbial of place", "A direct object", "An attribute"], "The verb דיבר takes the fixed preposition על (to talk about), so על הסרט is an indirect object. It does not say where, so it is not an adverbial of place."],
        ["במשפט ״דיברנו על הסרט״, מהו ״על הסרט״?", "מושא עקיף", ["תיאור מקום", "מושא ישיר", "לוואי"], "הפועל ״דיבר״ בא עם מילת היחס הקבועה ״על״, ולכן ״על הסרט״ הוא מושא עקיף. הוא אינו מספר איפה, ולכן אינו תיאור מקום."]],
      [["In הוא נהג בזהירות (he drove carefully), what is בזהירות?", "An adverbial of manner", ["An adverbial of time", "An adverbial of reason", "An attribute"], "בזהירות answers how did he drive?, so it is an adverbial of manner. An attribute would describe a noun, not the action."],
        ["במשפט ״הוא נהג בזהירות״, מהו ״בזהירות״?", "תיאור אופן", ["תיאור זמן", "תיאור סיבה", "לוואי"], "״בזהירות״ עונה על השאלה איך נהג?, ולכן הוא תיאור אופן. לוואי מתאר שם עצם, ולא את הפעולה."]],
      [["In לא יצאנו בגלל הגשם (we did not go out because of the rain), what is בגלל הגשם?", "An adverbial of reason", ["An adverbial of purpose", "An adverbial of time", "An indirect object"], "בגלל הגשם answers why didn't we go out?, so it is an adverbial of reason. An adverbial of purpose tells the goal, as in כדי לנוח."],
        ["במשפט ״לא יצאנו בגלל הגשם״, מהו ״בגלל הגשם״?", "תיאור סיבה", ["תיאור תכלית", "תיאור זמן", "מושא עקיף"], "״בגלל הגשם״ עונה על השאלה למה לא יצאנו?, ולכן הוא תיאור סיבה. תיאור תכלית מספר מה המטרה, כמו ״כדי לנוח״."]],
      [["Which of these is a simple sentence, with just one predicate?", "אחרי השיעור הלכנו לספרייה העירונית", ["הלכנו לספרייה, ואחר כך חזרנו הביתה", "הלכנו לספרייה כי רצינו ספר חדש", "כשהשיעור נגמר, הלכנו לספרייה"], "It has one predicate, הלכנו; אחרי השיעור is only an adverbial of time. Each of the others has two predicates: two joined clauses, or a clause opened by כי or כש־."],
        ["איזה מהמשפטים הוא משפט פשוט, שיש בו נשוא אחד בלבד?", "אחרי השיעור הלכנו לספרייה העירונית", ["הלכנו לספרייה, ואחר כך חזרנו הביתה", "הלכנו לספרייה כי רצינו ספר חדש", "כשהשיעור נגמר, הלכנו לספרייה"], "יש בו נשוא אחד, ״הלכנו״, ו״אחרי השיעור״ הוא רק תיאור זמן. בכל אחד מהאחרים יש שני נשואים: שני משפטים מחוברים, או פסוקית שנפתחת ב״כי״ או ב״כש־״."]],
      [["In הים שקט (the sea is calm), what is שקט?", "The predicate", ["An attribute", "The subject", "An adverbial of manner"], "הים שקט is a full sentence that says something about the sea, so שקט is the predicate. In הים השקט (the calm sea) it would be an attribute, with ה like its noun."],
        ["במשפט ״הים שקט״, מהו ״שקט״?", "נשוא", ["לוואי", "נושא", "תיאור אופן"], "״הים שקט״ הוא משפט שלם שאומר משהו על הים, ולכן ״שקט״ הוא הנשוא. בצירוף ״הים השקט״ הוא היה לוואי, עם ה׳ הידיעה כמו שם העצם שלו."]],
    ],
  },
  a: {
    t: [
      ["Compound sentence", "two or more independent clauses joined by a word like ו, אבל or לכן", "משפט מאוחה", "שניים או יותר משפטים עצמאיים שמחוברים במילה כמו ו, אבל או לכן"],
      ["Complex sentence", "a main clause with a dependent clause inside it, often opened by ש, כאשר or אם", "משפט מורכב", "משפט עיקרי ובתוכו פסוקית תלויה, שנפתחת לרוב ב־ש, כאשר או אם"],
      ["Subordinate clause", "a clause that cannot stand alone and serves as one part of the main sentence", "פסוקית", "משפט קטן שאינו עומד בפני עצמו ומשמש כאחד מחלקי המשפט העיקרי"],
      ["Copula (oged)", "a word such as הוא or היא that links the subject to a noun predicate: דני הוא התלמיד", "אוגד", "מילה כמו ״הוא״ או ״היא״ שמקשרת בין הנושא לבין נשוא שמני: ״דני הוא התלמיד״"],
    ],
    q: [
      [["Which sentence is compound, two independent clauses joined together?", "ירד גשם, ולכן נשארנו בבית", ["נשארנו בבית כשירד גשם", "נשארנו בבית בגלל הגשם", "הגשם שירד אתמול היה חזק"], "ירד גשם and נשארנו בבית could each stand alone, and ולכן joins them as equals: a compound sentence. כשירד גשם and שירד אתמול are subordinate clauses, and בגלל הגשם is just an adverbial."],
        ["איזה משפט הוא משפט מאוחה?", "ירד גשם, ולכן נשארנו בבית", ["נשארנו בבית כשירד גשם", "נשארנו בבית בגלל הגשם", "הגשם שירד אתמול היה חזק"], "״ירד גשם״ ו״נשארנו בבית״ יכולים לעמוד כל אחד בפני עצמו, ו״ולכן״ מחבר ביניהם כשווים: משפט מאוחה. ״כשירד גשם״ ו״שירד אתמול״ הן פסוקיות, ו״בגלל הגשם״ הוא רק תיאור."]],
      [["In אמרו לנו שהטיול נדחה (they told us that the trip was put off), what is שהטיול נדחה?", "An object clause", ["A subject clause", "A time clause", "An attribute clause"], "Ask what did they tell us?: שהטיול נדחה. The clause does the job of an object, so it is an object clause (פסוקית מושא)."],
        ["במשפט ״אמרו לנו שהטיול נדחה״, מהי ״שהטיול נדחה״?", "פסוקית מושא", ["פסוקית נושא", "פסוקית זמן", "פסוקית לוואי"], "שואלים מה אמרו לנו? – שהטיול נדחה. הפסוקית ממלאת את תפקיד המושא, ולכן היא פסוקית מושא."]],
      [["In הספר שקראתי אתמול היה מרתק (the book I read yesterday was gripping), what does שקראתי אתמול do?", "It describes the noun הספר", ["It tells us when the book was gripping", "It is the object of the verb היה", "It is the subject of the sentence"], "שקראתי אתמול tells which book is meant, so it describes the noun הספר: an attribute clause (פסוקית לוואי). אתמול belongs inside the clause: it is when I read it, not when the book was gripping."],
        ["במשפט ״הספר שקראתי אתמול היה מרתק״, מה תפקידה של ״שקראתי אתמול״?", "היא מתארת את שם העצם ״הספר״", ["היא אומרת מתי הספר היה מרתק", "היא המושא של הפועל ״היה״", "היא הנושא של המשפט כולו"], "״שקראתי אתמול״ מבהירה על איזה ספר מדובר, כלומר מתארת את ״הספר״: זו פסוקית לוואי. ״אתמול״ שייך לפסוקית – מתי קראתי, ולא מתי הספר היה מרתק."]],
      [["בשבוע שעבר טיילנו בזהירות בין הסלעים (last week we hiked carefully among the rocks). Which kind of adverbial is NOT in this sentence?", "An adverbial of reason", ["An adverbial of manner", "An adverbial of place", "An adverbial of time"], "בשבוע שעבר is time, בזהירות is manner and בין הסלעים is place. Nothing tells why we hiked, so there is no adverbial of reason."],
        ["״בשבוע שעבר טיילנו בזהירות בין הסלעים״. איזה סוג של תיאור אין במשפט הזה?", "תיאור סיבה", ["תיאור אופן", "תיאור מקום", "תיאור זמן"], "״בשבוע שעבר״ הוא תיאור זמן, ״בזהירות״ תיאור אופן ו״בין הסלעים״ תיאור מקום. שום חלק אינו אומר למה טיילנו, ולכן אין תיאור סיבה."]],
      [["In במשך הלילה ירד שלג כבד (during the night heavy snow fell), what is the subject?", "שלג", ["הלילה", "ירד", "כבד"], "Ask what fell?: snow, שלג. Here the subject comes after the predicate ירד; כבד is its attribute, and במשך הלילה is an adverbial of time."],
        ["במשפט ״במשך הלילה ירד שלג כבד״, מהו הנושא?", "שלג", ["הלילה", "ירד", "כבד"], "שואלים מה ירד? – שלג. כאן הנושא בא אחרי הנשוא ״ירד״; ״כבד״ הוא הלוואי שלו, ו״במשך הלילה״ הוא תיאור זמן."]],
    ],
    n: [[4, ["How many predicates are there in כשהגענו לחוף, ראינו שהים סוער, ולכן חזרנו הביתה?", "", "There are 4: הגענו, ראינו, סוער (in הים סוער) and חזרנו. Each predicate is the core of a clause, so the sentence is built from 4 clauses."], ["כמה נשואים יש במשפט ״כשהגענו לחוף, ראינו שהים סוער, ולכן חזרנו הביתה״?", "", "יש 4: ״הגענו״, ״ראינו״, ״סוער״ (ב״הים סוער״) ו״חזרנו״. כל נשוא הוא הגרעין של משפט או של פסוקית, ולכן המשפט בנוי מ־4 חלקים כאלה."]]],
  },
};
export default c;
