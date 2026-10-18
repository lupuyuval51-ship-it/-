import type { TopicContent } from "../types";

/** Spanish words are shown with their meaning in the language of the game (English or Hebrew). */
const c: TopicContent = {
  b: {
    t: [
      ["madre", "mother", "madre", "אמא"],
      ["padre", "father", "padre", "אבא"],
      ["hermano", "brother", "hermano", "אח"],
      ["abuela", "grandmother", "abuela", "סבתא"],
    ],
    q: [
      [["What does hermana mean?", "sister", ["brother", "mother", "aunt"], "Hermana is sister. Hermano, ending in -o, is brother; mother is madre and aunt is tía."],
        ["מה פירוש hermana?", "אחות", ["אח", "אמא", "דודה"], "hermana פירושה אחות. hermano, שמסתיים ב־o, הוא אח; אמא היא madre ודודה היא tía."]],
      [["What is el jardín?", "the garden", ["the garage", "the kitchen", "the roof"], "El jardín is the garden. The garage is el garaje, the kitchen is la cocina and the roof is el tejado."],
        ["מהו el jardín?", "הגינה", ["המוסך", "המטבח", "הגג"], "el jardín היא הגינה. המוסך הוא el garaje, המטבח הוא la cocina והגג הוא el tejado."]],
      [["How do you say 'my father'?", "mi padre", ["mis padre", "tu padre", "me padre"], "My is mi before one thing or person: mi padre. Mis is for more than one (mis padres), tu means your, and me means me, not my."],
        ["איך אומרים ״אבא שלי״?", "mi padre", ["mis padre", "tu padre", "me padre"], "״שלי״ לפני דבר או אדם אחד הוא mi: mi padre. mis משמש ליותר מאחד (mis padres), tu פירושו ״שלך״, ו־me פירושו ״אותי״ ולא ״שלי״."]],
      [["What does alto mean when it describes a person?", "tall", ["short", "old", "thin"], "Alto means tall: mi hermano es alto, my brother is tall. Old is viejo and thin is delgado."],
        ["מה פירוש alto כשמתארים בו אדם?", "גבוה", ["נמוך", "זקן", "רזה"], "alto פירושו גבוה: mi hermano es alto, אחי גבוה. זקן זה viejo, ורזה זה delgado."]],
      [["Where do you usually cook?", "en la cocina", ["en el baño", "en el jardín", "en el dormitorio"], "La cocina is the kitchen, where food is cooked. El baño is the bathroom, el jardín the garden and el dormitorio the bedroom."],
        ["איפה מבשלים בדרך כלל?", "en la cocina", ["en el baño", "en el jardín", "en el dormitorio"], "la cocina היא המטבח, המקום שבו מבשלים. el baño הוא חדר האמבטיה, el jardín הגינה ו־el dormitorio חדר השינה."]],
      [["What does simpático mean when it describes a person?", "nice and friendly", ["feeling sorry for others", "very serious", "tired"], "Simpático means nice and friendly, easy to like. Despite how it looks, it does not mean sympathetic, feeling sorry for someone."],
        ["מה פירוש simpático כשמתארים בו אדם?", "נחמד וחברותי", ["מרחם על אחרים", "רציני מאוד", "עייף"], "simpático פירושו נחמד וחברותי, אדם שקל לחבב. למרות הדמיון למילה האנגלית sympathetic, פירושו אינו ״מרחם על אחרים״."]],
    ],
  },
  i: {
    t: [
      ["primo", "a cousin who is a boy, the son of your uncle or aunt", "primo", "בן דוד, הבן של הדוד או של הדודה"],
      ["tía", "aunt, such as your mother's or father's sister", "tía", "דודה, כמו האחות של אמא או של אבא"],
      ["la habitación", "a room, often a bedroom", "la habitación", "חדר, ובמיוחד חדר שינה"],
      ["divertido", "fun to be with, someone who makes you laugh", "divertido", "מצחיק ומשעשע, שכיף להיות איתו"],
    ],
    q: [
      [["Who is el hermano de mi madre?", "mi tío", ["mi abuelo", "mi primo", "mi hijo"], "Your mother's brother is your uncle: mi tío. Her father would be mi abuelo, and your uncle's son would be mi primo."],
        ["מי הוא el hermano de mi madre?", "mi tío", ["mi abuelo", "mi primo", "mi hijo"], "האח של אמא הוא הדוד: mi tío. אבא של אמא הוא mi abuelo, והבן של הדוד הוא mi primo."]],
      [["How do you say 'my sisters'?", "mis hermanas", ["mi hermanas", "mis hermanos", "mis hermana"], "More than one sister needs mis and the plural hermanas. Mis hermanos would mean my brothers, or my brothers and sisters together."],
        ["איך אומרים ״האחיות שלי״?", "mis hermanas", ["mi hermanas", "mis hermanos", "mis hermana"], "יותר מאחות אחת דורש mis ואת הרבים hermanas. mis hermanos פירושו ״האחים שלי״, או אחים ואחיות יחד."]],
      [["Which sentence means 'His mother is tall'?", "Su madre es alta.", ["Su madre es alto.", "Tu madre es alta.", "Sus madre es alta."], "His is su before one person: su madre. Madre is feminine, so the adjective is alta. Tu means your, and sus is for more than one."],
        ["איזה משפט פירושו ״אמא שלו גבוהה״?", "Su madre es alta.", ["Su madre es alto.", "Tu madre es alta.", "Sus madre es alta."], "״שלו״ לפני אדם אחד הוא su: su madre. madre בנקבה, ולכן שם התואר הוא alta. tu פירושו ״שלך״, ו־sus משמש ליותר מאחד."]],
      [["Which sentence correctly says 'My grandmother has blue eyes'?", "Mi abuela tiene los ojos azules.", ["Mi abuela es los ojos azules.", "Mi abuela tiene los ojos azul.", "Mi abuela tienes los ojos azules."], "Spanish uses tener (to have) for eyes and hair, and with abuela the form is tiene. Ojos is plural, so azul becomes azules."],
        ["איזה משפט אומר נכון ״לסבתא שלי יש עיניים כחולות״?", "Mi abuela tiene los ojos azules.", ["Mi abuela es los ojos azules.", "Mi abuela tiene los ojos azul.", "Mi abuela tienes los ojos azules."], "בספרדית מתארים עיניים ושיער בעזרת tener (״יש ל־״), ועם abuela הצורה היא tiene. ojos ברבים, ולכן azul נעשה azules."]],
      [["What is the opposite of alto when you describe a person?", "bajo", ["gordo", "joven", "rubio"], "The opposite of alto (tall) is bajo (short). Gordo means fat, joven young and rubio blond."],
        ["מה ההפך של alto כשמתארים אדם?", "bajo", ["gordo", "joven", "rubio"], "ההפך של alto (גבוה) הוא bajo (נמוך). gordo פירושו שמן, joven צעיר ו־rubio בלונדיני."]],
      [["What does mis padres usually mean?", "my parents", ["my grandparents", "my brothers", "my uncles"], "Padres is the plural of padre, and it usually means parents, a mother and a father together. Grandparents are abuelos, brothers hermanos and uncles tíos."],
        ["מה פירוש mis padres בדרך כלל?", "ההורים שלי", ["סבא וסבתא שלי", "האחים שלי", "הדודים שלי"], "padres הוא הרבים של padre, ובדרך כלל פירושו הורים, אמא ואבא יחד. סבא וסבתא הם abuelos, אחים הם hermanos ודודים הם tíos."]],
    ],
  },
  a: {
    t: [
      ["su / sus", "his, her, their or your (polite): which one is meant comes from the context", "su / sus", "״שלו״, ״שלה״, ״שלהם״ או ״שלך״ בנימוס: ההקשר מראה למי הכוונה"],
      ["nuestro", "our; it changes to match the noun: nuestra, nuestros, nuestras", "nuestro", "״שלנו״; הצורה משתנה לפי שם העצם: nuestra, nuestros, nuestras"],
      ["trabajador", "hard-working, someone who works a lot", "trabajador", "חרוץ, מי שעובד הרבה ובהתמדה"],
      ["los tíos", "an uncle and an aunt together, or several uncles", "los tíos", "דוד ודודה יחד, או כמה דודים"],
    ],
    q: [
      [["Who is la hija de mi tía?", "mi prima", ["mi sobrina", "mi hermana", "mi tía"], "Your aunt's daughter is your cousin: mi prima. Mi sobrina is a niece, the daughter of your brother or sister."],
        ["מי היא la hija de mi tía?", "mi prima", ["mi sobrina", "mi hermana", "mi tía"], "הבת של הדודה היא בת הדודה: mi prima. mi sobrina היא אחיינית, הבת של האח או של האחות."]],
      [["In Nuestra casa es grande, why is it nuestra and not nuestro?", "Because casa is feminine, and the word must match it", ["Because the people who own the house are all women", "Because the adjective grande is always feminine", "Because nuestra is the form used before any noun"], "Possessives like nuestro agree with the thing owned, not with the owners: casa is feminine, so nuestra casa, even if the family is all boys."],
        ["במשפט Nuestra casa es grande, למה nuestra ולא nuestro?", "כי casa בנקבה, והמילה צריכה להתאים לה", ["כי האנשים שגרים בבית הם כולם נשים", "כי שם התואר grande תמיד בנקבה", "כי nuestra היא הצורה שבאה לפני כל שם עצם"], "מילות שייכות כמו nuestro מתאימות לדבר השייך ולא לבעלים: casa בנקבה, ולכן nuestra casa, גם אם במשפחה יש רק בנים."]],
      [["Which sentence correctly says 'Their dogs are small'?", "Sus perros son pequeños.", ["Su perros son pequeños.", "Sus perros son pequeñas.", "Sus perros son pequeño."], "Perros is plural, so their is sus, and the adjective is masculine plural: pequeños. Su is only for one thing."],
        ["איזה משפט אומר נכון ״הכלבים שלהם קטנים״?", "Sus perros son pequeños.", ["Su perros son pequeños.", "Sus perros son pequeñas.", "Sus perros son pequeño."], "perros ברבים, ולכן ״שלהם״ הוא sus, ושם התואר בזכר וברבים: pequeños. su משמש רק לדבר אחד."]],
      [["Which sentence correctly says 'My cousin (a girl) is blonde and very nice'?", "Mi prima es rubia y muy simpática.", ["Mi prima es rubia y muy simpático.", "Mi prima es rubio y muy simpático.", "Mi primo es rubia y muy simpática."], "A girl cousin is mi prima, and both adjectives must be feminine to match her: rubia and simpática."],
        ["איזה משפט אומר נכון ״בת הדודה שלי בלונדינית ונחמדה מאוד״?", "Mi prima es rubia y muy simpática.", ["Mi prima es rubia y muy simpático.", "Mi prima es rubio y muy simpático.", "Mi primo es rubia y muy simpática."], "בת דודה היא mi prima, ושני שמות התואר צריכים להיות בנקבה כדי להתאים לה: rubia ו־simpática."]],
      [["Which adjective describes personality rather than looks?", "tímido", ["delgado", "rubio", "alto"], "Tímido (shy) tells what someone is like inside. Delgado (thin), rubio (blond) and alto (tall) describe how someone looks."],
        ["איזה שם תואר מתאר אופי ולא מראה?", "tímido", ["delgado", "rubio", "alto"], "tímido (ביישן) מתאר איך אדם מתנהג ומרגיש. delgado (רזה), rubio (בלונדיני) ו־alto (גבוה) מתארים איך אדם נראה."]],
      [["Which sentence correctly says 'He has long hair'?", "Tiene el pelo largo.", ["Es el pelo largo.", "Tiene el pelo larga.", "Está el pelo largo."], "Hair, like eyes, is described with tener: tiene el pelo largo. Pelo is masculine, so the adjective is largo."],
        ["איזה משפט אומר נכון ״יש לו שיער ארוך״?", "Tiene el pelo largo.", ["Es el pelo largo.", "Tiene el pelo larga.", "Está el pelo largo."], "שיער, כמו עיניים, מתארים בעזרת tener: tiene el pelo largo. pelo בזכר, ולכן שם התואר הוא largo."]],
    ],
  },
};
export default c;
