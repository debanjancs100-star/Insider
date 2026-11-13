import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchAuthSession, signOut as awsSignOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

type State = { loading: boolean; signedIn: boolean; sub: string | null; identityId: string | null; ownerGroup: string | null; isDeveloper: boolean };
type Ctx = State & {
  role: 'developer' | 'company' | null;
  refresh: (force?: boolean) => Promise<State>;
  signOut: () => Promise<void>;
};

const empty: State = { loading: true, signedIn: false, sub: null, identityId: null, ownerGroup: null, isDeveloper: false };
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);

  const refresh = useCallback(async (force = false) => {
    let next: State = { ...empty, loading: false };
    try {
      const s = await fetchAuthSession({ forceRefresh: force });
      if (s.tokens && s.userSub) {
        const groups = (s.tokens.accessToken.payload['cognito:groups'] as string[] | undefined) ?? [];
        const ownerGroup = `dev_${s.userSub}`;
        next = { loading: false, signedIn: true, sub: s.userSub, identityId: s.identityId ?? null, ownerGroup, isDeveloper: groups.includes(ownerGroup) };
      }
    } catch { /* signed out */ }
    setState(next);
    return next;
  }, []);

  useEffect(() => {
    refresh();
    return Hub.listen('auth', ({ payload }) => {
      if (['signedIn', 'signedOut', 'tokenRefresh'].includes(payload.event)) refresh();
    });
  }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    ...state,
    role: state.isDeveloper ? 'developer' : state.signedIn ? 'company' : null,
    refresh,
    signOut: async () => { await awsSignOut(); await refresh(); },
  }), [state, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
