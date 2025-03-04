const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load biến môi trường
dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));

module.exports = app;
