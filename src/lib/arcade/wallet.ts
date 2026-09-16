/**
 * Browser-side wallet connection. Client module — never imported by the server.
 *
 * Uses EIP-6963 provider discovery so every installed wallet is offered by name
 * rather than whichever one won the race to claim `window.ethereum`. MetaMask,
 * Rabby, Coinbase Wallet and the rest all announce themselves the same way.
 *
 * The only two RPC methods used are `eth_requestAccounts` and `personal_sign`.
 * Cascade never requests an approval, never builds a transaction, and never
 * asks for a private key or seed phrase.
 */

export type WalletInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

export type DiscoveredWallet = { info: WalletInfo; provider: Eip1193Provider };

type AnnounceEvent = CustomEvent<DiscoveredWallet>;

/**
 * Collect wallets that announce themselves within `waitMs`.
 *
 * Discovery is a broadcast with no completion signal, so a short settle window
 * is the standard approach; extensions answer in single-digit milliseconds.
 */
export function discoverWallets(waitMs = 300): Promise<DiscoveredWallet[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  return new Promise((resolve) => {
    const found = new Map<string, DiscoveredWallet>();
    const onAnnounce = (event: Event) => {
      const detail = (event as AnnounceEvent).detail;
      if (detail?.info?.uuid) found.set(detail.info.uuid, detail);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      // Wallets predating EIP-6963 only ever set window.ethereum.
      const legacy = (window as { ethereum?: Eip1193Provider }).ethereum;
      if (found.size === 0 && legacy) {
        found.set("legacy", {
          info: { uuid: "legacy", name: "Browser wallet", icon: "", rdns: "legacy" },
          provider: legacy,
        });
      }
      resolve([...found.values()]);
    }, waitMs);
  });
}

/** True when any wallet is available to connect. */
export async function hasWallet(): Promise<boolean> {
  return (await discoverWallets()).length > 0;
}

function asAddressList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** Prompt the wallet for account access and return the selected address. */
export async function connect(wallet: DiscoveredWallet): Promise<string> {
  const accounts = asAddressList(await wallet.provider.request({ method: "eth_requestAccounts" }));
  const address = accounts[0];
  if (!address) throw new Error("No account was shared by the wallet.");
  return address;
}

/**
 * Ask the wallet to sign the link statement.
 *
 * `personal_sign` takes (message, address) in that order — reversed, wallets
 * either reject it or sign the wrong payload.
 */
export async function signLinkMessage(
  wallet: DiscoveredWallet,
  address: string,
  message: string,
): Promise<string> {
  const signature = await wallet.provider.request({
    method: "personal_sign",
    params: [message, address],
  });
  if (typeof signature !== "string") throw new Error("Wallet returned no signature.");
  return signature;
}

/** EIP-1193 user-rejection. Worth separating: it is a choice, not a fault. */
export function isUserRejection(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 4001;
}
