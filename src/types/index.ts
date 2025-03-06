export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  image_url: string;
  description: string;
  is_available: boolean;
  user_id?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}