const mongoose = require("mongoose");

const StockInSchema = new mongoose.Schema({
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
  stockInQuantity: { type: Number, required: true },
  stockInDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("StockIn", StockInSchema);
