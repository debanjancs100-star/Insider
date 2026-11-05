import { Link, useNavigate } from "@tanstack/react-router";
import { useMyRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function SiteNav() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, signedIn } = useMyRole();
  const isDeveloper = role === "developer";
  const isCompany = signedIn && role === "company";

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 py-6 border-b border-border">
      <Link to="/" className="text-xl font-bold tracking-tighter uppercase">
        Insider<span className="text-brand">—</span>
      </Link>
      <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-medium text-muted-foreground">
        <Link to="/" className="hover:text-white transition-colors" activeProps={{ className: "text-white" }}>
          Marketplace
        </Link>
        {!isDeveloper && (
          <Link to="/pricing" className="hover:text-white transition-colors" activeProps={{ className: "text-white" }}>
            Plans
          </Link>
        )}
        {!signedIn && (
          <Link to="/developers" className="hover:text-white transition-colors" activeProps={{ className: "text-white" }}>
            For Developers
          </Link>
        )}
      </div>
      {isDeveloper ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="px-5 py-2 bg-brand text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all"
          >
            Dashboard
          </button>
          <button onClick={signOut} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      ) : isCompany ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/billing" })}
            className="px-5 py-2 border border-border text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            My plan
          </button>
          <button onClick={signOut} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="px-5 py-2 border border-border text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          Sign in
        </button>
      )}
    </nav>
  );
}
