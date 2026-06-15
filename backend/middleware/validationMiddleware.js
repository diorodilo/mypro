// Input validation middleware
const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// User validation rules
const userValidationRules = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 4 })
      .withMessage('Password must be at least 4 characters'),
    body('stockName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Stock name must be between 2 and 100 characters')
  ],
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]
};

// Spare part validation rules
const sparePartValidationRules = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters'),
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer'),
    body('unitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number')
  ]
};

// Stock In validation rules
const stockInValidationRules = {
  create: [
    body('sparePart')
      .notEmpty()
      .withMessage('Spare part is required')
      .isMongoId()
      .withMessage('Invalid spare part ID'),
    body('stockInQuantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('stockInUnitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number')
  ]
};

// Stock Out validation rules
const stockOutValidationRules = {
  create: [
    body('sparePart')
      .notEmpty()
      .withMessage('Spare part is required')
      .isMongoId()
      .withMessage('Invalid spare part ID'),
    body('stockOutQuantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('stockOutUnitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number')
  ],
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid stock out ID'),
    body('sparePart')
      .optional()
      .isMongoId()
      .withMessage('Invalid spare part ID'),
    body('stockOutQuantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('stockOutUnitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a non-negative number')
  ]
};

// Common validation rules
const commonValidationRules = {
  idParam: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ]
};

module.exports = {
  validate,
  userValidationRules,
  sparePartValidationRules,
  stockInValidationRules,
  stockOutValidationRules,
  commonValidationRules
};
