# Alert-System

A serverless alerting pipeline showcasing AWS Infra-as-Code and Node.js Lambdas.

## Overall Architecture

**link to diagram**

1. **EventBridge** schedules two jobs every minute:
   - **Heartbeat Lambda** writes `lastSeen` to the Heartbeat table (10% of invocations are skipped to simulate failures).
   - **Monitor Lambda** reads that table, and if `now – lastSeen > threshold`, publishes to an SNS **Alert Topic**.
2. **Processor Lambda** subscribes to that SNS topic, and on each alert:
   1. Generates a new `incidentId`
   2. `PutItem` into the Incidents table with `status: "OPEN"`, `createdAt`, `missedAt`, and `ExpiresAt` (TTL).
3. (Future) **Resolver Lambda** or API marks incidents `CLOSED`.

```
[EventBridge → Heartbeat Lambda]
 ↓ writes lastSeen (or skips)
[EventBridge → Monitor Lambda]
 ↓ reads lastSeen; if stale → SNS Publish
[SNS Topic “alert-topic”]
 ↓ invokes
[Processor Lambda]
 ↓ writes OPEN incident to DynamoDB
 (and optionally notifies Slack/email)
[Optional → Resolver Lambda/API]
 ↓ updates incident to CLOSED in DynamoDB
```

**Table Schemas**

- **HeartbeatTable**: `(service PK, lastSeen)`
- **IncidentsTable**: `(incidentId PK, service, missedAt, createdAt, ExpiresAt, status {OPEN|CLOSED})`
