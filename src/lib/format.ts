export function prettyFrac(qty: number, snap = false): string {
  const table: [number, string][] = [
    [0.0625, "1/16"],
    [0.125, "⅛"],
    [1 / 6, "⅙"],
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.375, "⅜"],
    [0.5, "½"],
    [0.625, "⅝"],
    [2 / 3, "⅔"],
    [5 / 6, "⅚"],
    [0.75, "¾"],
    [0.875, "⅞"],
  ];
  for (const [n, s] of table) {
    if (Math.abs(qty - n) < 0.02) return s;
  }
  const whole = Math.floor(qty);
  const frac = qty - whole;
  if (whole >= 1 && frac > 0.02) {
    for (const [n, s] of table) {
      if (Math.abs(frac - n) < 0.02) return s.includes("/") ? `${whole} ${s}` : `${whole}${s}`;
    }
  }
  if (Number.isInteger(qty)) return String(qty);
  // A summed or scaled amount that lands between glyphs (⅓ + ¾ = 1.0833333333333333)
  // is rounded to the nearest eighth or sixth and shown as a fraction when asked
  // (`snap`); otherwise it shows as a short decimal, never a float tail.
  if (snap && qty > 0.03 && qty < 10) {
    const eighth = Math.round(qty * 8) / 8;
    const sixth = Math.round(qty * 6) / 6;
    const best = Math.abs(qty - sixth) < Math.abs(qty - eighth) - 1e-9 ? sixth : eighth;
    if (best > 0 && best !== qty) return prettyFrac(best);
  }
  return String(Number(qty.toFixed(2)) || Number(qty.toPrecision(2)));
}

export function formatQty(qty: number, unit: string): string {
  let q = qty;
  let raw = (unit || "").trim();
  if (/^(tbsp|tablespoons?)$/i.test(raw) && q > 0 && q < 0.4) {
    q *= 3;
    raw = /^tbsp$/i.test(unit.trim()) ? "tsp" : q <= 1 ? "teaspoon" : "teaspoons";
  }
  const pretty = prettyFrac(q, !/^(g|kg|ml|l|mg)$/i.test(raw));
  if (!raw) return pretty;
  const keepAbbrev = /^(tbsp|tsp|oz|lb|ml|g)$/i.test(raw);
  if (q > 1.02) return `${pretty} ${raw}`;
  if (keepAbbrev) return `${pretty} ${raw}`;
  const singular = /ies$/i.test(raw)
    ? raw.replace(/ies$/i, "y")
    : /s$/i.test(raw) && !/ss$/i.test(raw)
      ? raw.replace(/s$/i, "")
      : raw;
  return `${pretty} ${singular}`;
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function formatMinutes(n: number): string {
  if (n >= 120) {
    const h = Math.floor(n / 60);
    const m = n % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${n} min`;
}
