'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Estudiante, Docente, Admin, UserRole, AuthContextType, AuthResponse } from '@/lib/types';
import { initializeSeedData, getAppState, saveAppState } from '@/lib/seedData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | Estudiante | Docente | Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize seed data and check for existing auth
  useEffect(() => {
    const init = async () => {
      await initializeSeedData();
      const storedAuth = localStorage.getItem('nuevaschool_auth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          if (authData) {
            setUser(authData);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error loading auth:', error);
          localStorage.removeItem('nuevaschool_auth');
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Usuario o contraseña incorrectos' }));
        return {
          user: null,
          token: null,
          error: errorData.detail || 'Usuario o contraseña incorrectos',
        };
      }

      const data = await response.json();
      const token = data.access_token;
      const foundUser = data.user;

      setUser(foundUser);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('nuevaschool_auth', JSON.stringify(foundUser));
      localStorage.setItem('nuevaschool_token', token);

      return {
        user: foundUser,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        user: null,
        token: null,
        error: 'Error de conexión con el servidor',
      };
    }
  };

  const signup = async (userData: any): Promise<AuthResponse> => {
    try {
      // TODO: Implement signup logic
      return {
        user: null,
        token: null,
        error: 'Signup no implementado aún',
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        error: 'Error al registrarse',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nuevaschool_auth');
    localStorage.removeItem('nuevaschool_token');
  };

  const updateUser = (updatedUser: User | Estudiante | Docente | Admin) => {
    setUser(updatedUser);
    localStorage.setItem('nuevaschool_auth', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando NuevaSchool...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
