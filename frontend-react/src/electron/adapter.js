export function getElectronApi() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }

  return {
    getApiUrl: async () => {
      const port = Number(window.API_PORT || 8000);
      return `http://127.0.0.1:${port}/api`;
    },
    openFolder: async () => {},
    downloadModel: async () => ({ status: 'unavailable' }),
    downloadAllModels: async () => ({ status: 'unavailable' }),
    deleteModel: async () => ({ status: 'unavailable' }),
    checkModels: async () => ({}),
    onDownloadProgress: () => () => {},
    onModelStatusChanged: () => () => {},
  };
}
