import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token?: string) => void;
  loginStaff: (staffId: string, passkey: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize socket by asking the server for the correct origin (works across LAN)
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/server-info');
        if (cancelled) return;

        // If data.origin says localhost but we're on a public URL, it's a proxy mismatch
        let socketUrl = data.origin;
        if (typeof window !== 'undefined' && socketUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
          socketUrl = window.location.origin;
        }

        // Handle Netlify WebSocket proxy limitation
        if (window.location.hostname.includes('netlify.app')) {
          socketUrl = 'https://smartposv4.onrender.com';
        }

        const newSocket = io(socketUrl, {
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000,
          timeout: 45000,
          autoConnect: true
        });
        setSocket(newSocket);

        // Clean up on unmount
        return () => {
          cancelled = true;
          try { newSocket.close(); } catch (_) {}
        };
      } catch (error) {
        // Fallback to origin (best-effort) if server-info not available
        try {
          let socketUrl = window.location.origin;
          if (window.location.hostname.includes('netlify.app')) {
            socketUrl = 'https://smartposv4.onrender.com';
          }
          const newSocket = io(socketUrl, { reconnection: true });
          if (!cancelled) setSocket(newSocket);
        } catch (e) {
          console.warn('Socket init failed:', e);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Check for stored auth on startup
    const storedUser = localStorage.getItem('smartpos_user');
    const storedToken = localStorage.getItem('smartpos_token');

    if (storedToken) {
      setToken(storedToken);
      // Verify token with server
      api.get('/api/auth/session')
      .then(data => {
        setUser(data.user);
      })
      .catch(() => {
        // Token invalid
        localStorage.removeItem('smartpos_token');
        setToken(null);
        // If we have storedUser (local admin), maybe keep it?
        if (storedUser) {
           try {
             const u = JSON.parse(storedUser);
             if (u.role === 'staff') {
               localStorage.removeItem('smartpos_user');
               setUser(null);
             } else {
               // Admin or local user
               setUser(u);
             }
           } catch (e) {
             localStorage.removeItem('smartpos_user');
             setUser(null);
           }
        }
      });
    } else if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('smartpos_user');
      }
    }
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.emit('join-user', user.id);
      
      const handleForceLogout = () => {
        toast({
            title: "Session Ended",
            description: "You have been logged out remotely.",
            variant: "destructive"
        });
        logout();
      };

      socket.on('force-logout', handleForceLogout);

      return () => {
        socket.off('force-logout', handleForceLogout);
        socket.emit('leave-user', user.id);
      };
    }
  }, [socket, user, toast]);

  const login = (userData: User, authToken?: string) => {
    setUser(userData);
    localStorage.setItem('smartpos_user', JSON.stringify(userData));
    if (authToken) {
      setToken(authToken);
      localStorage.setItem('smartpos_token', authToken);
    }
  };

  const loginStaff = async (staffId: string, passkey: string) => {
    try {
      const data = await api.post('/api/auth/login', { 
        staffId, 
        passkey, 
        deviceInfo: navigator.userAgent 
      });
      
      login(data.user, data.token);
    } catch (error) {
      console.error('Staff login error:', error);
      throw error;
    }
  };

  const logout = () => {
    if (socket && user) {
      socket.emit('leave-user', user.id);
    }

    if (token) {
      api.post('/api/auth/logout', {}).catch(console.error);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartpos_user');
    localStorage.removeItem('smartpos_token');
  };

  const value = {
    user,
    token,
    login,
    loginStaff,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
