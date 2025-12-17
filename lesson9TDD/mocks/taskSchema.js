const Joi = require("joi");

const taskSchema = Joi.object({
  //Ensures the input is a text string (not a number or boolean).
  //Automatically removes whitespace from the beginning and end of the input
  //Ensures the length of the string is at least 3 characters and at most 30 characters.
  //Makes the title field mandatory; it must be provided in the input data.
  title: Joi.string().trim().min(3).max(30).required(),
  //isCompleted field can be of any type
  //It effectively disables validation for this field.
  isCompleted: Joi.boolean().not(null),
});

const patchTaskSchema = Joi.object({
  //Ensures the input is a string.
  //The field must be present.
  title: Joi.string().required(),
  //Ensures the value is strictly true or false.
  //the value cannot be null or undefined.
  isCompleted: Joi.boolean().not(null),
});

module.exports = { taskSchema, patchTaskSchema };