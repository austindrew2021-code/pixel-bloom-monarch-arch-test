import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { grantAdDrops } from "@/lib/arcade/server";
import { requestAd } from "@/lib/arcade/server-games";

/**
 * The rewarded-video offer — the app's revenue surface.
 *
 * Two modes, decided by the server, never by this component:
 *
 *   * **Verified** (a provider is configured): this mints a token, hands it to
 *     the ad SDK, and stops. Drops arrive only when the network's servers call
 *     `/api/ad-reward` with that token. Nothing here can credit anything.
 *   * **Unverified** (no provider configured, i.e. local development): the
 *     direct grant path is available so the loop can be built and tested.
 *
 * Wiring a real network means replacing `playRewardedVideo` below with the
 * SDK call, passing `token` as the network's custom/server-side-verification
 * data so the callback can identify the player.
 */

type AdState = { token: string; reward: number; verified: boolean };

// `_state` is unused until a network is wired; it carries the token the SDK
// call needs, which is the whole point of the integration point below.
async function playRewardedVideo(_state: AdState): Promise<void> {
  // Integration point. AdMob, Unity Ads and AppLovin all take an opaque string
  // that is echoed to the reward callback — pass `state.token` as that string
  // and the server side already handles the rest.
  //
  //   await unityAds.show("rewarded", { serverId: _state.token });
  //
  // Until one is wired, this is the placeholder that stands in for the video.
  await new Promise((resolve) => setTimeout(resolve, 600));
}

export function AdOffer({
  placement,
  label,
  onGranted,
}: {
  placement: string;
  label: string;
  onGranted?: () => void;
}) {
  const queryClient = useQueryClient();

  const watch = useMutation({
    mutationFn: async () => {
      const state = await requestAd({ data: { placement } });
      await playRewardedVideo(state);
      if (state.verified) {
        // The network credits this out of band; the client only reports that
        // the video played.
        return { credited: 0, verified: true, reward: state.reward };
      }
      const granted = await grantAdDrops();
      return { credited: granted.granted, verified: false, reward: state.reward };
    },
    onSuccess: (result) => {
      if (result.verified) {
        toast("Reward confirming — your drops land in a moment.");
      } else if (result.credited > 0) {
        toast(`+${result.credited} drops added.`);
      } else {
        toast("You have taken every bonus available today.");
      }
      void queryClient.invalidateQueries({ queryKey: ["arcade"] });
      onGranted?.();
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : "That video could not load."),
  });

  return (
    <button
      type="button"
      onClick={() => watch.mutate()}
      disabled={watch.isPending}
      className="h-11 w-full rounded-xl border border-slate-700 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:opacity-50"
    >
      {watch.isPending ? "Loading video…" : label}
    </button>
  );
}
