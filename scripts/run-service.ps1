param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('fortune-service', 'interpretation-service', 'search-service')]
    [string]$Name
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envPath)) {
    throw 'Run scripts/init-env.ps1 first.'
}

foreach ($line in Get-Content -LiteralPath $envPath -Encoding UTF8) {
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
$env:LOG_FILE = Join-Path $projectRoot "logs/$Name.log"
Push-Location $projectRoot
try {
    & .\gradlew.bat ":services:${Name}:bootRun"
    if ($LASTEXITCODE -ne 0) { throw "Service exited with code $LASTEXITCODE" }
} finally {
    Pop-Location
}
