$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'

if (Test-Path -LiteralPath $envPath) {
    Write-Host '.env already exists; kept existing values.'
    exit 0
}

$lines = Get-Content -LiteralPath (Join-Path $projectRoot '.env.example') -Encoding UTF8
$values = @{}
$result = foreach ($line in $lines) {
    if ($line -match '^([^#=]+)=__GENERATE__$') {
        $key = $Matches[1]
        $bytes = New-Object byte[] 24
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        $secret = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
        $values[$key] = $secret
        "$key=$secret"
    } elseif ($line -eq 'MONGODB_URI=__MONGODB_URI__') {
        "MONGODB_URI=mongodb://unppal:$($values['MONGO_PASSWORD'])@localhost:27017/unppal?authSource=admin"
    } else {
        $line
    }
}
[IO.File]::WriteAllLines($envPath, [string[]]$result, (New-Object Text.UTF8Encoding($false)))
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'logs') -Force | Out-Null
Write-Host 'Created .env with random local credentials and logs directory. Keep .env private.'
