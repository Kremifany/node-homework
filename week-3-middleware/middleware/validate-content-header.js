const { ValidationError } = require("../errors/errors");
const validateContentTypeMiddleware = (req,res,next)=>{
  
  if(req.method === 'POST' && req.get("content-type") !== 'application/json'){
    throw new ValidationError("Content-Type must be application/json");  
  }
 next();
}

module.exports = validateContentTypeMiddleware