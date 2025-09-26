import { defineFunction } from "@aws-amplify/backend";
export const apiFunction = defineFunction({
  name: "api-function",
  timeoutSeconds: 210, // Increase timeout to 210 seconds (max is 900 seconds/15 minutes)
  memoryMB: 512, // Optional: increase memory if needed
});