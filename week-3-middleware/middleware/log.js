const logMiddleware = (req,res,next) =>{
    const now = new Date();

const dateOptions = { month: 'numeric', day: 'numeric', year: 'numeric' };

const timeOptions = { 
  hour: 'numeric', 
  minute: 'numeric', 
  second: 'numeric', 
  hour12: true, 
  timeZoneName: 'short' 
};

const datePart = now.toLocaleDateString('en-US', dateOptions);
const timePart = now.toLocaleTimeString('en-US', timeOptions);


const timestamp = `${datePart}, ${timePart}`;
const method = req.method;
const path  = req.path;
const requestID = req.requestId;
console.log(`[${timestamp}]: ${method} ${path} (${requestID})`)

next();
}

module.exports = logMiddleware;