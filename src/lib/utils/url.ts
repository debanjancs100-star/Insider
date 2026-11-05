import { z } from "zod";

// Zod schema for a safe http(s) URL.
export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048, { message: "URL is too long (max 2048 characters)" })
  .refine((v) => v.length === 0 || /^https?:\/\//i.test(v), {
    message: "URL must start with http:// or https://",
  })
  .refine(
    (v) => {
      if (v.length === 0) return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid URL" },
  );

export const optionalHttpUrl = httpUrlSchema.optional().or(z.literal(""));

// Slugify a string for use as a URL segment.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
