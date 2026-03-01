const path = require('path');

function isTruthy(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const normalized = String(value).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function resolveRendererTarget({
  env = process.env,
  projectRoot = __dirname,
  resourcesPath = '',
  fileExists = () => false,
} = {}) {
  const preferredUi = String(env.PLAYE_UI || 'auto').toLowerCase();
  const reactDevUrl = env.REACT_DEV_SERVER_URL;
  const legacyFrozen = isTruthy(env.PLAYE_LEGACY_UI_FROZEN, true);
  const legacyPath = path.join(projectRoot, 'frontend', 'index.html');

  if (preferredUi === 'legacy') {
    if (legacyFrozen) {
      if (reactDevUrl) {
        return { type: 'url', value: reactDevUrl, mode: 'legacy-frozen-react-dev-server' };
      }

      const reactDistCandidates = [
        path.join(projectRoot, 'frontend-react', 'dist', 'index.html'),
        resourcesPath ? path.join(resourcesPath, 'frontend-react', 'dist', 'index.html') : '',
      ].filter(Boolean);

      for (const candidate of reactDistCandidates) {
        if (fileExists(candidate)) {
          return { type: 'file', value: candidate, mode: 'legacy-frozen-react-dist' };
        }
      }

      return { type: 'file', value: legacyPath, mode: 'legacy-frozen-fallback' };
    }

    return { type: 'file', value: legacyPath, mode: 'legacy' };
  }

  if (preferredUi !== 'react' && preferredUi !== 'auto') {
    return { type: 'file', value: legacyPath, mode: 'legacy' };
  }

  if (reactDevUrl) {
    return { type: 'url', value: reactDevUrl, mode: 'react-dev-server' };
  }

  const reactDistCandidates = [
    path.join(projectRoot, 'frontend-react', 'dist', 'index.html'),
    resourcesPath ? path.join(resourcesPath, 'frontend-react', 'dist', 'index.html') : '',
  ].filter(Boolean);

  for (const candidate of reactDistCandidates) {
    if (fileExists(candidate)) {
      return { type: 'file', value: candidate, mode: 'react-dist' };
    }
  }

  return { type: 'file', value: legacyPath, mode: preferredUi === 'auto' ? 'auto-fallback' : 'legacy-fallback' };
}

module.exports = { resolveRendererTarget };
