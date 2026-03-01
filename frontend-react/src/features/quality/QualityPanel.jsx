import React from 'react';

function Slider({ label, value, onChange, min = -100, max = 100 }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span>{label}: {value}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function QualityPanel({ quality }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Quality Controls (Phase 4)</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        <Slider label="Exposure" value={quality.exposure} onChange={quality.setExposure} />
        <Slider label="Contrast" value={quality.contrast} onChange={quality.setContrast} />
        <Slider label="Denoise" value={quality.denoise} onChange={quality.setDenoise} min={0} max={100} />
      </div>
      <button style={{ marginTop: 8 }} onClick={quality.reset}>Reset</button>
    </div>
  );
}
