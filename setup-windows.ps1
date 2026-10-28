$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 or later first: https://nodejs.org' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'npm is missing from PATH.' }
$envPath = Join-Path $root 'server/.env'
if (-not (Test-Path $envPath)) {
  Copy-Item (Join-Path $root 'server/.env.example') $envPath
  Write-Host 'Created server/.env with local MongoDB settings.'
}
Write-Host 'Installing backend dependencies...'
Push-Location (Join-Path $root 'server')
try { & npm.cmd install; if ($LASTEXITCODE -ne 0) { throw 'Backend npm install failed' } } finally { Pop-Location }
Write-Host 'Installing frontend dependencies...'
Push-Location (Join-Path $root 'client')
try { & npm.cmd install; if ($LASTEXITCODE -ne 0) { throw 'Frontend npm install failed' } } finally { Pop-Location }
Write-Host 'Done. Start MongoDB, then run .\start-api.ps1 and .\start-web.ps1 in two PowerShell terminals.'
