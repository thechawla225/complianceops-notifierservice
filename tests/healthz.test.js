"use strict";
 
const request = require("supertest");
const { createApp } = require("../src/server");
 
test("GET /healthz returns 200 and status ok", async () => {
  const app = createApp();
  const res = await request(app).get("/healthz");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: "ok" });
});