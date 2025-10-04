import { type ClientSchema, a, defineData, defineFunction } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/

export const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export const generateHaikuFunction = defineFunction({
  entry: "./generateHaiku.ts",
  environment: {
    MODEL_ID,
  },
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
      stripeCustomerId: a.string().required(),
      stripeSubscriptionId: a.string(),
      stripePriceId: a.string(),
      status: a.enum(['active', 'canceled', 'past_due', 'incomplete', 'trialing']),
      planName: a.string(), // 'basic', 'pro', 'enterprise'
      currentPeriodStart: a.datetime(),
      currentPeriodEnd: a.datetime(),
      cancelAtPeriodEnd: a.boolean().default(false),
      usageCount: a.integer().default(0),
      usageLimit: a.integer().default(50), // Default to basic plan limit
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner().identityClaim("sub")]),
  UsageTracking: a
    .model({
      operation: a.string().required(), // 'humanify', 'analyze', etc.
      tokensUsed: a.integer(),
      success: a.boolean().default(true),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [allow.owner().identityClaim("sub")]),
  generateHaiku: a
    .query()
    .arguments({ prompt: a.string().required(), tone: a.string() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(generateHaikuFunction))
});

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
