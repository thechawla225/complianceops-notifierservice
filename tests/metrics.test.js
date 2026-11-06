"use strict";

const request = require("supertest");
const { mockClient } = require("aws-sdk-client-mock");
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { createApp } = require("../src/server");
const { buildClient, pollCycle } = require("../src/sqsConsumer");
const { registry } = require("../src/metrics");

// Counters are process-wide, so tests compare before/after values
async function value(name, labels = {}) {
  const metric = await registry.getSingleMetric(name).get();
  const match = metric.values.find((v) => Object.entries(labels).every(([k, val]) => v.labels[k] === val));
  return match ? match.value : 0;
}

const validBody = JSON.stringify({
  transactionId: "txn-1",
  endToEndId: "REF1",
  debtorName: "NORTHWIND TRADING CO",
  creditorName: "Example Trading Co",
  matchedEntity: "NORTHWIND TRADING CONSORTIUM",
  screeningRef: "SCR-SDN-40347",
});

let sqsMock;
let logSpy;
let errorSpy;

beforeEach(() => {
  sqsMock = mockClient(SQSClient);
  sqsMock.on(DeleteMessageCommand).resolves({});
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  sqsMock.restore();
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

test("dispatched and invalid messages are counted separately", async () => {
  sqsMock.on(ReceiveMessageCommand).resolves({
    Messages: [
      { MessageId: "m1", ReceiptHandle: "rh1", Body: validBody },
      { MessageId: "bad", ReceiptHandle: "rh2", Body: "not json" },
    ],
  });
  const dispatched = await value("notifier_messages_processed_total", { result: "dispatched" });
  const invalid = await value("notifier_messages_processed_total", { result: "invalid" });

  expect(await pollCycle(buildClient())).toBe(true);

  expect(await value("notifier_messages_processed_total", { result: "dispatched" })).toBe(dispatched + 1);
  expect(await value("notifier_messages_processed_total", { result: "invalid" })).toBe(invalid + 1);
});

test("a successful poll moves the heartbeat forward", async () => {
  sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [] });
  const before = Date.now() / 1000;

  await pollCycle(buildClient());

  expect(await value("notifier_last_successful_poll_timestamp_seconds")).toBeGreaterThanOrEqual(Math.floor(before));
});

test("a failed poll is counted by error name and doesn't move the heartbeat", async () => {
  sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [] });
  await pollCycle(buildClient());
  const heartbeat = await value("notifier_last_successful_poll_timestamp_seconds");

  const err = new Error("");
  err.name = "CredentialsProviderError";
  sqsMock.on(ReceiveMessageCommand).rejects(err);
  const before = await value("notifier_poll_errors_total", { error: "CredentialsProviderError" });

  expect(await pollCycle(buildClient())).toBe(false);

  expect(await value("notifier_poll_errors_total", { error: "CredentialsProviderError" })).toBe(before + 1);
  expect(await value("notifier_last_successful_poll_timestamp_seconds")).toBe(heartbeat);
});

test("GET /metrics serves Prometheus text with worker and process metrics", async () => {
  const res = await request(createApp()).get("/metrics");

  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toMatch(/^text\/plain/);
  expect(res.text).toContain("notifier_messages_processed_total");
  expect(res.text).toContain("notifier_last_successful_poll_timestamp_seconds");
  expect(res.text).toContain("process_cpu_seconds_total");
});
