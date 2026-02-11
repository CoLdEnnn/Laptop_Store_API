const Joi = require("joi");

const createLaptopSchema = Joi.object({
  brand: Joi.string().trim().min(1).required(),
  model: Joi.string().trim().min(1).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).optional(),
  specs: Joi.object({
    cpu: Joi.string().optional(),
    ram: Joi.string().optional(),
    storage: Joi.string().optional(),
    gpu: Joi.string().optional()
  }).optional()
});

const updateLaptopSchema = Joi.object({
  brand: Joi.string().trim().min(1).optional(),
  model: Joi.string().trim().min(1).optional(),
  price: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  specs: Joi.object({
    cpu: Joi.string().optional(),
    ram: Joi.string().optional(),
    storage: Joi.string().optional(),
    gpu: Joi.string().optional()
  }).optional()
}).min(1);

const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow("").optional()
});

module.exports = { createLaptopSchema, updateLaptopSchema, reviewSchema };
