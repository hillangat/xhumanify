import type { APIGatewayProxyHandler } from "aws-lambda";

// https://docs.amplify.aws/react/build-a-backend/data/custom-business-logic/connect-bedrock/#step-1---add-amazon-bedrock-as-a-data-source

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  let responseBody = "No body received";
  if (event.body) {
    responseBody = event.body;
  }
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Restrict this to domains you trust
      "Access-Control-Allow-Headers": "*", // Specify only the headers you need to allow
    },
    body: responseBody,
  };
};