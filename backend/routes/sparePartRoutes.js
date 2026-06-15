const router = require("express").Router();
const SparePart = require("../models/SparePart");

// Create spare part (user-specific)
router.post("/", async (req, res) => {
  try {
    const part = await SparePart.create({
      ...req.body,
      userId: req.userId
    });
    res.json(part);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get all spare parts (user-specific)
router.get("/", async (req, res) => {
  try {
    const parts = await SparePart.find({ userId: req.userId });
    res.json(parts);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get single spare part
router.get("/:id", async (req, res) => {
  try {
    const part = await SparePart.findOne({ _id: req.params.id, userId: req.userId });
    if (!part) return res.status(404).json("Not found");
    res.json(part);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Update spare part
router.put("/:id", async (req, res) => {
  try {
    const part = await SparePart.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!part) return res.status(404).json("Not found");
    res.json(part);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Delete spare part
router.delete("/:id", async (req, res) => {
  try {
    const part = await SparePart.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!part) return res.status(404).json("Not found");
    res.json("Deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
