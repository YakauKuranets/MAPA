# Подготовка репозитория для импорта в Gemini

Если Gemini всё равно ругается, импортируйте **батчами** (частями), а не весь репозиторий сразу.

## 1) Сгенерировать набор для импорта

```bash
python3 scripts/prepare_gemini_import.py
```

или

```bash
npm run prepare:gemini-import
```

## 2) Что будет создано

Папка `gemini-import/` со структурой:
- `batch-001/`, `batch-002/`, ... — импортировать по очереди;
- большие файлы автоматически режутся на `*.partNNN-of-NNN.*`;
- тяжёлые/бинарные файлы исключаются;
- карта в `gemini-import/gemini-import-manifest.json`.

## 3) Если всё ещё есть ошибки

Сделайте батчи ещё меньше:

```bash
python3 scripts/prepare_gemini_import.py --max-chars 12000 --max-files-per-batch 40 --max-chars-per-batch 250000
```

Практика: сначала загружайте только `batch-001`, потом добавляйте следующие.
