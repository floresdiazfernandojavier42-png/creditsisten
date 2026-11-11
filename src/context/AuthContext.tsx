import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  currentUser: User | null;
  currentClient: Client | null;
  isAdmin: boolean;
  isClient: boolean;
  login: (email: string, pass: string, targetRole?: 'admin' | 'cliente') => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>(() => storageService.getUsers());

  const refreshUserData = () => {
    const user = storageService.getCurrentUser();
    setCurrentUser(user);
    setAvailableUsers(storageService.getUsers());
    if (user && user.role === 'cliente' && user.clientId) {
      const client = storageService.getClientById(user.clientId);
      setCurrentClient(client || null);
    } else {
      setCurrentClient(null);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const login = (email: string, pass: string, targetRole?: 'admin' | 'cliente') => {
    const res = storageService.authenticate(email, pass, targetRole);
    if (res.user) {
      setCurrentUser(res.user);
      if (res.user.role === 'cliente' && res.user.clientId) {
        const client = storageService.getClientById(res.user.clientId);
        setCurrentClient(client || null);
      } else {
        setCurrentClient(null);
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Credenciales incorrectas' };
  };

  const logout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentClient(null);
  };

  const switchUser = (userId: string) => {
    const target = availableUsers.find((u) => u.id === userId);
    if (!target) return;
    if (!target.active) {
      alert('Esta cuenta está desactivada.');
      return;
    }
    storageService.setCurrentUser(target);
    setCurrentUser(target);
    if (target.role === 'cliente' && target.clientId) {
      const client = storageService.getClientById(target.clientId);
      setCurrentClient(client || null);
    } else {
      setCurrentClient(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentClient,
        isAdmin: currentUser?.role === 'admin',
        isClient: currentUser?.role === 'cliente',
        login,
        logout,
        switchUser,
        availableUsers,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
