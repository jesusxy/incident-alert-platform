resource "aws_sns_topic" "alert_topic" {
  name         = "${var.environment}-alert-topic"
  display_name = "Alert System Topic"

  tags = {
    Purpose = "publish-alerts"
  }
}

output "alert_topic_arn" {
  description = "ARN of the SNS alert topic"
  value       = aws_sns_topic.alert_topic.arn
}

resource "aws_sns_topic_subscription" "processor_sub" {
  topic_arn = aws_sns_topic.alert_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.processor.arn
}

resource "aws_lambda_permission" "allow_sns_processor" {
  statement_id  = "AllowSNSInvokeProcessor"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alert_topic.arn
}
