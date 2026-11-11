/**
 * Nov 7 r4 (Line 03B5 #2): same-book cross-references that no older table carried. Found by sweeping every book's steps
 * for another recipe's title and for "as before / as in the preceding recipe / as per" back-references
 * (fixpack/r4work/sweep*.ts), each read by hand against the print. id -> base recipe(s). They join HTCF_XREF, SO_XREF,
 * DS365_XREF and the app-wide "cross-ref" notes in the one graph mk_xref4_r4.ts walks to a fixed point.
 * Hits the sweep finds that are not references (a "serve with" dish, a shape note, a plain row that shares a title, the
 * held tarragon-vinegar rows) are listed with their reasons in xref-exclusions.json (Nov 7 r5, Line FA0D #1).
 */
export const XREF_EXTRA: Readonly<Record<string, readonly string[] | null>> = {
  "htcf-1174": ["htcf-1144"], // "Fill the centre with Creamed Fish, seasoned to taste" (Line)
  "hill-0032": ["hill-0031"], // "Prepare as lettuce salad" (Line)
  "hill-0070": ["hill-0069"], // "serve as green-pea salad" (Line)
  "hill-0276": ["hill-0275"], // "Cook as before." — Panned Oysters (on rounds of toast)
  "hill-0012": ["hill-0011"], // "Prepare as in preceding recipe."
  "kleber-0267": ["kleber-0263", "kleber-0264"], // "blend as for Egg-nog No." (number not printed)
  "kleber-0268": ["kleber-0263", "kleber-0264"], // "Prepare as per Egg-nog No I or II"
  "ys-033": ["ys-032"], // "Same as soft-cooked, but cook 35 to 45 min."
  // Nov 7 r5 (Line FA0D #1, #5): found by Line's every-book sweep; xref-detector.test.ts now fails on any new one.
  "hill-0303": ["hill-0304"], // row "creamed peas" + "surround with the Creamed Peas" (flour, sugar)
  "hill-0232": ["hill-0231"], // "Substitute claret for the orange juice and prepare as above" (Fruit Jelly: gelatine)
  "kleber-0119": ["kleber-0154"], // "bake on pie crusts rolled very thin" (Pie Crust: lard)
  "so-cornmeal-dodger": ["so-pot-likker"], // "drop into boiling pot likker" (salt pork)
  "ds-oct-30-oranges-filled-with-jelly": ["ds-dec-26-wine-jelly"], // "Have ready an orange or wine jelly" (gelatine)
  "bcx-261": ["bcx-150"], // row "Orange Rice (right)" (hot chicken broth)
  "hill-0273": null, // "Season any of the creamed dishes": no one base, so unresolved (fails every tag)
  "mb-042": null, // "Use the recipe for vanilla ice cream": no such recipe in the app, so unresolved
  // Nov 10 r5: found by the new detector (xref-detector.test.ts), each read against the print. Pescatarian is the only
  // tag any of them changes; the rest cost nothing and are listed because they are real references.
  "hill-0060": ["hill-0058"], // "Make the jelly and mould as before" (Tomato Jelly: gelatine)
  "hill-0034": ["hill-0058"], // garnish "or diamonds of tomato jelly" (gelatine); safe side wins on an "or"
  "hill-0087": ["hill-0086"], // "Decorate the mould as before" (aspic)
  "hill-0102": ["hill-0101"], // "Then proceed as above" (aspic border)
  "hill-0233": ["hill-0231", "hill-0232"], // "Fruit or Claret Jelly" sandwiches: "Stamp out shapes from the jelly" (gelatine)
  "hill-0234": ["hill-0233"], // "Substitute candied fruit for the nuts and proceed as above"
  "hill-0223": ["hill-0222"], // "cook as above"
  "hill-0225": ["hill-0224"], // "Prepare in the same manner as in the last number"
  "hill-0230": ["hill-0229"], // "Prepare the cream as above"
  "hill-0238": ["hill-0237"], // "Prepare as above, substituting maple syrup"
  "hill-0240": ["hill-0239"], // "Use the preceding recipe without change other than in kind of flour"
  "hill-0284": ["hill-0282"], // "proceed as for lobster à la Newburgh"
  "hill-0300": ["hill-0296"], // "Prepare some bread in the blazer as for anchovy toast"
  "hill-0313": ["hill-0312"], // "Serve as before." (Welsh Rarebit, No. 2)
  "hill-0336": ["hill-0335"], // "Prepare in the same manner" (Eggs with Asparagus: sauce on toast)
  "hill-0353": ["hill-0352"], // "Drop from a spoon and cook as above" (Kornlet Oysters)
  "kleber-0074": ["kleber-0073"], // "Prepare rice as above, and mingle with white sauce"
  "kleber-0151": ["kleber-0154"], // "a shell as for lemon pie": no lemon pie in the book, so its one Pie Crust (lard)
  "fd-may-17-french-rolls": null, // "Prepare the dough as for bread": the book prints no bread dough, so unresolved
  "bcx-048": ["bcx-004"], // row "recipe Deluxe Sugar Cookies (left)"
  "bcx-049": ["bcx-010"], // row "recipe Cream Cheese Spritz Wreaths (left)"
  "bcx-053": ["bcx-040"], // row "Holiday Cookie Mix (left)"
  "bcx-259": ["bcx-126"], // row "recipe Refrigerator Roll Dough (left)"
  "ac-0037": ["ac-0044-7"], // "put on to paste No. 7" (lard)
  "ac-0040-1": ["ac-0044-7", "ac-0043-3"], // "laid into paste No. 7 or 3" (No. 7: lard); safe side wins on an "or"
  "ac-0042": ["ac-0044-7", "ac-0045"], // "Lay paste No. 7 or 9" (No. 7: lard)
  "ac-0051": ["ac-0045"], // "put into paste No. 9" (Royal Paste)
  "ac-0054": ["ac-0045", "ac-0044-7"], // "royal paste" row, "or serve on paste No. 7" (lard)
  "ac-0055": ["ac-0045"], // "cover with paste No. 9"
  "ac-0023": ["ac-0043-3"], // "bake in paste No. 3"
  "ac-0024": ["ac-0023"], // "proceeding as above" (Apple Pie: paste No. 3)
  "ac-0025": ["ac-0043-3"], // "lay in paste No. 3"
  "ac-0029": ["ac-0043-1"], // "cover with paste, No. 1"
  "ac-0052": ["ac-0043-1"], // "laid into paste No. 1"
  "ac-0053": ["ac-0052"], // "as above" (Marmalade: paste No. 1)
  "cris-040": ["cris-055"], // "Fold in Tangy Dressing (see opposite page)"
  "cris-045": ["cris-025", "cris-047"], // "Fruit Salad Dressing (see below) or Poppy Seed Fruit Salad Dressing (see page 18)"
  // Nov 11 r6 (Line 7624 #5): the detector now scans names and re-scans ids already in the graph. Each read by hand.
  "htcf-0176": ["htcf-0173"], // "according to directions given in the recipe for Boiled Cods' Tongues with Egg Sauce"
  "hill-0127": ["hill-0126"], // "Mousse-de-Poulet, No. 2": "Mould the mousse in small cups" (Line)
  "hill-0129": ["hill-0126"], // "Mousse-de-Poulet, No. 4": the mousse ring is not printed here (Line)
  "hill-0160": ["hill-0159"], // "Turquoise Salad, No. 2": "Use pineapple in the place of the apple"
  // "Put into paste": no number printed, so every paste in the book; safe side wins (No. 7 is lard)
  "ac-0034": ["ac-0043-1", "ac-0043-2", "ac-0043-3", "ac-0043-4", "ac-0043-5", "ac-0043-6", "ac-0044-7", "ac-0044-8", "ac-0045"],
  "kleber-0213": ["kleber-0206"], // row "Bechamel sauce" (Bechamel Sauce: white stock); reopened when kleber-0206 lost pescatarian
};
