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
| `so-pigs-in-blankets` | salt | `% teaspoon` | 1 tsp | left as-is |
| `so-mint-tea` | water | `1 ••> cup` | 1 cup | possibly 1½ |
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

## Progress

| Book | Recipes | Verified |
|---|---|---|
| The Italian Cook Book (Gentile 1919) | 10 | **10** |
| The Southern Cook Book (Lustig 1935) | 317 | 135 |
| The other 20 books | 139 | 0 |
