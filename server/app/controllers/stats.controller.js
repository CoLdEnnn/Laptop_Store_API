const Laptop = require("../models/laptop.model");
const Order = require("../models/order.model");

exports.inventoryByBrand = async (req, res, next) => {
  try {
    const stats = await Laptop.aggregate([
      { $match: { price: { $gte: 0 } } },
      {
        $group: {
          _id: "$brand",
          avgPrice: { $avg: "$price" },
          totalStock: { $sum: "$stock" },
          modelsCount: { $sum: 1 }
        }
      },
      { $sort: { avgPrice: -1 } }
    ]);

    return res.json(stats);
  } catch (e) {
    return next(e);
  }
};

exports.revenueByBrand = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: { $in: ["paid", "shipped"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.brand",
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          soldQty: { $sum: "$items.qty" },
          ordersTouched: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          brand: "$_id",
          _id: 0,
          revenue: 1,
          soldQty: 1,
          ordersCount: { $size: "$ordersTouched" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    return res.json(data);
  } catch (e) {
    return next(e);
  }
};
