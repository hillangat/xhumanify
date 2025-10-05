# AWS Parameter Store Setup for Stripe Integration
# This script helps you securely store environment variables in AWS Parameter Store
# Run this script after configuring your AWS CLI credentials

Write-Host "🔐 AWS Parameter Store Setup for Stripe Integration`n" -ForegroundColor Green
Write-Host "This script will help you securely store your Stripe credentials in AWS Parameter Store."
Write-Host "Make sure you have AWS CLI configured with appropriate permissions.`n"

# Check if AWS CLI is available
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is available`n" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install AWS CLI first: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
}

# Test AWS credentials
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials are configured`n" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials are not configured" -ForegroundColor Red
    Write-Host "Please run: aws configure"
    exit 1
}

# Get Stripe Secret Key
do {
    $stripeSecretKey = Read-Host "Enter your Stripe Secret Key (sk_...)"
    if (-not $stripeSecretKey.StartsWith("sk_")) {
        Write-Host "❌ Invalid Stripe Secret Key format. It should start with 'sk_'" -ForegroundColor Red
    }
} while (-not $stripeSecretKey.StartsWith("sk_"))

# Get Stripe Webhook Secret  
do {
    $stripeWebhookSecret = Read-Host "Enter your Stripe Webhook Secret (whsec_...)"
    if (-not $stripeWebhookSecret.StartsWith("whsec_")) {
        Write-Host "❌ Invalid Stripe Webhook Secret format. It should start with 'whsec_'" -ForegroundColor Red
    }
} while (-not $stripeWebhookSecret.StartsWith("whsec_"))

Write-Host "`n📡 Storing parameters in AWS Parameter Store...`n" -ForegroundColor Yellow

try {
    # Store Stripe Secret Key
    aws ssm put-parameter --name "/amplify/stripe/secret-key" --value "$stripeSecretKey" --type "SecureString" --description "Stripe Secret Key for Lambda functions" --overwrite
    Write-Host "✅ Stored Stripe Secret Key" -ForegroundColor Green

    # Store Stripe Webhook Secret
    aws ssm put-parameter --name "/amplify/stripe/webhook-secret" --value "$stripeWebhookSecret" --type "SecureString" --description "Stripe Webhook Secret for webhook validation" --overwrite
    Write-Host "✅ Stored Stripe Webhook Secret" -ForegroundColor Green

    Write-Host "`n🎉 All parameters stored successfully!" -ForegroundColor Green
    Write-Host "`nYour Stripe credentials are now securely stored in AWS Parameter Store."
    Write-Host "The Lambda functions will automatically retrieve these values during execution."
    Write-Host "`n🔒 Security Benefits:" -ForegroundColor Cyan
    Write-Host "- Credentials are encrypted at rest"
    Write-Host "- Access is controlled by IAM policies"
    Write-Host "- No sensitive data in your code repository"
    Write-Host "- Audit trail of parameter access"

} catch {
    Write-Host "`n❌ Failed to store parameters:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPlease check your AWS permissions and try again."
    exit 1
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")