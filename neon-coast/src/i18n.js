// Hebrew is the default; English stays fully functional.
const he = {
  title: 'ניאון קוסט', tagline: 'עיר פתוחה. חוקים משלך.', start: 'משחק חדש', continue: 'המשך משחק', controls: 'שליטה', loading: 'טוען את העיר…',
  clickToPlay: 'לחצו כדי להתחיל', resume: 'חזרה למשחק', save: 'שמירה', load: 'טעינה', newGame: 'משחק חדש', settings: 'הגדרות', quit: 'למסך הפתיחה',
  saved: 'המשחק נשמר', saveFailed: 'השמירה נכשלה. בדקו שיש מקום באחסון של הדפדפן.', loaded: 'המשחק נטען', noSave: 'אין שמירה', paused: 'השהיה', language: 'שפה', quality: 'איכות גרפית', volume: 'עוצמת שמע',
  qLow: 'נמוכה', qMed: 'בינונית', qHigh: 'גבוהה', map: 'מפה', close: 'סגירה', wasted: 'נפסלת', busted: 'נעצרת', missionPassed: 'המשימה הושלמה', missionFailed: 'המשימה נכשלה',
  newObjective: 'יעד חדש', reward: 'פרס', kmh: 'קמ״ש', radioOff: 'רדיו כבוי', wantedUp: 'רמת חיפוש עלתה', evaded: 'הצלחת להתחמק מהמשטרה', respawnHospital: 'התעוררת בבית החולים. חלק מהכסף הלך על הטיפול.', respawnPolice: 'שוחררת מהתחנה. הכסף לשוחד הלך.',
  pressEnter: 'E – כניסה לרכב', pressExit: 'E – יציאה מהרכב', pressInteract: 'E – ', pressStart: 'E – התחלת משימה', collected: 'אסימון ניאון נאסף', collectedAll: 'אספת את כל אסימוני הניאון!',
  ammoEmpty: 'אין תחמושת', reload: 'טוען…', buy: 'קנייה', owned: 'ברשותך', notEnough: 'אין מספיק כסף', bought: 'נרכש', spray: 'צביעה, תיקון וניקוי רמת חיפוש', sprayDone: 'הרכב תוקן ורמת החיפוש נמחקה',
  heal: 'טיפול רפואי מלא', healDone: 'החיים התמלאו', armor: 'שכפ״ץ', sleep: 'שינה עד הבוקר', sleepDone: 'ישנת עד הבוקר. המשחק נשמר.',
  shopGuns: 'ניאון ארמס – חנות נשק', shopCars: 'קוסט מוטורס – סוכנות רכב', shopSpray: 'ספריי & גו', shopHospital: 'בית חולים סאנרייז', safehouse: 'הדירה שלך', police: 'תחנת משטרה', beachClub: 'מועדון החוף', docks: 'המזח', bank: 'בנק סולארה', race: 'מרוץ רחוב', taxi: 'עבודת מונית',
  weapon: { fist: 'אגרופים', bat: 'מחבט', pistol: 'אקדח', revolver: 'אקדח תופי', smg: 'תת־מקלע', shotgun: 'רובה ציד', rifle: 'רובה סער', sniper: 'רובה צלפים', grenade: 'רימון' },
  vehicle: { sedan: 'סדאן', sport: 'מכונית ספורט', suv: 'ג׳יפ', truck: 'משאית', taxi: 'מונית', police: 'ניידת', swat: 'רכב ימ״מ', muscle: 'מאסל קאר', limo: 'לימוזינה', super: 'סופר־קאר' },
  outfit: { street: 'רחוב', beach: 'חוף', suit: 'חליפה', track: 'טרנינג', leather: 'עור', hawaii: 'הוואי', gold: 'זהב' }, wear: 'לבישה', wearing: 'לבוש',
  shopGuns2: 'קוסט גאנס – חנות נשק', shopGuns3: 'ביג איירון – חנות נשק', police2: 'תחנת משטרה – צפון', shopHospital2: 'מרכז רפואי פאלם', shopSpray2: 'צביעה – אוטו סטאר',
  shopBurger: 'ניאון בורגר', shopBurger2: 'ניאון בורגר – חוף', shopClothes: 'סאנסט – חנות בגדים', casino: 'קזינו סולארה', fixer: 'המתווך', meal: 'ארוחה (חיים מלאים)', mealDone: 'אכלת. החיים התמלאו.',
  casinoBet: 'הימור', casinoSpin: 'סובב', casinoWin: 'זכית', casinoLose: 'הפסדת', casinoJackpot: 'ג׳קפוט!', casinoRules: 'שלושה זהים ×10, שבע־שבע־שבע ×50, שניים זהים ×2',
  vigilanteStart: 'V – משימת שוטר', vigilanteHint: 'ברכב משטרה: לחצו V כדי להתחיל משימת שוטר', vigilante: 'משימת שוטר', vigilanteObj: 'עצרו את הפושע – הרסו את הרכב או חסלו את הנהג', vigilanteDone: 'הפושע נעצר. שלב', vigilanteFail: 'הפושע ברח', vigilanteEnd: 'משימת השוטר הסתיימה',
  contract: { name: 'חוזה חיסול', lines: ['המתווך: יש שם. יש כתובת. יש שומר ראש. אל תשאיר עדים.'], obj1: 'חסלו את המטרה המסומנת', done: 'המתווך: נקי. הכסף בדרך.', fail: 'המטרה נמלטה.' },
  raceAgain: 'מרוץ נוסף', wantedHint: 'הכוכבים מהבהבים = המשטרה איבדה אותך. תישארו מחוץ לטווח הראייה.',
  ammoPack: 'חבילת תחמושת', spawnHere: 'הרכב יופיע בחוץ',
  ctrl: [
    ['W A S D', 'תנועה / נהיגה'], ['עכבר', 'סיבוב מצלמה'], ['Shift', 'ריצה'], ['רווח', 'קפיצה / בלם יד'], ['E', 'כניסה ויציאה מרכב, אינטראקציה'],
    ['לחצן שמאלי', 'ירי / אגרוף'], ['לחצן ימני', 'כיוון'], ['1–9 / גלגלת', 'החלפת נשק'], ['V', 'משימת שוטר (בניידת)'], ['R', 'טעינה מחדש / תחנת רדיו ברכב'], ['H', 'צופר'], ['M', 'מפה'], ['Esc', 'תפריט'],
  ],
  hint: { first: 'ברוך הבא לניאון קוסט. הסמן הצהוב במפה מוביל למשימה הראשונה.', stealCar: 'לחצו E ליד רכב כדי להיכנס אליו.', cops: 'כוכבים במסך = המשטרה מחפשת אותך. תברחו מטווח הראייה שלהם.' },
  stations: { off: 'רדיו כבוי', neon: 'NEON FM 98.6', bass: 'BASSLINE 102.1', club: 'CLUB SOLAR 107.7' },
  timeLeft: 'זמן', checkpoints: 'נקודות ביקורת', targets: 'מטרות', packages: 'חבילות',
  m: {
    intro: { name: 'ברוכים הבאים לחוף', giver: 'ריקי', lines: ['ריקי: סוף סוף הגעת. העיר הזאת אוכלת אנשים, אז תלמד מהר.', 'ריקי: יש מכונית שמחכה לך מעבר לפינה. תביא אותה למועדון החוף ותכיר את ליאור.'],
      obj1: 'הגיעו למכונית המסומנת והיכנסו אליה', obj2: 'סעו למועדון החוף', done: 'ליאור: יפה. המכונית שלך. תבוא מחר, יש עבודה.' },
    taxi: { name: 'עבודת מונית', giver: 'תחנת מונית', lines: ['סדרן: יש נוסע שמחכה. אסוף אותו והורד אותו בזמן, בלי לדפוק את המונית.'], obj1: 'אספו את הנוסע', obj2: 'הורידו את הנוסע ביעד לפני שהזמן נגמר', done: 'הנוסע השאיר טיפ נדיב.', fail: 'הנוסע איחר. אין תשלום.' },
    race: { name: 'מרוץ רחוב', giver: 'דנה', lines: ['דנה: שמונה נקודות ביקורת, שעון אחד. תעבור את כולן לפני שהזמן נגמר ותקבל את הכסף.'], obj1: 'עברו את כל נקודות הביקורת לפני שהזמן נגמר', done: 'דנה: שיא חדש. הכסף שלך.', fail: 'דנה: איטי מדי. תחזור כשתדע לנהוג.' },
    repo: { name: 'איש הגרירה', giver: 'ליאור', lines: ['ליאור: מישהו לא שילם על מכונית הספורט שלו. היא חונה ליד הבנק, מלאה במעקב.', 'ליאור: ברגע שתיגע בה, המשטרה תדע. תביא אותה למזח ותנער אותם בדרך.'], obj1: 'גנבו את מכונית הספורט המסומנת', obj2: 'הביאו את המכונית למזח', obj3: 'התחמקו מהמשטרה', done: 'ליאור: ניקיתי אותה מהמעקב. עבודה נקייה.' },
    cleanup: { name: 'ניקיון בפארק', giver: 'ריקי', lines: ['ריקי: כנופיית "הצפרדעים" משתלטת על הפארק. ארבעה מהם שם עכשיו.', 'ריקי: תוציא אותם מהתמונה. קח נשק אם אין לך.'], obj1: 'הגיעו לפארק', obj2: 'חסלו את חברי הכנופיה', done: 'ריקי: הפארק חזר לשכונה. תבוא לקחת את הכסף.' },
    packages: { name: 'משלוח מהיר', giver: 'ליאור', lines: ['ליאור: חמש חבילות מפוזרות בעיר, ולקוח אחד לא סבלני. שעון מתחיל עכשיו.'], obj1: 'אספו את כל החבילות לפני שהזמן נגמר', done: 'ליאור: הלקוח מרוצה. זה נדיר.', fail: 'ליאור: איחרת. הלקוח הלך למישהו אחר.' },
    pursuit: { name: 'מרדף לוהט', giver: 'דנה', lines: ['דנה: הימור קטן: תעצבן את המשטרה עד שלוש כוכבים ותשרוד דקה וחצי. אם תיעצר, הפסדת.'], obj1: 'השיגו שלוש כוכבי חיפוש', obj2: 'שרדו עד שהזמן נגמר', obj3: 'התחמקו מהמשטרה', done: 'דנה: משוגע. הנה הכסף.' },
    heist: { name: 'הבנק של סולארה', giver: 'ליאור', lines: ['ליאור: הגדולה. בנק סולארה, כספת פתוחה לתשעים שניות בזמן העברת הכסף.', 'ליאור: תחזיק את הכניסה עד שהצוות מסיים, ואז תגיע למזח – סירה מחכה. עם או בלי המשטרה.'], obj1: 'הגיעו לבנק', obj2: 'החזיקו מעמד ליד הבנק עד שהצוות מסיים', obj3: 'הגיעו למזח והתחמקו מהמשטרה', done: 'ליאור: עשינו את זה. העיר שלך עכשיו.' },
  },
  ui: { health: 'חיים', armorBar: 'שכפ״ץ', money: 'כסף', missions: 'משימות', stats: 'סטטיסטיקה', tokens: 'אסימוני ניאון', kills: 'הרוגים', carsStolen: 'רכבים שנגנבו', distance: 'מרחק נסיעה', playtime: 'זמן משחק', legend: 'מקרא',
    legendItems: [['●', 'משימה', '#ffd34e'], ['●', 'חנות נשק', '#ff4fa3'], ['●', 'סוכנות רכב', '#3ce8f5'], ['●', 'צביעה', '#c084fc'], ['●', 'בית חולים', '#ff5a5a'], ['●', 'דירה', '#7cff8a'], ['●', 'משטרה', '#4d8cff'], ['●', 'מסעדה', '#ff9a3c'], ['●', 'בגדים', '#ff9ad5'], ['●', 'קזינו', '#ffd34e'], ['●', 'חוזים', '#e0e0e0']] },
};

const en = {
  title: 'Neon Coast', tagline: 'Open city. Your rules.', start: 'New game', continue: 'Continue', controls: 'Controls', loading: 'Loading the city…',
  clickToPlay: 'Click to play', resume: 'Resume', save: 'Save', load: 'Load', newGame: 'New game', settings: 'Settings', quit: 'Title screen',
  saved: 'Game saved', saveFailed: 'Save failed. Check that the browser has storage space.', loaded: 'Game loaded', noSave: 'No save found', paused: 'Paused', language: 'Language', quality: 'Graphics quality', volume: 'Volume',
  qLow: 'Low', qMed: 'Medium', qHigh: 'High', map: 'Map', close: 'Close', wasted: 'WASTED', busted: 'BUSTED', missionPassed: 'MISSION PASSED', missionFailed: 'MISSION FAILED',
  newObjective: 'New objective', reward: 'Reward', kmh: 'km/h', radioOff: 'Radio off', wantedUp: 'Wanted level increased', evaded: 'You lost the cops', respawnHospital: 'You woke up in hospital. Some cash went to the bill.', respawnPolice: 'Released from the station. The bribe money is gone.',
  pressEnter: 'E – Enter vehicle', pressExit: 'E – Exit vehicle', pressInteract: 'E – ', pressStart: 'E – Start mission', collected: 'Neon token collected', collectedAll: 'All neon tokens collected!',
  ammoEmpty: 'Out of ammo', reload: 'Reloading…', buy: 'Buy', owned: 'Owned', notEnough: 'Not enough cash', bought: 'Purchased', spray: 'Respray, repair and clear wanted', sprayDone: 'Vehicle repaired, wanted level cleared',
  heal: 'Full medical treatment', healDone: 'Health restored', armor: 'Body armor', sleep: 'Sleep until morning', sleepDone: 'You slept until morning. Game saved.',
  shopGuns: 'Neon Arms – gun shop', shopCars: 'Coast Motors – dealership', shopSpray: 'Spray & Go', shopHospital: 'Sunrise Hospital', safehouse: 'Your apartment', police: 'Police station', beachClub: 'Beach club', docks: 'The pier', bank: 'Solara Bank', race: 'Street race', taxi: 'Taxi job',
  weapon: { fist: 'Fists', bat: 'Baseball bat', pistol: 'Pistol', revolver: 'Revolver', smg: 'SMG', shotgun: 'Shotgun', rifle: 'Assault rifle', sniper: 'Sniper rifle', grenade: 'Grenade' },
  vehicle: { sedan: 'Sedan', sport: 'Sports car', suv: 'SUV', truck: 'Truck', taxi: 'Taxi', police: 'Cruiser', swat: 'SWAT truck', muscle: 'Muscle car', limo: 'Limousine', super: 'Supercar' },
  outfit: { street: 'Street', beach: 'Beach', suit: 'Suit', track: 'Tracksuit', leather: 'Leather', hawaii: 'Hawaii', gold: 'Gold' }, wear: 'Wear', wearing: 'Wearing',
  shopGuns2: 'Coast Guns – gun shop', shopGuns3: 'Big Iron – gun shop', police2: 'Police station – North', shopHospital2: 'Palm Medical Center', shopSpray2: 'Auto Star respray',
  shopBurger: 'Neon Burger', shopBurger2: 'Neon Burger – Beach', shopClothes: 'Sunset Clothing', casino: 'Solara Casino', fixer: 'The Fixer', meal: 'Meal (full health)', mealDone: 'You ate. Health restored.',
  casinoBet: 'Bet', casinoSpin: 'Spin', casinoWin: 'You win', casinoLose: 'You lose', casinoJackpot: 'JACKPOT!', casinoRules: 'Three of a kind ×10, 7-7-7 ×50, pair ×2',
  vigilanteStart: 'V – Vigilante', vigilanteHint: 'In a police car: press V to start vigilante duty', vigilante: 'Vigilante', vigilanteObj: 'Stop the criminal – wreck the car or take out the driver', vigilanteDone: 'Criminal stopped. Level', vigilanteFail: 'The criminal got away', vigilanteEnd: 'Vigilante duty ended',
  contract: { name: 'Contract hit', lines: ['The Fixer: A name. An address. A bodyguard. Leave no witnesses.'], obj1: 'Eliminate the marked target', done: 'The Fixer: Clean. Money is on its way.', fail: 'The target escaped.' },
  raceAgain: 'Race again', wantedHint: 'Blinking stars = the police lost you. Stay out of sight.',
  ammoPack: 'Ammo pack', spawnHere: 'Delivered outside',
  ctrl: [
    ['W A S D', 'Move / drive'], ['Mouse', 'Camera'], ['Shift', 'Sprint'], ['Space', 'Jump / handbrake'], ['E', 'Enter/exit vehicle, interact'],
    ['Left click', 'Fire / punch'], ['Right click', 'Aim'], ['1–9 / wheel', 'Switch weapon'], ['V', 'Vigilante (in a cruiser)'], ['R', 'Reload / radio station in car'], ['H', 'Horn'], ['M', 'Map'], ['Esc', 'Menu'],
  ],
  hint: { first: 'Welcome to Neon Coast. The yellow marker on the map leads to your first job.', stealCar: 'Press E next to a vehicle to get in.', cops: 'Stars = the police are after you. Break line of sight to lose them.' },
  stations: { off: 'Radio off', neon: 'NEON FM 98.6', bass: 'BASSLINE 102.1', club: 'CLUB SOLAR 107.7' },
  timeLeft: 'Time', checkpoints: 'Checkpoints', targets: 'Targets', packages: 'Packages',
  m: {
    intro: { name: 'Welcome to the Coast', giver: 'Ricky', lines: ['Ricky: You finally made it. This city eats people, so learn fast.', 'Ricky: There is a car waiting round the corner. Bring it to the beach club and meet Lior.'],
      obj1: 'Reach the marked car and get in', obj2: 'Drive to the beach club', done: 'Lior: Nice. The car is yours. Come back tomorrow, there is work.' },
    taxi: { name: 'Taxi job', giver: 'Taxi rank', lines: ['Dispatcher: A fare is waiting. Pick them up and drop them off on time without wrecking the cab.'], obj1: 'Pick up the passenger', obj2: 'Drop the passenger at the destination before time runs out', done: 'The passenger left a generous tip.', fail: 'The passenger was late. No pay.' },
    race: { name: 'Street race', giver: 'Dana', lines: ['Dana: Eight checkpoints, one clock. Clear them all before the timer hits zero and the cash is yours.'], obj1: 'Pass every checkpoint before time runs out', done: 'Dana: New record. Take the money.', fail: 'Dana: Too slow. Come back when you can drive.' },
    repo: { name: 'Repo man', giver: 'Lior', lines: ['Lior: Someone stopped paying for his sports car. It is parked by the bank, full of trackers.', 'Lior: The second you touch it the cops will know. Bring it to the pier and shake them on the way.'], obj1: 'Steal the marked sports car', obj2: 'Bring the car to the pier', obj3: 'Lose the police', done: 'Lior: Trackers are gone. Clean work.' },
    cleanup: { name: 'Park cleanup', giver: 'Ricky', lines: ['Ricky: The "Frogs" gang is taking over the park. Four of them are there right now.', 'Ricky: Take them out of the picture. Grab a gun if you do not have one.'], obj1: 'Get to the park', obj2: 'Eliminate the gang members', done: 'Ricky: The park is back with the neighbourhood. Come get your cash.' },
    packages: { name: 'Express delivery', giver: 'Lior', lines: ['Lior: Five packages spread across the city and one impatient client. Clock starts now.'], obj1: 'Collect all packages before time runs out', done: 'Lior: The client is happy. That is rare.', fail: 'Lior: Too late. The client went elsewhere.' },
    pursuit: { name: 'Hot pursuit', giver: 'Dana', lines: ['Dana: Small bet: annoy the cops up to three stars and survive ninety seconds. Get busted and you lose.'], obj1: 'Reach a three-star wanted level', obj2: 'Survive until the timer ends', obj3: 'Lose the police', done: 'Dana: You are insane. Here is the money.' },
    heist: { name: 'The Solara job', giver: 'Lior', lines: ['Lior: The big one. Solara Bank, vault open for ninety seconds during the cash transfer.', 'Lior: Hold the entrance until the crew is done, then get to the pier. A boat is waiting, cops or no cops.'], obj1: 'Get to the bank', obj2: 'Hold out by the bank until the crew is done', obj3: 'Reach the pier and lose the police', done: 'Lior: We did it. The city is yours now.' },
  },
  ui: { health: 'Health', armorBar: 'Armor', money: 'Cash', missions: 'Missions', stats: 'Stats', tokens: 'Neon tokens', kills: 'Kills', carsStolen: 'Cars stolen', distance: 'Distance driven', playtime: 'Play time', legend: 'Legend',
    legendItems: [['●', 'Mission', '#ffd34e'], ['●', 'Gun shop', '#ff4fa3'], ['●', 'Dealership', '#3ce8f5'], ['●', 'Spray shop', '#c084fc'], ['●', 'Hospital', '#ff5a5a'], ['●', 'Apartment', '#7cff8a'], ['●', 'Police', '#4d8cff'], ['●', 'Food', '#ff9a3c'], ['●', 'Clothes', '#ff9ad5'], ['●', 'Casino', '#ffd34e'], ['●', 'Contracts', '#e0e0e0']] },
};

export const LANGS = { he, en };
// T and L are mutated in place rather than reassigned, so every module keeps a live view
// of the current language (and the single-file bundle keeps working).
export const T = {};
export const L = { code: 'he' };
export function setLang(code) {
  const c = LANGS[code] ? code : 'he';
  L.code = c;
  for (const k of Object.keys(T)) delete T[k];
  Object.assign(T, LANGS[c]);
  document.documentElement.lang = c;
  document.documentElement.dir = c === 'he' ? 'rtl' : 'ltr';
  try { localStorage.setItem('neoncoast.lang', c); } catch {}
}
export function initLang() {
  let code = 'he';
  try { code = localStorage.getItem('neoncoast.lang') || 'he'; } catch {}
  setLang(code);
}
