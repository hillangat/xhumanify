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
});

// Add environment variables for Stripe functions
backend.createCheckoutSession.addEnvironment("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "");
backend.createPortalSession.addEnvironment("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "");
backend.handleWebhook.addEnvironment("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY || "");
backend.handleWebhook.addEnvironment("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET || "");

backend.generateHaikuFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    resources: [
      "arn:aws:bedrock:us-east-2:960297070350:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0",
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
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
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
const stripePath = myRestApi.root.addResource("stripe");

// Create checkout session endpoint (requires auth)
const checkoutPath = stripePath.addResource("create-checkout-session");
checkoutPath.addMethod("POST", checkoutIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});
checkoutPath.addMethod("OPTIONS", checkoutIntegration); // CORS preflight

// Create portal session endpoint (requires auth)
const portalPath = stripePath.addResource("create-portal-session");
portalPath.addMethod("POST", portalIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});
portalPath.addMethod("OPTIONS", portalIntegration); // CORS preflight

// Webhook endpoint (no auth required)
const webhookPath = stripePath.addResource("webhook");
webhookPath.addMethod("POST", webhookIntegration);
webhookPath.addMethod("OPTIONS", webhookIntegration); // CORS preflight

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/ai", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/ai/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
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