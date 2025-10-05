# AWS Parameter Store Setup

This document explains how to securely manage environment variables using AWS Parameter Store instead of `.env` files.

## Why Parameter Store?

Using AWS Parameter Store provides several advantages over `.env` files:

- **🔒 Enhanced Security**: Credentials are encrypted at rest using AWS KMS
- **🎯 Access Control**: Fine-grained IAM policies control who can access parameters
- **📊 Audit Trail**: All parameter access is logged in CloudTrail
- **🚀 No Deployment Issues**: No need to worry about `.env` files being included in deployments
- **🔄 Dynamic Updates**: Parameters can be updated without redeploying code

## Setup Instructions

### Prerequisites

1. AWS CLI installed and configured
2. Appropriate IAM permissions for Parameter Store operations

### Quick Setup

Run the setup script to store your Stripe credentials:

**Windows (PowerShell):**
```powershell
.\scripts\setup-parameters.ps1
```

**macOS/Linux:**
```bash
node scripts/setup-parameters.js
```

### Manual Setup

If you prefer to set up parameters manually:

```bash
# Store Stripe Secret Key
aws ssm put-parameter \
  --name "/amplify/stripe/secret-key" \
  --value "sk_live_your_secret_key" \
  --type "SecureString" \
  --description "Stripe Secret Key for Lambda functions"

# Store Stripe Webhook Secret
aws ssm put-parameter \
  --name "/amplify/stripe/webhook-secret" \
  --value "whsec_your_webhook_secret" \
  --type "SecureString" \
  --description "Stripe Webhook Secret for webhook validation"
```

## How It Works

### Backend Configuration

The `backend.ts` file has been updated to:

1. **Import Parameter Store**: Uses AWS CDK's `StringParameter` to reference stored values
2. **Fallback Strategy**: Falls back to environment variables for local development
3. **IAM Permissions**: Grants Lambda functions permission to read from Parameter Store

```typescript
// Reference Parameter Store values securely
const stripeSecretKey = StringParameter.valueForStringParameter(
  parametersStack, 
  "/amplify/stripe/secret-key"
);

// Set environment variables with fallbacks
backend.createCheckoutSession.addEnvironment(
  "STRIPE_SECRET_KEY", 
  process.env.STRIPE_SECRET_KEY || stripeSecretKey
);
```

### Lambda Function Access

Each Lambda function is granted the necessary IAM permissions:

```typescript
const parameterStorePolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ["ssm:GetParameter", "ssm:GetParameters"],
  resources: ["arn:aws:ssm:*:*:parameter/amplify/stripe/*"],
});
```

## Development Workflow

### Local Development

For local development, you can still use `.env` files. The system uses a fallback strategy:

1. **Production**: Parameters are loaded from AWS Parameter Store
2. **Development**: Parameters fall back to `.env` file values

### Deployment

1. **First Time**: Run the setup script to store parameters
2. **Updates**: Update parameters using AWS CLI or AWS Console
3. **Deploy**: Parameters are automatically available to Lambda functions

## Security Best Practices

### Parameter Naming Convention

- Use hierarchical naming: `/amplify/stripe/secret-key`
- Include service context in the path
- Use descriptive names

### Access Control

The IAM policy restricts access to parameters under `/amplify/stripe/*`:

```json
{
  "Effect": "Allow",
  "Action": ["ssm:GetParameter", "ssm:GetParameters"],
  "Resource": "arn:aws:ssm:*:*:parameter/amplify/stripe/*"
}
```

### Parameter Types

- Use `SecureString` for sensitive data (automatically encrypted)
- Use `String` for non-sensitive configuration values

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your AWS credentials have `ssm:PutParameter` permissions
2. **Parameter Not Found**: Verify the parameter name matches exactly
3. **Access Denied in Lambda**: Check that the IAM role has the correct permissions

### Verification

Check if parameters are stored correctly:

```bash
# List parameters
aws ssm describe-parameters --filters "Key=Name,Values=/amplify/stripe"

# Get parameter value (will show encrypted for SecureString)
aws ssm get-parameter --name "/amplify/stripe/secret-key" --with-decryption
```

## Migration from .env

If you're migrating from `.env` files:

1. **Run Setup**: Use the setup script to store parameters
2. **Deploy**: Deploy your updated backend configuration
3. **Verify**: Test that Lambda functions can access parameters
4. **Clean Up**: Remove sensitive values from `.env` files (keep structure for local dev)

## Cost Considerations

AWS Parameter Store pricing:
- **Standard Parameters**: Free (up to 10,000 parameters)
- **Advanced Parameters**: $0.05 per parameter per month
- **API Calls**: $0.05 per 10,000 requests

For most applications, the cost is negligible compared to the security benefits.