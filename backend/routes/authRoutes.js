const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* =========================
   ✅ SIGNUP
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { username, password, stockName } = req.body;

    if (!username || !password || !stockName) {
      return res.status(400).json("All fields are required");
    }

    if (password.length < 4) {
      return res.status(400).json("Password must be at least 4 characters");
    }

    if (stockName.length < 2) {
      return res.status(400).json("Stock name must be at least 2 characters");
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json("Username already exists");
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed,
      stockName
    });

    res.json({
      message: "Signup successful",
      userId: user._id
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

/* =========================
   ✅ LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json("User not found");

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(400).json("Wrong password");

    req.session.userId = user._id;

    const token = jwt.sign(
      { userId: user._id, stockName: user.stockName },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login Successful",
      token,
      stockName: user.stockName,
      userId: user._id
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

/* =========================
   ✅ LOGOUT
========================= */
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.json("Logged out");
});

/* =========================
   ✅ GET CURRENT USER
========================= */
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json("No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    res.json(user);

  } catch (err) {
    res.status(401).json("Invalid token");
  }
});

module.exports = router;