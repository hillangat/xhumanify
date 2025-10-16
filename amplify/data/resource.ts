import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";
import { handleWebhook } from "../functions/stripe/resource";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/

export const MODEL_ID = "us.anthropic.claude-3-5-sonnet-20240620-v1:0";

export const generateHaikuFunction = defineFunction({
  entry: "./generateHaiku.ts",
  environment: {
    MODEL_ID,
  },
  timeoutSeconds: 180, // Increase timeout to 180 seconds for Bedrock API calls
});

const schema = a.schema({
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
  UserFeedback: a
    .model({
      timestamp: a.datetime().required(),
      humanization_rating: a.integer().required(),
      tone_selected: a.string().required(),
      tone_match: a.string().required(),
      feedback_text: a.string(),
      ease_of_use_rating: a.integer(),
      input_text_length: a.integer(),
      processing_time_ms: a.integer(),
      originalContent: a.string(),
      processedContent: a.string(),
    })
    .authorization((allow) => [allow.owner().identityClaim("sub")]),
  UserSubscription: a
    .model({
      userId: a.string(), // Added to explicitly link to user
      stripeCustomerId: a.string().required(),
      stripeSubscriptionId: a.string(),
      stripePriceId: a.string(),
      status: a.enum(['active', 'canceled', 'pastdue', 'incomplete', 'trialing']),
      planName: a.string(), // 'basic', 'pro', 'enterprise'
      currentPeriodStart: a.datetime(),
      currentPeriodEnd: a.datetime(),
      cancelAtPeriodEnd: a.boolean().default(false),
      usageCount: a.integer().default(0),
      usageLimit: a.integer().default(50), // Default to basic plan limit
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [
      index("userId").queryField("listUserSubscriptionsByUserId"), // Add GSI for userId queries
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"), // Use userId field for ownership
      allow.guest().to(["create", "update", "read", "delete"]) // Allow webhook (IAM) full access
    ]),
  UsageTracking: a
    .model({
      operation: a.string().required(), // 'humanify', 'analyze', etc.
      tokensUsed: a.integer(),
      success: a.boolean().default(true),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [allow.owner().identityClaim("sub")]),
  FeatureRequest: a
    .model({
      title: a.string().required(),
      description: a.string().required(),
      category: a.enum(['textprocessing', 'uiux', 'billing', 'performance', 'integration', 'other']),
      
      // User info
      submitterId: a.string().required(),
      submitterDisplayName: a.string(),
      
      // Voting stats
      upvotes: a.integer().default(0),
      downvotes: a.integer().default(0),
      totalVotes: a.integer().default(0),
      voterCount: a.integer().default(0),
      
      // Status tracking
      status: a.enum(['submitted', 'underreview', 'planned', 'indevelopment', 'testing', 'completed', 'rejected']),
      priority: a.enum(['low', 'medium', 'high', 'critical']),
      adminNotes: a.string(),
      publicResponse: a.string(),
      
      // Implementation
      estimatedEffort: a.enum(['small', 'medium', 'large', 'epic']),
      targetVersion: a.string(),
      assignedTo: a.string(),
      
      // Metadata
      tags: a.string().array(),
      relatedFeatures: a.string().array(),
      duplicateOf: a.string(),
      
      // Timestamps
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      completedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']), // Allow authenticated users to vote
      allow.ownerDefinedIn('submitterId').to(['read', 'update', 'delete']), // Owner has full control
      allow.guest().to(['read']) // Allow public read access
    ]),
  FeatureVote: a
    .model({
      featureRequestId: a.string().required(),
      userId: a.string().required(),
      voteType: a.enum(['upvote', 'downvote']),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create']),
      allow.ownerDefinedIn('userId').to(['create', 'update', 'delete']),
      allow.guest().to(['read'])
    ]),
  FeatureComment: a
    .model({
      featureRequestId: a.string().required(),
      userId: a.string().required(),
      userDisplayName: a.string(),
      content: a.string().required(),
      isAdminResponse: a.boolean().default(false),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.ownerDefinedIn('userId').to(['create', 'update', 'delete']),
      allow.guest().to(['read'])
    ]),
  generateHaiku: a
    .query()
    .arguments({ prompt: a.string().required(), tone: a.string() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(generateHaikuFunction))
}).authorization((allow) => [allow.resource(handleWebhook)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for public operations like generateHaiku
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
