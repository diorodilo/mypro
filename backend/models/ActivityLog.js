const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  action: { 
    type: String, 
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STOCK_IN', 'STOCK_OUT']
  },
  entityType: { 
    type: String, 
    required: true,
    enum: ['SPARE_PART', 'STOCK_IN', 'STOCK_OUT', 'USER', 'REPORT']
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  description: { 
    type: String, 
    required: true 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed 
  },
  ipAddress: { 
    type: String 
  }
}, { timestamps: true });

// Index for efficient querying
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ entityType: 1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
