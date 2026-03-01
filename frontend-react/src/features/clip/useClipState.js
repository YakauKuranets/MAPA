import { useMemo, useState } from 'react';

export function formatSeconds(value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return '00:00.000';
  }

  const totalMs = Math.round(value * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

export function getRangeText(clipIn, clipOut) {
  if (clipIn === null || clipOut === null) {
    return 'IN/OUT не задан';
  }
  return `${formatSeconds(clipIn)} → ${formatSeconds(clipOut)}`;
}

export function useClipState(activeItem, timeline) {
  const [clipIn, setClipIn] = useState(null);
  const [clipOut, setClipOut] = useState(null);

  const currentPosition = typeof timeline?.positionSec === 'number' ? timeline.positionSec : 0;
  const hasInvalidRange = clipIn !== null && clipOut !== null && clipOut <= clipIn;

  const rangeText = useMemo(() => {
    return getRangeText(clipIn, clipOut);
  }, [clipIn, clipOut]);

  const markIn = () => {
    setClipIn(currentPosition);
  };

  const markOut = () => {
    setClipOut(currentPosition);
  };

  const clearRange = () => {
    setClipIn(null);
    setClipOut(null);
  };

  return {
    activeItem,
    clipIn,
    clipOut,
    hasInvalidRange,
    rangeText,
    currentPosition,
    markIn,
    markOut,
    clearRange,
    formatSeconds,
  };
}
