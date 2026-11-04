$ErrorActionPreference = 'Stop'
$missing = @()
foreach ($name in @('java', 'node', 'npm', 'git', 'docker')) {
    $found = Get-Command $name -ErrorAction SilentlyContinue
    if ($found) {
        Write-Host "[OK] $name"
    } else {
        Write-Host "[MISSING] $name"
        $missing += $name
    }
}

if ($missing -contains 'docker') {
    Write-Host 'Install Docker Desktop with WSL 2, start it, and open a new terminal.'
    exit 1
}
& docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker engine is not ready. Start Docker Desktop.' }
& docker compose version
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose v2 is required.' }
if ($missing.Count -gt 0) { exit 1 }
