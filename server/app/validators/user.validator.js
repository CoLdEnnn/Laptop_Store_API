const Joi = require("joi");

exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).max(72).optional()
}).min(1); 