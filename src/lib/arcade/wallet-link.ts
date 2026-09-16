/**
 * The payout-wallet link message.
 *
 * Linking a wallet to a Cascade account is a *signature*, never a transaction.
 * The player signs a plain-text statement; the server recovers the signing
 * address and checks it matches the address being claimed. No approval is
 * requested, no allowance is set, no funds move, and the app never sees a
 * private key.
 *
 * The wording is deliberately explicit about that, because a signature prompt
 * that a user cannot read is how wallet-drainer phishing works — anyone
 * training players to sign opaque blobs is doing them harm. Every field in the
 * message is human-checkable against what the UI says it is doing.
 *
 * Shared by client and server so both format the message identically; a
 * mismatch of even one character changes the recovered address.
 */

export const LINK_DOMAIN = "cascade.game";

/** How long a signing challenge stays valid. Long enough to read, short enough not to sit around. */
export const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export type LinkChallenge = {
  userId: string;
  address: string;
  nonce: string;
  issuedAt: string;
};

/** EIP-55 length/shape check. Does not validate the checksum — viem does that on verify. */
export function isAddressShaped(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/** Addresses are compared lowercased; case only carries the EIP-55 checksum. */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function sameAddress(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return normalizeAddress(a) === normalizeAddress(b);
}

/**
 * Build the exact text the player signs. Every line is readable in the wallet
 * prompt, and the "no spending permission" line is there so a player can tell
 * this apart from an approval request at a glance.
 */
export function linkMessage(challenge: LinkChallenge): string {
  if (!isAddressShaped(challenge.address)) {
    throw new Error(`not an address: ${challenge.address}`);
  }
  return [
    `${LINK_DOMAIN} wants you to link a payout wallet.`,
    "",
    "Signing this proves you control this wallet so Cascade can send season",
    "prizes to it. It is not a transaction: it moves no funds and grants no",
    "spending permission.",
    "",
    `Account:  ${challenge.userId}`,
    `Wallet:   ${normalizeAddress(challenge.address)}`,
    `Nonce:    ${challenge.nonce}`,
    `Issued:   ${challenge.issuedAt}`,
  ].join("\n");
}

/** Whether a challenge is still inside its validity window. */
export function isChallengeFresh(
  challenge: Pick<LinkChallenge, "issuedAt">,
  now: Date = new Date(),
): boolean {
  const issued = Date.parse(challenge.issuedAt);
  if (Number.isNaN(issued)) return false;
  const age = now.getTime() - issued;
  // A challenge issued in the future means clock skew or a forged timestamp.
  return age >= 0 && age <= CHALLENGE_TTL_MS;
}
