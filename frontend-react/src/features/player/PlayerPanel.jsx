import React, { useState } from 'react';

export function PlayerPanel({ activeItem, timeline }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Player Controls (Phase 4)</h2>
      {!activeItem ? (
        <p style={{ color: '#9fb0c6' }}>Выберите клип из playlist.</p>
      ) : (
        <>
          <p style={{ margin: '4px 0' }}><strong>{activeItem.name}</strong></p>
          <p style={{ color: '#9fb0c6', marginTop: 0 }}>Duration: {timeline.maxDuration}s</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setIsPlaying((v) => !v)}>{isPlaying ? 'Pause' : 'Play'}</button>
            <button onClick={() => timeline.setPositionSec((v) => Math.max(0, v - 1))}>-1s</button>
            <button onClick={() => timeline.setPositionSec((v) => Math.min(timeline.maxDuration, v + 1))}>+1s</button>
          </div>

          <label>
            Position: {timeline.positionSec}s
            <input
              type="range"
              min="0"
              max={Math.max(1, timeline.maxDuration)}
              value={timeline.positionSec}
              onChange={(e) => timeline.setPositionSec(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </>
      )}
    </div>
  );
}
