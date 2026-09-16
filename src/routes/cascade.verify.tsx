import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { verifyCommitment } from "@/lib/arcade/fair";
import { verifyDrop } from "@/lib/arcade/plinko";
import { getSeasonProof } from "@/lib/arcade/server";
import { seasonId } from "@/lib/arcade/season";
import { RedirectToSignIn, SignedIn, SignedOut } from "@/lib/auth/gates";

export const Route = createFileRoute("/cascade/verify")({ component: Page });

function Page() {
  return (
    <>
      <SignedIn>
        <Verify />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

type Check = {
  commitmentOk: boolean;
  total: number;
  matched: number;
  mismatches: number[];
};

/**
 * Independent verification, run in the player's own browser.
 *
 * Nothing here trusts the server's word: it re-hashes the revealed seed against
 * the commitment published before the season opened, then recomputes every drop
 * from scratch and compares. A single mismatch is reported loudly, because a
 * single mismatch would mean the record was altered.
 */
function Verify() {
  const [season, setSeason] = useState(seasonId());
  const [check, setCheck] = useState<Check | null>(null);
  const [checking, setChecking] = useState(false);

  const proof = useQuery({
    queryKey: ["arcade", "proof", season],
    queryFn: () => getSeasonProof({ data: { seasonId: season } }),
    retry: false,
  });

  const run = async () => {
    const data = proof.data;
    if (!data?.serverSeed) return;
    setChecking(true);
    try {
      const commitmentOk = await verifyCommitment(data.serverSeed, data.serverSeedHash);
      const mismatches: number[] = [];
      for (const drop of data.drops) {
        const ok = await verifyDrop(
          data.serverSeed,
          drop.client_seed,
          drop.nonce,
          { path: drop.path, slot: drop.slot, points: drop.points },
          drop.rows,
        );
        if (!ok) mismatches.push(drop.nonce);
      }
      setCheck({
        commitmentOk,
        total: data.drops.length,
        matched: data.drops.length - mismatches.length,
        mismatches,
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-200">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/cascade" className="text-xs text-amber-400 underline underline-offset-2">
          ← Back to the board
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-50">Verify a season</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Cascade commits to a random server seed before each season opens by
          publishing its SHA-256 hash, and reveals the seed once the season closes.
          This page re-hashes the revealed seed to confirm it matches that
          commitment, then recomputes every one of your drops from it. All of it
          runs here, in your browser.
        </p>

        <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          Season
          <input
            value={season}
            onChange={(e) => {
              setSeason(e.target.value);
              setCheck(null);
            }}
            placeholder="2026-09"
            className="mt-1 block w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100"
          />
        </label>

        {proof.isError ? (
          <p className="mt-4 text-sm text-slate-400">No season with that id.</p>
        ) : null}

        {proof.data ? (
          <div className="mt-5 space-y-3">
            <Field label="Commitment published before the season opened">
              {proof.data.serverSeedHash}
            </Field>
            <Field label="Revealed server seed">
              {proof.data.serverSeed ?? (
                <span className="text-amber-400">
                  Withheld until the season closes — revealing it now would let
                  anyone predict every remaining drop.
                </span>
              )}
            </Field>
            <p className="text-xs text-slate-500">
              Status: {proof.data.status} · {proof.data.drops.length} of your drops on
              record
            </p>

            {proof.data.serverSeed ? (
              <button
                type="button"
                onClick={run}
                disabled={checking}
                className="h-11 w-full rounded-xl bg-amber-500 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                {checking ? "Recomputing…" : "Recompute every drop"}
              </button>
            ) : null}
          </div>
        ) : null}

        {check ? (
          <div
            className={`mt-5 rounded-xl border p-4 ${
              check.commitmentOk && check.mismatches.length === 0
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-red-500/40 bg-red-500/5"
            }`}
          >
            <p className="text-sm font-bold text-slate-100">
              {check.commitmentOk && check.mismatches.length === 0
                ? "Verified"
                : "Verification failed"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>
                {check.commitmentOk ? "✓" : "✗"} Revealed seed hashes to the published
                commitment
              </li>
              <li>
                {check.mismatches.length === 0 ? "✓" : "✗"} {check.matched} of{" "}
                {check.total} drops recomputed to the stored result
              </li>
            </ul>
            {check.mismatches.length > 0 ? (
              <p className="mt-2 text-xs text-red-300">
                Mismatched drops (by nonce): {check.mismatches.join(", ")}. Please
                report this.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 break-all font-mono text-xs text-slate-300">{children}</p>
    </div>
  );
}
