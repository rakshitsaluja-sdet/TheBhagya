# TheBhagya — Push WebGL UI files to GitHub
# Run from PowerShell: .\push_ui_v4.ps1

Set-Location $PSScriptRoot

Write-Host "`nStaging new UI files..." -ForegroundColor Cyan

git add TheBhagya_UI_v2_Preview.html
git add TheBhagya_UI_v3_Galaxy.html
git add TheBhagya_UI_v3_Orrery.html
git add TheBhagya_UI_v4.html
git add .gitignore

Write-Host "Creating commit..." -ForegroundColor Cyan

git commit -m "feat: WebGL landing page v4 — Vedic Navagraha orrery, 12-col grid, scroll-driven keyframes

- v2: particle formations proof-of-concept
- v3-Galaxy: spiral galaxy + particle Navagraha (superseded)
- v3-Orrery: geocentric sphere planets, orbit rings, Saturn ring, glow sprites
- v4 (final): fracture-reference layout patterns applied
  * mix-blend-mode:difference nav
  * 12-col grid: hero left / right / narrow-left / centered CTA
  * pointer-events:none on sections, auto on interactive only
  * Single ScrollTrigger scrub 0-1 driving 4 orrery keyframes
  * Orrery shifts into negative space of each section
  * Scroll velocity adds rotation burst"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan

git push origin master

Write-Host "`nDone. Check: https://github.com/rakshitsaluja-sdet/BhagyaAI" -ForegroundColor Green
