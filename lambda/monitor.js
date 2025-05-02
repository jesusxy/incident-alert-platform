const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);
const sns = new SNSClient({});

const TABLE = process.env.HEARTBEAT_TABLE;
const ALERT_TOPIC = process.env.ALERT_TOPIC;
const SERVICE_NAME = process.env.SERVICE_NAME;
const THRESHOLD = parseFloat(process.env.THRESHOLD_MS);

exports.handler = async () => {
  console.log(
    `[⏱️ MONITOR] Checking heartbeat for ${SERVICE_NAME} at ${new Date().toISOString()}`
  );

  let lastSeen;
  try {
    const { Item } = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { service: SERVICE_NAME },
      })
    );

    lastSeen = Item?.lastSeen || 0;
  } catch (err) {
    console.error("[❌ DDB GET Error]", err);
    throw err;
  }
  // check staleness
  const now = Date.now();
  if (Date.now() - lastSeen > THRESHOLD) {
    console.warn(`[⚠️ STALE] lastSeen=${lastSeen} (${now - lastSeen}ms ago)`);

    try {
      // publish sns topic
      await sns.send(
        new PublishCommand({
          Message: JSON.stringify({ service: SERVICE_NAME, missedAt: now }),
          TopicArn: ALERT_TOPIC,
        })
      );
      console.log("[✅ SNS PUBLISHED] Alert sent to SNS topic");
    } catch (err) {
      console.error("[❌ SNS PUBLISH Error]", err);
      throw err;
    }
  } else {
    console.log(`[✅ HEALTHY] lastSeen was ${now - lastSeen}`);
  }
};
