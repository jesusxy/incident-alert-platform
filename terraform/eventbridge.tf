resource "aws_cloudwatch_event_rule" "heartbeat_schedule" {
  name                = "${var.environment}-heartbeat-schedule"
  description         = "Invoke heartbeat every minute"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "heartbeat_target" {
  rule      = aws_cloudwatch_event_rule.heartbeat_schedule.name
  target_id = "HeartbeatLambda"
  arn       = aws_lambda_function.heartbeat.arn
}

resource "aws_cloudwatch_event_rule" "monitor_schedule" {
  name                = "${var.environment}-monitor-schedule"
  description         = "Invoke monitor Lambda every minute"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "monitor_target" {
  rule      = aws_cloudwatch_event_rule.monitor_schedule.name
  target_id = "MonitorLambda"
  arn       = aws_lambda_function.monitor.arn
}

resource "aws_lambda_permission" "allow_eventbridge_heartbeat" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.heartbeat.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.heartbeat_schedule.arn # eventbridge is source of the invocation
}

resource "aws_lambda_permission" "allow_eventbridge_monitor" {
  statement_id  = "AllowMonitorLambdaInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monitor_schedule.arn
}
