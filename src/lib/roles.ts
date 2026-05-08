/**
 * Case-insensitive role matchers used across portal & public pages.
 * Centralised so DB casing inconsistencies (e.g. "Teacher" vs "teacher")
 * never cause filtering bugs again.
 */
export function isTeacherRole(role: string | null | undefined): boolean {
  return typeof role === "string" && role.trim().toLowerCase() === "teacher";
}

export function filterTeachers<T extends { Role?: string | null; role?: string | null }>(
  rows: T[]
): T[] {
  return rows.filter((r) => isTeacherRole(r.Role ?? r.role));
}
