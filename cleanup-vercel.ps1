$Days = 21
$ProjectIdOrName = "neurohq"
$TeamSlug = "iafmtjss-projects"
$DryRun = $false   # set to $false when ready to delete

if (-not $env:VERCEL_TOKEN) { throw "Missing VERCEL_TOKEN env var (create one in Vercel and export it before running)." }
$headers = @{ Authorization = "Bearer $($env:VERCEL_TOKEN)" }
$cutoff = [DateTimeOffset]::UtcNow.AddDays(-$Days).ToUnixTimeMilliseconds()

$cursor = $cutoff
$toDelete = @()

do {
  $url = "https://api.vercel.com/v6/deployments?limit=100&until=$cursor&projectId=$([uri]::EscapeDataString($ProjectIdOrName))&slug=$([uri]::EscapeDataString($TeamSlug))"
  $resp = Invoke-RestMethod -Method Get -Uri $url -Headers $headers
  if ($resp.deployments) { $toDelete += $resp.deployments }
  $cursor = $resp.pagination.next
} while ($cursor)

Write-Host "Found $($toDelete.Count) old deployments."
$toDelete | Select-Object uid, url, @{n='createdUtc';e={[DateTimeOffset]::FromUnixTimeMilliseconds($_.created).UtcDateTime}} | Format-Table -AutoSize

if (-not $DryRun) {
  foreach ($d in $toDelete) {
    $deleteUrl = "https://api.vercel.com/v13/deployments/$($d.uid)?slug=$([uri]::EscapeDataString($TeamSlug))"
    try {
      Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers | Out-Null
      Write-Host "Deleted: $($d.url)"
    } catch {
      Write-Warning "Failed: $($d.url) :: $($_.Exception.Message)"
    }
    Start-Sleep -Milliseconds 300   # <- slow down to avoid 429
  }
}
