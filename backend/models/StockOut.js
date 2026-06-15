const mongoose = require("mongoose");

const stockOutSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  sparePart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SparePart",
    required: true
  },
  stockOutQuantity: {
    type: Number,
    required: true
  },
  stockOutUnitPrice: {
    type: Number,
    required: true
  },
  stockOutTotalPrice: {
    type: Number,
    required: true
  },
  stockOutDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("StockOut", stockOutSchema);
