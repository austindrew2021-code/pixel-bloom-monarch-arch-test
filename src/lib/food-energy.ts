import type { Ingredient, Nutrition, Recipe } from "./types";

/**
 * Nutrition computed from the ingredient rows, rather than typed in by hand.
 *
 * Every figure in the catalog used to be a judgement call, and judgement calls
 * drift: a dish could gain half a pound of butter in a correction pass and keep
 * the calorie count it was given when it had two tablespoons. This module adds
 * the rows up instead.
 *
 * Three things it is deliberately careful about, because getting them wrong is
 * worse than not computing at all:
 *
 * - **A row it cannot identify is not zero.** `fromIngredients` reports what it
 *   failed to resolve, and the caller is expected to refuse the answer rather
 *   than ship a total that quietly left something out.
 * - **A frying bath is not eaten.** Two cups of lard in a doughnut pot is 3,800
 *   calories, and the doughnuts leave most of it behind. What they take up
 *   scales with the food, not with the pot: eight frog legs absorb the same oil
 *   whether they were fried in three cups or in six. So a fat row big enough to
 *   be a bath contributes `FRY_ABSORBED` of the weight of everything else in
 *   the recipe, never more than the bath itself holds.
 * - **Alcohol is not a macro.** Ethanol carries 7 kcal/g and shows up in none of
 *   protein, carbs or fat, so a julep computed from its macros alone reads as
 *   sugar water. Spirits and wines carry their energy directly.
 */
export type Per100 = { cal: number; protein: number; carbs: number; fat: number };

type Food = {
  /** Tested against the lower-cased, trimmed ingredient name. */
  match: RegExp;
  /**
   * Per 100 g of the thing the row names, as bought. A bone-in cut therefore
   * carries its bone: a 1.4 kg chicken is not 1.4 kg of meat, and costing it as
   * if it were put 95 g of protein into a serving of roast chicken for four.
   */
  per100: Per100;
  /** Grams in one cup. Sets the density used for every volume unit. */
  cupG?: number;
  /** Grams in one of whatever this food is counted in — one onion, one clove. */
  eachG?: number;
  /** Grams for specific count units, where a food is bought more than one way. */
  unitG?: Record<string, number>;
  /** `oz` means fluid ounces for this food, not weight. */
  liquid?: boolean;
  /** Fraction of the row that reaches the plate. Only used for frying media. */
  eaten?: number;
};

const P = (cal: number, protein: number, carbs: number, fat: number): Per100 => ({
  cal,
  protein,
  carbs,
  fat,
});

/** Oil a fried food takes up, as a share of the food's own weight. */
export const FRY_ABSORBED = 0.1;

/** A fat row at least this heavy *may* be a bath, if the method says so. */
const FRY_BATH_G = 190;

/**
 * Size alone does not make a fat a frying bath. Short'nin' bread is four cups
 * of flour and a POUND of butter, and reading that butter as a pot to fry in
 * took the shortbread down to four grams of fat a piece. So a bath is a large
 * fat row in a recipe that actually fries something — the pairing, not either
 * on its own. Matching on the word rather than on a phrase is deliberate: the
 * book says "in the 4 cups of lard or oil, deep and hot", and no list of
 * phrasings was ever going to cover that.
 */
const DEEP_FRY =
  /\bfr(?:y|ies|ied|ying)\b|deep (?:hot )?(?:fat|lard|oil)|pot of [\w ]{0,14}(?:fat|lard|oil)|kettle of [\w ]{0,14}(?:fat|lard|oil)|(?:boiling|very hot|smoking hot) (?:fat|lard|oil)/i;

/**
 * Two more things that are bought but not eaten, and both are large enough to
 * matter. Two cups of flour dredging fried chicken is 910 calories of which
 * most stays in the bowl, and two cups of buttermilk the bird soaked in gets
 * poured down the sink. Each is only discounted when the method says it is a
 * coat or a soak — flour dredged into stew meat thickens the gravy and is
 * eaten to the last spoonful.
 */
const DRY_COAT = /flour|corn ?meal|crumbs|panko|cornstarch|matzo meal|cracker dust/i;
const COATS = /dredge|dredging|dip(?:ped)? (?:each|the|them|it)|dipp?ed in|roll(?:ed)? in (?:the )?(?:flour|crumbs|meal)|coat(?:ed)? (?:in|with)|turn it through|press(?:ing)? (?:the )?crumbs|bread(?:ed|ing)\b/i;
/** Share of a dredge that actually clings to the food. */
export const COAT_ADHERES = 0.3;

const MARINADE = /buttermilk|^milk$|yogurt|yoghurt|wine|vinegar|soy sauce|tamari|brine/i;
const SOAKS = /marinat|soak|steep|brine|let stand in|refrigerate.{0,30}overnight/i;
/**
 * A soak only leaves its liquid behind if the cook takes the food out of it.
 * Without that the liquid *is* the dish: 365 Desserts soaks Irish moss an hour
 * in a quart of milk and then cooks the milk down into the blanc mange, and
 * reading that quart as a marinade threw away five sixths of the pudding —
 * 90 kcal a serving for something made of milk and sugar.
 */
const SOAK_DRAINED =
  /\bdrain|discard the (?:marinade|milk|buttermilk|brine|soaking (?:liquid|water))|(?:lift|take|remove) (?:it |them |the [\w-]+ )?(?:out of|from) the|shake off the|pat (?:it |them |the [\w-]+ )?dry|wipe (?:it|them|the [\w-]+) (?:well|dry)|dip (?:each|the) [\w-]+ in(?:to)?[^.]{0,30}?\b(?:flour|crumbs|corn ?meal|matzo meal|cracker dust)\b/i;
/** Share of a marinade that clings when the food is lifted out. */
export const MARINADE_CLINGS = 0.15;

/** Millilitres per volume unit. Density comes from the food's `cupG`. */
const ML: Record<string, number> = {
  tsp: 4.93,
  teaspoon: 4.93,
  teaspoons: 4.93,
  tbsp: 14.79,
  tablespoon: 14.79,
  tablespoons: 14.79,
  cup: 236.6,
  cups: 236.6,
  pint: 473.2,
  pints: 473.2,
  pt: 473.2,
  quart: 946.4,
  quarts: 946.4,
  qt: 946.4,
  gallon: 3785,
  ml: 1,
  l: 1000,
  litre: 1000,
  liter: 1000,
};

const WEIGHT_G: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  pounds: 453.6,
};

/**
 * Count units with a sensible generic weight, used when the food itself does not
 * say what one of them weighs. A food-specific `unitG` always wins.
 */
const COUNT_G: Record<string, number> = {
  pinch: 0.4,
  dash: 0.6,
  dashes: 0.6,
  drop: 0.05,
  drops: 0.05,
  sprig: 1,
  sprigs: 1,
  leaf: 0.5,
  leaves: 0.5,
  clove: 3,
  cloves: 3,
  bunch: 70,
  bunches: 70,
  stalk: 40,
  stalks: 40,
  slice: 28,
  slices: 28,
  can: 400,
  cans: 400,
  "large can": 800,
  jar: 340,
  "small jar": 230,
  bottle: 750,
  bottles: 750,
  packet: 30,
  packets: 30,
  pack: 200,
  packs: 200,
  bag: 200,
  bags: 200,
  box: 400,
  boxes: 400,
  handful: 30,
  piece: 40,
  pieces: 40,
  wineglass: 120,
  glass: 240,
  shot: 44,
  shots: 44,
  lump: 4,
  lumps: 4,
  cake: 17,
  cakes: 17,
  bar: 43,
  bars: 43,
  legs: 60,
  rack: 700,
  racks: 700,
  bird: 1400,
  birds: 1400,
  square: 28,
  squares: 28,
  scoop: 30,
  scoops: 30,
  sheet: 60,
  sheets: 60,
  round: 200,
  rounds: 200,
  dozen: 0,
  peck: 7500,
  strip: 10,
  branches: 2,
  pair: 2,
  pairs: 2,
};

/**
 * The composition table, per 100 g as eaten, ordered most specific first — the
 * first pattern that matches wins, so `sweet potatoes` must come before
 * `potato` and `coconut milk` before `milk`.
 */
const FOODS: readonly Food[] = [
  // A fish packed in oil is the fish. Listed here, before the fats, because
  // "2 cans tuna in olive oil" otherwise matched /olive oil/ and put seven
  // thousand calories of oil into a salade nicoise.
  { match: /\b(?:tuna|sardines?|anchov\w*|salmon|mackerel|kippers?|herring)\b.*\bin (?:olive |vegetable )?oil\b/, per100: P(186, 25, 0, 9), unitG: { can: 120, cans: 120, tin: 120, tins: 120 }, eachG: 120, cupG: 150 },
  // --- water and things with no energy ---------------------------------
  { match: /^(?:ice |boiling |cold |warm |hot |soda )?water$|^water,|^dashi$|^ice$|^cracked ice$|^shaved ice$/, per100: P(0, 0, 0, 0), cupG: 237 },
  // \bsalt\b sat 40 rules above the salt-pork entry and swallowed it, so every
  // salt pork, salt cod and salt beef row in the catalog weighed as pure salt:
  // nothing at all. Salt followed by a food noun is that food, not seasoning.
  { match: /\bsalt\b(?!\s*(?:pork|cod|fish|beef|meat|herring|mackerel))|^kosher salt$|^sea salt$|^celery salt$/, per100: P(0, 0, 0, 0), cupG: 292 },
  { match: /^(?:black |white |ground |coarse black )?pepper$|peppercorns/, per100: P(251, 10, 64, 3), cupG: 100 },
  { match: /bitters/, per100: P(200, 0, 0, 0), cupG: 230, liquid: true },
  { match: /food colou?ring|vegetable colou?ring/, per100: P(0, 0, 0, 0), cupG: 240 },

  // --- fats and oils ----------------------------------------------------
  { match: /oil for frying|frying fat|deep fat|^fat for frying$/, per100: P(884, 0, 0, 100), cupG: 218, eaten: FRY_ABSORBED },
  { match: /olive oil|sesame oil|neutral oil|vegetable oil|peanut oil|coconut oil|canola|^oil$|^oils$|chili oil/, per100: P(884, 0, 0, 100), cupG: 218 },
  // "dripping" is rendered fat and belongs here, not in the catch-all below:
  // a saucepan of beef dripping weighed as a generic 150 kcal row turned a
  // stewing fat into a starch.
  { match: /^lard\b|lard or oil|^shortening$|^suet$|^beef fat$|^chopped fat$|dripping(s)?$|bacon grease|bacon fat/, per100: P(898, 0, 0, 100), cupG: 205 },
  { match: /^butter$|^butter,|unsalted butter|salted butter|melted butter|butter for (?:frying|the pan)|^clarified butter$|^ghee$|buttered bread/, per100: P(717, 0.9, 0.1, 81), cupG: 227, unitG: { slice: 30, slices: 30, pat: 5 } },
  { match: /mayonnaise|^mayo$/, per100: P(680, 1, 0.6, 75), cupG: 220 },

  // --- dairy and eggs ---------------------------------------------------
  { match: /coconut milk|coconut cream/, per100: P(197, 2, 3, 21), cupG: 226 },
  { match: /evaporated milk/, per100: P(135, 7, 10, 7.6), cupG: 252 },
  { match: /condensed milk/, per100: P(321, 8, 54, 9), cupG: 306 },
  { match: /buttermilk|sour milk/, per100: P(40, 3.3, 4.8, 0.9), cupG: 245 },
  { match: /heavy cream|whipping cream|double cream|^cream, a day old$/, per100: P(340, 2.1, 2.8, 36), cupG: 238 },
  { match: /whipped cream/, per100: P(257, 3.2, 12.5, 22), cupG: 60 },
  { match: /sour cream/, per100: P(198, 2.4, 4.6, 19), cupG: 230 },
  { match: /table cream|thin cream|light cream|rich cream|^cream$|^cream,/, per100: P(195, 2.7, 4.2, 19), cupG: 240 },
  { match: /greek yogurt|plain yogurt|^yogurt$|^yoghurt$/, per100: P(73, 5, 6, 3), cupG: 245 },
  { match: /cream cheese/, per100: P(342, 6, 4.1, 34), cupG: 232 },
  { match: /cottage cheese/, per100: P(98, 11, 3.4, 4.3), cupG: 226 },
  { match: /ricotta/, per100: P(174, 11, 3, 13), cupG: 246 },
  { match: /parmesan|pecorino/, per100: P(392, 36, 3.2, 26), cupG: 90 },
  { match: /feta/, per100: P(264, 14, 4.1, 21), cupG: 150 },
  { match: /mozzarella/, per100: P(280, 22, 2.2, 17), cupG: 112 },
  { match: /cheddar|gruy|swiss cheese|jack cheese|sharp cheese/, per100: P(403, 25, 1.3, 33), cupG: 113 },
  { match: /grated cheese|^cheese$|cheese, grated|shredded cheese|soft mild cheese|mild cheese/, per100: P(390, 25, 2, 31), cupG: 100 },
  { match: /^milk$|whole milk|^milk,|rich milk|sweet milk|scalded milk|hot milk/, per100: P(61, 3.2, 4.8, 3.3), cupG: 244 },
  { match: /egg whites?|white of (?:an? )?eggs?|whites of/, per100: P(52, 10.9, 0.7, 0.2), cupG: 243, eachG: 33 },
  { match: /egg yolks?|yolks? of/, per100: P(322, 16, 3.6, 27), cupG: 243, eachG: 17 },
  { match: /hard[- ]cooked eggs?|hard[- ]boiled eggs?|^eggs?$|^eggs?,|whole eggs/, per100: P(143, 12.6, 0.7, 9.5), cupG: 243, eachG: 50 },

  // --- meat, poultry, fish ---------------------------------------------
  { match: /salt pork|^fat pork$|fat pork,/, per100: P(748, 5.1, 0, 81), cupG: 200 },
  { match: /^bacon$|sliced bacon|bacon,/, per100: P(541, 37, 1.4, 42), unitG: { slice: 18, slices: 18 }, eachG: 18 },
  { match: /smithfield ham|country ham|cured ham|^ham$|^ham,|raw ham|cooked ham|lean ham|ham steak|ham slice/, per100: P(134, 16.5, 1.1, 6.8), unitG: { slice: 250, slices: 250 }, eachG: 250 },
  { match: /chicken (?:thighs?|legs?|drumsticks?)/, per100: P(167, 21, 0, 9), eachG: 110 },
  { match: /chicken breasts?/, per100: P(165, 31, 0, 3.6), eachG: 175 },
  { match: /chicken livers?|^liver$|calf liver|beef liver/, per100: P(167, 24, 3, 6), eachG: 40 },
  { match: /chicken pieces|chicken quarters|chicken parts/, per100: P(137, 19, 0, 6.5), eachG: 120, unitG: { cup: 140, cups: 140 } },
  { match: /cooked chicken/, per100: P(190, 27, 0, 9), eachG: 500, unitG: { cup: 140, cups: 140 } },
  { match: /whole chicken|^fowl$|roasting chicken|boiled fowl|^chicken$|^chicken,/, per100: P(124, 17.5, 0, 5.9), eachG: 1400, unitG: { cup: 140, cups: 140, bird: 1400, birds: 1400 } },
  { match: /turkey breast|turkey (?:thighs?|legs?)|ground turkey/, per100: P(189, 28, 0, 8), eachG: 200, cupG: 140 },
  { match: /turkey slices|sliced turkey/, per100: P(189, 28, 0, 8), eachG: 30, unitG: { slice: 30, slices: 30 } },
  { match: /quail/, per100: P(115, 15, 0, 6), eachG: 130, unitG: { bird: 130, birds: 130 } },
  { match: /squab|partridge|pigeon/, per100: P(113, 17, 0, 5), eachG: 350, unitG: { bird: 350, birds: 350 } },
  { match: /pheasant|guinea/, per100: P(109, 14, 0, 5), eachG: 1000, unitG: { bird: 1000, birds: 1000 } },
  { match: /\bturkey\b|\bduck\b|\bgoose\b/, per100: P(113, 17, 0, 5), eachG: 1800, unitG: { bird: 1800, birds: 1800 } },
  { match: /ground (?:beef|chuck)|chopped beef|hamburger(?! buns)|ground beef and pork/, per100: P(250, 26, 0, 17), cupG: 225, eachG: 115 },
  { match: /short ribs|beef ribs|ribs of beef/, per100: P(150, 15.5, 0, 9.6), eachG: 120 },
  { match: /beef chuck|chuck roast|beef brisket|stew(?:ing)? beef|beef stew meat/, per100: P(250, 26, 0, 16), eachG: 900, cupG: 140 },
  { match: /rib roast|standing rib/, per100: P(155, 20, 0, 7.5), eachG: 1800 },
  { match: /beef tenderloin/, per100: P(206, 27, 0, 10), eachG: 1800 },
  { match: /sirloin|beef steak|^steak$|steaks$|tenderloin|flank|skirt steak|round steak|cutlets?$/, per100: P(206, 27, 0, 10), eachG: 220 },
  { match: /dried beef|chipped beef|smoked beef/, per100: P(153, 25, 4, 4), cupG: 140 },
  { match: /veal|^beef$|^beef,|cold diced meat|diced meat|^meat$/, per100: P(215, 26, 0, 12), eachG: 400, unitG: { cup: 140, cups: 140 } },
  { match: /veal bones|beef bones|^bones$|soup bones|ham hock|ham bone/, per100: P(60, 8, 0, 3), eachG: 400 },
  { match: /ground pork|pork sausage|breakfast sausage|italian sausage|^sausage|chorizo|andouille/, per100: P(297, 18, 2, 24), eachG: 60 },
  { match: /pork (?:\w+ )?chops?|pork cutlets?|pork steaks?/, per100: P(194, 22, 0, 11), eachG: 150 },
  { match: /spare ?ribs|baby back/, per100: P(154, 12, 0, 11.5), eachG: 700, unitG: { rack: 700, racks: 700 } },
  { match: /pork (?:shoulder|butt|loin|belly|roast|tenderloin)|^pork$|^pork,/, per100: P(242, 27, 0, 14), eachG: 900, cupG: 140 },
  { match: /lamb chops?|lamb cutlets?|lamb shanks?/, per100: P(206, 20, 0, 14), eachG: 120 },
  { match: /rack of lamb/, per100: P(258, 25, 0, 17), eachG: 700, unitG: { rack: 700, racks: 700 } },
  { match: /lamb|mutton/, per100: P(258, 25, 0, 17), eachG: 900, cupG: 140 },
  { match: /shrimps?|prawns?/, per100: P(99, 24, 0.2, 0.3), cupG: 145, eachG: 12 },
  { match: /oysters?/, per100: P(68, 7, 4, 2.5), eachG: 25, cupG: 248 },
  { match: /crab ?meat|^crab|lobster|scallops?|crayfish|terrapin|turtle meat|^turtle$/, per100: P(90, 19, 1, 1), cupG: 145, eachG: 500 },
  { match: /mussels|clams/, per100: P(86, 12, 3.7, 2.2), cupG: 150, eachG: 10 },
  { match: /salmon/, per100: P(208, 22, 0, 13), eachG: 170, unitG: { fillet: 170, fillets: 170 } },
  { match: /tuna/, per100: P(132, 28, 0, 1), cupG: 150, eachG: 120, unitG: { can: 120, cans: 120 } },
  { match: /sardines/, per100: P(208, 25, 0, 11), eachG: 120, unitG: { can: 92, cans: 92 } },
  { match: /anchov/, per100: P(210, 29, 0, 10), eachG: 4, unitG: { can: 45, cans: 45 } },
  { match: /fish fillets?|fillets? of|^fish$|^fish,|fish cakes|boiled fish|roe/, per100: P(129, 23, 0, 3.5), eachG: 180, unitG: { fillet: 170, fillets: 170 } },
  { match: /herring|mackerel|shad|pompano|flounder|sole|haddock|^cod|codfish|snapper|trout|bass|whitefish|white fish/, per100: P(71, 12.7, 0, 1.9), eachG: 400, unitG: { fillet: 170, fillets: 170 } },

  // --- grains, flours, breads, pasta -----------------------------------
  { match: /almond flour/, per100: P(571, 21, 21, 50), cupG: 96 },
  { match: /rice flour/, per100: P(366, 6, 80, 1.4), cupG: 158 },
  { match: /cake flour|pastry flour|sifted flour|all[- ]purpose flour|wheat flour|^flour$|^flour,|bread flour|self[- ]rising/, per100: P(364, 10, 76, 1), cupG: 125 },
  { match: /corn ?meal|corn ?flour|polenta|grits|hominy/, per100: P(370, 8, 79, 1.8), cupG: 160 },
  { match: /rolled oats|oatmeal|^oats$/, per100: P(389, 17, 66, 7), cupG: 90 },
  { match: /bread ?crumbs|cracker crumbs|graham crumbs|panko|^crumbs$|crumbs,|toasted crumbs|hard tack|pilot cracker/, per100: P(395, 13, 72, 5), cupG: 108, eachG: 12 },
  { match: /^crackers?$|saltines|water biscuits/, per100: P(430, 9, 72, 12), eachG: 4 },
  { match: /^toast$|toasted bread|white bread|sandwich bread|stale bread|sourdough|^bread$|^bread,|french bread|baguette|buns?$|rolls?$|pita|^loaf$/, per100: P(266, 9, 49, 3.3), unitG: { slice: 28, slices: 28, loaf: 450, round: 60, rounds: 60 }, eachG: 45 },
  { match: /corn tortillas?|flour tortillas?|tortillas?/, per100: P(237, 6, 45, 3), eachG: 28, unitG: { pack: 340, packs: 340 } },
  { match: /corn ?bread|hoe ?cake|johnny ?cake/, per100: P(307, 7, 47, 10), unitG: { pan: 900 }, eachG: 60 },
  { match: /lady ?fingers|macaroons/, per100: P(400, 8, 70, 10), eachG: 12 },
  { match: /spaghetti|macaroni|egg noodles|rice noodles|elbow pasta|^pasta$|penne|linguine|fettuccine|lasagne|noodles/, per100: P(371, 13, 75, 1.5), cupG: 100, eachG: 12 },
  { match: /cooked rice|arborio|long[- ]grain rice|short[- ]grain rice|basmati|jasmine rice|^rice$|^rice,|wild rice/, per100: P(360, 7, 79, 0.7), cupG: 185 },
  { match: /quinoa|couscous|bulgur|barley|farro/, per100: P(368, 14, 64, 6), cupG: 170 },
  { match: /pie crust|pie shell|pizza dough|pastry dough|puff pastry|phyllo|double crust|patty shell/, per100: P(450, 6, 43, 29), unitG: { round: 230, rounds: 230, sheet: 245, sheets: 245, "double crust": 460 }, eachG: 230 },
  { match: /tortilla chips|potato chips/, per100: P(536, 6, 53, 34), cupG: 30 },

  // --- sugars and sweeteners --------------------------------------------
  { match: /confectioners? sugar|powdered sugar|icing sugar|4x sugar/, per100: P(389, 0, 100, 0), cupG: 120, unitG: { lump: 4, lumps: 4 } },
  { match: /brown sugar|light brown sugar|demerara|muscovado/, per100: P(380, 0, 98, 0), cupG: 220 },
  { match: /^sugar$|^sugar,|white sugar|granulated sugar|cane sugar|sugar lumps|cinnamon sugar|palm sugar/, per100: P(387, 0, 100, 0), cupG: 200, unitG: { lump: 4, lumps: 4 }, eachG: 4 },
  { match: /molasses|treacle|sorghum|cane syrup/, per100: P(290, 0, 75, 0), cupG: 337 },
  { match: /maple syrup|corn syrup|gum syrup|golden syrup|^syrup$/, per100: P(300, 0, 78, 0), cupG: 320 },
  { match: /^honey$/, per100: P(304, 0.3, 82, 0), cupG: 340 },
  { match: /marmalade|^jelly$|^jelly,|firm jelly|currant jelly|^jam$|strawberry jam|preserves|apple butter/, per100: P(278, 0.4, 69, 0), cupG: 320, unitG: { glass: 240, "1 glass": 240 } },

  // --- chocolate, cocoa, leaveners, thickeners ---------------------------
  { match: /dark chocolate|semi ?sweet chocolate|chocolate chips|unsweetened chocolate|cooking chocolate|scraped chocolate|^chocolate$|^chocolate,/, per100: P(546, 5, 61, 31), cupG: 175, unitG: { square: 28, squares: 28 } },
  { match: /cocoa/, per100: P(228, 20, 58, 14), cupG: 86 },
  { match: /baking powder/, per100: P(53, 0, 28, 0), cupG: 220 },
  { match: /baking soda|^soda$|^soda,|saleratus/, per100: P(0, 0, 0, 0), cupG: 220 },
  { match: /cream of tartar/, per100: P(258, 0, 62, 0), cupG: 150 },
  { match: /cornstarch|corn ?flour thickening|arrowroot/, per100: P(381, 0.3, 91, 0), cupG: 128 },
  // Irish moss is dried carrageen seaweed. It sets a quart of milk from half
  // an ounce, so the food that matters in the dish is the milk, not this.
  { match: /irish moss|carrageen/, per100: P(49, 1.5, 12, 0.2), cupG: 20 },
  { match: /(?:lemon|lime|orange|cherry|strawberry|raspberry|flavou?red) gelatin|jell-?o/, per100: P(381, 7, 89, 0), unitG: { box: 85, boxes: 85, packet: 85, packets: 85 }, eachG: 85, cupG: 200 },
  { match: /gelatin/, per100: P(335, 86, 0, 0), cupG: 150, unitG: { packet: 7, packets: 7, box: 28, boxes: 28 } },
  { match: /^yeast$|compressed yeast/, per100: P(325, 40, 41, 7.6), cupG: 150, unitG: { packet: 7, packets: 7, cake: 17, cakes: 17 } },
  // Orange flower water is a distillate, not an extract in syrup: it carries
  // no sugar and no alcohol worth counting, so it sits above them.
  { match: /orange ?(?:flower|blossom) water/, per100: P(0, 0, 0, 0), cupG: 237, liquid: true },
  { match: /vanilla|almond extract|maple flavo|peppermint extract|lemon extract|rose ?water|^extract$/, per100: P(288, 0, 13, 0), cupG: 208 },

  // --- nuts and seeds ----------------------------------------------------
  { match: /peanut butter/, per100: P(588, 25, 20, 50), cupG: 258 },
  { match: /tahini/, per100: P(595, 17, 21, 54), cupG: 240 },
  { match: /pecans?|walnuts?|^nuts$|nut ?meats?|chopped nuts|mixed nuts|hazelnuts?|brazil nuts/, per100: P(691, 9, 14, 72), cupG: 110, eachG: 4 },
  { match: /almonds?/, per100: P(579, 21, 22, 50), cupG: 143, eachG: 1.2 },
  { match: /peanuts?|goobers?/, per100: P(567, 26, 16, 49), cupG: 146 },
  { match: /pine nuts|cashews|pistachio|macadamia/, per100: P(620, 16, 20, 57), cupG: 135 },
  { match: /shredded coconut|grated coconut|^coconut$|cocoanut|coconut flakes/, per100: P(660, 7, 24, 65), cupG: 80 },
  { match: /sesame seeds|chia seeds|pumpkin seeds|sunflower seeds|flax/, per100: P(573, 18, 23, 50), cupG: 144 },

  // --- legumes ------------------------------------------------------------
  { match: /black beans|kidney beans|white beans|cannellini|pinto|navy beans|butter beans|lima beans|^beans$|^beans,|red beans/, per100: P(127, 9, 23, 0.5), cupG: 180, unitG: { can: 250, cans: 250 } },
  { match: /chickpeas|garbanzo/, per100: P(164, 9, 27, 2.6), cupG: 164, unitG: { can: 250, cans: 250 } },
  { match: /lentils/, per100: P(116, 9, 20, 0.4), cupG: 198 },
  { match: /green beans|string beans|snap beans/, per100: P(31, 1.8, 7, 0.1), cupG: 125 },
  { match: /^peas$|frozen peas|green peas|split peas|black[- ]eyed peas|field peas/, per100: P(81, 5.4, 14, 0.4), cupG: 145 },
  { match: /extra[- ]firm tofu|^tofu$|tempeh/, per100: P(144, 17, 3, 9), cupG: 252 },
  { match: /bean sprouts/, per100: P(30, 3, 6, 0.2), cupG: 104 },

  // --- vegetables ----------------------------------------------------------
  { match: /sweet potato(?:es)?|yams?/, per100: P(86, 1.6, 20, 0.1), eachG: 180, cupG: 200 },
  { match: /mashed potato(?:es)?/, per100: P(88, 2, 17, 1.2), cupG: 210 },
  { match: /russet potato|yukon|new potato|potato(?:es)?|^potato$/, per100: P(77, 2, 17, 0.1), eachG: 175, cupG: 150 },
  { match: /green onions?|scallions?|spring onions?/, per100: P(32, 1.8, 7, 0.2), eachG: 15, cupG: 100 },
  { match: /red onion|white onion|yellow onion|^onions?$|^onions?,|sliced onion|chopped onion/, per100: P(40, 1.1, 9, 0.1), eachG: 150, cupG: 160 },
  { match: /onion juice/, per100: P(40, 1, 9, 0.1), cupG: 240 },
  { match: /shallots?/, per100: P(72, 2.5, 17, 0.1), eachG: 30, cupG: 160 },
  { match: /^garlic$|^garlic,|garlic cloves?|buds? of garlic/, per100: P(149, 6.4, 33, 0.5), eachG: 3, unitG: { head: 45, heads: 45, bud: 3, buds: 3, clove: 3, cloves: 3 } },
  { match: /garlic powder|onion powder/, per100: P(331, 17, 73, 0.7), cupG: 130 },
  { match: /leeks?/, per100: P(61, 1.5, 14, 0.3), eachG: 90 },
  { match: /celery/, per100: P(16, 0.7, 3, 0.2), unitG: { stalk: 40, stalks: 40, bunch: 340, head: 340 }, eachG: 40, cupG: 101 },
  { match: /carrots?/, per100: P(41, 0.9, 10, 0.2), eachG: 61, cupG: 128 },
  { match: /cherry tomatoes/, per100: P(18, 0.9, 3.9, 0.2), cupG: 149, eachG: 17 },
  { match: /sun[- ]dried tomatoes/, per100: P(258, 14, 56, 3), cupG: 54 },
  { match: /tomato (?:paste|puree|pulp)/, per100: P(82, 4.3, 19, 0.5), cupG: 262 },
  { match: /tomato sauce|marinara|passata|crushed tomatoes|canned tomatoes|ripe tomatoes|tomato(?:es)?/, per100: P(24, 1.2, 5, 0.2), eachG: 123, cupG: 245 },
  { match: /tomatillos?/, per100: P(32, 1, 5.8, 1), eachG: 34 },
  { match: /bell peppers?|green peppers?|red peppers?|sweet peppers?|yellow (?:sweet )?peppers?|pimien?to|green pepper/, per100: P(26, 1, 6, 0.2), eachG: 120, cupG: 150 },
  { match: /jalape|serrano|scotch bonnet|habanero|green chile|chiles?$|chili peppers?|hot peppers?|red chile/, per100: P(40, 1.9, 9, 0.4), eachG: 15, cupG: 90 },
  { match: /chipotle in adobo/, per100: P(94, 3, 17, 2), cupG: 240, eachG: 10 },
  { match: /mushrooms?|^mushroom$/, per100: P(22, 3.1, 3.3, 0.3), cupG: 70, eachG: 20 },
  { match: /^cabbage$|red cabbage|green cabbage|savoy/, per100: P(25, 1.3, 6, 0.1), unitG: { head: 900, heads: 900 }, eachG: 900, cupG: 89 },
  { match: /romaine|^lettuce$|lettuce leaves|iceberg/, per100: P(15, 1.4, 2.9, 0.2), unitG: { head: 300, heads: 300, leaf: 10, leaves: 10 }, eachG: 300, cupG: 47 },
  { match: /spinach|kale|arugula|collard|chard|mustard greens|turnip greens|^greens$/, per100: P(26, 2.9, 4, 0.4), cupG: 30, unitG: { bunch: 300, bunches: 300 } },
  { match: /broccoli|cauliflower/, per100: P(30, 2.6, 6, 0.3), cupG: 91, unitG: { head: 550, heads: 550 } },
  { match: /zucchini|summer squash|yellow squash/, per100: P(17, 1.2, 3.1, 0.3), eachG: 200, cupG: 124 },
  { match: /eggplant|aubergine/, per100: P(25, 1, 6, 0.2), eachG: 450, cupG: 82 },
  { match: /sub rolls?|hoagie|hero rolls?/, per100: P(270, 9, 50, 3.5), eachG: 85 },
  { match: /cucumbers?/, per100: P(15, 0.7, 3.6, 0.1), eachG: 300, cupG: 133 },
  { match: /^corn$|corn kernels|sweet ?corn|ears? of corn/, per100: P(86, 3.3, 19, 1.4), unitG: { ear: 90, ears: 90 }, eachG: 90, cupG: 154 },
  { match: /^okra$/, per100: P(33, 1.9, 7.5, 0.2), cupG: 100 },
  { match: /pumpkin puree|^pumpkin$|butternut|winter squash|acorn squash/, per100: P(26, 1, 6.5, 0.1), cupG: 245, eachG: 900 },
  { match: /beets?|beetroot|turnips?|parsnips?|rutabaga|radish/, per100: P(43, 1.6, 10, 0.2), eachG: 100, cupG: 136 },
  { match: /artichokes?/, per100: P(47, 3.3, 11, 0.2), eachG: 300 },
  { match: /asparagus/, per100: P(20, 2.2, 3.9, 0.1), cupG: 134, unitG: { bunch: 450, bunches: 450 } },
  { match: /avocados?|alligator pears?/, per100: P(160, 2, 9, 15), eachG: 150, cupG: 230 },
  { match: /olives?|kalamata/, per100: P(115, 0.8, 6, 11), eachG: 4, cupG: 135 },
  { match: /capers/, per100: P(23, 2.4, 5, 0.9), cupG: 140 },
  { match: /dill pickles?|sour pickles?|sweet pickles?|^pickles?$|gherkin/, per100: P(30, 0.6, 6, 0.2), eachG: 65, cupG: 143 },
  { match: /^salsa$|pico de gallo/, per100: P(36, 1.5, 7, 0.2), cupG: 240 },

  // --- fruit ---------------------------------------------------------------
  { match: /lemon juice|lime juice/, per100: P(22, 0.4, 7, 0.2), cupG: 244 },
  { match: /orange juice/, per100: P(45, 0.7, 10, 0.2), cupG: 248 },
  { match: /pineapple juice|prune juice|apple cider|grape juice|cider$/, per100: P(53, 0.3, 13, 0.1), cupG: 248 },
  { match: /grapefruit juice/, per100: P(39, 0.5, 9, 0.1), cupG: 247 },
  { match: /^lemons?$|^lemons?,|^limes?$/, per100: P(29, 1.1, 9, 0.3), eachG: 60, unitG: { slice: 10, slices: 10 } },
  { match: /^oranges?$|^oranges?,|orange rind|orange peel|grated rind/, per100: P(47, 0.9, 12, 0.1), eachG: 140, unitG: { slice: 25, slices: 25 } },
  { match: /grapefruits?/, per100: P(42, 0.8, 11, 0.1), eachG: 300 },
  { match: /apples?$|apples?,|apple balls/, per100: P(52, 0.3, 14, 0.2), eachG: 180, cupG: 125 },
  { match: /^pears?$|^pears?,/, per100: P(57, 0.4, 15, 0.1), eachG: 180, cupG: 140 },
  { match: /bananas?/, per100: P(89, 1.1, 23, 0.3), eachG: 120 },
  { match: /peaches?|nectarines?/, per100: P(39, 0.9, 10, 0.3), eachG: 150, cupG: 154 },
  { match: /strawberr|raspberr|blackberr|blueberr|^berries$|mixed berries|cranberr/, per100: P(43, 0.9, 10, 0.4), cupG: 144 },
  { match: /pineapple slices|sliced pineapple|pineapple rings/, per100: P(50, 0.5, 13, 0.1), eachG: 84, unitG: { can: 567, cans: 567, slice: 84, slices: 84 }, cupG: 165 },
  { match: /pineapple/, per100: P(50, 0.5, 13, 0.1), eachG: 900, unitG: { slice: 84, slices: 84, can: 567, cans: 567 }, cupG: 165 },
  { match: /^grapes$/, per100: P(69, 0.7, 18, 0.2), eachG: 5, cupG: 151 },
  { match: /papayas?|mangoes?|melons?|cantaloupe|watermelon|honeydew|guavas?|kumquats?/, per100: P(43, 0.6, 11, 0.2), eachG: 500, cupG: 145 },
  { match: /rhubarb/, per100: P(21, 0.9, 4.5, 0.2), cupG: 122 },
  { match: /raisins|currants|sultanas/, per100: P(299, 3.1, 79, 0.5), cupG: 145 },
  { match: /prunes|dates|figs|dried apricots/, per100: P(277, 2.5, 74, 0.4), cupG: 174, eachG: 8 },
  { match: /citron|candied peel|crystallized|glace|cherries$|maraschino/, per100: P(320, 0.3, 82, 0.1), cupG: 180 },
  { match: /cinnamon drops|cinnamon candies/, per100: P(390, 0, 98, 0), cupG: 200 },

  // --- herbs, spices, aromatics --------------------------------------------
  { match: /fresh ginger|^ginger$|ground ginger|crystallized ginger/, per100: P(80, 1.8, 18, 0.8), cupG: 96, eachG: 30, unitG: { strip: 10 } },
  { match: /parsley|cilantro|basil|thai basil|^mint$|fresh mint|dill|chives|tarragon|watercress|^herbs$|lemongrass|makrut|curry leaves/, per100: P(36, 3, 6, 0.8), cupG: 60, unitG: { bunch: 60, bunches: 60, sprig: 1, sprigs: 1, spray: 1, sprays: 1, stalk: 15, stalks: 15 }, eachG: 2 },
  { match: /rosemary|thyme|sage|oregano|marjoram|savory|bay lea(?:f|ves)|dried mint|sassafras|fil[eé] powder|fresh herbs/, per100: P(100, 4, 20, 2), cupG: 40, unitG: { sprig: 1, sprigs: 1, leaf: 0.2, leaves: 0.2, bunch: 30 }, eachG: 0.2 },
  { match: /cumin|coriander|paprika|smoked paprika|chili powder|curry powder|garam masala|turmeric|cayenne|allspice|nutmeg|mace|cardamom|cinnamon|cloves?|star anise|caraway|fennel seed|celery seed|mustard seed|poppy seed|juniper|saffron|old bay|five[- ]spice|za.atar|herbes|italian seasoning|poultry seasoning|pumpkin spice|mixed spices?|chinese five/, per100: P(320, 12, 55, 12), cupG: 100, unitG: { stick: 2.6, sticks: 2.6, pinch: 0.4 }, eachG: 0.1 },
  { match: /red pepper flakes|crushed red pepper|chile flakes/, per100: P(318, 12, 57, 17), cupG: 90 },
  { match: /dry mustard|mustard powder/, per100: P(508, 26, 28, 36), cupG: 100 },
  { match: /dijon|^mustard$|prepared mustard|yellow mustard/, per100: P(66, 4, 6, 3.3), cupG: 249 },
  { match: /horseradish/, per100: P(48, 1.2, 11, 0.7), cupG: 240 },

  // --- condiments, sauces, stocks -------------------------------------------
  { match: /soy sauce|tamari|fish sauce|worcestershire|a-?1 sauce|tabasco|hot sauce|maggi/, per100: P(60, 6, 6, 0), cupG: 255 },
  { match: /white sauce|cream sauce|b[eé]chamel/, per100: P(120, 3.5, 8, 8), cupG: 245 },
  { match: /chili sauce|ketchup|barbecue sauce|cocktail sauce|steak sauce|sweet chili/, per100: P(110, 1.3, 26, 0.2), cupG: 245 },
  { match: /gochujang|miso|red curry paste|harissa|sambal|doubanjiang/, per100: P(190, 8, 27, 5), cupG: 260 },
  { match: /hoisin|oyster sauce|sriracha|teriyaki/, per100: P(180, 3, 38, 2), cupG: 260 },
  { match: /cream of mushroom soup|condensed soup/, per100: P(80, 1.6, 8, 5), cupG: 250, unitG: { can: 298, cans: 298 } },
  { match: /chicken (?:broth|stock)|beef (?:broth|stock)|vegetable (?:broth|stock)|soup stock|^broth$|^stock$|bone broth|fish stock|clam juice/, per100: P(6, 1, 0.4, 0.2), cupG: 240 },
  { match: /balsamic|rice vinegar|cider vinegar|apple cider vinegar|red wine vinegar|white vinegar|tarragon vinegar|malt vinegar|sour vinegar|weak vinegar|strong vinegar|wine vinegar|^vinegar$|^vinegar,/, per100: P(21, 0, 0.9, 0), cupG: 239 },
  { match: /^coffee$|black coffee|strong coffee|hot coffee|^tea$|black tea|brewed/, per100: P(1, 0.1, 0, 0), cupG: 237 },

  // --- alcohol: ethanol is 7 kcal/g and belongs in none of the macros --------
  { match: /absinthe|everclear|grain alcohol/, per100: P(400, 0, 0, 0), cupG: 220, liquid: true },
  { match: /bourbon|whisk(?:e)?y|^rye$|rye whiskey|^rum$|bacardi|jamaica rum|^gin$|vodka|tequila|brandy|cognac|calvados|^spirits?$|cachaca|^applejack$/, per100: P(231, 0, 0, 0), cupG: 222, liquid: true },
  { match: /anisette|triple sec|cointreau|curacao|amaretto|^liqueur|kahlua|benedictine/, per100: P(330, 0, 30, 0), cupG: 240, liquid: true },
  { match: /sherry|madeira|^port$|marsala|vermouth|dubonnet|fortified/, per100: P(150, 0.2, 9, 0), cupG: 236, liquid: true },
  { match: /champagne|prosecco|sparkling wine/, per100: P(76, 0.1, 1.6, 0), cupG: 236, liquid: true },
  { match: /red wine|white wine|claret|sauterne|riesling|chardonnay|^wine$|^wine,|cooking wine|mirin|sake|shaoxing/, per100: P(83, 0.1, 2.7, 0), cupG: 236, liquid: true },
  { match: /^beer$|ale$|stout|lager|^cider$/, per100: P(43, 0.5, 3.6, 0), cupG: 236, liquid: true },
  { match: /sparkling water|charged water|club soda|seltzer|tonic/, per100: P(0, 0, 0, 0), cupG: 237, liquid: true },

  // --- odds and ends ---------------------------------------------------------
  { match: /^cornflakes|cereal|granola/, per100: P(380, 8, 84, 1.5), cupG: 30 },
  { match: /^ice cream$/, per100: P(207, 3.5, 24, 11), cupG: 132 },
  { match: /whey|protein powder/, per100: P(400, 80, 8, 5), cupG: 120, unitG: { scoop: 30, scoops: 30 } },
  // --- second tier: the long tail the first pass could not place --------------
  // Small countable things first: the broad patterns below would otherwise
  // claim them and hand back the weight of a joint instead of a sausage.
  { match: /frog legs?/, per100: P(73, 16, 0, 0.3), eachG: 35 },
  { match: /hot dogs?|frankfurters?|wieners?/, per100: P(290, 11, 4, 26), eachG: 45 },
  { match: /pepperoni sticks?/, per100: P(504, 20, 5, 45), eachG: 28 },
  { match: /popcorn/, per100: P(387, 13, 78, 4), cupG: 8 },
  { match: /foil|parchment|cedar plank|wood chips|toothpicks?|skewers?|butcher.s twine|cheesecloth|waxed paper|string$/, per100: P(0, 0, 0, 0), eachG: 0, cupG: 0 },
  { match: /espresso|coffee grounds|finely ground coffee|loose tea|matcha/, per100: P(2, 0.2, 0, 0), cupG: 237, eachG: 5 },
  { match: /nutritional yeast/, per100: P(325, 45, 36, 6), cupG: 60 },
  { match: /kimchi|sauerkraut|giardiniera|pepperoncini|preserved lemon|umeboshi|grape leaves/, per100: P(25, 1.3, 5, 0.4), cupG: 150, eachG: 20 },
  { match: /gochugaru|berbere|baharat|aleppo|sumac|za.tar|amchur|fenugreek|sichuan pepper|annatto|achiote|dried lime|dried guajillo|chili flakes?|chile flakes?|taco seasoning|cajun seasoning|ranch seasoning|everything seasoning|onion soup mix|old bay|peri-?peri|liquid smoke|custard powder|toasted rice powder|powdered ginger|corn starch/, per100: P(300, 11, 55, 8), cupG: 100, eachG: 1 },
  { match: /nori|wakame|kombu|seaweed/, per100: P(35, 6, 5, 0.3), cupG: 20, unitG: { sheet: 3, sheets: 3 }, eachG: 3 },
  { match: /firm tofu|soft tofu|silken tofu/, per100: P(120, 13, 3, 7), cupG: 250 },
  { match: /provolone|blue cheese|goat cheese|halloumi|paneer|mascarpone|american cheese|cheese curds|queso fresco|cotija|emmental|string cheese|farmer cheese|pot cheese|labneh/, per100: P(350, 21, 3, 28), cupG: 110, unitG: { slice: 21, slices: 21 }, eachG: 21 },
  { match: /crema|whipped topping|oat milk|plant milk|soy milk|almond milk/, per100: P(120, 2, 8, 9), cupG: 240 },
  { match: /cream of chicken soup|tomato soup|beef or veg gravy|brown sauce|russian dressing|french dressing|ranch dressing|thousand island|tonkatsu sauce|okonomi(?:yaki)? sauce|salsa verde|salsa roja|mole paste|sofrito|ssamjang|doenjang|laksa paste|khao soi paste|massaman paste|panang paste|green curry paste|yellow curry paste|japanese curry roux|chili garlic sauce|bbq sauce|relish$|mustard pickle juice|apple sauce|applesauce|peri|hummus|refried beans|baked beans|pork and beans|mincemeat/, per100: P(140, 3, 18, 6), cupG: 250, unitG: { can: 400, cans: 400 } },
  { match: /steel[- ]cut oats|graham flour|chickpea flour|coconut flour|masa harina|rye meal|matzo meal|white flour|glutinous rice|medium[- ]grain rice|sushi rice|day[- ]old rice|boiled rice|wheat berries|pearl tapioca/, per100: P(365, 10, 74, 2), cupG: 150 },
  { match: /orzo|ditalini|bucatini|ziti|pappardelle|tagliatelle|vermicelli|acini|small pasta|short pasta|lasagn[ae] noodles|no-boil lasagna|cheese tortellini|meat ravioli|gnocchi|instant ramen|lentil pasta|dumpling wrappers|wonton wrappers|spring roll wrappers|empanada discs/, per100: P(360, 13, 72, 2), cupG: 100, eachG: 12 },
  { match: /country bread|crusty bread|rye bread|hard bread|english muffins?|bagels?|ciabatta|croutons|panettone|french loaves|unsliced white loaves|round italian loaf|white toast|wraps$|rice cakes|corn tostadas|pretzels|popcorn/, per100: P(270, 9, 50, 3.5), unitG: { slice: 30, slices: 30, loaf: 450 }, eachG: 60 },
  { match: /graham crackers|gingersnaps?|chocolate sandwich cookies|cookie crumbs|gingersnap crumbs|coconut cookie crumbs|chocolate cookie crumbs|common crackers|cracker dust|pound cake|yellow cake mix|biscuit mix|tart shells|pastry shell|pie pastry|rich pastry|marshmallows|mini marshmallows/, per100: P(440, 5, 70, 16), cupG: 100, eachG: 14 },
  { match: /chicken (?:wings|tenders)|ground chicken|stewing chicken|frying chicken|broiling chicken|young chicken|rotisserie chicken|cooked shredded chicken|roasted chicken bones|^chickens$|schmaltz|chicken fat/, per100: P(200, 26, 0, 11), eachG: 1400, cupG: 140 },
  { match: /baby back ribs|roast pork|pork cutlets|pork fat|bony pork|guanciale|pancetta|prosciutto|salami|pepperoni|bratwurst|hot dogs|spam|smoked ham|city ham|ground ham|cracklings|pork rinds|pork p[aâ]t[eé]|chitterlings|ham broth|meat broth|lean soup meat|soup bone|ham bone/, per100: P(300, 20, 2, 24), eachG: 250, cupG: 140, unitG: { slice: 25, slices: 25 } },
  { match: /cubed steak|minute steak/, per100: P(230, 26, 0, 13), eachG: 170 },
  { match: /ribeye|filet mignon|beef roast|beef round|salt beef|beef shank|roast beef|corned beef|lean beef|thinly sliced beef|ground bison|elk|venison|wild boar|goat meat|rabbit|opossum|oxtail|sweetbreads|calves. liver|suckling pig|frog legs|fat hen|cooked tongue/, per100: P(230, 26, 0, 13), eachG: 400, cupG: 140 },
  { match: /meatballs/, per100: P(250, 18, 8, 16), eachG: 30, cupG: 200 },
  { match: /lump crab|imitation crab|salted cod|salt cod|salt fish|carp|pike|branzino|shiitake|cooked fish/, per100: P(110, 20, 1, 2), eachG: 180, cupG: 145 },
  { match: /bamboo shoots|daikon|fennel|poblano|nopales|bok choy|napa cabbage|snap peas|edamame|brussels sprouts|burdock|water chestnuts|salsify|squash$|egg ?plant|young okra|okra pods|pearl onions|butter lettuce|leaf lettuce|mixed greens|fris[eé]e|escarole|roasted vegetables|mixed vegetables|leftover vegetables|frozen corn|canned corn|green corn|fresh corn pulp|drained crushed corn|crushed canned corn|corn on the cob|wax beans|fava beans|dried beans|pea beans|dried peas|shelled edamame|frozen or canned peas|chopped pimento|diced pimentos|^pimento$|sugar pumpkin|green plantains|ripe plantains|canned ackee|fiddleheads|young jackfruit|mixed fruit/, per100: P(45, 2, 9, 0.4), eachG: 120, cupG: 140, unitG: { head: 500, heads: 500, ear: 90, ears: 90, can: 400, cans: 400 } },
  { match: /asian pear|key limes?|red grapes|apricots|mango|orange segments|apple juice|tomato juice|lemon zest|lime zest|lemon peel|grape jelly|apricot jam|tart jelly|cherry pie filling|mango puree/, per100: P(60, 0.6, 15, 0.2), eachG: 100, cupG: 240 },
  { match: /chestnuts|ground egusi|toasted sesame|unsweetened coconut|milk chocolate|dark rum/, per100: P(400, 8, 40, 25), cupG: 140 },
  { match: /frozen fries|frozen tater tots|hash browns|frozen hash browns|frozen pierogi|falafel/, per100: P(180, 3, 25, 8), cupG: 140, eachG: 17 },
  { match: /vegan mayo|chil[ei] oil|palm oil/, per100: P(700, 0.5, 2, 77), cupG: 220 },
  { match: /galangal|toor lentils|yellow lentils|barberries|amba/, per100: P(120, 6, 20, 1), cupG: 190, eachG: 20 },
  { match: /kefalotyri|oaxaca cheese/, per100: P(370, 25, 2, 30), cupG: 110 },
  { match: /moose|bison|giblets|liver sausage|figgy duff/, per100: P(220, 25, 2, 12), eachG: 400, cupG: 150 },
  { match: /pain de mie|cuban rolls|french rolls|hamburger buns/, per100: P(270, 9, 50, 3.5), eachG: 60 },
  { match: /cavolo nero|callaloo|kabocha|acorn squash|cooked mexican beans|black beans|red beans|fried onions|frozen peas|canned peas/, per100: P(70, 4, 12, 0.5), cupG: 160, eachG: 120 },
  { match: /trofie|lasagna noodles|no-?boil lasagna/, per100: P(360, 13, 72, 2), cupG: 100, eachG: 12 },
  { match: /century eggs/, per100: P(143, 13, 1, 10), eachG: 55 },
  { match: /redfish|snapper/, per100: P(129, 23, 0, 3.5), eachG: 180 },
  { match: /bacon lardons/, per100: P(541, 37, 1.4, 42), cupG: 140, eachG: 18 },
  { match: /pie dough/, per100: P(450, 6, 43, 29), eachG: 230, cupG: 200 },
  { match: /falafel/, per100: P(333, 13, 32, 18), eachG: 17, cupG: 150 },
  { match: /chinkiang|black vinegar|cane vinegar|dry wine|dark soy|rice syrup|niter|instant yeast|yeast cake|bread dough|poultry stuffing|bread stuffing|boiled custard|eggnog|dark table syrup|sour or raw milk|heavy sweet cream|cold milk|buttered crumbs|melted fat|fat for basting|butter or drippings|coarse black pepper|breadcrumb$/, per100: P(150, 4, 20, 6), cupG: 240, eachG: 20 },
];

const NAME_CACHE = new Map<string, Food | null>();

/** The composition row for an ingredient name, or null when nothing matches. */
/**
 * "butter or oil", "ale or beer", "cabbage or leftover greens" — the cook uses
 * one of them, and the first is the one the recipe means. Reading the whole
 * phrase matches nothing; reading the first half matches the food.
 */
function canonical(rawName: string): string[] {
  const bare = rawName
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  const halves = bare.split(/\s+or\s+/).map((h) => h.trim());
  // "kefalotyri or parmesan" names the cheese the writer reached for first and
  // the one the reader can actually buy; either resolves the row.
  return halves.length > 1 ? [...halves, bare] : [bare];
}

export function foodFor(rawName: string): Food | null {
  const key = rawName.trim().toLowerCase();
  const hit = NAME_CACHE.get(key);
  if (hit !== undefined) return hit;
  let found: Food | null = null;
  for (const candidate of canonical(rawName)) {
    found = FOODS.find((f) => f.match.test(candidate)) ?? null;
    if (found) break;
  }
  NAME_CACHE.set(key, found);
  return found;
}

/**
 * Grams for one ingredient row, or null when the unit cannot be read for this
 * food. Null is the honest answer: a row counted as zero silently shrinks the
 * whole recipe.
 */
export function gramsFor(row: Ingredient, food: Food): number | null {
  const unit = (row.unit ?? "").trim().toLowerCase();
  const qty = Number.isFinite(row.qty) ? row.qty : 0;
  if (qty <= 0) return 0;

  const perUnit = food.unitG?.[unit];
  if (perUnit !== undefined) return qty * perUnit;

  if (unit === "" || unit === "whole" || unit === "each" || unit === "small" || unit === "large" || unit === "medium") {
    // A size word is not a unit; it still means "this many of them".
    return food.eachG === undefined ? null : qty * food.eachG;
  }

  const ml = ML[unit];
  if (ml !== undefined) {
    const density = (food.cupG ?? 236.6) / 236.6;
    return qty * ml * density;
  }

  const g = WEIGHT_G[unit];
  if (g !== undefined) {
    // A spirit measured in "oz" is fluid ounces, not weight.
    if (food.liquid && (unit === "oz" || unit === "ounce" || unit === "ounces")) {
      return qty * 29.57 * ((food.cupG ?? 236.6) / 236.6);
    }
    return qty * g;
  }

  const count = COUNT_G[unit];
  if (count !== undefined) return qty * count;

  return food.eachG === undefined ? null : qty * food.eachG;
}

export type ComputedNutrition = {
  /** Per serving, rounded the way the catalog stores them. */
  nutrition: Nutrition;
  /** Ingredient rows whose food or unit could not be read. */
  unresolved: string[];
  /** Share of the recipe's identified grams that came from resolved rows. */
  resolvedMass: number;
  /** Grams of food per serving, before rounding — a sanity handle. */
  gramsPerServing: number;
};

const round = (n: number, step = 1) => Math.round(n / step) * step;

/**
 * Adds the rows up. Returns what it could not read alongside the total, so a
 * caller can decline to use a figure that is missing an ingredient.
 */
export function fromIngredients(recipe: Pick<Recipe, "ingredients" | "servings" | "steps">): ComputedNutrition {
  const servings = recipe.servings > 0 ? recipe.servings : 4;
  const unresolved: string[] = [];
  let cal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let resolvedG = 0;
  let unresolvedRows = 0;

  const method = (recipe.steps ?? []).join(" ");
  const deepFries = DEEP_FRY.test(method);
  const coats = COATS.test(method);
  const soaks = SOAKS.test(method) && SOAK_DRAINED.test(method);

  // First pass: weigh every row, and set the frying baths aside.
  type Weighed = { food: Food; grams: number };
  const eatenRows: Weighed[] = [];
  const baths: Weighed[] = [];
  for (const row of recipe.ingredients) {
    const food = foodFor(row.name);
    if (!food) {
      unresolved.push(row.name);
      unresolvedRows++;
      continue;
    }
    const grams = gramsFor(row, food);
    if (grams === null) {
      unresolved.push(`${row.name} (${row.qty} ${row.unit || "each"})`);
      unresolvedRows++;
      continue;
    }
    const isBath =
      food.eaten !== undefined || (deepFries && food.per100.fat >= 80 && grams >= FRY_BATH_G);
    if (isBath) {
      baths.push({ food, grams });
      resolvedG += grams;
      continue;
    }
    let share = 1;
    if (deepFries && coats && DRY_COAT.test(row.name)) share = COAT_ADHERES;
    else if (soaks && grams >= 180 && MARINADE.test(row.name)) share = MARINADE_CLINGS;
    eatenRows.push({ food, grams: grams * share });
    resolvedG += grams;
  }

  const add = ({ food, grams }: Weighed, share: number) => {
    const k = (grams * share) / 100;
    cal += food.per100.cal * k;
    protein += food.per100.protein * k;
    carbs += food.per100.carbs * k;
    fat += food.per100.fat * k;
  };

  for (const row of eatenRows) add(row, 1);

  // Second pass: the food takes up a tenth of its own weight in oil, spread
  // across however many fat rows the pot was filled from, and never more oil
  // than was actually there.
  const solidG = eatenRows.reduce((t, r) => t + r.grams, 0);
  const bathG = baths.reduce((t, r) => t + r.grams, 0);
  if (bathG > 0) {
    const absorbedG = Math.min(bathG, FRY_ABSORBED * solidG);
    for (const row of baths) add(row, (absorbedG * (row.grams / bathG)) / row.grams);
  }

  const totalRows = recipe.ingredients.length || 1;
  return {
    nutrition: {
      cal: round(cal / servings, 5),
      protein: round(protein / servings),
      carbs: round(carbs / servings),
      fat: round(fat / servings),
    },
    unresolved,
    resolvedMass: (totalRows - unresolvedRows) / totalRows,
    gramsPerServing: resolvedG / servings,
  };
}
