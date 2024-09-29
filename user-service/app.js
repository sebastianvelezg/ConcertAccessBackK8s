const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://mongodb:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User model
const User = mongoose.model("User", {
  username: String,
  password: String,
});

// Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  try {
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ userId: user._id }, "secret_key");
    console.log("User logged in:", user.username);
    res.json({ token });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});

// Logout route (client-side implementation)
app.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Get user data route
app.get("/user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, "secret_key");
    const user = await User.findById(decoded.userId);
    res.json({ username: user.username });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
