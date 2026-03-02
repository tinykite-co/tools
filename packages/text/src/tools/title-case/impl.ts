import { ValidationError } from "@tinykite/core";

export function titleCase(input: string): string {
  if (typeof input !== "string") {
    throw new ValidationError("Input must be a string.");
  }
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return "";
      }
      const first = word.charAt(0).toUpperCase();
      return `${first}${word.slice(1)}`;
    })
    .join(" ");
}
