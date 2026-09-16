import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { beginWalletLink, completeWalletLink } from "@/lib/arcade/server";
import {
  connect,
  discoverWallets,
  isUserRejection,
  signLinkMessage,
  type DiscoveredWallet,
} from "@/lib/arcade/wallet";

/**
 * Payout wallet linking.
 *
 * The copy here is deliberate: players are told, before the prompt opens, that
 * they are signing a message rather than approving a transaction, and that
 * nothing is ever requested from the wallet. Prize platforms are a favourite
 * cover for drainer phishing, so the honest version has to be legible enough
 * that a fake one looks wrong by comparison.
 */
export function WalletCard({ walletAddress }: { walletAddress: string | null }) {
  const queryClient = useQueryClient();
  const [choices, setChoices] = useState<DiscoveredWallet[] | null>(null);

  const link = useMutation({
    mutationFn: async (wallet: DiscoveredWallet) => {
      const address = await connect(wallet);
      const { message, nonce } = await beginWalletLink({ data: { address } });
      const signature = await signLinkMessage(wallet, address, message);
      return completeWalletLink({ data: { nonce, signature } });
    },
    onSuccess: (result) => {
      setChoices(null);
      toast(`Payout wallet linked: ${short(result.walletAddress)}`);
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
    },
    onError: (error) => {
      if (isUserRejection(error)) {
        toast("Signature cancelled — nothing was sent.");
        return;
      }
      toast(error instanceof Error ? error.message : "Could not link that wallet.");
    },
  });

  const open = async () => {
    const found = await discoverWallets();
    if (found.length === 0) {
      toast("No browser wallet found. Install MetaMask, Rabby or Coinbase Wallet.");
      return;
    }
    if (found.length === 1) {
      link.mutate(found[0]!);
      return;
    }
    setChoices(found);
  };

  if (walletAddress) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Payout wallet linked
        </p>
        <p className="mt-1 font-mono text-sm text-slate-200">{short(walletAddress)}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Season prizes are sent here in USDC. Cascade cannot move funds from this
          wallet — it only knows the address.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
        No payout wallet
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
        You can play and rank without one, but prizes can only be paid to a linked
        wallet. Entrants without one are skipped when the ladder is paid.
      </p>

      {choices ? (
        <div className="mt-3 grid gap-2">
          {choices.map((wallet) => (
            <button
              key={wallet.info.uuid}
              type="button"
              onClick={() => link.mutate(wallet)}
              disabled={link.isPending}
              className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-left text-sm text-slate-200 transition hover:border-slate-500 disabled:opacity-50"
            >
              {wallet.info.icon ? (
                <img src={wallet.info.icon} alt="" className="size-5 rounded" />
              ) : null}
              {wallet.info.name}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={link.isPending}
          className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {link.isPending ? "Check your wallet…" : "Link payout wallet"}
        </button>
      )}

      <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
        You sign a readable message to prove the address is yours. No transaction,
        no approval, no deposit — Cascade never asks you to send anything.
      </p>
    </div>
  );
}

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
