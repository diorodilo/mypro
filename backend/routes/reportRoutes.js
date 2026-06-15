const router = require("express").Router();
const StockOut = require("../models/StockOut");
const StockIn = require("../models/StockIn");
const SparePart = require("../models/SparePart");
const User = require("../models/User");
const PDFDocument = require("pdfkit");

// Get stock status (user-specific)
router.get("/stock-status", async (req, res) => {
  try {
    const data = await SparePart.find({ userId: req.userId });
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get daily stock out (user-specific)
router.get("/daily-stockout", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = await StockOut.find({
      userId: req.userId,
      stockOutDate: {
        $gte: new Date(today),
        $lt: new Date(today + "T23:59:59")
      }
    }).populate("sparePart");

    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all stock out for user
router.get("/all-stockout", async (req, res) => {
  try {
    const data = await StockOut.find({ userId: req.userId })
      .populate("sparePart")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get user info (stock name)
router.get("/user-info", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Generate PDF report (user-specific)
router.get("/daily-stockout-pdf", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const data = await StockOut.find({ userId: req.userId }).populate("sparePart");

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${user?.stockName || 'Stock'}Report.pdf`);

    doc.pipe(res);
    
    // Header with stock name
    doc.fontSize(20).text(`${user?.stockName || 'Stock'} Report`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown();

    if (data.length === 0) {
      doc.fontSize(12).text("No data available");
    } else {
      data.forEach(item => {
        doc.fontSize(12).text(
          `${item.sparePart?.name || 'Unknown'} | Qty: ${item.stockOutQuantity} | Price: $${item.stockOutUnitPrice || 0} | Total: $${item.stockOutTotalPrice || 0}`
        );
      });
    }

    doc.end();
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
