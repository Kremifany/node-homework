const express = require("express");
const app = express();
const errorHandler = require("./middleware/error-handler");
const notFoundHandler = require("./middleware/not-found");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes"); 
const userRouter = require("./routes/userRoutes");
const analyticRouter = require("./routes/analyticsRoutes");
const prisma = require("./db/prisma");

app.use(express.json());
global.users = [];
global.tasks = [];
global.user_id = null; // this will hold the currently logged in user info
app.use((req,res,next)=>{
  console.log("req.path", req.path,"req.method", req.method,"req.query", req.query)
  next()
})

app.use("/api/users",userRouter);
app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/analytics", analyticRouter);



app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1;`
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.post("/testpost", (req,res) => {
  res.send("testpost")
  console.log("testpost")
}
)

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );


server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  try {
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
    // await pool.end();
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    // If you have DB connections, close them here
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    console.log('Exiting process...');
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));  // ctrl+c
process.on('SIGTERM', () => shutdown(0)); // e.g. `docker stop`
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown(1);
});

module.exports = { app, server} ;