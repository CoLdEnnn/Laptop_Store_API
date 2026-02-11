require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./app/routes/auth.routes");
const userRoutes = require("./app/routes/user.routes");
const laptopRoutes = require("./app/routes/laptop.routes");
const orderRoutes = require("./app/routes/order.routes");
const statsRoutes = require("./app/routes/stats.routes");

const errorHandler = require("./app/middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// === Main API (with /api prefix) ===
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/laptops", laptopRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);

app.use("/", authRoutes)
app.use("/users", userRoutes);
app.use("/orders", orderRoutes);

app.use(express.static(path.join(__dirname, "..", "client")));

app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

app.use(errorHandler);

module.exports = app;
