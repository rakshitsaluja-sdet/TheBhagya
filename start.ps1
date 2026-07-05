Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

$Root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$Frontend = Join-Path $Root "frontend"
$NM       = Join-Path $Frontend "node_modules"
$FlagFile = Join-Path $Root ".swe_ok"

Clear-Host
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   TheBhagya - Starting App                " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# Kill any leftover processes from previous run
Write-Host "  Cleaning up old processes..." -ForegroundColor Gray
Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name node*   -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 800
Write-Host "  Done." -ForegroundColor Gray
Write-Host ""

# Step 1: Python packages
Write-Host "[1/3] Checking Python packages..." -ForegroundColor Cyan

$packages = @(
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy[asyncio]",
    "aiosqlite",
    "pydantic",
    "pydantic-settings",
    "httpx",
    "pytz",
    "python-dotenv",
    "python-jose[cryptography]",
    "bcrypt",
    "passlib[bcrypt]",
    "alembic",
    "asyncpg",
    "redis"
)

foreach ($pkg in $packages) {
    $pkgName = ($pkg -split '\[')[0]
    $result = pip show $pkgName 2>&1
    if (-not $result) {
        Write-Host "      Installing $pkgName..." -ForegroundColor Yellow
        pip install $pkg -q 2>&1 | Out-Null
    }
}

if (Test-Path $FlagFile) {
    Write-Host "      Python OK" -ForegroundColor Green
} else {
    $sweCheck = pip show pyswisseph 2>&1
    if ($sweCheck -and ($sweCheck -notmatch "not found")) {
        "" | Out-File $FlagFile -Encoding ascii
        Write-Host "      Python + Swiss Ephemeris OK" -ForegroundColor Green
    } else {
        pip install "pyswisseph>=2.10" --prefer-binary -q 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            "" | Out-File $FlagFile -Encoding ascii
            Write-Host "      Python + Swiss Ephemeris OK" -ForegroundColor Green
        } else {
            Write-Host "  [!] Swiss Ephemeris needs C++ Build Tools -- skipping" -ForegroundColor Yellow
        }
    }
}

# Step 2: Node packages
Write-Host "[2/3] Checking Node packages..." -ForegroundColor Cyan
$swcPath = Join-Path $NM "@vitejs\plugin-react-swc"
if (-not (Test-Path $swcPath)) {
    if (Test-Path $NM) {
        Write-Host "      Cleaning old node_modules..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $NM
    }
    Write-Host "      Installing packages (~30 sec)..." -ForegroundColor Yellow
    Set-Location $Frontend
    npm install
    Set-Location $Root
}
Write-Host "      Node OK" -ForegroundColor Green

# Step 3: Skipped — test accounts already seeded in Supabase via setup_postgres.py
Write-Host "[3/4] Database: Supabase PostgreSQL (already configured)" -ForegroundColor Cyan
Write-Host ""

# Step 4: Start both services as background jobs
Write-Host "[4/4] Starting services..." -ForegroundColor Cyan
Write-Host ""

$backendJob = Start-Job -Name "BhagyaBackend" -ScriptBlock {
    param($r)
    Set-Location $r
    $env:PYTHONPATH = $r
    uvicorn backend.app.main:app --reload --port 8000 2>&1
} -ArgumentList $Root

$vite = Join-Path $NM ".bin\vite.cmd"
$frontendJob = Start-Job -Name "BhagyaFrontend" -ScriptBlock {
    param($f, $v)
    Set-Location $f
    & $v --port 5173 2>&1
} -ArgumentList $Frontend, $vite

Write-Host "--------------------------------------------" -ForegroundColor Yellow
Write-Host "  App  -> http://localhost:5173             " -ForegroundColor Yellow
Write-Host "  API  -> http://localhost:8000             " -ForegroundColor Yellow
Write-Host "  Docs -> http://localhost:8000/docs        " -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop BOTH services       " -ForegroundColor Gray
Write-Host "--------------------------------------------" -ForegroundColor Yellow
Write-Host ""

# Wait for Vite to be ready before opening browser (polls up to 30 seconds)
Write-Host "  Waiting for frontend to be ready..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 1 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if ($ready) {
    Write-Host "  Frontend ready! Opening browser..." -ForegroundColor Green
} else {
    Write-Host "  Timed out waiting — opening browser anyway..." -ForegroundColor Yellow
}
Start-Process "http://localhost:5173"

# Stream output from both jobs until Ctrl+C
try {
    while ($true) {
        $bOut = Receive-Job $backendJob -ErrorAction SilentlyContinue
        if ($bOut) {
            $bOut | ForEach-Object { Write-Host "[API] $_" -ForegroundColor DarkCyan }
        }

        $fOut = Receive-Job $frontendJob -ErrorAction SilentlyContinue
        if ($fOut) {
            $fOut | ForEach-Object { Write-Host "[APP] $_" -ForegroundColor DarkGreen }
        }

        if ($backendJob.State -eq 'Failed') {
            Write-Host ""
            Write-Host "  [!] Backend crashed. Check errors above." -ForegroundColor Red
            break
        }
        if ($frontendJob.State -eq 'Failed') {
            Write-Host ""
            Write-Host "  [!] Frontend crashed. Check errors above." -ForegroundColor Red
            break
        }

        Start-Sleep -Milliseconds 400
    }
} finally {
    Write-Host ""
    Write-Host "  Stopping TheBhagya..." -ForegroundColor Yellow

    Stop-Job  $backendJob,  $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue

    Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name node*   -ErrorAction SilentlyContinue | Stop-Process -Force

    Write-Host "  Backend  stopped." -ForegroundColor Green
    Write-Host "  Frontend stopped." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Run .\start.ps1 to start again." -ForegroundColor Gray
    Write-Host ""
}
