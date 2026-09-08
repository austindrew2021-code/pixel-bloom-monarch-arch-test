import { RECIPES } from "./recipes";
import type { Recipe } from "./types";
import type { CountryId } from "./i18n";
import { isBreakfast, isDessert } from "./diet";

/** Regional names, slang, abbreviations, and dish aliases that should still find a recipe. */
const SYNONYMS: Record<string, string[]> = {
  scoff: ["jiggs dinner", "boiled dinner", "newfoundland"],
  scoffin: ["jiggs dinner"],
  jiggs: ["jiggs dinner", "salt beef"],
  jigs: ["jiggs dinner"],
  "salt beef": ["jiggs dinner", "pea soup"],
  "salt meat": ["jiggs dinner"],
  "boiled dinner": ["jiggs dinner"],
  touton: ["toutons"],
  toutons: ["toutons"],
  brewis: ["fish and brewis"],
  "hard bread": ["fish and brewis"],
  "cod tongues": ["cod au gratin", "fish"],
  doughboy: ["pea soup with doughboys"],
  doughboys: ["pea soup with doughboys"],
  figgy: ["jiggs dinner"],
  bakeapple: ["newfoundland"],
  partridgeberry: ["newfoundland"],
  chk: ["chicken"],
  chix: ["chicken"],
  spud: ["potato", "shepherd's pie"],
  spuds: ["potato"],
  tatties: ["potato", "shepherd's pie"],
  mince: ["ground beef", "shepherd's pie", "cottage pie"],
  "ground beef": ["meatloaf", "chili", "shepherd's pie"],
  evoo: ["olive oil"],
  parm: ["parmesan"],
  mozz: ["mozzarella"],
  "s&p": ["salt", "pepper"],
  wocest: ["worcestershire"],
  worcester: ["worcestershire"],
  "cottage pie": ["shepherd's pie"],
  "shepards pie": ["shepherd's pie"],
  shepherds: ["shepherd's pie"],
  hotdish: ["tater tot hotdish", "tuna noodle casserole"],
  casserole: ["tuna noodle casserole", "chicken pot pie", "tater tot hotdish"],
  "pot pie": ["chicken pot pie"],
  strog: ["beef stroganoff"],
  "greek salad": ["horiatiki"],
  gyro: ["souvlaki"],
  gyros: ["souvlaki"],
  doner: ["halifax donair", "souvlaki"],
  kebab: ["souvlaki", "beef kofta"],
  souvlakia: ["souvlaki"],
  moussaka: ["moussaka"],
  musaka: ["moussaka"],
  spanakopitta: ["spanakopita"],
  "spinach pie": ["spanakopita"],
  cacio: ["cacio e pepe"],
  carbonara: ["carbonara"],
  puttanesca: ["puttanesca"],
  ossobuco: ["osso buco"],
  lasagna: ["lasagna bolognese"],
  lasagne: ["lasagna bolognese"],
  bolognese: ["lasagna bolognese"],
  ragu: ["lasagna bolognese"],
  "al pastor": ["tacos al pastor"],
  tikka: ["chicken tikka masala"],
  ctm: ["chicken tikka masala"],
  "butter chicken": ["chicken tikka masala"],
  chole: ["chana masala"],
  channa: ["chana masala"],
  "chickpea curry": ["chana masala", "chickpea coconut curry"],
  mapo: ["mapo tofu"],
  okonomi: ["okonomiyaki"],
  falafel: ["falafel pita"],
  taameya: ["falafel pita"],
  shakshouka: ["shakshuka"],
  "eggs in purgatory": ["shakshuka"],
  "coq au vin": ["coq au vin"],
  gravy: ["biscuits and sausage gravy", "poutine"],
  "sawmill": ["biscuits and sausage gravy"],
  jerk: ["jerk chicken"],
  "pad thai": ["pad thai"],
  phatthai: ["pad thai"],
  quiche: ["quiche lorraine"],
  "red beans": ["red beans and rice"],
  pastichio: ["pastitsio"],
  "greek lasagna": ["pastitsio"],
  rarebit: ["welsh rarebit"],
  "welsh rabbit": ["welsh rarebit"],
  meatloaf: ["classic meatloaf"],
  "meat loaf": ["classic meatloaf"],
  "pot roast": ["sunday pot roast"],
  fryup: ["shakshuka", "toutons", "biscuits and sausage gravy"],
  "fry-up": ["toutons"],
  "old school": ["old-school", "meatloaf", "tuna casserole", "shepherd's pie"],
  "old fashioned": ["old-school"],
  homestyle: ["old-school", "homestyle"],
  nan: ["naan", "chicken tikka masala"],
  pita: ["souvlaki", "falafel pita", "halifax donair"],
  "fish n chips": ["pan-fried cod", "cod au gratin"],
  "fish and chips": ["pan-fried cod", "cod au gratin"],
  bangers: ["bangers and mash"],
  "bangers and mash": ["bangers and mash"],
  "mac n cheese": ["stovetop mac and cheese"],
  macaroni: ["stovetop mac and cheese", "pastitsio"],
  "mac and cheese": ["stovetop mac and cheese"],
  gnoc: ["pesto gnocchi"],
  stirfry: ["ginger chicken stir-fry"],
  "stir fry": ["ginger chicken stir-fry"],
  curry: ["chickpea coconut curry", "chana masala", "chicken tikka masala", "thai green curry"],
  tacos: ["black bean tacos", "tacos al pastor"],
  soup: ["lentil soup", "pea soup", "minestrone", "french onion soup", "pho"],
  stew: ["classic beef stew", "jiggs dinner", "moose stew", "irish stew"],
  roast: ["lemon garlic roast chicken", "sunday pot roast", "coq au vin"],
  nl: ["newfoundland", "jiggs dinner", "toutons", "fish cakes"],
  newfoundland: ["jiggs dinner", "toutons", "fish and brewis", "cod au gratin", "fish cakes"],
  "the rock": ["newfoundland"],
  labrador: ["newfoundland"],
  maritimes: ["jiggs dinner", "fish and brewis", "hodge podge", "halifax donair"],
  bayman: ["newfoundland", "jiggs dinner"],
  townie: ["newfoundland"],
  scoffins: ["jiggs dinner"],
  toutin: ["toutons"],
  toltin: ["toutons"],
  "fish cakes": ["newfoundland fish cakes"],
  "cod cakes": ["newfoundland fish cakes"],
  "figgy duff": ["figgy duff"],
  duff: ["figgy duff"],
  scrunchions: ["toutons"],
  "pease pudding": ["jiggs dinner"],
  "mustard pickles": ["jiggs dinner"],
  donair: ["halifax donair", "mom-and-pop donair sauce", "greco-style donair sauce", "pizza delight donair sauce"],
  "donair sauce": ["mom-and-pop donair sauce", "greco-style donair sauce", "pizza delight donair sauce", "halifax donair"],
  greco: ["greco-style donair sauce", "halifax donair"],
  "pizza delight": ["pizza delight donair sauce", "donair pizza"],
  pd: ["pizza delight donair sauce"],
  "mom and pop": ["mom-and-pop donair sauce"],
  "garlic fingers": ["pizza delight donair sauce"],
  rapure: ["rappie pie"],
  râpure: ["rappie pie"],
  fricot: ["chicken fricot"],
  "poutine rapee": ["poutine râpée"],
  ployes: ["ployes"],
  fiddlehead: ["fiddleheads with garlic"],
  malpeque: ["malpeque mussels"],
  pei: ["pei scalloped potatoes", "malpeque mussels", "pei lobster supper"],
  "new brunswick": ["chicken fricot", "poutine râpée", "ployes", "pizza delight donair sauce"],
  "nova scotia": ["rappie pie", "nova scotia lobster roll", "blueberry grunt", "cape breton oatcakes", "halifax donair"],
  atlantic: ["jiggs dinner", "halifax donair", "chicken fricot", "malpeque mussels"],
  rub: ["memphis dry rub", "texas brisket rub", "montreal steak spice", "jerk dry rub", "cajun blackening rub"],
  "dry rub": ["memphis dry rub", "texas brisket rub"],
  chimichurri: ["chimichurri"],
  hollandaise: ["hollandaise"],
  tzatziki: ["tzatziki"],
  buffalo: ["buffalo sauce"],
  tartar: ["tartar sauce"],
  ranch: ["ranch dressing"],
  teriyaki: ["teriyaki sauce"],
  alabama: ["alabama white bbq chicken", "alabama white sauce"],
  texas: ["texas oven brisket", "texas brisket rub"],
  nashville: ["tennessee hot chicken"],
  philly: ["pennsylvania cheesesteak"],
  "new haven": ["connecticut white clam pizza"],
  locomo: ["hawaii loco moco"],
  "loco moco": ["hawaii loco moco"],
  "hodge podge": ["hodge podge"],
  hodgepodge: ["hodge podge"],
  moose: ["moose stew", "newfoundland"],
  poutine: ["poutine"],
  tourtiere: ["tourtière"],
  "tourtière": ["tourtière"],
  "meat pie": ["tourtière"],
  "toad in the hole": ["toad in the hole"],
  toad: ["toad in the hole"],
  colcannon: ["colcannon"],
  "irish stew": ["irish stew"],
  pierogi: ["pierogi"],
  pyrohy: ["pierogi"],
  vareniki: ["pierogi"],
  perogies: ["pierogi"],
  schnitzel: ["pork schnitzel"],
  wienerschnitzel: ["pork schnitzel"],
  paprikash: ["chicken paprikash"],
  "sloppy joe": ["sloppy joes"],
  "sloppy joes": ["sloppy joes"],
  dumplings: ["chicken and dumplings", "potstickers"],
  "chicken n dumplings": ["chicken and dumplings"],
  salisbury: ["salisbury steak"],
  "swedish meatballs": ["swedish meatballs"],
  goulash: ["hungarian goulash", "american goulash"],
  "chop suey": ["american goulash"],
  beefaroni: ["american goulash"],
  "chili mac": ["american goulash"],
  "scalloped potatoes": ["ham and scalloped potatoes"],
  "stuffed peppers": ["stuffed peppers"],
  "a la king": ["chicken à la king"],
  "cabbage rolls": ["cabbage rolls"],
  holubtsi: ["cabbage rolls"],
  "tuna melt": ["tuna melt"],
  hash: ["corned beef hash"],
  "fried chicken": ["buttermilk fried chicken"],
  gumbo: ["chicken and sausage gumbo"],
  jambalaya: ["jambalaya"],
  pho: ["phở bò"],
  "pho bo": ["phở bò"],
  "green curry": ["thai green curry"],
  "kung pao": ["kung pao chicken"],
  "gong bao": ["kung pao chicken"],
  gyoza: ["potstickers"],
  potstickers: ["potstickers"],
  bibimbap: ["bibimbap"],
  mujadara: ["mujadara"],
  kofta: ["beef kofta"],
  kefte: ["beef kofta"],
  paella: ["weeknight paella"],
  "spanish omelette": ["spanish tortilla"],
  "tortilla espanola": ["spanish tortilla"],
  ratatouille: ["ratatouille"],
  "french onion": ["french onion soup"],
  croque: ["croque monsieur"],
  "croque madame": ["croque monsieur"],
  avgolemono: ["avgolemono"],
  gemista: ["gemista"],
  yemista: ["gemista"],
  amatriciana: ["bucatini all’amatriciana"],
  "eggplant parm": ["eggplant parmesan"],
  parmigiana: ["eggplant parmesan"],
  pozole: ["pozole rojo"],
  posole: ["pozole rojo"],
  huevos: ["huevos rancheros"],
  rancheros: ["huevos rancheros"],
  "saag paneer": ["palak paneer"],
  palak: ["palak paneer"],
  dal: ["dal tadka"],
  daal: ["dal tadka"],
  "aloo gobi": ["aloo gobi"],
  "rice and peas": ["rice and peas"],
  italian: ["cacio e pepe", "carbonara", "puttanesca", "osso buco", "tomato basil pasta", "lasagna"],
  greek: ["moussaka", "souvlaki", "spanakopita", "horiatiki", "pastitsio", "greek chicken bowls"],
  mexican: ["black bean tacos", "tacos al pastor", "turkey taco skillet", "pozole", "huevos"],
  indian: ["chana masala", "chicken tikka masala", "chickpea coconut curry", "palak paneer", "dal"],
  chinese: ["mapo tofu", "ginger chicken stir-fry", "veggie fried rice", "kung pao chicken", "potstickers"],
  japanese: ["okonomiyaki", "sesame soba"],
  korean: ["bibimbap"],
  thai: ["pad thai", "thai green curry"],
  vietnamese: ["phở bò"],
  french: ["coq au vin", "quiche lorraine", "french onion soup", "ratatouille", "croque monsieur"],
  spanish: ["weeknight paella", "spanish tortilla"],
  caribbean: ["jerk chicken", "rice and peas"],
  cajun: ["red beans and rice", "gumbo", "jambalaya"],
  southern: ["pot likker", "burgoo", "spoon bread", "pecan pie", "hush puppies"],
  "pot likker": ["pot likker"],
  burgoo: ["kentucky burgoo"],
  "hush puppy": ["hush puppies"],
  "hush puppies": ["hush puppies"],
  "spoon bread": ["spoon bread"],
  "lady baltimore": ["lady baltimore cake"],
  "chess pie": ["chess pie"],
  "pecan pie": ["white house pecan pie", "pecan pie"],
  praline: ["new orleans pralines"],
  "shortnin": ["shortnin bread"],
  "shortening bread": ["shortnin bread"],
  "hopping john": ["hopping john"],
  "hoppin john": ["hopping john"],
  "smithfield": ["smithfield ham"],
  "mint julep": ["mint julep"],
  "fried chicken maryland": ["fried chicken maryland"],
  parsnips: ["parsnips and salt pork"],
  "salt pork": ["parsnips and salt pork", "pot likker"],
  british: ["toad in the hole", "bangers and mash", "welsh rarebit"],
  irish: ["irish stew", "colcannon"],
  canadian: ["poutine", "tourtière", "halifax donair"],
  polish: ["pierogi"],
  german: ["pork schnitzel"],
  hungarian: ["chicken paprikash"],
  pesto: ["basil pesto"],
  "salsa verde": ["salsa verde"],
  mole: ["weeknight mole"],
  "peri peri": ["peri-peri sauce"],
  periperi: ["peri-peri sauce"],
  harissa: ["harissa"],
  "nuoc cham": ["nuoc cham"],
  "yum yum": ["yum yum sauce"],
  aioli: ["garlic aioli"],
  bearnaise: ["béarnaise"],
  béarnaise: ["béarnaise"],
  "poutine gravy": ["poutine gravy"],
  gochujang: ["gochujang glaze"],
  zhug: ["zhug"],
  schug: ["zhug"],
  toum: ["toum"],
  ponzu: ["ponzu"],
  muhammara: ["muhammara"],
  mojo: ["mojo"],
  "come back": ["come-back sauce", "mississippi comeback shrimp"],
  marinara: ["marinara"],
  "cocktail sauce": ["cocktail sauce"],
  "honey mustard": ["honey mustard"],
  grunt: ["blueberry grunt"],
  nanaimo: ["nanaimo bars"],
  "butter tart": ["butter tarts"],
  "lava cake": ["molten chocolate cakes"],
  "molten": ["molten chocolate cakes"],
  tiramisu: ["tiramisu"],
  flan: ["vanilla flan"],
  churro: ["churros"],
  baklava: ["baklava"],
  "sticky rice": ["mango sticky rice"],
  chia: ["coconut chia pudding"],
  pancakes: ["blueberry pancakes"],
  "overnight oats": ["overnight oats"],
  porridge: ["steel-cut porridge"],
  "avo toast": ["avocado toast with jammy egg"],
  omelette: ["veggie omelette"],
  omelet: ["veggie omelette"],
  burrito: ["breakfast burrito"],
  "lox": ["smoked salmon bagel"],
  banhmi: ["pork banh mi"],
  "banh mi": ["pork banh mi"],
  laksa: ["chicken laksa"],
  tagine: ["lamb and apricot tagine", "chicken preserved-lemon tagine"],
  empanada: ["beef empanadas"],
  borscht: ["beet borscht"],
  arepa: ["cheese arepas"],
  "khao soi": ["khao soi"],
  "curry goat": ["jamaican curry goat"],
  bobotie: ["bobotie"],
  "soup dumplings": ["pork soup dumplings"],
  xiaolongbao: ["pork soup dumplings"],
  "instant pot": ["instant pot chicken and rice", "instant pot butter chicken", "instant pot chili", "instant pot yogurt"],
  "pressure cooker": ["instant pot chicken and rice"],
  "slow cooker": ["slow-cooker pot roast", "slow-cooker pulled pork", "slow-cooker chili"],
  crockpot: ["slow-cooker pot roast", "slow-cooker chili"],
  "sheet pan": ["sheet-pan lemon chicken", "sheet-pan salmon and broccoli", "sheet-pan sausage and peppers"],
  "air fryer": ["air-fryer chicken thighs", "air-fryer salmon", "air-fryer chicken wings"],
  cheesecake: ["new york cheesecake", "basque burnt cheesecake"],
  venison: ["venison stew", "venison medallions", "venison bean chili"],
  "gluten free": ["almond flour orange cake", "almond-crusted chicken", "quinoa tabbouleh"],
  vegan: ["lentil bolognese", "chickpea tikka masala", "west african peanut stew"],
  "sugar free": ["herb roasted chicken thighs", "sugar-free berry parfait", "dill baked salmon"],
  "dairy free": ["coconut lime chicken", "olive-oil roast salmon"],
  camping: ["campfire foil packets", "dutch-oven berry cobbler"],
  "grilled cheese": ["classic grilled cheese"],
  latkes: ["potato latkes"],
  "koshari": ["koshari"],
  "japchae": ["japchae"],
  "tteokbokki": ["tteokbokki"],
  elote: ["elote grilled corn"],
  "street corn": ["elote grilled corn"],
  cobb: ["cobb salad"],
  "funeral potatoes": ["funeral potatoes"],
  "pimento cheese": ["pimento cheese"],
  dumpcake: ["cherry pineapple dump cake"],
  "dump cake": ["cherry pineapple dump cake"],
  gyudon: ["gyudon beef bowl"],
  oyakodon: ["oyakodon"],
  tonkatsu: ["tonkatsu"],
  "miso soup": ["miso soup with tofu"],
  onigiri: ["onigiri rice balls"],
  yakitori: ["yakitori chicken skewers"],
  dessert: ["nanaimo bars", "blueberry grunt", "butter tarts"],
  "fannie farmer": ["parker house rolls", "boston brown bread", "fish chowder"],
  farmer: ["parker house rolls", "boston brown bread"],
  "white house": ["sirloin of beef", "white house cook book"],
  "abby fisher": ["jumberlie", "ochra gumbo", "sweet potato pie"],
  jumberlie: ["jumberlie a la creole", "jambalaya"],
  "maria gentile": ["risotto milanaise", "gnocchi"],
  "365 foreign": ["austrian goulasch", "east india fish"],
  wartime: ["cornmeal rolls", "spoon bread"],
  "pa dutch": ["chicken corn soup", "pepper cabbage"],
  picayune: ["pompano", "creole"],
  vintage: ["fannie farmer", "white house", "southern cook book"],

  breakfast: ["overnight oats", "blueberry pancakes", "avocado toast"],
  keto: ["cauliflower pizza", "zucchini lasagna", "bunless burger"],
  "low carb": ["cauliflower pizza", "taco lettuce cups", "no-bean chili"],
  "high protein": ["cottage pancakes", "turkey meatloaf", "shrimp and edamame"],
  birria: ["stovetop birria"],
  "carne asada": ["carne asada"],
  tinga: ["chicken tinga"],
  jollof: ["jollof rice"],
  shawarma: ["chicken shawarma plate"],
  hummus: ["hummus"],
  "baba ganoush": ["baba ganoush"],
  bulgogi: ["beef bulgogi"],
  "tom yum": ["tom yum goong"],
  "pad krapow": ["pad krapow gai"],
  "aglio olio": ["spaghetti aglio e olio"],
  piccata: ["chicken piccata"],
  marsala: ["chicken marsala"],
  "steak frites": ["steak frites"],
  reuben: ["reuben"],
  "po boy": ["shrimp po' boy"],
  muffuletta: ["muffuletta"],
  "french dip": ["french dip"],
  gazpacho: ["gazpacho"],
  "matzo ball": ["matzo ball soup"],
  ramen: ["miso ramen", "upgraded ramen"],
  quesadilla: ["chicken quesadillas", "black bean quesadillas"],
  "date night": ["pan-seared scallops", "filet with red wine shallots"],
};

function normalize(q: string): string {
  return q
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9+& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandQuery(q: string): string[] {
  const n = normalize(q);
  if (!n) return [];
  const terms = new Set<string>([n, ...n.split(" ").filter((w) => w.length > 1)]);
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    const kn = normalize(key);
    if (n.includes(kn) || kn.includes(n)) {
      for (const v of vals) terms.add(normalize(v));
    }
  }
  return [...terms];
}

export function recipeHaystack(recipe: Recipe): string {
  return normalize(
    [
      recipe.name,
      recipe.description,
      recipe.cuisine ?? "",
      ...(recipe.tags ?? []),
      ...(recipe.aliases ?? []),
      ...recipe.ingredients.map((i) => i.name),
    ].join(" "),
  );
}

export function searchRecipes(query: string, pool: Recipe[] = RECIPES): Recipe[] {
  const terms = expandQuery(query);
  if (terms.length === 0) return pool;
  const scored = pool
    .map((recipe) => {
      const hay = recipeHaystack(recipe);
      let score = 0;
      for (const t of terms) {
        if (hay.includes(t)) score += t.length > 3 ? 3 : 1;
        if (normalize(recipe.name).includes(t)) score += 5;
      }
      return { recipe, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.recipe);
}

function railKey(s: string): string {
  return s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function recipesByCuisine(cuisine: string, pool: Recipe[] = RECIPES): Recipe[] {
  const key = railKey(cuisine);
  const dashed = key.replace(/\s+/g, "-");
  if (key === "desserts" || key === "dessert") {
    return pool.filter(isDessert);
  }
  if (key === "breakfast") {
    return pool.filter(isBreakfast);
  }
  if (key === "atlantic") {
    return pool.filter((r) => {
      const c = railKey(r.cuisine ?? "");
      if (
        c === "newfoundland" ||
        c === "nova scotia" ||
        c === "new brunswick" ||
        c === "prince edward island"
      ) {
        return true;
      }
      return (r.tags ?? []).some((t) => {
        const tt = railKey(t);
        return (
          tt === "atlantic" ||
          tt === "newfoundland" ||
          tt === "nova scotia" ||
          tt === "new brunswick" ||
          tt === "pei" ||
          tt === "maritimes"
        );
      });
    });
  }
  if (key === "salads" || key === "salad") {
    return pool.filter((r) => r.plate === "green" || (r.tags ?? []).some((t) => railKey(t) === "salad"));
  }
  if (key === "grill") {
    return pool.filter((r) =>
      (r.tags ?? []).some((t) => ["grill", "bbq", "barbecue"].includes(railKey(t))),
    );
  }
  if (key === "instant pot") {
    return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "instant pot" || railKey(t) === "pressure cooker"));
  }
  if (key === "slow cooker") {
    return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "slow cooker" || railKey(t) === "crockpot"));
  }
  if (key === "sheet pan") {
    return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "sheet pan"));
  }
  if (key === "air fryer") {
    return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "air fryer"));
  }
  if (key === "camping") {
    return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "camping"));
  }
  if (key === "kid friendly" || key === "kid-friendly") {
    return pool.filter((r) => (r.tags ?? []).some((t) => railKey(t) === "kid friendly"));
  }
  if (key === "dairy free" || key === "dairy-free") {
    return pool.filter((r) => (r.tags ?? []).includes("dairy-free"));
  }
  return pool.filter((r) => {
    const c = railKey(r.cuisine ?? "");
    if (c === key || c.replace(/\s+/g, "-") === dashed) return true;
    return (r.tags ?? []).some((t) => {
      const tt = railKey(t);
      return tt === key || tt.replace(/\s+/g, "-") === dashed;
    });
  });
}

export const CATALOG_RAILS = [
  { id: "Breakfast", hint: "Oats, omelettes, toutons" },
  { id: "Desserts", hint: "Grunt, nanaimo, flan" },
  { id: "Old school", hint: "Meatloaf, hotdish, pot roast" },
  { id: "Atlantic", hint: "Jiggs, donair, fricot, PEI mussels" },
  { id: "Newfoundland", hint: "Jiggs, toutons, fish cakes" },
  { id: "Nova Scotia", hint: "Donair, rappie pie, grunt" },
  { id: "New Brunswick", hint: "Fricot, ployes, râpée" },
  { id: "Prince Edward Island", hint: "Mussels, potato, lobster" },
  { id: "USA", hint: "A dish from every state" },
  { id: "Southern", hint: "Burgoo, pot likker, Lady Baltimore" },
  { id: "Japanese", hint: "Miso, donburi, katsu" },
  { id: "Instant Pot", hint: "Under pressure, weeknights" },
  { id: "Slow cooker", hint: "Set it, walk away" },
  { id: "Sheet pan", hint: "One tray dinners" },
  { id: "Air fryer", hint: "Crisp, less oil" },
  { id: "Grill", hint: "Ribs, elote, smoked" },
  { id: "Holiday", hint: "Ham, cocoa, the roast" },
  { id: "Baking", hint: "Bread, cobbler, cookies" },
  { id: "Salads", hint: "Cobb to three-bean" },
  { id: "Cheesecake", hint: "New York to Basque" },
  { id: "Wild game", hint: "Venison, duck, trout" },
  { id: "Plant-based", hint: "Vegan plates that satisfy" },
  { id: "Gluten-free", hint: "No wheat, still dinner" },
  { id: "Sugar-free", hint: "No added sugar" },
  { id: "Vegetarian", hint: "No meat or fish" },
  { id: "Vegan", hint: "No animal products" },
  { id: "Dairy-free", hint: "No milk or cheese" },
  { id: "Pumpkin", hint: "Soup, bread, seeds" },
  { id: "Apple", hint: "Orchard pies and chops" },
  { id: "Hometown", hint: "Church basement classics" },
  { id: "Camping", hint: "Foil packs, dutch oven" },
  { id: "Kid-friendly", hint: "Nuggets, noodles, muffins" },
  { id: "Sauce", hint: "Donair, BBQ, chimichurri" },
  { id: "Dry rub", hint: "Memphis, Texas, jerk, Cajun" },
  { id: "Greek", hint: "Souvlaki, moussaka, gemista" },
  { id: "Italian", hint: "Nonna pasta to osso buco" },
  { id: "Mexican", hint: "Tacos, pozole, rancheros" },
  { id: "Indian", hint: "Tikka, dal, aloo gobi" },
  { id: "East Asian", hint: "Pho, mapo, bibimbap" },
  { id: "Middle Eastern", hint: "Falafel, shakshuka, kofta" },
  { id: "French", hint: "Onion soup, ratatouille" },
  { id: "Spanish", hint: "Paella, tortilla" },
  { id: "Caribbean", hint: "Jerk, rice and peas" },
  { id: "American", hint: "Fried chicken, gumbo" },
] as const;

const RAIL_PRIORITY: Record<CountryId, string[]> = {
  CA: ["Atlantic", "Newfoundland", "Nova Scotia", "New Brunswick", "Prince Edward Island", "Breakfast", "Desserts"],
  US: ["Southern", "USA", "American", "Holiday", "Instant Pot", "Old school", "Breakfast", "Desserts"],
  MX: ["Mexican", "Spanish", "Grill", "Breakfast", "Desserts"],
  GB: ["Old school", "Holiday", "Breakfast", "Desserts", "Caribbean"],
  FR: ["French", "Holiday", "Breakfast", "Desserts"],
  AU: ["Breakfast", "Desserts", "Grill", "Old school"],
};

export function railsForCountry(country: CountryId): (typeof CATALOG_RAILS)[number][] {
  const prefer = RAIL_PRIORITY[country] ?? [];
  const head: (typeof CATALOG_RAILS)[number][] = [];
  for (const id of prefer) {
    const rail = CATALOG_RAILS.find((r) => r.id === id);
    if (rail) head.push(rail);
  }
  const rest = CATALOG_RAILS.filter((r) => !prefer.includes(r.id));
  return [...head, ...rest];
}

