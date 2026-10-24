import type { TopicContent } from "../types";

/** Spanish words are shown with their meaning in the language of the game (English or Hebrew). */
const c: TopicContent = {
  b: {
    t: [
      ["el", "the, before one masculine noun, as in front of árbol (tree)", "el", "מילת יידוע לפני שם עצם אחד בזכר, כמו לפני árbol (עץ)"],
      ["la", "the, before one feminine noun, as in front of puerta (door)", "la", "מילת יידוע לפני שם עצם אחד בנקבה, כמו לפני puerta (דלת)"],
      ["un", "a or an, before one masculine noun, as in front of gato (cat)", "un", "מילה שפירושה ״איזשהו״ או ״אחד״, לפני שם עצם בזכר, כמו לפני gato (חתול)"],
      ["una", "a or an, before one feminine noun, as in front of silla (chair)", "una", "מילה שפירושה ״איזושהי״ או ״אחת״, לפני שם עצם בנקבה, כמו לפני silla (כיסא)"],
    ],
    q: [
      [["Which article goes with casa (house)?", "la", ["el", "las", "los"], "Casa ends in -a and is feminine, so it takes la: la casa. Las and los are for plural nouns, and el is for masculine ones."],
        ["איזו מילת יידוע באה עם casa (בית)?", "la", ["el", "las", "los"], "casa מסתיימת ב־a והיא בנקבה, ולכן היא מקבלת la: la casa. las ו־los הן לשמות עצם ברבים, ו־el לשמות עצם בזכר."]],
      [["How do you say 'the book' in Spanish?", "el libro", ["la libro", "el libra", "los libro"], "Libro ends in -o and is masculine, so it takes el: el libro. La is for feminine nouns, and los needs a plural noun, libros."],
        ["איך אומרים בספרדית ״הספר״?", "el libro", ["la libro", "el libra", "los libro"], "libro מסתיימת ב־o והיא בזכר, ולכן היא מקבלת el: el libro. la משמשת לנקבה, ו־los דורשת שם עצם ברבים, libros."]],
      [["Which of these nouns is feminine?", "mesa", ["perro", "libro", "gato"], "Most nouns ending in -a are feminine and most ending in -o are masculine. Mesa (table) is feminine: la mesa. Perro (dog), libro (book) and gato (cat) are masculine."],
        ["איזה משמות העצם האלה הוא בנקבה?", "mesa", ["perro", "libro", "gato"], "רוב שמות העצם שמסתיימים ב־a הם בנקבה, ורוב אלה שמסתיימים ב־o הם בזכר. mesa (שולחן) בנקבה: la mesa. perro (כלב), libro (ספר) ו־gato (חתול) בזכר."]],
      [["How do you say 'a dog' in Spanish?", "un perro", ["uno perro", "una perro", "unos perro"], "Perro is masculine, so 'a' is un: un perro. Uno is the number one when it stands alone, una is for feminine nouns and unos is plural."],
        ["איך אומרים בספרדית ״כלב״ (כלב אחד, לא מסוים)?", "un perro", ["uno perro", "una perro", "unos perro"], "perro בזכר, ולכן לפניו באה un: un perro. uno הוא המספר אחת כשהוא עומד לבדו, una משמשת לנקבה ו־unos לרבים."]],
      [["What is the plural of libro?", "libros", ["libroes", "libres", "libra"], "A noun that ends in a vowel adds -s in the plural: libro becomes libros. Nouns that end in a consonant add -es."],
        ["מה צורת הרבים של libro?", "libros", ["libroes", "libres", "libra"], "שם עצם שמסתיים בתנועה מקבל ברבים s בסוף: libro נעשה libros. שמות עצם שמסתיימים בעיצור מקבלים es."]],
      [["Which phrase means 'the white house'?", "la casa blanca", ["la casa blanco", "el casa blanca", "la casa blancas"], "The adjective comes after the noun and matches it: casa is feminine and singular, so blanca. Blanco is masculine and blancas is plural."],
        ["איזה צירוף פירושו ״הבית הלבן״?", "la casa blanca", ["la casa blanco", "el casa blanca", "la casa blancas"], "שם התואר בא אחרי שם העצם ומתאים לו: casa בנקבה וביחיד, ולכן blanca. blanco הוא בזכר, ו־blancas ברבים."]],
    ],
  },
  i: {
    t: [
      ["los", "the, before a plural masculine noun or a mixed group", "los", "מילת היידוע לפני שם עצם ברבים בזכר, או לפני קבוצה מעורבת"],
      ["las", "the, before a plural feminine noun", "las", "מילת היידוע לפני שם עצם ברבים בנקבה"],
      ["Agreement", "the way an adjective copies the gender and number of its noun", "התאמה", "הדרך שבה שם התואר מקבל את המין והמספר של שם העצם שלו"],
    ],
    q: [
      [["What is the plural of ciudad (city)?", "ciudades", ["ciudads", "ciudadas", "ciudadez"], "Ciudad ends in a consonant, d, so it adds -es: ciudades. Adding just -s works only after a vowel."],
        ["מה צורת הרבים של ciudad (עיר)?", "ciudades", ["ciudads", "ciudadas", "ciudadez"], "ciudad מסתיימת בעיצור, d, ולכן היא מקבלת es: ciudades. הוספת s לבד מתאימה רק אחרי תנועה."]],
      [["What is the plural of lápiz (pencil)?", "lápices", ["lápizes", "lápizs", "lápiz"], "Nouns ending in -z change the z to c before -es: lápiz becomes lápices, just as luz (light) becomes luces."],
        ["מה צורת הרבים של lápiz (עיפרון)?", "lápices", ["lápizes", "lápizs", "lápiz"], "בשמות עצם שמסתיימים ב־z, האות z הופכת ל־c לפני es: lápiz נעשה lápices, כמו ש־luz (אור) נעשה luces."]],
      [["Which noun is masculine even though it ends in -a?", "día", ["casa", "mesa", "silla"], "Día (day) is masculine: el día, buenos días. Casa, mesa and silla follow the usual rule and are feminine."],
        ["איזה שם עצם הוא בזכר, אף שהוא מסתיים ב־a?", "día", ["casa", "mesa", "silla"], "día (יום) הוא בזכר: el día, buenos días. casa, mesa ו־silla הולכות לפי הכלל הרגיל והן בנקבה."]],
      [["Which phrase means 'the black cats'?", "los gatos negros", ["las gatos negros", "los gatos negro", "los gato negros"], "Gatos is masculine plural, so the article is los and the adjective is negros. Every word in the phrase shows the plural."],
        ["איזה צירוף פירושו ״החתולים השחורים״?", "los gatos negros", ["las gatos negros", "los gatos negro", "los gato negros"], "gatos בזכר וברבים, ולכן מילת היידוע היא los ושם התואר הוא negros. כל מילה בצירוף מראה את הרבים."]],
      [["Which article goes with canción (song)?", "la", ["el", "un", "los"], "Nouns ending in -ción are feminine, so it is la canción, like la estación (station) and la lección (lesson)."],
        ["איזו מילת יידוע באה עם canción (שיר)?", "la", ["el", "un", "los"], "שמות עצם שמסתיימים ב־ción הם בנקבה, ולכן la canción, כמו la estación (תחנה) ו־la lección (שיעור)."]],
      [["A boy and a girl are both tall. Which sentence is correct?", "El niño y la niña son altos.", ["El niño y la niña son altas.", "El niño y la niña son alto.", "El niño y la niña son alta."], "For a mixed group of masculine and feminine nouns, Spanish uses the masculine plural: altos. Altas would mean that both were girls."],
        ["ילד וילדה גבוהים שניהם. איזה משפט נכון?", "El niño y la niña son altos.", ["El niño y la niña son altas.", "El niño y la niña son alto.", "El niño y la niña son alta."], "לקבוצה מעורבת של זכר ונקבה הספרדית משתמשת ברבים בזכר: altos. altas הייתה מתאימה רק אם שתיהן היו בנות."]],
    ],
    n: [[4, ["Spanish has a word for 'the' for each gender (masculine and feminine), in the singular and in the plural. How many words is that?", "", "Two genders times two numbers gives 4 words: el, la, los and las."], ["בספרדית יש מילת יידוע לכל מין, ביחיד וברבים. כמה מילים זה?", "", "שני מינים כפול שני מספרים נותנים 4 מילים: el, la, los ו־las."]]],
  },
  a: {
    t: [
      ["al", "the joined form of a and el, meaning 'to the' before a masculine noun", "al", "הצורה המחוברת של a ו־el, שפירושה ״אל ה...״ לפני שם עצם בזכר"],
      ["del", "the joined form of de and el, meaning 'of the' or 'from the'", "del", "הצורה המחוברת של de ו־el, שפירושה ״של ה...״ או ״מן ה...״"],
      ["Stressed a- rule", "feminine nouns starting with a stressed a take el in the singular, like águila (eagle)", "הכלל של a מוטעמת", "שמות עצם בנקבה שמתחילים בהברה מוטעמת עם a מקבלים el ביחיד, כמו águila (נשר)"],
      ["Invariable adjective", "an adjective with the same form for masculine and feminine, like grande or azul", "שם תואר זהה בזכר ובנקבה", "שם תואר שיש לו אותה צורה לזכר ולנקבה, כמו grande או azul"],
    ],
    q: [
      [["Which phrase correctly says 'the cold water'?", "el agua fría", ["la agua fría", "el agua frío", "la agua frío"], "Agua is feminine, so its adjective is fría, but it starts with a stressed a, so in the singular it takes el: el agua fría. In the plural it is las aguas."],
        ["איזה צירוף אומר נכון ״המים הקרים״?", "el agua fría", ["la agua fría", "el agua frío", "la agua frío"], "agua בנקבה, ולכן שם התואר הוא fría, אבל היא מתחילה ב־a מוטעמת, ולכן ביחיד היא מקבלת el: el agua fría. ברבים אומרים las aguas."]],
      [["Which pair has the right articles?", "el problema, la mano", ["la problema, el mano", "el problema, el mano", "la problema, la mano"], "Two well-known exceptions: problema ends in -a but is masculine, el problema, and mano ends in -o but is feminine, la mano."],
        ["באיזה זוג מילות היידוע נכונות?", "el problema, la mano", ["la problema, el mano", "el problema, el mano", "la problema, la mano"], "שני יוצאי דופן מוכרים: problema מסתיימת ב־a אבל היא בזכר, el problema, ו־mano מסתיימת ב־o אבל היא בנקבה, la mano."]],
      [["What is the plural of canción?", "canciones", ["canciónes", "cancións", "canción"], "Canción ends in a consonant, so it adds -es. The stress stays on the same syllable, which is now the second-to-last, so the written accent is no longer needed: canciones."],
        ["מה צורת הרבים של canción?", "canciones", ["canciónes", "cancións", "canción"], "canción מסתיימת בעיצור, ולכן היא מקבלת es. ההטעמה נשארת באותה הברה, שעכשיו היא לפני האחרונה, ולכן אין עוד צורך בסימן ההטעמה: canciones."]],
      [["Complete: Vengo ___ mercado (I am coming from the market).", "del", ["de el", "de la", "al"], "De followed by el joins into del: del mercado. Mercado is masculine, so de la is wrong, and al means to the, not from the."],
        ["השלימו: Vengo ___ mercado (אני בא מהשוק).", "del", ["de el", "de la", "al"], "de ואחריה el מתחברות ל־del: del mercado. mercado בזכר, ולכן de la שגויה, ו־al פירושה ״אל ה...״ ולא ״מן ה...״."]],
      [["Which phrase correctly says 'the green houses'?", "las casas verdes", ["las casas verdas", "las casas verde", "los casas verdes"], "Verde ends in -e and has the same form for both genders, so there is no verda. It only adds -s for the plural: las casas verdes."],
        ["איזה צירוף אומר נכון ״הבתים הירוקים״?", "las casas verdes", ["las casas verdas", "las casas verde", "los casas verdes"], "verde מסתיים ב־e ויש לו צורה אחת לשני המינים, ולכן אין verda. ברבים הוא רק מקבל s: las casas verdes."]],
      [["Why is it la foto (the photo), even though foto ends in -o?", "Because foto is short for fotografía, which is feminine", ["Because every noun about pictures is feminine in Spanish", "Because the final -o of foto is never stressed", "Because la goes before every noun with two syllables"], "Foto is a shortened form of la fotografía and keeps its gender: la foto. La moto, from la motocicleta, works the same way."],
        ["למה אומרים la foto (התמונה), אף ש־foto מסתיימת ב־o?", "כי foto היא קיצור של fotografía, שהיא בנקבה", ["כי כל שמות העצם על תמונות הם בנקבה בספרדית", "כי ה־o שבסוף foto אף פעם אינה מוטעמת", "כי la באה לפני כל שם עצם בן שתי הברות"], "foto היא צורה מקוצרת של la fotografía, והיא שומרת על המין שלה: la foto. כך גם la moto, מ־la motocicleta."]],
    ],
  },
};
export default c;
