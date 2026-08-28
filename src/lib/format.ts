export function formatQty(qty: number, unit: string): string {
  const n =
    Number.isInteger(qty) || Math.abs(qty - Math.round(qty * 2) / 2) < 0.01
      ? Number.isInteger(qty)
        ? String(qty)
        : String(qty)
      : qty.toFixed(1).replace(/\.0$/, "");
  const pretty =
    qty === 0.25
      ? "¼"
      : qty === 0.33 || qty === 0.333
        ? "⅓"
        : qty === 0.5
          ? "½"
          : qty === 0.75
            ? "¾"
            : n;
  return unit ? `${pretty} ${unit}` : pretty;
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
