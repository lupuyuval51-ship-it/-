/** Ready-made notes that show every format the study engine understands (term: meaning, steps, Q/A, numbers, sentences). */
export const EXAMPLE_NOTES: Record<"he" | "en", { subject: string; notes: string }> = {
  he: {
    subject: "מחזור המים",
    notes: `אידוי: מים הופכים לאדים בגלל חום השמש.
עיבוי: אדי מים מתקררים והופכים לטיפות זעירות שיוצרות עננים.
משקעים: מים שיורדים מהעננים כגשם, שלג או ברד.
חלחול: מים שנספגים באדמה ומגיעים למי התהום.

שלבי מחזור המים:
1. השמש מחממת את מי הים.
2. המים מתאדים ועולים למעלה.
3. האדים מתקררים ויוצרים עננים.
4. המים יורדים כגשם וחוזרים לים.

ש: מה מניע את מחזור המים?
ת: האנרגיה של השמש.

כ־97 אחוז מהמים בכדור הארץ נמצאים באוקיינוסים.
עננים נוצרים כשאדי מים מתקררים בגובה.`,
  },
  en: {
    subject: "The water cycle",
    notes: `Evaporation: water turns into vapour because of the sun's heat.
Condensation: water vapour cools down and forms tiny droplets that make clouds.
Precipitation: water that falls from clouds as rain, snow or hail.
Infiltration: water that soaks into the ground and reaches groundwater.

Steps of the water cycle:
1. The sun heats the sea.
2. The water evaporates and rises.
3. The vapour cools and forms clouds.
4. The water falls as rain and returns to the sea.

Q: What powers the water cycle?
A: The energy of the sun.

About 97 percent of the water on Earth is in the oceans.
Clouds form when water vapour cools high in the air.`,
  },
};
