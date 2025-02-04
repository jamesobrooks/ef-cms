#!/bin/bash

# Sets the external order search enabled flag to "true" in the dynamo deploy table

# Usage
#   ENV=dev ./setup-external-order-search-flag.sh

./check-env-variables.sh \
  "ENV" \
  "AWS_SECRET_ACCESS_KEY" \
  "AWS_ACCESS_KEY_ID"

aws dynamodb put-item --region us-east-1 --table-name "efcms-deploy-${ENV}" --item '{"pk":{"S":"external-order-search-enabled"},"sk":{"S":"external-order-search-enabled"},"current":{"BOOL":true}}'

