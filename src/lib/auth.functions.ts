import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";

const developerSignupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
  company_name: z.string().trim().min(1).max(120),
  code: z.string().min(1).max(200),
});

const codeVerifySchema = z.object({
  code: z.string().min(1).max(200),
});

function codeMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * Create a developer account. Requires the shared invite code.
 * The code is compared server-side using a timing-safe hash comparison, so wrong
 * attempts never reveal length or partial matches.
 */
export const signUpAsDeveloper = createServerFn({ method: "POST" })
  .inputValidator((input) => developerSignupSchema.parse(input))
  .handler(async ({ data }) => {
    const expected = process.env.DEVELOPER_INVITE_CODE;
    if (!expected) {
      // Server misconfigured — do not leak that fact to clients.
      console.error("[auth] DEVELOPER_INVITE_CODE is not set");
      return { ok: false as const, error: "Invite code is not valid." };
    }
    if (!codeMatches(data.code.trim(), expected.trim())) {
      return { ok: false as const, error: "Invite code is not valid." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create the user (email confirmed so they can sign in immediately).
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { company_name: data.company_name },
    });
    if (error || !created.user) {
      return { ok: false as const, error: error?.message ?? "Could not create account." };
    }

    // Elevate to developer. Trigger already inserted the default 'company' row —
    // we add 'developer' alongside; write policies use the developer role.
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "developer" });
    if (roleError && !roleError.message.includes("duplicate")) {
      console.error("[auth] failed to assign developer role", roleError);
    }

    return { ok: true as const };
  });

/**
 * Lightweight code check used by the sign-in form to detect that an existing
 * account should be treated as a developer sign-in. It does NOT grant access;
 * grants happen at sign-up via the admin path above. Rate-limit-friendly.
 */
export const verifyInviteCode = createServerFn({ method: "POST" })
  .inputValidator((input) => codeVerifySchema.parse(input))
  .handler(async ({ data }) => {
    const expected = process.env.DEVELOPER_INVITE_CODE;
    if (!expected) return { ok: false as const };
    return { ok: codeMatches(data.code.trim(), expected.trim()) };
  });
