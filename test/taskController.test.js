require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database!
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkMutate,
} = require("../controllers/taskController");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({data: { name: "Bob", 
    email: "bob@sample.com", hashedPassword: "nonsense"}});
  user2 = await prisma.User.create({data: { name: "Alice", 
    email: "alice@sample.com", hashedPassword: "nonsense"}});
});

describe("testing task creation", () => {
    it("14. cant create a task without a user id", async () => {
        const req = httpMocks.createRequest({
        method: "POST",
        body: { title: "first task" },
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        try {
        await waitForRouteHandlerCompletion(create,req, saveRes);
        } catch (e) {
        expect(e.name).toBe("TypeError");
        }
    });
    it("15. you can't create a task with a bogus user id", async () => {
        const req = httpMocks.createRequest({
        method: "POST",
        body: { title: "first task" },
        });
        req.user = { id: 9999 }; // non existent user id
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        try {
        await waitForRouteHandlerCompletion(create,req, saveRes);
        } catch (e) {
        expect(e.name).toBe("PrismaClientKnownRequestError");
        }
  });
    it("16. If you have a valid user id, create() succeeds", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: user1.id }; // valid user id
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    // expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create,req, saveRes);
        expect(saveRes.statusCode === 201);
    } catch (e) {
        console.error("Unexpected error:", e);
    }
  });
  it("17.The object returned from the create() call has the expected title", async () => {
    const saveData = saveRes._getJSONData();
    saveTaskId = saveData.id;
    expect(saveData.title).toBe("first task");
  });
  it("18. The object has the right value for isCompleted.", async () => {
    const saveData = saveRes._getJSONData();
    expect(saveData.isCompleted).toBe(false);
  });
  it("19.The object does not have any value for userId.", async () => {
    const saveData = saveRes._getJSONData();
    expect(saveData.userId).toBeUndefined();
  });
})
describe("test getting created tasks", () => {
    it("20. You can't get a list of tasks without a user id.", async () => {
        const req = httpMocks.createRequest({
        method: "GET",
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        try {
            await waitForRouteHandlerCompletion(index,req, saveRes);
        } catch (e) {
        expect(e.name).toBe("TypeError");
        }
    });
    it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
        const req = httpMocks.createRequest({
        method: "GET",
        });
        req.user = { id: user1.id }; // valid user id
    
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        await waitForRouteHandlerCompletion(index, req, saveRes);
        expect(saveRes.statusCode).toBe(200);
    });
    it("22. The returned object has a tasks array of length 1.", async () => {
    saveData = saveRes._getJSONData(); 
    expect(saveData.tasks.length).toBe(1);
    });
    it("23. The title in the first array object is as expected.", async () => {
        expect(saveData.tasks[0].title).toBe("first task");
    });
    it("24. The first array object does not contain a userId.", async () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
    });
    it("25. If you get the list of tasks using the userId from user2, you get a 404.", async () => {
        const req = httpMocks.createRequest({
        method: "GET",
        });
        req.user = { id: user2.id }; // valid user id with no tasks
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        await waitForRouteHandlerCompletion(index,req, saveRes);
        expect(saveRes.statusCode).toBe(404);
        });
    it("26. You can retrieve the created task using show().", async () => {
        const req = httpMocks.createRequest({
        method: "GET",
        });
        req.user = { id: user1.id };
        req.params = { id: saveTaskId.toString() }; 
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        await waitForRouteHandlerCompletion(show, req, saveRes);
        expect(saveRes.statusCode).toBe(200);
    });
    it("27. User2 can't retrieve this task entry. You should get a 404", async () => {
        const req = httpMocks.createRequest({
        method: "GET",
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        req.user = { id: user2.id }; // valid user id with no tasks
        req.params = { id: saveTaskId.toString() }; 
       
            await waitForRouteHandlerCompletion(show, req, saveRes);
            expect(saveRes.statusCode).toBe(404);
    });
});
describe(" testing the update and delete of tasks.", () => {
    it("28. User1 can set the task corresponding to saveTaskId to isCompleted: true.", async () => {
        const req = httpMocks.createRequest({
        method: "PATCH",
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        req.user = { id: user1.id }; // valid user id with no tasks
        req.params = { id: saveTaskId.toString() };  
        req.body = { isCompleted: true };   
      
            await waitForRouteHandlerCompletion(update, req, saveRes);
            saveData = saveRes._getJSONData();
            expect(saveData.isCompleted).toBe(true);      
      
    });
    it("29. User2 can't set the task corresponding to saveTaskId of User1 to isCompleted: true..", async () => {
        const req = httpMocks.createRequest({
        method: "PATCH",
        });
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        expect.assertions(1);
        req.user = { id: user2.id }; // valid user id with no tasks
        req.params = { id: saveTaskId.toString() };  
        req.body = { isCompleted: true };   
      
            await waitForRouteHandlerCompletion(update, req, saveRes);
            expect(saveRes.statusCode).toBe(404); 
    
    });
    it("30. User2 can't delete saveTaskId of User1", async () => {
        const req = httpMocks.createRequest({
        method: "DELETE",
        });
        expect.assertions(1);
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        req.user = { id: user2.id }; // valid user id with no tasks
        req.params = { id: saveTaskId.toString() };    
      
            await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
            expect(saveRes.statusCode).toBe(404); 
       
    });
    it("31. User1 can delete this task.", async () => {
        const req = httpMocks.createRequest({
        method: "DELETE",
        });
        expect.assertions(1);
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        req.user = { id: user1.id }; // valid user id with no tasks
        req.params = { id: saveTaskId.toString() };    
        try {
            await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
            expect(saveRes.statusCode).toBe(200); 
        } catch (e) {
            console.log("Caught error as expected:", e);
        }

    });
    it("32. Retrieving user1's tasks now after delete last task returns a 404.", async () => {
        const req = httpMocks.createRequest({
        method: "GET",
        });
        req.user = { id: user1.id }; // valid user id
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        await waitForRouteHandlerCompletion(index, req, saveRes);
        expect(saveRes.statusCode).toBe(404);
    });

});

describe("bulk task operations", () => {
  let taskIds = [];

  beforeEach(async () => {
    await prisma.Task.deleteMany({ where: { userId: user1.id } });
    const taskA = await prisma.Task.create({
      data: { title: "bulk task 1", isCompleted: false, priority: "low", userId: user1.id },
    });
    const taskB = await prisma.Task.create({
      data: { title: "bulk task 2", isCompleted: false, priority: "medium", userId: user1.id },
    });
    const taskC = await prisma.Task.create({
      data: { title: "bulk task 3", isCompleted: true, priority: "high", userId: user1.id },
    });
    taskIds = [taskA.id, taskB.id, taskC.id];
  })
//
  it("32.1. Bulk update matches query criteria.", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      query: { isCompleted: "false" },
      body: { isCompleted: true },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(bulkMutate, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
    const payload = saveRes._getJSONData();
    expect(payload.updated).toBe(2);

    const updatedTasks = await prisma.Task.findMany({
      where: { id: { in: taskIds }, userId: user1.id },
    });
    expect(updatedTasks.filter((task) => task.isCompleted).length).toBe(3);
  });

  it("32.2. Bulk delete removes tasks by id list.", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      body: { ids: taskIds.slice(0, 2) },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(bulkMutate, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
    const payload = saveRes._getJSONData();
    expect(payload.deleted).toBe(2);

    const remainingTasks = await prisma.Task.findMany({
      where: { userId: user1.id },
    });
    expect(remainingTasks.length).toBe(1);
    expect(remainingTasks[0].id).toBe(taskIds[2]);
  });
});

afterAll(() => {
  prisma.$disconnect();
})
