import React from 'react';

export function PlaylistPanel({ playlist }) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Playlist (Phase 3)</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={playlist.addMockItem}>+ Add mock clip</button>
      </div>

      {playlist.items.length === 0 ? (
        <p style={{ color: '#9fb0c6' }}>Пока пусто. Добавьте тестовый клип.</p>
      ) : (
        <ul style={{ paddingLeft: 16 }}>
          {playlist.items.map((item) => (
            <li key={item.id} style={{ marginBottom: 6 }}>
              <button onClick={() => playlist.setActiveId(item.id)}>
                {playlist.activeId === item.id ? '▶ ' : ''}
                {item.name} ({item.durationSec}s)
              </button>
              <button onClick={() => playlist.removeItem(item.id)} style={{ marginLeft: 8 }}>remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
