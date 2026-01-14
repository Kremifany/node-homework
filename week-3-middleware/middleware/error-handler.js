const { StatusCodes } = require("http-status-codes");
const logger = require("../logger");
const {ValidationError, NotFoundError, UnauthorizedError} = require('../errors/errors')
const errorHandlerMiddleware = (err, req, res, next) => {

  logger(req,err);
  if (!res.headersSent) {
    if (
      err instanceof ValidationError ||
      err instanceof NotFoundError ||
      err instanceof UnauthorizedError
    ) {
      return res.status(err.statusCode).json({error: err.message, requestId : req.requestId});
    } else {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({error: "Internal Server Error",requestId : req.requestId });
    }
  }
};

module.exports = errorHandlerMiddleware;