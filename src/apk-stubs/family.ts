export type FamilyKitchen = {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  role: string;
};

const none = async () => null;
const empty = async () => [];
const fail = async () => ({ ok: false as const, error: "offline" });

export const myKitchen = none;
export const listKitchenMembers = empty;
export const createKitchen = fail;
export const joinKitchen = fail;
export const leaveKitchen = none;
export const postKitchenEvent = none;
export const listKitchenEvents = empty;
