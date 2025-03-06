import express, { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include the user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define User interface
interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
}

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      }
    });

    // Cars table
    db.run(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        price REAL NOT NULL,
        mileage REAL NOT NULL,
        image_url TEXT,
        description TEXT,
        is_available BOOLEAN DEFAULT 1,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating cars table:', err);
      }
    });
  });
}

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const user = decoded as User;
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)',
      [email, hashedPassword, fullName],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }

        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
        res.json({ 
          token,
          user: {
            id: this.lastID,
            email,
            full_name: fullName
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user: User) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }
    });
  });
});

// Cars routes
app.get('/api/cars', (req: Request, res: Response) => {
  db.all('SELECT * FROM cars WHERE is_available = 1', (err, cars) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching cars' });
    }
    res.json(cars);
  });
});

app.get('/api/cars/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM cars WHERE id = ?', [req.params.id], (err, car) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching car' });
    }
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  });
});

app.post('/api/cars', authenticateToken, (req: Request, res: Response) => {
  const { make, model, year, price, mileage, image_url, description } = req.body;
  const userId = (req.user as User).id;

  db.run(
    `INSERT INTO cars (make, model, year, price, mileage, image_url, description, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [make, model, year, price, mileage, image_url, description, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating car listing' });
      }
      res.json({
        id: this.lastID,
        make,
        model,
        year,
        price,
        mileage,
        image_url,
        description,
        user_id: userId
      });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});