import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import setupSwagger from "./swagger.js";
import Task from "./models/task.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("DB Connection Error:", err));

setupSwagger(app);

// User Model
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "User" },
});
const User = mongoose.model("User", UserSchema);

// Signup Route
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, passwordHash: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, passwordHash, role });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Retrieve all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Retrieve Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Retrieve a user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Retrieve User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update an existing user
app.put("/api/users/:id", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);
    if (role) user.role = role;

    await user.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.remove();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status, userId } = req.body;
    if (!title || !userId) {
      return res
        .status(400)
        .json({ message: "Title and User ID are required" });
    }

    const newTask = new Task({ title, description, status, userId });
    await newTask.save();
    res.status(201).json({ message: "Task created successfully" });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Retrieve all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Retrieve Tasks Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Retrieve a task by ID
app.get("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
  } catch (error) {
    console.error("Retrieve Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update an existing task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { title, description, status, userId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (userId) task.userId = userId;

    await task.save();
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.remove();
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
