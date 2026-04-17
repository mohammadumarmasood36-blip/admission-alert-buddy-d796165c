import type { ClassName } from "@/context/SchoolContext";

export const SENIOR_CLASSES: ClassName[] = ["9th", "10th", "11th", "12th"];

export function isSeniorClass(className: string): boolean {
  return SENIOR_CLASSES.includes(className as ClassName);
}
