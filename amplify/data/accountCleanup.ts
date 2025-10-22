import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";
import { handleWebhook } from "../functions/stripe/resource";

export const MODEL_ID = "us.anthropic.claude-3-5-sonnet-20240620-v1:0";

export const refineHumanizationFunction = defineFunction({
  entry: "./refineHumanization.ts",
  environment: {
    MODEL_ID
  },
  timeoutSeconds: 60,
});

export const humanizeFunction = defineFunction({
  entry: "./humanize.ts",
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 180,
});

export const detectAIContentFunction = defineFunction({
  entry: "./detectAIContent.ts",
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 180,
});

// Account deletion cleanup function
export const accountCleanupFunction = defineFunction({
  entry: "./accountCleanup.ts",
  timeoutSeconds: 60,
});

const schema = a.schema({
  // Existing models...
  Todo: a
    .model({content: a.string()})
    .authorization((allow) => [allow.publicApiKey()]),
  
  UserContentHistory: a
    .model({
      originalContent: a.string().required(),
      processedContent: a.string().required(),
      description: a.string(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner().identityClaim("sub")]),
    
  // Account cleanup mutation
  AccountCleanup: a.customType({
    success: a.boolean().required(),
    deletedRecords: a.integer(),
    message: a.string(),
  }),

  // Mutation for comprehensive account cleanup
  cleanupUserAccount: a
    .mutation()
    .arguments({
      userId: a.string().required(),
    })
    .returns(a.ref("AccountCleanup"))
    .handler(a.handler.function(accountCleanupFunction))
    .authorization((allow) => [allow.owner().identityClaim("sub")]),

  // ... rest of your existing schema
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});