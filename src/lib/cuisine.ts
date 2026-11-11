export function cuisineBar(cuisine?: string): string {
  const key = (cuisine ?? "").toLowerCase();
  if (key.includes("newfound") || key.includes("nova") || key.includes("brunswick") || key.includes("edward") || key.includes("atlantic")) {
    return "bg-food-broth";
  }
  if (key.includes("old")) return "bg-food-crust";
  if (key.includes("greek")) return "bg-food-leaf";
  if (key.includes("italian")) return "bg-food-tomato";
  if (key.includes("mexican") || key.includes("spanish")) return "bg-food-yolk";
  if (key.includes("indian") || key.includes("caribbean")) return "bg-food-salmon";
  if (key.includes("east") || key.includes("asian")) return "bg-food-herb";
  if (key.includes("middle")) return "bg-food-yolk";
  if (key.includes("french")) return "bg-food-char";
  if (key.includes("southern")) return "bg-food-crust";
  if (key.includes("japan")) return "bg-food-herb";
  if (key.includes("thai") || key.includes("korea") || key.includes("china") || key.includes("chinese")) return "bg-food-herb";
  if (key.includes("caribbean")) return "bg-food-salmon";
  if (key.includes("holiday") || key.includes("plant")) return "bg-food-leaf";
  if (key.includes("british") || key.includes("american") || key.includes("german")) return "bg-food-crust";
  if (key.includes("africa") || key.includes("mediterranean")) return "bg-food-yolk";
  return "bg-spark";
}

export function scaleQty(qty: number, household: number, servings: number): number {
  const factor = household / Math.max(1, servings);
  // At the recipe's own servings the amount is the catalog's (⅓ cup stays ⅓,
  // not the nearest quarter).
  if (factor === 1) return qty;
  const scaled = qty * factor;
  if (scaled === 0) return 0;
  // A catalog third stays a third at any scale (⅓ × 2 = ⅔, not ¾; ⅓ × ½ = ⅙):
  // amounts written in thirds snap to the nearer of the sixth (which holds the
  // thirds) and quarter grids (ties to the quarter). Every other amount keeps
  // the quarter grid.
  const quarter = Math.round(scaled * 4) / 4;
  // Thirds are checked first with their own tolerance (0.66 is a printed ⅔),
  // then sixths (⅙, ⅚ ride the same grid: ⅙ × 2 = ⅓, not ¼), then quarters (Line, Nov 2).
  const notQuarter = Math.abs(qty * 4 - Math.round(qty * 4)) > 0.04;
  const onThirds = Math.abs(qty * 3 - Math.round(qty * 3)) < 0.04;
  const onSixths = Math.abs(qty * 6 - Math.round(qty * 6)) < 0.04;
  const inThirds = notQuarter && (onThirds || onSixths);
  const third = Math.round(scaled * 6) / 6;
  // A catalog eighth (⅛, ⅜, ⅝, ⅞) keeps the eighth grid: ⅛ never turns into a quarter on its own.
  const inEighths = !inThirds && Math.abs(qty * 8 - Math.round(qty * 8)) < 0.02 && Math.abs(qty * 4 - Math.round(qty * 4)) > 0.04;
  const eighth = Math.round(scaled * 8) / 8;
  // A small quarter-grid amount (¼ cup peanut butter) has no quarter between it
  // and nothing: ¼ × ½ = ⅛ rounded half-up back to ¼, and ¼ × 5/4 also landed
  // on ¼, so the row read ¼ cup at 2, 4 and 5 servings. When a printed ¼ would
  // come back unchanged at another scale, the eighth grid is used for that row only; the quarter/sixth grids are unchanged.
  const smallQuarter = !inThirds && !inEighths && Math.abs(qty - 0.25) < 1e-9 && quarter === qty;
  const rounded = (inEighths || smallQuarter) && eighth > 0
    ? eighth
    : inThirds && third > 0 && Math.abs(scaled - third) < Math.abs(scaled - quarter) - 1e-9 ? third : quarter;
  if (rounded === 0 && scaled > 0) return scaled <= 0.125 ? 0.125 : 0.25;
  return rounded;
}
