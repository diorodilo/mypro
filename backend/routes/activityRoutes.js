const router = require("express").Router();
const ActivityLog = require("../models/ActivityLog");

// Get activity logs for the current user
router.get("/", async (req, res) => {
  try {
    const { action, entityType, startDate, endDate, limit = 50 } = req.query;
    
    const query = { userId: req.userId };
    
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('entityId', 'name');
    
    res.json(logs);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Create activity log (for internal use)
router.post("/", async (req, res) => {
  try {
    const log = await ActivityLog.create({
      ...req.body,
      userId: req.userId,
      ipAddress: req.ip
    });
    res.json(log);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Get activity stats
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await ActivityLog.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const todayStats = await ActivityLog.aggregate([
      { 
        $match: { 
          userId: req.userId,
          createdAt: { $gte: today }
        } 
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({ total: stats, today: todayStats });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
