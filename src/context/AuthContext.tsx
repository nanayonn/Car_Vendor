import { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { auth } from '../lib/api';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const user = await auth.login(email, password);
    setUser(user);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const user = await auth.register(email, password, fullName);
    setUser(user);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}