import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const cinemaId = event?.pathParameters?.cinemaId;
    const movieId = event?.queryStringParameters?.movie;
    const period = event?.queryStringParameters?.period;

    if (!cinemaId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "cinemaId is required" }),
      };
    }

    let command;
    if (movieId) {
      
      command = new QueryCommand({
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "cinemaId = :cinemaId AND movieId = :movieId",
        ExpressionAttributeValues: {
          ":cinemaId": Number(cinemaId),
          ":movieId": movieId,
        },
      });
    } else if (period) {
      
      command = new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "periodIx",
        KeyConditionExpression: "cinemaId = :cinemaId AND period = :period",
        ExpressionAttributeValues: {
          ":cinemaId": Number(cinemaId),
          ":period": period,
        },
      });
    } else {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Either movieId or period must be provided" }),
      };
    }

    const result = await ddbDocClient.send(command) as QueryCommandOutput;

    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.Items),
      };
    } else {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "No movies found for the given criteria" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
}
