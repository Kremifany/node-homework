const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  is_completed: Joi.boolean().default(false).not(null),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  is_completed: Joi.boolean().not(null),
}).min(1).message("No attributes to change were specified.");

module.exports = { taskSchema, patchTaskSchema };