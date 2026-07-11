import { Loader2 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import AuthScreen from './AuthScreen';

// Gates the app behind authentication when Supabase is configured.
// If it isn't configured (no env keys yet), the app runs normally without
// persistence so nothing breaks during local dev / static demo.
export default function AuthGate({ children }) {
  const { configured, loading, session } = useAuth();

  if (!configured) return children;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <Loader2 size={28} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return children;
}
