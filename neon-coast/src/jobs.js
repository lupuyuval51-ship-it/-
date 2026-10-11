// Neon Coast – repeatable jobs that earn money. Seven jobs (taxi, paramedic, firefighter, tow truck, food courier, bus driver, car export), each with a depot marker on a parking
// lot, its own vehicle, calls that come one after another, per-call pay + tips + bonuses, XP and levels 1-5 (more pay, tougher calls, a tuned vehicle at 3 and 5),
// a shift summary at the end and lifetime stats. Game hooks (all optional, guarded): missions.update() calls jobs.update(), missions.save()/load()/resetProgress() carry the job
// progress, missions.start() cancels the running shift, missions.blips and objMarkers show depots and call targets on the minimap and as HUD pins.
// Keys: E (on foot) / J (in a vehicle) at a depot starts or ends the shift, N skips the current call, G toggles the siren of an ambulance / fire truck, mouse left sprays water.
import * as THREE from '../vendor/three.module.min.js';
import { Vehicle } from './vehicle.js';
import { Ped } from './peds.js';
import { acquireLane } from './traffic.js';
import { CITY, JOBS, VEHICLES, CAR_COLORS } from './config.js';
import { dist, clamp, damp, angleLerp, wrapAngle, fmtMoney } from './utils.js';
import { T, L } from './i18n.js';

// ---------- strings ----------
// Read through tr(): the game's T (jb_<key>, added by the integrator from this table) wins, then this table in the current language.
export const JOB_STRINGS = {
  he: {
    name_taxi: 'נהג מונית', name_paramedic: 'חובש אמבולנס', name_fire: 'כבאי', name_tow: 'נהג גרר', name_courier: 'שליח אוכל', name_bus: 'נהג אוטובוס', name_export: 'יצוא רכבים',
    desc_taxi: 'אספו נוסעים בכל העיר והסיעו אותם בנחת. נהיגה חלקה מביאה טיפים.', desc_paramedic: 'פנו פצועים לבית החולים לפני שיהיה מאוחר. הסירנה פותחת את הכביש.', desc_fire: 'כבו שריפות ברכבים ובבניינים לפני שהן מתפשטות.',
    desc_tow: 'גררו רכבים שחונים בניגוד לחוק אל מגרש ההחרמה.', desc_courier: 'אספו אוכל מניאון בורגר ומסרו אותו חם ובזמן.', desc_bus: 'סעו במסלול קבוע, עצרו בתחנות והגיעו בזמן.', desc_export: 'גנבו את הרכבים מהרשימה של היצואן והבריחו אותם לנמל. סיכון גבוה, שכר גבוה.',
    un2: 'שכר גבוה ב־12% וקריאות רחוקות יותר', un3: 'רכב מכוונן (דרגה 2): מהיר וחזק יותר', un4: 'שכר גבוה ב־40% וקריאות קשות יותר', un5: 'רכב עילית (דרגה 3) ושכר גבוה ב־60%',
    start: 'התחלת משמרת: {0}', end: 'סיום משמרת', shiftStart: 'המשמרת התחילה: {0}', shiftOver: 'המשמרת הסתיימה', shiftFail: 'המשמרת נקטעה',
    summary: '{0} קריאות · בסיס {1} · טיפים {2} · בונוס {3} · סך הכול {4}', summaryNone: 'לא הושלמו קריאות', fines: 'קנס נזק לרכב {0}',
    r_quit: 'סיימתם משמרת', r_mission: 'משימה התחילה', r_dead: 'נפצעתם קשה', r_busted: 'נעצרתם', r_wrecked: 'הרכב נהרס', r_abandoned: 'עזבתם את הרכב', r_lost: 'הרכב אבד', r_switch: 'עברתם לעבודה אחרת',
    leaveWarn: 'חזרו לרכב! המשמרת תסתיים בעוד {0} שנ׳', busy: 'סיימו את המשימה הנוכחית קודם', copsBlock: 'איבדו את המשטרה לפני שמתחילים משמרת', noVehicle: 'אין מקום לרכב העבודה בתחנה',
    keys: 'J – סיום משמרת בתחנה · N – דלגו על הקריאה', keysSiren: 'G – סירנה', skipped: 'הקריאה בוטלה', level: 'דרגה {0}', levelUp: '{0}: דרגה {1}! {2}', tierUp: 'שדרוג רכב: הרכב החדש מחכה בתחנה (דרגה {0})', streak: 'רצף {0}',
    tip: 'טיפ', bonus: 'בונוס', base: 'בסיס', waiting: 'ממתינים לקריאה…', depotHint: 'נקודת עבודה',
    pCalls: 'קריאות', pEarned: 'הרווחתם', pMood: 'מצב רוח הנוסע', pPatient: 'מצב המטופל', pOrder: 'מצב ההזמנה', pTank: 'מים', pComfort: 'נוחות הנסיעה', pCar: 'מצב הרכב', pFare: 'מונה', pStop: 'תחנה {0}/{1}', pPax: 'נוסעים', pFires: 'מוקדי אש', pHeat: 'חיפוש',
    addr: 'בלוק {0}-{1}',
    hint_taxi: 'טיפ: עצרו ליד הנוסע, סעו בעדינות בלי בלימות חדות וקבלו טיפ. N מדלג על קריאה.', hint_paramedic: 'טיפ: הפעילו סירנה (G), הגיעו לפצוע ופנו אותו לבית החולים. פצוע קריטי דורש מהירות.', hint_fire: 'טיפ: גשו לאש, עצרו וירו (עכבר שמאלי) כדי להתיז מים. הרכב הבוער מתפוצץ אם מתעכבים.', hint_tow: 'טיפ: סעו לאחור עד הרכב המסומן, חכו שהוא יתחבר וגררו אותו למגרש ההחרמה.', hint_courier: 'טיפ: אספו את ההזמנה בניאון בורגר ומסרו אותה מהר ובעדינות כדי לקבל טיפ.', hint_bus: 'טיפ: עצרו בתחנה המסומנת עם הדלת מול הרציף, חכו לנוסעים ושמרו על לוח הזמנים.', hint_export: 'טיפ: גנבו את הרכב מהרשימה והביאו אותו לנמל. המשטרה תרדוף אחריכם.',
    tx_new: 'קריאת מונית', tx_newVip: 'קריאה: נוסע VIP', tx_hail: 'נוסע מחכה', tx_pick: 'אספו את הנוסע', tx_board: 'הנוסע עולה…', tx_to: 'נוסע: קחו אותי אל {0}', tx_ride: 'הסיעו את הנוסע אל {0}', tx_time: 'זמן',
    tx_arrived: 'הגענו. תודה!', tx_angry: 'הנוסע כועס ויצא מהמונית!', tx_late: 'הנוסע התעייף מלחכות ויצא', tx_gone: 'הנוסע התייאש ועזב', tx_lost: 'הנוסע נעלם', tx_fare: 'נסיעה', tx_fast: 'הגעה מהירה', tx_hard: 'נוסע: תנהגו בעדינות!', tx_crash: 'נוסע: מה עשיתם?!', tx_hurry: 'נוסע: אני ממהר!',
    pm_new: 'קריאת חירום: פצוע', pm_sev0: 'מצב יציב', pm_sev1: 'מצב קשה', pm_sev2: 'מצב קריטי', pm_go: 'הגיעו אל הפצוע', pm_load: 'מעמיסים את המטופל…', pm_hosp: 'פנו את המטופל אל {0}', pm_handover: 'המטופל נמסר לצוות', pm_died: 'המטופל לא שרד', pm_lost: 'פצוע אחר טופל – הקריאה בוטלה', pm_fare: 'פינוי', pm_speed: 'בונוס מהירות',
    fi_new: 'שריפה! {0} מוקדי אש', fi_obj: 'כבו את האש (מוקדים: {0})', fi_car: 'רכב בוער', fi_bld: 'בניין בוער', fi_spread: 'האש מתפשטת!', fi_explode: 'הרכב עומד להתפוצץ – התרחקו!', fi_boom: 'הרכב התפוצץ', fi_tank: 'מיכל המים ריק – עצרו למילוי', fi_refill: 'ממלאים מים…', fi_aim: 'לחצן ירי (עכבר שמאלי) – התזת מים', fi_done: 'כל האש כובתה', fi_fare: 'כיבוי', fi_speed: 'בונוס מהירות', fi_clean: 'בלי התפשטות', fi_fuse: 'התפוצצות בעוד',
    tw_new: 'רכב חונה בניגוד לחוק', tw_go: 'סעו לאחור עד הרכב המסומן', tw_back: 'סעו לאחור כדי לחבר את הרכב', tw_hooking: 'מחברים את הרכב…', tw_hooked: 'הרכב מחובר', tw_tow: 'גררו את הרכב אל מגרש ההחרמה', tw_release: 'משחררים את הרכב…', tw_done: 'הרכב הוחרם', tw_lost: 'הרכב נהרס', tw_fare: 'גרירה', tw_speed: 'בונוס מהירות', tw_gentle: 'גרירה עדינה', tw_impound: 'מגרש החרמה', tw_flag: 'רכב חונה בניגוד לחוק',
    cr_new: 'הזמנה חדשה', cr_pick: 'אספו את ההזמנה ב{0}', cr_loading: 'מעמיסים את ההזמנה…', cr_drop: 'מסרו: {0} ({1}/{2})', cr_delivered: 'ההזמנה נמסרה', cr_expired: 'הלקוח ביטל – ההזמנה איחרה', cr_fare: 'משלוח', cr_time: 'זמן למשלוח', cr_cold: 'ההזמנה נפגעה בנסיעה', cr_hot: 'חם וטרי!',
    bs_obj: 'תחנה {0}: {1}', bs_stop: 'עצרו בתחנה', bs_board: 'נוסעים עולים ויורדים…', bs_fare: 'תחנה', bs_late: 'איחור', bs_early: 'מוקדם מדי', bs_ontime: 'בזמן!', bs_lap: 'סיבוב הושלם: {0} תחנות, {1} נוסעים', bs_hard: 'נוסעים מתלוננים על הנהיגה', bs_missed: 'פספסתם את התחנה', bs_punct: 'בונוס דיוק', bs_comfort: 'בונוס נוחות', bs_lapBonus: 'בונוס סיבוב', bs_next: 'התחנה הבאה', bs_ready: 'סעו לתחנה הראשונה',
    ex_new: 'הרשימה של היצואן', ex_find: 'גנבו: {0}', ex_haul: 'הביאו את הרכב אל המכולות בנמל', ex_alarm: 'אזעקה! המשטרה בדרך', ex_done: 'הרכב נטען על הספינה', ex_lost: 'הרכב נהרס', ex_fare: 'יצוא', ex_clean: 'יציאה נקייה', ex_cond: 'מצב הרכב', ex_far: 'הרכב נעלם מהאזור', ex_hot: 'הרכב חם: המשטרה על הזנב', ex_yard: 'המכולות',
    col_silver: 'כסוף', col_black: 'שחור', col_red: 'אדום', col_blue: 'כחול', col_yellow: 'צהוב', col_green: 'ירוק', col_brown: 'חום', col_pink: 'ורוד', col_turq: 'טורקיז', col_purple: 'סגול', col_white: 'לבן', col_orange: 'כתום', col_grey: 'אפור', col_lblue: 'תכלת', col_lime: 'ליים',
  },
  en: {
    name_taxi: 'Taxi driver', name_paramedic: 'Paramedic', name_fire: 'Firefighter', name_tow: 'Tow truck', name_courier: 'Food courier', name_bus: 'Bus driver', name_export: 'Car export',
    desc_taxi: 'Pick up fares across the city and drive them smoothly. Gentle driving earns tips.', desc_paramedic: 'Rush the injured to hospital before it is too late. The siren clears the road.', desc_fire: 'Put out fires in cars and buildings before they spread.',
    desc_tow: 'Tow illegally parked cars to the impound lot.', desc_courier: 'Pick up food at Neon Burger and deliver it hot and on time.', desc_bus: 'Drive a fixed loop, stop at every stop and stay on schedule.', desc_export: "Steal the cars on the exporter's list and smuggle them to the docks. High risk, high pay.",
    un2: 'Pay +12% and calls further away', un3: 'Tuned vehicle (tier 2): faster and tougher', un4: 'Pay +40% and harder calls', un5: 'Elite vehicle (tier 3) and pay +60%',
    start: 'Start shift: {0}', end: 'End shift', shiftStart: 'Shift started: {0}', shiftOver: 'SHIFT OVER', shiftFail: 'SHIFT CUT SHORT',
    summary: '{0} calls · base {1} · tips {2} · bonus {3} · total {4}', summaryNone: 'No calls completed', fines: 'Vehicle damage fine {0}',
    r_quit: 'You ended the shift', r_mission: 'A mission started', r_dead: 'You were badly hurt', r_busted: 'You were arrested', r_wrecked: 'The vehicle was wrecked', r_abandoned: 'You left the vehicle', r_lost: 'The vehicle was lost', r_switch: 'You switched jobs',
    leaveWarn: 'Get back in your vehicle! Shift ends in {0} s', busy: 'Finish the current mission first', copsBlock: 'Lose the cops before starting a shift', noVehicle: 'No room for the work vehicle at the depot',
    keys: 'J – end shift at the depot · N – skip the call', keysSiren: 'G – siren', skipped: 'Call cancelled', level: 'Level {0}', levelUp: '{0}: level {1}! {2}', tierUp: 'Vehicle upgrade: the new vehicle waits at the depot (tier {0})', streak: 'Streak {0}',
    tip: 'Tip', bonus: 'Bonus', base: 'Base', waiting: 'Waiting for a call…', depotHint: 'Job depot',
    pCalls: 'Calls', pEarned: 'Earned', pMood: 'Passenger mood', pPatient: 'Patient', pOrder: 'Order', pTank: 'Water', pComfort: 'Ride comfort', pCar: 'Vehicle', pFare: 'Meter', pStop: 'Stop {0}/{1}', pPax: 'Passengers', pFires: 'Fires', pHeat: 'Heat',
    addr: 'Block {0}-{1}',
    hint_taxi: 'Tip: stop next to the passenger, drive smoothly with no hard braking and earn a tip. N skips a call.', hint_paramedic: 'Tip: use the siren (G), reach the patient and rush them to hospital. Critical patients need speed.', hint_fire: 'Tip: drive to the fire, stop and hold fire (left mouse) to spray water. Burning cars explode if you wait.', hint_tow: 'Tip: reverse up to the marked car, wait for the hook and tow it to the impound lot.', hint_courier: 'Tip: pick up the order at Neon Burger and deliver it fast and gently for a tip.', hint_bus: 'Tip: stop at the marked bus stop with the door at the platform, wait for the passengers and keep to the schedule.', hint_export: 'Tip: steal the car on the list and bring it to the docks. The cops will chase you.',
    tx_new: 'Taxi call', tx_newVip: 'Call: VIP passenger', tx_hail: 'Fare waiting', tx_pick: 'Pick up the passenger', tx_board: 'Passenger boarding…', tx_to: 'Passenger: take me to {0}', tx_ride: 'Drive the passenger to {0}', tx_time: 'Time',
    tx_arrived: 'We are here. Thanks!', tx_angry: 'The passenger is furious and got out!', tx_late: 'The passenger got tired of the ride and left', tx_gone: 'The passenger gave up waiting', tx_lost: 'The passenger vanished', tx_fare: 'Fare', tx_fast: 'Fast ride', tx_hard: 'Passenger: easy on the brakes!', tx_crash: 'Passenger: what was that?!', tx_hurry: 'Passenger: I am in a hurry!',
    pm_new: 'Emergency call: injured person', pm_sev0: 'Stable', pm_sev1: 'Serious', pm_sev2: 'Critical', pm_go: 'Reach the patient', pm_load: 'Loading the patient…', pm_hosp: 'Take the patient to {0}', pm_handover: 'Patient handed over', pm_died: 'The patient did not make it', pm_lost: 'Someone else treated the patient – call cancelled', pm_fare: 'Transfer', pm_speed: 'Speed bonus',
    fi_new: 'Fire! {0} blazes', fi_obj: 'Put out the fire (blazes: {0})', fi_car: 'Burning car', fi_bld: 'Burning building', fi_spread: 'The fire is spreading!', fi_explode: 'The car is about to explode – back off!', fi_boom: 'The car exploded', fi_tank: 'Water tank empty – stop to refill', fi_refill: 'Refilling water…', fi_aim: 'Fire button (left mouse) sprays water', fi_done: 'All fires are out', fi_fare: 'Fire call', fi_speed: 'Speed bonus', fi_clean: 'No spread', fi_fuse: 'Explodes in',
    tw_new: 'Illegally parked car', tw_go: 'Reverse up to the marked car', tw_back: 'Reverse the hoist up to the car', tw_hooking: 'Hooking up the car…', tw_hooked: 'Car hooked', tw_tow: 'Tow the car to the impound lot', tw_release: 'Releasing the car…', tw_done: 'Car impounded', tw_lost: 'The car was wrecked', tw_fare: 'Tow', tw_speed: 'Speed bonus', tw_gentle: 'Gentle towing', tw_impound: 'Impound lot', tw_flag: 'Illegally parked car',
    cr_new: 'New order', cr_pick: 'Pick up the order at {0}', cr_loading: 'Loading the order…', cr_drop: 'Deliver: {0} ({1}/{2})', cr_delivered: 'Order delivered', cr_expired: 'The customer cancelled – the order was late', cr_fare: 'Delivery', cr_time: 'Delivery time', cr_cold: 'The order got shaken up', cr_hot: 'Hot and fresh!',
    bs_obj: 'Stop {0}: {1}', bs_stop: 'Stop at the bus stop', bs_board: 'Passengers boarding and leaving…', bs_fare: 'Stop', bs_late: 'Late', bs_early: 'Too early', bs_ontime: 'On time!', bs_lap: 'Lap done: {0} stops, {1} passengers', bs_hard: 'Passengers complain about the driving', bs_missed: 'You missed the stop', bs_punct: 'Punctuality bonus', bs_comfort: 'Comfort bonus', bs_lapBonus: 'Lap bonus', bs_next: 'Next stop', bs_ready: 'Drive to the first stop',
    ex_new: "The exporter's list", ex_find: 'Steal: {0}', ex_haul: 'Deliver the car to the containers at the docks', ex_alarm: 'Alarm! The cops are coming', ex_done: 'Car loaded onto the ship', ex_lost: 'The car was wrecked', ex_fare: 'Export', ex_clean: 'Clean getaway', ex_cond: 'Condition', ex_far: 'The car disappeared from the area', ex_hot: 'Hot car: the cops are on your tail', ex_yard: 'Containers',
    col_silver: 'silver', col_black: 'black', col_red: 'red', col_blue: 'blue', col_yellow: 'yellow', col_green: 'green', col_brown: 'brown', col_pink: 'pink', col_turq: 'turquoise', col_purple: 'purple', col_white: 'white', col_orange: 'orange', col_grey: 'grey', col_lblue: 'light blue', col_lime: 'lime',
  },
};
const tr = (k, ...a) => { let s = T['jb_' + k] ?? JOB_STRINGS[L.code === 'en' ? 'en' : 'he'][k] ?? JOB_STRINGS.en[k] ?? k; for (let i = 0; i < a.length; i++) s = s.split('{' + i + '}').join(a[i]); return s; };
const CAR_COLOR_KEY = { 0xd8d8dc: 'silver', 0x1c1e26: 'black', 0x9b2335: 'red', 0x1f4e9b: 'blue', 0xe8b830: 'yellow', 0x2e8b57: 'green', 0x7a4a2a: 'brown', 0xc0c0c8: 'silver', 0xff6f91: 'pink', 0x3cc4d1: 'turq', 0x5b3a8c: 'purple', 0xf0f0f0: 'white', 0xf58a2a: 'orange', 0x2f2f2f: 'grey', 0x6ec1e4: 'lblue', 0xb8e986: 'lime' };

// ---------- constants ----------
const HALF = CITY.road / 2, DEF = Object.fromEntries(JOBS.defs.map(d => [d.id, d])), IDS = JOBS.defs.map(d => d.id);
const rr = (a, b) => a + Math.random() * (b - a);
const lvlMult = lvl => JOBS.pay[clamp(lvl, 1, 5) - 1];
// Comfort thresholds per vehicle: a brake event (deceleration above `brake` m/s2 that sheds more than 3.5 m/s) or a slide (lateral slip above `slip`) costs the passengers' mood.
const LIM = { taxi: { brake: 11, slip: 4.5 }, ambulance: { brake: 13, slip: 5.5 }, bus: { brake: 5.5, slip: 3.2 }, van: { brake: 12, slip: 5 }, towtruck: { brake: 14, slip: 6 } };
const EMERGENCY = new Set(['ambulance', 'firetruck']);
// water jet and fire tuning
const JET = { speed: 22, g: 10, dps: 46, range: 46, tank: 160, drain: 3.4, refill: 9, assist: 0.88, cone: 0.95 };
const GLOW_N = 5;
// tow: the hoist hangs 4.3 m behind the truck's centre; the car's end follows it like a trailer
const HOOK_BACK = 4.25, HOOK_REACH = 2.7;
const _hit = [];
let glowTex = null;
function glowTexture() { if (glowTex) return glowTex; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,200,120,1)'); g.addColorStop(0.35, 'rgba(255,120,40,0.55)'); g.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace; return glowTex; }
const blankStats = () => ({ shifts: 0, calls: 0, fails: 0, earned: 0, tips: 0, bonus: 0, best: 0, streak: 0, dist: 0, time: 0 });
const levelOf = xp => { let l = 1; while (l < 5 && xp >= JOBS.xp[l]) l++; return l; };

// ---------- HUD panel (DOM built here: styles.css is not touched) ----------
const PANEL_CSS = `.jobpanel{position:absolute;left:calc(20px + var(--sal,0px));top:214px;width:236px;padding:9px 12px 10px;border-radius:8px;background:var(--panel,rgba(9,12,26,.78));border-inline-start:3px solid var(--jc,#ffd34e);color:var(--text,#f3f0fa);font:600 13px/1.35 var(--body,Heebo,sans-serif);box-shadow:0 4px 18px rgba(0,0,0,.45);backdrop-filter:blur(6px);display:none;pointer-events:none}
.jobpanel.on{display:block}.jobpanel .jp-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.jobpanel .jp-name{font-size:15px}.jobpanel .jp-lv{color:var(--jc,#ffd34e);font-size:12px;letter-spacing:.5px}
.jobpanel .jp-xp{height:3px;margin:5px 0 6px;background:rgba(255,255,255,.14);border-radius:2px;overflow:hidden}.jobpanel .jp-xp i{display:block;height:100%;width:0;background:var(--jc,#ffd34e);transition:width .3s}
.jobpanel .jp-sum{display:flex;justify-content:space-between;color:var(--muted,#9aa3c4);font-size:12px}.jobpanel .jp-sum b{color:var(--green,#7cff8a);font-variant-numeric:tabular-nums}
.jobpanel .jp-bar{display:none;margin-top:5px}.jobpanel .jp-bar.on{display:block}.jobpanel .jp-bar span{display:block;font-size:11px;color:var(--muted,#9aa3c4)}.jobpanel .jp-bar div{height:6px;border-radius:3px;background:rgba(0,0,0,.5);overflow:hidden}.jobpanel .jp-bar i{display:block;height:100%;width:100%;transition:width .2s,background .2s}
.jobpanel .jp-l{margin-top:5px;font-size:12px}.jobpanel .jp-l:empty{display:none}.jobpanel .jp-l1{font-size:15px;font-variant-numeric:tabular-nums}
@media (max-height:560px){.jobpanel{top:150px;width:196px;padding:6px 9px;font-size:12px}}`;

// run-state helpers: the HUD record every job writes into each tick (nothing is allocated per frame), the passengers' comfort tracker
const newHud = () => ({ obj: '', tm: -1, tl: '', nb: 0, b: [{ l: '', v: 0, c: '' }, { l: '', v: 0, c: '' }, { l: '', v: 0, c: '' }], l1: '', l2: '' });
const newCf = () => ({ pf: 0, php: 0, brk: 0, cool: 0, hard: 0, crash: 0, slide: 0, kind: 0, init: false });
const setBar = (h, i, l, v, c) => { const b = h.b[i]; b.l = l; b.v = clamp(v, 0, 1); b.c = c; if (h.nb <= i) h.nb = i + 1; };
const GREEN = '#7cff8a', AMBER = '#ffb21a', RED = '#ff5a5a', CYAN = '#3ce8f5';
const barColor = v => v > 0.6 ? GREEN : v > 0.3 ? AMBER : RED;

export class Jobs {
  constructor(game) {
    this.game = game; this.active = null; this.depots = []; this.prompt = null; this.built = false; this.prog = {}; this.stats = {}; this.pending = null; this.impound = null; this.route = null;
    this._blips = []; this.panel = null; this.pc = {}; this._ut = -1; this.lang = ''; this.scanT = 0; this.glows = [];
    this.resetData();
  }
  resetData() { for (const id of IDS) { this.prog[id] = { xp: 0, level: 1 }; this.stats[id] = blankStats(); } }
  // read-only list for the UI: id, name key (T.jb_name_<id> / JOB_STRINGS), vehicle type, level, XP (and what the next level needs), the next unlock string key, the pay range of a call at the current level, lifetime stats
  get definitions() {
    return JOBS.defs.map(d => { const p = this.prog[d.id], lvl = p.level, m = lvlMult(lvl), dep = this.depots.find(x => x.id === d.id); return Object.freeze({ id: d.id, nameKey: 'jb_name_' + d.id, descKey: 'jb_desc_' + d.id, vehicle: d.vehicle, color: d.color, level: lvl, xp: p.xp, xpThis: JOBS.xp[lvl - 1], xpNext: lvl < 5 ? JOBS.xp[lvl] : null, nextUnlock: lvl < 5 ? 'jb_un' + (lvl + 1) : null, tier: JOBS.tier[lvl - 1], pay: [Math.round(d.pay[0] * m), Math.round(d.pay[1] * m)], stats: this.stats[d.id], depot: dep ? { x: dep.x, z: dep.z } : null, active: this.active?.id === d.id }); });
  }
  get blips() { return this._blips; }
  name(id) { return tr('name_' + id); }

  // ---------- persistence ----------
  save() { return { v: 1, prog: this.prog, stats: this.stats }; }
  load(s) {
    this.cancel('reset', true); this.resetData(); if (!s) return;
    for (const id of IDS) { const p = s.prog?.[id]; if (p) { this.prog[id].xp = Math.max(0, +p.xp || 0); this.prog[id].level = levelOf(this.prog[id].xp); } if (s.stats?.[id]) Object.assign(this.stats[id], s.stats[id]); }
  }
  reset() { this.cancel('reset', true); this.resetData(); this.pending = null; }

  // ---------- setup (after the world is built) ----------
  init() {
    const W = this.game.world; if (this.built || !W) return; this.built = true;
    for (const f of [this.placeDepots, this.buildImpound, this.buildRoute, this.buildGlows, this.buildPanel]) { try { f.call(this); } catch (e) { console.error('jobs init', e); } }
    this.rebuildBlips();
  }
  // A parking lot that touches the block edge (so a vehicle can leave over the pavement) and is big enough for a bus: its centre, the way out and the heading towards it.
  lotInfo(l) {
    const w = l.x1 - l.x0, d = l.z1 - l.z0; if (w < 16 || d < 16) return null;
    const cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2, bi = Math.floor((cx - (CITY.roadX(0) + HALF)) / CITY.pitch), bj = Math.floor((cz - (CITY.roadZ(0) + HALF)) / CITY.pitch);
    const bx0 = CITY.roadX(bi) + HALF, bz0 = CITY.roadZ(bj) + HALF, e = { w: l.x0 - bx0, e: bx0 + CITY.block - l.x1, n: l.z0 - bz0, s: bz0 + CITY.block - l.z1 }, tol = CITY.sidewalk + 0.8;
    let exit = null; for (const k of ['s', 'e', 'w', 'n']) if (e[k] <= tol) { exit = k; break; }
    return exit ? { cx, cz, exit, h: { e: 0, w: Math.PI, s: -Math.PI / 2, n: Math.PI / 2 }[exit], w, d } : null;
  }
  placeDepots() {
    const W = this.game.world, infos = (W.lots || []).map(l => this.lotInfo(l)).filter(Boolean), used = [];
    for (const def of JOBS.defs) {
      const a = W.pois[def.anchor] || W.pois.safehouse; let best = null, bd = 1e9;
      for (const li of infos) { if (used.some(u => dist(u.cx, u.cz, li.cx, li.cz) < 90)) continue; const d = dist(li.cx, li.cz, a.x, a.z) + (li.exit === 'n' ? 40 : 0); if (d < bd) { bd = d; best = li; } }
      let dep;
      if (best && bd < 320) { used.push(best); const e = best.exit, c = { cx: best.cx, cz: best.cz }; dep = e === 'e' || e === 'w' ? { x: c.cx, z: c.cz + 0.6, bx: c.cx, bz: c.cz + 5.2 } : e === 's' ? { x: c.cx - 3.5, z: c.cz + 4, bx: c.cx + 4.5, bz: c.cz + 1 } : { x: c.cx - 3.5, z: c.cz - 4, bx: c.cx + 4.5, bz: c.cz - 1 }; dep.bh = best.h; dep.exit = e; }
      else { const z0 = a.blockZ0 ?? a.z - 1.5; dep = { x: a.x + 12, z: z0 + 1.6, bx: a.x + 16, bz: z0 - 1.75, bh: 0, exit: 'n', y: a.y || 0 }; if (!def.vehicle) { dep.x = a.x; dep.z = a.z; } }
      Object.assign(dep, { id: def.id, def, hex: parseInt(def.color.slice(1), 16) }); this.depots.push(dep);
    }
    for (const d of this.depots) this.buildDepotVisuals(d);
  }
  // marker + beam (the missions marker), a lit sign on a pole
  buildDepotVisuals(d) {
    const G = this.game; d.marker = G.missions.makeMarker(d.x, d.z, d.hex, true, d.y || 0); d.marker.mesh.children[0].scale.set(1.5, 1, 1.5); d.marker.mesh.visible = false;
    const label = JOB_STRINGS.en['name_' + d.id].toUpperCase(), c = document.createElement('canvas'); c.width = 384; c.height = 96; const x = c.getContext('2d');
    x.fillStyle = d.def.color; x.fillRect(0, 0, 384, 96); x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, 62, 384, 34); x.fillStyle = '#0b0f1e'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '900 46px "Arial Black", Heebo, Arial, sans-serif'; x.fillText(label, 192, 34); x.fillStyle = '#fff'; x.font = '700 24px Heebo, Arial, sans-serif'; x.fillText('JOB DEPOT', 192, 80);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8), new THREE.MeshStandardMaterial({ color: 0x20232a, roughness: 0.6, metalness: 0.5 })); pole.position.y = 2.1; g.add(pole);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); plate.position.y = 4.0; g.add(plate);
    // the pole stands towards the street, the plate faces it
    const dir = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[d.exit] || [0, -1]; g.position.set(d.x + dir[0] * 6.5 - dir[1] * 3.5, (d.y || 0) + 0.17, d.z + dir[1] * 6.5 + dir[0] * 3.5);
    plate.rotation.y = dir[0] ? Math.PI / 2 : 0; this.game.scene.add(g); d.sign = g; d.signTex = tex;
  }
  // the impound lot of the tow job: a lot 150-400 m from the tow depot
  buildImpound() {
    const W = this.game.world, tow = this.depots.find(d => d.id === 'tow'), infos = (W.lots || []).map(l => this.lotInfo(l)).filter(Boolean); let best = null, bs = 1e9;
    for (const li of infos) { if (this.depots.some(d => dist(d.x, d.z, li.cx, li.cz) < 60)) continue; const d = dist(li.cx, li.cz, tow.x, tow.z); if (d < 150 || d > 420) continue; const s = Math.abs(d - 260) + (li.exit === 'n' ? 80 : 0); if (s < bs) { bs = s; best = li; } }
    this.impound = best ? { x: best.cx, z: best.cz + 1, r: 12, cars: [] } : { x: tow.x + 200, z: (W.pois.spray2?.blockZ0 ?? tow.z) - 1.75, r: 12, cars: [] };
    this.impound.sign = this.buildSign(this.impound.x - 5.5, this.impound.z - 4, 'IMPOUND LOT', '#f0ac14');
  }
  buildSign(x, z, label, color) {
    const c = document.createElement('canvas'); c.width = 384; c.height = 96; const k = c.getContext('2d'); k.fillStyle = color; k.fillRect(0, 0, 384, 96); k.fillStyle = '#0b0f1e'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = '900 48px "Arial Black", Heebo, Arial, sans-serif'; k.fillText(label, 192, 50);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x20232a, roughness: 0.6, metalness: 0.5 })); pole.position.y = 1.6; g.add(pole);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); plate.position.y = 3.2; g.add(plate); g.position.set(x, 0.17, z); this.game.scene.add(g); return g;
  }
  // The bus loop: the rectangle (2,2)-(6,5) of road nodes driven clockwise on the outer (kerb) lane; a stop at the middle of every second segment.
  buildRoute() {
    const W = this.game.world, i0 = 2, j0 = 2, i1 = 6, j1 = 5, path = [];
    for (let i = i0; i < i1; i++) path.push([i, j0, i + 1, j0]);
    for (let j = j0; j < j1; j++) path.push([i1, j, i1, j + 1]);
    for (let i = i1; i > i0; i--) path.push([i, j1, i - 1, j1]);
    for (let j = j1; j > j0; j--) path.push([i0, j, i0, j - 1]);
    const segs = path.map(([ai, aj, bi, bj]) => {
      const A = W.nodeAt(ai, aj), B = W.nodeAt(bi, bj), seg = W.segments.find(s => (s.a === A && s.b === B) || (s.a === B && s.b === A)), dir = seg.a === A ? 1 : -1, Ln = W.lane(seg, dir, 1);
      return { x: Ln.sx + Ln.fx * Ln.len / 2, z: Ln.sz + Ln.fz * Ln.len / 2, fx: Ln.fx, fz: Ln.fz, rx: Ln.rx, rz: Ln.rz };
    });
    this.route = { stops: segs.filter((_, k) => k % 2 === 1) };
    // stops start at the one nearest to the bus depot, so the first leg is short
    const dep = this.depots.find(d => d.id === 'bus'); let bi = 0, bd = 1e9; this.route.stops.forEach((s, k) => { const d = dist(s.x, s.z, dep.x, dep.z); if (d < bd) { bd = d; bi = k; } });
    this.route.stops = this.route.stops.slice(bi).concat(this.route.stops.slice(0, bi));
  }
  buildGlows() {
    const S = this.game.scene; for (let i = 0; i < GLOW_N; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff8a3a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); s.visible = false; s.scale.set(8, 8, 1); S.add(s); this.glows.push(s); }
  }
  buildPanel() {
    if (typeof document === 'undefined') return; const hud = document.getElementById('hud'); if (!hud) return;
    if (!document.getElementById('jobStyle')) { const st = document.createElement('style'); st.id = 'jobStyle'; st.textContent = PANEL_CSS; document.head.appendChild(st); }
    const el = document.createElement('div'); el.className = 'jobpanel'; el.innerHTML = '<div class="jp-top"><b class="jp-name"></b><span class="jp-lv"></span></div><div class="jp-xp"><i></i></div><div class="jp-sum"><span class="jp-calls"></span><b class="jp-money"></b></div>' + '<div class="jp-bar"><span></span><div><i></i></div></div>'.repeat(3) + '<div class="jp-l jp-l1"></div><div class="jp-l jp-l2"></div>';
    hud.appendChild(el); const q = s => el.querySelector(s), bars = [...el.querySelectorAll('.jp-bar')];
    this.panel = { el, name: q('.jp-name'), lv: q('.jp-lv'), xp: q('.jp-xp i'), calls: q('.jp-calls'), money: q('.jp-money'), l1: q('.jp-l1'), l2: q('.jp-l2'), bars: bars.map(b => ({ el: b, l: b.querySelector('span'), i: b.querySelector('i') })) };
  }
  rebuildBlips() { this._blips = this.depots.map(d => ({ x: d.x, z: d.z, color: d.def.color, kind: 'poi', icon: d.def.icon, label: tr('name_' + d.id) })); }

  // ---------- helpers for the job scripts ----------
  toast(text, kind = '', dur = 4) { this.game.hud.notify(text, kind, dur); }
  chime() { this.game.audio.chime(); }
  // a random pavement point at least minD and at most maxD metres from (fx, fz) (the closest one found when none fits)
  pickSpot(minD, maxD, fx, fz) {
    const W = this.game.world; let best = null, bs = 1e9;
    for (let i = 0; i < 70; i++) { const p = W.randomSidewalkPoint(), d = dist(p.x, p.z, fx, fz), s = d < minD ? minD - d : d > maxD ? d - maxD : 0; if (s < bs) { bs = s; best = p; if (s === 0) break; } }
    return best ? { x: best.x, z: best.z } : null;
  }
  // "Neon Burger" / "Block 4-5": the shop or building nearest to a point
  nameAt(x, z) {
    const P = this.game.world.pois; let best = null, bd = 60; for (const id in P) { const p = P[id]; if (!p.label || p.y > 0.5 || !T[p.label]) continue; const d = dist(p.x, p.z, x, z); if (d < bd) { bd = d; best = p; } }
    return best ? T[best.label] : tr('addr', clamp(Math.round((x - CITY.roadX(0)) / CITY.pitch) + 1, 1, CITY.gridX), clamp(Math.round((z - CITY.roadZ(0)) / CITY.pitch) + 1, 1, CITY.gridZ));
  }
  // half the time a shop or landmark, otherwise a random pavement point, minD..maxD metres from (fx, fz)
  pickDest(fx, fz, minD, maxD) {
    const P = this.game.world.pois, ok = []; if (Math.random() < 0.5) for (const id in P) { const p = P[id]; if (!p.label || p.y > 0.5 || !T[p.label] || p.type === 'giver' || id === 'club') continue; const d = dist(p.x, p.z, fx, fz); if (d >= minD && d <= maxD) ok.push(p); }
    if (ok.length) { const p = ok[Math.floor(Math.random() * ok.length)]; return { x: p.x, z: p.z, name: T[p.label] }; }
    const s = this.pickSpot(minD, maxD, fx, fz); return { x: s.x, z: s.z, name: this.nameAt(s.x, s.z) };
  }
  newPed(r, x, z, o = {}) { const G = this.game, p = new Ped(G, { kind: 'civ', x, z, noDespawn: true, ...o }); p.mission = 'job'; G.addPed(p); r.peds.push(p); return p; }
  alive(p) { return !!p && !p.dead && this.game.peds.includes(p); }
  killPed(p) { if (p && this.game.peds.includes(p)) this.game.removePed(p); }
  // a person who stays in the world as an ordinary civilian again
  release(r, p) { const i = r.peds.indexOf(p); if (i >= 0) r.peds.splice(i, 1); if (p) { p.noDespawn = false; p.mission = null; if (this.game.peds.includes(p) && !p.dead) { p.state = 'walk'; p.stateT = 0; } } }
  stand(p) { if (!p || p.dead) return; p.state = 'idle'; p.stateT = 1e9; p.speed = 0; }
  act(p, name, o) { try { p?.char?.setActivity(name, o); } catch {} }
  walk(p, tx, tz, spd, dt) { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz); if (d < 0.05) return 0; const st = Math.min(d, spd * dt); p.yaw = angleLerp(p.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10)); p.x += dx / d * st; p.z += dz / d * st; p.speed = spd; return d - st; }
  // objective marker (also a HUD pin and a minimap blip); follow = an entity with x / z the marker tracks
  mark(r, x, z, color, follow = null, y = 0) { const M = this.game.missions, m = M.makeMarker(x, z, color, true, y); m.job = true; m.follow = follow; r.marks.push(m); M.objMarkers.push(m); return m; }
  unmark(r, m) { if (!m) return; const M = this.game.missions; this.game.scene.remove(m.mesh); for (const ch of m.mesh.children) ch.material?.dispose(); let i = r.marks.indexOf(m); if (i >= 0) r.marks.splice(i, 1); i = M.objMarkers.indexOf(m); if (i >= 0) M.objMarkers.splice(i, 1); }
  clearMarks(r) { for (const m of [...r.marks]) this.unmark(r, m); }
  // Passenger comfort for this frame: a crash (hit points lost) costs 5-28, a brake event (deceleration above the limit that sheds more than 3.5 m/s) up to 9, a slide 2.2. Returns the penalty, cf.kind = 1 brake / 2 crash / 3 slide.
  rough(c, v, dt) {
    const lim = LIM[v.type] || LIM.taxi, f = v.forwardSpeed, hp = v.hp; if (!c.init) { c.init = true; c.pf = f; c.php = hp; }
    const dHp = c.php - hp, a = (f - c.pf) / Math.max(dt, 1e-3); let pen = 0; c.php = hp; if (c.cool > 0) c.cool -= dt;
    if (dHp > 0.8) { pen = Math.min(28, 5 + dHp * 1.1); c.crash++; c.cool = 0.5; c.brk = 0; c.kind = 2; }
    else if (c.cool <= 0) {
      if (a < -lim.brake && c.pf > 4) c.brk += -a * dt;
      else if (c.brk > 0) { pen = Math.min(9, Math.max(0, c.brk - 3.5) * 0.7); c.brk = 0; if (pen > 0) { c.hard++; c.cool = 0.6; c.kind = 1; } }
      if (!pen && v.slip > lim.slip && v.speed > 5) { pen = 2.2; c.slide++; c.cool = 0.8; c.kind = 3; }
    }
    c.pf = f; return pen;
  }
  // pays a finished call: money now, XP, stats, streak, one toast with the breakdown
  // o.keep: the call goes on (a multi-drop order, a bus stop); o.noCall: not counted as a call (a lap bonus)
  award(r, base, tip, bonus, xp, label, o = {}) {
    const G = this.game, sh = r.shift, st = this.stats[r.id], tot = base + tip + bonus; G.addMoney(tot); G.audio.register();
    sh.base += base; sh.tips += tip; sh.bonus += bonus; sh.xp += xp; st.earned += tot; st.tips += tip; st.bonus += bonus; st.best = Math.max(st.best, tot);
    if (!o.noCall) { sh.calls++; st.calls++; r.streak++; st.streak = Math.max(st.streak, r.streak); }
    let line = `${label}: ${fmtMoney(tot)}`; if (tip > 0) line += ` · ${tr('tip')} ${fmtMoney(tip)}`; if (bonus > 0) line += ` · ${tr('bonus')} ${fmtMoney(bonus)}`; if (r.streak >= 3 && !o.noCall) line += ` · ${tr('streak', r.streak)}`;
    this.toast(line, 'cash', 5); this.gainXp(r, xp); if (!o.keep) { r.call = null; this.clearMarks(r); this.nextCall(r); }
    if (!o.noCall && sh.calls % 5 === 0) this.toast(tr('summary', sh.calls, fmtMoney(sh.base), fmtMoney(sh.tips), fmtMoney(sh.bonus), fmtMoney(sh.base + sh.tips + sh.bonus - sh.fines)), 'obj', 7); // a run of calls: the shift so far
  }
  gainXp(r, xp) {
    const p = this.prog[r.id], old = p.level; p.xp += xp; p.level = levelOf(p.xp); if (p.level <= old) return;
    r.lvl = p.level; this.toast(tr('levelUp', this.name(r.id), p.level, tr('un' + p.level)), 'obj', 8); this.game.audio.passed(); if (JOBS.tier[p.level - 1] > JOBS.tier[old - 1]) this.toast(tr('tierUp', JOBS.tier[p.level - 1]), 'obj', 8);
  }
  nextCall(r) { r.nextT = rr(JOBS.call[0], JOBS.call[1]); }
  // a call that went wrong (late, wrecked, patient lost ...): the streak ends, nothing is paid
  failCall(r, text, hard = true) {
    if (hard) { r.streak = 0; this.stats[r.id].fails++; r.shift.fails = (r.shift.fails || 0) + 1; } this.toast(text, 'warn', 5); this.game.audio.failed(); this.dropCall(r); this.nextCall(r);
  }
  dropCall(r) {
    if (r.call) { try { IM[r.id].drop?.(this, r, r.call); } catch (e) { console.error(e); } r.call = null; }
    this.clearMarks(r); for (const p of [...r.peds]) { this.killPed(p); } r.peds.length = 0; r.h.tm = -1;
  }

  // ---------- starting and ending a shift ----------
  bayFree(x, z, h, spec) {
    const G = this.game, c = Math.cos(h), s = -Math.sin(h), half = spec.len * 0.5 - 0.5;
    for (const k of [-1, -0.5, 0, 0.5, 1]) { const px = x + c * half * k, pz = z + s * half * k; if (G.grid.circleHit(px, pz, spec.wid * 0.5, _hit)) return false; for (const o of G.vehicles) if (!o.wrecked && o.contains(px, pz, 0.9)) return false; }
    return true;
  }
  spawnJobCar(def, dep, lvl) {
    const G = this.game, spec = VEHICLES[def.vehicle];
    for (const o of [...G.vehicles]) if (o.jobOwned && o.jobCar === def.id && G.player.vehicle !== o) G.removeVehicle(o); // the company car of an earlier shift goes back
    const lx = Math.sin(dep.bh), lz = Math.cos(dep.bh);
    for (const s of [0, 6.5, -6.5, 13, -13]) {
      const x = dep.bx + lx * s, z = dep.bz + lz * s; if (!this.bayFree(x, z, dep.bh, spec)) continue;
      const v = new Vehicle(def.vehicle, null, x, z, dep.bh, { tier: JOBS.tier[lvl - 1] }); v.parked = true; v.jobCar = def.id; v.jobOwned = true; G.addVehicle(v); return v;
    }
    return null;
  }
  seat(v) { const P = this.game.player; if (P.vehicle === v) return; if (P.vehicle) { const old = P.vehicle; P.exitVehicle(); old.parked = true; } P.x = v.x; P.z = v.z; P.enterVehicle(v); }
  start(id) {
    const G = this.game, P = G.player, def = DEF[id]; if (!def || !this.built) return false;
    if (P.dead || G.state === 'dead') return false;
    if (G.missions.active) { this.toast(tr('busy'), 'warn'); return false; }
    if (id !== 'export' && G.police.level > 0) { this.toast(tr('copsBlock'), 'warn'); return false; }
    const dep = this.depots.find(d => d.id === id), lvl = this.prog[id].level; let v = null;
    if (def.vehicle) {
      const cur = P.vehicle; if (cur && cur.type === def.vehicle && !cur.wrecked && !cur.special && !cur.locked) v = cur;
      else { v = this.spawnJobCar(def, dep, lvl); if (!v) { this.toast(tr('noVehicle'), 'warn'); return false; } }
    }
    if (this.active) this.endShift(this.active, 'switch');
    if (v) { this.seat(v); v.special = 'job'; v.jobCar = id; v.parked = false; }
    const r = { id, def, dep, lvl, veh: v, t0: G.time, shift: { calls: 0, base: 0, tips: 0, bonus: 0, xp: 0, fines: 0, fails: 0 }, streak: 0, call: null, nextT: 3, away: 0, st: {}, marks: [], peds: [], h: newHud(), cf: newCf(), sirenOff: false, vmark: null, prompt: null };
    this.active = r; this.stats[id].shifts++; this.prompt = null;
    G.hud.missionTitle(this.name(id)); this.toast(tr('shiftStart', this.name(id)), 'obj', 5); this.toast(tr('keys') + (EMERGENCY.has(def.vehicle) ? ' · ' + tr('keysSiren') : ''), 'dim', 8); G.audio.pickup(); if (this.stats[id].shifts <= 2) this.toast(tr('hint_' + id), 'dim', 10);
    try { IM[id].start?.(this, r); } catch (e) { console.error(e); }
    return true;
  }
  cancel(reason = 'quit', silent = false) { if (this.active) this.endShift(this.active, reason, silent); }
  endShift(r, reason, silent = false) {
    if (this.active !== r) return; const G = this.game, P = G.player, v = r.veh, sh = r.shift, st = this.stats[r.id];
    try { IM[r.id].end?.(this, r, reason); } catch (e) { console.error(e); }
    this.dropCall(r); this.clearMarks(r); if (r.vmark) this.unmark(r, r.vmark); r.vmark = null;
    if (v) { v.special = null; v.siren = false; v.hazard = false; if (v.towed) this.unhook(v); if (!v.wrecked && P.vehicle !== v) v.parked = true; if (v.wrecked || reason === 'wrecked') { sh.fines = Math.min(G.money, JOBS.fine * r.lvl); if (sh.fines) G.addMoney(-sh.fines); } }
    G.hud.setObjective(null); G.hud.clearTimer(); st.time += G.time - r.t0; this.active = null; this.prompt = null;
    if (!silent) { const sum = this.summary(r, reason); if (reason === 'dead' || reason === 'busted') this.pending = sum; else this.showSummary(sum); }
  }
  summary(r, reason) {
    const sh = r.shift, tot = sh.base + sh.tips + sh.bonus - sh.fines, bad = ['dead', 'busted', 'wrecked', 'abandoned', 'lost'].includes(reason);
    let sub = sh.calls ? tr('summary', sh.calls, fmtMoney(sh.base), fmtMoney(sh.tips), fmtMoney(sh.bonus), fmtMoney(tot)) : tr('summaryNone'); if (sh.fines) sub += ' · ' + tr('fines', fmtMoney(sh.fines));
    return { id: r.id, bad, reason: tr('r_' + reason), sub, tot, calls: sh.calls };
  }
  showSummary(s) {
    const G = this.game; G.hud.missionResult(!s.bad, s.bad ? tr('shiftFail') : tr('shiftOver'), `${this.name(s.id)} · ${s.bad ? s.reason + ' · ' : ''}${s.sub}`); if (s.calls) this.toast(s.sub, s.tot > 0 ? 'cash' : 'warn', 9); if (s.bad) G.audio.failed(); else if (s.calls) G.audio.passed();
  }

  // E enters a vehicle within reach: while one is, a job depot answers to J only (on foot) so E never steals the car
  eFree(P) { return !P.vehicle && !P.nearestVehicle?.(); }
  // ---------- per frame ----------
  update(dt) {
    const G = this.game; if (!this.built || !G.player || !(dt > 0)) return; if (this._ut === G.time) return; this._ut = G.time;
    if (L.code !== this.lang) { this.lang = L.code; this.rebuildBlips(); this.pc = {}; }
    const r = this.active;
    this.scanT -= dt; const P = G.player, scan = this.scanT <= 0; if (scan) this.scanT = 0.4;
    for (const d of this.depots) { d.dist = dist(P.x, P.z, d.x, d.z); const m = d.marker.mesh; if (scan) m.visible = d.dist < JOBS.depotShow; if (m.visible) m.children[0].rotation.y += dt * 0.7; }
    if (this.pending && G.state === 'playing' && !G.player.dead) { this.showSummary(this.pending); this.pending = null; }
    if (r) this.tickActive(r, dt); else this.tickIdle(dt);
    this.updateGlows(dt); this.updatePanel(this.active);
  }
  tickIdle(dt) {
    const G = this.game, P = G.player, I = G.input; this.prompt = null; let near = null;
    for (const d of this.depots) if (d.dist < JOBS.depotRange + (P.vehicle ? 2 : 0)) near = d;
    if (!near || P.dead || G.state !== 'playing' || G.missions.active) { this.stopT = 0; return; }
    const foot = !P.vehicle, touch = !!I.isTouch; const eOk = foot && this.eFree(P); this.prompt = (eOk ? 'E – ' : touch && !foot ? '' : 'J – ') + tr('start', this.name(near.id));
    if ((eOk && (I.once('KeyE') || I.btnOnce('enter'))) || I.once('KeyJ')) this.start(near.id);
    else if (touch && !foot) { this.stopT = (this.stopT || 0) + (P.vehicle.speed < 0.6 ? dt : -this.stopT); if (this.stopT > 1.2) { this.stopT = 0; this.start(near.id); } } // no J key on a touch screen: standing still in the marker starts the shift
  }
  tickActive(r, dt) {
    const G = this.game, P = G.player, I = G.input, v = r.veh, h = r.h;
    if (P.dead || G.state === 'dead') return this.endShift(r, G.deadKind === 'busted' ? 'busted' : 'dead');
    if (G.missions.active) return this.endShift(r, 'mission');
    if (v && (v.wrecked || !G.vehicles.includes(v))) return this.endShift(r, v.wrecked ? 'wrecked' : 'lost');
    // the player must be in the job vehicle (jobs without one say when it is needed)
    const must = IM[r.id].must ? IM[r.id].must(this, r) : v;
    if (must) {
      if (P.vehicle !== must) {
        r.away += dt; if (r.away > JOBS.abandon) return this.endShift(r, 'abandoned');
        if (r.away > 2 && !r.vmark) r.vmark = this.mark(r, must.x, must.z, 0x4d8cff, must);
      } else { r.away = 0; if (r.vmark) { this.unmark(r, r.vmark); r.vmark = null; } }
    }
    if (EMERGENCY.has(r.veh?.type) && I.once('KeyG')) { r.sirenOff = !r.sirenOff; this.game.audio.click(); }
    if (I.once('KeyN') && r.call && !IM[r.id].noSkip) { this.toast(tr('skipped'), 'dim'); this.dropCall(r); r.streak = 0; this.nextCall(r); }
    h.obj = ''; h.tm = -1; h.nb = 0; h.l1 = ''; h.l2 = '';
    IM[r.id].tick(this, r, dt);
    if (!this.active) return;
    if (r.away > 2) h.obj = tr('leaveWarn', Math.max(0, Math.ceil(JOBS.abandon - r.away)));
    // depot: end the shift (not while hauling a stolen car through the yard)
    const dd = dist(P.x, P.z, r.dep.x, r.dep.z); this.prompt = null; if (r.dep.marker) r.dep.marker.mesh.visible = true;
    if (dd < JOBS.depotRange + (P.vehicle ? 2.5 : 0) && !(IM[r.id].noEnd?.(r))) { const eOk = this.eFree(P); this.prompt = (eOk ? 'E' : 'J') + ' – ' + tr('end'); if ((eOk && (I.once('KeyE') || I.btnOnce('enter'))) || I.once('KeyJ')) return this.endShift(r, 'quit'); }
    // keep the weapon fire of a job vehicle (drive-by) quiet
    if (v && P.vehicle === v && IM[r.id].noGun) P.fireT = Math.max(P.fireT, 0.12);
    // siren: lights flash and the sound plays while the call runs (toggle with G)
    if (v && EMERGENCY.has(v.type)) { v.siren = !!r.call && !r.sirenOff; if (v.siren && P.vehicle === v && G.police.level === 0) G.audio.siren(0.75); }
    this.syncHud(r);
  }
  syncHud(r) {
    const G = this.game, hud = G.hud, h = r.h; hud.setObjective(h.obj || null);
    if (h.tm >= 0) { hud.setTimer(h.tm, h.tl); r.tOn = true; } else if (r.tOn) { hud.clearTimer(); r.tOn = false; }
  }
  updatePanel(r) {
    const p = this.panel, c = this.pc; if (!p) return; if (!r) { if (c.on) { c.on = false; p.el.classList.remove('on'); } return; }
    if (!c.on) { c.on = true; p.el.classList.add('on'); }
    const pr = this.prog[r.id], h = r.h, lvl = pr.level, nm = this.name(r.id);
    if (c.name !== nm) { c.name = nm; p.name.textContent = nm; p.el.style.setProperty('--jc', r.def.color); }
    const lv = tr('level', lvl) + (r.streak >= 2 ? ' · ' + tr('streak', r.streak) : ''); if (c.lv !== lv) { c.lv = lv; p.lv.textContent = lv; }
    const xp = lvl >= 5 ? 100 : Math.round((pr.xp - JOBS.xp[lvl - 1]) / (JOBS.xp[lvl] - JOBS.xp[lvl - 1]) * 100); if (c.xp !== xp) { c.xp = xp; p.xp.style.width = xp + '%'; }
    const calls = `${tr('pCalls')} ${r.shift.calls}`, money = '+' + fmtMoney(r.shift.base + r.shift.tips + r.shift.bonus); if (c.calls !== calls) { c.calls = calls; p.calls.textContent = calls; } if (c.money !== money) { c.money = money; p.money.textContent = money; }
    for (let i = 0; i < 3; i++) {
      const b = p.bars[i], d = h.b[i], on = i < h.nb; if (c['bo' + i] !== on) { c['bo' + i] = on; b.el.classList.toggle('on', on); } if (!on) continue;
      if (c['bl' + i] !== d.l) { c['bl' + i] = d.l; b.l.textContent = d.l; } const w = Math.round(d.v * 50) * 2; if (c['bw' + i] !== w) { c['bw' + i] = w; b.i.style.width = w + '%'; } if (c['bc' + i] !== d.c) { c['bc' + i] = d.c; b.i.style.background = d.c; }
    }
    if (c.l1 !== h.l1) { c.l1 = h.l1; p.l1.textContent = h.l1; } if (c.l2 !== h.l2) { c.l2 = h.l2; p.l2.textContent = h.l2; }
  }
  // fire glow sprites: a flickering additive blob over each live fire (assigned by the fire job through this.glowFor)
  updateGlows(dt) {
    const G = this.game, t = G.time, night = G.night || 0;
    for (let i = 0; i < this.glows.length; i++) { const s = this.glows[i]; if (!s.userData.f) { if (s.visible) { s.visible = false; s.material.opacity = 0; } continue; } const f = s.userData.f; s.visible = true; s.position.set(f.x, f.y + 1.2, f.z); const k = 0.75 + 0.25 * Math.sin(t * 17 + i * 3.1) * Math.sin(t * 9.3 + i); const sc = (5 + 6 * f.s) * k; s.scale.set(sc, sc, 1); s.material.opacity = (0.25 + 0.55 * night) * f.s * k; }
  }
  glowFor(f) { for (const s of this.glows) if (!s.userData.f) { s.userData.f = f; return s; } return null; }
  unglow(f) { for (const s of this.glows) if (s.userData.f === f) s.userData.f = null; }
  unhook(v) { const car = v.towed; v.towed = null; if (car) { car.towedBy = null; car.vx = car.vz = 0; car.parked = true; } if (v.model.boom) v.model.boom.rotation.z = 0; }
}

// ---------- the seven jobs ----------
// Each entry is driven by Jobs: start(J, r) once, tick(J, r, dt) every frame while the shift runs (it writes r.h for the HUD), drop(J, r, call) when a running call is
// cancelled, end(J, r, reason) when the shift ends; must(J, r) = the vehicle the player has to sit in right now (the abandon rule); noEnd(r) hides the depot's "end shift" prompt.
// A call is r.call; J.award() finishes it with its pay, J.failCall() with nothing.
const IM = {};
const _dir = new THREE.Vector3();
const wrap = wrapAngle;
const inCar = (J, v) => J.game.player.vehicle === v;
const waitMsg = (J, r, h, dt, dispatch) => { h.obj = tr('waiting'); r.nextT -= dt; if (r.nextT <= 0 && !dispatch.call(IM[r.id], J, r)) r.nextT = 2; };

// ===== 1. taxi =====
IM.taxi = {
  noGun: true,
  start(J, r) { r.cf = newCf(); },
  dispatch(J, r) {
    const v = r.veh, lvl = r.lvl, G = J.game, pt = J.pickSpot(110, 220 + 45 * lvl, v.x, v.z); if (!pt) return false;
    const vip = lvl >= 3 && Math.random() < 0.22, ped = J.newPed(r, pt.x, pt.z, { state: 'idle' }); J.stand(ped); J.act(ped, 'wave');
    const c = r.call = { ph: 'hail', ped, vip, mood: 100, odo: 0, t: 0, M: lvlMult(lvl) * (vip ? 1.5 : 1), until: G.time + 50 + dist(v.x, v.z, pt.x, pt.z) / 7, mk: null };
    c.mk = J.mark(r, pt.x, pt.z, 0xffd34e, ped); J.toast(tr(vip ? 'tx_newVip' : 'tx_new'), 'obj'); J.chime(); return true;
  },
  tick(J, r, dt) {
    const G = J.game, v = r.veh, h = r.h, c = r.call, now = G.time;
    if (!c) return waitMsg(J, r, h, dt, this.dispatch);
    if (c.ph === 'hail') {
      if (!J.alive(c.ped)) return J.failCall(r, tr('tx_lost'), false);
      const left = c.until - now; h.obj = tr('tx_pick'); h.tm = left; h.tl = tr('tx_hail'); if (left <= 0) return J.failCall(r, tr('tx_gone'));
      if (inCar(J, v) && dist(v.x, v.z, c.ped.x, c.ped.z) < 9 && v.speed < 3.5) { c.ph = 'board'; c.t = 0; }
    } else if (c.ph === 'board') {
      c.t += dt; const p = c.ped; if (!J.alive(p)) return J.failCall(r, tr('tx_lost'), false); h.obj = tr('tx_board');
      if (dist(v.x, v.z, p.x, p.z) > 18) { c.ph = 'hail'; J.stand(p); return; }
      const s = v.seatPosition(1), left = J.walk(p, s.x, s.z, 1.9, dt); if (left < 1.2 || c.t > 4) { J.killPed(p); c.ped = null; this.begin(J, r); }
    } else if (c.ph === 'ride') {
      c.t += dt; c.odo += Math.max(0, v.forwardSpeed) * dt; const pen = J.rough(r.cf, v, dt), k = c.vip ? 1.5 : 1;
      if (pen > 0) { c.mood = Math.max(0, c.mood - pen * k); J.toast(tr(r.cf.kind === 2 ? 'tx_crash' : 'tx_hard'), 'dim', 2.5); G.audio.shout('angry', 0); } else c.mood = Math.min(100, c.mood + 0.45 * dt);
      if (c.t > c.par * 1.3) c.mood -= 0.8 * dt;
      const meter = Math.min(c.fareCap, (35 + 0.42 * c.odo) * c.M), left = c.deadline - c.t, m = c.mood / 100;
      h.obj = tr('tx_ride', c.dest.name); h.tm = left; h.tl = tr('tx_time'); setBar(h, 0, tr('pMood'), m, barColor(m)); setBar(h, 1, tr('pCar'), v.hp / v.maxHp, barColor(v.hp / v.maxHp)); h.l1 = fmtMoney(meter); h.l2 = tr('pFare') + (c.vip ? ' · VIP' : '');
      if (c.mood <= 0) return this.leave(J, r, meter * 0.45, 'tx_angry'); if (left <= 0) return this.leave(J, r, meter * 0.4, 'tx_late');
      // arrival: the minimum fare is 90% of the straight line
      if (inCar(J, v) && dist(v.x, v.z, c.dest.x, c.dest.z) < 9 && v.speed < 3.2) { c.ph = 'drop'; c.rideT = c.t; c.t = 0; c.meter = Math.min(c.fareCap, Math.max(meter, (35 + 0.42 * c.D * 0.9) * c.M)); const s = v.seatPosition(1); c.out = J.newPed(r, s.x, s.z, {}); J.unmark(r, c.mk); }
    } else if (c.ph === 'drop') {
      c.t += dt; h.obj = tr('tx_arrived'); if (c.t < 1.1) return;
      const fare = Math.round(c.meter), sm = c.rideT / c.par, fast = sm <= 0.85, slow = sm >= 1.35, m = c.mood; let base = fare, bonus = 0;
      if (fast) bonus += Math.round(fare * 0.2); else if (slow) base = Math.round(fare * 0.85);
      bonus += Math.round(fare * Math.min(0.25, 0.05 * r.streak)); const tip = Math.round(fare * (m >= 90 ? 0.2 : m >= 75 ? 0.12 : m >= 55 ? 0.06 : 0) * (c.vip ? 2 : 1));
      J.stats[r.id].dist += c.odo; J.release(r, c.out); J.act(c.out, 'wave'); const good = m >= 55; J.award(r, base, tip, bonus, 20 + (m >= 75 ? 8 : 0) + (fast ? 6 : 0) + (c.vip ? 12 : 0), tr('tx_fare')); if (!good) r.streak = 0;
    }
  },
  begin(J, r) {
    const G = J.game, v = r.veh, c = r.call, lvl = r.lvl; J.unmark(r, c.mk); const dest = J.pickDest(v.x, v.z, 240, 400 + 90 * lvl); c.dest = dest; c.D = dist(v.x, v.z, dest.x, dest.z);
    c.hurry = lvl >= 4 && Math.random() < 0.3; c.par = c.D * 1.3 / 11 * (c.hurry ? 0.85 : 1) + 14; c.deadline = c.par * 2.1 + 25; c.fareCap = (35 + 0.42 * c.D * 1.55) * c.M; c.ph = 'ride'; c.t = 0; c.odo = 0; c.mood = 100; r.cf = newCf();
    c.mk = J.mark(r, dest.x, dest.z, 0x3ce8f5); G.hud.subtitle(tr('tx_to', dest.name), 4); if (c.hurry) J.toast(tr('tx_hurry'), 'dim');
  },
  // the passenger gets out (angry, or out of patience) and pays for the way so far
  leave(J, r, pay, why) {
    const G = J.game, v = r.veh, s = v.seatPosition(1), o = J.newPed(r, s.x, s.z, {}); J.release(r, o); o.flee(v.x, v.z, 6); G.audio.shout('angry', dist(v.x, v.z, G.player.x, G.player.z));
    J.toast(tr(why), 'warn', 5); J.award(r, Math.round(pay), 0, 0, 5, tr('tx_fare')); r.streak = 0;
  },
};

// ===== 2. paramedic =====
IM.paramedic = {
  noGun: true,
  start(J, r) { r.cf = newCf(); },
  dispatch(J, r) {
    const G = J.game, v = r.veh, lvl = r.lvl, pt = J.pickSpot(120, 230 + 55 * lvl, v.x, v.z); if (!pt) return false;
    const roll = Math.random(), sev = lvl >= 3 ? (roll < 0.35 ? 0 : roll < 0.75 ? 1 : 2) : (roll < 0.6 ? 0 : 1), p = J.newPed(r, pt.x, pt.z, { state: 'idle', hp: 70 });
    p.setInjured(true);
    const c = r.call = { ph: 'go', ped: p, sev, cond: 100, M: lvlMult(lvl), until: G.time + 70 + dist(v.x, v.z, pt.x, pt.z) / 8.5, t: 0, tH: 0, mk: null, hosp: null };
    c.mk = J.mark(r, pt.x, pt.z, 0xff5a5a, p); J.toast(tr('pm_new') + ' – ' + tr('pm_sev' + sev), 'warn'); J.chime(); r.cf = newCf(); r.sirenOff = false; return true;
  },
  tick(J, r, dt) {
    const G = J.game, v = r.veh, h = r.h, c = r.call, now = G.time;
    if (!c) return waitMsg(J, r, h, dt, this.dispatch);
    const rate = [0.28, 0.5, 0.85][c.sev] * (1 + 0.04 * r.lvl), cond = c.cond / 100; setBar(h, 0, tr('pPatient'), cond, barColor(cond)); setBar(h, 1, tr('pCar'), v.hp / v.maxHp, barColor(v.hp / v.maxHp)); h.l2 = tr('pm_sev' + c.sev);
    if (c.ph === 'go' || c.ph === 'load') {
      if (!J.alive(c.ped)) return J.failCall(r, tr('pm_died'));
      c.cond -= rate * (c.ph === 'go' ? 0.6 : 0.3) * dt; if (c.cond <= 0) return J.failCall(r, tr('pm_died'));
      const near = inCar(J, v) && dist(v.x, v.z, c.ped.x, c.ped.z) < 8;
      if (c.ph === 'go') { const left = c.until - now; h.obj = tr('pm_go'); h.tm = left; h.tl = tr('pm_sev' + c.sev); if (left <= 0) return J.failCall(r, tr('pm_lost')); if (near && v.speed < 3) { c.ph = 'load'; c.t = 0; } }
      else { c.t += dt; h.obj = tr('pm_load'); if (!near || v.speed > 4) { c.ph = 'go'; return; } if (c.t > 2.4) this.haul(J, r, c); }
    } else if (c.ph === 'haul') {
      c.tH += dt; const pen = J.rough(r.cf, v, dt); if (pen > 0) c.cond = Math.max(0, c.cond - pen * 0.9); c.cond -= rate * dt; const left = c.deadline - c.tH;
      h.obj = tr('pm_hosp', c.hosp.name); h.tm = left; h.tl = tr('pm_sev' + c.sev); if (c.cond <= 0 || left <= 0) return J.failCall(r, tr('pm_died'));
      if (inCar(J, v) && dist(v.x, v.z, c.hosp.x, c.hosp.z) < 10 && v.speed < 3) { c.ph = 'hand'; c.t = 0; }
    } else if (c.ph === 'hand') {
      c.t += dt; h.obj = tr('pm_handover'); if (c.t < 1.8) return;
      const base = (120 + 0.3 * c.D) * (1 + 0.22 * c.sev) * c.M, f = 0.55 + 0.45 * c.cond / 100, tb = base * 0.4 * clamp((c.par * 1.4 - c.tH) / (c.par * 0.8), 0, 1);
      J.stats[r.id].dist += c.D; J.award(r, Math.round(base * f), 0, Math.round(tb * f), 26 + c.sev * 8 + (c.cond >= 80 ? 8 : 0), tr('pm_fare'));
    }
  },
  // the patient is in: the nearest hospital becomes the destination
  haul(J, r, c) {
    const W = J.game.world, v = r.veh; J.killPed(c.ped); c.ped = null; J.unmark(r, c.mk); let best = null, bd = 1e9;
    for (const id of ['hospital', 'hospital2']) { const p = W.pois[id]; if (!p) continue; const d = dist(p.x, p.z, v.x, v.z); if (d < bd) { bd = d; best = p; } }
    c.hosp = { x: best.x, z: best.z, name: T[best.label] || tr('name_paramedic') }; c.D = bd; c.par = bd * 1.25 / 13 + 12; c.deadline = c.par * 2.4 + 30; c.tH = 0; c.ph = 'haul'; r.cf = newCf(); c.mk = J.mark(r, best.x, best.z, 0xff5a5a, null, best.y || 0);
  },
};

// ===== 3. firefighter =====
// Fires burn in parked cars (they explode when left alone) and on building walls. The mouse button sprays a water jet from the roof cannon (the cannon locks softly onto
// the nearest blaze), the jet is a ballistic arc: its path is tested against every fire. An unattended fire grows and sets a new one alight.
IM.fire = {
  noGun: true,
  start(J, r) { r.st = { tank: JET.tank, az: 0, el: 0.3, spray: false, refillT: 0, tankWarn: 0, frame: 0 }; },
  end(J, r) { const mon = r.veh?.model.monitor; if (mon) { mon.yaw.rotation.y = 0; mon.pitch.rotation.z = 0; } },
  drop(J, r, c) {
    for (const f of c.fires) { J.unglow(f); if (f.veh && !f.veh.wrecked) { f.veh.special = null; if (dist(f.veh.x, f.veh.z, J.game.player.x, J.game.player.z) > 60) J.game.removeVehicle(f.veh); } }
  },
  mkFire(J, r, c, kind, x, y, z, o = {}) {
    const hp0 = (kind === 'car' ? 100 : 150) * (1 + 0.08 * (r.lvl - 1)), f = { kind, x, y, z, hp0, hp: hp0, age: 0, hit: 0, s: 1, out: false, lost: false, veh: o.veh || null, nx: o.nx || 0, nz: o.nz || 0, fuse: kind === 'car' ? Math.max(40, 80 - 5 * r.lvl) : 1e9, warned: false };
    f.mk = J.mark(r, kind === 'car' ? x : x + f.nx * 3, kind === 'car' ? z : z + f.nz * 3, 0xff7a2a, f.veh); f.mk.mesh.visible = false; f.glow = J.glowFor(f); c.fires.push(f); return f; // the pin and the minimap blip are enough: no marker cylinder over the flames
  },
  carFire(J, r, c, x, z, heading) {
    const G = J.game, types = ['sedan', 'suv', 'sport', 'muscle', 'taxi'], v = new Vehicle(types[Math.floor(Math.random() * types.length)], null, x, z, heading); v.parked = true; v.special = 'fire'; v.hp = v.maxHp * 0.5; G.addVehicle(v);
    return this.mkFire(J, r, c, 'car', x, 0.9, z, { veh: v });
  },
  // a spot on a building wall next to the pavement point s: { x, z } on the wall and the outward normal; null when there is no tall wall
  wallAt(J, s) {
    const G = J.game, W = G.world, seg = s.seg; if (!seg) return null; const fx = Math.sign(seg.b.x - seg.a.x), fz = Math.sign(seg.b.z - seg.a.z), ax = -fz * s.side, az = fx * s.side; // away from the road
    const t = G.grid.raycast(s.x, 4.5, s.z, ax, 0, az, 9); if (t < 2 || t >= 9) return null;
    const wx = s.x + ax * t, wz = s.z + az * t; if (W.buildings && !W.buildings.some(b => wx >= b.x0 - 0.7 && wx <= b.x1 + 0.7 && wz >= b.z0 - 0.7 && wz <= b.z1 + 0.7 && b.h >= 7)) return null;
    return { x: wx - ax * 0.5, z: wz - az * 0.5, nx: -ax, nz: -az };
  },
  dispatch(J, r) {
    const G = J.game, W = G.world, v = r.veh, lvl = r.lvl, n = lvl >= 5 ? 4 : lvl >= 3 ? 3 : 2; let p = null;
    for (let i = 0; i < 300; i++) { const q = W.randomLanePoint(), d = dist(q.x, q.z, v.x, v.z); if (d > 150 && d < 230 + 40 * lvl && q.lane === 1 && q.t > 0.2 && q.t < 0.8 && !G.vehicles.some(o => dist(o.x, o.z, q.x, q.z) < 12)) { p = q; break; } }
    if (!p) return false;
    const c = r.call = { fires: [], t: 0, n, cap: n + (lvl >= 3 ? 1 : 0), spreadT: 26 - 2 * lvl, tEnd: 80 + n * 55, M: lvlMult(lvl), spread: 0, lost: 0, cars: 0 };
    const ox = p.x + p.L.rx * 0.8, oz = p.z + p.L.rz * 0.8; this.carFire(J, r, c, ox, oz, p.heading);
    // a wall fire close to the burning car (the sidewalk point nearest to the car, up to 60 tries)
    let w = null; for (let i = 0; i < 160 && !w; i++) { const s = W.randomSidewalkPoint(); if (dist(s.x, s.z, ox, oz) < 55) w = this.wallAt(J, s); }
    if (w) this.mkFire(J, r, c, 'bld', w.x, 0, w.z, { nx: w.nx, nz: w.nz }); else { const q = this.spreadSpot(J, c.fires[0]); if (q) this.carFire(J, r, c, q.x, q.z, p.heading); }
    while (c.fires.length < n) { const q = this.spreadSpot(J, c.fires[0]); if (!q) break; if (q.wall) this.mkFire(J, r, c, 'bld', q.x, 0, q.z, { nx: q.nx, nz: q.nz }); else this.carFire(J, r, c, q.x, q.z, p.heading); }
    c.initial = c.fires.length; // the pay covers the blazes of the call as dispatched; spread blazes add work but no fare
    r.st.fires = c.fires; J.toast(tr('fi_new', c.fires.length), 'warn'); J.chime(); return true;
  },
  // where a blaze spreads to: another wall segment beside a wall fire, a car 6-9 m along the kerb beside a car fire
  spreadSpot(J, f) {
    const G = J.game;
    for (let i = 0; i < 12; i++) {
      if (f.kind === 'bld') { const k = (i % 2 ? 1 : -1) * (5 + Math.random() * 3), tx = -f.nz * k, tz = f.nx * k, x = f.x + tx, z = f.z + tz; if (G.grid.raycast(x + f.nx * 1.5, 4.5, z + f.nz * 1.5, -f.nx, 0, -f.nz, 3.5) < 3.2) return { x, z, nx: f.nx, nz: f.nz, wall: true }; }
      else { const L = G.world.nearestLane(f.x, f.z, f.veh?.fx || 1, f.veh?.fz || 0), k = (i % 2 ? 1 : -1) * (6.5 + Math.random() * 2.5), x = f.x + L.L.fx * k, z = f.z + L.L.fz * k; if (!G.vehicles.some(o => dist(o.x, o.z, x, z) < 5) && !G.grid.circleHit(x, z, 1.2, _hit)) return { x, z, wall: false }; }
    }
    return null;
  },
  tick(J, r, dt) {
    const G = J.game, v = r.veh, h = r.h, c = r.call, S = r.st, P = G.player;
    // the tank refills while the truck stands still
    const spraying = inCar(J, v) && !G.uiOpen && (G.input.mouse.left || G.input.btn('fire')) && S.tank > 0.2 && !!c;
    if (!spraying && v.speed < 1 && S.tank < JET.tank) { S.refillT += dt; if (S.refillT > 1.2) S.tank = Math.min(JET.tank, S.tank + JET.refill * dt); } else S.refillT = 0;
    setBar(h, 0, tr('pTank'), S.tank / JET.tank, S.refillT > 1.2 ? CYAN : S.tank > 30 ? CYAN : RED);
    if (!c) { this.aim(J, r, null, dt, false); return waitMsg(J, r, h, dt, this.dispatch); }
    c.t += dt; let alive = 0, hpSum = 0, hp0Sum = 0, fuseMin = 1e9;
    for (const f of c.fires) { if (f.out) continue; alive++; hpSum += f.hp; hp0Sum += f.hp0; if (f.kind === 'car') fuseMin = Math.min(fuseMin, f.fuse); }
    this.aim(J, r, c, dt, spraying);
    const quiet = G.settings?.quality === 'low' && (++S.frame & 1);
    for (const f of c.fires) {
      if (f.out) continue; f.age += dt; f.hit -= dt;
      if (f.veh) { f.x = f.veh.x; f.z = f.veh.z; f.y = f.veh.y + 0.9; if (f.veh.wrecked && !f.out) { this.finish(J, r, c, f, true); continue; } }
      f.s = clamp(f.hp / f.hp0, 0.15, 1) * (1 + Math.min(0.5, f.age / 90)); if (f.hit <= 0) f.hp = Math.min(f.hp0 * 1.5, f.hp + dt * 1.1); // an unattended blaze grows
      if (!quiet) this.flames(G, f);
      if (f.kind === 'car') { f.fuse -= dt; if (f.fuse < 14 && !f.warned) { f.warned = true; J.toast(tr('fi_explode'), 'warn', 6); } if (f.fuse <= 0) { f.veh.damage(9999, 'explosion'); J.toast(tr('fi_boom'), 'warn'); this.finish(J, r, c, f, true); } }
      if (f.hp <= 0) this.finish(J, r, c, f, false);
    }
    // spreading
    c.spreadT -= dt; if (c.spreadT <= 0 && alive > 0 && alive < c.cap) { c.spreadT = 22 - 2 * r.lvl + Math.random() * 6; const src = c.fires.filter(f => !f.out), f0 = src[Math.floor(Math.random() * src.length)], q = f0 && this.spreadSpot(J, f0); if (q) { if (q.wall) this.mkFire(J, r, c, 'bld', q.x, 0, q.z, { nx: q.nx, nz: q.nz }); else this.carFire(J, r, c, q.x, q.z, f0.veh ? f0.veh.heading : 0); c.spread++; J.toast(tr('fi_spread'), 'warn'); } }
    alive = 0; for (const f of c.fires) if (!f.out) alive++;
    const left = c.tEnd - c.t; h.obj = tr('fi_obj', alive); h.tm = left; h.tl = tr('fi_fare');
    setBar(h, 1, tr('pFires'), hp0Sum ? hpSum / hp0Sum : 0, hpSum / Math.max(1, hp0Sum) > 0.6 ? RED : AMBER); setBar(h, 2, tr('pCar'), v.hp / v.maxHp, barColor(v.hp / v.maxHp));
    if (fuseMin < 20) h.l1 = tr('fi_fuse') + ' ' + Math.max(0, Math.ceil(fuseMin)) + ' s'; else if (S.tank <= 0.2 && S.tankWarn <= 0) { S.tankWarn = 7; J.toast(tr('fi_tank'), 'warn'); } else if (!spraying) h.l2 = tr('fi_aim'); if (S.tankWarn > 0) S.tankWarn -= dt;
    if (alive === 0 || left <= 0) { for (const f of c.fires) if (!f.out) this.finish(J, r, c, f, true); this.complete(J, r, c); }
  },
  // a blaze ends: extinguished (steam) or lost (burnt out / exploded)
  finish(J, r, c, f, lost) {
    const G = J.game; f.out = true; f.lost = lost; if (lost) c.lost++; J.unglow(f); J.unmark(r, f.mk);
    if (!lost) { G.fx.smoke(f.x, f.y + 0.6, f.z, 6, 0.9, 2.4); G.audio.pickup(); }
  },
  complete(J, r, c) {
    const total = c.fires.length, saved = total - c.lost; if (!saved) return J.failCall(r, tr('fi_boom')); J.toast(tr('fi_done'), 'obj');
    let sum = 0; for (const f of c.fires.slice(0, c.initial)) if (!f.lost) sum += f.kind === 'car' ? 90 : 140; sum *= c.M;
    const sp = clamp((c.tEnd - c.t) / (c.tEnd * 0.6), 0, 1) * 0.3, clean = c.spread === 0 && !c.lost ? 0.15 : 0;
    this.drop(J, r, c); c.fires.length = 0; J.award(r, Math.round(sum), 0, Math.round(sum * (sp + clean)), 14 * saved + (c.lost ? 0 : 12), tr('fi_fare'));
  },
  flames(G, f) {
    const fx = G.fx, k = f.s;
    if (f.kind === 'car') { fx.fire(f.x, f.y, f.z, 3, 0.9 + 0.7 * k); if (Math.random() < 0.3) fx.sparks(f.x, f.y + 0.6, f.z, 2, 3); if (Math.random() < 0.55) fx.smoke(f.x, f.y + 1.4, f.z, 1, 0.1, 1.9 + k); return; }
    for (let i = 0; i < 3; i++) fx.fire(f.x, 1.4 + i * 2.3, f.z, 2, 0.8 + 0.5 * k); if (Math.random() < 0.6) fx.smoke(f.x, 6.8, f.z, 1, 0.08, 2.2 + 2 * k);
  },
  // Water cannon: aims along the camera (elevation from the camera pitch) and locks softly onto the best blaze; while the button is held the jet is emitted and tested against the fires.
  aim(J, r, c, dt, spraying) {
    const G = J.game, v = r.veh, S = r.st, mon = v.model.monitor, cam = G.camera; if (!mon) return;
    cam.getWorldDirection(_dir); const psi0 = Math.atan2(-_dir.z, _dir.x), phi0 = clamp(0.5 + _dir.y * 1.1, 0.12, 1.15);
    const mx = v.x + v.fx * 1.15, my = v.y + 3.48, mz = v.z + v.fz * 1.15; let psi = psi0, phi = phi0, best = null, bs = 1e9;
    if (c && inCar(J, v)) for (const f of c.fires) {
      if (f.out) continue; const dx = f.x - mx, dz = f.z - mz, dh = Math.hypot(dx, dz); if (dh > JET.range * 0.9 || dh < 1) continue;
      const da = Math.abs(wrap(Math.atan2(-dz, dx) - psi0)); if (da > JET.cone) continue; const sc = da * 12 + dh * 0.05; if (sc < bs) { bs = sc; best = f; }
    }
    if (best) {
      const dx = best.x - mx, dz = best.z - mz, dh = Math.hypot(dx, dz), dy = (best.kind === 'car' ? 1.0 : 3.4) - my, s2 = JET.speed * JET.speed, g = JET.g, disc = s2 * s2 - g * (g * dh * dh + 2 * dy * s2);
      const th = disc >= 0 ? Math.atan((s2 - Math.sqrt(disc)) / (g * dh)) : 0.78; psi = psi0 + wrap(Math.atan2(-dz, dx) - psi0) * JET.assist; phi = phi0 + (th - phi0) * JET.assist;
    }
    S.az += wrap(psi - S.az) * Math.min(1, dt * 10); S.el += (phi - S.el) * Math.min(1, dt * 10);
    mon.yaw.rotation.y = wrap(S.az - v.heading); mon.pitch.rotation.z = S.el;
    if (!spraying) return;
    const ce = Math.cos(S.el), dx = Math.cos(S.az) * ce, dy = Math.sin(S.el), dz = -Math.sin(S.az) * ce, fx = G.fx.norm, n = G.settings?.quality === 'low' ? 3 : 6;
    const tx = mx + dx * 0.96, ty = my + dy * 0.96, tz = mz + dz * 0.96; S.tank = Math.max(0, S.tank - JET.drain * dt);
    for (let i = 0; i < n; i++) { const sp = JET.speed * (0.97 + Math.random() * 0.06); fx.emit(tx, ty, tz, dx * sp + (Math.random() - 0.5) * 1.1 + v.vx * 0.6, dy * sp + (Math.random() - 0.5) * 1.1, dz * sp + (Math.random() - 0.5) * 1.1 + v.vz * 0.6, 1.0 + Math.random() * 0.6, 0.26 + Math.random() * 0.2, 0.9, 0.96, 1.0, 0.62, { grav: JET.g, grow: 0.7, drag: 0.04 }); }
    for (let i = 0; i < 2; i++) { const sp = JET.speed * (0.98 + Math.random() * 0.04); G.fx.add.emit(tx, ty, tz, dx * sp + v.vx * 0.6, dy * sp, dz * sp + v.vz * 0.6, 0.55 + Math.random() * 0.4, 0.2, 0.3, 0.42, 0.55, 0.55, { grav: JET.g, grow: 0.2 }); } // a faint additive core keeps the jet readable at night
    const A = G.audio; S.hissT = (S.hissT || 0) - dt; if (S.hissT <= 0 && A.enabled) { S.hissT = 0.1; A.noise(A.ctx.currentTime, 0.16, 0.16, { bp: 3200, q: 0.7, a: 0.03 }); } // the hiss of the jet
    if (!c) return;
    for (const f of c.fires) {
      if (f.out) continue; const rad = f.kind === 'car' ? 2.0 : 3.2, y0 = f.kind === 'car' ? -0.2 : 0.2, y1 = f.kind === 'car' ? 2.6 : 7.5; let hit = false;
      for (let k = 1; k <= 16 && !hit; k++) { const t = k * 0.08, px = tx + dx * JET.speed * t + v.vx * 0.6 * t, pz = tz + dz * JET.speed * t + v.vz * 0.6 * t, py = ty + dy * JET.speed * t - JET.g * t * t * 0.5; if (py >= y0 && py <= y1 && (px - f.x) ** 2 + (pz - f.z) ** 2 < rad * rad) hit = true; }
      if (hit) { f.hp -= JET.dps * dt; f.hit = 1.4; c.spreadT = Math.max(c.spreadT, 8); if (Math.random() < 0.5) G.fx.smoke(f.x, f.y + 0.4, f.z, 1, 0.9, 1.3); }
    }
  },
};

// ===== 4. tow truck =====
IM.tow = {
  noGun: true,
  drop(J, r, c) {
    const G = J.game, v = r.veh; if (v?.towed) J.unhook(v);
    if (c.car) { c.car.special = null; c.car.towTarget = false; if (!c.car.wrecked && c.ph === 'go' && !inCar(J, c.car) && dist(c.car.x, c.car.z, G.player.x, G.player.z) > 50) G.removeVehicle(c.car); }
  },
  dispatch(J, r) {
    const G = J.game, W = G.world, v = r.veh, imp = J.impound; let p = null;
    for (let i = 0; i < 300; i++) { const q = W.randomLanePoint(), d = dist(q.x, q.z, v.x, v.z); if (q.lane === 1 && q.t > 0.25 && q.t < 0.75 && d > 130 && d < 230 + 40 * r.lvl && dist(q.x, q.z, imp.x, imp.z) > 110 && !G.vehicles.some(o => dist(o.x, o.z, q.x, q.z) < 12)) { p = q; break; } }
    if (!p) return false;
    const types = ['sedan', 'suv', 'sport', 'muscle', 'taxi'], car = new Vehicle(types[Math.floor(Math.random() * types.length)], null, p.x + p.L.rx * 0.75, p.z + p.L.rz * 0.75, p.heading); car.parked = true; car.special = 'tow'; car.towTarget = true; G.addVehicle(car);
    const D = dist(car.x, car.z, imp.x, imp.z), c = r.call = { ph: 'go', car, hook: 0, end: 'r', ca: 0, t: 0, M: lvlMult(r.lvl), D, par: D * 1.3 / 8 + 14, hp0: car.hp, mk: null };
    c.deadline = (dist(v.x, v.z, car.x, car.z) / 8 + c.par) * 1.7 + 50; c.mk = J.mark(r, car.x, car.z, 0xf0ac14, car); J.toast(tr('tw_new'), 'obj'); J.chime(); return true;
  },
  tick(J, r, dt) {
    const G = J.game, v = r.veh, h = r.h, c = r.call, S = r.st, imp = J.impound;
    const boom = v.model.boom; v.siren = !!c;
    if (!c) { if (boom) boom.rotation.z = damp(boom.rotation.z, 0, 3, dt); return waitMsg(J, r, h, dt, this.dispatch); }
    const car = c.car; c.t += dt;
    if (car.wrecked || !G.vehicles.includes(car)) return J.failCall(r, tr('tw_lost'));
    const left = c.deadline - c.t; h.tm = left; h.tl = tr('tw_fare'); const hpf = clamp(car.hp / c.hp0, 0, 1); if (left <= 0) return J.failCall(r, tr('tw_lost'));
    if (c.ph === 'go') {
      h.obj = tr('tw_go'); if (boom) boom.rotation.z = damp(boom.rotation.z, 0.14, 3, dt);
      const hx = v.x - v.fx * HOOK_BACK, hz = v.z - v.fz * HOOK_BACK, hl = car.spec.len / 2, dF = dist(hx, hz, car.x + car.fx * hl, car.z + car.fz * hl), dR = dist(hx, hz, car.x - car.fx * hl, car.z - car.fz * hl), end = dF < dR ? 'f' : 'r', d = Math.min(dF, dR), dot = v.fx * car.fx + v.fz * car.fz;
      const ok = inCar(J, v) && d < HOOK_REACH && v.speed < 2.6 && (end === 'f' ? dot > 0.72 : dot < -0.72);
      if (d < 10 && !ok) h.l2 = tr('tw_back'); if (ok) { c.hook += dt; h.l2 = tr('tw_hooking'); } else c.hook = Math.max(0, c.hook - dt * 2);
      setBar(h, 0, tr('tw_hooking'), c.hook, AMBER);
      if (c.hook >= 1) { c.ph = 'tow'; c.end = end; c.ca = end === 'f' ? Math.atan2(car.fz, car.fx) : Math.atan2(-car.fz, -car.fx); v.towed = car; car.towedBy = v; car.parked = true; J.toast(tr('tw_hooked'), 'obj'); G.audio.click(); c.t = 0; c.deadline = c.par * 1.7 + 30; J.unmark(r, c.mk); c.mk = J.mark(r, imp.x, imp.z, 0xf0ac14); G.fx.sparks(hx, 0.6, hz, 8, 4); }
    } else if (c.ph === 'tow') {
      c.tTow = (c.tTow || 0) + dt; h.obj = tr('tw_tow'); if (boom) boom.rotation.z = damp(boom.rotation.z, -0.06, 3, dt); this.follow(J, r, c, dt); setBar(h, 0, tr('pCar'), hpf, barColor(hpf));
      if (inCar(J, v) && dist(v.x, v.z, imp.x, imp.z) < imp.r && v.speed < 2.5) { c.ph = 'drop'; c.t = 0; }
    } else if (c.ph === 'drop') {
      c.t += dt; h.obj = tr('tw_release'); this.follow(J, r, c, dt); if (c.t < 1.2) return;
      J.unhook(v); car.parked = true; car.special = null; car.towTarget = false; imp.cars.push(car); while (imp.cars.length > 6) { const o = imp.cars.shift(); if (G.vehicles.includes(o) && dist(o.x, o.z, G.player.x, G.player.z) > 30) G.removeVehicle(o); }
      const base = (130 + 0.28 * c.D) * c.M * (0.6 + 0.4 * hpf), sp = base * 0.3 * clamp((c.par * 1.3 - (c.tTow || 0)) / (c.par * 0.8), 0, 1); c.car = null;
      J.stats[r.id].dist += c.D; J.toast(tr('tw_done'), 'obj'); J.award(r, Math.round(base), 0, Math.round(sp + (hpf > 0.97 ? base * 0.1 : 0)), 24, tr('tw_fare'));
    }
  },
  // the car trails the hoist like a trailer: its attached end sits on the hook point, the body swings round behind the truck
  follow(J, r, c, dt) {
    const G = J.game, v = r.veh, car = c.car, hl = car.spec.len / 2, hx = v.x - v.fx * HOOK_BACK, hz = v.z - v.fz * HOOK_BACK;
    c.ca += wrap(Math.atan2(hz - car.z, hx - car.x) - c.ca) * Math.min(1, (2.5 + v.speed * 0.5) * dt); const ux = Math.cos(c.ca), uz = Math.sin(c.ca);
    car.x = hx - ux * hl; car.z = hz - uz * hl; car.heading = c.end === 'f' ? Math.atan2(-uz, ux) : Math.atan2(uz, -ux); car.vx = v.vx; car.vz = v.vz; car.spin += v.forwardSpeed * dt / car.model.wheelR; car.syncMesh(G.time);
  },
};

// ===== 5. food courier =====
IM.courier = {
  noGun: true,
  start(J, r) { r.cf = newCf(); },
  dispatch(J, r) {
    const G = J.game, W = G.world, v = r.veh, shops = ['burger', 'burger2'].map(id => W.pois[id]).filter(Boolean); if (!shops.length) return false;
    shops.sort((a, b) => dist(a.x, a.z, v.x, v.z) - dist(b.x, b.z, v.x, v.z)); const shop = shops[Math.random() < 0.7 ? 0 : shops.length - 1], n = r.lvl >= 5 ? 3 : r.lvl >= 3 ? 2 : 1;
    const c = r.call = { ph: 'pick', shop: { x: shop.x, z: shop.z, name: T[shop.label] || 'Neon Burger' }, n, orders: [], t: 0, cond: 100, M: lvlMult(r.lvl), done: 0, t0: 0, mk: null };
    c.mk = J.mark(r, shop.x, shop.z, 0xff9a3c); J.toast(tr('cr_new') + (n > 1 ? ' ×' + n : ''), 'obj'); J.chime(); return true;
  },
  tick(J, r, dt) {
    const G = J.game, v = r.veh, h = r.h, c = r.call, now = G.time;
    if (!c) return waitMsg(J, r, h, dt, this.dispatch);
    if (c.ph === 'pick') {
      h.obj = tr('cr_pick', c.shop.name); if (inCar(J, v) && dist(v.x, v.z, c.shop.x, c.shop.z) < 9 && v.speed < 3.5) { c.ph = 'load'; c.t = 0; }
    } else if (c.ph === 'load') {
      c.t += dt; h.obj = tr('cr_loading'); setBar(h, 0, tr('cr_loading'), c.t / 1.6, AMBER); if (!inCar(J, v) || dist(v.x, v.z, c.shop.x, c.shop.z) > 14 || v.speed > 4) { c.ph = 'pick'; return; }
      if (c.t > 1.6) this.depart(J, r, c);
    } else if (c.ph === 'drop') {
      const pen = J.rough(r.cf, v, dt); if (pen > 0) { c.cond = Math.max(0, c.cond - pen * 1.1); J.toast(tr('cr_cold'), 'dim', 2.5); }
      const cond = c.cond / 100, el = now - c.t0; let nextO = null, tmin = 1e9;
      for (const o of c.orders) {
        if (o.done) continue; const left = o.deadline - el; if (left < tmin) { tmin = left; nextO = o; }
        if (left <= 0) { o.done = true; c.done++; J.unmark(r, o.mk); if (c.done >= c.n && !c.paid) return J.failCall(r, tr('cr_expired')); J.toast(tr('cr_expired'), 'warn', 5); r.streak = 0; J.stats[r.id].fails++; if (c.done >= c.n) { J.dropCall(r); J.nextCall(r); return; } continue; }
        if (inCar(J, v) && dist(v.x, v.z, o.x, o.z) < 8 && v.speed < 5) { this.deliver(J, r, c, o, el); if (!r.call) return; }
      }
      h.obj = nextO ? tr('cr_drop', nextO.name, c.done + 1, c.n) : ''; h.tm = tmin < 1e8 ? tmin : -1; h.tl = tr('cr_time'); setBar(h, 0, tr('pOrder'), cond, barColor(cond)); setBar(h, 1, tr('pCar'), v.hp / v.maxHp, barColor(v.hp / v.maxHp));
    }
  },
  // the order is in the van: the addresses, nearest first, with a time limit that adds up along that route
  depart(J, r, c) {
    J.unmark(r, c.mk); let fx = c.shop.x, fz = c.shop.z, cum = 0; const list = [];
    for (let i = 0; i < c.n; i++) { const s = J.pickSpot(140, 300 + 50 * r.lvl, c.shop.x, c.shop.z); list.push({ x: s.x, z: s.z, name: J.nameAt(s.x, s.z) }); }
    const rest = [...list]; while (rest.length) { rest.sort((a, b) => dist(a.x, a.z, fx, fz) - dist(b.x, b.z, fx, fz)); const o = rest.shift(), leg = dist(o.x, o.z, fx, fz); cum += leg * 1.3 / 9.5 + 8; o.D = dist(o.x, o.z, c.shop.x, c.shop.z); o.par = cum; o.deadline = cum * 1.75 + 18; o.done = false; o.mk = J.mark(r, o.x, o.z, 0xff9a3c); c.orders.push(o); fx = o.x; fz = o.z; }
    c.ph = 'drop'; c.t0 = J.game.time; c.cond = 100; c.paid = false; r.cf = newCf();
  },
  deliver(J, r, c, o, el) {
    const G = J.game, fare = Math.round((65 + 0.34 * o.D) * c.M), q = el / o.par, sf = clamp((1.8 - q) / 0.8, 0, 1), cond = c.cond / 100, tip = Math.round(fare * 0.45 * sf * cond * cond), bonus = q <= 0.8 && c.cond >= 85 ? Math.round(fare * 0.1) : 0;
    o.done = true; c.done++; c.paid = true; J.unmark(r, o.mk); const p = J.newPed(r, o.x, o.z, { state: 'idle' }); J.stand(p); J.act(p, 'wave'); setTimeout(() => J.release(r, p), 2500); J.stats[r.id].dist += o.D;
    if (c.done >= c.n) return J.award(r, fare, tip, bonus, 20 + (c.cond >= 80 ? 8 : 0), tr('cr_delivered'));
    J.award(r, fare, tip, bonus, 18, tr('cr_delivered'), { keep: true }); // earlier orders of a multi-drop pay at once, the call goes on
  },
};

// ===== 6. bus driver =====
// The bus drives the loop of J.route.stops on the kerb lane. At a stop it opens the doors, passengers get off and the waiting ones walk to the door; the stop pays per passenger,
// with bonuses for being on schedule and for a comfortable ride. A lap pays a bonus. The bus stops (pole, sign, shelter) are drawn for the length of the shift.
let busGeo = null;
function busStopMesh(scene, stop, signMat) {
  const B = busGeo || (busGeo = { pole: new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), disc: new THREE.CircleGeometry(0.36, 20), bench: new THREE.BoxGeometry(1.5, 0.08, 0.4), back: new THREE.BoxGeometry(1.5, 0.45, 0.06), roof: new THREE.BoxGeometry(2.4, 0.07, 1.2), panel: new THREE.BoxGeometry(2.3, 1.7, 0.03),
    dark: new THREE.MeshStandardMaterial({ color: 0x20232a, roughness: 0.6, metalness: 0.5 }), glass: new THREE.MeshStandardMaterial({ color: 0x9ac8e8, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.3, depthWrite: false }), wood: new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 }) });
  // local +x = along the road (the bus drives that way), local +z = towards the pavement (the right-hand side)
  const g = new THREE.Group(); g.position.set(stop.x + stop.rx * 3.3, 0.15, stop.z + stop.rz * 3.3); g.rotation.y = Math.atan2(-stop.fz, stop.fx);
  const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; g.add(m); return m; };
  add(B.pole, B.dark, 2.2, 1.3, -0.5); add(B.disc, signMat, 2.2, 2.45, -0.5, Math.PI / 2);
  add(B.roof, B.dark, 0, 2.3, 0.35); add(B.panel, B.glass, 0, 1.4, 0.95); add(B.bench, B.wood, 0, 0.45, 0.6); add(B.back, B.wood, 0, 0.75, 0.82);
  for (const x of [-1.1, 1.1]) add(B.pole, B.dark, x, 1.3, 0.95).scale.set(1, 0.88, 1);
  scene.add(g); return g;
}
function busSignTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#1f5fc4'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '900 60px "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BUS', 64, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
IM.bus = {
  noGun: true,
  start(J, r) {
    const G = J.game, st = r.st, route = J.route; Object.assign(st, { idx: 0, lap: 0, pax: 0, sched: null, ph: 'drive', comfort: 100, wait: {}, signs: [], lapStops: 0, lapPax: 0, hardT: 0, dw: null, mk: null }); r.cf = newCf(); if (!route) return;
    st.tex = busSignTex(); st.signMat = new THREE.MeshBasicMaterial({ map: st.tex, side: THREE.DoubleSide }); for (const s of route.stops) st.signs.push(busStopMesh(G.scene, s, st.signMat));
    this.spawnWaiters(J, r, 0); this.spawnWaiters(J, r, 1); this.target(J, r);
  },
  end(J, r) { const st = r.st; for (const g of st.signs || []) J.game.scene.remove(g); st.signMat?.dispose(); st.tex?.dispose(); st.signs = []; if (r.veh) r.veh.hazard = false; },
  stopAt(J, i) { const s = J.route.stops; return s[i % s.length]; },
  target(J, r) { const st = r.st; if (st.mk) J.unmark(r, st.mk); const s = this.stopAt(J, st.idx); st.mk = J.mark(r, s.x, s.z, 0x4d8cff); st.mk.mesh.children[0].scale.set(1.8, 1, 1.8); },
  spawnWaiters(J, r, i) {
    const st = r.st; if (st.wait[i]) return; const s = this.stopAt(J, i), n = 1 + Math.floor(Math.random() * 4) + (r.lvl >= 3 ? 1 : 0), list = st.wait[i] = [];
    for (let j = 0; j < n; j++) { const p = J.newPed(r, s.x + s.rx * 3.9 + s.fx * (1.2 + j * 1.0), s.z + s.rz * 3.9 + s.fz * (1.2 + j * 1.0), { state: 'idle' }); J.stand(p); list.push(p); }
  },
  door(v) { return { x: v.x + v.fx * 3.7 - v.fz * (v.spec.wid / 2 + 0.7), z: v.z + v.fz * 3.7 + v.fx * (v.spec.wid / 2 + 0.7) }; },
  tick(J, r, dt) {
    const G = J.game, v = r.veh, h = r.h, st = r.st, now = G.time, route = J.route; if (!route) return;
    const stop = this.stopAt(J, st.idx), n = route.stops.length, name = J.nameAt(stop.x, stop.z), num = (st.idx % n) + 1;
    const dx = v.x - stop.x, dz = v.z - stop.z, along = dx * stop.fx + dz * stop.fz, lat = dx * stop.rx + dz * stop.rz;
    // ride comfort for everybody on board; heavy braking, slides and crashes use it up, a smooth ride gives it back
    const pen = J.rough(r.cf, v, dt); if (pen > 0) { st.comfort = Math.max(0, st.comfort - pen * 0.8); if (st.hardT <= 0 && st.pax > 0) { st.hardT = 5; J.toast(tr('bs_hard'), 'dim', 2.5); } } else st.comfort = Math.min(100, st.comfort + 0.5 * dt); if (st.hardT > 0) st.hardT -= dt;
    setBar(h, 0, tr('pComfort'), st.comfort / 100, barColor(st.comfort / 100)); setBar(h, 1, tr('pCar'), v.hp / v.maxHp, barColor(v.hp / v.maxHp)); h.l1 = tr('pStop', num, n); h.l2 = tr('pPax') + ' ' + st.pax;
    if (st.ph === 'drive') {
      h.obj = st.sched === null ? tr('bs_ready') + ' – ' + name : tr('bs_obj', num, name); if (st.sched !== null) { h.tm = Math.max(0, st.sched - now); h.tl = tr('bs_next'); }
      v.hazard = false;
      if (inCar(J, v) && Math.abs(along) < 3.4 && Math.abs(lat) < 2.8 && v.speed < 0.8 && v.fx * stop.fx + v.fz * stop.fz > 0.88) this.arrive(J, r);
      else if (along > 26 && Math.abs(lat) < 9 && v.speed > 2) { J.toast(tr('bs_missed'), 'warn'); st.comfort = Math.max(0, st.comfort - 10); this.advance(J, r, stop, false, 0); }
    } else {
      const d = st.dw; d.t += dt; v.hazard = true; h.obj = tr('bs_board'); const door = this.door(v);
      if (d.out > 0 && d.t > 0.8 && (d.spT -= dt) <= 0) { d.spT = 0.5; d.out--; st.pax--; d.moved++; J.release(r, J.newPed(r, door.x, door.z, {})); }
      for (let i = d.board.length - 1; i >= 0; i--) {
        const p = d.board[i]; if (!J.alive(p)) { d.board.splice(i, 1); continue; } if (d.t < 0.8) continue;
        if (J.walk(p, door.x, door.z, 1.9, dt) < 1.4) { J.killPed(p); const k = r.peds.indexOf(p); if (k >= 0) r.peds.splice(k, 1); d.board.splice(i, 1); st.pax++; d.moved++; }
      }
      const done = d.out <= 0 && !d.board.length && d.t > 1.6, left = v.speed > 2.4 || Math.abs(along) > 9;
      if (done || d.t > 10 || left) this.advance(J, r, stop, d.moved > 0, d.moved); // a stop pays only for the passengers it moved
    }
    this.spawnWaiters(J, r, st.idx + 1); this.spawnWaiters(J, r, st.idx + 2);
  },
  arrive(J, r) { const st = r.st, i = st.idx, board = st.wait[i] || []; delete st.wait[i]; st.ph = 'dwell'; st.dw = { t: 0, out: Math.min(st.pax, Math.ceil(st.pax * (0.35 + Math.random() * 0.45)) + (st.pax > 1 && Math.random() < 0.3 ? 1 : 0)), board, moved: 0, spT: 0 }; J.game.audio.click(); },
  // leaving the stop: pay what was moved, the punctuality / comfort bonuses, then aim at the next stop (a lap pays a bonus when the first stop comes round again)
  advance(J, r, stop, pay, moved) {
    const G = J.game, st = r.st, now = G.time, M = lvlMult(r.lvl), n = J.route.stops.length, next = this.stopAt(J, st.idx + 1); r.veh.hazard = false;
    const lost = st.wait[st.idx]; if (lost) { for (const p of lost) J.release(r, p); delete st.wait[st.idx]; } if (st.dw) for (const p of st.dw.board) J.release(r, p);
    if (pay && st.ph === 'dwell') {
      const late = st.sched === null ? null : now - st.dw.t - st.sched, base = Math.round((40 + 10 * moved) * M), punct = late !== null && late >= -12 && late <= 18 ? Math.round(base * 0.25) : 0, comf = st.comfort >= 80 ? Math.round(base * 0.2) : 0;
      if (late !== null) J.toast(late > 18 ? tr('bs_late') : late < -12 ? tr('bs_early') : tr('bs_ontime'), late > 18 || late < -12 ? 'warn' : 'obj', 3);
      J.stats[r.id].dist += dist(stop.x, stop.z, next.x, next.z); J.award(r, base, 0, punct + comf, 9 + (punct ? 3 : 0), tr('bs_fare'), { keep: true }); st.lapStops++; st.lapPax += moved;
    }
    st.ph = 'drive'; st.dw = null; st.sched = now + dist(stop.x, stop.z, next.x, next.z) / 7 + 5; st.idx++;
    if (st.idx % n === 0) { st.lap++; const lb = Math.round((150 + 25 * n) * M * (st.lapStops / n) * (st.comfort >= 60 ? 1 : 0.5)); J.toast(tr('bs_lap', st.lapStops, st.lapPax), 'obj', 6); if (st.lapStops > 0) J.award(r, 0, 0, lb, 40, tr('bs_lapBonus'), { keep: true, noCall: true }); st.lapStops = 0; st.lapPax = 0; st.comfort = Math.max(st.comfort, 70); }
    this.target(J, r);
  },
  noEnd: r => r.st.ph === 'dwell',
};

// ===== 7. car export =====
// Steal the car the exporter wants (parked in a lot, or driving in traffic from level 3), take it to the docks. Entering the car sets off the alarm and puts stars on you.
const EXPORT_POOL = [['sedan', 'suv'], ['sedan', 'suv', 'sport'], ['suv', 'sport', 'muscle', 'taxi'], ['sport', 'muscle', 'truck', 'limo'], ['muscle', 'limo', 'super', 'sport']];
IM.export = {
  must(J, r) { return r.call?.ph === 'haul' ? r.call.car : null; },
  noEnd: r => r.call?.ph === 'haul',
  drop(J, r, c) { const G = J.game; if (c.car) { c.car.special = null; c.car.hazard = false; if (c.ph === 'find' && !inCar(J, c.car) && G.vehicles.includes(c.car) && dist(c.car.x, c.car.z, G.player.x, G.player.z) > 40) G.removeVehicle(c.car); } },
  dispatch(J, r) {
    const G = J.game, W = G.world, P = G.player, lvl = r.lvl, pool = EXPORT_POOL[lvl - 1], type = pool[Math.floor(Math.random() * pool.length)], hex = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]; let car = null;
    if (lvl >= 3 && Math.random() < 0.65) { // a car in traffic
      for (let i = 0; i < 200 && !car; i++) { const q = W.randomLanePoint(), d = dist(q.x, q.z, P.x, P.z); if (d < 110 || d > 200 || G.vehicles.some(o => dist(o.x, o.z, q.x, q.z) < 12)) continue; car = new Vehicle(type, hex, q.x, q.z, q.heading); car.ai = { mode: 'traffic', cruise: 12 + lvl, blocked: 0, panic: 0, lane: q.lane, seg: q.seg, dir: q.dir }; acquireLane(car, W); car.vx = car.fx * 10; car.vz = car.fz * 10; }
    }
    if (!car) { // parked in a lot (a free slot 130-420 m away) or at the kerb
      const spots = W.parkingSpots.filter(s => { const d = dist(s.x, s.z, P.x, P.z); return d > 130 && d < 420 && !G.vehicles.some(o => dist(o.x, o.z, s.x, s.z) < 3); });
      if (spots.length) { const s = spots[Math.floor(Math.random() * spots.length)]; car = new Vehicle(type, hex, s.x, s.z, s.heading); car.parked = true; }
      else { for (let i = 0; i < 200 && !car; i++) { const q = W.randomLanePoint(), d = dist(q.x, q.z, P.x, P.z); if (d < 130 || d > 300 || q.lane !== 1 || G.vehicles.some(o => dist(o.x, o.z, q.x, q.z) < 12)) continue; car = new Vehicle(type, hex, q.x + q.L.rx * 0.75, q.z + q.L.rz * 0.75, q.heading); car.parked = true; } }
    }
    if (!car) return false;
    car.special = 'export'; G.addVehicle(car); const name = tr('col_' + (CAR_COLOR_KEY[hex] || 'grey')) + ' ' + (T.vehicle?.[type] || type);
    const c = r.call = { ph: 'find', car, type, name, M: lvlMult(lvl), t: 0, alarmT: 0, hornT: 0, mk: null };
    c.mk = J.mark(r, car.x, car.z, 0xc084fc, car); J.toast(tr('ex_new') + ': ' + name, 'obj', 6); J.chime(); return true;
  },
  tick(J, r, dt) {
    const G = J.game, P = G.player, h = r.h, c = r.call, dep = r.dep;
    h.l2 = tr('pHeat') + ' ' + '★'.repeat(G.police.level);
    if (!c) return waitMsg(J, r, h, dt, this.dispatch);
    const car = c.car; c.t += dt;
    if (car.wrecked) return J.failCall(r, tr('ex_lost'));
    if (!G.vehicles.includes(car)) return J.failCall(r, tr('ex_far'), false);
    if (c.ph === 'find') {
      h.obj = tr('ex_find', c.name); h.l1 = c.name;
      if (P.vehicle === car) { // the theft: alarm, hazards, police
        c.ph = 'haul'; c.t = 0; c.alarmT = 6; car.hazard = true; car.special = 'export'; car.parked = false; J.unmark(r, c.mk); c.mk = J.mark(r, dep.x, dep.z, 0xc084fc, null, dep.y || 0);
        G.police.setLevel(Math.max(G.police.level, [1, 1, 2, 2, 3][r.lvl - 1])); J.toast(tr('ex_alarm'), 'warn', 5);
      }
    } else if (c.ph === 'haul') {
      if (c.alarmT > 0) { c.alarmT -= dt; c.hornT -= dt; if (c.hornT <= 0) { c.hornT = 0.7; G.audio.horn(0); } if (c.alarmT <= 0) car.hazard = false; }
      h.obj = tr('ex_haul'); const cond = car.hp / car.maxHp; setBar(h, 0, tr('ex_cond'), cond, barColor(cond)); h.l1 = c.name;
      if (P.vehicle === car && dist(car.x, car.z, dep.x, dep.z) < 10 && car.speed < 3.5) {
        const price = VEHICLES[c.type].price, base = clamp(price * 0.1 + 300, 450, 3200) * c.M * (0.5 + 0.5 * cond), clean = G.police.level === 0 ? base * 0.25 : 0, quick = c.t < 150 ? base * 0.1 : 0;
        J.toast(tr('ex_done'), 'obj'); if (clean) J.toast(tr('ex_clean'), 'cash', 3); P.exitVehicle(); G.removeVehicle(car); c.car = null;
        J.award(r, Math.round(base), 0, Math.round(clean + quick), 40 + r.lvl * 6, tr('ex_fare'));
      }
    }
  },
};
for (const id of IDS) if (!IM[id]) IM[id] = {};
