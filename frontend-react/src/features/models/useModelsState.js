import { useCallback, useMemo, useState } from 'react';

function normalizeModelsMap(raw) {
  const map = raw && typeof raw === 'object' ? raw : {};
  return Object.entries(map)
    .map(([id, installed]) => ({ id, installed: Boolean(installed) }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function useModelsState(electronApi) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const map = await electronApi.checkModels();
      setItems(normalizeModelsMap(map));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, [electronApi]);

  const install = useCallback(async (modelId, url = '', filename = '') => {
    if (!modelId) return;
    setBusyId(modelId);
    setError('');
    try {
      await electronApi.downloadModel({ id: modelId, url, filename });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install model');
    } finally {
      setBusyId('');
    }
  }, [electronApi, refresh]);

  const remove = useCallback(async (modelId, filename = '') => {
    if (!modelId) return;
    setBusyId(modelId);
    setError('');
    try {
      await electronApi.deleteModel({ id: modelId, filename });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    } finally {
      setBusyId('');
    }
  }, [electronApi, refresh]);

  return useMemo(() => ({
    items,
    loading,
    busyId,
    error,
    refresh,
    install,
    remove,
  }), [items, loading, busyId, error, refresh, install, remove]);
}
