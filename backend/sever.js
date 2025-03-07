"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/index.ts
const express_1 = __importDefault(require("express"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const bcrypt_1 = __importDefault(require("bcrypt"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
const PORT = 5000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: "http://localhost:5173", credentials: true }));
app.use((0, express_session_1.default)({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
}));
const dbPromise = (0, sqlite_1.open)({
    filename: "database.sqlite3",
    driver: sqlite3_1.default.Database,
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield dbPromise;
    yield db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
}))();
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    console.log("Request Body:", req.body); // Log the request body for debugging
    if (!username || !password) {
        res.status(400).json({ success: false, message: "Username and password are required" });
    }
    const db = yield dbPromise;
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    try {
        yield db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ success: false, message: "User already exists" });
    }
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    const db = yield dbPromise;
    console.log("Database connected");
    const user = yield db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (user && (yield bcrypt_1.default.compare(password, user.password))) {
        req.session.user = { id: user.id, username: user.username };
        res.json({ success: true });
    }
    else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
}));
app.get("/dashboard", (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    }
    else {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
});
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
