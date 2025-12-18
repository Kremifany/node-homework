const logger = require("../logger")
const logMiddleware = (req, res, next) => {
  logger(req);
  next();
};
module.exports = logMiddleware;