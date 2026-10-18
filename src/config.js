"use strict";

module.exports = {
  port: process.env.PORT || 8003,

  // Unset = real AWS SQS. Set it (e.g. http://localhost:4566) only for LocalStack.
  sqsEndpointUrl: process.env.SQS_ENDPOINT_URL,
  sqsQueueUrl: process.env.SQS_QUEUE_URL || "http://localhost:4566/000000000000/flagged-transactions",
  awsRegion: process.env.AWS_REGION || "us-east-1",

  // Unset = the SDK's default credential chain (IRSA on EKS). Set only for LocalStack.
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
