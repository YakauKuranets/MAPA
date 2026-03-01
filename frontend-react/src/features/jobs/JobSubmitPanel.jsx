import React, { useMemo, useState } from 'react';
import { createApiClient } from '../../api/client.js';
import { useAppState } from '../../state/store.jsx';

export function JobSubmitPanel() {
  const { state, dispatch } = useAppState();
  const [filePath, setFilePath] = useState('D:/PLAYE/input.mp4');
  const [outputPath, setOutputPath] = useState('D:/PLAYE/output.mp4');
  const [busy, setBusy] = useState(false);

  const client = useMemo(() => createApiClient({ baseUrl: state.apiBaseUrl }), [state.apiBaseUrl]);

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        file_path: filePath,
        output_path: outputPath,
        operations: ['denoise'],
      };
      const result = await client.submitJob(payload);
      dispatch({
        type: 'jobAdded',
        payload: {
          at: new Date().toISOString(),
          taskId: result?.result?.task_id || 'unknown',
          status: result?.status || 'submitted',
        },
      });
    } catch (error) {
      dispatch({
        type: 'jobAdded',
        payload: {
          at: new Date().toISOString(),
          taskId: 'n/a',
          status: `error: ${error.message}`,
        },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Job Submit (Phase 1)</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        <label>
          File path
          <input value={filePath} onChange={(e) => setFilePath(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          Output path
          <input value={outputPath} onChange={(e) => setOutputPath(e.target.value)} style={{ width: '100%' }} />
        </label>
        <button onClick={submit} disabled={busy}>{busy ? 'Submitting...' : 'Submit job'}</button>
      </div>

      <h3>Recent jobs</h3>
      <ul>
        {state.jobs.map((job, idx) => (
          <li key={`${job.at}-${idx}`}>
            <code>{job.at}</code> — <strong>{job.taskId}</strong> — {job.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
