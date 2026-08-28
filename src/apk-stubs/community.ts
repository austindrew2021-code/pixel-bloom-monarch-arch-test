/** Offline stand-ins so the Android test app never talks to a server. */
const none = async () => null;
const empty = async () => [];
const fail = async () => ({ ok: false as const, error: "offline" });

export const getMyProfile = none;
export const claimUsername = fail;
export const searchPeople = empty;
export const toggleFollow = none;
export const setNotifyPref = none;
export const listFollowing = empty;
export const saveCommunityRecipe = fail;
export const listMyRecipes = empty;
export const feedRecipes = empty;
export const listNotifications = empty;
export const markNotificationsRead = none;
export const listConversations = empty;
export const openDirectChat = none;
export const createGroupChat = none;
export const listMessages = empty;
export const sendMessage = fail;
