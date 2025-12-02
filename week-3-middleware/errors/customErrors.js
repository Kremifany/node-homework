
class ValidationError extends Error {
  constructor(message) {
    // 1. Call the parent constructor with the error message.
    super(message);

    // 2. Set the name property to the class name.
    //    This is crucial for identifying the error type.
    this.name = 'ValidationError';
    this.statusCode = 400;
    }
}

class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}


module.exports = {ValidationError, NotFoundError, UnauthorizedError}
