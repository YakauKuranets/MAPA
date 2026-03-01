import React from 'react';

export function Viewer({ activeItem, timeline, quality }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Viewer (Phase 4)</h2>
      {activeItem ? (
        <>
          <p style={{ marginBottom: 4 }}><strong>Active clip:</strong> {activeItem.name}</p>
          <p style={{ color: '#9fb0c6', marginTop: 0 }}>Duration: {activeItem.durationSec}s</p>
          <p style={{ color: '#9fb0c6', marginTop: 0 }}>Timeline: {timeline.positionSec}s ({timeline.progress}%) · Zoom {timeline.zoom.toFixed(1)}x</p>
          <p style={{ color: '#9fb0c6', marginTop: 0 }}>Quality: exp {quality.exposure}, ctr {quality.contrast}, denoise {quality.denoise}</p>
        </>
      ) : (
        <p style={{ color: '#9fb0c6' }}>Выберите клип из playlist для просмотра метаданных.</p>
      )}
    </div>
  );
}
