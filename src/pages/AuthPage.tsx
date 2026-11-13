import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmSignUp, resendSignUpCode, signIn, signUp } from 'aws-amplify/auth';
import { toast } from 'sonner';
import { SiteNav } from '../components/SiteNav';
import { Field } from '../components/Field';
import { api } from '../lib/amplify';
import { useAuth } from '../lib/auth';
import { ensureProfile } from '../lib/developer';

type Mode = 'signin' | 'signup' | 'confirm';
type Role = 'company' | 'developer';

export default function AuthPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const raw = params.get('next');
  const next = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<Role>('company');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [invite, setInvite] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  /** Sign in, optionally redeem the invite, then honour `next` (fixes the original redirect bug). */
  const finish = async (redeem: boolean) => {
    const r = await signIn({ username: email, password });
    if (r.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
      await resendSignUpCode({ username: email });
      setMode('confirm');
      toast.message('Please confirm your email first.');
      return;
    }
    let state = await refresh(true);
    if (redeem) {
      try {
        await api.redeemInvite(invite);
        state = await refresh(true); // new group claims arrive with a fresh token
        await ensureProfile(state.ownerGroup!, company, email);
        toast.success('Welcome to the developer studio.');
      } catch (e: any) {
        toast.error(`${e.message} Your account was created as a buyer; you can redeem a valid code later.`);
      }
    }
    nav(next ?? (state.isDeveloper ? '/dashboard' : '/'), { replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await finish(false);
      } else if (mode === 'signup') {
        await signUp({ username: email, password, options: { userAttributes: { email, name: company || email } } });
        setMode('confirm');
        toast.success('Check your email for a confirmation code.');
      } else {
        await confirmSignUp({ username: email, confirmationCode: code.trim() });
        await finish(role === 'developer' && !!invite);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const heading = mode === 'confirm' ? 'Confirm email' : mode === 'signin' ? 'Sign in' : role === 'developer' ? 'Developer sign up' : 'Create your account';
  const sub = mode === 'signin' ? 'Welcome back' : mode === 'confirm' ? 'One last step' : role === 'developer' ? 'Publish your first project' : 'Browse verified developments';
  const tab = (r: Role) => `flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-all ${role === r ? 'bg-brand text-white' : 'text-muted-foreground hover:text-white'}`;

  return (
    <div className="min-h-screen">
      <title>Sign in — INSIDER</title>
      <SiteNav />
      <div className="p-6 md:p-16 max-w-md mx-auto">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">{sub}</p>
        <h1 className="text-4xl font-serif italic mb-8">{heading}</h1>

        {mode === 'signup' && (
          <div className="flex border border-border mb-6">
            <button type="button" onClick={() => setRole('company')} className={tab('company')}>I'm a buyer</button>
            <button type="button" onClick={() => setRole('developer')} className={tab('developer')}>I'm a developer</button>
          </div>
        )}
        {mode === 'signup' && role === 'developer' && (
          <div className="mb-6 p-4 border border-border bg-card text-xs text-muted-foreground leading-relaxed">
            Developer accounts are invite-only. Enter the code handed to you by INSIDER. Without a valid code your account is created as a buyer.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'confirm' ? (
            <Field label="Confirmation code" value={code} onChange={setCode} required />
          ) : (
            <>
              {mode === 'signup' && <Field label={role === 'developer' ? 'Company name' : 'Your name or company'} value={company} onChange={setCompany} required />}
              {mode === 'signup' && role === 'developer' && <Field label="Developer invite code" value={invite} onChange={setInvite} placeholder="Handed to you by INSIDER" required />}
              <Field label="Email" type="email" value={email} onChange={setEmail} required />
              <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={8} />
            </>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50">
            {loading ? '…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Confirm'}
          </button>
        </form>

        {mode !== 'confirm' && (
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="mt-6 text-xs text-muted-foreground hover:text-white transition-colors">
            {mode === 'signin' ? 'Need an account? Sign up →' : '← Already have one? Sign in'}
          </button>
        )}
      </div>
    </div>
  );
}
