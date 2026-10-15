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
      [["What does “buenos días” mean?", "Good morning", ["Good night", "Goodbye", "Thank you"], "Buenos días is said in the morning; buenas noches means good night."],
        ["מה פירוש ״buenos días״?", "בוקר טוב", ["לילה טוב", "להתראות", "תודה"], "buenos días אומרים בבוקר; buenas noches פירושו לילה טוב."]],
      [["How do you count “one, two, three” in Spanish?", "uno, dos, tres", ["uno, due, tre", "un, deux, trois", "eins, zwei, drei"], "Uno, dos, tres is Spanish; the others are Italian, French and German."],
        ["איך סופרים ״אחת, שתיים, שלוש״ בספרדית?", "uno, dos, tres", ["uno, due, tre", "un, deux, trois", "eins, zwei, drei"], "uno, dos, tres היא ספרדית; האחרות הן איטלקית, צרפתית וגרמנית."]],
    ],
    n: [[7, ["“cinco” + “dos” = ? (Write the number.)", "", "Cinco is 5 and dos is 2: 5 + 2 = 7, which is siete in Spanish."], ["״cinco״ + ״dos״ = ? (כתבו את המספר.)", "", "cinco הוא 5 ו־dos הוא 2: 5 + 2 = 7, ובספרדית siete."]]],
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
    ],
    n: [[20, ["“treinta” − “diez” = ? (Write the number.)", "", "Treinta is 30 and diez is 10: 30 − 10 = 20, which is veinte."], ["״treinta״ − ״diez״ = ? (כתבו את המספר.)", "", "treinta הוא 30 ו־diez הוא 10: 30 − 10 = 20, ובספרדית veinte."]]],
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
      [["Why does a Spanish question such as “¿Cómo estás?” begin with “¿”?", "Spanish marks the start of a question with an upside-down question mark", ["It is a typing mistake", "It means the sentence is shouted", "It shows that the first word is a name"], "Spanish writes ¿ at the start and ? at the end of a question (and ¡ … ! around an exclamation)."],
        ["למה שאלה בספרדית כמו ״¿Cómo estás?״ מתחילה ב־״¿״?", "בספרדית מסמנים את תחילת השאלה בסימן שאלה הפוך", ["זו טעות הקלדה", "זה אומר שהמשפט נצעק", "זה מראה שהמילה הראשונה היא שם"], "בספרדית כותבים ¿ בתחילת שאלה ו־? בסופה (ו־¡ … ! סביב קריאה)."]],
      [["You meet someone new and they say “Mucho gusto”. What does it mean?", "Nice to meet you", ["Good luck", "Much better", "Too much"], "Mucho gusto is a polite phrase used when you meet someone for the first time."],
        ["אתם פוגשים מישהו חדש והוא אומר ״Mucho gusto״. מה זה אומר?", "נעים מאוד (להכיר)", ["בהצלחה", "הרבה יותר טוב", "יותר מדי"], "Mucho gusto הוא ביטוי מנומס שאומרים כשפוגשים מישהו בפעם הראשונה."]],
    ],
    n: [[10, ["“cien” − “noventa” = ? (Write the number.)", "", "Cien is 100 and noventa is 90: 100 − 90 = 10, which is diez."], ["״cien״ − ״noventa״ = ? (כתבו את המספר.)", "", "cien הוא 100 ו־noventa הוא 90: 100 − 90 = 10, ובספרדית diez."]]],
  },
};
export default c;
