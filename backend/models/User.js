const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  stockName: { type: String, required: true }, // Name of the stock/company
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
