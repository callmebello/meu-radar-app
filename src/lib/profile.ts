// Extra identity info the user adds in the card sheets — persisted locally so it
// survives reloads (real user data). Cross-device sync can later be added by
// mirroring this to Supabase.
export type ProfileData = {
  cpfName?: string;
  cpfBirth?: string;
  extraEmail?: string;
  extraPhone?: string;
  addrCep?: string;
  addrStreet?: string;
  addrCity?: string;
};

const KEY = "priva_profile";

export function getProfile(): ProfileData {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as ProfileData;
  } catch {
    return {};
  }
}

export function saveProfile(patch: Partial<ProfileData>): ProfileData {
  const next = { ...getProfile(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
