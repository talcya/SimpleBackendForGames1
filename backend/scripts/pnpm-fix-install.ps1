<#
pnpm-fix-install.ps1

Purpose:
 - Stop node/pnpm processes that may hold file handles
 - Remove leftover pnpm/temp lockfiles that cause EPERM rename errors
 - Run `pnpm -C backend install` to install backend dependencies
 - Optionally run the ReDoc bundle (pass -RunRedoc)

Usage (run as Administrator):
  PowerShell -ExecutionPolicy Bypass -File .\backend\scripts\pnpm-fix-install.ps1
  PowerShell -ExecutionPolicy Bypass -File .\backend\scripts\pnpm-fix-install.ps1 -RunRedoc

#>

param(
    [switch]$RunRedoc,
    [switch]$DryRun,
    [int]$Retries = 3,
    [int]$BackoffSeconds = 2,
    [string]$BackendFolder = "backend"
)

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$ts] $msg"
}

function Remove-Candidates($root, $doRemove) {
    $patterns = @(
        "$($root)\node_modules\.pnpm\lock.yaml*",
        "$($root)\node_modules\.modules.yaml*",
        "$($root)\pnpm-lock.yaml*",
        "$($root)\node_modules\.pnpm\*.tmp*"
    )

    $removedAny = $false
    foreach ($pattern in $patterns) {
        Log "Scanning for: $pattern"
        try {
            $items = Get-ChildItem -Path $pattern -Force -ErrorAction SilentlyContinue
            foreach ($it in $items) {
                $p = $it.FullName
                if ($doRemove) {
                    try {
                        Remove-Item -Force -ErrorAction Stop $p
                        Log "Removed $p"
                        $removedAny = $true
                    } catch {
                        Log "Could not remove $p: $($_.Exception.Message)"
                    }
                } else {
                    Log "Would remove: $p"
                    $removedAny = $true
                }
            }
        } catch {
            Log "Error scanning pattern $pattern: $($_.Exception.Message)"
        }
    }
    return $removedAny
}

$root = Resolve-Path -LiteralPath .
Log "Starting pnpm cleanup and install (backend: $BackendFolder)"

Log "Stopping node and pnpm processes (if any)"
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Get-Process -Name pnpm -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

if ($DryRun) { Log "Dry-run mode: no files will be deleted" }

for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    Log "Attempt $attempt of $Retries: scanning/removing temp files"
    $didRemove = Remove-Candidates $root (!$DryRun)

    if ($DryRun -and $didRemove) {
        Log "Dry-run: files that would be removed were listed above. Exiting with code 0."
        exit 0
    }

    Log "Running pnpm install (attempt $attempt)"
    try {
        $proc = Start-Process -FilePath pnpm -ArgumentList "-C", $BackendFolder, "install" -NoNewWindow -PassThru -Wait -ErrorAction Stop
        if ($proc.ExitCode -eq 0) {
            Log "pnpm install completed successfully"
            $installSuccess = $true
            break
        } else {
            Log "pnpm install exited with code $($proc.ExitCode)"
            $installSuccess = $false
        }
    } catch {
        Log "pnpm install failed: $($_.Exception.Message)"
        $installSuccess = $false
    }

    if ($attempt -lt $Retries) {
        Log "Waiting $BackoffSeconds seconds before next attempt..."
        Start-Sleep -Seconds $BackoffSeconds
    }
}

if (-not $installSuccess) {
    Log "pnpm install failed after $Retries attempts. Exiting with error."
    exit 1
}

if ($RunRedoc) {
    Log "Running ReDoc bundle via npm script"
    try {
        $proc2 = Start-Process -FilePath pnpm -ArgumentList "-C", $BackendFolder, "run", "redoc:bundle" -NoNewWindow -PassThru -Wait -ErrorAction Stop
        if ($proc2.ExitCode -eq 0) {
            Log "Redoc bundle completed successfully"
        } else {
            Log "Redoc bundle exited with code $($proc2.ExitCode)"
        }
    } catch {
        Log "Redoc bundling failed: $($_.Exception.Message)"
        exit 1
    }
}

Log "Done."
