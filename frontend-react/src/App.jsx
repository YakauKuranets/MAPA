import React, { useMemo } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Viewer } from './components/Viewer.jsx';
import { JobSubmitPanel } from './features/jobs/JobSubmitPanel.jsx';
import { PlaylistPanel } from './features/playlist/PlaylistPanel.jsx';
import { PlayerPanel } from './features/player/PlayerPanel.jsx';
import { TimelinePanel } from './features/timeline/TimelinePanel.jsx';
import { QualityPanel } from './features/quality/QualityPanel.jsx';
import { ModelsPanel } from './features/models/ModelsPanel.jsx';
import { ClipPanel } from './features/clip/ClipPanel.jsx';
import { usePlaylistState } from './features/playlist/usePlaylistState.js';
import { useTimelineState } from './features/timeline/useTimelineState.js';
import { useQualityState } from './features/quality/useQualityState.js';
import { useModelsState } from './features/models/useModelsState.js';
import { useClipState } from './features/clip/useClipState.js';
import { AppStateProvider, useAppState } from './state/store.jsx';
import { getElectronApi } from './electron/adapter.js';
import { createApiClient } from './api/client.js';

function AppContent() {
  const { state, dispatch } = useAppState();
  const client = useMemo(() => createApiClient({ baseUrl: state.apiBaseUrl }), [state.apiBaseUrl]);
  const electronApi = useMemo(() => getElectronApi(), []);
  const playlist = usePlaylistState();
  const timeline = useTimelineState(playlist.activeItem);
  const quality = useQualityState();
  const models = useModelsState(electronApi);
  const clip = useClipState(playlist.activeItem, timeline);

  const resolveApi = async () => {
    const url = await electronApi.getApiUrl();
    dispatch({ type: 'setApiBaseUrl', payload: url });
  };

  const ping = async () => {
    dispatch({ type: 'healthLoading' });
    try {
      await client.ping();
      dispatch({ type: 'healthSuccess' });
    } catch (error) {
      dispatch({ type: 'healthError', payload: error.message });
    }
  };

  return (
    <AppShell
      sidebar={<Sidebar apiBaseUrl={state.apiBaseUrl} health={state.health} onResolveApi={resolveApi} onPing={ping} />}
      viewer={<Viewer activeItem={playlist.activeItem} timeline={timeline} quality={quality} clip={clip} />}
      controls={(
        <div style={{ display: 'grid', gap: 12 }}>
          <PlaylistPanel playlist={playlist} />
          <PlayerPanel activeItem={playlist.activeItem} timeline={timeline} />
          <TimelinePanel timeline={timeline} activeItem={playlist.activeItem} />
          <ClipPanel clip={clip} />
          <QualityPanel quality={quality} />
          <ModelsPanel models={models} />
          <JobSubmitPanel />
        </div>
      )}
    />
  );
}

export function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
