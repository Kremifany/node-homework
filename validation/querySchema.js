const Joi = require("joi");

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  find: Joi.string().trim().min(1).max(50).optional(),
  sortBy: Joi.string().trim().min(1).max(50).optional().default("createdAt"),
  sortDirection: Joi.string().trim().min(1).max(50).optional().default("desc"),
}); 

module.exports = { querySchema };