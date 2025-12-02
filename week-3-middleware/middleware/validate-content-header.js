const { ValidationError } = require("../errors/errors");
const validateContentTypeMiddleware = (req,res,next)=>{
  
  if(req.method === 'POST' && req.get("Content-Type") !== 'application/json'){
    // res.status(ValidationError.status).send(ValidationError(`Content type for request id = ${requestId}`));
    throw new ValidationError(`Content type not application/json for request id = ${req.requestId}`);  
  }
  //res.status(200).send(`Right content type is application/json for requestid = ${requestId}`);
  next();
}

module.exports = validateContentTypeMiddleware