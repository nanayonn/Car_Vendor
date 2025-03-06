import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import { User, Car } from '../types';

let db: any = null;
let initialized = false;

async function initDB() {
  if (initialized) return;

  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  db = new SQL.Database();
  
  // Initialize database tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
    );
  `);

  // Save to localStorage
  const data = db.export();
  const buffer = new Uint8Array(data);
  const blob = new Blob([buffer]);
  
  // Store the database in localStorage
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onload = function() {
    localStorage.setItem('dealership_db', reader.result as string);
  };

  initialized = true;
}

// Load database from localStorage
async function loadDB() {
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });

  const savedDB = localStorage.getItem('dealership_db');
  if (savedDB) {
    const binary = atob(savedDB.split(',')[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    db = new SQL.Database(array);
  } else {
    await initDB();
  }
}

// Initialize the database
loadDB();

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = new Uint8Array(data);
  const blob = new Blob([buffer]);
  
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onload = function() {
    localStorage.setItem('dealership_db', reader.result as string);
  };
}

export const auth = {
  async register(email: string, password: string, fullName: string): Promise<User> {
    await loadDB();
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const stmt = db.prepare('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)');
      stmt.run([email, hashedPassword, fullName]);
      saveDB();
      
      const result = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      return {
        id: result.toString(),
        email,
        full_name: fullName,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Email already exists');
    }
  },

  async login(email: string, password: string): Promise<User> {
    await loadDB();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const result = stmt.getAsObject([email]);
    
    if (!result.id) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, result.password);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    return {
      id: result.id.toString(),
      email: result.email,
      full_name: result.full_name,
      created_at: result.created_at
    };
  }
};

export const cars = {
  async create(car: Omit<Car, 'id' | 'created_at'>, userId: string): Promise<Car> {
    await loadDB();
    const stmt = db.prepare(`
      INSERT INTO cars (make, model, year, price, mileage, image_url, description, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      car.make,
      car.model,
      car.year,
      car.price,
      car.mileage,
      car.image_url,
      car.description,
      userId
    ]);
    
    saveDB();
    
    const result = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    return {
      ...car,
      id: result.toString(),
      created_at: new Date().toISOString()
    };
  },

  async getAll(): Promise<Car[]> {
    await loadDB();
    const result = db.exec('SELECT * FROM cars WHERE is_available = 1');
    if (!result.length) return [];
    
    return result[0].values.map((row: any[]) => ({
      id: row[0].toString(),
      make: row[1],
      model: row[2],
      year: row[3],
      price: row[4],
      mileage: row[5],
      image_url: row[6],
      description: row[7],
      is_available: Boolean(row[8]),
      user_id: row[9]?.toString(),
      created_at: row[10]
    }));
  },

  async getById(id: string): Promise<Car | undefined> {
    await loadDB();
    const stmt = db.prepare('SELECT * FROM cars WHERE id = ?');
    const result = stmt.getAsObject([id]);
    
    if (!result.id) return undefined;
    
    return {
      id: result.id.toString(),
      make: result.make,
      model: result.model,
      year: result.year,
      price: result.price,
      mileage: result.mileage,
      image_url: result.image_url,
      description: result.description,
      is_available: Boolean(result.is_available),
      user_id: result.user_id?.toString(),
      created_at: result.created_at
    };
  }
};