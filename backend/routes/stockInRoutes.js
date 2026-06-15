const router = require("express").Router();
const StockIn = require("../models/StockIn");
const SparePart = require("../models/SparePart");

// Create stock in (user-specific)
router.post("/", async (req, res) => {
  try {
    const { sparePart, stockInQuantity, stockInUnitPrice, stockInDate } = req.body;
    
    if (!sparePart || !stockInQuantity) {
      return res.status(400).json("Spare part and quantity are required");
    }
    
    // Verify the spare part belongs to the user
    const part = await SparePart.findOne({ _id: sparePart, userId: req.userId });
    if (!part) {
      return res.status(404).json("Spare part not found");
    }
    
    // Update quantity
    part.quantity += Number(stockInQuantity);
    await part.save();

    // Create stock in record with userId
    const stockIn = await StockIn.create({
      userId: req.userId,
      sparePart,
      stockInQuantity: Number(stockInQuantity),
      stockInUnitPrice: stockInUnitPrice || 0,
      stockInDate: stockInDate || new Date()
    });
    
    // Populate and return
    const populated = await StockIn.findById(stockIn._id).populate("sparePart");
    res.json(populated);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all stock in (user-specific)
router.get("/", async (req, res) => {
  try {
    const data = await StockIn.find({ userId: req.userId })
      .populate("sparePart")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Delete stock in
router.delete("/:id", async (req, res) => {
  try {
    const stockIn = await StockIn.findOne({ _id: req.params.id, userId: req.userId });
    if (!stockIn) return res.status(404).json("Not found");
    
    // Reverse the quantity change
    const part = await SparePart.findById(stockIn.sparePart);
    if (part) {
      part.quantity -= stockIn.stockInQuantity;
      if (part.quantity < 0) part.quantity = 0;
      await part.save();
    }
    
    await StockIn.findByIdAndDelete(req.params.id);
    res.json("Deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
