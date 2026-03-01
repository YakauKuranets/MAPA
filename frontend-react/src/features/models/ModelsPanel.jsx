import React, { useEffect } from 'react';

export function ModelsPanel({ models }) {
  useEffect(() => {
    models.refresh();
  }, [models]);

  return (
    <div>
      <h3 style={{ margin: '0 0 8px' }}>Models</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={models.refresh} disabled={models.loading}>Refresh</button>
        <button onClick={() => models.install('demo-model', 'https://example.com/demo-model.bin', 'demo-model.bin')} disabled={Boolean(models.busyId)}>
          Install demo
        </button>
      </div>

      {models.error ? <p style={{ color: '#ff7b7b', marginTop: 0 }}>Error: {models.error}</p> : null}

      {models.loading ? <p style={{ color: '#9fb0c6', marginTop: 0 }}>Loading models...</p> : null}

      {!models.loading && models.items.length === 0 ? (
        <p style={{ color: '#9fb0c6', marginTop: 0 }}>No models reported yet.</p>
      ) : null}

      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {models.items.map((item) => (
          <li key={item.id} style={{ marginBottom: 6 }}>
            <span>{item.id}</span>
            <span style={{ color: item.installed ? '#6fd08c' : '#f2c46f', marginLeft: 8 }}>
              {item.installed ? 'installed' : 'missing'}
            </span>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => (item.installed ? models.remove(item.id) : models.install(item.id))}
              disabled={Boolean(models.busyId)}
            >
              {item.installed ? 'Delete' : 'Install'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
