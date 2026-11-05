import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole, type AppRole } from "@/lib/roles.functions";

/**
 * Returns the current user's role, or null when signed out / role not loaded yet.
 * Uses TanStack Query for caching; refetches on sign-in/out via __root.tsx.
 */
export function useMyRole() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const query = useQuery({
    queryKey: ["my-role"],
    queryFn: () => getMyRole(),
    enabled: signedIn === true,
    staleTime: 60_000,
  });

  return {
    role: (query.data ?? null) as AppRole | null,
    isLoading: signedIn === null || (signedIn && query.isLoading),
    signedIn: !!signedIn,
  };
}
