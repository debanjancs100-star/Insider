import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

/** UX gate only. Real enforcement is the AppSync/Cognito authorization on every write. */
export function Gate({ allow, redirectTo = '/', message, children }: {
  allow: 'developer' | 'company'; redirectTo?: string; message?: string; children: ReactNode;
}) {
  const { loading, signedIn, role } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!signedIn) { nav(`/auth?next=${encodeURIComponent(loc.pathname + loc.search)}`, { replace: true }); return; }
    if (role !== allow) { if (message) toast.error(message); nav(redirectTo, { replace: true }); }
  }, [loading, signedIn, role, allow, message, redirectTo, nav, loc.pathname, loc.search]);

  return !loading && role === allow ? <>{children}</> : null;
}
