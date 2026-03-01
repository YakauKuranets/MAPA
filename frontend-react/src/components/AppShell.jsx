import React from 'react';

const panel = {
  border: '1px solid #2a2f3a',
  borderRadius: 12,
  padding: 16,
  background: '#11151c',
};

export function AppShell({ sidebar, viewer, controls }) {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#e5ecf7', background: '#090c12', minHeight: '100vh', padding: 16 }}>
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>PLAYE PhotoLab — React Migration</h1>
      <section style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 12 }}>
        <aside style={panel}>{sidebar}</aside>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ ...panel, minHeight: 240 }}>{viewer}</div>
          <div style={panel}>{controls}</div>
        </div>
      </section>
    </main>
  );
}
