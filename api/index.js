import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 🛠️ MIDDLEWARES
// ==========================================
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// ==========================================
// 🍃 MONGOOSE CONNECTION MANAGER (FOR VERCEL)
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Critical Error: MONGODB_URI environment variable is missing!");
}

// Caching connection globally across serverless function instances
let cachedConnection = global.mongoose;

if (!cachedConnection) {
    cachedConnection = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cachedConnection.conn) {
        return cachedConnection.conn;
    }

    if (!cachedConnection.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10, // Restricts connection pool limits per serverless instance
        };

        cachedConnection.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            console.log("🚀 Fresh MongoDB Connection Established successfully.");
            return mongooseInstance;
        });
    }

    try {
        cachedConnection.conn = await cachedConnection.promise;
    } catch (e) {
        cachedConnection.promise = null;
        throw e;
    }

    return cachedConnection.conn;
};

// Auto-inject DB Connection Middleware for all requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ error: "Database Connection Failed", message: err.message });
    }
});

// ==========================================
// 📂 INLINE DATABASE MONGOOSE SCHEMAS
// ==========================================

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    stockName: { type: String, required: true }
}, { timestamps: true });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Spare Part Schema (Directly from your SparePart.js file)
const SparePartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    category: String,
    quantity: { type: Number, default: 0 },
    unitPrice: Number,
    totalPrice: Number
}, { timestamps: true });
const SparePart = mongoose.models.SparePart || mongoose.model("SparePart", SparePartSchema);

// Stock In Schema (Directly from your uploaded framework logic)
const StockInSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart", required: true },
    stockInQuantity: { type: Number, required: true },
    stockInUnitPrice: { type: Number, default: 0 },
    stockInDate: { type: Date, default: Date.now }
}, { timestamps: true });
const StockIn = mongoose.models.StockIn || mongoose.model("StockIn", StockInSchema);

// Stock Out Schema (Directly from your uploaded framework logic)
const StockOutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sparePart: { type: mongoose.Schema.Types.ObjectId, ref: "SparePart", required: true },
    stockOutQuantity: { type: Number, required: true },
    stockOutUnitPrice: { type: Number, required: true },
    stockOutTotalPrice: { type: Number, required: true },
    stockOutDate: { type: Date, default: Date.now }
}, { timestamps: true });
const StockOut = mongoose.models.StockOut || mongoose.model("StockOut", StockOutSchema);

// Activity Log Schema (Directly from your ActivityLog.js file)
const ActivityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STOCK_IN', 'STOCK_OUT'] },
    entityType: { type: String, required: true, enum: ['SPARE_PART', 'STOCK_IN', 'STOCK_OUT', 'USER', 'REPORT'] },
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart' },
    description: { type: String, required: true },
    ipAddress: { type: String }
}, { timestamps: true });
const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);

// ==========================================
// 🛡️ SECURITY MIDDLEWARE
// ==========================================
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) return res.status(401).json("No authorization token supplied.");

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FALLBACK_JWT_KEY');
        req.userId = decoded.userId;
        req.stockName = decoded.stockName;
        next();
    } catch (err) {
        return res.status(403).json("Invalid or expired session token.");
    }
};

// Unified Activity Logger Helper (Directly matching activityLogger.js logic)
const logActivity = async (userId, action, entityType, entityId, description, req) => {
    try {
        await ActivityLog.create({
            userId,
            action,
            entityType,
            entityId,
            description,
            ipAddress: req ? req.ip : '127.0.0.1'
        });
    } catch (error) {
        console.error("⚠️ Activity logging failed:", error.message);
    }
};

// ==========================================
// 🔐 AUTHENTICATION ROUTES (authRoutes.js)
// ==========================================

app.post("/api/auth/signup", async (req, res) => {
    try {
        const { username, password, stockName } = req.body;
        if (!username || !password || !stockName) return res.status(400).json("All fields are required");
        if (password.length < 4) return res.status(400).json("Password must be at least 4 characters");
        if (stockName.length < 2) return res.status(400).json("Stock name must be at least 2 characters");

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json("Username already exists");

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashed, stockName });

        res.status(201).json({ message: "Signup successful", userId: user._id });
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json("User not found");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json("Wrong password");

        const token = jwt.sign(
            { userId: user._id, stockName: user.stockName },
            process.env.JWT_SECRET || 'FALLBACK_JWT_KEY',
            { expiresIn: "24h" }
        );

        await logActivity(user._id, 'LOGIN', 'USER', null, `User ${username} logged into the system.`, req);
        res.json({ message: "Login Successful", token, stockName: user.stockName, userId: user._id });
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json("User profile not found");
        res.json(user);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// ==========================================
// 🔧 SPARE PARTS ROUTES (sparePartRoutes.js)
// ==========================================

app.post("/api/spare-parts", authenticateToken, async (req, res) => {
    try {
        const part = await SparePart.create({ ...req.body, userId: req.userId });
        await logActivity(req.userId, 'CREATE', 'SPARE_PART', part._id, `Created spare part: ${part.name}`, req);
        res.status(201).json(part);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/spare-parts", authenticateToken, async (req, res) => {
    try {
        const parts = await SparePart.find({ userId: req.userId });
        res.json(parts);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/spare-parts/:id", authenticateToken, async (req, res) => {
    try {
        const part = await SparePart.findOne({ _id: req.params.id, userId: req.userId });
        if (!part) return res.status(404).json("Not found");
        res.json(part);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.put("/api/spare-parts/:id", authenticateToken, async (req, res) => {
    try {
        const part = await SparePart.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true }
        );
        if (!part) return res.status(404).json("Not found");
        await logActivity(req.userId, 'UPDATE', 'SPARE_PART', part._id, `Updated metrics for spare part: ${part.name}`, req);
        res.json(part);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.delete("/api/spare-parts/:id", authenticateToken, async (req, res) => {
    try {
        const part = await SparePart.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!part) return res.status(404).json("Not found");
        await logActivity(req.userId, 'DELETE', 'SPARE_PART', part._id, `Removed component tracking index ID: ${part._id}`, req);
        res.json("Deleted");
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// ==========================================
// 📥 STOCK IN ROUTES (stockInRoutes.js)
// ==========================================

app.post("/api/stock-in", authenticateToken, async (req, res) => {
    try {
        const { sparePart, stockInQuantity, stockInUnitPrice, stockInDate } = req.body;
        if (!sparePart || !stockInQuantity) return res.status(400).json("Spare part and quantity are required");

        const part = await SparePart.findOne({ _id: sparePart, userId: req.userId });
        if (!part) return res.status(404).json("Spare part not found");

        part.quantity += Number(stockInQuantity);
        await part.save();

        const stockIn = await StockIn.create({
            userId: req.userId,
            sparePart,
            stockInQuantity: Number(stockInQuantity),
            stockInUnitPrice: stockInUnitPrice || 0,
            stockInDate: stockInDate || new Date()
        });

        const populated = await stockIn.populate("sparePart");
        await logActivity(req.userId, 'STOCK_IN', 'STOCK_IN', part._id, `Stocked in +${stockInQuantity} units for ${part.name}`, req);
        res.json(populated);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/stock-in", authenticateToken, async (req, res) => {
    try {
        const data = await StockIn.find({ userId: req.userId }).populate("sparePart").sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.delete("/api/stock-in/:id", authenticateToken, async (req, res) => {
    try {
        const stockIn = await StockIn.findOne({ _id: req.params.id, userId: req.userId });
        if (!stockIn) return res.status(404).json("Not found");

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

// ==========================================
// 📤 STOCK OUT ROUTES (stockOutRoutes.js)
// ==========================================

app.post("/api/stock-out", authenticateToken, async (req, res) => {
    try {
        const { sparePart, stockOutQuantity, stockOutUnitPrice, stockOutDate } = req.body;
        if (!sparePart || !stockOutQuantity || !stockOutUnitPrice) return res.status(400).json("All fields required");

        const part = await SparePart.findOne({ _id: sparePart, userId: req.userId });
        if (!part) return res.status(404).json("Spare part not found");

        if (part.quantity < stockOutQuantity) return res.status(400).json("Not enough stock available");

        const total = stockOutQuantity * stockOutUnitPrice;
        const stockOut = await StockOut.create({
            userId: req.userId,
            sparePart,
            stockOutQuantity,
            stockOutUnitPrice,
            stockOutTotalPrice: total,
            stockOutDate: stockOutDate || new Date()
        });

        part.quantity -= stockOutQuantity;
        await part.save();

        const populated = await stockOut.populate("sparePart");
        await logActivity(req.userId, 'STOCK_OUT', 'STOCK_OUT', part._id, `Dispatched -${stockOutQuantity} units of ${part.name}`, req);
        res.json(populated);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/stock-out", authenticateToken, async (req, res) => {
    try {
        const data = await StockOut.find({ userId: req.userId }).populate("sparePart").sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.put("/api/stock-out/:id", authenticateToken, async (req, res) => {
    try {
        const existingRecord = await StockOut.findOne({ _id: req.params.id, userId: req.userId });
        if (!existingRecord) return res.status(404).json("Not found");

        const { sparePart, stockOutQuantity, stockOutUnitPrice, stockOutDate } = req.body;
        const targetPartId = sparePart || existingRecord.sparePart;

        const part = await SparePart.findById(targetPartId);
        if (!part) return res.status(404).json("Spare part not found");

        const oldQuantity = existingRecord.stockOutQuantity;
        const newQuantity = Number(stockOutQuantity) || oldQuantity;
        const quantityDiff = newQuantity - oldQuantity;

        if (part.quantity < quantityDiff) return res.status(400).json("Not enough stock available");

        part.quantity -= quantityDiff;
        await part.save();

        const unitPrice = Number(stockOutUnitPrice) || existingRecord.stockOutUnitPrice;
        const totalPrice = newQuantity * unitPrice;

        const data = await StockOut.findByIdAndUpdate(
            req.params.id,
            {
                sparePart: targetPartId,
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

app.delete("/api/stock-out/:id", authenticateToken, async (req, res) => {
    try {
        const stockOut = await StockOut.findOne({ _id: req.params.id, userId: req.userId });
        if (!stockOut) return res.status(404).json("Not found");

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

// ==========================================
// 📈 REPORTS ROUTING INTERFACE (reportRoutes.js)
// ==========================================

app.get("/api/reports/stock-status", authenticateToken, async (req, res) => {
    try {
        const data = await SparePart.find({ userId: req.userId });
        res.json(data);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/reports/daily-stockout", authenticateToken, async (req, res) => {
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

app.get("/api/reports/all-stockout", authenticateToken, async (req, res) => {
    try {
        const data = await StockOut.find({ userId: req.userId }).populate("sparePart");
        res.json(data);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/reports/daily-stockout-pdf", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const data = await StockOut.find({ userId: req.userId }).populate("sparePart");

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${user?.stockName || 'Stock'}Report.pdf`);

        doc.pipe(res);
        doc.fontSize(20).text(`${user?.stockName || 'Stock'} Core Logistics Ledger`, { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
        doc.moveDown();

        if (data.length === 0) {
            doc.fontSize(12).text("No transactions logged inside ledger records.");
        } else {
            data.forEach(item => {
                doc.fontSize(12).text(
                    `${item.sparePart?.name || 'Deleted Component'} | Quantity Dispatched: ${item.stockOutQuantity} | Price: $${item.stockOutUnitPrice} | Net Value: $${item.stockOutTotalPrice}`
                );
            });
        }
        doc.end();
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// ==========================================
// 🕒 ACTIVITY LOGS QUERY (activityRoutes.js)
// ==========================================

app.get("/api/activity-logs", authenticateToken, async (req, res) => {
    try {
        const { action, entityType, limit = 50 } = req.query;
        const query = { userId: req.userId };

        if (action) query.action = action;
        if (entityType) query.entityType = entityType;

        const logs = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('entityId', 'name');

        res.json(logs);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

app.get("/api/activity-logs/stats", authenticateToken, async (req, res) => {
    try {
        const stats = await ActivityLog.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
            { $group: { _id: "$action", count: { $sum: 1 } } }
        ]);
        res.json(stats);
    } catch (err) {
        res.status(500).json(err.message);
    }
});

// ==========================================
// 🚀 ENGINE BOOTSTRAP
// ==========================================
app.listen(PORT, () => {
    console.log(`📡 MongoDB Unified Server running on port ${PORT}`);
});

export default app;