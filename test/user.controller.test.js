require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { register, logoff, logon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");
const EventEmmitter = require("events");
// a few useful globals
let saveRes = null;
let saveData = null;

const cookie = require("cookie");
function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmmitter,
  });
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");

    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
    
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
});

afterAll(() => {
  prisma.$disconnect();
});

let jwtCookie;

describe("testing logon, register, and logoff", () => {
  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
      headers: {"X-Recaptcha-Test": process.env.RECAPTCHA_BYPASS,
  },
  
    });
    saveRes = MockResponseWithCookies()
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(201); // success!
  });
    it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
  it("35. A string in the cookie array starts with 'jwt='.", async () => {
    const setCookieArray = saveRes.get("Set-Cookie")
    expect(setCookieArray.some((cookieString) => cookieString.startsWith("jwt="))).toBe(true);
  });
  it("36. That string contains 'HttpOnly;'  (This is a security test!)", async () => {
    const setCookieArray = saveRes.get("Set-Cookie")
    expect(setCookieArray.some((cookieString) => cookieString.includes("HttpOnly;"))).toBe(true);
  });
  it("37. The returned data from the register has the expected name.", async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.name).toBe("Bob");
  });
  it("38. The returned data contains a csrfToken.", async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.csrfToken).toBeDefined();
  });
it("39. The user can logoff.", async () => {
    const req = httpMocks.createRequest({
    method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logoff, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
}); 
it("40. The logoff clears the cookie.", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toContain("Jan 1970");
  });
it("41. A logon attempt with a bad password returns a 401.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
it("42.You can't register with an email address that is already registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).not.toBe(201); // success!
  });  
})
describe("Testing JWT middleware", () =>{
    it("61. jwtMiddleware Returns a 401 if the JWT cookie is not present in the req.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  }); 
   it("62. Returns a 401 if the JWT is invalid", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "badToken", roles:"user"}, "badSecret", { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
     it("63.Returns a 401 if the JWT is valid but the CSRF token isn't.", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "badToken",roles:"user"}, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    if (!req.headers) {
      req.headers={};
    }
    req.headers["X-CSRF-TOKEN"]= "goodtoken";
    await waitForRouteHandlerCompletion(jwtMiddleware,req,saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
   it("64.Returns a 401 if the JWT is valid but the CSRF token isn't.", async ()=>{
    const req = httpMocks.createRequest({
      method: "POST"
    })
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "goodtoken", roles:"user"}, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.cookies = {jwt: jwtCookie }
    if (!req.headers) {
      req.headers={};
    }
    req.headers["X-CSRF-TOKEN"]= "goodtoken";
    const next = await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(next).toHaveBeenCalled();
  });
it("65.Returns a 401 if the JWT is valid but the CSRF token isn't.", async ()=>{
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({id: 5, csrfToken: "goodtoken", roles:"user"}, process.env.JWT_SECRET, { expiresIn: "1h" });
    const req = httpMocks.createRequest({
      method: "POST"
    })
    req.cookies = {jwt: jwtCookie }
    if (!req.headers) {
      req.headers={};
    }
    saveData = req;
    req.headers["X-CSRF-TOKEN"]= "goodtoken";
    const next = await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(next).toHaveBeenCalled();
  });
it("66.If both the token and the jwt are good, req.user.id has the appropriate value.", async ()=>{
    expect(saveData.user.id).toBe(5);
  }); 

})