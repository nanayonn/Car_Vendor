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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var sqlite3_1 = require("sqlite3");
var url_1 = require("url");
var path_1 = require("path");
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
var app = (0, express_1.default)();
var port = process.env.PORT || 3000;
var JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Database setup
var db = new sqlite3_1.default.Database((0, path_1.join)(__dirname, 'database.sqlite'), function (err) {
    if (err) {
        console.error('Error opening database:', err);
    }
    else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});
function initializeDatabase() {
    db.serialize(function () {
        // Users table
        db.run("\n      CREATE TABLE IF NOT EXISTS users (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        email TEXT UNIQUE NOT NULL,\n        password TEXT NOT NULL,\n        full_name TEXT,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n      )\n    ", function (err) {
            if (err) {
                console.error('Error creating users table:', err);
            }
        });
        // Cars table
        db.run("\n      CREATE TABLE IF NOT EXISTS cars (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        make TEXT NOT NULL,\n        model TEXT NOT NULL,\n        year INTEGER NOT NULL,\n        price REAL NOT NULL,\n        mileage REAL NOT NULL,\n        image_url TEXT,\n        description TEXT,\n        is_available BOOLEAN DEFAULT 1,\n        user_id INTEGER,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        FOREIGN KEY (user_id) REFERENCES users(id)\n      )\n    ", function (err) {
            if (err) {
                console.error('Error creating cars table:', err);
            }
        });
    });
}
// Authentication middleware
var authenticateToken = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        var user = decoded;
        req.user = user;
        next();
    });
};
// Auth routes
app.post('/api/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, fullName, hashedPassword, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password, fullName = _a.fullName;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 2:
                hashedPassword = _b.sent();
                db.run('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)', [email, hashedPassword, fullName], function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            return res.status(400).json({ error: 'Email already exists' });
                        }
                        return res.status(500).json({ error: 'Error creating user' });
                    }
                    var token = jsonwebtoken_1.default.sign({ id: this.lastID, email: email }, JWT_SECRET);
                    res.json({
                        token: token,
                        user: {
                            id: this.lastID,
                            email: email,
                            full_name: fullName
                        }
                    });
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                res.status(500).json({ error: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
app.post('/api/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password;
    return __generator(this, function (_b) {
        _a = req.body, email = _a.email, password = _a.password;
        db.get('SELECT * FROM users WHERE email = ?', [email], function (err, user) { return __awaiter(void 0, void 0, void 0, function () {
            var validPassword, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err) {
                            return [2 /*return*/, res.status(500).json({ error: 'Server error' })];
                        }
                        if (!user) {
                            return [2 /*return*/, res.status(401).json({ error: 'Invalid email or password' })];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
                    case 1:
                        validPassword = _a.sent();
                        if (!validPassword) {
                            return [2 /*return*/, res.status(401).json({ error: 'Invalid email or password' })];
                        }
                        token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET);
                        res.json({
                            token: token,
                            user: {
                                id: user.id,
                                email: user.email,
                                full_name: user.full_name
                            }
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
// Cars routes
app.get('/api/cars', function (req, res) {
    db.all('SELECT * FROM cars WHERE is_available = 1', function (err, cars) {
        if (err) {
            return res.status(500).json({ error: 'Error fetching cars' });
        }
        res.json(cars);
    });
});
app.get('/api/cars/:id', function (req, res) {
    db.get('SELECT * FROM cars WHERE id = ?', [req.params.id], function (err, car) {
        if (err) {
            return res.status(500).json({ error: 'Error fetching car' });
        }
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json(car);
    });
});
app.post('/api/cars', authenticateToken, function (req, res) {
    var _a = req.body, make = _a.make, model = _a.model, year = _a.year, price = _a.price, mileage = _a.mileage, image_url = _a.image_url, description = _a.description;
    var userId = req.user.id;
    db.run("INSERT INTO cars (make, model, year, price, mileage, image_url, description, user_id)\n     VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [make, model, year, price, mileage, image_url, description, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error creating car listing' });
        }
        res.json({
            id: this.lastID,
            make: make,
            model: model,
            year: year,
            price: price,
            mileage: mileage,
            image_url: image_url,
            description: description,
            user_id: userId
        });
    });
});
app.listen(port, function () {
    console.log("Server running on port ".concat(port));
});
