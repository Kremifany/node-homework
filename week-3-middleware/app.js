const express = require('express');
const addRequestIdMiddleware = require("./middleware/add-requestId");
const logMiddleware = require("./middleware/log");
const validateContentTypeMiddleware = require("./middleware/validate-content-header");
const notFoundHandlerMiddleware = require("./middleware/not-found");
const setSecurityHeadersMiddleware =require("./middleware/set-security-headers");

const path = require('path');
const dogsRouter = require('./routes/dogs');
const errorHandler = require("./middleware/error-handler");
 

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Your middleware here
app.use(addRequestIdMiddleware);
app.use(logMiddleware);
app.use(setSecurityHeadersMiddleware);





app.use(validateContentTypeMiddleware);
app.use('/', dogsRouter); // Do not remove this line

app.use(notFoundHandlerMiddleware)
app.use(errorHandler);

const server =	app.listen(3000, () => console.log("Server listening on port 3000"));
module.exports = server;