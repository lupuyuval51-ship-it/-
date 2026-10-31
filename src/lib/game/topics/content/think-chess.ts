import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Check", "a position in which a king is under attack and must be saved at once", "שח", "מצב שבו המלך מאוים, וחייבים להציל אותו מיד"],
      ["Checkmate", "an attack on the king that cannot be escaped, which ends the game", "מט", "התקפה על המלך שאין ממנה מוצא, והיא מסיימת את המשחק"],
      ["Pawn", "the piece of lowest value, which moves straight forward and captures one square diagonally forward", "רגלי", "הכלי בעל הערך הנמוך ביותר, שנע ישר קדימה ואוכל משבצת אחת באלכסון קדימה"],
    ],
    q: [
      [["Which piece moves in an L shape?", "the knight", ["the bishop", "the rook", "the king"], "The knight moves two squares in a straight line and then one to the side, making an L. It is also the only piece that can jump over others."],
        ["איזה כלי נע בצורת האות L?", "הפרש", ["הרץ", "הצריח", "המלך"], "הפרש נע שתי משבצות בקו ישר ואז משבצת אחת הצידה, בצורת L. הוא גם הכלי היחיד שיכול לדלג מעל כלים אחרים."]],
      [["How does a bishop move?", "any number of squares diagonally", ["any number of squares in a straight line", "one square in any direction", "two squares and then one to the side"], "A bishop slides diagonally as far as it likes, so it always stays on squares of one colour. Moving straight is the rook's move, and one square in any direction is the king's."],
        ["איך נע הרץ?", "כמה משבצות שרוצים באלכסון", ["כמה משבצות שרוצים בקו ישר", "משבצת אחת לכל כיוון", "שתי משבצות ואז אחת הצידה"], "הרץ גולש באלכסון כמה שהוא רוצה, ולכן הוא נשאר תמיד על משבצות בצבע אחד. תנועה בקו ישר היא של הצריח, ומשבצת אחת לכל כיוון היא תנועת המלך."]],
      [["Which piece can move any number of squares in a straight line or diagonally?", "the queen", ["the rook", "the bishop", "the pawn"], "The queen combines the moves of the rook and the bishop, which makes her the strongest piece. The rook only moves straight and the bishop only diagonally."],
        ["איזה כלי יכול לנוע כמה משבצות שהוא רוצה בקו ישר או באלכסון?", "המלכה", ["הצריח", "הרץ", "הרגלי"], "המלכה משלבת את התנועות של הצריח ושל הרץ, ולכן היא הכלי החזק ביותר. הצריח נע רק בקו ישר והרץ רק באלכסון."]],
      [["What happens when a king is checkmated?", "The game ends and that side loses", ["The game ends in a draw", "The king goes back to its starting square", "The king is taken off and play goes on"], "Checkmate means the king is attacked and has no escape. The game stops at once and the player who was checkmated loses; the king is never actually taken off the board."],
        ["מה קורה כשהמלך מקבל מט?", "המשחק נגמר והצד שלו מפסיד", ["המשחק נגמר בתיקו", "המלך חוזר למשבצת שבה התחיל", "מורידים את המלך מהלוח וממשיכים לשחק"], "מט פירושו שהמלך מאוים ואין לו מוצא. המשחק נעצר מיד והשחקן שקיבל מט מפסיד; את המלך עצמו אף פעם לא מורידים מהלוח."]],
    ],
    n: [
      [64, ["How many squares are there on a chessboard?", "squares", "A chessboard has 8 rows of 8 squares, and 8 × 8 = 64."],
        ["כמה משבצות יש בלוח שחמט?", "משבצות", "בלוח שחמט יש 8 שורות של 8 משבצות, ו־8 × 8 = 64."]],
      [16, ["How many pieces does each player have at the start of a game?", "pieces", "Each side has 8 pawns plus 8 other pieces (2 rooks, 2 knights, 2 bishops, a queen and a king), which makes 16."],
        ["כמה כלים יש לכל שחקן בתחילת המשחק?", "כלים", "לכל צד יש 8 רגלים ועוד 8 כלים אחרים (2 צריחים, 2 פרשים, 2 רצים, מלכה ומלך), כלומר 16."]],
    ],
    s: [[["White's back row, from the corner square a1 to e1", "Rook", "Knight", "Bishop", "Queen", "King"],
      ["השורה האחורית של הלבן, מהמשבצת הפינתית a1 עד e1", "צריח", "פרש", "רץ", "מלכה", "מלך"]]],
  },
  i: {
    t: [
      ["Stalemate", "a position where the player to move has no legal move but is not in check, so the game is drawn", "פט", "מצב שבו לשחקן שתורו אין שום מהלך חוקי אבל הוא לא בשח, והמשחק נגמר בתיקו"],
      ["Castling", "a special move in which the king goes two squares towards a rook and the rook jumps to the king's other side", "הצרחה", "מהלך מיוחד שבו המלך זז שתי משבצות לכיוון צריח, והצריח מדלג לצד השני של המלך"],
      ["Promotion", "turning a pawn that reaches the far end of the board into a queen, rook, bishop or knight", "הכתרה", "החלפה של רגלי שהגיע לקצה הרחוק של הלוח במלכה, בצריח, ברץ או בפרש"],
    ],
    q: [
      [["In the usual point values, how much is a rook worth?", "5", ["3", "9", "1"], "The common scale is pawn 1, knight 3, bishop 3, rook 5 and queen 9. These values are only a guide to help you judge trades."],
        ["בערכים המקובלים, כמה נקודות שווה צריח?", "5", ["3", "9", "1"], "הסולם המקובל הוא רגלי 1, פרש 3, רץ 3, צריח 5 ומלכה 9. הערכים האלה הם רק קו מנחה שעוזר להעריך החלפות."]],
      [["Which piece is worth about the same as a knight?", "a bishop", ["a rook", "a queen", "a pair of pawns"], "A knight and a bishop are both worth about 3 points. A rook is worth about 5, a queen about 9 and two pawns only 2."],
        ["איזה כלי שווה בערך כמו פרש?", "רץ", ["צריח", "מלכה", "זוג רגלים"], "פרש ורץ שווים שניהם בערך 3 נקודות. צריח שווה בערך 5, מלכה בערך 9, ושני רגלים רק 2."]],
      [["When is castling NOT allowed?", "When the king is in check", ["When the queen is still on the board", "When neither the king nor that rook has moved", "When the game is past its tenth move"], "You may not castle out of check, through an attacked square or into check, or if the king or that rook has already moved. The queen and the move number do not matter."],
        ["מתי אסור להצריח?", "כשהמלך נמצא בשח", ["כשהמלכה עדיין על הלוח", "כשהמלך והצריח עוד לא זזו", "כשהמשחק עבר את המסע העשירי"], "אסור להצריח כשהמלך בשח, דרך משבצת מאוימת או אל שח, או אם המלך או הצריח הזה כבר זזו. המלכה ומספר המסע לא משנים."]],
      [["A pawn reaches the last row of the board. What do players nearly always turn it into?", "a queen", ["a knight", "a rook", "a second king"], "The queen is the strongest piece, so it is the usual choice. Sometimes a knight is better, but a pawn can never become a king."],
        ["רגלי מגיע לשורה האחרונה בלוח. במה השחקנים מחליפים אותו כמעט תמיד?", "במלכה", ["בפרש", "בצריח", "במלך נוסף"], "המלכה היא הכלי החזק ביותר, ולכן זו הבחירה הרגילה. לפעמים פרש עדיף, אבל רגלי לעולם לא יכול להפוך למלך."]],
      [["Which is a good idea in the opening of a game?", "Control the centre and bring out the knights and bishops", ["Move the same piece many times so you can attack quickly", "Bring the queen out early to start an attack", "Move the pawns at the edges of the board first"], "Pieces in the centre control more squares, and developing knights and bishops gets your army ready. An early queen can be chased around, wasting moves."],
        ["מה רעיון טוב בפתיחת המשחק?", "לשלוט במרכז ולהוציא את הפרשים והרצים", ["להזיז את אותו כלי פעמים רבות כדי לתקוף מהר", "להוציא את המלכה מוקדם כדי לפתוח במתקפה", "להזיז קודם את הרגלים שבקצות הלוח"], "כלים במרכז שולטים ביותר משבצות, והוצאת הפרשים והרצים מכינה את הצבא שלכם. מלכה שיוצאת מוקדם עלולה להיות נרדפת ולבזבז מסעים."]],
      [["It is Black's turn. Black is not in check but has no legal move. What is the result?", "a draw by stalemate", ["a win for White", "a win for Black", "Black misses a turn"], "When the player to move is not in check but cannot make any legal move, it is stalemate, and the game ends in a draw."],
        ["תורו של השחור. השחור לא בשח, אבל אין לו שום מהלך חוקי. מהי התוצאה?", "תיקו בגלל פט", ["ניצחון ללבן", "ניצחון לשחור", "השחור מדלג על התור"], "כשלשחקן שתורו אין שום מהלך חוקי והוא לא בשח, זה פט, והמשחק נגמר בתיקו."]],
    ],
    n: [[39, ["Using pawn 1, knight 3, bishop 3, rook 5 and queen 9, how many points are one side's starting pieces worth, not counting the king?", "points", "8 pawns × 1 = 8, 2 knights × 3 = 6, 2 bishops × 3 = 6, 2 rooks × 5 = 10 and the queen 9: 8 + 6 + 6 + 10 + 9 = 39."],
      ["לפי רגלי 1, פרש 3, רץ 3, צריח 5 ומלכה 9, כמה נקודות שווים הכלים של צד אחד בתחילת המשחק, בלי המלך?", "נקודות", "8 רגלים × 1 = 8, 2 פרשים × 3 = 6, 2 רצים × 3 = 6, 2 צריחים × 5 = 10 והמלכה 9: 8 + 6 + 6 + 10 + 9 = 39."]]],
  },
  a: {
    t: [
      ["En passant", "a capture of an enemy pawn that has just moved two squares and landed beside your pawn", "הכאה דרך הילוכו", "לקיחה של רגלי יריב שזה עתה זז שתי משבצות ונעצר ליד הרגלי שלכם"],
      ["Fork", "an attack by one piece on two or more enemy pieces at the same time", "מזלג", "התקפה של כלי אחד על שני כלים של היריב או יותר בבת אחת"],
      ["Pin", "an attack on a piece that cannot move away without exposing a more valuable piece behind it", "ריתוק", "התקפה על כלי שאינו יכול לזוז בלי לחשוף כלי יקר יותר שעומד מאחוריו"],
    ],
    q: [
      [["Chess most likely grew out of which ancient game from India?", "chaturanga", ["shogi", "go", "backgammon"], "Chaturanga was played in India by about the 6th century CE and spread to Persia and then Europe. Shogi is a later Japanese relative of chess, and go is a different game from China."],
        ["השחמט התפתח כנראה מאיזה משחק עתיק מהודו?", "צ׳טורנגה", ["שוגי", "גו", "שש־בש"], "צ׳טורנגה שוחק בהודו כבר בסביבות המאה ה־6 לספירה, והתפשט לפרס ומשם לאירופה. שוגי הוא קרוב יפני מאוחר יותר של השחמט, וגו הוא משחק אחר מסין."]],
      [["Why is a knight fork so strong?", "It attacks two pieces at once and only one can be saved", ["It makes the knight impossible to capture for one whole turn", "It forces the other player to castle straight away", "It lets the knight make two moves in a row"], "With one move the knight threatens two targets. The opponent can move only one of them, so the other is usually lost."],
        ["למה מזלג של פרש חזק כל כך?", "הוא תוקף שני כלים יחד, ואפשר להציל רק אחד", ["הוא הופך את הפרש לבלתי ניתן ללקיחה למשך תור", "הוא מכריח את היריב להצריח מיד", "הוא מאפשר לפרש לעשות שני מסעים ברצף"], "במהלך אחד הפרש מאיים על שתי מטרות. היריב יכול להזיז רק אחת מהן, ולכן השנייה בדרך כלל אובדת."]],
      [["Against a lone king, which of these, together with your own king, can NOT force checkmate?", "a single knight", ["a single rook", "a single queen", "two rooks"], "A king and a rook, or a king and a queen, can always force mate against a lone king. A king and one knight cannot, so that ending is a draw."],
        ["מול מלך בודד, עם מה מהבאים, יחד עם המלך שלכם, אי אפשר לכפות מט?", "פרש אחד", ["צריח אחד", "מלכה אחת", "שני צריחים"], "מלך וצריח, או מלך ומלכה, יכולים תמיד לכפות מט על מלך בודד. מלך ופרש אחד לא יכולים, ולכן הסיום הזה הוא תיקו."]],
      [["A bishop attacks a knight, and the knight's own king stands right behind it on the same diagonal. Why can't the knight move?", "Moving it would put its own king in check, which is illegal", ["A knight may move only when its king is far away", "The bishop has already captured the knight", "Pieces standing in front of a king are never allowed to move"], "This is a pin. If the knight stepped away, the bishop would attack the king, and no move may leave your own king in check."],
        ["רץ תוקף פרש, והמלך של הפרש עומד ממש מאחוריו באותו אלכסון. למה הפרש לא יכול לזוז?", "הזזתו תעמיד את המלך שלו בשח, וזה אסור", ["פרש יכול לזוז רק כשהמלך שלו רחוק ממנו", "הרץ כבר לקח את הפרש", "כלים שעומדים לפני המלך לא יכולים לזוז אף פעם"], "זה ריתוק. אם הפרש יזוז, הרץ יאיים על המלך, ואסור לעשות מהלך שמשאיר את המלך שלכם בשח."]],
      [["You are far ahead in pieces. Why must you be careful not to stalemate your opponent?", "Stalemate is a draw, so you would throw away your win", ["Stalemate counts as a loss for the stronger side", "Stalemate forces you to give a piece back", "Stalemate makes the whole game start again"], "If your opponent has no legal move and is not in check, the game is drawn at once, no matter how many extra pieces you have."],
        ["יש לכם הרבה יותר כלים. למה צריך להיזהר לא לגרום ליריב פט?", "פט הוא תיקו, ואז תפספסו את הניצחון", ["פט נחשב להפסד של הצד החזק", "פט מחייב אתכם להחזיר כלי ליריב", "פט גורם למשחק להתחיל מחדש"], "אם ליריב אין שום מהלך חוקי והוא לא בשח, המשחק נגמר מיד בתיקו, לא משנה כמה כלים יש לכם."]],
    ],
    n: [
      [1997, ["In which year did the IBM computer Deep Blue win a full match against the world champion, Garry Kasparov?", "", "Deep Blue lost to Kasparov in 1996 but won their rematch in 1997, the first match a computer won against a reigning world champion."],
        ["באיזו שנה ניצח המחשב ״כחול עמוק״ (Deep Blue) של IBM את אלוף העולם גארי קספרוב בסדרת משחקים שלמה?", "", "״כחול עמוק״ הפסיד לקספרוב ב־1996, אבל ניצח בגומלין ב־1997 – ההתמודדות הראשונה שבה מחשב ניצח אלוף עולם מכהן."]],
      [2, ["In the Fool's Mate, the quickest possible checkmate, how many moves does Black make, including the mating move?", "moves", "1. f3 e5 2. g4 Qh4 is checkmate: White weakens the king with two pawn moves, and Black mates with its 2nd move."],
        ["ב״מט השוטה״, המט המהיר ביותר האפשרי, כמה מסעים עושה השחור, כולל מסע המט?", "מסעים", "1. f3 e5 2. g4 Qh4 הוא מט: הלבן מחליש את המלך בשני מסעי רגלי, והשחור נותן מט במסע ה־2 שלו."]],
    ],
    s: [[["Chess through history, from earliest to latest", "Chaturanga is played in India", "Shatranj spreads through Persia and the Arab world", "The game reaches Europe", "The queen gains her long, powerful moves", "The first official world championship is held"],
      ["השחמט לאורך ההיסטוריה, מהמוקדם למאוחר", "בהודו משחקים צ׳טורנגה", "השטרנג׳ מתפשט בפרס ובעולם הערבי", "המשחק מגיע לאירופה", "המלכה מקבלת את המסעים הארוכים והחזקים שלה", "נערכת אליפות העולם הרשמית הראשונה"]]],
  },
};
export default c;
