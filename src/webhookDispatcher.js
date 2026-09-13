"use strict";
 
function dispatchAlert(event) {
  const line =
    `[notifier] would POST to Slack: transaction ${event.transactionId} ` +
    `(${event.endToEndId}) flagged - debtor "${event.debtorName}", ` +
    `creditor "${event.creditorName}", matched "${event.matchedEntity}", ` +
    `ref ${event.screeningRef}`;
  console.log(line);
}
 
module.exports = { dispatchAlert };