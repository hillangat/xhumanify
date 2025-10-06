// Simple Node.js script to check customer subscription
// Run with: node scripts/check-customer.mjs

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

async function checkCustomerSubscription() {
  console.log('🔍 Checking for customer: cus_TBe7HVjEXcfYEw');
  
  try {
    // We need to find the DynamoDB table name - it follows this pattern:
    // UserSubscription-<hash>-sandbox
    
    // First, let's scan for any UserSubscription tables
    console.log('📊 Scanning for subscription records...');
    
    // You'll need to replace this with your actual table name
    // You can find it in AWS Console > DynamoDB > Tables
    const tableName = "UserSubscription-d3bwf6nkix80ob-sandbox"; // Update this!
    
    const params = {
      TableName: tableName,
      FilterExpression: "stripeCustomerId = :customerId",
      ExpressionAttributeValues: {
        ":customerId": "cus_TBe7HVjEXcfYEw"
      }
    };
    
    const result = await docClient.send(new ScanCommand(params));
    
    if (result.Items && result.Items.length > 0) {
      console.log('✅ Found subscription records:');
      result.Items.forEach((item, index) => {
        console.log(`📋 Subscription ${index + 1}:`, {
          id: item.id,
          stripeCustomerId: item.stripeCustomerId,
          stripeSubscriptionId: item.stripeSubscriptionId,
          planName: item.planName,
          status: item.status,
          usageCount: item.usageCount,
          usageLimit: item.usageLimit,
          updatedAt: item.updatedAt
        });
      });
    } else {
      console.log('❌ No subscription records found for customer: cus_TBe7HVjEXcfYEw');
      
      // Check for free-tier users
      const freeUserParams = {
        TableName: tableName,
        FilterExpression: "stripeCustomerId = :freeId",
        ExpressionAttributeValues: {
          ":freeId": "free-tier-user"
        }
      };
      
      const freeResult = await docClient.send(new ScanCommand(freeUserParams));
      console.log(`🔍 Found ${freeResult.Items?.length || 0} free-tier users`);
      
      freeResult.Items?.forEach((item, index) => {
        console.log(`👤 Free user ${index + 1}:`, {
          id: item.id,
          planName: item.planName,
          status: item.status,
          usageCount: item.usageCount,
          owner: item.owner,
          updatedAt: item.updatedAt
        });
      });
    }
    
    // Check for specific subscription ID
    const subIdParams = {
      TableName: tableName,
      FilterExpression: "stripeSubscriptionId = :subId",
      ExpressionAttributeValues: {
        ":subId": "sub_1SFGpg47Knk6vC3kDshcMEeC"
      }
    };
    
    const subResult = await docClient.send(new ScanCommand(subIdParams));
    console.log(`🔍 Found ${subResult.Items?.length || 0} records with subscription ID: sub_1SFGpg47Knk6vC3kDshcMEeC`);
    
  } catch (error) {
    console.error('❌ Error checking customer subscription:', error);
    console.log('💡 Make sure to update the tableName in this script with your actual DynamoDB table name');
  }
}

checkCustomerSubscription();