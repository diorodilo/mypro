const ActivityLog = require("../models/ActivityLog");

// Helper function to log activity
const logActivity = async (userId, action, entityType, description, details = {}, ipAddress = null) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      description,
      details,
      ipAddress
    });
  } catch (error) {
    // Silent fail - don't break the main flow
    console.error("Activity logging failed:", error.message);
  }
};

// Activity helpers
const activityTypes = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT'
};

const entityTypes = {
  SPARE_PART: 'SPARE_PART',
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  USER: 'USER',
  REPORT: 'REPORT'
};

module.exports = {
  logActivity,
  activityTypes,
  entityTypes
};
