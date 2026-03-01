# React Migration Plan (Detailed + Execution Log)

Цель: перенести legacy UI (`frontend/`) на React поэтапно, без простоя desktop-приложения.

## Правила перехода
1. Каждый этап заканчивается проверкой (build/smoke/static checks).
2. После успешной проверки фиксируем этап в этом файле.
3. Не трогаем legacy поведение до готовности React эквивалента.

## Этап 0 — Bootstrap ✅
**Статус:** завершён.
- Поднят отдельный `frontend-react/` (Vite + React).
- Добавлены root scripts (`react:dev`, `react:build`).

## Этап 1 — Foundation & Shared Contracts ✅
**Статус:** завершён.
- `src/api/client.js`
- `src/electron/adapter.js`
- `src/state/store.jsx`

## Этап 2 — App Shell & First Feature Slice ✅
**Статус:** завершён.
- `components/AppShell.jsx`
- `components/Sidebar.jsx`
- `components/Viewer.jsx`
- `features/jobs/JobSubmitPanel.jsx`
- Интеграция в `App.jsx`

## Этап 3 — Feature Parity (playlist/player baseline) ✅
**Статус:** завершён.
- `features/playlist/usePlaylistState.js`
- `features/playlist/PlaylistPanel.jsx`
- `features/player/PlayerPanel.jsx`
- Обновлены `components/Viewer.jsx`, `App.jsx`

## Этап 4 — Timeline + Quality ✅
**Статус:** завершён.

### Сделано
- Timeline:
  - `features/timeline/useTimelineState.js`
  - `features/timeline/TimelinePanel.jsx`
- Quality:
  - `features/quality/useQualityState.js`
  - `features/quality/QualityPanel.jsx`
- Интеграция:
  - `features/player/PlayerPanel.jsx` (sync with timeline)
  - `components/Viewer.jsx` (timeline + quality snapshot)
  - `App.jsx` (composed with timeline + quality)

### Проверки этапа
- `python3 -m json.tool frontend-react/package.json >/dev/null`
- `node --check frontend-react/src/features/playlist/usePlaylistState.js`
- `node --check frontend-react/src/features/timeline/useTimelineState.js`
- `node --check frontend-react/src/features/quality/useQualityState.js`

## Этап 5 — Electron Cutover ✅
**Статус:** частично завершён (beta-ready).

### Сделано
1. Добавлен feature-flag выбора renderer: `PLAYE_UI=react`.
2. В `electron.js` добавлен resolver источника UI:
   - `REACT_DEV_SERVER_URL` -> загрузка dev server URL,
   - `frontend-react/dist/index.html` -> загрузка production React build,
   - fallback на `frontend/index.html`.
3. Добавлен безопасный fallback с предупреждением в логе, если React-артефакты отсутствуют.

### Что осталось
- Beta прогон в целевой desktop-среде с установленными npm-пакетами для React build.
- Проверка упакованного режима (resourcesPath) на installer-сборке.

### Добавлено для беты
- Скрипт `npm run react:electron` (запускает Electron в режиме `PLAYE_UI=react` с dev server URL по умолчанию `http://127.0.0.1:5173`).
- В `electron.js` добавлен поиск React dist как в dev-репозитории, так и в `process.resourcesPath`.

## Этап 6 — Final Switch (in progress)
- Переключение по умолчанию на React renderer.
- Legacy код переводится в режим fallback до полного удаления.

### Прогресс
- Добавлены build-скрипты для desktop React-пайплайна:
  - `npm run build:react-renderer`
  - `npm run build:desktop-react`
- В electron-builder `files` добавлен `frontend-react/dist/**/*` для упаковки React renderer в desktop билд.
- В React shell добавлен baseline `ModelsPanel` (`features/models/*`) с интеграцией `checkModels` / `downloadModel` / `deleteModel` через Electron adapter.

## Доп. валидация cutover
- Добавлен unit-тест выбора renderer: `npm run test:renderer-target`.
- Логика выбора renderer вынесена в `scripts/renderer-target.js` для независимой проверки.

- Добавлена автоматическая проверка готовности cutover: `npm run verify:react-cutover`.

- Добавлена проверка parity между `preload.js` и React fallback adapter: `npm run verify:electron-adapter-parity` (чтобы bridge-методы не расходились при cutover).
- CI smoke workflow обновлён: React cutover проверки (`test:renderer-target`, `verify:react-cutover`) и исправлены пути запуска Python-скриптов.

- Добавлен режим `PLAYE_UI=auto`: пытается загрузить React renderer (dev/dist), иначе fallback на legacy без ручного переключения.


## Осталось до полного перехода
1. Beta-прогон desktop с реальными зависимостями и React build.
2. Финальное решение по дефолтному режиму запуска (auto уже включен, нужно подтверждение продуктом).
3. Удаление/заморозка legacy UI после стабилизации.

Итого: **3 шага**.

- Скрипты запуска Electron унифицированы через `scripts/run-electron-ui.js` (`react`, `auto`, `legacy`).

- Добавлен отчёт статуса миграции: `npm run migration:status` (показывает completed/in-progress/pending и количество оставшихся шагов).
- Добавлен отчёт по gate-готовности cutover: `npm run cutover:gates` (сводит автоматические проверки и отдельно фиксирует ручные pending-gates).
- Добавлен preflight-чек для окружения перед ручным beta-прогоном: `npm run preflight:react-cutover` (показывает required/optional зависимости и чеклист команд для вашей среды).

- Добавлен сбор evidence-артефакта по cutover: `npm run cutover:evidence` (формирует `artifacts/react-cutover-evidence.json` с resolver matrix + snapshot плана миграции).
- CI публикует `artifacts/react-cutover-evidence.json` как artifact `react-cutover-evidence` для аудита результатов между прогонами.


## Почему всё ещё осталось 3 этапа
1. **Нужен реальный beta-прогон desktop**: текущие проверки покрывают логику выбора renderer и конфиг, но не подтверждают полный UX в целевом установочном окружении (installer + runtime).
2. **Нужно продуктовое решение по default-режиму**: технически `auto` уже внедрён, но требуется финальное подтверждение владельцами продукта/релиза, что это дефолт для всех каналов поставки.
3. **Legacy UI пока остаётся как safety-net**: до подтверждённой стабильности React-пути удаление legacy создаёт риск регресса и потери fallback-механизма.
