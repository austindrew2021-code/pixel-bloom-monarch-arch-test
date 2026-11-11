/** Line's hand review of the four Nov 7 shields on fd5a4de7 (SHIELDS4_losses.json, md5 535013b8897865eaf6c12cd78dc9e416):
 * 207 recipes, 347 passes, each failed on the quoted printed text (first reason kept here). Kitchen ruling (Nov 7):
 * a bare "oil", "salad oil", "cooking oil" or unnamed frying fat is not read as olive oil; it fails soy. Recipes keep
 * their printed text. Generated from the JSON as is; only ever removes a pass. */
import type { Shield4Id } from "./shields4.ts";

export const SHIELD4_HANDREVIEW_FAIL: Readonly<Record<string, readonly Shield4Id[]>> = {
  "ac-0099": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "ac-egusi": ["egg", "sesame", "fish"], // step: "Greens, a little stock 15 minutes. Fufu or rice." — unprinted stock
  "ac-peri-chicken": ["egg", "soy", "sesame", "fish"], // row: "0.5 cup peri-peri sauce" — sauce row not wired to peri-peri-sauce (could be bought)
  "ac-shiro": ["soy"], // row: "0.25 cup oil" — unspecified oil/fat (possible soybean oil)
  "aloo-gobi": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ap-butter": ["soy", "sesame", "fish"], // step: "Blend smooth. Jar. Toast is the point." — served on toast
  "ar-fried-catfish": ["soy"], // row: "2 cups oil" — unspecified oil/fat (possible soybean oil)
  "bbbq-068": ["egg", "soy", "sesame", "fish"], // row: "1 spiced crabapple (if desired)" — bought spiced crabapple garnish (optional) — judgment call
  "bg-lentil-dal": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "bg-rice-beans": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "buttermilk-fried-chicken": ["soy"], // row: "4 cups oil for frying" — unspecified oil/fat (possible soybean oil)
  "carolina-vinegar-sauce": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "cb-plantain-mash": ["soy"], // row: "0.33 cup oil" — unspecified oil/fat (possible soybean oil)
  "cb-saltfish-ackee": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "cb-tostones": ["soy"], // row: "1.5 cups oil for frying" — unspecified oil/fat (possible soybean oil)
  "chana-masala": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "chickpea-curry": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "cn-salt-pepper-shrimp": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "cn-scallion-pancake": ["soy"], // row: "3 tbsp neutral oil" — unspecified oil/fat (possible soybean oil)
  "cp-bannock": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "cp-tuna-foil": ["soy"], // row: "2 cans tuna" — canned tuna (often packed with soy-containing vegetable broth)
  "cris-004": ["egg", "sesame", "fish"], // row: "1 White Wine Dressing" — xref cris-060 (Crisco Oil) fails all
  "cris-017": ["egg", "sesame"], // row: "1 Tarragon French Dressing" — xref cris-056 (Worcestershire) fails all
  "cris-029": ["sesame"], // row: "1 Green Goddess Salad Dressing" — xref cris-028 (mayonnaise, anchovy) fails all
  "cris-046": ["egg", "sesame", "fish"], // row: "1 Tomato Soup French Dressing" — xref cris-057 (condensed tomato soup, bought) fails all
  "dal-tadka": ["soy"], // row: "2 tbsp ghee or oil" — unspecified oil/fat (possible soybean oil)
  "donair-sauce-pizza-delight": ["egg", "soy", "sesame", "fish"], // step: "Chill. Pour over donair pizza, garlic fingers, or a pita." — served over pizza, garlic fingers or pita
  "ds-dec-31-carrot-pudding": ["egg", "soy", "sesame", "fish"], // row: "1 fairy butter" — unprinted fairy butter (traditionally egg yolk)
  "ds-feb-25-prune-pudding": ["soy", "sesame", "fish"], // step: "Have 1/4 of a box of gelatine soaked for 1/2 hour in 1/2 cup of cold water ; stand this over the fir...
  "ds-nov-28-white-jelly": ["soy", "sesame", "fish"], // step: "Serve with soft custard.—From Good Housekeeping." — unprinted soft custard
  "ds-sep-30-hedge-hog": ["soy", "sesame", "fish"], // row: "1 wine jelly" — unprinted wine jelly (bought or homemade)
  "fd-aug-30-irish-cucumber-salad": ["soy"], // row: "1 salad oil" — unspecified oil/fat (possible soybean oil)
  "fd-feb-04-russian-omelet": ["fish"], // row: "2 tbsp caviare" — fin fish/roe missed by fish regex
  "fd-jan-01-austrian-goulasch": ["soy"], // step: "Fry 1 dozen small peeled onions and 3 potatoes, cut into dice pieces; stir in 1 tablespoonful of flo...
  "fd-jul-03-turkish-stewed-lamb": ["soy"], // step: "Then fry thin slices of egg-plant and add to the stew." — frying/cooking fat not named
  "fr-steak-frites": ["soy"], // row: "4 cups oil for frying" — unspecified oil/fat (possible soybean oil)
  "gf-chia-jam": ["soy", "sesame", "fish"], // desc: "Mashed berries, chia, no pectin. Toast or yogurt." — served on toast (prior pass-2 gluten loss, same...
  "gf-chicken-soup": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "gf-tuna-avocado": ["soy"], // row: "2 cans tuna in olive oil" — canned tuna (often packed with soy-containing vegetable broth)
  "gf-turkey-meatballs": ["soy", "sesame", "fish"], // row: "2 cups marinara" — sauce row not wired to the marinara recipe (could be jarred)
  "greek-bowls": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "hd-cranberry-orange": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "hd-latkes": ["soy"], // row: "0.5 cup oil" — unspecified oil/fat (possible soybean oil)
  "hd-roast-goose": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "hill-0031": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "hill-0035": ["soy"], // row: "3 tablespoonfuls oil" — unspecified oil/fat (possible soybean oil)
  "hill-0037": ["soy"], // row: "6 tablespoonfuls oil" — unspecified oil/fat (possible soybean oil)
  "hill-0042": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0043": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "hill-0044": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0045": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0047": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0059": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0071": ["soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0080": ["egg", "soy", "sesame"], // step: "Garnish with sardine dressing." — unprinted sardine dressing
  "hill-0093": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "hill-0114": ["soy"], // row: "3 tablespoonfuls oil" — unspecified oil/fat (possible soybean oil)
  "hill-0133": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "hill-0138": ["soy", "sesame", "fish"], // row: "1 Sauce tartare" — hill-0020 Sauce Tartare (mayonnaise) fails all; not wired
  "hill-0140": ["soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0144": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0149": ["soy"], // row: "4 tablespoonfuls oil" — unspecified oil/fat (possible soybean oil)
  "hill-0151": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "hill-0153": ["soy"], // row: "3 tablespoonfuls oil" — unspecified oil/fat (possible soybean oil)
  "hill-0154": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0161": ["egg", "soy", "sesame", "fish"], // row: "1 french dressing" — xref to hill-0013 French Dressing (oil, prepared mustard) which fails all
  "hill-0197": ["soy", "sesame", "fish"], // step: "Pick the leaves from fresh cress, chop or break apart, season with French dressing, and proceed as a...
  "hill-0208": ["egg", "soy", "sesame", "fish"], // name: "Peanut Sandwiches" — sandwich bread not printed
  "hill-0379": ["egg", "soy", "sesame"], // row: "1 Chops, birds, venison, hamburg, sirloin and other steaks, even spring chickens" — vague row: hambur...
  "hill-0390": ["soy", "sesame", "fish"], // step: "Serve spread over sliced bananas, with cream and sugar, or with a cold boiled custard, previously ma...
  "hm-chicken-and-rice-soup": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "hm-church-chicken": ["soy"], // row: "3 cups lard or oil" — unspecified oil/fat (possible soybean oil)
  "hp-gyro-bowl": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0043": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0044": ["soy"], // row: "1 butter or oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0086": ["egg", "soy", "sesame"], // step: "Prepare according to directions given for Boiled Bass." — single-row recipe; unwired xref
  "htcf-0093": ["egg", "soy", "sesame"], // step: "Prepare according to directions given for Stuffed Sea-Bass." — single-row recipe; unwired xref (stuf...
  "htcf-0107": ["fish"], // row: "1 butterfish" — fin fish/roe missed by fish regex
  "htcf-0138": ["egg", "soy", "sesame"], // step: "Prepare according to directions given for Baked Codfish--I, adding a pint of parboiled oysters to th...
  "htcf-0205": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0207": ["soy", "sesame"], // step: "Serve with any preferred sauce." — "any preferred" sauce; batter + deep fat
  "htcf-0288": ["soy"], // step: "Roll up, fasten with toothpicks, and bake, fry, saute, or stew, as preferred." — frying/cooking fat ...
  "htcf-0392": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0435": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0453": ["soy", "sesame"], // step: "Serve with any preferred sauce." — "any preferred" sauce; batter + deep fat
  "htcf-0455": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0458": ["fish"], // row: "8 small kingfish" — fin fish/roe missed by fish regex
  "htcf-0469": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0472": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0518": ["soy"], // row: "2 tablespoonfuls oil" — unspecified oil/fat (possible soybean oil)
  "htcf-0525": ["fish"], // row: "1 mullets" — fin fish/roe missed by fish regex
  "htcf-0538": ["egg", "soy", "sesame"], // step: "Prepare according to directions given for Mullet a la Maitre d'Hotel." — single-row recipe; unwired ...
  "htcf-0570": ["soy", "sesame"], // step: "Prepare according to directions given for Carp a l'Allemande." — single-row recipe; unwired xref
  "htcf-0655": ["egg", "soy", "sesame"], // step: "Pour over a sauce made according to directions given in the recipe for Salmon a la Genoise, and serv...
  "htcf-0707": ["soy", "sesame"], // row: "1 patty-shells" — unwired xref to htcf-0706 (crumbs) + unprinted patty shells
  "htcf-0864": ["egg", "soy", "sesame"], // row: "2 tablespoonfuls anchovy essence" — bought multi-ingredient product
  "htcf-0973": ["egg", "soy", "sesame"], // step: "Prepare according to directions given for Fillets of Sale a la Joinville--II, adding to the sauce a ...
  "htcf-0987": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-1049": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "htcf-1086": ["fish"], // row: "1 whitebait" — fin fish/roe missed by fish regex
  "htcf-1173": ["soy", "sesame"], // step: "Prepare according to directions given above, adding chopped onion and garlic, and a little lemon-jui...
  "idah-030": ["soy"], // row: "4 tbsp cooking oil" — unspecified oil/fat (possible soybean oil)
  "in-chana-fast": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "in-injera-wat": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-black-beans": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-cabbage-rolls": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-cacciatore": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-carnitas": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-chana": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-chili": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-chili-verde": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-dal": ["soy"], // row: "2 tbsp ghee or oil" — unspecified oil/fat (possible soybean oil)
  "ip-pulao": ["soy"], // row: "2 tbsp ghee or oil" — unspecified oil/fat (possible soybean oil)
  "ip-rajma": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ip-refried": ["soy"], // row: "2 tbsp lard or oil" — unspecified oil/fat (possible soybean oil)
  "ip-tikka": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "kfyr-006": ["soy"], // row: "0.5 cups salad oil" — unspecified oil/fat (possible soybean oil)
  "kfyr-058": ["soy"], // row: "2 tsp salad oil" — unspecified oil/fat (possible soybean oil)
  "kfyr-098": ["soy"], // row: "0.3333 cups cooking oil or lard" — unspecified oil/fat (possible soybean oil)
  "kfyr-100": ["soy"], // row: "0.5 cups salad oil" — unspecified oil/fat (possible soybean oil)
  "kleber-0001": ["soy", "sesame", "fish"], // step: "Croutons may be served with this)." — croutons served
  "kleber-0016": ["soy"], // step: "Dip in the batter and fry to a golden brown." — frying/cooking fat not named
  "kleber-0019": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "kleber-0053": ["soy"], // step: "Fry in smoking fat until nicely browned, then drain on browned paper." — frying/cooking fat not named
  "kleber-0220": ["egg", "soy", "sesame", "fish"], // row: "1 cup cinnamon drops" — bought candy
  "km-038": ["soy"], // row: "0.333333 cups oil" — unspecified oil/fat (possible soybean oil)
  "km-039": ["soy"], // row: "1 cups oil" — unspecified oil/fat (possible soybean oil)
  "km-044": ["soy"], // row: "1 cups oil" — unspecified oil/fat (possible soybean oil)
  "km-049": ["soy"], // row: "1 cups oil" — unspecified oil/fat (possible soybean oil)
  "km-050": ["soy"], // row: "1 cups oil" — unspecified oil/fat (possible soybean oil)
  "km-052": ["soy"], // step: "Then into one of the three holes put the following: 1 teaspoon vanilla, 1 teaspoon vinegar, 6 tables...
  "km-084": ["soy"], // step: "Dip into batter and place in deep hot fat or oil until done." — frying/cooking fat not named
  "kt-pork-belly": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "md-chickpea-stew": ["soy", "sesame", "fish"], // desc: "Chickpeas, tomato, cumin, spinach. Bread." — served with bread (prior gluten loss, same quote)
  "md-grape-leaves": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "md-shish-tawook": ["egg", "soy", "sesame", "fish"], // step: "Grill until charred. Garlic sauce, pickles." — unprinted garlic sauce
  "ml-fesenjan": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ml-ghormeh": ["soy"], // step: "Brown beef. Fry chopped herbs until dark." — frying/cooking fat not named
  "ml-kibbeh": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ml-maqluba": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "ml-red-lentil-kofte": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "mp-chili-batch": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "mp-lentil-boxes": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "mx-chicken-mole-verde": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "mx-rajas": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "mx-refried-home": ["soy"], // row: "2 tbsp lard or oil" — unspecified oil/fat (possible soybean oil)
  "ok-chicken-fried-steak": ["soy"], // row: "1.5 cups neutral oil" — unspecified oil/fat (possible soybean oil)
  "op-tomato-rice": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "pk-bread": ["soy"], // row: "0.5 cup oil" — unspecified oil/fat (possible soybean oil)
  "pk-curry": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "pp-017": ["soy"], // row: "0.5 cups Oil" — unspecified oil/fat (possible soybean oil)
  "pta-047": ["soy", "sesame", "fish"], // step: "Serve with whipped cream or any desired frosting." — "any desired" frosting
  "pta-063": ["soy"], // step: "Cut with floured doughnut cutter and fry in deep fat (365-375 degrees)." — frying/cooking fat not named
  "pta-113": ["soy"], // row: "6 tbsp Wesson oil" — unspecified oil/fat (possible soybean oil)
  "pta-122": ["soy", "sesame"], // row: "1 Cold cooked meat" — unspecified cooked meat; vague row
  "pta-134": ["soy", "sesame", "fish"], // step: "Pour in baked pie shell." — unprinted (possibly bought) pie shell
  "pta-138": ["soy", "sesame", "fish"], // step: "Pour into pan lined with rich pastry." — unprinted pastry
  "pta-142": ["soy", "sesame", "fish"], // step: "Serve in baked pie shell and cover with whipped cream." — unprinted (possibly bought) pie shell
  "pulled-pork": ["egg", "soy", "sesame", "fish"], // desc: "Rub, roast, shred. Tacos, bowls, sandwiches." — served in tacos/sandwiches (bought tortillas/buns)
  "rice-and-peas": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sd-chislic": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sf-berry-parfait": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sf-turkey-chili": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sf-zucchini-fritters": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sl-three-bean": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "so-chess-pie": ["soy", "sesame", "fish"], // step: "Add the fruit and nuts and put in patty shells and bake in hot oven (400° F.) until fillings set and...
  "so-corn-fritters": ["soy"], // step: "Drop by spoonsful into hot deep fat and fry until well browned." — frying/cooking fat not named
  "so-doughnuts": ["soy"], // step: "Cover the board with flour and heat the fat for frying." — frying/cooking fat not named
  "so-dried-beef-maryland": ["soy", "sesame", "fish"], // step: "Cook 10 minutes and serve on crisp toast." — served on toast
  "so-liver-begue": ["soy"], // step: "Fry in deep fat (390° F.) 1 minute." — frying/cooking fat not named
  "so-shrimp-rice-croquettes": ["soy", "sesame", "fish"], // step: "Season with salt and pepper to taste, roll in shapes, dip in bread or cracker crumbs and egg." — bre...
  "so-spiced-cider": ["soy", "sesame", "fish"], // step: "Reheat, remove the whole spices and serve hot with cookies or cake." — served with cookies or cake
  "so-sweetbreads": ["soy", "sesame", "fish"], // step: "Cover with bread crumbs and dot with butter." — bread crumbs (bread)
  "sp-fajitas": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sp-lamb-meatballs": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "sweet-chili-sauce": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "toum": ["soy", "sesame", "fish"], // desc: "Lebanese garlic cloud. A lot of garlic, oil, lemon. Shawarma, roast chicken, bread." — served with s...
  "trp-009": ["soy"], // row: "1 oil" — unspecified oil/fat (possible soybean oil)
  "vg-chickpea-tikka": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "vg-dal-makhani": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "vh-gt-brodo": ["egg"], // step: "Cool and lift the fat, or serve the same day with pasta or rice." — served with pasta (egg)
  "vh-gt-cacciatora": ["soy", "sesame", "fish"], // step: "Serve with bread or polenta. This is the method for a bird that is not young." — served with bread
  "vh-jw-chopped-liver": ["soy", "sesame", "fish"], // step: "Chill the chopped liver. Serve it with rye bread." — served with rye bread
  "vh-jw-tzimmes": ["soy"], // row: "2 tbsp butter or oil" — unspecified oil/fat (possible soybean oil)
  "vh-kp-camp-coffee-stew": ["soy"], // step: "Brown the cubed beef in fat 8 minutes. Add the sliced onion. Cook 4 minutes." — frying/cooking fat n...
  "vh-kp-foil-potato": ["soy"], // step: "Scrub the potatoes. Prick them. Rub with a little fat and salt." — frying/cooking fat not named
  "vh-kp-mulligan": ["soy"], // step: "Dredge the beef in flour. Brown it in a little fat in the pot, 8 minutes." — frying/cooking fat not ...
  "vh-la-three-bean": ["soy"], // step: "Heat vinegar, sugar, ⅓ cup oil, salt, and pepper until the sugar dissolves. Cool." — frying/cooking ...
  "vh-pc-calas": ["soy"], // row: "2 cups oil for frying" — unspecified oil/fat (possible soybean oil)
  "vh-pc-grillades": ["soy"], // step: "Pound the steaks thin. Salt, pepper, and dredge in flour. Brown in fat 3 minutes a side. Take out." ...
  "vh-pc-shrimp-creole": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "vh-pd-scrapple": ["soy"], // row: "3 tbsp lard or oil" — unspecified oil/fat (possible soybean oil)
  "vh-va-brunswick": ["soy", "sesame", "fish"], // step: "Serve in bowls with bread. It is better the next day." — served with bread
  "vh-va-fried-catfish": ["soy"], // row: "1 cup lard or oil" — unspecified oil/fat (possible soybean oil)
  "vh-veg-lentil-stew": ["soy", "sesame", "fish"], // step: "Serve the lentil stew with bread. No meat is used." — served with bread
  "vh-wh-saratoga": ["soy"], // row: "4 cups lard or oil" — unspecified oil/fat (possible soybean oil)
  "vh-ww1-carrot-marmalade": ["soy", "sesame", "fish"], // step: "Cover the jars and keep them in the icebox. Spread the marmalade on bread or biscuits." — spread on ...
  "vh-ww2-succotash": ["soy", "sesame", "fish"], // step: "Serve hot as a side, or as a meatless plate with bread." — served with bread
  "vn-coconut-chickpea": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "vn-holiday-roast": ["soy"], // row: "2 tbsp oil" — unspecified oil/fat (possible soybean oil)
  "wg-goose-confit": ["soy"], // step: "Salt overnight. Wipe. Add the 6 cloves of garlic, the 6 sprigs of thyme, and a little fat." — frying...
  "wn-white-bean-skillet": ["soy", "sesame", "fish"], // desc: "Beans, garlic, kale, lemon. Bread." — served with bread (prior gluten loss, same quote)
  "ys-034": ["soy"], // step: "Cook in melted fat in double boiler or in heavy skillet over low heat, stirring frequently." — fryin...
  "ys-054": ["soy"], // row: "2 tbsp salad oil" — unspecified oil/fat (possible soybean oil)
  "ys-055": ["soy"], // row: "2 tbsp salad oil" — unspecified oil/fat (possible soybean oil)
  "ys-069": ["sesame", "fish"], // row: "1 Service Cake batter" — xref ys-116 (shortening, GOLD MEDAL) fails all
  "zaatar-rub": ["soy"], // desc: "Thyme, sesame, sumac. Oil a chicken or a tray of pita and dust generously." — frying/cooking fat not...
};
