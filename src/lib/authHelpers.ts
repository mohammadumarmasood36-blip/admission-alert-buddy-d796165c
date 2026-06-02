// Maps the school's natural identifiers (staff mobile, parent admission no.)
// to the synthetic Supabase Auth emails used internally, and applies the
// password padding the bootstrap function used. Users still type their
// original password — this is invisible to them.

export const PWD_SUFFIX = "!Lov1";
export const padPassword = (p: string) => `${p}${PWD_SUFFIX}`;

export function syntheticStaffEmail(mobile: string) {
  return `staff-${mobile.replace(/\D/g, "")}@school.local`;
}
export function syntheticParentEmail(admission: string) {
  return `parent-${admission.toLowerCase().replace(/[^a-z0-9]/g, "")}@school.local`;
}
