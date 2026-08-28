export const FITNESS_SOURCES = [
  { id: "apple", label: "Apple Health", hint: "iPhone and Apple Watch — via Health Connect on Android" },
  { id: "google", label: "Health Connect", hint: "Pixel, Wear OS, and this phone's step sensor" },
  { id: "samsung", label: "Samsung Health", hint: "Galaxy watches through Health Connect" },
  { id: "garmin", label: "Garmin", hint: "Connect Garmin to Health Connect on this phone" },
  { id: "fitbit", label: "Fitbit", hint: "Fitbit app writes into Health Connect" },
  { id: "strava", label: "Strava", hint: "Runs and rides once Strava shares to Health Connect" },
] as const;

export type FitnessSourceId = (typeof FITNESS_SOURCES)[number]["id"];

/** Same three choices Health Connect, Fit, and the iPhone use. */
export type SyncAccess = "always" | "while-using";

export const SYNC_ACCESS: { id: SyncAccess; label: string; hint: string }[] = [
  {
    id: "always",
    label: "Always allow",
    hint: "Keep Fuel current even when Spoonful is closed",
  },
  {
    id: "while-using",
    label: "While using the app",
    hint: "Sync only while this kitchen is open",
  },
];
