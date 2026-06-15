require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

/* =========================
   ✅ CORS CONFIG (FIXED)
========================= */
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5001"
  ],
  credentials: true
};

// MUST BE FIRST
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* =========================
   ✅ BODY PARSER
========================= */
app.use(express.json());

/* =========================
   ✅ DATABASE
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

/* =========================
   ✅ SESSION CONFIG (FIXED)
========================= */
app.use(session({
  secret: process.env.SESSION_SECRET || "secret123",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    secure: false,       // true ONLY in HTTPS (production)
    httpOnly: true,
    sameSite: "lax"      // IMPORTANT for CORS
  }
}));

/* =========================
   ✅ ROUTES
========================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/spareparts", require("./middleware/auth"), require("./routes/sparePartRoutes"));
app.use("/api/stockin", require("./middleware/auth"), require("./routes/stockInRoutes"));
app.use("/api/stockout", require("./middleware/auth"), require("./routes/stockOutRoutes"));
app.use("/api/reports", require("./middleware/auth"), require("./routes/reportRoutes"));
app.use("/api/activity", require("./middleware/auth"), require("./routes/activityRoutes"));

/* =========================
   ✅ SERVER START
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));