const mongoose = require("mongoose");

const SparePartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  name: { type: String, required: true },
  category: String,
  quantity: { type: Number, default: 0 },
  unitPrice: Number,
  totalPrice: Number
}, { timestamps: true });

module.exports = mongoose.model("SparePart", SparePartSchema);
