import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserStatus } from '@nudge/shared';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoAccounts: any[];
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => void;
  updateStatus: (status: UserStatus) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load demo accounts list
  useEffect(() => {
    api.getDemoAccounts()
      .then((res) => setDemoAccounts(res.accounts))
      .catch((err) => console.error('Failed to load demo accounts:', err));
  }, []);

  // Initial auth check or auto-login with first demo account if no token
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      const existingToken = api.getToken();
      if (existingToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          wsClient.connect(existingToken);
        } catch (err) {
          console.warn('Session expired or invalid, logging in with demo account...');
          api.setToken(null);
          setToken(null);
        }
      }

      // If no valid user yet, auto-login with first demo account for seamless instant experience
      if (!api.getToken()) {
        try {
          const accountsRes = await api.getDemoAccounts();
          setDemoAccounts(accountsRes.accounts);
          if (accountsRes.accounts.length > 0) {
            const firstUser = accountsRes.accounts[0];
            const loginRes = await api.demoLogin(firstUser.id);
            setUser(loginRes.user);
            setToken(loginRes.accessToken);
            wsClient.connect(loginRes.accessToken);
          }
        } catch (err) {
          console.error('Demo auto-login error:', err);
        }
      }

      setLoading(false);
    }

    initAuth();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login(identifier, pass);
    setUser(res.user);
    setToken(res.accessToken);
    wsClient.connect(res.accessToken);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setUser(res.user);
    setToken(res.accessToken);
    wsClient.connect(res.accessToken);
  };

  const switchUser = async (userId: string) => {
    const res = await api.demoLogin(userId);
    setUser(res.user);
    setToken(res.accessToken);
    wsClient.connect(res.accessToken);
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    wsClient.disconnect();
  };

  const updateStatus = async (status: UserStatus) => {
    const res = await api.updateStatus(status);
    if (user) {
      setUser({ ...user, status: res.status });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoAccounts,
        loading,
        login,
        register,
        switchUser,
        logout,
        updateStatus,
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
