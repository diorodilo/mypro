const router = require("express").Router();
const StockOut = require("../models/StockOut");
const SparePart = require("../models/SparePart");

// Create stock out (user-specific)
router.post("/", async (req, res) => {
  try {
    const {
      sparePart,
      stockOutQuantity,
      stockOutUnitPrice,
      stockOutDate
    } = req.body;

    if (!sparePart || !stockOutQuantity || !stockOutUnitPrice) {
      return res.status(400).json("All fields required");
    }

    // Verify the spare part belongs to the user
    const part = await SparePart.findOne({ _id: sparePart, userId: req.userId });
    if (!part) return res.status(404).json("Spare part not found");

    if (part.quantity < stockOutQuantity) {
      return res.status(400).json("Not enough stock available");
    }

    const total = stockOutQuantity * stockOutUnitPrice;

    const stockOut = await StockOut.create({
      userId: req.userId,
      sparePart,
      stockOutQuantity,
      stockOutUnitPrice,
      stockOutTotalPrice: total,
      stockOutDate: stockOutDate || new Date()
    });

    // Reduce stock quantity
    part.quantity -= stockOutQuantity;
    await part.save();

    // Populate and return
    const populated = await StockOut.findById(stockOut._id).populate("sparePart");
    res.json(populated);

  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all stock out (user-specific)
router.get("/", async (req, res) => {
  try {
    const data = await StockOut.find({ userId: req.userId })
      .populate("sparePart")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update stock out
router.put("/:id", async (req, res) => {
  try {
    // Get the existing stock out record first
    const existingRecord = await StockOut.findOne({ _id: req.params.id, userId: req.userId });
    if (!existingRecord) return res.status(404).json("Not found");
    
    const { sparePart, stockOutQuantity, stockOutUnitPrice, stockOutDate } = req.body;
    
    // Get the spare part
    const part = await SparePart.findById(sparePart || existingRecord.sparePart);
    if (!part) return res.status(404).json("Spare part not found");
    
    // Calculate quantity difference
    const oldQuantity = existingRecord.stockOutQuantity;
    const newQuantity = Number(stockOutQuantity) || oldQuantity;
    const quantityDiff = newQuantity - oldQuantity;
    
    // Check if we have enough stock for the increase
    if (quantityDiff > 0 && part.quantity < quantityDiff) {
      return res.status(400).json("Not enough stock available");
    }
    
    // Adjust the spare part quantity
    part.quantity -= quantityDiff;
    await part.save();
    
    // Calculate new total price
    const unitPrice = Number(stockOutUnitPrice) || existingRecord.stockOutUnitPrice;
    const totalPrice = newQuantity * unitPrice;
    
    // Update the stock out record
    const data = await StockOut.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        sparePart: sparePart || existingRecord.sparePart,
        stockOutQuantity: newQuantity,
        stockOutUnitPrice: unitPrice,
        stockOutTotalPrice: totalPrice,
        stockOutDate: stockOutDate || existingRecord.stockOutDate
      },
      { new: true }
    ).populate("sparePart");
    
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Delete stock out
router.delete("/:id", async (req, res) => {
  try {
    const stockOut = await StockOut.findOne({ _id: req.params.id, userId: req.userId });
    if (!stockOut) return res.status(404).json("Not found");
    
    // Reverse the quantity change
    const part = await SparePart.findById(stockOut.sparePart);
    if (part) {
      part.quantity += stockOut.stockOutQuantity;
      await part.save();
    }
    
    await StockOut.findByIdAndDelete(req.params.id);
    res.json("Deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
