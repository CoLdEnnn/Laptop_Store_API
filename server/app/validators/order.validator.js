const Joi = require("joi");

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        laptopId: Joi.string().required(),
        qty: Joi.number().integer().min(1).required()
      })
    )
    .min(1)
    .required()
});

module.exports = { createOrderSchema };
