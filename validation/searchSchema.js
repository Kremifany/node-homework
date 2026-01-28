const Joi = require("joi");

const searchSchema = Joi.object({
  find: Joi.string().trim().min(1).max(50).required(),
});

module.exports = { searchSchema } ;