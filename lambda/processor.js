const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE = process.env.INCIDENTS_TABLE;
const TTL_SECONDS = parseInt(process.env.TTL_SECONDS, 10) || 604800;

exports.handler = async (event) => {
  console.log(`[🔔 Processor] Received ${event.Records.length} SNS record(s)`);

  for (const record of event.Records) {
    await processSNSMessage(record);
  }
  console.log(`[✅ Processor] All records processed successfully`);
};

const processSNSMessage = async (record) => {
  const { service, missedAt } = JSON.parse(record.Sns.Message);
  const incidentId = uuidv4();

  const now = Date.now();
  const expiresAt = Math.floor(now / 1000) + TTL_SECONDS;
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          createdAt: now,
          ExpiresAt: expiresAt,
          missedAt,
          incidentId,
          service,
          status: "OPEN",
        },
      })
    );
    console.log(
      `[✅ PUT SUCCESS] Incident ${incidentId} created for service ${service}`
    );
  } catch (error) {
    console.error(`[❌ PUT Error] Incident ${incidentId}`, error);
    throw error;
  }
};
