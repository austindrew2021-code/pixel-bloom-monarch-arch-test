import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FREE_DROPS_PER_DAY,
  DROPS_PER_REWARDED_AD,
  MAX_ADS_PER_DAY,
} from "@/lib/arcade/allowance";
import { SLOT_POINTS } from "@/lib/arcade/plinko";
import {
  PARTICIPATION_BONUS_DROPS,
  PARTICIPATION_MIN_DROPS,
  PRIZE_LADDER,
  totalPrizePool,
} from "@/lib/arcade/season";

export const Route = createFileRoute("/cascade/rules")({ component: Rules });

/**
 * Official rules for the monthly promotion.
 *
 * A prize promotion has to publish rules before it opens, and the rules have to
 * match what the code actually does — which is why the prize table, the daily
 * allowance and the odds below are rendered from the same constants the game
 * runs on, rather than retyped. Editing the ladder edits this page.
 *
 * The bracketed fields are the ones only the operator can fill in. They must be
 * completed, and the whole document reviewed by a promotions lawyer in the
 * states you open in, before a season runs for real money.
 */
function Rules() {
  const jackpotOdds = 1 / 2 ** 16;
  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-200">
      <article className="mx-auto w-full max-w-2xl">
        <Link to="/cascade" className="text-xs text-amber-400 underline underline-offset-2">
          ← Back to the board
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-50">Cascade Official Rules</h1>
        <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm font-semibold text-amber-300">
          NO PURCHASE OR PAYMENT OF ANY KIND IS NECESSARY TO ENTER OR WIN. A
          PURCHASE WILL NOT IMPROVE YOUR CHANCES OF WINNING. VOID WHERE PROHIBITED.
        </p>

        <Section n="1" title="Sponsor">
          <p>
            This promotion is sponsored by <Fill>[legal entity name]</Fill>,{" "}
            <Fill>[address]</Fill> (the "Sponsor"). The promotion is not sponsored,
            endorsed, administered by, or associated with Apple Inc., Google LLC,
            MetaMask, or any wallet provider.
          </p>
        </Section>

        <Section n="2" title="Eligibility">
          <p>
            Open to legal residents of the United States who are 18 years of age or
            older at the time of entry, except residents of{" "}
            <Fill>[excluded states, as advised by counsel]</Fill>. Employees of the
            Sponsor and their immediate families are not eligible. Void where
            prohibited or restricted by law.
          </p>
          <p>
            One account per person and one wallet address per account. Entries made
            through multiple accounts, automation, scripts, or any means other than
            playing the game yourself are void, and the accounts involved forfeit
            all prizes.
          </p>
        </Section>

        <Section n="3" title="Entry period">
          <p>
            Each season runs for one calendar month, beginning 00:00:00 UTC on the
            first day and ending 23:59:59 UTC on the last day of that month. The
            Sponsor's server clock is the official timekeeper.
          </p>
        </Section>

        <Section n="4" title="How to enter — free methods only">
          <p>
            Create a free account and play. Every entrant receives{" "}
            <b>{FREE_DROPS_PER_DAY} free drops each day</b>, granted automatically at
            00:00 UTC, requiring no payment and no action of any kind.
          </p>
          <p>
            Entrants may optionally watch a short video for an additional{" "}
            {DROPS_PER_REWARDED_AD} drops, up to {MAX_ADS_PER_DAY} times per day.
            This is optional and free.
          </p>
          <p>
            <b>Alternate method of entry.</b> To receive bonus drops without watching
            a video, hand-print your name, address, email and account handle on a
            3"×5" card and mail it to <Fill>[AMOE address]</Fill>. Each card received
            is worth {DROPS_PER_REWARDED_AD} drops, limit {MAX_ADS_PER_DAY} per
            person per day, and must be received within the season it applies to.
          </p>
          <p className="rounded-lg bg-slate-900 p-3 text-slate-300">
            Drops cannot be purchased, sold, traded, transferred or won from another
            entrant, and have no cash value. Cascade does not accept deposits and
            does not hold entrant funds at any time.
          </p>
        </Section>

        <Section n="5" title="How winners are determined">
          <p>
            Each drop lands in one of {SLOT_POINTS.length} slots and awards the points
            printed on that slot. Points accumulate across the season. At the close of
            the season, entrants are ranked by total points.
          </p>
          <p>
            <b>Ties are broken in this published order:</b> (1) higher point total;
            (2) fewer drops used to reach it; (3) reached that total earlier; (4)
            account identifier in ascending order. This produces exactly one ordering,
            which any entrant can recompute from the season's own published data.
          </p>
          <p>
            An entrant who has not linked a payout wallet, or whose account has been
            excluded under Section 2, is skipped when prizes are assigned, and each
            remaining entrant moves up one position.
          </p>
        </Section>

        <Section n="6" title="Prizes">
          <p>
            Prizes are fixed before each season opens and{" "}
            <b>do not vary with the number of entrants or the amount of play</b>.
            Total approximate retail value per season:{" "}
            <b>${totalPrizePool().toLocaleString()} USD</b>.
          </p>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-800">
            {PRIZE_LADDER.map((band) => (
              <div
                key={band.rankFrom}
                className="flex justify-between border-b border-slate-800/60 px-3 py-2 text-sm last:border-0"
              >
                <span>
                  {band.rankFrom === band.rankTo
                    ? `Place ${band.rankFrom}`
                    : `Places ${band.rankFrom}–${band.rankTo}`}
                </span>
                <span className="font-semibold text-emerald-400">${band.usdc} USDC</span>
              </div>
            ))}
          </div>
          <p>
            Every entrant who plays at least {PARTICIPATION_MIN_DROPS} drops in a
            season and finishes outside the paid places receives{" "}
            {PARTICIPATION_BONUS_DROPS} bonus drops in the following season. This
            bonus has no cash value and is not redeemable for anything.
          </p>
          <p>
            Cash prizes are paid in USDC to the winner's linked wallet address within{" "}
            <Fill>[30]</Fill> days of season close. Prizes are not transferable and no
            substitution is offered except by the Sponsor.
          </p>
        </Section>

        <Section n="7" title="Odds">
          <p>
            Where a ball lands is determined by chance. The board is 16 rows deep, so
            each drop has 65,536 equally likely paths and the landing slot follows a
            binomial distribution: the centre slot occurs on roughly 19.6% of drops,
            and each outer slot on {(jackpotOdds * 100).toFixed(5)}% of drops (1 in
            65,536).
          </p>
          <p>
            Odds of winning a prize depend on the number of eligible entrants and
            their point totals.
          </p>
        </Section>

        <Section n="8" title="Fairness and verification">
          <p>
            Before each season opens, the Sponsor generates a random server seed and
            publishes only its SHA-256 hash. Every drop is derived from that seed,
            the entrant's own client seed, and an increasing counter. After the
            season closes, the server seed is published. Any entrant can hash the
            revealed seed to confirm it matches the commitment made before play
            began, then recompute every drop in their own browser at{" "}
            <Link to="/cascade/verify" className="text-amber-400 underline">
              /cascade/verify
            </Link>
            .
          </p>
          <p>
            This means the Sponsor cannot change an outcome after the fact and cannot
            choose a seed that targets a particular entrant.
          </p>
        </Section>

        <Section n="9" title="Winner notification and taxes">
          <p>
            Winners are notified by email at the address on their account within{" "}
            <Fill>[7]</Fill> days of season close and must respond within{" "}
            <Fill>[14]</Fill> days. An unclaimed prize may be forfeited and awarded to
            the next eligible entrant.
          </p>
          <p>
            Winners are solely responsible for all taxes. Entrants who win{" "}
            <Fill>[$600]</Fill> or more in a calendar year must supply a completed
            IRS Form W-9 before payment and will be issued a Form 1099-MISC.
          </p>
        </Section>

        <Section n="10" title="General conditions">
          <p>
            By entering, entrants agree to these rules and to the decisions of the
            Sponsor, which are final. The Sponsor may disqualify any entrant who
            tampers with the promotion, and may suspend or amend a season if it
            cannot be run as planned, awarding prizes from valid entries received up
            to that point.
          </p>
          <p>
            For the winners list, write to <Fill>[winners list address]</Fill> after
            the season closes. Personal information is handled under the{" "}
            <Fill>[privacy policy link]</Fill>.
          </p>
        </Section>

        <p className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs leading-relaxed text-slate-400">
          <b className="text-slate-300">Before running a real season:</b> complete every
          bracketed field, have these rules reviewed by a promotions lawyer for each
          state you open in, and register and bond the promotion in New York and
          Florida if total prize value ever exceeds $5,000. The ladder above is held
          under that threshold on purpose.
        </p>
      </article>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
        {n}. {title}
      </h2>
      <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

/** Marks a value only the operator can supply, so none ships unnoticed. */
function Fill({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-500/20 px-1 text-amber-300">{children}</mark>
  );
}
