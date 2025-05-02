# Incident Alert Platform

A serverless alerting pipeline showcasing AWS Infra-as-Code and Node.js Lambdas.

## Overall Architecture

<img width="702" alt="Screenshot 2025-05-02 at 2 07 48 PM" src="https://github.com/user-attachments/assets/2fc205b5-df86-4b80-a845-f05c1137ac52" />

1. **EventBridge** schedules two jobs every minute:
   - **Heartbeat Lambda** writes `lastSeen` to the Heartbeat table (10% of invocations are skipped to simulate failures).
   - **Monitor Lambda** reads that table, and if `now – lastSeen > threshold`, publishes to an SNS **Alert Topic**.
2. **Processor Lambda** subscribes to that SNS topic, and on each alert:
   1. Generates a new `incidentId`
   2. `PutItem` into the Incidents table with `status: "OPEN"`, `createdAt`, `missedAt`, and `ExpiresAt` (TTL).
3. (Future) **Resolver Lambda** or API marks incidents `CLOSED`.

**Table Schemas**

- **HeartbeatTable**: `(service PK, lastSeen)`
- **IncidentsTable**: `(incidentId PK, service, missedAt, createdAt, ExpiresAt, status {OPEN|CLOSED})`

## Quick start (5 min)

```bash
# 1. clone & enter repo
git clone git@github.com:jesusxy/incident-alert-platform.git
cd incident-alert-platform

# 2. deploy (AWS creds must already be configured)
cd terraform
terraform init && terraform apply -auto-approve

# 3. tail logs
aws logs tail /aws/lambda/dev-monitor-lambda --follow
```

**CLI Preview**
---

<img width="903" alt="Screenshot 2025-05-02 at 4 08 47 PM" src="https://github.com/user-attachments/assets/ebef6bdf-fce2-4552-a2cb-58776e0a3bb6" />


