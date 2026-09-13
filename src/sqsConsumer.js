"use strict";
 
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const config = require("./config");
const { parseFlaggedTransactionMessage } = require("./messageParser");
const { dispatchAlert } = require("./webhookDispatcher");
 
function buildClient() {
  return new SQSClient({
    endpoint: config.sqsEndpointUrl || undefined,
    region: config.awsRegion,
    credentials: { accessKeyId: config.awsAccessKeyId, secretAccessKey: config.awsSecretAccessKey },
  });
}
 
async function pollOnce(client) {
  const received = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: config.sqsQueueUrl,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 10,
    })
  );
 
  const messages = received.Messages || [];
  for (const message of messages) {
    try {
      const event = parseFlaggedTransactionMessage(message.Body);
      dispatchAlert(event);
    } catch (err) {
      console.error(`[notifier] failed to process message ${message.MessageId}: ${err.message}`);
    }

    await client.send(
      new DeleteMessageCommand({ QueueUrl: config.sqsQueueUrl, ReceiptHandle: message.ReceiptHandle })
    );
  }
 
  return messages.length;
}
 
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
 
// Actual polling loop. This will run forever until the process is killed.
async function startPolling(client = buildClient()) {
  console.log(`[notifier] polling ${config.sqsQueueUrl} ...`);
  for (;;) {
    try {
      await pollOnce(client);
    } catch (err) {
      console.error(`[notifier] poll cycle failed: ${err.message}`);
      await sleep(2000);
    }
  }
}
 
module.exports = { buildClient, pollOnce, startPolling };