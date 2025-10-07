import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { apiFunction } from "./functions/api-function/resource";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./functions/stripe/resource";
import { debugSubscription } from "./functions/debug-subscription/resource";
import { auth } from "./auth/resource";
import { data, MODEL_ID, generateHaikuFunction } from "./data/resource";

const backend = defineBackend({
  auth,
  data,
  apiFunction,
  generateHaikuFunction,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  debugSubscription
});

// Environment variables for Stripe functions
// These use .env file values during deployment and can fall back to Parameter Store at runtime
backend.createCheckoutSession.addEnvironment("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "");
backend.createCheckoutSession.addEnvironment("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL || "https://www.humanizeaicontents.com");
backend.createPortalSession.addEnvironment("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "");
backend.handleWebhook.addEnvironment("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "");
backend.handleWebhook.addEnvironment("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET || "");
// Pass the GraphQL API reference to the webhook function so it can access the endpoint automatically
backend.handleWebhook.addEnvironment("AMPLIFY_DATA_GRAPHQL_ENDPOINT", `https://${backend.data.resources.graphqlApi.apiId}.appsync-api.${Stack.of(backend.data.resources.graphqlApi).region}.amazonaws.com/graphql`);

// Grant database access to webhook function
backend.handleWebhook.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "appsync:GraphQL"
    ],
    resources: ["*"]
  })
);

backend.generateHaikuFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    resources: [
      // Foundation model ARNs (legacy format with us. prefix)
      "arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-east-2::foundation-model/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-west-2::foundation-model/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:*::foundation-model/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      // Foundation model ARNs (without us. prefix)
      "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0",
      // Inference profile ARNs (new format for Claude 3.5 Sonnet)
      "arn:aws:bedrock:us-east-1:*:inference-profile/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-east-2:*:inference-profile/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-west-2:*:inference-profile/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:*:*:inference-profile/us.anthropic.claude-3-5-sonnet-20240620-v1:0",
      // Inference profile ARNs (without us. prefix)
      "arn:aws:bedrock:us-east-1:*:inference-profile/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-east-2:*:inference-profile/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:us-west-2:*:inference-profile/anthropic.claude-3-5-sonnet-20240620-v1:0",
      "arn:aws:bedrock:*:*:inference-profile/anthropic.claude-3-5-sonnet-20240620-v1:0",
    ],
  })
);

// create a new API stack
const apiStack = backend.createStack("api-stack");

// create a new REST API
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://www.humanizeaicontents.com", "http://localhost:5173", "https://localhost:5173"],
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.apiFunction.resources.lambda
);

// Stripe function integrations
const checkoutIntegration = new LambdaIntegration(
  backend.createCheckoutSession.resources.lambda
);
const portalIntegration = new LambdaIntegration(
  backend.createPortalSession.resources.lambda
);
const webhookIntegration = new LambdaIntegration(
  backend.handleWebhook.resources.lambda
);
const debugIntegration = new LambdaIntegration(
  backend.debugSubscription.resources.lambda
);

// create a new resource path with IAM authorization
const itemsPath = myRestApi.root.addResource("ai", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

// add methods you would like to create to the resource path
itemsPath.addMethod("GET", lambdaIntegration);
itemsPath.addMethod("POST", lambdaIntegration);
itemsPath.addMethod("DELETE", lambdaIntegration);
itemsPath.addMethod("PUT", lambdaIntegration);

// add a proxy resource path to the API
itemsPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = myRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

booksPath.addMethod("POST", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

booksPath.addMethod("PUT", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Add Stripe API endpoints
const stripePath = myRestApi.root.addResource("stripe", {
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://www.humanizeaicontents.com", "http://localhost:5173", "https://localhost:5173"],
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
  },
});

// Create checkout session endpoint (requires auth)
const checkoutPath = stripePath.addResource("create-checkout-session", {
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://www.humanizeaicontents.com", "http://localhost:5173", "https://localhost:5173"],
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
  },
});
checkoutPath.addMethod("POST", checkoutIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Create portal session endpoint (requires auth)
const portalPath = stripePath.addResource("create-portal-session", {
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://www.humanizeaicontents.com", "http://localhost:5173", "https://localhost:5173"],
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
  },
});
portalPath.addMethod("POST", portalIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// Webhook endpoint (no auth required)
const webhookPath = stripePath.addResource("webhook", {
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://www.humanizeaicontents.com", "http://localhost:5173", "https://localhost:5173"],
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
  },
});
webhookPath.addMethod("POST", webhookIntegration);

// Debug subscription endpoint (requires auth)
const debugPath = stripePath.addResource("debug-subscription", {
  defaultCorsPreflightOptions: {
    allowOrigins: ["https://www.humanizeaicontents.com", "http://localhost:5173", "https://localhost:5173"],
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
  },
});
debugPath.addMethod("GET", debugIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/ai", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/ai/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/stripe/*", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});