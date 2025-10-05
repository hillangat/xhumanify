## AWS Amplify React+Vite Starter Template

This repository provides a starter template for creating applications using React+Vite and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

This template equips you with a foundational React application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.
- **Stripe Integration**: Complete subscription management with secure payment processing.
- **AI Content Generation**: Claude 3.5 Sonnet integration for content humanization.
- **Usage Tracking**: Token-based usage limits with subscription tier enforcement.

## Environment Setup

### Secure Credential Management

This application uses AWS Parameter Store for secure credential management instead of `.env` files. This provides enhanced security and eliminates deployment issues.

**Quick Setup:**
```powershell
# Windows
.\scripts\setup-parameters.ps1

# macOS/Linux  
node scripts/setup-parameters.js
```

For detailed instructions, see: [Parameter Store Setup Guide](docs/parameter-store-setup.md)

### Local Development

For local development, create a `.env` file with your credentials:
```
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

The system automatically falls back to Parameter Store values in production.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.