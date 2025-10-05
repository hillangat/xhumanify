#!/usr/bin/env node

/**
 * Setup script for AWS Parameter Store
 * This script helps you securely store environment variables in AWS Parameter Store
 * Run this script after configuring your AWS CLI credentials
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setupParameters() {
  console.log('🔐 AWS Parameter Store Setup for Stripe Integration\n');
  console.log('This script will help you securely store your Stripe credentials in AWS Parameter Store.');
  console.log('Make sure you have AWS CLI configured with appropriate permissions.\n');

  try {
    // Check if AWS CLI is available
    execSync('aws --version', { stdio: 'ignore' });
    console.log('✅ AWS CLI is available\n');
  } catch (error) {
    console.error('❌ AWS CLI is not installed or not in PATH');
    console.error('Please install AWS CLI first: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html');
    process.exit(1);
  }

  try {
    // Test AWS credentials
    execSync('aws sts get-caller-identity', { stdio: 'ignore' });
    console.log('✅ AWS credentials are configured\n');
  } catch (error) {
    console.error('❌ AWS credentials are not configured');
    console.error('Please run: aws configure');
    process.exit(1);
  }

  const stripeSecretKey = await question('Enter your Stripe Secret Key (sk_...): ');
  if (!stripeSecretKey.startsWith('sk_')) {
    console.error('❌ Invalid Stripe Secret Key format');
    process.exit(1);
  }

  const stripeWebhookSecret = await question('Enter your Stripe Webhook Secret (whsec_...): ');
  if (!stripeWebhookSecret.startsWith('whsec_')) {
    console.error('❌ Invalid Stripe Webhook Secret format');
    process.exit(1);
  }

  console.log('\n📡 Storing parameters in AWS Parameter Store...\n');

  try {
    // Store Stripe Secret Key
    execSync(`aws ssm put-parameter --name "/amplify/stripe/secret-key" --value "${stripeSecretKey}" --type "SecureString" --description "Stripe Secret Key for Lambda functions" --overwrite`, { stdio: 'inherit' });
    console.log('✅ Stored Stripe Secret Key');

    // Store Stripe Webhook Secret
    execSync(`aws ssm put-parameter --name "/amplify/stripe/webhook-secret" --value "${stripeWebhookSecret}" --type "SecureString" --description "Stripe Webhook Secret for webhook validation" --overwrite`, { stdio: 'inherit' });
    console.log('✅ Stored Stripe Webhook Secret');

    console.log('\n🎉 All parameters stored successfully!');
    console.log('\nYour Stripe credentials are now securely stored in AWS Parameter Store.');
    console.log('The Lambda functions will automatically retrieve these values during execution.');
    console.log('\n🔒 Security Benefits:');
    console.log('- Credentials are encrypted at rest');
    console.log('- Access is controlled by IAM policies');
    console.log('- No sensitive data in your code repository');
    console.log('- Audit trail of parameter access');

  } catch (error) {
    console.error('\n❌ Failed to store parameters:');
    console.error(error.message);
    console.error('\nPlease check your AWS permissions and try again.');
    process.exit(1);
  }

  rl.close();
}

setupParameters().catch(console.error);