import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, setToken, getToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  preservedPrompt: string;
  preservedAttachments: any[];
  openAuthModal: (mode?: 'signin' | 'signup', prompt?: string, attachments?: any[]) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearPreservedDraft: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [preservedPrompt, setPreservedPrompt] = useState<string>('');
  const [preservedAttachments, setPreservedAttachments] = useState<any[]>([]);

  // Check existing session on load
  const checkSession = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' = 'signin', prompt = '', attachments: any[] = []) => {
    setAuthModalMode(mode);
    if (prompt) setPreservedPrompt(prompt);
    if (attachments.length) setPreservedAttachments(attachments);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    // Draft is preserved in composer so user never loses it
  }, []);

  const clearPreservedDraft = useCallback(() => {
    setPreservedPrompt('');
    setPreservedAttachments([]);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthModalOpen(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const res = await api.register({ name, email, password, confirmPassword });
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthModalOpen(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      clearPreservedDraft();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authModalMode,
        preservedPrompt,
        preservedAttachments,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        clearPreservedDraft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
