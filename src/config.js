"use strict";

module.exports = {
  port: process.env.PORT || 8003,

  sqsEndpointUrl: process.env.SQS_ENDPOINT_URL || "http://localhost:4566",
  sqsQueueUrl: process.env.SQS_QUEUE_URL || "http://localhost:4566/000000000000/flagged-transactions",
  awsRegion: process.env.AWS_REGION || "us-east-1",

//PLanning on hosting the SQS on AWS, so I will need to add the AWS credentials here, later
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
};