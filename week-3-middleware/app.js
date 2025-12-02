const express = require('express');
const {ValidationError, NotFoundError, UnauthorizedError} = require('./errors/customErrors')
const addRequestIdMiddleware = require("./middleware/add-requestId");
const logMiddleware = require("./middleware/log");
const path = require('path');
const dogsRouter = require('./routes/dogs');
const errorHandler = require("./middleware/error-handler");
 

const app = express();

app.use(express.json({ limit: "1kb" }));
app.use(express.static(path.join(__dirname, 'public')));

// Your middleware here
app.use(addRequestIdMiddleware);
app.use(logMiddleware);





app.use((req,res,next)=>{
  
  if(req.method === 'POST' && req.get("Content-Type") !== 'application/json'){
    // res.status(ValidationError.status).send(ValidationError(`Content type for request id = ${requestId}`));
    throw new ValidationError(`Content type not application/json for request id = ${req.requestId}`);  
  }
  //res.status(200).send(`Right content type is application/json for requestid = ${requestId}`);
  next();
})
app.use('/', dogsRouter); // Do not remove this line

app.use((req,res)=>{
  if(!res.headersSent){
    throw new NotFoundError("not found or not available");  
  }
})
app.use(errorHandler);

const server =	app.listen(3000, () => console.log("Server listening on port 3000"));
module.exports = server;