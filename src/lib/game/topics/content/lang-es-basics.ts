import type { TopicContent } from "../types";

/** Spanish words are shown with their meaning in the language of the game (English or Hebrew). */
const c: TopicContent = {
  b: {
    t: [
      ["hola", "hello", "hola", "שלום (כשנפגשים)"],
      ["adiós", "goodbye", "adiós", "להתראות"],
      ["gracias", "thank you", "gracias", "תודה"],
      ["por favor", "please", "por favor", "בבקשה"],
    ],
    q: [
      [["What does “buenos días” mean?", "Good morning", ["Good night", "Goodbye", "Good afternoon"], "Buenos días is said in the morning; buenas tardes means good afternoon and buenas noches means good night."],
        ["מה פירוש ״buenos días״?", "בוקר טוב", ["לילה טוב", "להתראות", "צהריים טובים"], "buenos días אומרים בבוקר; buenas tardes פירושו צהריים טובים, ו־buenas noches פירושו לילה טוב."]],
      [["How do you count “one, two, three” in Spanish?", "uno, dos, tres", ["uno, due, tre", "un, deux, trois", "eins, zwei, drei"], "Uno, dos, tres is Spanish; the others are Italian, French and German."],
        ["איך סופרים ״אחת, שתיים, שלוש״ בספרדית?", "uno, dos, tres", ["uno, due, tre", "un, deux, trois", "eins, zwei, drei"], "uno, dos, tres היא ספרדית; האחרות הן איטלקית, צרפתית וגרמנית."]],
      [["What number is “ocho”?", "8", ["6", "11", "18"], "Ocho is 8, like the octo- in octopus, an animal with eight arms. Six is seis, eleven is once and eighteen is dieciocho, “ten and eight”."],
        ["איזה מספר הוא ״ocho״?", "8", ["6", "11", "18"], "ocho הוא 8. שש זה seis, אחת־עשרה זה once, ושמונה־עשרה זה dieciocho, כלומר ״עשר ושמונה״."]],
    ],
    n: [[7, ["“cinco” + “dos” = x (Write the number.)", "", "Cinco is 5 and dos is 2: 5 + 2 = 7, which is siete in Spanish."], ["״cinco״ + ״dos״ = x (כתבו את המספר.)", "", "cinco הוא 5 ו־dos הוא 2: 5 + 2 = 7, ובספרדית siete."]]],
  },
  i: {
    t: [
      ["diez", "ten", "diez", "עשר"],
      ["veinte", "twenty", "veinte", "עשרים"],
      ["lunes", "Monday", "lunes", "יום שני"],
      ["domingo", "Sunday", "domingo", "יום ראשון"],
    ],
    q: [
      [["Which word is Spanish for “red”?", "rojo", ["rosa", "verde", "azul"], "Rojo is red; rosa is pink, verde is green and azul is blue."],
        ["איזו מילה היא ״אדום״ בספרדית?", "rojo", ["rosa", "verde", "azul"], "rojo הוא אדום; rosa הוא ורוד, verde הוא ירוק ו־azul הוא כחול."]],
      [["What number is “quince”?", "15", ["50", "14", "5"], "Quince is 15; fifty is cincuenta, fourteen is catorce and five is cinco."],
        ["איזה מספר הוא ״quince״?", "15", ["50", "14", "5"], "quince הוא 15; חמישים זה cincuenta, ארבע־עשרה זה catorce וחמש זה cinco."]],
      [["Which day comes right after lunes (Monday)?", "martes", ["miércoles", "domingo", "sábado"], "The Spanish week runs lunes, martes, miércoles, jueves, viernes, sábado, domingo, so martes (Tuesday) comes after lunes."],
        ["איזה יום בא מיד אחרי lunes (יום שני)?", "martes", ["miércoles", "domingo", "sábado"], "ימי השבוע בספרדית, מיום שני: lunes, martes, miércoles, jueves, viernes, sábado, domingo. לכן martes (יום שלישי) בא אחרי lunes."]],
    ],
    n: [[20, ["“treinta” − “diez” = x (Write the number.)", "", "Treinta is 30 and diez is 10: 30 − 10 = 20, which is veinte."], ["״treinta״ − ״diez״ = x (כתבו את המספר.)", "", "treinta הוא 30 ו־diez הוא 10: 30 − 10 = 20, ובספרדית veinte."]]],
  },
  a: {
    t: [
      ["Me llamo…", "My name is…", "Me llamo…", "קוראים לי…"],
      ["¿Cómo estás?", "How are you?", "¿Cómo estás?", "מה שלומך?"],
      ["Tengo … años", "I am … years old", "Tengo … años", "אני בן … או בת … (גיל)"],
      ["¿Dónde está…?", "Where is…?", "¿Dónde está…?", "איפה נמצא…?"],
    ],
    q: [
      [["Which Spanish sentence means “I am twelve years old”?", "Tengo doce años.", ["Soy doce años.", "Estoy doce años.", "Me llamo doce."], "In Spanish you “have” years: tengo means I have, so Tengo doce años."],
        ["איזה משפט בספרדית פירושו ״אני בן שתים־עשרה״?", "Tengo doce años.", ["Soy doce años.", "Estoy doce años.", "Me llamo doce."], "בספרדית ״יש לכם״ שנים: tengo פירושו ״יש לי״, ולכן Tengo doce años."]],
      [["Why does a Spanish question such as “¿Cómo estás?” begin with “¿”?", "Spanish marks the start of a question with an upside-down question mark", ["It is a printing mistake that Spanish books have copied for hundreds of years", "It shows that the whole sentence is shouted, like an exclamation", "It shows that the first word of the question is a person's name"], "Spanish writes ¿ at the start and ? at the end of a question (and ¡ … ! around an exclamation)."],
        ["למה שאלה בספרדית כמו ״¿Cómo estás?״ מתחילה ב־״¿״?", "בספרדית מסמנים את תחילת השאלה בסימן שאלה הפוך", ["זו טעות דפוס שספרים בספרדית מעתיקים כבר מאות שנים", "זה מראה שכל המשפט נאמר בצעקה, כמו קריאה", "זה מראה שהמילה הראשונה בשאלה היא שם של אדם"], "בספרדית כותבים ¿ בתחילת שאלה ו־? בסופה (ו־¡ … ! סביב קריאה)."]],
      [["You meet someone new and they say “Mucho gusto”. What does it mean?", "Nice to meet you", ["Good luck", "Much better", "I like it very much"], "Mucho gusto is a polite phrase used when you meet someone for the first time. I like it very much would be me gusta mucho."],
        ["אתם פוגשים מישהו חדש והוא אומר ״Mucho gusto״. מה זה אומר?", "נעים מאוד (להכיר)", ["בהצלחה", "הרבה יותר טוב", "אני אוהב את זה מאוד"], "Mucho gusto הוא ביטוי מנומס שאומרים כשפוגשים מישהו בפעם הראשונה. ״אני אוהב את זה מאוד״ אומרים me gusta mucho."]],
    ],
    n: [[10, ["“cien” − “noventa” = x (Write the number.)", "", "Cien is 100 and noventa is 90: 100 − 90 = 10, which is diez."], ["״cien״ − ״noventa״ = x (כתבו את המספר.)", "", "cien הוא 100 ו־noventa הוא 90: 100 − 90 = 10, ובספרדית diez."]]],
  },
};
export default c;
