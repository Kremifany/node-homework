const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.any(),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().required(),
  isCompleted: Joi.boolean().not(null),
});

module.exports = { taskSchema, patchTaskSchema };