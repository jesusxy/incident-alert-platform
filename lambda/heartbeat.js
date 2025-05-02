const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE = process.env.HEARTBEAT_TABLE;
const SERVICE_NAME = process.env.SERVICE_NAME;
const FAILURE_RATE = parseFloat(process.env.FAILURE_RATE) || 0.1;

exports.handler = async () => {
  console.log("Heartbeat at ", new Date().toISOString());

  if (Math.random() < FAILURE_RATE) {
    console.log("[🔴 FAILURE]: Simulating failure, skipping heartbeat");
    return;
  }

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          service: SERVICE_NAME,
          lastSeen: Date.now(),
        },
      })
    );

    console.log(`[✅ PUT SUCCESS] Wrote heartbeat for ${SERVICE_NAME}`);
  } catch (err) {
    console.error(`[🔴 PUT ERROR]`, err);
    throw err;
  }
};
