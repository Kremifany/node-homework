const { StatusCodes } = require("http-status-codes");

const notFoundHandlerMiddleware = (req, res) => { 
  if (!res.headersSent) {
    console.log(StatusCodes.NOT_FOUND)
    return res
      .status(StatusCodes.NOT_FOUND)
      .send("Not found");
  }
};

module.exports = notFoundHandlerMiddleware;

