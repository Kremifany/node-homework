const path = require("path");
const fs = require("fs");
const http = require("http");
const httpMocks = require("node-mocks-http");

describe("Assignment 2: Event Handlers, HTTP Servers, and Express", () => {
  const assignmentDir = path.join(__dirname, "../assignment2");
  const rootDir = path.join(__dirname, "..");

  beforeAll(() => {
    if (!fs.existsSync(assignmentDir)) {
      throw new Error(
        "assignment2 directory does not exist. Please create it first.",
      );
    }
  });

  describe("Task 1: Event Emitter and Listener", () => {
    test("events.js should exist and implement time event emitter", () => {
      const eventsPath = path.join(assignmentDir, "events.js");
      expect(fs.existsSync(eventsPath)).toBe(true);

      expect(() => require(eventsPath)).not.toThrow();
    });

    test("events.js should emit time events every 5 seconds", (done) => {
      const eventsPath = path.join(assignmentDir, "events.js");
      const emitter = require(eventsPath);
      expect(emitter.listenerCount("time")).toBe(1);
      emitter.removeAllListeners(); // gotta shut it down!
      done();
    });
  });

  describe("Task 2: HTTP Server", () => {
    test("sampleHTTP.js should exist", () => {
      const httpPath = path.join(assignmentDir, "sampleHTTP.js");
      expect(fs.existsSync(httpPath)).toBe(true);
    });

    test("sampleHTTP.js should handle /time endpoint with JSON response", (done) => {
      const httpPath = path.join(assignmentDir, "sampleHTTP.js");

      const child = require("child_process").spawn("node", [httpPath]);

      setTimeout(() => {
        const req = http.request(
          {
            hostname: "localhost",
            port: 8000,
            path: "/time",
            method: "GET",
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              expect(res.statusCode).toBe(200);
              expect(res.headers["content-type"]).toContain("application/json");

              const jsonData = JSON.parse(data);
              expect(jsonData).toHaveProperty("time");
              expect(typeof jsonData.time).toBe("string");

              child.kill();
              done();
            });
          },
        );

        req.on("error", (err) => {
          child.kill();
          done(err);
        });

        req.end();
      }, 1000);
    });

    test("sampleHTTP.js should handle /timePage endpoint with HTML response", (done) => {
      const httpPath = path.join(assignmentDir, "sampleHTTP.js");

      const child = require("child_process").spawn("node", [httpPath]);

      setTimeout(() => {
        const req = http.request(
          {
            hostname: "localhost",
            port: 8000,
            path: "/timePage",
            method: "GET",
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              expect(res.statusCode).toBe(200);
              expect(res.headers["content-type"]).toContain("text/html");
              expect(data).toContain("<!DOCTYPE html>");
              expect(data).toContain("Clock");
              expect(data).toContain("getTimeBtn");

              child.kill();
              done();
            });
          },
        );

        req.on("error", (err) => {
          child.kill();
          done(err);
        });

        req.end();
      }, 1000);
    });
  });

  describe("Task 3: Express Application", () => {
    const request = require("supertest");
    const { app, server } = require("../app");
    let agent;
    beforeAll(() => {
      agent = request.agent(app);
    });
    test("app.js should exist", () => {
      const appPath = path.join(rootDir, "app.js");
      expect(fs.existsSync(appPath)).toBe(true);
    });
    it("should handle get /", async () => {
      saveRes = await agent.get("/").send();
      expect(saveRes.status).toBe(200);
    });
    it("should handle post /testpost", async () => {
      saveRes = await agent.post("/testpost").send();
      expect(saveRes.status).toBe(200);
    });
    it("should return 404 for unknown route", async () => {
      saveRes = await agent.get("/unknown").send();
      expect(saveRes.status).toBe(404);
    });

    afterAll(() => {
      server.close();
    });
  });

  describe("Task 4: Middleware", () => {
    test("middleware/error-handler.js should report a server error", async () => {
      const errHandler = require("../middleware/error-handler")
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      res.headersSent=false;
      const err = new Error("a server error occurred.");
      await errHandler(err, req,res, null);
      expect(res.statusCode).toBe(500);
    });
    test("middleware/not-found.js should return a 404", async ()=>{
      const notFound = require("../middleware/not-found");
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = () => {};
      await notFound(req,res, next);
      expect(res.statusCode).toBe(404);
    })
  });
});
