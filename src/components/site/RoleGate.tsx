import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMyRole } from "@/hooks/use-role";
import type { AppRole } from "@/lib/roles.functions";

/**
 * Client-side role gate for pages already inside `_authenticated`.
 * Server-side RLS is the real enforcement; this just gives non-matching users
 * a clean redirect instead of a scary permission error.
 */
export function RoleGate({
  allow,
  redirectTo = "/",
  message,
  children,
}: {
  allow: AppRole;
  redirectTo?: string;
  message?: string;
  children: React.ReactNode;
}) {
  const { role, isLoading } = useMyRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (role !== allow) {
      if (message) toast.error(message);
      navigate({ to: redirectTo });
    }
  }, [role, isLoading, allow, navigate, redirectTo, message]);

  if (isLoading || role !== allow) return null;
  return <>{children}</>;
}
