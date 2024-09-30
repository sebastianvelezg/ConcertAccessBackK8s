const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

// Users array
const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
  // Staff for Control Points
  {
    id: 2,
    name: "Control Staff - Main",
    email: "control_staff_main@example.com",
    password: "controlstaff123",
    role: "staff",
  },
  {
    id: 3,
    name: "Control Staff - VIP",
    email: "control_staff_vip@example.com",
    password: "controlstaff456",
    role: "staff",
  },
  {
    id: 4,
    name: "Control Staff - North",
    email: "control_staff_north@example.com",
    password: "controlstaff789",
    role: "staff",
  },
  {
    id: 5,
    name: "Control Staff - South",
    email: "control_staff_south@example.com",
    password: "controlstaff101",
    role: "staff",
  },
  {
    id: 6,
    name: "Control Staff - East",
    email: "control_staff_east@example.com",
    password: "controlstaff112",
    role: "staff",
  },
  {
    id: 7,
    name: "Control Staff - West",
    email: "control_staff_west@example.com",
    password: "controlstaff131",
    role: "staff",
  },
  // Staff for Entrances
  {
    id: 8,
    name: "Entrance Staff - Main",
    email: "entrance_staff_main@example.com",
    password: "entrancestaff123",
    role: "staff",
  },
  {
    id: 9,
    name: "Entrance Staff - VIP",
    email: "entrance_staff_vip@example.com",
    password: "entrancestaff456",
    role: "staff",
  },
  {
    id: 10,
    name: "Entrance Staff - North",
    email: "entrance_staff_north@example.com",
    password: "entrancestaff789",
    role: "staff",
  },
  {
    id: 11,
    name: "Entrance Staff - South",
    email: "entrance_staff_south@example.com",
    password: "entrancestaff101",
    role: "staff",
  },
  {
    id: 12,
    name: "Entrance Staff - East",
    email: "entrance_staff_east@example.com",
    password: "entrancestaff112",
    role: "staff",
  },
  {
    id: 13,
    name: "Entrance Staff - West",
    email: "entrance_staff_west@example.com",
    password: "entrancestaff131",
    role: "staff",
  },
  // Staff for Areas
  {
    id: 14,
    name: "Area Staff - Main Stage - VIP",
    email: "area_staff_vip@example.com",
    password: "areastaff123",
    role: "staff",
  },
  {
    id: 15,
    name: "Area Staff - Main Stage - General",
    email: "area_staff_general@example.com",
    password: "areastaff456",
    role: "staff",
  },
  {
    id: 16,
    name: "Area Staff - North Zone",
    email: "area_staff_north@example.com",
    password: "areastaff789",
    role: "staff",
  },
  {
    id: 17,
    name: "Area Staff - South Zone",
    email: "area_staff_south@example.com",
    password: "areastaff101",
    role: "staff",
  },
  {
    id: 18,
    name: "Area Staff - East Zone",
    email: "area_staff_east@example.com",
    password: "areastaff112",
    role: "staff",
  },
  {
    id: 19,
    name: "Area Staff - West Zone",
    email: "area_staff_west@example.com",
    password: "areastaff131",
    role: "staff",
  },
  // Regular Users
  {
    id: 27,
    name: "John Doe",
    email: "john@example.com",
    password: "john123",
    role: "user",
  },
  {
    id: 28,
    name: "Jane Smith",
    email: "jane@example.com",
    password: "jane123",
    role: "user",
  },
  {
    id: 29,
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "alice123",
    role: "user",
  },
  {
    id: 30,
    name: "Bob Williams",
    email: "bob@example.com",
    password: "bob123",
    role: "user",
  },
];

// Connect to MongoDB
mongoose.connect("mongodb://mongodb:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User model
const UserSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  role: String,
});

const User = mongoose.model("User", UserSchema);

// Initialize users after connection
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");

  // Initialize users if not already in the database
  initializeUsers();
});

async function initializeUsers() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("Initializing users...");
    for (const userData of users) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      // Create a new user
      const user = new User({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });
      try {
        await user.save();
        console.log(`User ${userData.name} created`);
      } catch (error) {
        console.error(`Error creating user ${userData.name}:`, error);
      }
    }
  } else {
    console.log("Users already initialized");
  }
}

// Register route
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword, role });
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
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ userId: user._id }, "secret_key");
    console.log("User logged in:", user.email);
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
    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
