#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveRendererTarget } = require('./renderer-target');

const projectRoot = path.join(__dirname, '..');
const planPath = path.join(projectRoot, 'REACT_MIGRATION_PLAN.md');

function parseArgs(argv) {
  const args = {
    out: path.join(projectRoot, 'artifacts', 'react-cutover-evidence.json'),
  };

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out' && argv[i + 1]) {
      args.out = path.resolve(argv[i + 1]);
      i += 1;
    }
  }

  return args;
}

function getGitRevision() {
  try {
    return execSync('git rev-parse HEAD', { cwd: projectRoot, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function collectResolverMatrix() {
  const legacyPath = path.join(projectRoot, 'frontend', 'index.html');
  const repoDist = path.join(projectRoot, 'frontend-react', 'dist', 'index.html');
  const pkgDist = path.join('/pkg-resources', 'frontend-react', 'dist', 'index.html');

  const scenarios = [
    {
      name: 'legacy-explicit',
      env: { PLAYE_UI: 'legacy' },
      files: [],
    },
    {
      name: 'react-dev-server',
      env: { PLAYE_UI: 'react', REACT_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
      files: [],
    },
    {
      name: 'react-repo-dist',
      env: { PLAYE_UI: 'react' },
      files: [repoDist],
    },
    {
      name: 'react-packaged-dist',
      env: { PLAYE_UI: 'react' },
      files: [pkgDist],
    },
    {
      name: 'auto-fallback',
      env: { PLAYE_UI: 'auto' },
      files: [],
    },
  ];

  return scenarios.map((scenario) => {
    const existing = new Set(scenario.files);
    const target = resolveRendererTarget({
      env: scenario.env,
      projectRoot,
      resourcesPath: '/pkg-resources',
      fileExists: (candidate) => existing.has(candidate),
    });

    return {
      scenario: scenario.name,
      input: {
        PLAYE_UI: scenario.env.PLAYE_UI || '',
        REACT_DEV_SERVER_URL: scenario.env.REACT_DEV_SERVER_URL || '',
      },
      target,
      expectedLegacyPath: legacyPath,
    };
  });
}

function collectPlanSnapshot() {
  const planText = fs.readFileSync(planPath, 'utf8');
  const stageMatches = [...planText.matchAll(/^##\s+Этап\s+(\d+)\s+—\s+(.+)$/gm)].map((m) => ({
    id: Number(m[1]),
    title: m[2].trim(),
    completed: /✅/.test(m[2]),
    inProgress: /in progress/i.test(m[2]),
  }));

  const remainingSection = planText.match(/## Осталось до полного перехода([\s\S]*?)(?:\n## |$)/);
  const remainingItems = remainingSection
    ? [...remainingSection[1].matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim())
    : [];

  return {
    stagesTotal: stageMatches.length,
    completed: stageMatches.filter((s) => s.completed).length,
    inProgress: stageMatches.filter((s) => s.inProgress).length,
    pending: stageMatches.filter((s) => !s.completed && !s.inProgress).length,
    remainingSteps: remainingItems,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.dirname(args.out);
  const payload = {
    generatedAt: new Date().toISOString(),
    revision: process.env.GITHUB_SHA || getGitRevision(),
    resolverMatrix: collectResolverMatrix(),
    migrationPlan: collectPlanSnapshot(),
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(args.out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const relativePath = path.relative(projectRoot, args.out) || args.out;
  process.stdout.write(`[collect-cutover-evidence] wrote ${relativePath}\n`);
}

main();
