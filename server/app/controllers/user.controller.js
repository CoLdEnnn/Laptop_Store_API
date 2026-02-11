const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id name email role createdAt");
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;


    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (exists) return res.status(409).json({ message: "Email already used" });
    }

    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;

    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true })
      .select("_id name email role createdAt");

    return res.json({ user });
  } catch (e) {
    return next(e);
  }
};
