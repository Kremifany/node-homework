const { v4: uuidv4 } = require('uuid');

const addRequestIdMiddleware = (req,res,next) =>{
  const requestId = req.headers['x-request-id'] || uuidv4(); 
  res.setHeader('X-Request-ID', requestId);
  req.requestId = requestId
  next();
}

module.exports = addRequestIdMiddleware;