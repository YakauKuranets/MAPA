import { useState } from 'react';

export function useQualityState() {
  const [exposure, setExposure] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [denoise, setDenoise] = useState(0);

  function reset() {
    setExposure(0);
    setContrast(0);
    setDenoise(0);
  }

  return {
    exposure,
    contrast,
    denoise,
    setExposure,
    setContrast,
    setDenoise,
    reset,
  };
}
