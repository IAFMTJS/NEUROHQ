# Test every push notification type by calling the test-all API.
# Requires: dev server running (or use APP_URL for production), CRON_SECRET in env, and at least one user with push enabled.
#
# --- Single-type test from terminal (production, real curl) ---
# Use curl.exe (Windows has a curl alias in PowerShell; .exe forces the real curl). Replace YOUR_CRON_SECRET and APP_URL.
#
#   curl.exe -s -H "Authorization: Bearer YOUR_CRON_SECRET" "https://neurohq.vercel.app/api/push/test-all?type=shutdown-reminder"
#
# Or with a specific user:
#   curl.exe -s -H "Authorization: Bearer YOUR_CRON_SECRET" "https://neurohq.vercel.app/api/push/test-all?type=daily-quote&userId=USER_UUID"
#
# Types: all entries in $allTypes below (kept in sync with app/api/push/test-all PUSH_TYPES).
#
# --- Run all types (script) ---
#   $env:CRON_SECRET = "your-cron-secret"
#   .\scripts\test-push-notifications.ps1
#
# Optional: target a specific user
#   .\scripts\test-push-notifications.ps1 -UserId "uuid-here"
#
# Optional: test only one type
#   .\scripts\test-push-notifications.ps1 -Type "daily-quote" -BaseUrl "https://neurohq.vercel.app"
#
# Production — send every test type to one user (omit -Type). Optional delay so notifications don’t stack:
#   $env:CRON_SECRET = "YOUR_SECRET"
#   .\scripts\test-push-notifications.ps1 -BaseUrl "https://neurohq.vercel.app" -UserId "YOUR_UUID" -DelaySeconds 2
#
# Note: "variants" (personality modes, rotating quote copy) follow the user’s Settings on the server; this script cycles API types, not modes.

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$UserId = "",
    [string]$Type = "",
    [int]$DelaySeconds = 0
)

$secret = $env:CRON_SECRET
if (-not $secret) {
    Write-Host "ERROR: CRON_SECRET is not set. Set it in .env.local or run:" -ForegroundColor Red
    Write-Host '  $env:CRON_SECRET = "your-cron-secret"' -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $secret"
    "Content-Type"  = "application/json"
}

$allTypes = @(
    "daily-quote",
    "calendar-morning",
    "calendar-reminder",
    "morning-reminder",
    "evening-reminder",
    "brain-status-reminder",
    "weekly-learning",
    "savings-alert",
    "shutdown-reminder",
    "freeze-reminder",
    "avoidance-alert",
    "reengage",
    "streak-growth",
    "streak-protection",
    "momentum",
    "app-release",
    "strategy-check-in-soft",
    "strategy-check-in-firm",
    "strategy-quarter-incomplete",
    "growth-focus-unset",
    "strategy-monthly-tip",
    "growth-learning-idle"
)

$typesToRun = if ($Type) {
    if ($allTypes -contains $Type) { @($Type) } else {
        Write-Host "Unknown type: $Type. Allowed: $($allTypes -join ', ')" -ForegroundColor Red
        exit 1
    }
} else {
    $allTypes
}

Write-Host "Push notification tests - BaseUrl: $BaseUrl" -ForegroundColor Cyan
if ($UserId) { Write-Host "Target userId: $UserId" -ForegroundColor Cyan }
Write-Host ("Running {0} type(s)." -f $typesToRun.Count) -ForegroundColor Cyan
if ($DelaySeconds -gt 0) { Write-Host ("Delay between calls: {0}s" -f $DelaySeconds) -ForegroundColor Cyan }
Write-Host ""

$failed = 0
$i = 0
foreach ($t in $typesToRun) {
    $i++
    $url = "$BaseUrl/api/push/test-all?type=$t"
    # Use single-quoted '&userId=' - PS 5.1 can misparse "&" after += inside double quotes.
    if ($UserId) { $url = $url + '&userId=' + $UserId }
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
        if ($response.ok) {
            Write-Host ('[OK] ' + $t) -ForegroundColor Green
        } elseif ($response.skipped) {
            Write-Host ('[SKIP] ' + $t + ' - ' + $response.message) -ForegroundColor DarkGray
        } else {
            Write-Host ('[--] ' + $t + ' - ' + $response.message) -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $body = ""
        if ($_.ErrorDetails.Message) { $body = $_.ErrorDetails.Message }
        Write-Host ('[FAIL] ' + $t + ' - HTTP ' + $statusCode + ' ' + $body) -ForegroundColor Red
        $failed++
    }
    if ($DelaySeconds -gt 0 -and $i -lt $typesToRun.Count) {
        Start-Sleep -Seconds $DelaySeconds
    }
}

Write-Host ""
if ($failed -eq 0) {
    Write-Host "Done. Check your device for the notifications." -ForegroundColor Green
} else {
    Write-Host "$($failed) request(s) failed. Check CRON_SECRET and that the dev server is running." -ForegroundColor Yellow
}
