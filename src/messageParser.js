"use strict";


function parseFlaggedTransactionMessage(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (err) {
    throw new Error(`message body is not valid JSON: ${err.message}`);
  }
 
  const required = ["transactionId", "endToEndId", "debtorName", "creditorName", "screeningRef"];
  for (const field of required) {
    if (!parsed[field]) {
      throw new Error(`message is missing required field "${field}"`);
    }
  }
 
  return {
    transactionId: parsed.transactionId,
    endToEndId: parsed.endToEndId,
    debtorName: parsed.debtorName,
    creditorName: parsed.creditorName,
    instructedAmount: parsed.instructedAmount ?? null,
    matchedEntity: parsed.matchedEntity ?? null,
    screeningRef: parsed.screeningRef,
  };
}
 
module.exports = { parseFlaggedTransactionMessage };