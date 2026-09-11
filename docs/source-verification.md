# Verifying recipes against their source books

466 shipping recipes carry a `source` credit naming a public-domain book,
author, year and archive id. This is the record of reading each one against
the book it claims to come from.

## Where the text comes from

| Kind | Reliability | Books |
|---|---|---|
| Project Gutenberg `.txt` | **Human-proofread.** Trust the words. | Gentile 1919 |
| archive.org `_djvu.txt` | **Raw OCR. Trust nothing that is not a word.** | everything else |

Fetch the archive text from the **canonical** URL:

    https://archive.org/download/<archiveId>/<archiveId>_djvu.txt

Not from an `ia######.us.archive.org` mirror node — those truncate near
100 KB. The Southern Cook Book came back at 106 KB from a mirror and
206 KB from the canonical URL, and the missing half contained the recipes.

Then normalise the doubled OCR spacing before searching it:

    perl -pe 's/[ \t]+/ /g' book.txt > book.norm.txt

Our display names are modernised, but recipe **ids preserve the book's own
headings** (`so-delicious-appetizer` → "The Delicious Appetizer"), which is
what makes a recipe findable in the text.

## The rule about scans

A scan is evidence, not truth. This OCR is visibly damaged, and it is
damaged worst in exactly the place that matters most — the quantities:

    % pound freshly-sliced dried beef      l1/^ tablespoons onion juice
    ^4 cup grated stale bread crumbs       V± cup sugar
    1 ••> cup water                        Vz teaspoon vanilla

So, per recipe:

- **Words are reliable.** "a quart", "two heaping tablespoons", "half a
  dozen", "twelve strips", and all connected prose can be read straight off
  and used to correct ours.
- **A fraction glyph with a surviving digit is reliable.** `^4 cup` is a
  quarter cup; `l1/^ tablespoons` is one and a half.
- **A fraction glyph with no surviving digit is not readable.** `%` is
  equally consistent with ½ and ¾, and there is only one scan of this book
  in existence — every PDF of it in circulation is the same OCR, so a
  second opinion does not exist.

When a quantity is unreadable, **do not guess and do not silently keep
ours as though it were confirmed.** Leave the existing value alone and add
a row to the table below. A guess encoded into the catalog is worse than a
known gap, because it stops looking like a question.

Arithmetic that closes a gap is allowed, and gets recorded as such: the
Idle Hour cocktail lists `% gin`, `1/6 Italian vermouth`, `1/6 grapefruit
juice`, and 1 − 1/6 − 1/6 = 2/3, so the gin is two thirds whatever the
glyph looks like.

## Unreadable in the scan — needs a human against the page images

| Recipe | Field | Scan reads | Ours | Note |
|---|---|---|---|---|
| `so-delicious-appetizer` | dried beef | `% pound` | 0.5 lb | ½ or ¾; ours is unconfirmed either way |
| `vh-pc-pain-perdu` | eggs | `B Eggs.` | 6 | the digit is gone in both the download and the stream OCR; six is what a ½ cup of sugar and a family of six suggest, and it is a guess |
| `vh-ds-charlotte` | gelatine, water | `Cover % box of gelatine with ^ cup of cold water` | ¼ box, ¼ cup | both fraction glyphs lost their digits; ¼ box is one envelope, which is what a cup of milk and a pint of cream will take |
| `vh-ds-prune-whip` | gelatine | `Have ^ of a box of gelatine` | 1 tbsp | the glyph is gone; one tablespoon is about a quarter box |
| `vh-365-irish-stew` | milk | `}i cup of milk` | ¼ cup | glyph lost its digit; ¼ is what "a little flour" will take, but it could be ½ |
| `vh-365-borscht` | cinnamon, nutmeg | `some cinnamon and nutmeg` | ¼ tsp each | the book gives no quantity at all; ours is a working pinch |
| `vh-365-goulash` | beef | `Cut beef into small pieces` | 2 lb | the book names no weight for the meat |
| `vh-365-spanish-rice` | frying fat | `Fry 1 large chopped onion` | 2 tbsp butter | the book names no fat for the frying, only the spoonful stirred in at the end |
| `so-pigs-in-blankets` | salt | `% teaspoon` | 1 tsp | left as-is |
| `so-mint-tea` | water | `1 ••> cup` | 1 cup | possibly 1½ |
| `so-tomato-sauce` | allspice | `% teaspoon` | 0.25 tsp | glyph lost its digit; left as-is |
| `so-foaming-sauce` | sherry | `Vs cup` | ⅓ cup | ⅓ or ⅛; left as-is |
| `so-foaming-sauce` | boiling water | `% cup` | 0.5 cup | left as-is |
| `so-brandy-sauce` | water | `% cup` | 0.5 cup | left as-is |
| `so-brandy-sauce` | nutmeg | `% teaspoon` | 0.25 tsp | left as-is |
| `so-raisin-ham-sauce` | brown sugar | `% cup` | 0.5 cup | left as-is |
| `so-hollandaise-south` | melted butter | `% cup` | 0.5 cup | left as-is |
| `so-horseradish-sauce` | horseradish | `/& cup` | ⅓ cup | left as-is |
| `so-mayonnaise-south` | olive oil | `y% cup` | 0.5 cup | left as-is |
| `so-mayonnaise-south` | salt | `% teaspoon (scant)` | 0.25 tsp | left as-is |
| `so-french-dressing` | white pepper | `ys teaspoon` | a pinch | ⅛ or ⅓; left unquantified |
| `so-sour-cream-dressing` | vinegar | `ai cup` | 0.25 cup | left as-is |
| `so-richmond-dressing` | sour cream | `y% pint` | 0.5 pint | left as-is |
| `so-never-fail-icing` | cream of tartar | `% teaspoon` | 0.25 tsp | left as-is |
| `so-mocha-icing` | confectioner's sugar | `% cup` | 0.75 cup | book adds “more if needed” |
| `so-orange-icing` | orange | `% orange` | 0.5 | left as-is |
| `so-pralines` | cream | `y% cup` | 0.5 cup | left as-is |
| `so-pralines` | vanilla | `% teaspoon` | 0.5 tsp | left as-is |
| `so-coconut-pralines` | water | `y% cup` | 0.5 cup | left as-is |
| `so-caramels` | milk | `y% cup` | 0.5 cup | left as-is |
| `so-caramels` | scraped chocolate | `% cup` | 0.5 cup | left as-is |
| `so-pecan-fondant` | salt | `% teaspoon` | 0.25 tsp | left as-is |
| `so-pecan-fondant` | depth of dish | `MJ inch` | ½ inch | left as-is |
| `so-candied-peel` | sugar split | `2% cups` then `Vi cup` | not committed | 2½+½ and 2¾+¼ both total 3; the step says “most of” and “the sugar you held back” |
| `so-bouillabaisse` | water for the shrimp | `1% quarts` | not committed | step says “water to cover them well” |
| `so-bouillabaisse` | mushrooms | `Vi pound` | 0.5 lb | left as-is |
| `so-oyster-loaf` | cream | `y% cup` | 0.5 cup | left as-is |
| `so-lobster-newburg` | salt | `% teaspoon` | 0.25 tsp | left as-is |
| `so-pompano` | mushrooms | `% cup` | 0.5 cup | left as-is |
| `so-pompano` | sherry | `% cup` | 0.5 cup | left as-is; the book lists sherry but its method never places it, so ours puts it in the paste |
| `so-planked-shad` | melted butter | `% cup` | 0.5 cup | left as-is |
| `so-shrimps-caliente` | boiling time | `y^ hour` | not committed | step gives the doneness sign instead, and says the book's figure is unreadable |
| `so-shrimps-caliente` | salt | `MJ teaspoon` | 1 tsp | left as-is |
| `so-chesapeake-turtle` | nutmeg | `% grated nutmeg` | 0.25 tsp | left as-is; the book also lists 1/2 cup butter its method never uses |
| `vh-wh-floating-island` | the whole recipe | page 339 absent from the OCR | left as-is | indexed but not in the scanned text; unverified |
| `so-shrimp-pea-salad` | diced celery | `y% cup` | 0.5 cup | left as-is |
| `so-grapefruit-ring` | orange juice | `MJ cup` | 0.5 cup | left as-is |
| `so-grapefruit-ring` | gelatin soak water | `% cup` | 0.5 cup | matches the listed ½ cup cold water |
| `so-guspachy` | A-1 sauce | `% teaspoon` | 0.25 tsp | left as-is |
| `so-apple-chutney` | vinegar | `% cup` | 0.75 cup | left as-is |
| `so-apple-chutney` | ground cloves | `Vs teaspoon` | 0.25 tsp | left as-is |
| `so-india-relish` | sweet peppers | `% dozen` | 6 | left as-is |
| `so-india-relish` | celery seed / allspice / cloves | `% ounce` each | 0.5 oz | left as-is |
| `so-india-relish` | cinnamon | `% teaspoon` | 0.25 tsp | left as-is |
| `so-cole-slaw` | onion | `J/& chopped onion` | 0.5 | left as-is |
| `so-baked-bananas` | sugar | `% cup` | 0.5 cup | left as-is |
| `so-stewed-prunes` | sugar | `% cup` | 0.5 cup | left as-is |
| `so-kumquat-prunes` | prune juice | `MJ cup` | not listed | the juice is what the prunes cooked in |
| `so-sherry-jelly` | boiling water | `2% cups` | 2.5 cups | left as-is |
| `so-marmalade-pudding` | sugar | `% cup` | 0.5 cup | left as-is |
| `so-batter-pudding` | flour / milk / vanilla | `% cup`, `% cup`, `% teaspoon` | 0.75, 0.75, 0.5 | left as-is |
| `so-barbara-fritchie` | granulated and brown sugar | `% cup` each | 0.75 cup | left as-is |
| `so-barbara-fritchie` | vanilla | `% teaspoon` | 0.5 tsp | left as-is |
| `so-southern-whip` | cream / sherry / sugar | `% pint`, `% cup`, `% cup` | 0.5, 0.25, 0.25 | left as-is |
| `so-spanish-cream` | gelatin soak cream, sugar split | `% cup`, `% of sugar` | 0.25 cup, half | left as-is |
| `so-carrot-pudding` | citron | `5/4 pound` | 0.75 lb | left as-is |
| `so-carrot-pudding` | salt | `% teaspoon` | 0.25 tsp | left as-is |
| `so-marble-cake` | butter / milk / nutmeg | `% cup`, `% cup`, `% teaspoon` | 0.5, 0.5, 0.5 | left as-is |
| `so-poinciana-cake` | citron | `% pound` | 0.75 lb | left as-is |
| `so-gingerbread` | melted butter | `% cup` | 0.5 cup | left as-is |
| `so-hot-frosted-ginger` | coffee / sugar / molasses | `% cup` each | 0.5 cup each | left as-is |
| `so-strawberry-shortcake` | milk | `•/^ cup` | 0.5 cup | left as-is |
| `so-strawberry-jam-cake` | flour | `2 Mr cups` | 2.25 cups | left as-is |
| `so-brown-white-cake` | butter / milk | `% cup`, `Va cup` | 0.5, 0.25 | left as-is |
| `so-devils-food` | soda water | `% cup` | 0.5 cup | left as-is |
| `so-coffee-cake` | butter / milk | `% cup` each | 0.5 cup each | left as-is |
| `so-pineapple-upside-down` | butter | `% cup` | 0.5 cup | left as-is |
| `so-christening-cake` | butter | `% pound` | 0.75 lb | left as-is |
| `so-turtle-soup` | sherry | `M> cup` | 0.5 cup | left as-is |
| `so-ham-apples` | brown sugar | `Vz cup` | 0.5 cup | reads as ½ |
| `so-hamburger-bacon-roast` | bacon | `% pound` | 0.5 lb | left as-is |
| `so-crepes-suzette` | lemon rind / melted butter | `% lemon`, `% cup` | 0.5, 0.5 | left as-is |
| `so-rice-flour-waffles` | wheat flour / water | `% cup` each | 0.5 cup each | left as-is |
| `so-southern-pastry` | ice water | `% cup` | 0.25 cup | left as-is |
| `so-nut-bread` | sugar / salt | `% cup`, `% teaspoon` | 0.5, 0.5 | left as-is |
| `so-nut-drop-cookies` | salt | `y^ teaspoon` | 0.25 tsp | left as-is |
| `so-currant-cakes` | currants | `% pound` | 0.5 lb | left as-is |
| `so-ginger-cookies` | brown sugar / salt / soda / molasses | `%` each | 0.5, 0.25, 0.5, 0.5 | left as-is |
| `so-orange-cookies` | sugar / orange juice | `% cup` each | 0.5 cup each | left as-is |
| `so-chocolate-brownies` | flour / baking powder / salt / walnuts | `%` each | 0.5, 0.25, 0.25, 0.5 | left as-is |
| `so-pecan-brownies` | maple flavoring | `y% teaspoon` | 0.25 tsp | left as-is |
| `so-eggs-livers` | onion juice / grated cheese | `V6 teaspoon`, `% cup` | 0.25 tsp, 0.25 cup | left as-is |
| `so-syllabub` | milk | `% cup` | 0.5 cup | left as-is |
| `so-syllabub` | sweet cider | `% cup` | 0.5 cup | left as-is |
| `so-syllabub` | sugar | `V-2 cup` | 0.5 cup | left as-is |
| `so-spiced-cider` | sugar | `V± cup` | 0.5 cup | left as-is |
| `so-tom-and-jerry` | boiling water | cup `%` full | "most of the way" | left vague on purpose |
| `so-baking-powder-biscuits` | milk | `% cup` | 0.75 cup | left as-is |
| `so-beaten-biscuits` | lard | `Va cup` | 0.25 cup | left as-is |
| `so-beaten-biscuits` | salt | `Vv teaspoon` | 0.25 tsp | left as-is |
| `so-beaten-biscuits` | sugar | `% teaspoon` | 0.25 tsp | left as-is |
| `so-creole-batter-bread` | corn meal | `Vz pint` | 1 cup | ½ pint is 1 cup, so ours is probably right |
| `so-corned-beef-hash-south` | cream | `% cup` | 0.5 cup | the book lists cream; ours had none, so it is added at a guessed volume |
| `so-dried-beef-maryland` | chipped beef | `% pound` | 8 oz | left as-is |
| `so-creole-goulash` | cheese | `V\ pound` | 0.25 lb | left as-is |
| `so-frogs-legs` | lemon juice | `% cup` | 0.5 cup | for the scalding water |
| `so-baked-ham` | brown sugar | `% cup` | 0.5 cup | left as-is |
| `so-veal-paprika` | veal thickness | `% inch` | "thick slices" | left vague on purpose |
| `so-veal-paprika` | sour cream | `MJ cup` | 0.75 cup | left as-is |
| `so-veal-paprika` | cooking time | `Ms hour` | "about half an hour" | ½ is the likely reading, not a confirmed one |
| `so-chicken-tartare` | butter | `1A pound` | 4 oz | ¼ lb is the likely reading |
| `so-chicken-tartare` | mushrooms | `% pound` | 4 oz | left as-is |
| `so-chicken-pot-pie` | chicken weight | `1% pounds` | "a young chicken" | left unstated |
| `so-roast-chicken` | basting water | `% cup` | 0.5 cup | left as-is |
| `so-chicken-hash` | flour | `iVa tablespoons` | 1.5 tbsp | 1½ is the likely reading |
| `so-mock-terrapin` | butter | `J/4 pound` | 4 oz | ¼ lb is the likely reading |
| `so-rice-chicken-casserole` | butter | `\\V<2 tablespoons` | 1.5 tbsp | 1½ is the likely reading |
| `so-squab-pilau` | celery | `% cup` | 0.5 cup | left as-is |
| `so-oyster-stuffing` | butter | `% cup` | 0.75 cup | left as-is |
| `so-oyster-stuffing` | celery | `P/£ cups` | 1.5 cups | 1½ is the likely reading |
| `so-chestnut-stuffing` | butter | `% cup` | 0.25 cup | left as-is |
| `so-chestnut-stuffing` | onions | `Vi! cup` | 0.5 cup | left as-is |
| `so-bread-stuffing` | black pepper | `% teaspoon` | unstated | left as "black pepper" |
| `so-bread-stuffing` | poultry seasoning | `1A teaspoon` | 0.25 tsp | ¼ is the likely reading |
| `so-southern-gumbo` | celery seed | `% teaspoon` | 0.25 tsp | left as-is |
| `so-shrimp-gumbo` | vinegar | `% cup` | 0.25 cup | left as-is |
| `so-oyster-bisque` | celery | `% cup` | 0.5 cup | left as-is |
| `so-jugged-soup` | rice | `% cup` | 0.5 cup | left as-is |
| `so-jugged-soup` | pepper | `% teaspoon` | unstated | left as "pepper" |
| `so-corn-pudding` | salt | `1 tablespoon` | 1 tbsp | legible, but implausibly high for the yield — reproduced with a caution in the step |
| `so-corn-custard` | sugar | `V-2 teaspoon` | 0.5 tsp | left as-is |
| `so-string-beans-bacon` | bacon | `% pound` | 0.25 lb | left as-is |
| `so-corn-pudding` | cold milk | `Mi cup` | 0.5 cup | left as-is |
| `so-pot-likker` | salt pork | `%-pound` | 0.5 lb | left as-is |
| `so-brunswick-stew` | sherry | `% cup` | 0.25 cup | left as-is |
| `so-brunswick-stew` | bread crumbs | `% cup` | 0.25 cup | left as-is |
| `so-brunswick-stew` | okra | `% cup` | 0.5 cup | left as-is |
| `so-brunswick-stew` | first simmer | `% hour` | 30 min | ½ is the likely reading |
| `so-good-morning-biscuits` | bake time | `% of an hour` | 30 min | ½ is the likely reading |
| `so-good-morning-biscuits` | butter, sugar, lard, milk, egg | leading digits lost | 1 of each | the OCR dropped the numbers off five ingredient lines |
| `so-raisin-biscuits` | butter | `Vs cup` | 0.33 cup | left as-is |
| `so-raisin-biscuits` | milk | `% cup` | 0.75 cup | left as-is |
| `so-corn-sticks` | salt | `% teaspoon` | 0.5 tsp | left as-is |

## Where the book and modern safety pull apart

Two recipes in the poultry run do something a modern kitchen would not, and
both are the book's instruction rather than an OCR slip:

- **Roast partridge** pours slightly sour cream into the hot pan and says to
  let it bubble up for a minute. Everywhere else in this catalog cream is
  kept off the boil. Here the source is explicit, so the step follows it and
  says out loud that the bubbling is deliberate, so it does not read as a
  mistake to be corrected.
- **Squab pilau** beats raw egg through the hot rice and bakes it inside the
  bird. Ours had quietly hard-boiled the eggs instead, which is not the
  recipe. The book's method is restored, with a 165°F target on the stuffing
  — that verifies the egg without changing what the dish is.

The rule: follow the book on technique, add a thermometer where the book is
silent, and never swap a method out on safety grounds when a temperature
check would settle it instead.

### The exception: an ingredient that is simply unsafe

A thermometer cannot settle everything. **Almond chicken soup** calls for six
bitter almonds "for a more pronounced flavor". Bitter almonds carry amygdalin,
which releases hydrogen cyanide; the reported range is that six to ten can
cause severe poisoning and around fifty can kill an adult, and they are not
sold for eating in the United States. That ingredient is omitted, and the step
says so and says why, rather than dropping it quietly.

This is the only kind of departure that overrides fidelity: not a technique a
modern kitchen would do differently, but an ingredient that is a poison at the
dose the recipe gives.

## One more way the scan lies

The OCR does not only lose glyphs, it reorders text around illustrations.
Broiled Ham and Smithfield Ham sit either side of a picture, and the tail of
Broiled Ham ("remove from rack and place on hot platter") was OCR'd into the
middle of the Smithfield recipe. Read the whole spread before deciding which
recipe a sentence belongs to.

Page images are at `https://archive.org/details/<archiveId>`. Image bytes
cannot be fetched in this environment — the egress proxy rejects image
hosts — so these rows can only be closed by a person looking at the page.

## Verified text is frozen text

`src/lib/source-verified.ts` lists every recipe that has been read against its
book. `polishRecipe` returns those untouched — no step rewriting, no
enrichment, no list alignment — and `source-verified.test.ts` asserts that what
the catalog stores is what `RECIPES` renders, so the promise cannot rot.

This was not precautionary. The polish layer had already altered checked text
five times: it turned "three minutes in deep hot lard" into "in deep hot the
4 cups of lard", folded verified steps into one another, appended a second
cooking clause to a method that was already complete, and bought an egg off
the back of "a piece of butter as big as an egg".

The consequence for anyone adding to the list: a verified recipe's stored
steps must be the finished text, quantities written into the sentences by
hand, because nothing downstream will fill them in any more.

## What is not carried across from the source

The 1935 text carries dialect verse and racial language between the recipes,
and the hush puppy in particular is introduced by a long anecdote written in
the idiom of its period. None of that is reproduced. What is verified against
the book is the recipe: ingredients, quantities, method, and the notes that
bear on cooking it. The credit line names the book so the provenance is not
hidden, and the app does not repeat its language.

## Picking this up in a fresh session

The pass runs across many sessions. Everything needed to resume is in the
repo; nothing depends on a scratch directory surviving.

1. **Fetch the book.** Canonical URL only:
   `https://archive.org/download/<archiveId>/<archiveId>_djvu.txt`, then
   `perl -pe 's/[ \t]+/ /g' raw.txt > book.txt`. Gutenberg text needs no
   normalising. The `archiveId` for every book is on the recipe's `source`.
2. **Find what is left.** The verified ids are `VERIFIED_AGAINST_SOURCE` in
   `src/lib/source-verified.ts`; everything with a `source` field and not on
   that list is outstanding.
3. **Read them.** `node --experimental-strip-types scripts/source-check.mjs
   book.txt <id>...` prints ours and the book's passage together.
4. **Fix, then add the id to the list.** A verified recipe's stored steps must
   be the finished text with the quantities written into the sentences by
   hand — `polishRecipe` will not touch it again.
5. **Check.** `npm run typecheck && npm test`. `source-verified.test.ts`
   asserts that every listed recipe reaches the app exactly as stored, so a
   drift shows up as a failure rather than as a surprise in the kitchen.

## Fourteen of the twenty-two archive identifiers pointed at nothing

Checked with the archive's own search API, which answers for a batch in one
call and is cheap enough to re-run whenever a source is added:

```
https://archive.org/advancedsearch.php?q=identifier:(id1+OR+id2+OR+...)&fl[]=identifier&rows=60&output=json
```

`https://archive.org/metadata/<id>` answers `{}` for an item that does not
exist, which is the single-identifier version of the same check.

Only eight of the twenty-two cited identifiers resolved. Eleven of the
remaining fourteen were near-misses of a real item and have been corrected:

| cited | actual |
|---|---|
| `nationalwartimen00unit` | `nationalwartimen04unit` |
| `saladssandwiches00hill` | `saladssandwiches00hillrich` |
| `chinesejapanesec00boss` | `chinesejapanesec00boss_1` |
| `italiancookbook00gent` | `italiancookbooka00gentiala` |
| `365desserts00newy` | `365dessertsdesse00nels` |
| `365foreigndishes00newy` | `365foreigndishes00phil` |
| `americancookery00simm` | `americancookery12815gut` |
| `foodsthatwillwin00goud` | `foodsthatwillwin15464gut` |
| `internationaljew00gree` | `cu31924003580952` |
| `picayunecreoleco00neworich` | `cu31924003574187` |
| `womansuffragecoo00burr` | `the-woman-suffrage-cook-book-compilation-accessible-version` |

The other three were not books. `Vegetarian cookery, 1900–1910` by "Early
vegetarian household", `American luncheon cookery` by "Household pages, 1925"
and `Pennsylvania German household cooking` by "Traditional" each name a
tradition where the author should be, and no archive item exists for any of
them. The nineteen recipes that cited them keep their recipes and lose their
citations, the same way `ar-ff-chocolate-fudge` did.

`source-credit.test.ts` guards all three shapes: an identifier that was never
checked, an author that is a tradition rather than a person, and a credit
missing any of book, author, year or archive item.

## Fetching a book now that direct download is refused

The egress proxy answers 403 to CONNECT for both `archive.org` and
`www.gutenberg.org`, so the `curl` recipe that fetched the Southern book no
longer works. What does work is `nimble_extract` with `driver: "vx6"`: the whole
file comes back too large to return inline, so the connector writes it to disk
under the session's `tool-results/` directory and hands back the path. Parse the
JSON, take `.content`, and grep it locally exactly as before.

Prefer Gutenberg to archive.org wherever the book exists on both. The archive
scan of Farmer's book is raw OCR of a two-column page and its ingredient lists
come out interleaved — Boston brown bread arrives spliced into New England brown
bread, with "Rye meal / Granulated corn meal / Graham flour" collapsed into one
unreadable line. The Gutenberg text of the same book is human-proofread and
clean. **Cite the edition you actually read**, not the one the credit happened
to name: the Farmer credit moved from the 1918 archive scan to the 1896
Gutenberg first edition for exactly that reason.

## A credit a recipe has not earned is removed

`ar-ff-chocolate-fudge` credited Fannie Farmer for a chocolate fudge candy.
Neither the 1896 Gutenberg text nor the 1918 archive scan contains one. Both
contain **Chocolate Fudge Frosting**, and both indexes list it as "Chocolate
Fudge, 531" — which is almost certainly where the attribution came from. The
recipe still ships; its source credit does not. This is the diet-tag rule
applied to provenance: a claim the recipe cannot support is removed rather than
softened.

The same rule took twelve more. Twelve recipes credited the **National Wartime
Nutrition Guide** (`nationalwartimen04unit`). The identifier resolves — it was
one of the fourteen corrected above — but what it opens is a four-page USDA
pamphlet: the "Basic 7" food-group lists, a short section on foods commonly used
but not included, and "A Dozen Hints on Conservation". It ends `QPO <T 533707`.
It contains **no recipes at all**. A resolving identifier is not evidence that
the page holds the dish. `source-credit.test.ts` now keeps a `NOT_A_COOKBOOK`
map so the guide cannot be cited again, and the twelve dishes ship uncredited
until a real 1940s source is read for them.

### 365 Foreign Dishes: three of the eight dishes are not in it

The scan's OCR loses January 4 through April 4 — 96 of the 365 recipes — and the
`_djvu.txt` gives no sign that it has. What settles the question is the book's
own index, which the OCR does carry in full and which lists every dish under its
nation. Read against it:

| Recipe | In the book? |
|---|---|
| `vh-365-goulash` | Yes — *Hungarian Beef Stew*, Feb 28. Ours had caraway and a browning step the book has not. |
| `vh-365-irish-stew` | Yes — *Irish Mutton Stew*, Dec 28. Ours layered lamb and potato; the book fries the chops in dripping and thickens with flour and milk. |
| `vh-365-borscht` | Yes — *Russian Beet Soup*, Feb 24. Ours was a beef-and-cabbage borscht with sour cream. The book's is chicken broth, lemon, cinnamon, nutmeg and a glass of red wine, and has neither cabbage nor sour cream. |
| `vh-365-curry-chicken` | Yes — *Madras Stewed Chicken*, Apr 5. Ours kept the onion, curry powder and apple and dropped the mutton chops, the oysters and the fried egg-plant. |
| `vh-365-spanish-rice` | Yes — *Spanish Rice*, Sept 10. Ours added ham, green pepper and paprika the book has not, and boiled the rice in the pot instead of stirring boiled rice through. |
| `vh-365-swedish-balls` | **No.** The Swedish chapter runs baked fish, turnips, batter cakes, cabbage, salads, pie, rice pudding, stewed chicken, mutton and veal. The book's only meat balls are Egyptian (curried beef, Jan 7) and French *boulettes* (Feb 25). Credit withdrawn. |
| `vh-365-german-potato` | **No.** The German chapter has potato pancakes and two herring salads, no potato salad. The book's potato salads are Belgian and Viennese. Credit withdrawn. |
| `vh-365-onion-soup` | **No.** The French chapter has no onion soup; the book's only onion dish is Scotch stewed onions. Credit withdrawn. |

The three withdrawn dishes still ship. What they no longer claim is a page.

**Where a safety rule overrode the book:** the Madras chicken ends "add 1 pint of
hot oysters ... let all get very hot". Raw shucked oysters dropped into a stew
and merely warmed is not a safe finish, so ours cooks them three minutes, to
plump and curl, and says why in the step.

### The Picayune Creole Cook Book: read from the stream text, not the download

The same page-drop appears here and is worse: `archive.org/download/.../_djvu.txt`
came back 1.43 MB and silently missing **Chapter VII (Creole Gumbo, pp. 18–21)**
and **pp. 107–119**, which is where Calas lives. The text simply runs from
"Cream of Spinach Soup" into the tail of Gumbo Choux and then into Chapter VIII.
Nothing marks the seam.

**`archive.org/stream/<id>/<id>_djvu.txt` returns the whole book** — 2.05 MB for
the same item, with both missing blocks present. Use the stream path, and check
the size against the download path: a stream text that is not larger is a
warning, not a reassurance.

| Recipe | In the book? |
|---|---|
| `vh-pc-gumbo-file` | Yes — *Gumbo Filé*, ch. VII. **It has no roux.** Ours built a peanut-butter brown roux the Picayune never calls for: the chicken and ham are fried in butter, then boiling water and oyster liquor go straight in. Ham and oysters were missing from ours; filé is two tablespoons off the fire; it serves six. |
| `vh-pc-red-beans` | Yes — *Haricots Rouges au Riz*, p. 134. No celery, no green pepper, no cayenne, and the beans are not mashed to thicken. There is a carrot and a bay leaf, and the rice is boiled separately and served beside. |
| `vh-pc-grillades` | Yes — *Grillades à la Sauce*, p. 63. The flour goes into a brown roux with onion and garlic, not onto the meat as a dredge, and the raw grillades are laid on the tomato. Vinegar finishes it. |
| `vh-pc-calas` | Yes — p. 118, from "one of the last of the olden Cala women". Half a cup of rice boiled to a mush, risen overnight on yeast, then eggs, sugar, three spoons of flour and nutmeg. Ours used left-over rice and a one-hour rest. |
| `vh-pc-pain-perdu` | Yes — *Lost Bread or Egg Toast*, p. 263. **No milk and no vanilla.** Eggs, orange flower water, sugar, lemon zest, optional brandy, a half-hour soak, and deep lard — not butter in a skillet. |
| `vh-pc-courtbouillon` | Yes — *Courtbouillon à la Créole*, p. 26. Allspice, four herbs, garlic and a glass of claret, none of which ours had; no green pepper, which ours did; and it is served with potatoes, not rice. |
| `vh-pc-shrimp-creole` | Yes — *Stewed Shrimp / Chevrettes à la Créole*, p. 39. The shrimp are boiled and picked first, then stewed ten minutes. No green pepper. "Never pour water into stewed Shrimp, as the tomato juice makes gravy enough." |
| `vh-pc-trout-meuniere` | **No.** The word *meunière* does not appear in the book. Its trout are boiled, broiled, crumbed and fried with sauce tartare, or dipped in milk, floured and deep-fried. Credit withdrawn. |

### The International Jewish Cook Book: six of eight, and two dishes it does not have

The stream text of `cu31924003580952` is complete but for pages 54–64 and
113–114; every dish below sits outside those. The book's own index settles the
two absences.

| Recipe | In the book? |
|---|---|
| `vh-jw-matzo-ball` | Yes — *Yom-Tov Soup* and *Matzoth Meal Kleis, No. 1*, pp. 380–381. The soup takes **two pounds of beef ribs beside the chicken**, a parsley root and a pinch of saffron, and the meat comes out to be served separately. The kleis are one egg to each tablespoon of meal, spiced with ginger, cinnamon and ground almond and bound with chicken fat — none of which ours had. |
| `vh-jw-gefilte` | Yes — *Gefillte Fisch with Egg Sauce*, p. 39. Not quenelles: a haddock cut into four-inch steaks, each hollowed and refilled with its own chopped meat, boiled an hour, sauced with the broth beaten into egg yolks. (The book's other *Gefillte Fisch*, p. 38, stuffs the whole skin back.) |
| `vh-jw-latkes` | Yes — *Potato Pancakes*, p. 238. The potatoes soak several hours before grating, it is two eggs to every pint, the onion is **juice and optional**, and they fry as small cakes on a greased spider rather than in a bath. Served with apple sauce. |
| `vh-jw-kugel` | Yes — *Noodle Kugel*, p. 178. **Pareve and not sweet**: noodles, ¾ cup of rendered chicken or goose fat, four eggs, baked brown. Ours had sugar, raisins, cottage cheese and butter, none of which are in it. Jelly or stewed fruit goes beside. |
| `vh-jw-cabbage-rolls` | Yes — *Kal Dolmar*, p. 115. The rice is **boiled first**, the rolls are tied with string and **fried brown** before boiling, and a brown gravy finishes them. There is no sweet-sour tomato sauce, no lemon and no brown sugar in the book's version. |
| `vh-jw-blintzes` | Yes — *Cheese Blintzes*, p. 239. The batter is one egg, a cup of **water** and a cup of flour — no milk. The filling is pot cheese with lemon peel and cinnamon. The dough makes six. |
| `vh-jw-tzimmes` | **No.** The index has no tzimmes under any spelling. The carrot dishes are a sugar-syrup *Compote of Carrots (Russian Style)* and a baked *Carrot Schalet*; the prune entries are stewed, baked, brandied, or cooked with red cabbage. Credit withdrawn. |
| `vh-jw-chopped-liver` | **No.** The book's liver appetisers are *Chicken Liver Paste* Nos. 1 and 2 and an *Imitation Pâté de Foi Gras* — livers simmered, minced or rubbed smooth, bound with egg yolk and spread on toast. Chopped liver with hard egg and browned onion is not in it. Credit withdrawn. |

### 365 Desserts: six of eight, and the two it does not have

| Recipe | In the book? |
|---|---|
| `vh-ds-blancmange` | Yes, but not ours — the book's blanc manges are *Irish Moss* and *Peach*, and there is no cornstarch mould in it. Rewritten to the Irish moss one: half an ounce of carrageen soaked an hour in a quart of milk, cooked down in a farina boiler until it almost dissolves, strained into a mould. |
| `vh-ds-cottage-pudding` | Yes, p. 127. **No butter and no sauce.** The yolk is beaten light with a whole cup of sugar and the white folded in last with the baking powder; 25 minutes in a slow oven. |
| `vh-ds-apple-tapioca` | Yes — *Apple Tapioca Pudding*, p. 122. Whole pared and cored apples in the dish, a soaked-tapioca custard of three eggs and a quart of milk poured over, baked. Eaten with cream and sugar. |
| `vh-ds-prune-whip` | Yes under another name — *Prune Pudding*. A pound of prunes soaked overnight, cooked tender, pressed to a pulp, lightened with beaten whites and **set with gelatine**, served with soft custard. Renamed to what the book calls it. |
| `vh-ds-rice-pudding` | Yes, p. 44. Two tablespoons of rice to a quart of new milk, no butter and no vanilla, and the distinctive instruction to stir **every two minutes until the last half hour**. |
| `vh-ds-charlotte` | Yes — *Charlotte Russe*, p. 50. A cooked custard base set with gelatine and folded into whipped cream, hardened in a wet mould, then turned out and **covered with stale macaroons**. It is not lined with ladyfingers; the book's No. 2 lines its moulds with sponge cake. |
| `vh-ds-snow-pudding` | **No.** The book's *Snow Balls* Nos. 1 and 2 are little baked cakes rolled in powdered sugar. There is no lemon-gelatin snow pudding in the 365. Credit withdrawn. |
| `vh-ds-boiled-custard` | **No** — not as a recipe of its own. "Boiled custard" appears only as an ingredient poured over other puddings; the book's custard recipes are *Baked Custard* and the flavoured ones. Credit withdrawn. |

**Safety change against the source:** the prune pudding folds raw beaten whites into a cold mould that is never heated. Ours calls for pasteurised whites and says why.

**Two engine defects this book exposed.** A soak was being read as a marinade
whenever the word "soak" appeared, so the quart of milk the Irish moss soaks in
— which is then cooked into the pudding — was discounted to 15%, giving a
blanc mange made of milk and sugar 90 kcal a serving. A soak now only leaves
its liquid behind when the method says the food comes out of it. And the plain
`/gelatin/` rule sat 130 lines above the flavoured one and swallowed "lemon
gelatin", weighing two boxes of Jell-O as unflavoured leaf: 175 g of protein a
serving in a fruit salad. Flavoured gelatin is now read first.

### The identifier resolved, the book was not there

`the-woman-suffrage-cook-book-compilation-accessible-version` passes every
check the provenance test could make: it resolves, it is a text item, its title
is the book's title. It is **not the book**. The archive metadata gives it away
— 28 page images and a 45 KB text — and reading it settles it: it is a 2020
**Johns Hopkins Sheridan Libraries holiday sampler**, a handful of sweets
excerpted from *three* different suffrage cookbooks (Burr's second edition of
1890, Kleber 1915, and the Washington Women's Cook Book of 1909), with a
librarian's foreword and a "bake like a suffragette this winter" invitation.

Seven recipes cited it: church chicken and dumplings, ham loaf, three-bean
salad, scalloped potatoes, jellied fruit salad, baked macaroni and escalloped
oysters. **None of the seven is in it** — it contains no savoury dish at all.
The credit's own wording had already admitted the problem: "…and typical
Ladies' Aid church-supper dishes", which is a tradition standing where a page
should be. All seven credits are withdrawn and the constant is deleted.

Burr's *Woman Suffrage Cook Book* is not on the Internet Archive under any
identifier — a title search returns this compilation and nothing else — so
there is no honest source to re-point them at from here.

The lesson for the next one: **check what the item is, not only that it opens.**
`https://archive.org/metadata/<id>` gives the page count and the derivative
sizes before you read a word. A cookbook of 28 pages is not a cookbook.

### The Suffrage Cook Book (Kleber, 1915): five of five, all five wrong

| Recipe | What the book actually prints |
|---|---|
| `vh-sf-nut-bread` | *Excellent Nut Bread*, p. 101. **New Orleans molasses and soda**, not sugar and baking powder. Ours had half a cup of sugar and four teaspoons of baking powder, neither of which is in it. The twenty-minute rest was right. |
| `vh-sf-hot-slaw` | p. 171. The cabbage cooks **twenty minutes** in bacon fat and a little water with the onion, and the sugar and vinegar go in at the very end — **one teaspoon each**, not three tablespoons. "It must be sour-sweet." |
| `vh-sf-hawaiian-sandwich` | p. 165. The whole recipe is two sentences and ours had added trimming and cutting to triangles. "A small cream cheese" is the 1915 three-ounce package, not eight ounces. |
| `vh-sf-carrot-croquettes` | p. 90. Bound with **a cupful of thick white sauce and nothing else** — no egg and no crumbs in the mixture. The coating is egg then crumbs once, per the book's own croquette rule (see its Salmon and Chicken Croquettes), not crumb-egg-crumb. |
| `vh-sf-tomato-toast` | p. 96. **It is a cheese savoury**: butter, a tablespoon of tomato and two ounces of grated cheese melted together with paprika and poured over fried rounds of bread. Ours was four tomatoes and an onion with no cheese in it at all. |

**Two more engine defects.** `tomatoes?` is "tomatoe" plus an optional s — it
never matched a singular "stewed tomato", and only the exact `^tomato$` rule
was catching the bare word. And butter named for the pan rather than the batter
had no rule at all.

### The Virginia Housewife: one of six

Randolph's *Chicken Pudding, a Favourite Virginia Dish* is in the book and ours
now matches it: the chicken is **boiled nearly done** with thyme and parsley
before it goes into a thin egg batter, not browned in butter, and white gravy is
sent in a boat. The book makes it with four young chickens; ours is a quarter of
that and says so.

The other five are not in the book under any spelling. It has no beaten biscuit
(its beaten dough is *Apoquiniminc Cakes*, an egg-and-butter paste beaten with a
pestle and baked on a gridiron), no fried catfish (*Catfish Soup* and *To Make a
Curry of Catfish*), no hoe cake (*Batter Cakes* of hominy and meal on a
griddle), no apple tansey (its *Tansey Pudding* is cream and spinach juice with
no apple in it), and no Brunswick stew at all. Five credits withdrawn.

### Camping and Woodcraft: the wrong printing, and a rights problem

`campingwoodcraft00keph` is the **1937 Macmillan printing**. Its metadata says
`"access-restricted-item": "true"`, its collections are `inlibrary` and
`printdisabled`, and its `_djvu.txt` is marked private — the text cannot be read
at all. The credit called it 1917 and called it public domain. Both were wrong,
and the second was the kind of wrong that matters.

The credit now points at **`campingwoodcraft01keph`, Volume I: Camping (1916)**,
which is unrestricted, readable, and is where the cookery chapters are. Read
against it, four of the six hold:

| Recipe | In the book? |
|---|---|
| `vh-kp-bannock` | Yes, pp. 344–5, quoting Kathrene Pinkerton. **Double the lard**, a dough thin enough to smooth with a knife, the pan held **three feet above the blaze** until it doubles, then lowered and browned on both sides. "A bannock should never be baked in less than twenty-five minutes." |
| `vh-kp-trail-beans` | Yes — *Beans, Baked*, p. 367. Parboil until one will **pop open when blown upon**, parboil the pork separately, gash it and layer it, a tablespoon of molasses, hung high over the fire two hours. No onion and no mustard. |
| `vh-kp-foil-potato` | Yes — *Potatoes, Baked*, quoting Nessmuk, and **there is no foil in it**: a basin of hardwood coals under the fore-stick, the potatoes buried in hot sand and ashes, tried with a sharpened hardwood sliver, the steam let out and eaten at once. |
| `vh-kp-kabobs` | Yes, p. 291. A tender cut pounded and broken into fragments, impaled on a sharpened stick, **plunged for a moment into a clear bright flame** and then toasted slowly over the embers. No onion and no bacon on the stick. |
| `vh-kp-mulligan` | **No.** The index reads "Mulligan (skilly), 376", and page 376 is *Skilligalee* — a perpetual stock-pot of fag-ends kept simmering at all hours, not a dredged beef stew. Credit withdrawn. |
| `vh-kp-camp-coffee-stew` | **No.** There is no coffee in any stew in the book, and its coffee chapter is emphatic that coffee must not boil. Credit withdrawn. |

### The salt rule ate every salt pork in the catalog

`\bsalt\b` sat forty rules above the salt-pork entry and matched first, so
**every salt pork, salt cod and salt beef row in the catalog weighed as pure
salt: nothing at all.** Boston baked beans came to 120 kcal a serving, pot
likker to 40, parsnips and salt pork to 65. With salt followed by a food noun
now excluded from the seasoning rule, they read 755, 465 and 880. Fifteen
recipes were understated by this; the parsnip dish needed eight portions rather
than four once its pork was actually counted.

## Progress

| Book | Recipes | Verified |
|---|---|---|
| The Italian Cook Book (Gentile 1919) | 10 | **10** |
| The Southern Cook Book (Lustig 1935) | 317 | **317 (complete)** |
| The Boston Cooking-School Cook Book (Farmer) | 13 | **12 (complete; 1 credit withdrawn)** |
| What Mrs. Fisher Knows (Fisher 1881) | 7 | **7 (complete)** |
| The White House Cook Book (Gillette 1887) | 8 | 7 (floating island missing from the scan) |
| National Wartime Nutrition Guide (USDA 1943) | 12 | **n/a — holds no recipes; 12 credits withdrawn** |
| 365 Foreign Dishes (1908) | 8 | **5 (complete; 3 credits withdrawn)** |
| The Picayune Creole Cook Book (1901) | 8 | **7 (complete; 1 credit withdrawn)** |
| The International Jewish Cook Book (1918) | 8 | **6 (complete; 2 credits withdrawn)** |
| 365 Desserts (1900) | 8 | **6 (complete; 2 credits withdrawn)** |
| The Suffrage Cook Book (Kleber 1915) | 5 | **5 (complete)** |
| "Woman Suffrage Cook Book" | 7 | **n/a — the identifier is not that book; 7 credits withdrawn** |
| The Virginia Housewife (1824) | 6 | **1 (complete; 5 credits withdrawn)** |
| Camping and Woodcraft, Vol. I (1916) | 6 | **4 (complete; 2 credits withdrawn)** |
| The other 11 books | 71 | 0 |
