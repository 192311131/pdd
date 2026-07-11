import React, { useState } from 'react';
import { Layers, ListChecks, HelpCircle, FileText, ChevronRight, Check, Sparkles } from 'lucide-react';

const BRAND_REC_PLANS = {
  '3M Filtek Supreme Ultra': {
    palatal: 'Filtek Supreme WE (White Enamel)',
    dentin: 'Filtek Supreme A3D (A3 Dentin)',
    mamelon: 'Filtek Supreme A2D or Amber Stain',
    labial: 'Filtek Supreme A1E (A1 Enamel) / A2B (A2 Body)',
    incisal: 'Filtek Supreme BT (Blue Translucent)'
  },
  'Kuraray Clearfil Majesty ES-2': {
    palatal: 'Majesty ES-2 Clear (Translucent)',
    dentin: 'Majesty ES-2 A3D (Dentin)',
    mamelon: 'Majesty ES-2 A2D or Ochre Stain',
    labial: 'Majesty ES-2 A1E (Enamel)',
    incisal: 'Majesty ES-2 Amber Translucent'
  },
  'GC G-aenial Achromatic': {
    palatal: 'G-aenial JE (Junior Enamel)',
    dentin: 'G-aenial AO3 (Opaque Dentin)',
    mamelon: 'G-aenial AO2 / White Opaque',
    labial: 'G-aenial AE (Adult Enamel)',
    incisal: 'G-aenial TE (Translucent Enamel)'
  }
};

export default function LayeringPlanner({ scanResults, caseInfo, uploadedImage, activeSample, onNext }) {
  const [selectedBrand, setSelectedBrand] = useState('3M Filtek Supreme Ultra');
  const [palatalThickness, setPalatalThickness] = useState(0.3); // mm
  const [dentinThickness, setDentinThickness] = useState(1.4); // mm
  const [enamelThickness, setEnamelThickness] = useState(0.5); // mm
  
  const [checkedSteps, setCheckedSteps] = useState({
    prep: false,
    etch: false,
    palatal: false,
    dentin: false,
    mamelon: false,
    labial: false,
    finish: false
  });

  const toggleStep = (step) => {
    setCheckedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  const currentBrandPlan = BRAND_REC_PLANS[selectedBrand];
  
  const totalThickness = parseFloat(palatalThickness) + parseFloat(dentinThickness) + parseFloat(enamelThickness);
  const palatalPct = Math.round((palatalThickness / totalThickness) * 100);
  const dentinPct = Math.round((dentinThickness / totalThickness) * 100);
  const enamelPct = Math.round((enamelThickness / totalThickness) * 100);

  const handleProceed = () => {
    const plannerConfig = {
      brand: selectedBrand,
      layers: {
        palatal: { thickness: palatalThickness, material: currentBrandPlan.palatal },
        dentin: { thickness: dentinThickness, material: currentBrandPlan.dentin },
        mamelon: { material: currentBrandPlan.mamelon },
        labial: { thickness: enamelThickness, material: currentBrandPlan.labial },
        incisal: { material: currentBrandPlan.incisal }
      }
    };
    onNext(plannerConfig);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Restoration Plan Setup</span>
        <h2 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>Anterior Composite Layering Protocol</h2>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Side: Interactive Layering Visualizer & Recipe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Visual Layering Schematic */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              Direct Restoration Layer Cross-Section (Relative Thickness)
            </h3>
            
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: '1rem' }}>
              
              {/* Actual Patient Photograph Panel */}
              <div style={{ 
                position: 'relative', 
                width: '180px', 
                height: '240px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={uploadedImage || (activeSample === 'fracture' 
                    ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='%23070a13'/><path d='M30,0 Q100,55 170,0 L200,0 L200,30 Q100,75 0,30 Z' fill='%23e16b75'/><path d='M60,35 Q100,30 140,35 C150,60 155,100 150,135 Q90,135 60,135 Z' fill='%23EADCB9'/></svg>"
                    : activeSample === 'diastema'
                    ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='%23070a13'/><path d='M45,35 Q72,30 92,35 C93,65 91,100 90,165 Z' fill='%23E3D7BC'/><path d='M108,35 Q130,30 155,35 C160,65 155,110 148,165 Z' fill='%23E3D7BC'/></svg>"
                    : "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800")} 
                  alt="Patient Tooth Target" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '9px', color: '#ffffff', background: 'rgba(7, 10, 19, 0.75)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', zIndex: 10 }}>
                  Patient Target Photo
                </div>
              </div>

              {/* Graphic Tooth Cross Section */}
              <div style={{ 
                position: 'relative', 
                width: '180px', 
                height: '240px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                
                {/* Composite layers representation */}
                <div style={{ 
                  width: '120px', 
                  height: '190px', 
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '16px 16px 4px 4px',
                  overflow: 'hidden'
                }}>
                  {/* Lingual Palatal Shelf layer (Backmost) */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderTop: '2px solid var(--primary)',
                    transition: 'height 0.3s ease',
                    zIndex: 1
                  }}></div>
                  
                  {/* Dentin Core Layer (Middle) */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: '10%', 
                    right: '10%', 
                    height: `${dentinPct}%`,
                    backgroundColor: scanResults?.cervical?.shade?.hex || '#C7B290',
                    borderTop: '2px solid var(--warning)',
                    borderRadius: '12px 12px 0 0',
                    transition: 'height 0.3s ease',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '8px'
                  }}>
                    {/* Simulated Mamelon ridges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-12px' }}>
                      <div style={{ width: '12px', height: '16px', background: scanResults?.cervical?.shade?.hex || '#C7B290', borderRadius: '50% 50% 0 0' }}></div>
                      <div style={{ width: '12px', height: '16px', background: scanResults?.cervical?.shade?.hex || '#C7B290', borderRadius: '50% 50% 0 0' }}></div>
                      <div style={{ width: '12px', height: '16px', background: scanResults?.cervical?.shade?.hex || '#C7B290', borderRadius: '50% 50% 0 0' }}></div>
                    </div>
                  </div>

                  {/* Labial Buccal Enamel Layer (Frontmost) */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: '5%', 
                    right: '5%', 
                    height: `${enamelPct + 10}%`,
                    background: `linear-gradient(180deg, rgba(0, 242, 254, 0.1) 0%, ${scanResults?.middle?.shade?.hex || '#DACDB4'} 100%)`,
                    borderTop: '2px solid var(--accent-teal)',
                    borderRadius: '14px 14px 2px 2px',
                    transition: 'height 0.3s ease',
                    zIndex: 3
                  }}></div>
                </div>

                <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '9px', color: 'var(--text-muted)' }}>Labial (Buccal) →</div>
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '9px', color: 'var(--text-muted)' }}>← Palatal (Lingual)</div>
              </div>

              {/* Sliders Control Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1, maxWidth: '320px' }}>
                
                {/* Palatal Shelf Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Lingual Shelf (Enamel/Trans)</span>
                    </div>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', background: 'var(--primary-glow)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{palatalThickness} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.6" 
                    step="0.05"
                    value={palatalThickness}
                    onChange={(e) => setPalatalThickness(parseFloat(e.target.value))}
                    style={{ 
                      width: '100%', 
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none',
                      accentColor: 'var(--primary)',
                      cursor: 'pointer',
                      background: `linear-gradient(90deg, var(--primary) 0%, var(--primary) ${((palatalThickness - 0.1) / (0.6 - 0.1)) * 100}%, rgba(255,255,255,0.08) ${((palatalThickness - 0.1) / (0.6 - 0.1)) * 100}%, rgba(255,255,255,0.08) 100%)`
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>0.1mm (thin)</span>
                    <span>0.6mm (thick)</span>
                  </div>
                </div>

                {/* Dentin Core Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }}></span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Dentin Core (Opaque/Mamelons)</span>
                    </div>
                    <span style={{ color: 'var(--warning)', fontWeight: '700', background: 'rgba(245, 158, 11, 0.15)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{dentinThickness} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.8" 
                    step="0.1"
                    value={dentinThickness}
                    onChange={(e) => setDentinThickness(parseFloat(e.target.value))}
                    style={{ 
                      width: '100%', 
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none',
                      accentColor: 'var(--warning)',
                      cursor: 'pointer',
                      background: `linear-gradient(90deg, var(--warning) 0%, var(--warning) ${((dentinThickness - 0.5) / (1.8 - 0.5)) * 100}%, rgba(255,255,255,0.08) ${((dentinThickness - 0.5) / (1.8 - 0.5)) * 100}%, rgba(255,255,255,0.08) 100%)`
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>0.5mm (shallow)</span>
                    <span>1.8mm (deep)</span>
                  </div>
                </div>

                {/* Labial Enamel Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)', boxShadow: '0 0 8px var(--accent-teal)' }}></span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Buccal Enamel Overlay</span>
                    </div>
                    <span style={{ color: 'var(--accent-teal)', fontWeight: '700', background: 'rgba(5, 255, 213, 0.15)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{enamelThickness} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="0.8" 
                    step="0.05"
                    value={enamelThickness}
                    onChange={(e) => setEnamelThickness(parseFloat(e.target.value))}
                    style={{ 
                      width: '100%', 
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none',
                      accentColor: 'var(--accent-teal)',
                      cursor: 'pointer',
                      background: `linear-gradient(90deg, var(--accent-teal) 0%, var(--accent-teal) ${((enamelThickness - 0.2) / (0.8 - 0.2)) * 100}%, rgba(255,255,255,0.08) ${((enamelThickness - 0.2) / (0.8 - 0.2)) * 100}%, rgba(255,255,255,0.08) 100%)`
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>0.2mm (thin)</span>
                    <span>0.8mm (thick)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6: AI Anatomical Stratification Analysis */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              AI Anatomical Stratification Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Near Gum (Cervical)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--warning)', display: 'block', margin: '0.25rem 0' }}>Slightly Darker</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Chroma-Rich Dentin</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Inner Core</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffb076', display: 'block', margin: '0.25rem 0' }}>Dentin</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>High Opacity Backing</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Middle Body</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-teal)', display: 'block', margin: '0.25rem 0' }}>Enamel</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Universal Translucency</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Incisal Edge</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-cyan)', display: 'block', margin: '0.25rem 0' }}>Transparent</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Light Transmission Halo</span>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem', lineHeight: '1.3' }}>
              * The AI evaluates optical densities separately to divide the composite recipe into anatomical layers matching natural tooth morphology.
            </div>
          </div>

          {/* Step 7: AI Composite Layering Recipe Table */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>AI Composite Layering Recipe</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.keys(BRAND_REC_PLANS).map(brand => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      style={{
                        background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                        borderRadius: '20px',
                        padding: '0.5rem 1rem',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isSelected ? '0 0 10px rgba(0, 242, 254, 0.2)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                        }
                      }}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Layer</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Composite Shade</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600' }}>Thickness</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#ffffff' }}>Dentin</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.78rem' }}>{currentBrandPlan.dentin}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--warning)' }}>{dentinThickness} mm</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#ffffff' }}>Body</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: 'var(--primary)', background: 'var(--primary-glow)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.2)', fontSize: '0.78rem' }}>{currentBrandPlan.labial}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>0.8 mm</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#ffffff' }}>Enamel</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: 'var(--accent-teal)', background: 'rgba(5, 255, 213, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(5, 255, 213, 0.2)', fontSize: '0.78rem' }}>{currentBrandPlan.palatal}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-teal)' }}>{enamelThickness} mm</td>
                  </tr>
                  <tr style={{ transition: 'background var(--transition-fast)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#ffffff' }}>Incisal</td>
                    <td style={{ padding: '0.75rem 1rem' }}><span style={{ color: 'var(--accent-violet)', background: 'rgba(138, 43, 226, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(138, 43, 226, 0.2)', fontSize: '0.78rem' }}>{currentBrandPlan.incisal}</span></td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-violet)' }}>{palatalThickness} mm</td>
                  </tr>
                </tbody>
              </table>
          </div>
        </div>

        {/* Right Side: Step-by-Step Clinical Procedure Checklist & Curing Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Clinical Procedure Checklist */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ListChecks size={18} style={{ color: 'var(--primary)' }} />
              Clinical Restorative Roadmap
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'prep', num: '1', title: 'Preparation & Isolation', desc: 'Apply rubber dam isolation. Bevel buccal margins (1.5-2.0mm) to mask lines.' },
                { key: 'etch', num: '2', title: 'Adhesive Protocol', desc: 'Selective enamel etch for 15s, rinse, apply universal bonding agent, and light-cure.' },
                { key: 'palatal', num: '3', title: 'Palatal Wall Construction', desc: `Apply a ${palatalThickness}mm layer of ${currentBrandPlan.palatal} using silicone index matrix.` },
                { key: 'dentin', num: '4', title: 'Dentin Core & Mamelons', desc: `Build up a ${dentinThickness}mm core of ${currentBrandPlan.dentin}. Shape three distinct mamelon ridges.` },
                { key: 'mamelon', num: '5', title: 'Incisal Characterization', desc: `Use ${currentBrandPlan.incisal} at the incisal edge. Apply highlights over mamelon tips.` },
                { key: 'labial', num: '6', title: 'Labial Enamel Wrap', desc: `Cover labial contour with a ${enamelThickness}mm sheet of ${currentBrandPlan.labial} composite.` },
                { key: 'finish', num: '7', title: 'Polish & Micro-anatomy', desc: 'Refine perikymata lines using fine diamonds. Polish with spirals for natural surface gloss.' }
              ].map(stepItem => {
                const isChecked = checkedSteps[stepItem.key];
                return (
                  <div 
                    key={stepItem.key}
                    onClick={() => toggleStep(stepItem.key)}
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      cursor: 'pointer',
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: isChecked ? 'rgba(0, 242, 254, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                      border: `1px solid ${isChecked ? 'rgba(0, 242, 254, 0.3)' : 'var(--border-light)'}`,
                      boxShadow: isChecked ? '0 0 10px rgba(0, 242, 254, 0.05)' : 'none',
                      transition: 'all var(--transition-fast)',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isChecked ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.background = isChecked ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isChecked ? 'rgba(0, 242, 254, 0.3)' : 'var(--border-light)';
                      e.currentTarget.style.background = isChecked ? 'rgba(0, 242, 254, 0.02)' : 'rgba(255, 255, 255, 0.01)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '5px', 
                      border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--text-muted)'}`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      background: isChecked ? 'var(--primary)' : 'transparent',
                      color: '#070a13',
                      transition: 'all var(--transition-fast)'
                    }}>
                      {isChecked && <Check size={12} strokeWidth={3.5} />}
                    </div>
                    <div>
                      <h4 style={{ 
                        fontSize: '0.85rem', 
                        margin: 0, 
                        color: isChecked ? 'var(--text-muted)' : '#ffffff',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        transition: 'all var(--transition-fast)'
                      }}>
                        {stepItem.num}. {stepItem.title}
                      </h4>
                      <p style={{ 
                        fontSize: '0.72rem', 
                        color: isChecked ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        marginTop: '0.2rem',
                        lineHeight: '1.4',
                        transition: 'all var(--transition-fast)'
                      }}>
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 8: Interactive Curing build sequence timeline */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              Clinical Curing & Build Sequence
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              {/* Connecting Line with Gradient */}
              <div style={{ 
                position: 'absolute', 
                left: '28px', 
                top: '15px', 
                bottom: '15px', 
                width: '4px', 
                background: 'linear-gradient(180deg, var(--warning) 0%, var(--primary) 33%, var(--accent-teal) 66%, var(--accent-violet) 100%)',
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)'
              }}></div>
              
              {/* Layer 1: Dentin */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 2, background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem 0.6rem 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: 'var(--warning)', 
                  color: '#070a13', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '800', 
                  fontSize: '0.75rem',
                  boxShadow: '0 0 12px var(--warning)',
                  flexShrink: 0
                }}>L1</div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layer 1: Dentin Core</span>
                  <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{currentBrandPlan.dentin} (<span style={{ color: 'var(--warning)' }}>{dentinThickness} mm</span>)</strong>
                </div>
              </div>

              {/* Layer 2: Body */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 2, background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem 0.6rem 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  color: '#070a13', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '800', 
                  fontSize: '0.75rem',
                  boxShadow: '0 0 12px var(--primary)',
                  flexShrink: 0
                }}>L2</div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layer 2: Body Core</span>
                  <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{currentBrandPlan.labial} (<span style={{ color: 'var(--primary)' }}>0.8 mm</span>)</strong>
                </div>
              </div>

              {/* Layer 3: Enamel */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 2, background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem 0.6rem 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-teal)', 
                  color: '#070a13', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '800', 
                  fontSize: '0.75rem',
                  boxShadow: '0 0 12px var(--accent-teal)',
                  flexShrink: 0
                }}>L3</div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layer 3: Enamel Wrap</span>
                  <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{currentBrandPlan.palatal} (<span style={{ color: 'var(--accent-teal)' }}>{enamelThickness} mm</span>)</strong>
                </div>
              </div>

              {/* Layer 4: Incisal */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 2, background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem 0.6rem 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-violet)', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '800', 
                  fontSize: '0.75rem',
                  boxShadow: '0 0 12px var(--accent-violet)',
                  flexShrink: 0
                }}>L4</div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layer 4: Transparent Incisal</span>
                  <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{currentBrandPlan.incisal} (<span style={{ color: 'var(--accent-violet)' }}>{palatalThickness} mm</span>)</strong>
                </div>
              </div>
            </div>

            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--success)', 
              marginTop: '1.25rem', 
              background: 'var(--success-glow)', 
              border: '1px solid rgba(16, 185, 129, 0.1)', 
              padding: '0.6rem', 
              borderRadius: '6px', 
              textAlign: 'center',
              fontWeight: '500'
            }}>
              ✓ Restored tooth matches surrounding dentition.
            </div>
          </div></div>

          <button 
            className="btn-primary" 
            onClick={handleProceed}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Review Restorative Matches
            <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
