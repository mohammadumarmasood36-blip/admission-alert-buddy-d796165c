import { describe, it, expect } from "vitest";
import { filterTeachers, isTeacherRole } from "@/lib/roles";

describe("Our Team role filtering", () => {
  it("matches teacher role case-insensitively", () => {
    expect(isTeacherRole("teacher")).toBe(true);
    expect(isTeacherRole("Teacher")).toBe(true);
    expect(isTeacherRole("TEACHER")).toBe(true);
    expect(isTeacherRole(" teacher ")).toBe(true);
  });

  it("excludes non-teacher roles", () => {
    expect(isTeacherRole("principal")).toBe(false);
    expect(isTeacherRole("cashier")).toBe(false);
    expect(isTeacherRole("manager")).toBe(false);
    expect(isTeacherRole(null)).toBe(false);
    expect(isTeacherRole(undefined)).toBe(false);
    expect(isTeacherRole("")).toBe(false);
  });

  it("filters a mixed staff list to only teachers (any casing)", () => {
    const staff = [
      { id: "1", Role: "Teacher" },
      { id: "2", Role: "teacher" },
      { id: "3", Role: "PRINCIPAL" },
      { id: "4", Role: "cashier" },
      { id: "5", Role: "TeAcHeR" },
      { id: "6", Role: null },
    ];
    const teachers = filterTeachers(staff);
    expect(teachers.map((t) => t.id)).toEqual(["1", "2", "5"]);
  });
});
