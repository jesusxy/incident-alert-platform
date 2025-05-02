resource "aws_dynamodb_table" "incidents" {
  name         = "${var.environment}-incidents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "incidentId"

  attribute {
    name = "incidentId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "byStatus"
    hash_key        = "status"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ExpiresAt"
    enabled        = true
  }

  tags = {
    Kind = "incidents-table"
  }
}

resource "aws_dynamodb_table" "heartbeat" {
  name         = "${var.environment}-heartbeat"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "service"

  attribute {
    name = "service"
    type = "S"
  }

  tags = {
    Kind = "heartbeat-table"
  }
}

output "incidents_table_name" {
  value       = aws_dynamodb_table.incidents.name
  description = "Name of the incidents DynamoDB table"
}

output "incidents_table_arn" {
  value       = aws_dynamodb_table.incidents.arn
  description = "ARN of the incidents DynamoDB table"
}
