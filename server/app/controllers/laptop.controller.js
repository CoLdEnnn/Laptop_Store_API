const Laptop = require("../models/laptop.model");

exports.getAll = async (req, res, next) => {
  try {
    const {
      brand,
      minPrice,
      maxPrice,
      sort = "-createdAt",
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    if (brand) filter.brand = brand;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (p - 1) * l;

    const [items, total] = await Promise.all([
      Laptop.find(filter).sort(sort).skip(skip).limit(l),
      Laptop.countDocuments(filter)
    ]);

    return res.json({
      items,
      meta: { page: p, limit: l, total, pages: Math.ceil(total / l) }
    });
  } catch (e) {
    return next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) return res.status(404).json({ message: "Laptop not found" });
    return res.json(laptop);
  } catch (e) {
    return next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const laptop = await Laptop.create(req.body);
    return res.status(201).json(laptop);
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const laptop = await Laptop.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!laptop) return res.status(404).json({ message: "Laptop not found" });
    return res.json(laptop);
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Laptop.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Laptop not found" });
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
};

exports.purchaseOne = async (req, res, next) => {
  try {
    const updated = await Laptop.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: 1 } },
      { $inc: { stock: -1 } },
      { new: true }
    );
    if (!updated) return res.status(400).json({ message: "Out of stock or not found" });
    return res.json({ ok: true, laptop: updated });
  } catch (e) {
    return next(e);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const updated = await Laptop.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          reviews: {
            userId: req.user.id,
            rating: Number(rating),
            comment: comment || ""
          }
        }
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Laptop not found" });
    return res.json({ ok: true, laptop: updated });
  } catch (e) {
    return next(e);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const laptop = await Laptop.findById(req.params.id);
    if (!laptop) return res.status(404).json({ message: "Laptop not found" });

    const review = laptop.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const isOwner = review.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    review.deleteOne();
    await laptop.save();

    return res.json({ ok: true, laptop });
  } catch (e) {
    return next(e);
  }
};
