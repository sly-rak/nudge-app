import React from 'react';
import { MessageSquare, Flame, Gamepad2, Radio, User } from 'lucide-react';

export type TabKey = 'chats' | 'stories' | 'games' | 'nearby' | 'profile';

interface NavTabsProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unreadMessagesCount?: number;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onSelectTab, unreadMessagesCount = 0 }) => {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'chats', label: 'Chats', icon: <MessageSquare size={20} />, badge: unreadMessagesCount },
    { key: 'stories', label: 'Story', icon: <Flame size={20} /> },
    { key: 'games', label: 'Play', icon: <Gamepad2 size={20} /> },
    { key: 'nearby', label: 'Nearby', icon: <Radio size={20} /> },
    { key: 'profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 4px',
        borderTop: '1px solid var(--line)',
        backgroundColor: 'var(--side)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              flex: 1,
              padding: '4px 0',
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              fontWeight: isActive ? 600 : 400,
              fontSize: 11,
              position: 'relative',
              transition: 'color 0.15s ease',
            }}
          >
            <div style={{ position: 'relative' }}>
              {tab.icon}
              {!!tab.badge && tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: 'var(--vanish)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 10,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
