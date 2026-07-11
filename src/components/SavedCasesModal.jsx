import { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2, Loader2, Inbox } from 'lucide-react';
import { listCases, deleteCase } from '../lib/cases';

export default function SavedCasesModal({ onClose, onOpen }) {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setError(null);
    try {
      setCases(await listCases());
    } catch (err) {
      setError(err.message || 'Failed to load cases.');
      setCases([]);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    setDeletingId(id);
    try {
      await deleteCase(id);
      setCases((cs) => cs.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={18} style={{ color: 'var(--primary)' }} /> Saved Cases
          </h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}><X size={16} /></button>
        </div>

        {error && <div style={{ fontSize: '0.8rem', color: 'var(--error)', marginBottom: '0.75rem' }}>{error}</div>}

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {cases === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 size={22} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : cases.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', fontSize: '0.85rem' }}>
              <Inbox size={26} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <div>No saved cases yet. Complete a case and click “Save to Database”.</div>
            </div>
          ) : (
            cases.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.patient_name || 'Unnamed'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {c.patient_id || '—'}</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {c.case_type || 'Case'} · Shade {c.detected_shade || '—'} · {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => onOpen(c)} className="btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>Open</button>
                <button onClick={() => remove(c.id)} disabled={deletingId === c.id} className="btn-secondary" style={{ padding: '0.35rem', color: 'var(--error)', borderColor: 'var(--error)' }}>
                  {deletingId === c.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
