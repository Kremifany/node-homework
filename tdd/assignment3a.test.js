const httpMocks = require("node-mocks-http");
const { logon, register, logoff } = require("../controllers/userController");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;

const { storedUsers, setLoggedOnUser } = require("../util/memoryStore.js")

beforeAll(async () => {
  user1 = {
    email: "bob@sample.com",
    password: "Pa$$word20",
    name: "Bob",
  };
  user2 = {
    email: "alice@sample.com",
    password: "Pa$$word20",
    name: "Alice",
  };
  storedUsers.push(user1);
  storedUsers.push(user2);
  setLoggedOnUser(user1);
});

describe("testing logon, register, and logoff", () => {
  it("You can register a user.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "jim@sample.com",
        name: "Jim",
        password: "Pa$$word20",
      },
    });
    saveRes = httpMocks.createResponse();
    await register(req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("The user can be logged on", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "jim@sample.com", password: "Pa$$word20" },
    });
    saveRes = httpMocks.createResponse();
    await logon(req, saveRes); 
    expect(saveRes.statusCode).toBe(200); // success!
  });

  it("returns the expected name.", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.user.name).toBe("Jim");
  });
  it("A logon attempt with a bad password returns a 401", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "jim@sample.com", password: "bad password" },
    });
    saveRes = httpMocks.createResponse();
    await logon(req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("You can register an additional user.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "manuel@sample.com",
        name: "Manuel",
        password: "Pa$$word20",
      },
    });
    saveRes = httpMocks.createResponse();
    await register(req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("You can logon as that new user.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "manuel@sample.com", password: "Pa$$word20" },
    });
    saveRes = httpMocks.createResponse();
    await logon(req, saveRes); // note, won't work if there is a callback
    expect(saveRes.statusCode).toBe(200);
  });
  it("You can now logoff.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = httpMocks.createResponse();
    await logoff(req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
});