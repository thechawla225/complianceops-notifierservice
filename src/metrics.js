"use strict";

// Prometheus metrics (Phase 08.1). The notifier is an SQS worker, not an API, so instead of request (RED) metrics it
// exposes worker metrics: what it processed, why polling failed, and a heartbeat proving the loop is still alive.
// Served at GET /metrics (server.js) with Node's default process metrics.

const client = require("prom-client");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

// "invalid" messages are deleted (so they can't block the queue), which makes this the only trace of a lost alert
const messagesProcessed = new client.Counter({
  name: "notifier_messages_processed_total",
  help: "SQS messages handled, by result (dispatched or invalid).",
  labelNames: ["result"],
  registers: [registry],
});

// Labelled by error class (e.g. CredentialsProviderError, TimeoutError): a small, bounded set that says why
const pollErrors = new client.Counter({
  name: "notifier_poll_errors_total",
  help: "Failed SQS poll cycles, by error name.",
  labelNames: ["error"],
  registers: [registry],
});

// Heartbeat: alert when time() minus this is too large. Catches a stuck or crashed loop even when nothing errors.
const lastSuccessfulPoll = new client.Gauge({
  name: "notifier_last_successful_poll_timestamp_seconds",
  help: "Unix time of the last poll cycle that completed without error.",
  registers: [registry],
});

module.exports = { registry, messagesProcessed, pollErrors, lastSuccessfulPoll };
