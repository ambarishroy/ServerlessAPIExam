import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const cinemaId = event?.pathParameters?.cinemaId;
    const movieId = event?.queryStringParameters?.movie;

    if (!cinemaId || !movieId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "cinemaId and movieId are required" }),
      };
    }

    const command = new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "cinemaId = :cinemaId AND movieId = :movieId",
      ExpressionAttributeValues: {
        ":cinemaId": Number(cinemaId),
        ":movieId": movieId,
      },
    });

    const result = await ddbDocClient.send(command);

    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.Items[0]),
      };
    } else {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Movie not found" }),
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
