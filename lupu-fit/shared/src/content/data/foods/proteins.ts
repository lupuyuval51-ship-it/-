import type { FoodContent } from '../../types.js';

/* Meat, poultry, fish and seafood. Values per 100 g of the food as named (raw / cooked stated in the name). */

export const PROTEINS_FOODS: FoodContent[] = [
  /* ---------------------------------------------------------------- chicken */
  {
    id: 'chicken_breast_raw', nameHe: 'חזה עוף נא', nameEn: 'Chicken Breast, Raw', category: 'meat_poultry',
    kcal: 120, proteinG: 22.5, carbsG: 0, fatG: 2.6, fiberG: 0,
    servingG: 150, servingNameHe: 'חזה עוף בינוני', servingNameEn: '1 medium breast',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'chicken_breast_cooked', nameHe: 'חזה עוף מבושל', nameEn: 'Chicken Breast, Cooked', category: 'meat_poultry',
    kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0,
    servingG: 120, servingNameHe: 'חזה עוף בינוני', servingNameEn: '1 medium breast',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'chicken_thigh_cooked', nameHe: 'ירך עוף ללא עור מבושלת', nameEn: 'Chicken Thigh, Skinless, Cooked', category: 'meat_poultry',
    kcal: 209, proteinG: 26, carbsG: 0, fatG: 10.9, fiberG: 0,
    servingG: 100, servingNameHe: 'ירך עוף בינונית', servingNameEn: '1 medium thigh',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'chicken_ground_cooked', nameHe: 'עוף טחון מבושל', nameEn: 'Ground Chicken, Cooked', category: 'meat_poultry',
    kcal: 215, proteinG: 27.2, carbsG: 0, fatG: 11.1, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'chicken_schnitzel_plain_cooked', nameHe: 'שניצל עוף טבעי ללא ציפוי מבושל', nameEn: 'Chicken Cutlet, Plain Unbreaded, Cooked', category: 'meat_poultry',
    kcal: 170, proteinG: 30, carbsG: 0, fatG: 4.5, fiberG: 0,
    servingG: 110, servingNameHe: 'שניצל', servingNameEn: '1 cutlet',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'chicken_liver_cooked', nameHe: 'כבד עוף מבושל', nameEn: 'Chicken Liver, Cooked', category: 'meat_poultry',
    kcal: 167, proteinG: 24.5, carbsG: 0.9, fatG: 6.5, fiberG: 0,
    servingG: 80, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  /* ----------------------------------------------------------------- turkey */
  {
    id: 'turkey_breast_cooked', nameHe: 'חזה הודו מבושל', nameEn: 'Turkey Breast, Cooked', category: 'meat_poultry',
    kcal: 147, proteinG: 30, carbsG: 0, fatG: 2.1, fiberG: 0,
    servingG: 120, servingNameHe: 'פרוסה עבה', servingNameEn: '1 thick slice',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'turkey_ground_cooked', nameHe: 'הודו טחון מבושל', nameEn: 'Ground Turkey, Cooked', category: 'meat_poultry',
    kcal: 203, proteinG: 27.1, carbsG: 0, fatG: 10.4, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'turkey_deli_slices', nameHe: 'פסטרמת חזה הודו פרוסות', nameEn: 'Turkey Breast Deli Slices', category: 'meat_poultry',
    kcal: 105, proteinG: 17, carbsG: 3, fatG: 2, fiberG: 0,
    servingG: 40, servingNameHe: 'שתי פרוסות', servingNameEn: '2 slices',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher'], kosherClass: 'meat',
  },
  /* ------------------------------------------------------------------- beef */
  {
    id: 'beef_ground_lean_raw', nameHe: 'בקר טחון רזה נא', nameEn: 'Lean Ground Beef, 5% Fat, Raw', category: 'meat_poultry',
    kcal: 137, proteinG: 21.4, carbsG: 0, fatG: 5, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'beef_ground_lean_cooked', nameHe: 'בקר טחון רזה מבושל', nameEn: 'Lean Ground Beef, 10% Fat, Cooked', category: 'meat_poultry',
    kcal: 217, proteinG: 26.1, carbsG: 0, fatG: 11.8, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'beef_sirloin_cooked', nameHe: 'סינטה בקר צלויה', nameEn: 'Beef Sirloin, Grilled', category: 'meat_poultry',
    kcal: 183, proteinG: 29, carbsG: 0, fatG: 6.6, fiberG: 0,
    servingG: 150, servingNameHe: 'סטייק בינוני', servingNameEn: '1 medium steak',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'beef_flank_cooked', nameHe: 'פלנק בקר צלוי', nameEn: 'Beef Flank Steak, Grilled', category: 'meat_poultry',
    kcal: 192, proteinG: 27.8, carbsG: 0, fatG: 8, fiberG: 0,
    servingG: 150, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'beef_ribeye_cooked', nameHe: 'אנטריקוט בקר צלוי', nameEn: 'Beef Ribeye Steak, Grilled', category: 'meat_poultry',
    kcal: 291, proteinG: 24, carbsG: 0, fatG: 20.7, fiberG: 0,
    servingG: 200, servingNameHe: 'סטייק', servingNameEn: '1 steak',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'beef_liver_cooked', nameHe: 'כבד בקר מבושל', nameEn: 'Beef Liver, Cooked', category: 'meat_poultry',
    kcal: 175, proteinG: 26.5, carbsG: 4, fatG: 4.7, fiberG: 0,
    servingG: 80, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'kebab_ground_meat_grilled', nameHe: 'קבב בשר טחון על הגריל', nameEn: 'Kebab, Spiced Ground Meat, Grilled', category: 'meat_poultry',
    kcal: 250, proteinG: 19, carbsG: 3, fatG: 18, fiberG: 0.5,
    servingG: 80, servingNameHe: 'שיפוד קבב', servingNameEn: '1 skewer',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher'], kosherClass: 'meat',
  },
  /* ------------------------------------------------------- lamb, veal, pork */
  {
    id: 'lamb_leg_cooked', nameHe: 'שוק כבש צלוי', nameEn: 'Lamb Leg, Roasted', category: 'meat_poultry',
    kcal: 206, proteinG: 28.3, carbsG: 0, fatG: 9.7, fiberG: 0,
    servingG: 120, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'lamb_ground_cooked', nameHe: 'כבש טחון מבושל', nameEn: 'Ground Lamb, Cooked', category: 'meat_poultry',
    kcal: 283, proteinG: 25.6, carbsG: 0, fatG: 19.5, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'veal_cutlet_cooked', nameHe: 'שניצל עגל טבעי מבושל', nameEn: 'Veal Cutlet, Plain, Cooked', category: 'meat_poultry',
    kcal: 172, proteinG: 30.5, carbsG: 0, fatG: 4.6, fiberG: 0,
    servingG: 120, servingNameHe: 'שניצל', servingNameEn: '1 cutlet',
    allergens: [], diets: ['kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'meat',
  },
  {
    id: 'pork_ham_sliced', nameHe: 'חזיר מעושן פרוס', nameEn: 'Ham, Sliced', category: 'meat_poultry',
    kcal: 145, proteinG: 21, carbsG: 1.5, fatG: 5.5, fiberG: 0,
    servingG: 40, servingNameHe: 'שתי פרוסות', servingNameEn: '2 slices',
    allergens: [], diets: [], restrictionTags: ['no_shellfish', 'lactose_free'], kosherClass: 'meat',
  },
  {
    id: 'pork_bacon_cooked', nameHe: 'בייקון מטוגן', nameEn: 'Bacon, Cooked', category: 'meat_poultry',
    kcal: 541, proteinG: 37, carbsG: 1.4, fatG: 42, fiberG: 0,
    servingG: 24, servingNameHe: 'שלוש רצועות', servingNameEn: '3 strips',
    allergens: [], diets: [], restrictionTags: ['no_shellfish', 'lactose_free'], kosherClass: 'meat',
  },
  {
    id: 'pork_chop_cooked', nameHe: 'צלעות חזיר צלויות', nameEn: 'Pork Loin Chop, Cooked', category: 'meat_poultry',
    kcal: 231, proteinG: 25.7, carbsG: 0, fatG: 13.9, fiberG: 0,
    servingG: 150, servingNameHe: 'צלע', servingNameEn: '1 chop',
    allergens: [], diets: [], restrictionTags: ['no_shellfish', 'lactose_free', 'low_sodium'], kosherClass: 'meat',
  },
  /* ------------------------------------------------------------------- fish */
  {
    id: 'salmon_raw', nameHe: 'סלמון נא', nameEn: 'Salmon, Raw', category: 'fish_seafood',
    kcal: 208, proteinG: 20.4, carbsG: 0, fatG: 13.4, fiberG: 0,
    servingG: 150, servingNameHe: 'פילה סלמון', servingNameEn: '1 fillet',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'salmon_cooked', nameHe: 'סלמון אפוי', nameEn: 'Salmon, Baked', category: 'fish_seafood',
    kcal: 206, proteinG: 22.1, carbsG: 0, fatG: 12.4, fiberG: 0,
    servingG: 120, servingNameHe: 'פילה סלמון', servingNameEn: '1 fillet',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'tuna_fresh_cooked', nameHe: 'טונה טרייה צלויה', nameEn: 'Tuna, Fresh Yellowfin, Grilled', category: 'fish_seafood',
    kcal: 130, proteinG: 29.1, carbsG: 0, fatG: 0.6, fiberG: 0,
    servingG: 150, servingNameHe: 'סטייק טונה', servingNameEn: '1 steak',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'tuna_canned_water', nameHe: 'טונה משומרת במים מסוננת', nameEn: 'Canned Tuna in Water, Drained', category: 'fish_seafood',
    kcal: 116, proteinG: 25.5, carbsG: 0, fatG: 0.8, fiberG: 0,
    servingG: 80, servingNameHe: 'קופסה קטנה מסוננת', servingNameEn: '1 small can, drained',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher'], kosherClass: 'pareve',
  },
  {
    id: 'tuna_canned_oil', nameHe: 'טונה משומרת בשמן מסוננת', nameEn: 'Canned Tuna in Oil, Drained', category: 'fish_seafood',
    kcal: 198, proteinG: 29.1, carbsG: 0, fatG: 8.2, fiberG: 0,
    servingG: 80, servingNameHe: 'קופסה קטנה מסוננת', servingNameEn: '1 small can, drained',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher'], kosherClass: 'pareve',
  },
  {
    id: 'sardines_canned_oil', nameHe: 'סרדינים משומרים בשמן', nameEn: 'Canned Sardines in Oil, Drained', category: 'fish_seafood',
    kcal: 208, proteinG: 24.6, carbsG: 0, fatG: 11.5, fiberG: 0,
    servingG: 90, servingNameHe: 'קופסה', servingNameEn: '1 can',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher'], kosherClass: 'pareve',
  },
  {
    id: 'mackerel_cooked', nameHe: 'מקרל אפוי', nameEn: 'Atlantic Mackerel, Baked', category: 'fish_seafood',
    kcal: 262, proteinG: 23.9, carbsG: 0, fatG: 17.8, fiberG: 0,
    servingG: 120, servingNameHe: 'פילה מקרל', servingNameEn: '1 fillet',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'tilapia_cooked', nameHe: 'אמנון אפוי', nameEn: 'Tilapia, Baked', category: 'fish_seafood',
    kcal: 128, proteinG: 26.2, carbsG: 0, fatG: 2.7, fiberG: 0,
    servingG: 130, servingNameHe: 'פילה אמנון', servingNameEn: '1 fillet',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'cod_cooked', nameHe: 'פילה בקלה אפוי', nameEn: 'Cod, Baked', category: 'fish_seafood',
    kcal: 105, proteinG: 22.8, carbsG: 0, fatG: 0.9, fiberG: 0,
    servingG: 150, servingNameHe: 'פילה בקלה', servingNameEn: '1 fillet',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'sea_bream_cooked', nameHe: 'דניס צלוי', nameEn: 'Sea Bream, Grilled', category: 'fish_seafood',
    kcal: 130, proteinG: 24.5, carbsG: 0, fatG: 3.3, fiberG: 0,
    servingG: 150, servingNameHe: 'דג דניס, נתח אכיל', servingNameEn: '1 fish, edible portion',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'herring_pickled', nameHe: 'הרינג כבוש', nameEn: 'Herring, Pickled', category: 'fish_seafood',
    kcal: 262, proteinG: 14.2, carbsG: 9.6, fatG: 18, fiberG: 0,
    servingG: 50, servingNameHe: 'שני נתחים', servingNameEn: '2 pieces',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'lactose_free', 'kosher'], kosherClass: 'pareve',
  },
  {
    id: 'salmon_smoked', nameHe: 'סלמון מעושן', nameEn: 'Smoked Salmon', category: 'fish_seafood',
    kcal: 117, proteinG: 18.3, carbsG: 0, fatG: 4.3, fiberG: 0,
    servingG: 50, servingNameHe: 'שלוש פרוסות', servingNameEn: '3 slices',
    allergens: ['fish'], diets: ['pescatarian', 'kosher'], restrictionTags: ['no_pork', 'no_shellfish', 'halal', 'lactose_free', 'kosher'], kosherClass: 'pareve',
  },
  /* -------------------------------------------------------------- shellfish */
  {
    id: 'shrimp_cooked', nameHe: 'שרימפס מבושל', nameEn: 'Shrimp, Cooked', category: 'fish_seafood',
    kcal: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: ['shellfish'], diets: ['pescatarian'], restrictionTags: ['no_pork', 'lactose_free', 'low_sodium'], kosherClass: 'pareve',
  },
  {
    id: 'calamari_squid_cooked', nameHe: 'קלמרי מבושל', nameEn: 'Calamari (Squid), Steamed', category: 'fish_seafood',
    kcal: 105, proteinG: 17.8, carbsG: 3.5, fatG: 1.5, fiberG: 0,
    servingG: 100, servingNameHe: 'מנה', servingNameEn: '1 portion',
    allergens: ['shellfish'], diets: ['pescatarian'], restrictionTags: ['no_pork', 'lactose_free'], kosherClass: 'pareve',
  },
];
