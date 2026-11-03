/** Chef only cooks, or explains this kitchen. Everything else gets a joke — no model call. */

const FOOD =
  /\b(recipe|recipes|cook|cooking|dinner|lunch|breakfast|brunch|meal|meals|ingredient|ingredients|dish|bake|baking|roast|pasta|soup|salad|chicken|beef|pork|fish|salmon|taco|stir[- ]?fry|vegetarian|vegan|allergy|allergies|leftover|leftovers|sauce|dessert|desserts|calorie|calories|kcal|protein|weeknight|cuisine|pantry|hungry|plate|plated|supper|snack|snack|rice|potato|noodle|stew|curry|breakfast|high protein|one pan|skillet|minutes?)\b/i;

const APP =
  /\b(spoonful|this app|the app|the kitchen app|barcode|scanner|scan a code|walkthrough|the tour|sign in|account|privacy|terms|disclaimer|subscription|kitchen table|kitchen\+|chef plate|extras|theme|themes|next gen|simple kitchen|fill cart|grocery|shop list|shopping list|snap|people tab|private chat|message|messages|chat|family seat|household|cupboard|how do i|how does|where do i|where is|what does|workout library|form clip|form clips|fuel|body sync|streak|pantry check|delete my account|support)\b/i;

const QUESTION =
  /[?]|\b(what|who|when|where|why|how|can you|could you|tell me|explain|define|write me|translate|calculate)\b/i;

const JOKES = [
  "I'm a chef, not an information toy. Ask me what to cook, or how this kitchen works.",
  "The only capital I keep is stock. Want a soup, or a tour of the app?",
  "I plate dinners. I don't do trivia, homework, or the news. Bring me a craving.",
  "If it isn't a recipe or a button in Spoonful, it's above my pay grade — and my pay grade is dinner.",
  "I can tell you how to scan a barcode or braise a chicken. The rest of the internet can tell you the other thing.",
  "Save that one for a search bar. I'm the person at the stove.",
];

export type ChefAskKind = "recipe" | "app" | "other";

export function classifyChefAsk(prompt: string): ChefAskKind {
  const s = prompt.trim();
  if (!s) return "other";
  const food = FOOD.test(s);
  const app = APP.test(s);
  if (food && app) {
    if (QUESTION.test(s) && /\b(app|spoonful|barcode|scan|walkthrough|extras|tab|button|account|subscription|theme|chat|pantry|cupboard|shop|snap|library)\b/i.test(s)) {
      return "app";
    }
    return "recipe";
  }
  if (food) return "recipe";
  if (app) return "app";
  if (QUESTION.test(s)) return "other";
  return "recipe";
}

export function chefJoke(prompt: string): string {
  let h = 0;
  for (const c of prompt) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return JOKES[h % JOKES.length]!;
}

const APP_HELP: { test: RegExp; text: string }[] = [
  {
    test: /barcode|scanner|scan a code|upc|ean/i,
    text: "Open Snap, then Scan a barcode. Point the camera at the bars in any store, or type the numbers underneath. Spoonful checks that code, the same code with a leading zero, and the food databases for Canada, the US, and the world. If the package has no calories listed, you can still save the name.",
  },
  {
    test: /walkthrough|the tour|replay/i,
    text: "Extras has Replay the walkthrough. It walks Plan, Cook, Recipes, Snap, the barcode, Shop, People, desserts, and — in Next Gen — Fuel and the form clips. Skip with the X when you already know the room.",
  },
  {
    test: /chat|message|people/i,
    text: "People is the table and the inbox. Sign in, claim a username, then Chat. Search a cook and message them, or start a group from people you follow. Only people in that chat can read it. It is laid out like the message apps you already use: an inbox, then a thread.",
  },
  {
    test: /shop|grocery|fill cart|cupboard|pantry/i,
    text: "Shop builds the list from dinner. Check a line when it is in the basket. Under What's in the cupboard, tap a staple you already own — it goes into the pantry and stays off the list. Tap it again when you run out and it comes back. Fill cart matches real products; cook, leftovers, and the list stay free.",
  },
  {
    test: /snap|fridge|photo/i,
    text: "Snap is for what you already ate or what is in the fridge. Type it, photograph the shelf, or scan a barcode. Saving stays on that screen.",
  },
  {
    test: /workout|library|form clip|gif|train|fuel|next gen|body sync/i,
    text: "Next Gen is the training side. Fuel is calories and protein left today. Train is the week. Open the exercise library and tap a move — the clip is that movement, not a still. Finish, skip, or miss a session and tonight's dinner can change to match.",
  },
  {
    test: /theme|look|aether|paper/i,
    text: "The look lives on Plan, next to Simple and Next Gen. Eighteen kitchens — paper, Aether, worlds, seasons. Watch this look sits you in the sky for that theme.",
  },
  {
    test: /price|subscription|kitchen table|kitchen\+|family|founder|gift|trainer|team|sos|plate|pay|billing|interac/i,
    text: "Dinner, recipes, cook, Snap, barcode, Fuel, and Shop stay free. Extras is where paid pieces live, and the price is on the card before you tap: Kitchen Table $7.99 a month or $69.99 a year, Kitchen+ $5.99, Family $4.99, founder $49 once, a gift table $7.99, trainer $19 a month, team kitchen $29, Weeknight SOS $2.99, plate packs $2.99 or $5.99. In this test kitchen, Interac is a memo you send yourself — nothing is charged by the button. On the App Store or Google Play, the store's billing is what renews until you cancel there.",
  },
  {
    test: /privacy|terms|health|disclaimer|account|delete|support|data/i,
    text: "Extras links Privacy, Terms, Health, Data, and Support. Those are the pages the App Store and Google Play ask for. Health numbers and recipes are estimates, not medical advice. Delete account is on Support; Clear this phone wipes the kitchen stored on the device.",
  },
  {
    test: /chef|recipe|cook/i,
    text: "I plan dinner from a craving — tonight or the week. Free kitchens get 3 chef plates a week from the library. Kitchen Table or Kitchen+ lets me invent a homemade plate that fits the goal, the allergies, and what's left to eat today. I won't answer trivia. Ask me for food, or how a button works.",
  },
];

export function localAppAnswer(question: string): string {
  for (const row of APP_HELP) {
    if (row.test.test(question)) return row.text;
  }
  return "I can plan a plate, or explain Spoonful. Snap scans any store barcode. Shop is the list and the cupboard. People is chat once you sign in. Next Gen plays the form clips. Extras holds prices, privacy, terms, and support. Ask about one of those, or tell me what you want to eat.";
}
