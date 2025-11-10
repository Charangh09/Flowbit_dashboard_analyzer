param(
    [string]$url = "http://localhost:3001/health",
    [int]$retries = 30,
    [int]$delaySeconds = 5
)

Write-Host "Checking $url for health..."
for ($i = 0; $i -lt $retries; $i++) {
    try {
        $res = Invoke-RestMethod -Uri $url -UseBasicParsing -TimeoutSec 10
        if ($res -and $res.ok) {
            Write-Host "Service is healthy!"
            exit 0
        }
    } catch {
        Write-Host (["Attempt {0}/{1}: not ready yet" -f ($i+1), $retries])
    }
    Start-Sleep -Seconds $delaySeconds
}

Write-Host "Service did not become healthy after $retries attempts"
exit 2
