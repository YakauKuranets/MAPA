# ================================================================
# PLAYE Studio Pro v3.0 -- Installer (D: drive, Python 3.12 ONLY)
# ================================================================

param(
    [ValidateSet("lite","standard","full")]
    [string]$Profile = ""
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "  +---------------------------------------+" -ForegroundColor Cyan
Write-Host "  |   PLAYE Studio Pro v3.0 - Installer   |" -ForegroundColor Cyan
Write-Host "  |   Python 3.12 STRICT | Drive D:       |" -ForegroundColor Cyan
Write-Host "  +---------------------------------------+" -ForegroundColor Cyan

# ================================================================
#  FIND PYTHON 3.12 (STRICT - rejects 3.13, 3.14, etc.)
# ================================================================

$py312 = $null

# Method 1: py launcher (most reliable on Windows)
try {
    $ver = & py -3.12 --version 2>&1
    if ($ver -match "3\.12") {
        $py312 = "py"
        Write-Host "  [OK] Found: $ver (py -3.12 launcher)" -ForegroundColor Green
    }
} catch {}

# Method 2: Known install paths
if (-not $py312) {
    $knownPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "C:\Python312\python.exe",
        "C:\Program Files\Python312\python.exe",
        "D:\Python312\python.exe",
        "$env:USERPROFILE\AppData\Local\Programs\Python\Python312\python.exe"
    )
    foreach ($p in $knownPaths) {
        if (Test-Path $p) {
            $ver = & "$p" --version 2>&1
            if ($ver -match "3\.12") {
                $py312 = $p
                Write-Host "  [OK] Found: $ver ($p)" -ForegroundColor Green
                break
            }
        }
    }
}

# Method 3: Scan all pythons in PATH via where.exe
if (-not $py312) {
    try {
        $allPy = & where.exe python 2>$null
        if ($allPy) {
            foreach ($p in $allPy) {
                $ver = & "$p" --version 2>&1
                if ($ver -match "3\.12") {
                    $py312 = $p
                    Write-Host "  [OK] Found: $ver ($p)" -ForegroundColor Green
                    break
                }
            }
        }
    } catch {}
}

# Method 4: FAIL
if (-not $py312) {
    Write-Host "" -ForegroundColor Red
    Write-Host "  ERROR: Python 3.12 NOT FOUND!" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "  PyTorch requires Python 3.12." -ForegroundColor Red
    Write-Host "  Versions 3.13 and 3.14 are NOT supported." -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "  Download 3.12.9:" -ForegroundColor Yellow
    Write-Host "  https://www.python.org/downloads/release/python-3129/" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "  During install:" -ForegroundColor Yellow
    Write-Host "  [x] Install py launcher   <-- CHECK THIS" -ForegroundColor Yellow
    Write-Host "  [ ] Add to PATH           <-- DO NOT check" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "  Then py -3.12 will work alongside your 3.14." -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  Detected Python versions:" -ForegroundColor Gray
    try { & where.exe python 2>$null | ForEach-Object { Write-Host "    $_ -- $(& $_ --version 2>&1)" -ForegroundColor Gray } } catch {}
    try { Write-Host "    py launcher list: $(py --list 2>&1)" -ForegroundColor Gray } catch {}
    exit 1
}

Write-Host ""

# ================================================================
#  PROFILE SELECTION
# ================================================================

if (-not $Profile) {
    Write-Host "  Select profile:" -ForegroundColor Yellow
    Write-Host "  [1] LITE     - Weak PC (4-8GB RAM, no GPU)" -ForegroundColor Gray
    Write-Host "  [2] STANDARD - Medium PC (16GB RAM, GTX 1060+)" -ForegroundColor White
    Write-Host "  [3] FULL     - Powerful PC (32GB RAM, RTX 3060+)" -ForegroundColor Green
    Write-Host ""

    $choice = Read-Host "  Your choice (1/2/3)"
    switch ($choice) {
        "1" { $Profile = "lite" }
        "3" { $Profile = "full" }
        default { $Profile = "standard" }
    }
}

$reqFile = switch ($Profile) {
    "lite"     { "backend/requirements-lite.txt" }
    "full"     { "backend/requirements-full.txt" }
    default    { "backend/requirements.txt" }
}

Write-Host "  Profile: $($Profile.ToUpper())" -ForegroundColor Green
Write-Host ""

# ================================================================
#  D: DRIVE DIRECTORIES
# ================================================================

$env:PIP_CACHE_DIR       = "D:\PLAYE\.cache\pip"
$env:npm_config_cache    = "D:\PLAYE\.cache\npm"
$env:TORCH_HOME          = "D:\PLAYE\.cache\torch"
$env:HF_HOME             = "D:\PLAYE\.cache\huggingface"
$env:TRANSFORMERS_CACHE  = "D:\PLAYE\.cache\huggingface"
$env:TEMP                = "D:\PLAYE\temp"
$env:TMP                 = "D:\PLAYE\temp"
$env:PLAYE_MODELS_DIR    = "D:\PLAYE\models"

$dirs = @(
    "D:\PLAYE\.cache\pip", "D:\PLAYE\.cache\npm", "D:\PLAYE\.cache\torch",
    "D:\PLAYE\.cache\huggingface", "D:\PLAYE\temp", "D:\PLAYE\models"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# ================================================================
#  [1/8] CLEANUP
# ================================================================

Write-Host "[1/8] Cleaning __pycache__..." -ForegroundColor Yellow
Get-ChildItem -Path . -Include __pycache__ -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Write-Host "  OK" -ForegroundColor Green

# ================================================================
#  [2/8] VENV (strictly Python 3.12!)
# ================================================================

$venvPath = "D:\PLAYE\venv"
$pip      = "$venvPath\Scripts\pip.exe"
$python   = "$venvPath\Scripts\python.exe"

# If venv exists but is NOT 3.12 -- DELETE it
if (Test-Path $python) {
    $existingVer = & $python --version 2>&1
    if ($existingVer -notmatch "3\.12") {
        Write-Host "[2/8] venv exists but is $existingVer -- DELETING..." -ForegroundColor Red
        Remove-Item -Recurse -Force $venvPath
        Write-Host "  Deleted. Creating fresh 3.12 venv..." -ForegroundColor Yellow
    } else {
        Write-Host "[2/8] venv OK: $existingVer" -ForegroundColor Green
    }
}

if (-not (Test-Path $pip)) {
    Write-Host "[2/8] Creating venv with Python 3.12..." -ForegroundColor Yellow

    if ($py312 -eq "py") {
        & py -3.12 -m venv $venvPath
    } else {
        & "$py312" -m venv $venvPath
    }

    if (-not (Test-Path $pip)) {
        Write-Host "  ERROR: venv creation failed!" -ForegroundColor Red
        exit 1
    }
}

# Final check -- venv MUST be 3.12
$pyVer = & $python --version 2>&1
if ($pyVer -notmatch "3\.12") {
    Write-Host "  FATAL: venv is $pyVer instead of 3.12!" -ForegroundColor Red
    Write-Host "  Delete D:\PLAYE\venv manually and retry." -ForegroundColor Yellow
    exit 1
}
Write-Host "  $pyVer -- OK" -ForegroundColor Green

# ================================================================
#  [3/8] PIP UPGRADE
# ================================================================

Write-Host "[3/8] pip + setuptools + wheel..." -ForegroundColor Yellow
& $pip install --upgrade pip setuptools wheel --quiet 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Green

# ================================================================
#  [4/8] PYTORCH
# ================================================================

Write-Host "[4/8] PyTorch..." -ForegroundColor Yellow
if ($Profile -eq "lite") {
    Write-Host "  CPU-only (lite profile)" -ForegroundColor DarkGray
    & $pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --quiet
} else {
    Write-Host "  CUDA 12.4 (GPU)" -ForegroundColor DarkGray
    & $pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 --quiet
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: PyTorch install failed!" -ForegroundColor Red
    Write-Host "  Check venv Python version:" -ForegroundColor Yellow
    & $python --version
    exit 1
}
Write-Host "  OK" -ForegroundColor Green

# ================================================================
#  [5/8] REQUIREMENTS
# ================================================================

Write-Host "[5/8] Dependencies ($Profile)..." -ForegroundColor Yellow
& $pip install "numpy>=1.26,<2.2" "Pillow>=11.1" "opencv-python-headless>=4.10" "scipy>=1.14" --quiet 2>&1 | Out-Null

if (Test-Path $reqFile) {
    & $pip install -r $reqFile --quiet 2>&1 | Out-Null
} else {
    Write-Host "  Warning: $reqFile not found, skipping." -ForegroundColor Yellow
}
Write-Host "  OK" -ForegroundColor Green

# ================================================================
#  [6/8] FACE RESTORATION (--no-deps to avoid broken setup.py)
# ================================================================

if ($Profile -ne "lite") {
    Write-Host "[6/8] basicsr + gfpgan + realesrgan (--no-deps)..." -ForegroundColor Yellow
    & $pip install "basicsr==1.4.2" --no-deps --quiet 2>&1 | Out-Null
    & $pip install "facexlib>=0.3.0" --no-deps --quiet 2>&1 | Out-Null
    & $pip install "gfpgan==1.3.8" --no-deps --quiet 2>&1 | Out-Null
    & $pip install "realesrgan==0.3.0" --no-deps --quiet 2>&1 | Out-Null
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "[6/8] Skip face-restoration (lite profile)" -ForegroundColor DarkGray
}

# ================================================================
#  [7/8] OPENCV FIX (basicsr may overwrite with GUI version)
# ================================================================

Write-Host "[7/8] opencv headless fix..." -ForegroundColor Yellow
& $pip install --force-reinstall --no-deps "opencv-python-headless>=4.10" --quiet 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Green

# ================================================================
#  [8/8] SYMLINK + NPM
# ================================================================

Write-Host "[8/8] Symlink + npm..." -ForegroundColor Yellow

$backendVenv = ".\backend\.venv"
if (Test-Path $backendVenv) { Remove-Item $backendVenv -Recurse -Force -ErrorAction SilentlyContinue }
try {
    New-Item -ItemType SymbolicLink -Path $backendVenv -Target $venvPath -ErrorAction Stop | Out-Null
    Write-Host "  symlink OK" -ForegroundColor Green
} catch {
    Write-Host "  symlink: needs Admin rights (non-critical)" -ForegroundColor Yellow
}

& npm install --quiet 2>&1 | Out-Null
Write-Host "  OK" -ForegroundColor Green

# ================================================================
#  SET PERMANENT ENV VARS (User scope)
# ================================================================

[Environment]::SetEnvironmentVariable("PIP_CACHE_DIR",    "D:\PLAYE\.cache\pip",         "User")
[Environment]::SetEnvironmentVariable("TORCH_HOME",       "D:\PLAYE\.cache\torch",       "User")
[Environment]::SetEnvironmentVariable("HF_HOME",          "D:\PLAYE\.cache\huggingface", "User")
[Environment]::SetEnvironmentVariable("PLAYE_MODELS_DIR", "D:\PLAYE\models",             "User")

# ================================================================
#  VERIFICATION
# ================================================================

Write-Host ""
Write-Host "  === VERIFICATION ===" -ForegroundColor Cyan

$checks = @(
    @{ name="Python";   cmd="import sys; print(f'Python {sys.version}')" },
    @{ name="torch";    cmd="import torch; d='CUDA '+torch.version.cuda if torch.cuda.is_available() else 'CPU'; print(f'torch {torch.__version__} ({d})')" },
    @{ name="numpy";    cmd="import numpy; print(f'numpy {numpy.__version__}')" },
    @{ name="fastapi";  cmd="import fastapi; print(f'fastapi {fastapi.__version__}')" },
    @{ name="opencv";   cmd="import cv2; print(f'opencv {cv2.__version__}')" },
    @{ name="Pillow";   cmd="import PIL; print(f'Pillow {PIL.__version__}')" },
    @{ name="scipy";    cmd="import scipy; print(f'scipy {scipy.__version__}')" }
)

if ($Profile -ne "lite") {
    $checks += @(
        @{ name="basicsr";     cmd="import basicsr; print(f'basicsr {basicsr.__version__}')" },
        @{ name="ultralytics"; cmd="import ultralytics; print(f'ultralytics {ultralytics.__version__}')" },
        @{ name="diffusers";   cmd="import diffusers; print(f'diffusers {diffusers.__version__}')" },
        @{ name="insightface"; cmd="import insightface; print('insightface OK')" }
    )
}

if ($Profile -eq "full") {
    $checks += @(
        @{ name="paddleocr"; cmd="import paddleocr; print('paddleocr OK')" },
        @{ name="open3d";    cmd="import open3d; print(f'open3d {open3d.__version__}')" }
    )
}

foreach ($c in $checks) {
    $r = & $python -c $c.cmd 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK  $r" -ForegroundColor Green
    } else {
        Write-Host "  --  $($c.name) (not installed)" -ForegroundColor DarkGray
    }
}

# ================================================================
#  DONE
# ================================================================

Write-Host ""
Write-Host "  +---------------------------------------+" -ForegroundColor Green
Write-Host "  |        INSTALLATION COMPLETE           |" -ForegroundColor Green
Write-Host "  |   Profile: $($Profile.ToUpper().PadRight(27))|" -ForegroundColor Green
Write-Host "  |   Python:  3.12 (D:\PLAYE\venv)       |" -ForegroundColor Green
Write-Host "  +---------------------------------------+" -ForegroundColor Green
Write-Host ""
Write-Host "  Start:  npm run dev" -ForegroundColor Yellow
Write-Host ""
