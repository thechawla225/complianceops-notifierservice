"use strict";
 
const { dispatchAlert } = require("../src/webhookDispatcher");
 
test("logs the stubbed alert with the key identifying fields", () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
 
  dispatchAlert({
    transactionId: "ee4d50b9-06b8-48e8-a593-11c901b317b3",
    endToEndId: "REF20260907004",
    debtorName: "NORTHWIND TRADING CO",
    creditorName: "Example Trading Co",
    matchedEntity: "NORTHWIND TRADING CONSORTIUM",
    screeningRef: "SCR-SDN-40347",
  });
 
  expect(logSpy).toHaveBeenCalledTimes(1);
  const loggedLine = logSpy.mock.calls[0][0];
  expect(loggedLine).toContain("ee4d50b9-06b8-48e8-a593-11c901b317b3");
  expect(loggedLine).toContain("NORTHWIND TRADING CONSORTIUM");
  expect(loggedLine).toContain("SCR-SDN-40347");
 
  logSpy.mockRestore();
});