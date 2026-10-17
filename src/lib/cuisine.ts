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
  const inThirds = Math.abs(qty * 3 - Math.round(qty * 3)) < 0.04 && Math.abs(qty * 4 - Math.round(qty * 4)) > 0.04;
  const third = Math.round(scaled * 6) / 6;
  // A catalog eighth (⅛, ⅜, ⅝, ⅞) keeps the eighth grid: ⅛ never turns into a quarter on its own.
  const inEighths = !inThirds && Math.abs(qty * 8 - Math.round(qty * 8)) < 0.02 && Math.abs(qty * 4 - Math.round(qty * 4)) > 0.04;
  const eighth = Math.round(scaled * 8) / 8;
  const rounded = inEighths && eighth > 0
    ? eighth
    : inThirds && third > 0 && Math.abs(scaled - third) < Math.abs(scaled - quarter) - 1e-9 ? third : quarter;
  if (rounded === 0 && scaled > 0) return scaled <= 0.125 ? 0.125 : 0.25;
  return rounded;
}
