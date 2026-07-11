import React, { useState } from 'react';
import { Shield, Sparkles, Activity, FileText, ArrowRight } from 'lucide-react';

export default function HeroSection({ onStart }) {
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('PT-' + Math.floor(100000 + Math.random() * 900000));
  const [caseType, setCaseType] = useState('Class IV Restoration');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter a Patient Name/ID to initialize the clinical workflow.');
      return;
    }
    onStart({ patientName, patientId, caseType, notes });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(2rem, 6vw, 4rem) 1.25rem', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(0, 242, 254, 0.1)', 
          border: '1px solid rgba(0, 242, 254, 0.2)',
          borderRadius: '50px',
          padding: '0.35rem 1rem',
          fontSize: '0.85rem',
          color: 'var(--primary)',
          marginBottom: '1.5rem',
          fontWeight: '500'
        }}>
          <Sparkles size={14} />
          AI-Powered Esthetic Restorations
        </div>
        
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', lineHeight: '1.15', marginBottom: '1.5rem', fontWeight: '800', wordBreak: 'break-word' }}>
          Objective Tooth Shade <br />
          <span className="gradient-accent-text">& Layering Analysis</span>
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1rem, 4vw, 1.2rem)', maxWidth: '700px', margin: '0 auto' }}>
          Eliminate operator subjectivity in anterior composite restorations. Capture, calibrate, and receive an automated, multi-layered material recipe based on standard dental shade guides.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '3rem',
        alignItems: 'start'
      }} className="dashboard-grid">
        
        {/* Left Side: Clinical Intake Card */}
        <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 5vw, 2.5rem)' }}>
          <h2 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} style={{ color: 'var(--primary)' }} />
            New Case Initialization
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Patient Name or Identifier *
              </label>
              <input 
                type="text" 
                value={patientName} 
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. John Doe / PT-9821" 
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
              />
            </div>

            <div className="form-2col">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Auto Patient ID
                </label>
                <input 
                  type="text" 
                  value={patientId}
                  disabled 
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-secondary)',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Anterior Restoration Case
                </label>
                <select 
                  value={caseType} 
                  onChange={(e) => setCaseType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Class IV Restoration">Class IV Restoration</option>
                  <option value="Diastema Closure">Diastema Closure</option>
                  <option value="Direct Veneer">Direct Composite Veneer</option>
                  <option value="Class III Repair">Class III Repair</option>
                  <option value="Incisal Edge Fracture">Incisal Edge Repair</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Clinical Diagnostic Notes
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe pre-op shade details, target translucency, adjacent restorations, or patient expectations..." 
                rows="3"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'start', marginTop: '0.5rem' }}>
              Initialize Scanner
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Right Side: Features/Tech Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(0, 242, 254, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0
            }}>
              <Shield size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Spectrophotometric Calibration</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Auto-corrects lighting discrepancies by analyzing relative chromaticity maps on local tooth regions.
              </p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(5, 255, 213, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-teal)',
              flexShrink: 0
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Standardized Lab Recipes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Generates dual-path and multi-layer recipes mapped across VITA Classical guide rules (A1–D4).
              </p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'rgba(138, 43, 226, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-violet)',
              flexShrink: 0
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Clinical Digital Worksheet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Easily download a detailed lab worksheet detailing composite thicknesses, translucency blends, and polishing steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
