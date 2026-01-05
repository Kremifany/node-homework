const express = require("express");

const app = express();
const { register }  = require("./controllers/userController");
const userRouter  = require("./routes/userRoutes")
const errorHandler = require("./middleware/error-handler");
const notFoundHandler = require("./middleware/not-found");


//storing the data in not persistant  variable
global.user_id = null;
global.users = [];
global.tasks = [];


app.use(express.json({ limit: "1kb" }));

app.use((req,res,next)=>{
  console.log("req.path", req.path,"req.method", req.method,"req.query", req.query)
  next()
})

// app.post("/api/users", (req,res) => {
//   res.send("/api/users route")
//   console.log("route: /api/users")
// }
// )


// app.post("/api/users", (req, res)=>{
//     console.log("This data was posted", JSON.stringify(req.body));
//     res.send("parsed the data");
// });


app.use("/api/users", userRouter);


// app.get("/", (req, res) => {
// //   res.send("Hello, World!");
//   console.log("Hello, World")
// });

// app.get("/", (req, res) => {
//   res.send("Hello, World!");
//   res.send("Hello, World!");
// });

// app.get("/", (req, res) => {
// //   res.send("Hello, World!");
//   throw(new Error("something bad happened!"));
// });


// app.use((err, req, res, next) => {
//   console.log(`A server error occurred responding to a ${req.method} request for ${req.url}.`, err.name, err.message, err.stack);
//   if (!res.headersSent) {
//     res.status(500).send("A server error occurred.");
//   }
// });
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