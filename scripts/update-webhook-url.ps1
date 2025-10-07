# Webhook URL Management Script (PowerShell)
param([switch]$AutoCopy)

$amplifyOutputsPath = Join-Path $PSScriptRoot ".." "amplify_outputs.json"

if (-not (Test-Path $amplifyOutputsPath)) {
    Write-Error "amplify_outputs.json not found at: $amplifyOutputsPath"
    exit 1
}

$amplifyOutputs = Get-Content $amplifyOutputsPath | ConvertFrom-Json
$apiEndpoint = $amplifyOutputs.custom.API.myRestApi.endpoint

if (-not $apiEndpoint) {
    Write-Error "API endpoint not found in amplify_outputs.json"
    exit 1
}

$webhookUrl = "${apiEndpoint}stripe/webhook"

Write-Host "Current Webhook URL:" -ForegroundColor Cyan
Write-Host "   $webhookUrl" -ForegroundColor Green
Write-Host ""

if ($AutoCopy) {
    $webhookUrl | Set-Clipboard
    Write-Host "URL copied to clipboard!" -ForegroundColor Yellow
}

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy this URL"
Write-Host "2. Go to Stripe Dashboard -> Developers -> Webhooks"
Write-Host "3. Update your webhook endpoint URL"
Write-Host "4. Test the webhook"
Write-Host ""

$webhookConfig = @{
    webhookUrl = $webhookUrl
    lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endpoint = $apiEndpoint
}

$configPath = Join-Path $PSScriptRoot "current-webhook.json"
$webhookConfig | ConvertTo-Json -Depth 3 | Set-Content $configPath

Write-Host "Webhook configuration saved to scripts/current-webhook.json" -ForegroundColor Green