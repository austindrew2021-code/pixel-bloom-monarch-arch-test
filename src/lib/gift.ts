/** Gift a Table — a code someone else can type in Extras for 30 days of Kitchen Table. */

const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function checkDigit(body: string): string {
  let n = 7;
  for (const c of body) n = (n * 33 + c.charCodeAt(0)) % ALPH.length;
  return ALPH[n]!;
}

export function mintGiftCode(): string {
  let body = "";
  for (let i = 0; i < 4; i++) body += ALPH[Math.floor(Math.random() * ALPH.length)];
  return `GIFT-${body}${checkDigit(body)}`;
}

export function normalizeGiftCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isGiftCode(raw: string): boolean {
  const code = normalizeGiftCode(raw);
  const m = /^GIFT-([A-Z0-9]{4})([A-Z0-9])$/.exec(code);
  if (!m) return false;
  return checkDigit(m[1]!) === m[2];
}

export function giftUntilFrom(todayIso: string, days = 30): string {
  const [y, mo, d] = todayIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (mo ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function interacMemo(kind: string, testerKey: string): string {
  const k = kind.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
  return `SPOONFUL ${k} ${testerKey}`;
}
