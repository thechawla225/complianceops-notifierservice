"use strict";
 
const { parseFlaggedTransactionMessage } = require("../src/messageParser");
 
const VALID_MESSAGE = JSON.stringify({
  transactionId: "ee4d50b9-06b8-48e8-a593-11c901b317b3",
  endToEndId: "REF20260907004",
  debtorName: "NORTHWIND TRADING CO",
  creditorName: "Example Trading Co",
  instructedAmount: { amount: "500.00", currency: "USD" },
  matchedEntity: "NORTHWIND TRADING CONSORTIUM",
  screeningRef: "SCR-SDN-40347",
});
 
test("parses a well-formed flagged-transaction message", () => {
  const event = parseFlaggedTransactionMessage(VALID_MESSAGE);
  expect(event).toEqual({
    transactionId: "ee4d50b9-06b8-48e8-a593-11c901b317b3",
    endToEndId: "REF20260907004",
    debtorName: "NORTHWIND TRADING CO",
    creditorName: "Example Trading Co",
    instructedAmount: { amount: "500.00", currency: "USD" },
    matchedEntity: "NORTHWIND TRADING CONSORTIUM",
    screeningRef: "SCR-SDN-40347",
  });
});
 
test("throws on invalid JSON", () => {
  expect(() => parseFlaggedTransactionMessage("not json")).toThrow(/not valid JSON/);
});
 
test("throws when a required field is missing", () => {
  const missingRef = JSON.stringify({
    transactionId: "x",
    endToEndId: "y",
    debtorName: "z",
    creditorName: "w",
  });
  expect(() => parseFlaggedTransactionMessage(missingRef)).toThrow(/screeningRef/);
});
 
test("tolerates a missing matchedEntity/instructedAmount (not every message will have them)", () => {
  const minimal = JSON.stringify({
    transactionId: "x",
    endToEndId: "y",
    debtorName: "z",
    creditorName: "w",
    screeningRef: "SCR-CLR-abc123",
  });
  const event = parseFlaggedTransactionMessage(minimal);
  expect(event.matchedEntity).toBeNull();
  expect(event.instructedAmount).toBeNull();
});