# READ BELOW:

# PowerShell wrapper script to run US3-AT1 test with credentials from .env file
# Usage: .\maestro\US3\run-US3-AT1.ps1
# Credentials are read from the .env file (MAESTRO_USERNAME and MAESTRO_PASSWORD)

# Load credentials from .env file
# Use $PSScriptRoot to make path relative to script location (works from anywhere)
$envPath = Join-Path (Split-Path (Split-Path $PSScriptRoot)) ".env"  # Up two levels from script to root
if (-not (Test-Path $envPath)) {
    Write-Error "Error: .env file not found at $envPath"
    Write-Host "Script location: $PSScriptRoot"
    Write-Host "Looking for .env at: $envPath"
    exit 1
}

# Parse .env file
$envContent = Get-Content $envPath
$Username = $null
$Password = $null

foreach ($line in $envContent) {
    if ($line -match "^\s*MAESTRO_USERNAME\s*=\s*(.+)$") {
        $Username = $matches[1].Trim()
    }
    if ($line -match "^\s*MAESTRO_PASSWORD\s*=\s*(.+)$") {
        $Password = $matches[1].Trim()
    }
}

# Validate that credentials were found
if (-not $Username -or -not $Password) {
    Write-Error "Error: MAESTRO_USERNAME and/or MAESTRO_PASSWORD not found in .env file"
    exit 1
}

# Create a temporary YAML file with credentials injected
$tempYamlPath = Join-Path $env:TEMP "US3-AT1_temp.yaml"
$templatePath = Join-Path $PSScriptRoot "AT1connectAndViewCourseSchedule.yaml"  # Same directory as this script

# Read the template
$templateContent = Get-Content $templatePath -Raw

# Replace placeholders with actual credentials
$tempContent = $templateContent `
    -replace '{{MAESTRO_USERNAME}}', $Username `
    -replace '{{MAESTRO_PASSWORD}}', $Password

# Write to temporary file
Set-Content -Path $tempYamlPath -Value $tempContent

Write-Host "Running Maestro test with credentials from .env file..."
Write-Host "Temporary test file: $tempYamlPath"

try {
    # Run Maestro with the temporary file
    maestro test $tempYamlPath
    $exitCode = $LASTEXITCODE
}
finally {
    # Clean up temporary file (do this even if test fails)
    if (Test-Path $tempYamlPath) {
        Remove-Item $tempYamlPath -Force
        Write-Host "Cleaned up temporary test file."
    }
}

# Propagate exit code
exit $exitCode
