const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string()
    .trim()        // Removes leading/trailing whitespace (clean data)
    .lowercase()   // Ensures all emails are stored consistently and good for lookups
    .email()       // Strictly validates the email format should be like user@domain.com
    .required(),   // The email must be present
  name: Joi.string()
    .trim()        // Removes leading and trailing whitespace
    .min(3)        // Name must be at least 3 characters long
    .max(30)       // Name cannot exceed 30 characters
    .required(),   // Name is mandatory
  password: Joi.string()
    .trim()        // Removes leading/trailing whitespace (prevents password typos)
    .min(8)        // Enforces a minimum length of 8 characters
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
    // regex for at least one uppercase,
    // one lowercase,
    // one number,
    // and one special character
    .required()
    .messages({
      // Custom error message for clarity when the password fails the pattern check
      "string.pattern.base":
        "Password must be at least 8 characters long and include upper and lower case letters, a number, and a special character.",
    }),
});
module.exports = { userSchema };