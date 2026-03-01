import React from 'react';

export function TimelinePanel({ timeline, activeItem }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Timeline (Phase 4)</h2>
      {!activeItem ? (
        <p style={{ color: '#9fb0c6' }}>Выберите клип, чтобы активировать timeline.</p>
      ) : (
        <>
          <p style={{ marginBottom: 6 }}>Progress: {timeline.progress}%</p>
          <input
            type="range"
            min="0"
            max={Math.max(1, timeline.maxDuration)}
            value={timeline.positionSec}
            onChange={(e) => timeline.setPositionSec(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <span>Zoom: {timeline.zoom.toFixed(1)}x</span>
            <button onClick={() => timeline.setZoom((z) => Math.max(1, z - 0.2))}>-</button>
            <button onClick={() => timeline.setZoom((z) => Math.min(8, z + 0.2))}>+</button>
          </div>
        </>
      )}
    </div>
  );
}
