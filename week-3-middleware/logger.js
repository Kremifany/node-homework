const logger = (req, error) =>{
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
if (
    (error && error.statusCode == 400) ||
    (error && error.statusCode == 404)
  ) {
    console.warn(
      `WARN: ${error.name} - ${error.message} (Request ID: ${requestID}`);
    }else if (error) {
    console.error(
      `ERROR: ${error.name} - ${error.message} (Request ID: ${requestID}`);
    
  } else {
    console.log(`[${timestamp}]: ${method} ${path} (${requestID})`);
  }
}

module.exports = logger;