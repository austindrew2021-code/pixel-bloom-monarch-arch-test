# Sourcing brief for recipe photos

Paste this to whoever (or whatever) is fetching the next batch, along with
`photos-wanted.csv`. Regenerate that file first with `npm run photos:wanted`.

Two batches have been through review. The first failed on keyword collisions —
"chow-chow" returned a Chow Chow dog, "iceberg wedge" an iceberg, "maduros"
Nicolás Maduro. The second failed on stage: banana bread came back as bananas
and a bag of chocolate chips, Irish soda bread as a mixing bowl, pot pie as
unbaked dough. Both failure modes are covered below. Roughly a third of each
batch had to be thrown away; the rules exist to make that number small.

---

## The job

`photos-wanted.csv` has one row per dish that still needs a photograph:

| column | meaning |
| --- | --- |
| `file` | **the exact path and filename to save as.** Do not rename it. |
| `dish` | the dish as it appears in the app |
| `search` | a query built from the cuisine, the dish, and its real ingredients |
| `description` | how the app describes the dish — read it, it disambiguates |

Save each image at exactly the `file` path. `public/food/hm-cornbread.jpg` means
a file called `hm-cornbread.jpg`. **Do not name files after the dish title or
the search phrase.** The app looks photos up by that id and nothing else, so a
file named `skillet-cornbread.jpg` or
`southern-skillet-cornbread-plated-finished-dish...jpg` is invisible no matter
how good the picture is. The last batch was named after the search phrase and
none of its 830 photos appeared in the app until they were renamed.

## What the picture must be

**The finished dish, plated and ready to eat.** Cooked, served, on a plate or
in a bowl. This is the single most important rule and the one most often broken.

Not acceptable, all of which arrived in the last batch:

- **Raw ingredients.** Flour and eggs on a worktop is not lemon bars. Raw
  carrots are not tzimmes. Whole pumpkins are not pumpkin bread.
- **A step of the recipe.** Whisking batter, dredging a cutlet, an unbaked
  crust, a hand cracking an egg.
- **The wrong stage of the right food.** Raw sashimi is not teriyaki salmon.
  A live mackerel is not broiled mackerel. Raw ribs are not cooked ribs.
- **Equipment or a place.** A churro extruder, a smokehouse, a restaurant
  front, a bakery, a campsite.
- **Branded packaging.** A Chex box, a bouillon cube, a supermarket tray, a
  logo. These are also a licensing problem.
- **People.** No identifiable faces, no hands holding the plate, no crowds. A
  photograph of a real person carries consent and likeness problems that a
  photograph of dinner does not.
- **Anything that is not food.** Flags, maps, coats of arms, diagrams,
  cartoons, satellite images. All of those genuinely turned up.

## Match the dish, not just the words

- **Honour the diet.** A vegan dish must not be illustrated with meat. The
  "stuffed squash holiday roast" came back as a whole roast turkey.
- **Honour the variant.** Green shakshuka is green. A bunless burger bowl has
  no bun. Cold soba is cold.
- **Honour the form.** Cookies are not a torte. Bars are not a whole pie. A
  sauce is the sauce, not the wings you dip in it.
- **Read the `description` column** when the title is ambiguous. It says what
  the dish actually is.

## One image per dish

Never use the same photograph for two rows. In the first batch a single image
was standing in for 31 unrelated dishes because they all contained chicken.
Duplicates are detected automatically and all copies get deleted, so a reused
image loses you both dishes, not just one.

This holds even for the handful of rows that name the same dish twice. The
catalog carries 37 dish names more than once — a Welsh rarebit from a 1935
Southern cookbook and a modern one are different recipes that happen to share a
title — so a few rows will look like duplicates of each other. Each still needs
its own photograph: a different angle, a different plate, a different styling of
the same food. If you can only find one good picture of that dish, give it to
one row and skip the other. Two rows sharing a file means both lose it.

## File requirements

- JPEG, at least 800px on the long edge, **under 1 MB**. Bigger files are
  downscaled anyway; a 38 MB photo of a sourdough loaf helps nobody.
- One file per row, at the exact `file` path.

## When you cannot find one

**Skip the row.** Leave it out and say which ones you skipped.

An empty slot is fine — the app draws a plate for any dish without a
photograph, which is honest. A picture of a different dish is not fine: a cook
reads it as a picture of what they are about to make. Never substitute
something close.

## Licensing

Record where each image came from and under what licence, as a CSV alongside
the images: `file,source_url,licence,attribution`. This is the one outstanding
item that can cost real money later, and it cannot be reconstructed after the
fact.

---

## After the batch lands

```bash
npm run photos:rename   # maps search-phrase filenames back to ids, if needed
npm run photos          # regenerates the manifest from the directory
npm test                # fails on duplicates, tiny files, oversized files
```

Then someone still has to look at them. Both previous batches passed every
automated check and were still about a third wrong, because no test can tell
whether a picture is of the dish it is named for.
