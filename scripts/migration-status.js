#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const planPath = path.join(__dirname, '..', 'REACT_MIGRATION_PLAN.md');
const text = fs.readFileSync(planPath, 'utf8');

const stageMatches = [...text.matchAll(/^##\s+Этап\s+(\d+)\s+—\s+(.+)$/gm)].map((m) => ({
  id: Number(m[1]),
  title: m[2].trim(),
}));

const completed = stageMatches.filter((s) => /✅/.test(s.title));
const inProgress = stageMatches.filter((s) => /in progress/i.test(s.title));
const pending = stageMatches.filter((s) => !/✅/.test(s.title) && !/in progress/i.test(s.title));

const remainingSection = text.match(/## Осталось до полного перехода([\s\S]*?)(?:\n## |$)/);
const remainingItems = remainingSection
  ? [...remainingSection[1].matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim())
  : [];

const rationaleSection = text.match(/## Почему всё ещё осталось 3 этапа([\s\S]*?)(?:\n## |$)/);
const rationaleItems = rationaleSection
  ? [...rationaleSection[1].matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim())
  : [];

process.stdout.write(`[migration-status] stages_total=${stageMatches.length}\n`);
process.stdout.write(`[migration-status] completed=${completed.length} in_progress=${inProgress.length} pending=${pending.length}\n`);
process.stdout.write(`[migration-status] remaining_steps=${remainingItems.length}\n`);

if (remainingItems.length) {
  remainingItems.forEach((item, idx) => {
    process.stdout.write(`  ${idx + 1}. ${item}\n`);
  });
}

if (rationaleItems.length) {
  process.stdout.write('[migration-status] remaining_rationale:\n');
  rationaleItems.forEach((item, idx) => {
    process.stdout.write(`  ${idx + 1}. ${item}\n`);
  });
}
