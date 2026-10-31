import type { TopicContent } from "../types";

/** Spanish words are shown with their meaning in the language of the game (English or Hebrew). */
const c: TopicContent = {
  b: {
    t: [
      ["yo", "I, the person who is speaking", "yo", "אני, מי שמדבר"],
      ["tú", "you, when talking to one friend or family member", "tú", "אתה או את, כשמדברים אל חבר אחד או אל בן משפחה"],
      ["nosotros", "we, a group that includes the speaker", "nosotros", "אנחנו, קבוצה שהדובר שייך אליה"],
      ["Infinitive", "the basic form of a verb, ending in -ar, -er or -ir, like hablar", "שם הפועל", "הצורה הבסיסית של הפועל, שמסתיימת ב־ar, ב־er או ב־ir, כמו hablar"],
    ],
    q: [
      [["Which form completes Yo ___ español (I speak Spanish)?", "hablo", ["hablas", "habla", "hablar"], "With yo, a regular -ar verb drops -ar and adds -o: hablar becomes hablo. Hablas is for tú, habla for él or ella, and hablar is the infinitive."],
        ["איזו צורה משלימה את Yo ___ español (אני מדבר ספרדית)?", "hablo", ["hablas", "habla", "hablar"], "עם yo, פועל רגיל ב־ar מוריד את ar ומוסיף o: hablar נעשה hablo. hablas היא ל־tú, habla ל־él או ל־ella, ו־hablar הוא שם הפועל."]],
      [["What does the verb comer mean?", "to eat", ["to come", "to drink", "to cook"], "Comer means to eat: como pan, I eat bread. It looks like the English come, but to come is venir; to drink is beber and to cook is cocinar."],
        ["מה פירוש הפועל comer?", "לאכול", ["לבוא", "לשתות", "לבשל"], "comer פירושו לאכול: como pan, אני אוכל לחם. לבוא זה venir, לשתות זה beber, ולבשל זה cocinar."]],
      [["Which present-tense ending does hablar take with tú (you)?", "-as: hablas", ["-es: hables", "-a: habla", "-o: hablo"], "With tú, -ar verbs end in -as: tú hablas. The ending -es belongs to tú in -er and -ir verbs, as in comes and vives."],
        ["איזו סיומת הווה מקבל hablar עם tú (אתה, את)?", "-as: hablas", ["-es: hables", "-a: habla", "-o: hablo"], "עם tú, פעלים ב־ar מסתיימים ב־as: tú hablas. הסיומת es שייכת ל־tú בפעלים ב־er וב־ir, כמו comes ו־vives."]],
      [["What does the verb vivir mean?", "to live", ["to see", "to drink", "to go"], "Vivir means to live: vivo en Madrid, I live in Madrid. To see is ver, to drink is beber and to go is ir."],
        ["מה פירוש הפועל vivir?", "לחיות", ["לראות", "לשתות", "ללכת"], "vivir פירושו לחיות, וגם לגור: vivo en Madrid, אני גר במדריד. לראות זה ver, לשתות זה beber, וללכת זה ir."]],
      [["Complete: Ella ___ en Madrid (she lives in Madrid).", "vive", ["vives", "vivo", "viven"], "With él or ella, -er and -ir verbs end in -e: ella vive. Vives is for tú, vivo for yo and viven for ellos."],
        ["השלימו: Ella ___ en Madrid (היא גרה במדריד).", "vive", ["vives", "vivo", "viven"], "עם él או ella, פעלים ב־er וב־ir מסתיימים ב־e: ella vive. vives היא ל־tú, vivo ל־yo ו־viven ל־ellos."]],
      [["Complete: Nosotros ___ pizza (we eat pizza).", "comemos", ["comenos", "comen", "como"], "With nosotros, -er verbs end in -emos: comemos. Comen is for ellos and como for yo; comenos is not a Spanish word."],
        ["השלימו: Nosotros ___ pizza (אנחנו אוכלים פיצה).", "comemos", ["comenos", "comen", "como"], "עם nosotros, פעלים ב־er מסתיימים ב־emos: comemos. comen היא ל־ellos ו־como ל־yo; comenos אינה מילה בספרדית."]],
    ],
  },
  i: {
    t: [
      ["usted", "the polite 'you' for one person, used with the same verb form as él and ella", "usted", "״אתה״ או ״את״ בנימוס לאדם אחד, עם אותה צורת פועל כמו של él ו־ella"],
      ["ustedes", "you, when talking to more than one person; in Latin America it is used with friends too", "ustedes", "אתם או אתן, כשפונים ליותר מאדם אחד; באמריקה הלטינית גם בפנייה לחברים"],
      ["ellos", "they, for a group of men or a mixed group", "ellos", "הם, לקבוצת גברים או לקבוצה מעורבת"],
      ["Verb ending", "the last letters of a verb, which change to show who does the action", "סיומת הפועל", "האותיות האחרונות של הפועל, שמשתנות לפי מי שעושה את הפעולה"],
    ],
    q: [
      [["Complete with tener: Yo ___ dos hermanos (I have two brothers).", "tengo", ["teno", "tienes", "tiene"], "Tener is irregular: with yo it is tengo. Tienes is for tú and tiene for él or ella; teno looks regular but does not exist."],
        ["השלימו בעזרת tener: Yo ___ dos hermanos (יש לי שני אחים).", "tengo", ["teno", "tienes", "tiene"], "tener הוא פועל חריג: עם yo אומרים tengo. tienes היא ל־tú ו־tiene ל־él או ל־ella; teno נראית רגילה, אבל היא אינה קיימת."]],
      [["Complete with ir: Nosotros ___ a la playa (we are going to the beach).", "vamos", ["vemos", "imos", "van"], "Ir (to go) is very irregular, and with nosotros it is vamos. Vemos means we see, from ver, and van is the form for ellos."],
        ["השלימו בעזרת ir: Nosotros ___ a la playa (אנחנו הולכים לחוף).", "vamos", ["vemos", "imos", "van"], "ir (ללכת) הוא פועל חריג מאוד, ועם nosotros הצורה היא vamos. vemos פירושו ״אנחנו רואים״, מהפועל ver, ו־van היא הצורה של ellos."]],
      [["Which pronoun goes with the form habláis?", "vosotros", ["nosotros", "ustedes", "ellos"], "Habláis is the vosotros form, 'you all', used mainly in Spain. Nosotros takes hablamos, and ustedes and ellos take hablan."],
        ["איזה כינוי גוף בא עם הצורה habláis?", "vosotros", ["nosotros", "ustedes", "ellos"], "habláis היא הצורה של vosotros, ״אתם״ או ״אתן״, שמשמשת בעיקר בספרד. nosotros בא עם hablamos, ו־ustedes ו־ellos באים עם hablan."]],
      [["Why can you say just Hablo inglés, without yo?", "Because the ending -o already shows that it is I", ["Because yo may be used only when asking a question", "Because Spanish has no word at all for I", "Because hablo is a noun here, not a verb"], "Spanish verb endings show the person, so the pronoun is often left out: hablo can only mean I speak. Yo is added for emphasis or contrast."],
        ["למה אפשר לומר רק Hablo inglés, בלי yo?", "כי הסיומת o כבר מראה שהדובר הוא ״אני״", ["כי מותר להשתמש ב־yo רק כששואלים שאלה", "כי בספרדית אין בכלל מילה ל״אני״", "כי hablo כאן היא שם עצם ולא פועל"], "בספרדית סיומת הפועל מראה מי עושה את הפעולה, ולכן משמיטים פעמים רבות את כינוי הגוף: hablo יכול להיות רק ״אני מדבר״. מוסיפים yo כדי להדגיש או להשוות."]],
      [["Which sentence correctly says 'You (polite) speak very well'?", "Usted habla muy bien.", ["Usted hablas muy bien.", "Usted hablo muy bien.", "Usted hablan muy bien."], "Usted is a polite 'you', but it takes the same verb form as él and ella: usted habla. Hablas goes with tú."],
        ["איזה משפט אומר נכון, בנימוס, ״אתה מדבר טוב מאוד״?", "Usted habla muy bien.", ["Usted hablas muy bien.", "Usted hablo muy bien.", "Usted hablan muy bien."], "usted פירושו ״אתה״ בנימוס, אבל הוא בא עם אותה צורת פועל כמו él ו־ella: usted habla. hablas באה עם tú."]],
      [["Comer and vivir share most of their present endings. With which persons are they different?", "Nosotros and vosotros: comemos, vivimos", ["Yo and tú: como, comes, vivo, vives", "Él and ellos: come, comen, vive, viven", "They are never different in the present tense"], "Both verbs end in -o, -es, -e and -en, but nosotros says comemos and vivimos, and vosotros says coméis and vivís."],
        ["ל־comer ול־vivir יש כמעט אותן סיומות בהווה. באילו גופים הן שונות?", "nosotros ו־vosotros: comemos, vivimos", ["yo ו־tú: como, comes, vivo, vives", "él ו־ellos: come, comen, vive, viven", "אין ביניהם אף פעם הבדל בהווה"], "בשני הפעלים הסיומות הן o, es, e ו־en, אבל nosotros אומר comemos ו־vivimos, ו־vosotros אומר coméis ו־vivís."]],
    ],
  },
  a: {
    t: [
      ["Stem-changing verb", "a verb whose stem vowel changes when it is stressed, like pensar, pienso and dormir, duermo", "פועל שגזעו משתנה", "פועל שהתנועה בגזע שלו משתנה כשהיא מוטעמת, כמו pensar שנעשה pienso ו־dormir שנעשה duermo"],
      ["Irregular yo form", "a verb that is irregular only with yo, like salir, salgo and poner, pongo", "צורת yo חריגה", "פועל שחריג רק בגוף yo, כמו salir שנעשה salgo ו־poner שנעשה pongo"],
      ["ir a + infinitive", "a way to talk about the near future, as in Voy a comer, I am going to eat", "ir a + שם הפועל", "דרך לדבר על העתיד הקרוב, כמו Voy a comer, אני הולך לאכול"],
    ],
    q: [
      [["Which form of querer (to want) is correct: Yo ___ un helado?", "quiero", ["quero", "quieres", "querro"], "Querer is a stem-changing verb: the stressed e becomes ie, so yo quiero. Quero keeps the e by mistake, quieres is for tú, and querro does not exist."],
        ["איזו צורה של querer (לרצות) נכונה: Yo ___ un helado?", "quiero", ["quero", "quieres", "querro"], "querer הוא פועל שהגזע שלו משתנה: ה־e המוטעמת נעשית ie, ולכן yo quiero. ב־quero נשארה ה־e בטעות, quieres היא ל־tú, ו־querro אינה קיימת."]],
      [["Which form of poder (can) is correct: Nosotros ___ ir mañana?", "podemos", ["puedemos", "pueden", "podimos"], "Poder changes o to ue only where the stem is stressed: puedo, puedes, pueden. In podemos the stress falls on the ending, so the o stays."],
        ["איזו צורה של poder (יכול) נכונה: Nosotros ___ ir mañana?", "podemos", ["puedemos", "pueden", "podimos"], "ב־poder ה־o נעשית ue רק כשהגזע מוטעם: puedo, puedes, pueden. ב־podemos ההטעמה נופלת על הסיומת, ולכן ה־o נשארת."]],
      [["Which of these verbs is irregular only in the yo form?", "hacer (hago)", ["tener (tengo)", "ir (voy)", "ser (soy)"], "Hacer is regular except for yo hago: haces, hace, hacemos. Tener also changes in tienes and tiene, and ir and ser are irregular almost everywhere."],
        ["איזה מהפעלים האלה חריג רק בגוף yo?", "hacer (hago)", ["tener (tengo)", "ir (voy)", "ser (soy)"], "hacer רגיל חוץ מ־yo hago: haces, hace, hacemos. tener משתנה גם ב־tienes וב־tiene, ו־ir ו־ser חריגים כמעט בכל הגופים."]],
      [["What does Vamos a estudiar mean?", "We are going to study", ["We have to study today", "We already studied it", "We are studying now"], "Ir a with an infinitive talks about the near future: vamos a estudiar, we are going to study (it can also mean let's study). Having to do something is tener que."],
        ["מה פירוש Vamos a estudiar?", "אנחנו הולכים ללמוד", ["אנחנו חייבים ללמוד היום", "כבר למדנו את זה", "אנחנו לומדים עכשיו"], "ir a עם שם הפועל מדבר על העתיד הקרוב: vamos a estudiar, אנחנו הולכים ללמוד (ולפעמים גם ״בואו נלמד״). חובה לעשות משהו מביעים ב־tener que."]],
      [["What does Tengo que estudiar mean?", "I have to study", ["I want to study", "I am going to study", "I have a study"], "Tener que with an infinitive means to have to: tengo que estudiar, I have to study. Wanting is querer, and going to study is voy a estudiar."],
        ["מה פירוש Tengo que estudiar?", "אני צריך ללמוד", ["אני רוצה ללמוד", "אני הולך ללמוד", "יש לי חדר עבודה"], "tener que עם שם הפועל פירושו ״חייב, צריך״: tengo que estudiar, אני צריך ללמוד. ״לרצות״ זה querer, ו״אני הולך ללמוד״ זה voy a estudiar."]],
      [["Complete with ser: Ellos ___ de México (they are from Mexico).", "son", ["están", "sois", "es"], "Where someone comes from is said with ser, and with ellos ser is son. Están comes from estar, sois is for vosotros and es for él or ella."],
        ["השלימו בעזרת ser: Ellos ___ de México (הם ממקסיקו).", "son", ["están", "sois", "es"], "מוצא, מאיפה מישהו בא, מביעים ב־ser, ועם ellos הצורה היא son. están באה מ־estar, sois היא ל־vosotros ו־es ל־él או ל־ella."]],
    ],
    s: [[["Put the present forms of ir in the order yo, tú, él, nosotros, vosotros, ellos", "voy", "vas", "va", "vamos", "vais", "van"], ["סדרו את צורות ההווה של ir לפי הסדר yo, tú, él, nosotros, vosotros, ellos", "voy", "vas", "va", "vamos", "vais", "van"]]],
  },
};
export default c;
