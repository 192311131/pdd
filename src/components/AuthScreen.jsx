import { useState } from 'react';
import { Activity, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import Logo from './Logo';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // On success, the auth listener flips the gate automatically.
      } else {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        if (!data.session) {
          setInfo('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid var(--border-light)',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Logo size={34} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            AestheticShade <span style={{ color: 'var(--primary)' }}>AI</span>
          </h1>
        </div>

        <h2 style={{ fontSize: '1.15rem', margin: '0 0 0.35rem' }}>
          {mode === 'signin' ? 'Clinician sign in' : 'Create clinician account'}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>
          {mode === 'signin' ? 'Access your saved patient cases.' : 'Cases you save are private to your account.'}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} style={inputStyle} />

          {error && <div style={{ fontSize: '0.78rem', color: 'var(--error)' }}>{error}</div>}
          {info && <div style={{ fontSize: '0.78rem', color: 'var(--success)' }}>{info}</div>}

          <button type="submit" className="btn-primary" disabled={busy} style={{ justifyContent: 'center', marginTop: '0.25rem' }}>
            {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : mode === 'signin' ? <LogIn size={15} /> : <UserPlus size={15} />}
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already registered? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
