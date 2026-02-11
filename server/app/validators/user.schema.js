const Joi = require("joi");

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).max(72).optional()
}).min(1);

module.exports = { updateProfileSchema };
