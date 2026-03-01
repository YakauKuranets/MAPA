import React from 'react';

export function ClipPanel({ clip }) {
  if (!clip.activeItem) {
    return (
      <section>
        <h3 style={{ marginBottom: 8 }}>Clip</h3>
        <p style={{ margin: 0, color: '#9fb0c6' }}>Выберите клип в playlist, чтобы задать IN/OUT.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 style={{ marginBottom: 8 }}>Clip</h3>
      <p style={{ margin: '0 0 8px', color: '#9fb0c6' }}>
        Текущая позиция: {clip.formatSeconds(clip.currentPosition)}
      </p>
      <p style={{ margin: '0 0 8px', color: '#9fb0c6' }}>
        Диапазон: {clip.rangeText}
      </p>
      {clip.hasInvalidRange ? (
        <p style={{ margin: '0 0 10px', color: '#ff7f7f' }}>OUT должен быть больше IN.</p>
      ) : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={clip.markIn}>Mark IN</button>
        <button onClick={clip.markOut}>Mark OUT</button>
        <button onClick={clip.clearRange}>Reset</button>
      </div>
    </section>
  );
}
