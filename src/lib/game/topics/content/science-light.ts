import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Light source", "something that gives out its own light, like the sun or a lamp", "מקור אור", "משהו שפולט אור משלו, כמו השמש או מנורה"],
      ["Shadow", "a dark area made where an object blocks light", "צל", "אזור חשוך שנוצר במקום שבו עצם חוסם את האור"],
      ["Reflection", "light bouncing off a surface, like a mirror", "החזרה", "אור שמוחזר ממשטח, כמו ממראה"],
      ["Transparent", "letting light pass straight through, like clear glass", "שקוף", "מעביר אור ישר דרכו, כמו זכוכית צלולה"],
    ],
    q: [
      [["Which of these is NOT a light source?", "The Moon", ["The Sun", "A candle flame", "A torch"], "The Moon gives no light of its own; we see sunlight reflected from it."],
        ["מה מהבאים אינו מקור אור?", "הירח", ["השמש", "להבת נר", "פנס"], "לירח אין אור משלו; אנחנו רואים אור שמש שמוחזר ממנו."]],
      [["How do we see a book?", "Light bounces off the book into our eyes", ["Our eyes send out rays", "The book glows by itself", "Sound tells us where it is"], "Most objects are seen because they reflect light from a source into our eyes."],
        ["איך אנחנו רואים ספר?", "אור מוחזר מהספר אל העיניים שלנו", ["העיניים שולחות קרניים", "הספר זוהר בעצמו", "קול אומר לנו איפה הוא"], "את רוב העצמים אנחנו רואים כי הם מחזירים אור ממקור כלשהו אל העיניים."]],
    ],
  },
  i: {
    t: [
      ["Refraction", "the bending of light when it passes from one material into another", "שבירה", "סטייה של אור כשהוא עובר מחומר אחד לחומר אחר"],
      ["Spectrum", "the band of colours that white light splits into: red, orange, yellow, green, blue, indigo, violet", "ספקטרום", "פס הצבעים שאור לבן מתפצל אליו: אדום, כתום, צהוב, ירוק, כחול, אינדיגו, סגול"],
      ["Lens", "a curved piece of glass or plastic that bends light to focus it", "עדשה", "חתיכה מעוקלת של זכוכית או פלסטיק ששוברת את האור כדי למקד אותו"],
      ["Opaque", "not letting any light through, like wood", "אטום לאור", "לא מעביר אור בכלל, כמו עץ"],
    ],
    q: [
      [["A straw in a glass of water looks bent. Why?", "Light refracts as it passes from water into air", ["The water bends the straw", "Mirrors in the glass", "The straw melts slightly"], "Light changes direction at the water's surface, so the straw appears to be in a different place."],
        ["קש בכוס מים נראה שבור. למה?", "האור נשבר כשהוא עובר מהמים לאוויר", ["המים מכופפים את הקש", "יש מראות בכוס", "הקש נמס קצת"], "האור משנה כיוון בפני המים, ולכן הקש נראה כאילו הוא במקום אחר."]],
      [["What makes a rainbow?", "Sunlight refracting and reflecting inside raindrops", ["Colours painted on the clouds", "Light from the Moon", "Wind blowing through rain"], "Each raindrop acts like a prism, splitting white sunlight into its colours."],
        ["מה יוצר קשת בענן?", "אור שמש שנשבר ומוחזר בתוך טיפות גשם", ["צבעים שמצוירים על העננים", "אור מהירח", "רוח שנושבת בגשם"], "כל טיפת גשם פועלת כמו מנסרה ומפרקת את אור השמש הלבן לצבעיו."]],
    ],
  },
  a: {
    t: [
      ["Speed of light", "about 300,000 km per second in a vacuum", "מהירות האור", "בערך 300,000 ק״מ בשנייה בריק"],
      ["Wavelength", "the distance between two wave peaks; for light it decides the colour", "אורך גל", "המרחק בין שני שיאים של גל; באור הוא קובע את הצבע"],
      ["Total internal reflection", "light reflecting completely inside a material, used in optical fibres", "החזרה פנימית מלאה", "החזרה מלאה של אור בתוך חומר, שמשמשת בסיבים אופטיים"],
      ["Electromagnetic spectrum", "the full range of waves, from radio waves to gamma rays, with visible light in the middle", "הספקטרום האלקטרומגנטי", "כל טווח הגלים, מגלי רדיו ועד קרני גמא, ובאמצעו האור הנראה"],
    ],
    q: [
      [["Why does a red apple look red?", "It reflects red light and absorbs the other colours", ["It absorbs red light", "It makes red light itself", "Red light passes through it"], "We see the colour that is reflected; the other colours of white light are absorbed."],
        ["למה תפוח אדום נראה אדום?", "הוא מחזיר אור אדום ובולע את שאר הצבעים", ["הוא בולע אור אדום", "הוא מייצר אור אדום בעצמו", "אור אדום עובר דרכו"], "אנחנו רואים את הצבע שמוחזר; שאר צבעי האור הלבן נבלעים."]],
      [["During a storm you see lightning before you hear thunder. Why?", "Light travels much faster than sound", ["Thunder happens later", "Eyes are closer to the sky", "Sound travels faster than light"], "Light arrives almost instantly; sound travels about 340 m per second, so it lags behind."],
        ["בסערה רואים את הברק לפני ששומעים את הרעם. למה?", "האור מהיר הרבה יותר מהקול", ["הרעם קורה מאוחר יותר", "העיניים קרובות יותר לשמיים", "הקול מהיר יותר מהאור"], "האור מגיע כמעט מיד; הקול נע כ־340 מטר בשנייה, ולכן מפגר מאחור."]],
      [["Which has a longer wavelength?", "Red light", ["Violet light", "Blue light", "They are all the same"], "In visible light, red has the longest wavelength (about 700 nm) and violet the shortest (about 400 nm)."],
        ["למה אורך גל ארוך יותר?", "לאור אדום", ["לאור סגול", "לאור כחול", "לכולם אותו אורך גל"], "באור הנראה, לאדום אורך הגל הארוך ביותר (כ־700 ננומטר) ולסגול הקצר ביותר (כ־400 ננומטר)."]],
    ],
  },
};
export default c;
