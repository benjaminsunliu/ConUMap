# Pre-test setup script for AT1connectAndViewCourseSchedule
# Usage: .\maestro\US3\pre-US3-AT1.ps1

Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content .env
foreach ($line in $envContent) {
    if ($line -and $line -notmatch '^\s*#') {
        $parts = $line.split('=', 2)
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            [Environment]::SetEnvironmentVariable($key, $value)
            Write-Host "  Set: $key" -ForegroundColor Green
        }
    }
}

Write-Host "`nDone! Now run:" -ForegroundColor Green
Write-Host "maestro test maestro/US3/AT1connectAndViewCourseSchedule.yaml" -ForegroundColor Yellow
