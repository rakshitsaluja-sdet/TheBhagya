Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

$Root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoName = "TheBhagya"
$GitHub   = "rakshitsaluja-sdet"

Clear-Host
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   TheBhagya -- GitHub Push Script         " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Set-Location $Root

# Step 1: Check git is installed
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  [!] Git not found. Install from https://git-scm.com and re-run." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Git found" -ForegroundColor Green

# Step 2: Check gh CLI (optional but helpful for repo creation)
$ghAvailable = (Get-Command gh -ErrorAction SilentlyContinue) -ne $null

# Step 3: Init repo if not already done
if (-not (Test-Path (Join-Path $Root ".git"))) {
    Write-Host "  Initializing git repository..." -ForegroundColor Cyan
    git init -b main
    Write-Host "  [OK] Git initialized" -ForegroundColor Green
} else {
    Write-Host "  [OK] Git repository already initialized" -ForegroundColor Green
}

# Step 4: Git config
$userName  = git config user.name 2>$null
$userEmail = git config user.email 2>$null

if (-not $userName) {
    git config user.name "Rakshit Saluja"
    Write-Host "  [OK] Git user.name set" -ForegroundColor Green
}
if (-not $userEmail) {
    git config user.email "$GitHub@users.noreply.github.com"
    Write-Host "  [OK] Git user.email set" -ForegroundColor Green
}

# Step 5: Stage all files
Write-Host ""
Write-Host "  Staging files..." -ForegroundColor Cyan
git add -A
$staged = git diff --cached --name-only | Measure-Object -Line
Write-Host "  [OK] $($staged.Lines) files staged" -ForegroundColor Green

# Step 6: Commit
$commitMsg = "Initial commit - TheBhagya MVP v1.0

- Vedic Astrology chart engine (Swiss Ephemeris, Lahiri ayanamsa)
- Lal Kitab analysis with Pucca Ghar + remedy guide
- Numerology engine (Life Path, Expression, Personal Year)
- Destiny Chat via Claude AI
- PDF chart report generation
- JWT auth with 3-tier plan system (Starter/Pro/Jyotish)
- React 18 + Vite frontend with dark/light mode
- FastAPI async backend with SQLite (PostgreSQL-ready)
- PowerShell one-command launcher (start.ps1)"

git commit -m $commitMsg
Write-Host "  [OK] Committed" -ForegroundColor Green

# Step 7: Set remote and push
Write-Host ""
Write-Host "  Setting up GitHub remote..." -ForegroundColor Cyan

$remoteUrl = "https://github.com/$GitHub/$RepoName.git"
$existing = git remote 2>$null

if ($existing -contains "origin") {
    git remote set-url origin $remoteUrl
    Write-Host "  [OK] Remote updated: $remoteUrl" -ForegroundColor Green
} else {
    git remote add origin $remoteUrl
    Write-Host "  [OK] Remote added: $remoteUrl" -ForegroundColor Green
}

# Step 8: Create the GitHub repo if gh CLI available
if ($ghAvailable) {
    Write-Host ""
    Write-Host "  Creating GitHub repository via gh CLI..." -ForegroundColor Cyan
    gh repo create "$GitHub/$RepoName" --private --description "TheBhagya - AI-native Vedic Astrology Platform" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Repository created at https://github.com/$GitHub/$RepoName" -ForegroundColor Green
    } else {
        Write-Host "  [!] Repo may already exist -- continuing with push" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "  [!] gh CLI not found. Please create the repo manually:" -ForegroundColor Yellow
    Write-Host "      https://github.com/new" -ForegroundColor Cyan
    Write-Host "      Name:     $RepoName" -ForegroundColor Cyan
    Write-Host "      Owner:    $GitHub" -ForegroundColor Cyan
    Write-Host "      Visibility: Private" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "  Press ENTER after creating the repo on GitHub"
}

# Step 9: Push
Write-Host ""
Write-Host "  Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "  SUCCESS!                                   " -ForegroundColor Green
    Write-Host "  https://github.com/$GitHub/$RepoName      " -ForegroundColor Green
    Write-Host "  ============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  [!] Push failed. Common reasons:" -ForegroundColor Red
    Write-Host "      1. You need to authenticate: run  gh auth login" -ForegroundColor Yellow
    Write-Host "         OR configure a Personal Access Token (PAT) as your git password" -ForegroundColor Yellow
    Write-Host "      2. The repo doesn't exist yet on GitHub" -ForegroundColor Yellow
    Write-Host "      3. You don't have push access" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Quick fix steps:" -ForegroundColor Cyan
    Write-Host "      1. Go to https://github.com/settings/tokens/new" -ForegroundColor White
    Write-Host "      2. Create a token with 'repo' scope" -ForegroundColor White
    Write-Host "      3. Run: git push https://<TOKEN>@github.com/$GitHub/$RepoName.git main" -ForegroundColor White
}
