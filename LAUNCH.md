# 🚀 PLAYE Studio Pro v3.0 — Инструкция по запуску

## Структура на диске D:

```
D:\PLAYE\
├── PLAYE_Studio\          ← Проект (этот архив)
│   ├── frontend\
│   ├── backend\
│   ├── electron.js
│   ├── install.ps1
│   └── package.json
├── venv\                  ← Python виртуальное окружение (создаётся install.ps1)
├── models\                ← AI модели (скачиваются автоматически)
├── .cache\                ← Кэши pip/torch/huggingface
└── temp\                  ← Временные файлы
```

---

## ШАГ 1: Распаковка

Распакуй архив в `D:\PLAYE\PLAYE_Studio\`

---

## ШАГ 2: Установка (один раз)

Открой **PowerShell** от Администратора:

```powershell
# Разрешить скрипты
Set-ExecutionPolicy -Scope Process Bypass

# Перейти в папку проекта
cd D:\PLAYE\PLAYE_Studio

# Запустить установку (выберешь профиль)
.\install.ps1
```

**Профили:**
| Профиль | RAM | GPU | Что работает |
|---------|-----|-----|-------------|
| **Lite** | 4-8 GB | Нет | Видеоплеер, ELA, Deblur, OCR, маркеры, дела |
| **Standard** | 16 GB | GTX 1060+ | + Face Restore, Upscale, YOLO, SAM 2, Denoise |
| **Full** | 32 GB | RTX 3060+ | + PaddleOCR, 3D Reconstruction, всё |

Установка займёт 5-20 минут (скачивание PyTorch и моделей).

---

## ШАГ 3: Запуск

### Вариант A: Electron (рабочий стол)

```powershell
cd D:\PLAYE\PLAYE_Studio
npm run dev
```

Откроется окно PLAYE Studio. Backend запустится автоматически.

### Вариант B: Только Backend (для разработки/тестов)

**Терминал 1 — Backend:**
```powershell
D:\PLAYE\venv\Scripts\Activate.ps1
cd D:\PLAYE\PLAYE_Studio\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Терминал 2 — Frontend:**
Открой `D:\PLAYE\PLAYE_Studio\frontend\index.html` в браузере.

---

## ШАГ 4: Проверка

После запуска backend, проверь:

```
http://127.0.0.1:8000/         → {"service":"PLAYE Studio Pro","version":"3.0.0","status":"ready"}
http://127.0.0.1:8000/health   → {"status":"ok"}
http://127.0.0.1:8000/api/telemetry  → CPU/RAM/GPU метрики
```

---

## Запуск тестов

### E2E тест (все 5 фаз):

```powershell
# Сначала запусти backend (Вариант B, Терминал 1)
# Потом в другом терминале:

cd D:\PLAYE\PLAYE_Studio

# Вариант 1: через Node (без зависимостей)
node tests/e2e/global_final_test.spec.js

# Вариант 2: через Playwright (надо установить)
npm install @playwright/test
npx playwright test tests/e2e/global_final_test.spec.js
```

### Unit-тесты:

```powershell
# Frontend
npm test

# Backend
D:\PLAYE\venv\Scripts\Activate.ps1
cd backend
python -m pytest tests/ -v
```

---

## Решение проблем

| Проблема | Решение |
|----------|---------|
| `Python не найден` | Установи Python 3.12 и запусти `install.ps1` |
| `torch not found` | Запусти `install.ps1` заново с нужным профилем |
| `Port 8000 занят` | Backend автоматически найдёт свободный порт |
| `Нет места на C:` | Всё на D: — кэши, venv, модели, temp |
| `CUDA not available` | Профиль Lite работает без GPU (CPU-only) |
| `npm run dev — белый экран` | Запусти backend вручную (Вариант B) и проверь http://127.0.0.1:8000/ |

---

## Быстрый старт (копируй целиком)

```powershell
Set-ExecutionPolicy -Scope Process Bypass
cd D:\PLAYE\PLAYE_Studio
.\install.ps1 -Profile standard
npm run dev
```
