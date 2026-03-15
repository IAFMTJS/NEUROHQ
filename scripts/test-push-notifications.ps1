# Test every push notification type by calling the test-all API.
# Requires: dev server running, CRON_SECRET in env (or .env.local), and at least one user with push enabled.
#
# Usage:
#   $env:CRON_SECRET = "your-cron-secret"
#   .\scripts\test-push-notifications.ps1
#
# Optional: target a specific user
#   .\scripts\test-push-notifications.ps1 -UserId "uuid-here"
#
# Optional: test only one type
#   .\scripts\test-push-notifications.ps1 -Type "daily-quote"

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$UserId = "",
    [string]$Type = ""
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
    "momentum"
)

$typesToRun = if ($Type) {
    if ($allTypes -contains $Type) { @($Type) } else {
        Write-Host "Unknown type: $Type. Allowed: $($allTypes -join ', ')" -ForegroundColor Red
        exit 1
    }
} else {
    $allTypes
}

Write-Host "Push notification tests — BaseUrl: $BaseUrl" -ForegroundColor Cyan
if ($UserId) { Write-Host "Target userId: $UserId" -ForegroundColor Cyan }
Write-Host ""

$failed = 0
foreach ($t in $typesToRun) {
    $url = "$BaseUrl/api/push/test-all?type=$t"
    if ($UserId) { $url += "&userId=$UserId" }
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
        if ($response.ok) {
            Write-Host "[OK] $t" -ForegroundColor Green
        } else {
            Write-Host "[--] $t — $($response.message)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $body = ""
        if ($_.ErrorDetails.Message) { $body = $_.ErrorDetails.Message }
        Write-Host "[FAIL] $t — HTTP $statusCode $body" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
if ($failed -eq 0) {
    Write-Host "Done. Check your device for the notifications." -ForegroundColor Green
} else {
    Write-Host "$failed request(s) failed. Check CRON_SECRET and that the dev server is running." -ForegroundColor Yellow
}
