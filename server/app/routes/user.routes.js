const express = require("express");
const { auth } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { updateProfileSchema } = require("../validators/user.validator");
const { getProfile, updateProfile } = require("../controllers/user.controller");

const router = express.Router();

router.get("/profile", auth, getProfile);
router.put("/profile", auth, validate(updateProfileSchema), updateProfile);

module.exports = router;
