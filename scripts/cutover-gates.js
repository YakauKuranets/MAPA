#!/usr/bin/env node

const { execSync } = require('child_process');

function runCheck(name, cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' });
    return { name, status: 'pass', cmd };
  } catch (error) {
    return {
      name,
      status: 'fail',
      cmd,
      error: (error && error.stderr ? String(error.stderr) : error.message || '').trim(),
    };
  }
}

function main() {
  const automated = [
    runCheck('renderer-target-tests', 'node --test scripts/test-renderer-target.js'),
    runCheck('verify-react-cutover', 'node scripts/verify-react-cutover.js'),
    runCheck('verify-electron-adapter-parity', 'node scripts/verify-electron-adapter-parity.js'),
    runCheck('migration-status', 'node scripts/migration-status.js'),
    runCheck('cutover-evidence', 'node scripts/collect-cutover-evidence.js'),
    runCheck('preflight-react-cutover', 'node scripts/preflight-react-cutover.js'),
  ];

  const manual = [
    {
      id: 'beta-desktop-run',
      status: 'pending',
      reason: 'Нужен ручной прогон installer/runtime в целевой desktop-среде.',
    },
    {
      id: 'product-default-mode-signoff',
      status: 'pending',
      reason: 'Нужно подтверждение продукта/релиза для дефолтного режима запуска.',
    },
    {
      id: 'legacy-freeze-removal',
      status: 'pending',
      reason: 'Legacy удаляется после подтверждённой стабильности React-path.',
    },
  ];

  const automatedPassed = automated.filter((item) => item.status === 'pass').length;
  const automatedFailed = automated.filter((item) => item.status === 'fail').length;

  process.stdout.write(`[cutover-gates] automated_passed=${automatedPassed} automated_failed=${automatedFailed}\n`);
  automated.forEach((item) => {
    process.stdout.write(`  - ${item.name}: ${item.status} (${item.cmd})\n`);
  });

  process.stdout.write(`[cutover-gates] manual_pending=${manual.length}\n`);
  manual.forEach((item, idx) => {
    process.stdout.write(`  ${idx + 1}. ${item.id}: ${item.reason}\n`);
  });

  const summary = {
    automated,
    manual,
    remainingStagesInPrinciple: manual.length,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (automatedFailed > 0) {
    process.exit(1);
  }
}

main();
