import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  async register(email: string, password: string, fullName: string) {
    const response = await api.post('/register', { email, password, fullName });
    localStorage.setItem('token', response.data.token);
    return response.data.user;
  },

  async login(email: string, password: string) {
    const response = await api.post('/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('token');
  }
};

export const cars = {
  async getAll() {
    const response = await api.get('/cars');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/cars/${id}`);
    return response.data;
  },

  async create(car: {
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    image_url?: string;
    description?: string;
  }) {
    const response = await api.post('/cars', car);
    return response.data;
  }
};