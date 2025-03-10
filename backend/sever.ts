import express from "express";
import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;
app.use(express.json());

declare module "express-session" {
  interface Session {
    user?: {
      id: string;
      username: string;
    };
  }
}

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, default: null },
  province: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

// Register User
app.post("/register", async (req: Request, res: Response) => {
  const { username, password, email, address, province } = req.body;

  if (!username || !password || !email) {
     res
      .status(400)
      .json({ success: false, message: "Username, password, and email are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email, address, province });
    await newUser.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: "User already exists" });
  }
});

// Login User
app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = { id: user._id.toString(), username: user.username };
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Dashboard Access
app.get("/dashboard", async (req: Request, res: Response) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user.id).select("username email address province");
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});


// Update Profile (Email, Address, Province) and Credentials (Username, Password)
app.put("/update-profile", async (req: Request, res: Response) => {
  if (!req.session.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const { email, address, province, newUsername, newPassword, oldPassword } = req.body;

  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Update Profile Information (Email, Address, Province) only if provided
    if (email !== undefined) user.email = email !== null ? email : user.email;
    if (address !== undefined) user.address = address !== null ? address : user.address;
    if (province !== undefined) user.province = province !== null ? province : user.province;

    // Update Credentials (Username and Password) only if provided
    if (newUsername || newPassword) {
      // If changing the password, validate the old password
      if (newPassword) {
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!isOldPasswordValid) {
          res.status(400).json({ success: false, message: "Incorrect old password" });
          return ;
        }

        // Hash the new password before saving
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
      }

      // If changing the username, check if it's already taken
      if (newUsername) {
        const existingUser = await User.findOne({ username: newUsername });

        if (existingUser) {
           res.status(400).json({ success: false, message: "Username already taken" });
           return;
        }

        user.username = newUsername;
      }
    }

    // Save the updated user details
    await user.save();
     res.json({ success: true, message: "Profile and credentials updated successfully" });
     return;
  } catch (err) {
     res.status(500).json({ success: false, message: "Server error" });
     return;
  }
});


app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ success: false, message: "Logout failed" });
        return ;
      } else {
        res.json({ success: true, message: "Logged out successfully" });
        return ;
      }
    });
  } else {
    res.status(400).json({ success: false, message: "No active session" });
    return ;
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));