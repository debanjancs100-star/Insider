import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const link = ({ isActive }: { isActive: boolean }) => `hover:text-white transition-colors ${isActive ? 'text-white' : ''}`;

export function SiteNav() {
  const nav = useNavigate();
  const { isDeveloper, signedIn, signOut } = useAuth();
  const out = async () => { await signOut(); nav('/', { replace: true }); };
  const ghost = 'text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors';

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 py-6 border-b border-border">
      <Link to="/" className="text-xl font-bold tracking-tighter uppercase">Insider<span className="text-brand">—</span></Link>
      <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-medium text-muted-foreground">
        <NavLink to="/" end className={link}>Marketplace</NavLink>
        {!isDeveloper && <NavLink to="/pricing" className={link}>Plans</NavLink>}
        {!signedIn && <NavLink to="/developers" className={link}>For Developers</NavLink>}
      </div>
      {isDeveloper ? (
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/dashboard')} className="px-5 py-2 bg-brand text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-110 transition-all">Dashboard</button>
          <button onClick={out} className={ghost}>Sign out</button>
        </div>
      ) : signedIn ? (
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/billing')} className="px-5 py-2 border border-border text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">My plan</button>
          <button onClick={out} className={ghost}>Sign out</button>
        </div>
      ) : (
        <button onClick={() => nav('/auth')} className="px-5 py-2 border border-border text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">Sign in</button>
      )}
    </nav>
  );
}
