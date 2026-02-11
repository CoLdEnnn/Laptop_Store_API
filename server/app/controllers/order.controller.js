const Order = require("../models/order.model");
const Laptop = require("../models/laptop.model");

const canAccess = (req, order) =>
  req.user.role === "admin" || order.userId.toString() === req.user.id;

exports.create = async (req, res, next) => {
  try {
    const itemsReq = req.body.items;

    const items = [];
    let total = 0;

    for (const it of itemsReq) {
      const laptopId = it.laptopId;
      const qty = Number(it.qty);

      const laptop = await Laptop.findById(laptopId);
      if (!laptop) return res.status(404).json({ message: "Laptop not found" });

      const updatedLaptop = await Laptop.findOneAndUpdate(
        { _id: laptopId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!updatedLaptop) return res.status(400).json({ message: "Not enough stock" });

      items.push({
        laptopId: laptop._id,
        brand: laptop.brand,
        model: laptop.model,
        price: laptop.price,
        qty
      });

      total += laptop.price * qty;
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      total,
      status: "created"
    });

    return res.status(201).json(order);
  } catch (e) {
    return next(e);
  }
};

exports.getMine = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort("-createdAt");
    return res.json(orders);
  } catch (e) {
    return next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!canAccess(req, order)) return res.status(403).json({ message: "Forbidden" });
    return res.json(order);
  } catch (e) {
    return next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!canAccess(req, order)) return res.status(403).json({ message: "Forbidden" });

    if (order.status === "shipped") {
      return res.status(400).json({ message: "Shipped order cannot be updated" });
    }

    const status = req.body?.status;
    if (status === "cancelled" && order.status !== "cancelled") {
      order.status = "cancelled";
      await order.save();

      for (const item of order.items) {
        await Laptop.findByIdAndUpdate(item.laptopId, { $inc: { stock: item.qty } });
      }

      return res.json({ message: "Order cancelled, stock restored", order });
    }

    return res.status(400).json({ message: "Only status=cancelled supported in PUT for now" });
  } catch (e) {
    return next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!canAccess(req, order)) return res.status(403).json({ message: "Forbidden" });

    if (order.status !== "shipped") {
      for (const it of order.items) {
        await Laptop.findByIdAndUpdate(it.laptopId, { $inc: { stock: it.qty } });
      }
    }

    await Order.deleteOne({ _id: order._id });
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
};

exports.getAllAdmin = async (req, res, next) => {
  try {
    const orders = await Order.find().sort("-createdAt");
    return res.json(orders);
  } catch (e) {
    return next(e);
  }
};

exports.updateStatusAdmin = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["created", "paid", "shipped", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Order not found" });
    return res.json(updated);
  } catch (e) {
    return next(e);
  }
};
