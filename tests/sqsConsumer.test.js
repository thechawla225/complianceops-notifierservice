"use strict";
 
const { mockClient } = require("aws-sdk-client-mock");
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { pollOnce, buildClient } = require("../src/sqsConsumer");
 

let sqsMock;
 
beforeEach(() => {
  sqsMock = mockClient(SQSClient);
});
 
afterEach(() => {
  sqsMock.restore();
});
 
test("no messages: receives, processes nothing, deletes nothing", async () => {
  sqsMock.on(ReceiveMessageCommand).resolves({ Messages: [] });
  const client = buildClient();
 
  const count = await pollOnce(client);
 
  expect(count).toBe(0);
  expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(0);
});
 
test("a well-formed message is dispatched and deleted", async () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const body = JSON.stringify({
    transactionId: "txn-1",
    endToEndId: "REF1",
    debtorName: "NORTHWIND TRADING CO",
    creditorName: "Example Trading Co",
    matchedEntity: "NORTHWIND TRADING CONSORTIUM",
    screeningRef: "SCR-SDN-40347",
  });
  sqsMock.on(ReceiveMessageCommand).resolves({
    Messages: [{ MessageId: "m1", ReceiptHandle: "rh1", Body: body }],
  });
  const client = buildClient();
 
  const count = await pollOnce(client);
 
  expect(count).toBe(1);
  expect(logSpy).toHaveBeenCalledTimes(1);
  expect(logSpy.mock.calls[0][0]).toContain("SCR-SDN-40347");
 
  const deleteCalls = sqsMock.commandCalls(DeleteMessageCommand);
  expect(deleteCalls).toHaveLength(1);
  expect(deleteCalls[0].args[0].input.ReceiptHandle).toBe("rh1");
 
  logSpy.mockRestore();
});
 
test("a malformed message is logged and still deleted, not left to retry forever", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  sqsMock.on(ReceiveMessageCommand).resolves({
    Messages: [{ MessageId: "bad-1", ReceiptHandle: "rh-bad", Body: "not json" }],
  });
  const client = buildClient();
 
  const count = await pollOnce(client);
 
  expect(count).toBe(1);
  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0][0]).toContain("bad-1");
 
  const deleteCalls = sqsMock.commandCalls(DeleteMessageCommand);
  expect(deleteCalls).toHaveLength(1);
  expect(deleteCalls[0].args[0].input.ReceiptHandle).toBe("rh-bad");
 
  errorSpy.mockRestore();
});
 
test("multiple messages in one batch are each processed and deleted independently", async () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const good = JSON.stringify({
    transactionId: "txn-2",
    endToEndId: "REF2",
    debtorName: "Acme Exports Ltd",
    creditorName: "Example Trading Co",
    screeningRef: "SCR-SDN-99999",
  });
  sqsMock.on(ReceiveMessageCommand).resolves({
    Messages: [
      { MessageId: "m1", ReceiptHandle: "rh1", Body: "not json" },
      { MessageId: "m2", ReceiptHandle: "rh2", Body: good },
    ],
  });
  const client = buildClient();
 
  const count = await pollOnce(client);
 
  expect(count).toBe(2);
  expect(sqsMock.commandCalls(DeleteMessageCommand)).toHaveLength(2);
 
  logSpy.mockRestore();
});