import { useMemo, useState } from 'react';

export function useTimelineState(activeItem) {
  const maxDuration = useMemo(() => activeItem?.durationSec || 0, [activeItem]);
  const [positionSec, setPositionSec] = useState(0);
  const [zoom, setZoom] = useState(1);

  const safePosition = Math.min(Math.max(0, positionSec), Math.max(0, maxDuration));
  const progress = maxDuration > 0 ? Math.round((safePosition / maxDuration) * 100) : 0;

  return {
    maxDuration,
    positionSec: safePosition,
    setPositionSec,
    progress,
    zoom,
    setZoom,
  };
}
