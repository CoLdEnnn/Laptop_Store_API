const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createLaptopSchema,
  updateLaptopSchema,
  reviewSchema
} = require("../validators/laptop.validator");
const controller = require("../controllers/laptop.controller");

const router = express.Router();


router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post("/", auth, isAdmin, validate(createLaptopSchema), controller.create);
router.put("/:id", auth, isAdmin, validate(updateLaptopSchema), controller.update);
router.delete("/:id", auth, isAdmin, controller.remove);


router.post("/purchase/:id", auth, controller.purchaseOne);
router.post("/:id/reviews", auth, validate(reviewSchema), controller.addReview);
router.delete("/:id/reviews/:reviewId", auth, controller.deleteReview);

module.exports = router;
