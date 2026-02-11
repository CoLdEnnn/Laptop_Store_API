const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const controller = require("../controllers/stats.controller");

const router = express.Router();

router.get("/inventory-by-brand", auth, isAdmin, controller.inventoryByBrand);
router.get("/revenue-by-brand", auth, isAdmin, controller.revenueByBrand);

module.exports = router;
