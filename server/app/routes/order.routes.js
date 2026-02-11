const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { createOrderSchema } = require("../validators/order.validator");
const controller = require("../controllers/order.controller");

const router = express.Router();
router.get("/admin/all", auth, isAdmin, controller.getAllAdmin);
router.post("/", auth, validate(createOrderSchema), controller.create);
router.get("/", auth, controller.getMine);
router.get("/:id", auth, controller.getById);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, controller.remove);
router.patch("/:id/status", auth, isAdmin, controller.updateStatusAdmin);

module.exports = router;
