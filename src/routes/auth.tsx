import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteNav } from "@/components/site/SiteNav";
import { signUpAsDeveloper } from "@/lib/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — INSIDER" }] }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),
  component: Auth,
});

type Mode = "signin" | "signup";
type SignupRole = "company" | "developer";

function Auth() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const returnTo = () => (next ? window.location.origin + next : window.location.origin);
  const goAfterAuth = (fallback: "/" | "/dashboard") => {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: fallback });
  };
  const [mode, setMode] = useState<Mode>("signin");
  const [signupRole, setSignupRole] = useState<SignupRole>("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (signupRole === "developer") {
          const result = await signUpAsDeveloper({
            data: { email, password, company_name: companyName, code: inviteCode },
          });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          // Sign the developer straight in — email is pre-confirmed.
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          toast.success("Welcome to the developer studio.");
          goAfterAuth("/dashboard");
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: returnTo(),
              data: { company_name: companyName },
            },
          });
          if (error) throw error;
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: returnTo() });
    if (result.error) return toast.error(String(result.error));
    if (result.redirected) return;
    goAfterAuth("/");
  };

  const heading = mode === "signin"
    ? "Sign in"
    : signupRole === "developer"
      ? "Developer sign up"
      : "Create your account";

  const subheading = mode === "signin"
    ? "Welcome back"
    : signupRole === "developer"
      ? "Publish your first project"
      : "Browse verified developments";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="p-6 md:p-16 max-w-md mx-auto">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">{subheading}</p>
        <h1 className="text-4xl font-serif italic mb-8">{heading}</h1>

        {mode === "signup" && (
          <div className="flex border border-border mb-6">
            <button
              type="button"
              onClick={() => setSignupRole("company")}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${
                signupRole === "company" ? "bg-brand text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              I'm a buyer
            </button>
            <button
              type="button"
              onClick={() => setSignupRole("developer")}
              className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${
                signupRole === "developer" ? "bg-brand text-white" : "text-muted-foreground hover:text-white"
              }`}
            >
              I'm a developer
            </button>
          </div>
        )}

        {mode === "signup" && signupRole === "developer" && (
          <div className="mb-6 p-4 border border-border bg-card text-xs text-muted-foreground leading-relaxed">
            Developer accounts are invite-only. Enter the code handed to you by INSIDER. Without a valid
            code, an account cannot be created here.
          </div>
        )}

        {mode === "signin" && (
          <>
            <button
              onClick={google}
              className="w-full py-3 border border-border text-xs uppercase tracking-widest font-bold mb-6 hover:bg-white hover:text-black transition-all"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or email</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <Input
              label={signupRole === "developer" ? "Company name" : "Your name or company"}
              value={companyName}
              onChange={setCompanyName}
              required
            />
          )}
          {mode === "signup" && signupRole === "developer" && (
            <Input
              label="Developer invite code"
              value={inviteCode}
              onChange={setInviteCode}
              required
              type="text"
              placeholder="Handed to you by INSIDER"
            />
          )}
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          <Input label="Password" type="password" value={password} onChange={setPassword} required minLength={8} />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          {mode === "signin" ? "Need an account? Sign up →" : "← Already have one? Sign in"}
        </button>
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text", required, minLength, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full bg-surface border border-border px-3 py-3 text-sm focus:border-brand focus:outline-none"
      />
    </label>
  );
}
