"use strict";

const express = require("express");
const { registry } = require("./metrics");

// Only health endpoint is required for this service, since it is a long-running process that polls SQS and dispatches alerts to Slack. The health endpoint is used by Kubernetes liveness and readiness probes.
function createApp() {
  const app = express();
  app.get("/healthz", (req, res) => {
    res.json({ status: "ok" });
  });
  // Prometheus scrape endpoint (Phase 08.1)
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  });
  return app;
}

module.exports = { createApp };
