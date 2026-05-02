import { ValidationError } from "@tinykite/core";

export function titleCase(input: string): string {
  if (typeof input !== "string") {
    throw new ValidationError("Input must be a string.");
  }
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : ""))
    .join(" ");
}
