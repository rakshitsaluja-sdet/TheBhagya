Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   TheBhagya -- Push to GitHub             " -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

$gitCheck = git --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] git not found. Install Git for Windows: https://git-scm.com" -ForegroundColor Red
    exit 1
}

$gitUser  = git config user.name  2>&1
$gitEmail = git config user.email 2>&1
if (-not $gitUser)  { git config user.name  "Rakshit Saluja" }
if (-not $gitEmail) { git config user.email "rakshitsaluja@gmail.com" }

$remoteUrl = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    $GITHUB_REPO = "https://github.com/rakshitsaluja-sdet/TheBhagya.git"
    Write-Host "  Adding remote: $GITHUB_REPO" -ForegroundColor Cyan
    git remote add origin $GITHUB_REPO
} else {
    Write-Host "  Remote: $remoteUrl" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Staging changes..." -ForegroundColor Cyan
git add -A

Write-Host ""
Write-Host "  Files staged:" -ForegroundColor Cyan
git status --short

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$msg = "feat: PostgreSQL/Supabase, bug fixes, auth gating, Navbar avatar [$timestamp]"

Write-Host ""
Write-Host "  Committing..." -ForegroundColor Cyan
git commit -m $msg

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] Nothing to commit -- everything up to date." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "  Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  Done! View at: https://github.com/rakshitsaluja-sdet/TheBhagya" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  [ERROR] Push failed." -ForegroundColor Red
    Write-Host "  If prompted for password, use a Personal Access Token, not your GitHub password." -ForegroundColor Yellow
    Write-Host "  Get one at: github.com > Settings > Developer settings > Personal access tokens" -ForegroundColor Yellow
}
