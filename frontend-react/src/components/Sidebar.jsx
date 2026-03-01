import React from 'react';

export function Sidebar({ apiBaseUrl, health, onResolveApi, onPing }) {
  const healthText = health.status === 'success'
    ? 'Backend доступен'
    : health.status === 'error'
      ? `Ошибка: ${health.error}`
      : health.status === 'loading'
        ? 'Проверка...'
        : 'Не проверено';

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>System</h2>
      <p style={{ margin: 0, color: '#9fb0c6', wordBreak: 'break-all' }}><strong>API:</strong> {apiBaseUrl}</p>
      <p style={{ color: '#9fb0c6' }}>{healthText}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onResolveApi}>Resolve API URL</button>
        <button onClick={onPing}>Ping</button>
      </div>
    </div>
  );
}
