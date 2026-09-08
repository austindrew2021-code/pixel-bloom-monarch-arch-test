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
  const scaled = qty * factor;
  if (scaled === 0) return 0;
  const rounded = Math.round(scaled * 4) / 4;
  if (rounded === 0 && scaled > 0) return scaled <= 0.125 ? 0.125 : 0.25;
  return rounded;
}
