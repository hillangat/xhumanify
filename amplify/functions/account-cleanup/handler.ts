import type { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Account cleanup request:', JSON.stringify(event, null, 2));

  const { userId } = event.arguments;
  const userIdClaim = event.identity?.sub;

  // Verify the user is requesting to delete their own account
  if (!userIdClaim || userIdClaim !== userId) {
    throw new Error('Unauthorized: You can only delete your own account');
  }

  let totalDeletedRecords = 0;
  const errors: string[] = [];

  try {
    // Define all tables that need cleanup (adjust table names to match your actual DynamoDB table names)
    const tablesToClean = [
      'UserContentHistory',
      'UserFeedback', 
      'UserSubscription',
      'UserSettings',
      'UsageTracking',
      'FeatureVote',
      'FeatureRequest'
    ];

    for (const tableName of tablesToClean) {
      try {
        // Get all records for this user
        const scanParams = {
          TableName: tableName,
          FilterExpression: '#owner = :userId',
          ExpressionAttributeNames: {
            '#owner': 'owner'
          },
          ExpressionAttributeValues: {
            ':userId': userId
          }
        };

        const scanResult = await docClient.send(new ScanCommand(scanParams));
        
        if (scanResult.Items && scanResult.Items.length > 0) {
          // Delete each record
          for (const item of scanResult.Items) {
            const deleteParams = {
              TableName: tableName,
              Key: {
                id: item.id
              }
            };

            await docClient.send(new DeleteCommand(deleteParams));
            totalDeletedRecords++;
          }

          console.log(`Deleted ${scanResult.Items.length} records from ${tableName}`);
        }
      } catch (error) {
        const errorMessage = `Failed to clean ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    const success = errors.length === 0;
    const message = success 
      ? `Successfully deleted ${totalDeletedRecords} records across all tables`
      : `Partial cleanup completed with ${errors.length} errors. Deleted ${totalDeletedRecords} records.`;

    return {
      success,
      deletedRecords: totalDeletedRecords,
      message: message + (errors.length > 0 ? ` Errors: ${errors.join('; ')}` : '')
    };

  } catch (error) {
    console.error('Account cleanup failed:', error);
    
    return {
      success: false,
      deletedRecords: totalDeletedRecords,
      message: `Account cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};