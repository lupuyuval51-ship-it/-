import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["can", "used for ability or permission: I ___ swim. ___ I go out?", "can", "משמש ליכולת או לרשות: I ___ swim. ___ I go out?"],
      ["must", "used for strong obligation or rules: You ___ wear a seat belt.", "must", "משמש לחובה חזקה או לכללים: You ___ wear a seat belt."],
      ["should", "used for advice: You ___ drink more water.", "should", "משמש לעצה: You ___ drink more water."],
      ["Modal verb", "a helper verb like can, must or should, followed by the base form", "פועל מודלי", "פועל עזר כמו can, must או should, שבא אחריו פועל בצורת הבסיס"],
    ],
    q: [
      [["Choose the correct sentence.", "She can play the guitar.", ["She cans play the guitar.", "She can plays the guitar.", "She can to play the guitar."], "Modals do not take -s, and the next verb stays in the base form."],
        ["בחרו את המשפט הנכון.", "She can play the guitar.", ["She cans play the guitar.", "She can plays the guitar.", "She can to play the guitar."], "פעלים מודליים לא מקבלים s, והפועל שאחריהם נשאר בצורת הבסיס."]],
      [["Which word gives advice? “You ___ go to bed early before the trip.”", "should", ["can't", "mustn't", "could have"], "Should is used for advice."],
        ["איזו מילה נותנת עצה? ״You ___ go to bed early before the trip.״", "should", ["can't", "mustn't", "could have"], "should משמש לנתינת עצה."]],
    ],
  },
  i: {
    t: [
      ["mustn't", "used when something is not allowed: You ___ run near the pool.", "mustn't", "משמש כשמשהו אסור: You ___ run near the pool."],
      ["don't have to", "used when something is not necessary, but allowed", "don't have to", "משמש כשמשהו לא הכרחי, אבל מותר"],
      ["could", "the past of can, and a polite way to ask: ___ you help me?", "could", "צורת העבר של can, וגם דרך מנומסת לבקש: ___ you help me?"],
      ["might", "used for a small possibility: It ___ rain later.", "might", "משמש לאפשרות קטנה: It ___ rain later."],
    ],
    q: [
      [["“You mustn't touch it” and “You don't have to touch it” — what is the difference?", "Mustn't means it is forbidden; don't have to means it is not necessary", ["They mean the same", "Don't have to means forbidden", "Mustn't means maybe"], "Mustn't = do not do it; don't have to = you may, but you need not."],
        ["״You mustn't touch it״ לעומת ״You don't have to touch it״ — מה ההבדל?", "mustn't פירושו שאסור; don't have to פירושו שזה לא הכרחי", ["הם אותו דבר", "don't have to פירושו אסור", "mustn't פירושו אולי"], "mustn't = אסור לעשות; don't have to = מותר, אבל אין צורך."]],
      [["Which is the most polite request?", "Could you open the window, please?", ["Open the window.", "You must open the window.", "Can open window?"], "Could plus please is a polite way to ask."],
        ["איזו בקשה הכי מנומסת?", "Could you open the window, please?", ["Open the window.", "You must open the window.", "Can open window?"], "could יחד עם please הוא דרך מנומסת לבקש."]],
    ],
  },
  a: {
    t: [
      ["must have + past participle", "a strong guess about the past: She ___ left already — her coat is gone.", "must have", "ניחוש חזק על העבר: She ___ left already — her coat is gone."],
      ["should have + past participle", "regret or criticism about the past: I ___ studied more.", "should have", "חרטה או ביקורת על העבר: I ___ studied more."],
      ["can't have + past participle", "being sure something did not happen: He ___ seen me; I was hiding.", "can't have", "ביטחון שמשהו לא קרה: He ___ seen me; I was hiding."],
      ["be able to", "a form that expresses ability in tenses where can has no form: I will ___ come.", "be able to", "צורה שמבטאת יכולת בזמנים שבהם ל־can אין צורה: I will ___ come."],
    ],
    q: [
      [["The ground is wet, but I didn't see rain. Which sentence fits?", "It must have rained.", ["It must rain.", "It should rain yesterday.", "It can have rained yesterday surely."], "Must have + past participle makes a confident deduction about the past."],
        ["האדמה רטובה, אבל לא ראיתי גשם. איזה משפט מתאים?", "It must have rained.", ["It must rain.", "It should rain yesterday.", "It can have rained yesterday surely."], "must have ועוד צורת בינוני פעול מבטאים מסקנה בטוחה על העבר."]],
      [["Which sentence expresses regret?", "I should have listened to you.", ["I must listen to you yesterday.", "I can listen to you.", "I might listening to you."], "Should have + past participle talks about something that was the right thing to do but did not happen."],
        ["איזה משפט מבטא חרטה?", "I should have listened to you.", ["I must listen to you yesterday.", "I can listen to you.", "I might listening to you."], "should have ועוד צורת בינוני פעול מדברים על משהו שהיה נכון לעשות אבל לא קרה."]],
    ],
  },
};
export default c;
