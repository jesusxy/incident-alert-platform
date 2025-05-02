data "archive_file" "all_lambdas" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/../lambda.zip"
}

resource "aws_lambda_function" "heartbeat" {
  function_name    = "${var.environment}-heartbeat-lambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "heartbeat.handler"
  runtime          = "nodejs18.x"
  filename         = data.archive_file.all_lambdas.output_path
  source_code_hash = data.archive_file.all_lambdas.output_base64sha256
  timeout          = 10  # seconds
  memory_size      = 128 # MB

  environment {
    variables = {
      HEARTBEAT_TABLE = aws_dynamodb_table.heartbeat.name
      SERVICE_NAME    = local.service_name
      FAILURE_RATE    = "0.2"
    }
  }
}

resource "aws_lambda_function" "monitor" {
  function_name    = "${var.environment}-monitor-lambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "monitor.handler"
  runtime          = "nodejs18.x"
  filename         = data.archive_file.all_lambdas.output_path
  source_code_hash = data.archive_file.all_lambdas.output_base64sha256
  memory_size      = 128 # MB
  timeout          = 10  # seconds

  environment {
    variables = {
      HEARTBEAT_TABLE = aws_dynamodb_table.heartbeat.name
      ALERT_TOPIC     = aws_sns_topic.alert_topic.arn
      SERVICE_NAME    = local.service_name
      THRESHOLD_MS    = "50000"
    }
  }
}

resource "aws_lambda_function" "processor" {
  function_name    = "${var.environment}-processor-lambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "processor.handler"
  runtime          = "nodejs18.x"
  filename         = data.archive_file.all_lambdas.output_path
  source_code_hash = data.archive_file.all_lambdas.output_base64sha256
  memory_size      = 128 # MB
  timeout          = 10

  environment {
    variables = {
      INCIDENTS_TABLE = aws_dynamodb_table.incidents.name
      TTL_SECONDS     = "604800"
    }
  }
}
