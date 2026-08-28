export type NotifyPrefs = {
  meals: boolean;
  family: boolean;
  milestones: boolean;
  dinner: boolean;
};

export const DEFAULT_NOTIFY: NotifyPrefs = {
  meals: true,
  family: true,
  milestones: true,
  dinner: true,
};

export function canPush(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function enablePush(): Promise<boolean> {
  if (!canPush()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function pushNote(title: string, body: string) {
  if (!canPush()) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: `spoonful-${title}` });
  } catch {
    // Some in-app browsers block constructor notifications.
  }
}

export function msUntilHour(hour: number, from = new Date()): number {
  const target = new Date(from);
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= from.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - from.getTime();
}
