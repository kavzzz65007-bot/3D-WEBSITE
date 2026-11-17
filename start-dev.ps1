# FixMyCampus Launcher
$nodePath = Join-Path $PSScriptRoot ".tools\node"
$env:PATH = "$nodePath;$env:PATH"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  FixMyCampus - AI-Powered Campus Problem Solver" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodePath;`$env:PATH'; cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodePath;`$env:PATH'; cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nBackend API: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor Yellow
