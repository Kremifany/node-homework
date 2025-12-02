const { StatusCodes } = require("http-status-codes");
const {ValidationError, NotFoundError, UnauthorizedError} = require('../errors/errors')
const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(
    "--------------------error: \n",
    err.constructor.name,
    JSON.stringify(err, ["name\n", "message\n", "stack\n"]),
  );

  if (!res.headersSent) {
    if (
      err instanceof ValidationError ||
      err instanceof NotFoundError ||
      err instanceof UnauthorizedError
    ) {
      return res.status(err.statusCode).send(err.message);
    } else {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(err.message || "An internal server error occurred.");
    }
  }
};

module.exports = errorHandlerMiddleware;