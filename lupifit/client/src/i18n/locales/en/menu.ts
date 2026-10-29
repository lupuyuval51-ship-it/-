/** Owned by the daily-menu feature. Hebrew (he/menu.ts) must have exactly the same keys. */
const menu = {
  title: 'Daily menu',
  subtitle: 'Ready dishes picked for your targets',
  back: 'Nutrition',
  teaser: {
    title: 'Today’s menu',
    body: { one: '{count} dish · about {kcal} kcal', other: '{count} dishes · about {kcal} kcal' },
    open: 'Open menu',
  },
  summary: {
    title: 'This menu',
    kcal: '{value} of {target} kcal',
    macros: 'Protein {protein} / {proteinTarget} g · Carbs {carbs} / {carbsTarget} g · Fat {fat} / {fatTarget} g',
    logAll: 'Log the whole day',
    logAllDone: 'Everything on this menu is logged',
  },
  notice: {
    estimate: 'Nutrition values are estimates for a typical serving.',
    filter: 'Diet and allergy filtering works from ingredient names only. Hidden ingredients (sauces, coatings, powders) can be missed, so always check the ingredients yourself.',
    allergyTitle: 'You listed allergies',
    allergyBody:
      'Dishes are hidden by ingredient names only, and no dish is guaranteed free of any allergen. Check every ingredient and label before eating.',
  },
  dish: {
    log: 'Log',
    logLabel: 'Log {name} to {meal}',
    logAgainLabel: 'Log {name} to {meal} again',
    logged: 'Logged',
    logAgain: 'Log again',
    another: 'Another dish',
    anotherLabel: 'Another dish for {meal}',
    ingredients: 'Ingredients',
    portion: 'Portion ×{scale}',
    listed: 'One listed serving: {kcal} kcal · P {protein} · C {carbs} · F {fat}',
    photo: 'Photo of {name}',
  },
  shopping: {
    open: 'Shopping list',
    title: 'Shopping list',
    intro: 'Ingredient names for the dishes on this menu. Amounts are not listed; see each dish’s ingredients.',
    dishes: { one: '{count} dish', other: '{count} dishes' },
    copy: 'Copy list',
    copied: 'List copied',
    copyFailed: 'Could not copy the list',
    empty: 'Nothing to buy: the menu is empty.',
  },
  empty: {
    noTargets: 'Complete your profile to get a menu for your targets',
    noTargetsBody: 'The menu needs your calorie and macro targets.',
    profile: 'Open profile',
    slot: 'No dish fits your preferences for {meal}. You can still log food yourself.',
    all: 'No dishes fit your diet, allergies and dislikes',
    allBody: 'Loosen a preference in your profile, or log food from the food log.',
  },
  tags: {
    hp: 'High protein',
    v: 'Vegetarian',
    vg: 'Vegan',
    q: 'Quick',
    k: 'Kids like it',
  },
  logNote: 'From the daily menu',
  logged: '{name} added to {meal}',
  loggedDay: { one: '{count} dish added to your log', other: '{count} dishes added to your log' },
  savedOffline: 'Saved on this device; it will sync when you are back online.',
};

export default menu;
