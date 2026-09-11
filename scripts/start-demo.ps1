# FuelChain Bolivia — arranque demo (Windows PowerShell)
# Uso:  pwsh -File scripts/start-demo.ps1
# Flags: -SkipChain   no levanta Hardhat
#        -Seed        vuelve a sembrar DEMO

param(
  [switch]$SkipChain,
  [switch]$Seed
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$env:PNPM_HOME = "$env:LOCALAPPDATA\pnpm"
$env:Path = "$env:PNPM_HOME;$env:PNPM_HOME\bin;$env:Path"

Write-Host "==> Postgres"
docker compose up -d postgres | Out-Host

Write-Host "==> Esperando health Postgres..."
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  $ps = docker compose ps --format json 2>$null
  if ($ps -match "healthy") { $ok = $true; break }
}
if (-not $ok) { Write-Warning "Postgres aún no reporta healthy; continúo..." }

if ($Seed) {
  Write-Host "==> Seed DEMO"
  pnpm db:seed
}

# Prefer pwsh when installed; fall back to Windows PowerShell 5.1
$ShellExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }

if (-not $SkipChain) {
  Write-Host "==> Hardhat node (ventana nueva)"
  Start-Process $ShellExe -ArgumentList "-NoExit", "-Command", "cd '$Root'; `$env:PNPM_HOME='$env:PNPM_HOME'; `$env:Path=`"$env:PNPM_HOME;`$env:PNPM_HOME\bin;`$env:Path`"; pnpm contracts:node"
  Start-Sleep -Seconds 4
  Write-Host "==> Deploy contrato"
  pnpm --filter @fuelchain/contracts run deploy
}

Write-Host "==> API (ventana nueva)"
Start-Process $ShellExe -ArgumentList "-NoExit", "-Command", "cd '$Root'; `$env:PNPM_HOME='$env:PNPM_HOME'; `$env:Path=`"$env:PNPM_HOME;`$env:PNPM_HOME\bin;`$env:Path`"; pnpm --filter @fuelchain/api dev"

Write-Host "==> Web (ventana nueva)"
Start-Process $ShellExe -ArgumentList "-NoExit", "-Command", "cd '$Root'; `$env:PNPM_HOME='$env:PNPM_HOME'; `$env:Path=`"$env:PNPM_HOME;`$env:PNPM_HOME\bin;`$env:Path`"; pnpm --filter @fuelchain/web dev"

Write-Host ""
Write-Host "Listo. Abre:"
Write-Host "  Web  http://localhost:3000"
Write-Host "  API  http://localhost:3001/health"
Write-Host "  Lote http://localhost:3000/batches/FC-BO-2026-000184"
Write-Host "  Evid http://localhost:3000/blockchain"
