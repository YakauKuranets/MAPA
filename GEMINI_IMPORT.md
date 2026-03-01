# Подготовка репозитория для импорта в Gemini

Если Gemini ругается на размер/тип файлов, используйте экспорт в отдельную папку:

```bash
python3 scripts/prepare_gemini_import.py
```

Или через npm-скрипт:

```bash
npm run prepare:gemini-import
```

По умолчанию создается папка `gemini-import/`:
- бинарные и тяжелые файлы исключаются (например, `.pth`, изображения, сборочные артефакты);
- большие текстовые файлы автоматически разбиваются на части `*.partNNN-of-NNN.*`;
- карта соответствия сохраняется в `gemini-import/gemini-import-manifest.json`.

Можно менять лимит размера файла:

```bash
python3 scripts/prepare_gemini_import.py --max-chars 12000
```
