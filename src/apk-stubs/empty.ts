export default {};
export const authMiddleware = {};
export function getRequest(): unknown {
  return undefined;
}
export function getCookie(_name?: string): unknown {
  return undefined;
}
export async function getSql(): Promise<never> {
  throw new Error("offline");
}
export async function ensureDbReady(): Promise<void> {}
