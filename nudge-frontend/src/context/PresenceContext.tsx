import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { wsClient } from '../services/websocket.js';
import { useAuth } from './AuthContext.js';

interface PresenceData {
  online: boolean;
  lastSeenAt?: string;
}

interface PresenceContextType {
  presenceMap: Record<string, PresenceData>;
  isOnline: (userId?: string) => boolean;
  getLastSeen: (userId?: string) => string | undefined;
  getStatusLabel: (userId?: string) => string;
  refreshPresence: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceData>>({});

  const refreshPresence = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getPresence();
      setPresenceMap(res.presence || {});
    } catch (err) {
      console.warn('Failed to fetch presence:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refreshPresence();

    const interval = setInterval(refreshPresence, 20000);

    // Listen to realtime socket presence updates if server emits them
    const unsub = wsClient.on('presence.update' as any, (data: any) => {
      if (data?.userId) {
        setPresenceMap((prev) => ({
          ...prev,
          [data.userId]: {
            online: !!data.online,
            lastSeenAt: data.lastSeenAt,
          },
        }));
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [user, refreshPresence]);

  const isOnline = useCallback((userId?: string): boolean => {
    if (!userId) return false;
    return !!presenceMap[userId]?.online;
  }, [presenceMap]);

  const getLastSeen = useCallback((userId?: string): string | undefined => {
    if (!userId) return undefined;
    return presenceMap[userId]?.lastSeenAt;
  }, [presenceMap]);

  const getStatusLabel = useCallback((userId?: string): string => {
    if (!userId) return 'offline';
    const p = presenceMap[userId];
    if (!p) return 'offline';
    if (p.online) return 'online';
    if (!p.lastSeenAt) return 'offline';

    const diffMs = Date.now() - new Date(p.lastSeenAt).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'active just now';
    if (diffMins < 60) return `active ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `active ${diffHours}h ago`;
    return 'offline';
  }, [presenceMap]);

  return (
    <PresenceContext.Provider value={{ presenceMap, isOnline, getLastSeen, getStatusLabel, refreshPresence }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
