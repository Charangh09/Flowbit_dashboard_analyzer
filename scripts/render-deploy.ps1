param(
    [string]$ApiKey = $env:RENDER_API_KEY,
    [string]$ApiServiceId = $env:RENDER_API_SERVICE_ID,
    [string]$VannaServiceId = $env:RENDER_VANNA_SERVICE_ID,
    [int]$TimeoutSeconds = 900,
    [int]$PollInterval = 5
)

if (-not $ApiKey) {
    $ApiKey = Read-Host -Prompt 'Enter your Render API key (or set RENDER_API_KEY)'
}

if (-not $ApiServiceId) {
    $ApiServiceId = Read-Host -Prompt 'Enter the Render Service ID for the API service'
}

Write-Host "Using API service id: $ApiServiceId"

function Invoke-RenderDeploy($serviceId) {
    $uri = "https://api.render.com/v1/services/$serviceId/deploys"
    $headers = @{ Authorization = "Bearer $ApiKey"; "Content-Type" = "application/json" }
    $body = '{"clearCache": true}'
    try {
        $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ErrorAction Stop
        return $resp
    } catch {
        Write-Error ("Failed to trigger deploy for {0}: {1}" -f $serviceId, $_.Exception.Message)
        return $null
    }
}

function Wait-For-Deploy($serviceId, $deployId, $timeoutSeconds, $pollInterval) {
    $start = Get-Date
    $uri = "https://api.render.com/v1/services/$serviceId/deploys/$deployId"
    $headers = @{ Authorization = "Bearer $ApiKey" }

    while (((Get-Date) - $start).TotalSeconds -lt $timeoutSeconds) {
        try {
            $status = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers -ErrorAction Stop
            $state = $status.state
            Write-Host "Deploy $deployId state: $state"
            if ($state -in @('live','failed','cancelled')) {
                return $status
            }
        } catch {
            Write-Warning ("Failed to fetch deploy status: {0}" -f $_.Exception.Message)
        }
        Start-Sleep -Seconds $pollInterval
    }
    throw "Timed out waiting for deploy $deployId on service $serviceId"
}

# Trigger API deploy
$apiDeploy = Invoke-RenderDeploy -serviceId $ApiServiceId
if (-not $apiDeploy) { exit 2 }
$apiDeployId = $apiDeploy.id
Write-Host "Triggered API deploy id: $apiDeployId"

try {
    $apiResult = Wait-For-Deploy -serviceId $ApiServiceId -deployId $apiDeployId -timeoutSeconds $TimeoutSeconds -pollInterval $PollInterval
    Write-Host "API deploy finished with state: $($apiResult.state)"
} catch {
    Write-Error $_
}

if ($VannaServiceId) {
    Write-Host "Triggering Vanna deploy for service id: $VannaServiceId"
    $vannaDeploy = Invoke-RenderDeploy -serviceId $VannaServiceId
    if ($vannaDeploy) {
        $vannaDeployId = $vannaDeploy.id
        try {
            $vannaResult = Wait-For-Deploy -serviceId $VannaServiceId -deployId $vannaDeployId -timeoutSeconds $TimeoutSeconds -pollInterval $PollInterval
            Write-Host "Vanna deploy finished with state: $($vannaResult.state)"
        } catch {
            Write-Error $_
        }
    }
}

Write-Host "Done. Check Render dashboard for logs if builds failed."
