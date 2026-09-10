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

## Progress

| Book | Recipes | Verified |
|---|---|---|
| The Italian Cook Book (Gentile 1919) | 10 | **10** |
| The Southern Cook Book (Lustig 1935) | 317 | 37 |
| The other 20 books | 139 | 0 |
