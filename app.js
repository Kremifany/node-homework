const express = require("express");

const userRouter  = require("./routes/userRoutes")
const errorHandler = require("./middleware/error-handler");
const notFoundHandler = require("./middleware/not-found");
const taskRouter = require("./routes/taskRoutes"); 
const analyticsRouter = require("./routes/analyticsRoutes");
const prisma = require("./db/prisma");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");
const swagger = require('swagger-ui-express');  
const swaggerDocument = require('./swagger.json');

const app = express();
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(xss());
global.users = [];
global.tasks = [];


app.use(express.json({ limit: "1kb" }));

app.use((req,res,next)=>{
  console.log("req.path", req.path,"req.method", req.method,"req.query", req.query)
  next()
})

app.use("/api/users",userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api-docs", swagger.serve, swagger.setup(swaggerDocument)); // Swagger UI route


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