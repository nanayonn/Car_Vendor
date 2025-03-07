// backend/src/index.ts
import express, { Request, Response } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import cors from "cors";
import session from "express-session";

const app = express();
const PORT = 5000;
app.use(express.json());
declare module "express-session" {
    interface Session {
      user?: {
        id: number;
        username: string;
      };
    }
  }

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,
}));

const dbPromise = open({
  filename: "database.sqlite3",
  driver: sqlite3.Database,
});

(async () => {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
})();

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    console.log("Request Body:", req.body); // Log the request body for debugging
    if (!username || !password) {
      res.status(400).json({ success: false, message: "Username and password are required" });
    }
    const db = await dbPromise;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: "User already exists" });
    }
  });

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await dbPromise;
  console.log("Database connected");
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = { id: user.id, username: user.username };
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));