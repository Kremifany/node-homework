require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users 
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user ", () => {
    let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
    let csrfToken = null;
    it("46. it creates the user entry", async () => {
        const newUser = {
        name: "John Deere",
        email: "jdeere@example.com",
        password: "Pa$$word20",
        };
        saveRes = await agent.post("/api/users/register").send(newUser);
        console.log("SaveRes:", saveRes.body);

        expect(saveRes.status).toBe(201);
    });
    it("47.Registration returns an object with the expected name.", async () => {
        expect(saveRes.body.user.name).toBe("John Deere");
    });
    it("48. Test that the returned object includes a csrfToken.", async () => {
        expect(saveRes.body.csrfToken).toBeDefined();
    });
    it("49. You can logon as the newly registered user.", async () => {
        saveRes = await agent.post("/api/users/logon").send({email: "jdeere@example.com",password: "Pa$$word20",});
        csrf = saveRes.body.csrfToken;
        console.log("SaveRes:", saveRes.body);
        expect(saveRes.status).toBe(200);
    });
    it("50. Verify that you are logged in. ", async () => {
        saveRes = await agent.post("/api/tasks").set("X-CSRF-TOKEN", csrf).send();
        expect(saveRes.status).not.toBe(401);
    });

    it("51. You can logoff.", async () => {
        saveRes = await agent.post("/api/users/logoff").set("X-CSRF-TOKEN", csrf).send();
        expect(saveRes.status).toBe(200);
    });
    it("52. Make sure that you are really logged out", async () => {
        saveRes = await agent.post("/api/tasks").set("X-CSRF-TOKEN", csrf).send();
        expect(saveRes.status).toBe(401);
    });

});