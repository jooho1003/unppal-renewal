param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('fortune-service', 'interpretation-service', 'search-service')]
    [string]$Name,
    [switch]$ApiOnly
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
$previousDocsEnabled = $env:API_DOCS_ENABLED
$previousProfiles = $env:SPRING_PROFILES_ACTIVE
# 로컬 개발 실행에서만 API 문서를 명시적으로 활성화한다.
$env:API_DOCS_ENABLED = 'true'
if ($ApiOnly) {
    # 외부 저장소를 검사하지 않는 HTTP 계약 검증 전용 실행이다.
    $env:SPRING_PROFILES_ACTIVE = 'api-smoke'
}
Push-Location $projectRoot
try {
    & .\gradlew.bat ":services:${Name}:bootRun"
    if ($LASTEXITCODE -ne 0) { throw "Service exited with code $LASTEXITCODE" }
} finally {
    # 같은 PowerShell에서 다음 실행이 검증용 프로필을 물려받지 않도록 복원한다.
    $env:API_DOCS_ENABLED = $previousDocsEnabled
    $env:SPRING_PROFILES_ACTIVE = $previousProfiles
    Pop-Location
}
