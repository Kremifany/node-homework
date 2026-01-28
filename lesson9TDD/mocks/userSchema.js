const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.any(),
  name: Joi.any(),
  password: Joi.any(),
});

module.exports = { userSchema };