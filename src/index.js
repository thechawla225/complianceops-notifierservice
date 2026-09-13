"use strict";
 
const config = require("./config");
const { createApp } = require("./server");
const { startPolling } = require("./sqsConsumer");
 
const app = createApp();
app.listen(config.port, () => {
  console.log(`[notifier] listening on :${config.port}`);
});

startPolling().catch((err) => {
  console.error(`[notifier] polling loop crashed: ${err.message}`);
});