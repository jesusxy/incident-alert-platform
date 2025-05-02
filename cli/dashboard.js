import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import chalk from "chalk";
import dotenv from "dotenv";
import Table from "cli-table3";

dotenv.config();

const INCIDENTS_TABLE = process.env.INCIDENTS_TABLE;
const REGION = process.env.AWS_REGION || "us-east-1";
const GSI_NAME = "byStatus";

if (!INCIDENTS_TABLE) {
  console.error("[❌ ERROR] Incidents Table not set in environment");
  process.exit(1);
}

(async () => {
  const ddbClient = new DynamoDBClient({ region: REGION });
  const ddb = DynamoDBDocumentClient.from(ddbClient);

  try {
    const data = await ddb.send(
      new QueryCommand({
        TableName: INCIDENTS_TABLE,
        IndexName: GSI_NAME,
        KeyConditionExpression: " #s= :open ",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":open": "OPEN" },
      })
    );

    const items = data.Items || [];

    if (items.length === 0) {
      console.log("[✅] No open incidents. All systems normal");
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan("Incident ID"),
        chalk.yellow("Service"),
        chalk.green("Created At"),
        chalk.red("Missed At"),
      ],
      style: { head: [] },
    });

    for (const item of items) {
      const missed = new Date(item.missedAt).toLocaleString();
      const created = new Date(item.createdAt).toLocaleString();
      table.push([item.incidentId, item.service, missed, created]);
    }

    console.log(table.toString());
  } catch (err) {
    console.error("[❌ DB QUERY ERROR]", err);
    process.exit(1);
  }
})();
