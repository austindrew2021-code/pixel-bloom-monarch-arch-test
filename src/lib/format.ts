export function prettyFrac(qty: number): string {
  const table: [number, string][] = [
    [0.125, "⅛"],
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.5, "½"],
    [2 / 3, "⅔"],
    [0.75, "¾"],
  ];
  for (const [n, s] of table) {
    if (Math.abs(qty - n) < 0.02) return s;
  }
  const whole = Math.floor(qty);
  const frac = qty - whole;
  if (whole >= 1 && frac > 0.02) {
    for (const [n, s] of table) {
      if (Math.abs(frac - n) < 0.02) return `${whole}${s}`;
    }
  }
  if (Number.isInteger(qty)) return String(qty);
  return String(qty);
}

export function formatQty(qty: number, unit: string): string {
  let q = qty;
  let raw = (unit || "").trim();
  if (/^(tbsp|tablespoons?)$/i.test(raw) && q > 0 && q < 0.4) {
    q *= 3;
    raw = /^tbsp$/i.test(unit.trim()) ? "tsp" : q <= 1 ? "teaspoon" : "teaspoons";
  }
  const pretty = prettyFrac(q);
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
