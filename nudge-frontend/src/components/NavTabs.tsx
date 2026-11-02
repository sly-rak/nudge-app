import React from 'react';
import { MessageSquare, Flame, Gamepad2, User } from 'lucide-react';

export type TabKey = 'chats' | 'stories' | 'games' | 'nearby' | 'profile';

interface NavTabsProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unreadMessagesCount?: number;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onSelectTab, unreadMessagesCount = 0 }) => {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number; isNearby?: boolean }[] = [
    {
      key: 'chats',
      label: 'Chats',
      icon: <MessageSquare size={20} strokeWidth={activeTab === 'chats' ? 2.4 : 1.9} />,
      badge: unreadMessagesCount,
    },
    {
      key: 'stories',
      label: 'Story',
      icon: <Flame size={20} strokeWidth={activeTab === 'stories' ? 2.4 : 1.9} fill={activeTab === 'stories' ? 'var(--like)' : 'none'} color={activeTab === 'stories' ? 'var(--like)' : 'currentColor'} />,
    },
    {
      key: 'games',
      label: 'Play',
      icon: <Gamepad2 size={21} strokeWidth={activeTab === 'games' ? 2.4 : 1.9} color={activeTab === 'games' ? 'var(--gold)' : 'currentColor'} />,
    },
    {
      key: 'nearby',
      label: 'Nearby',
      isNearby: true,
      icon: (
        <div className="mini" style={{ transform: activeTab === 'nearby' ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
      ),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={20} strokeWidth={activeTab === 'profile' ? 2.4 : 1.9} />,
    },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 60,
        borderTop: '1px solid var(--line)',
        backgroundColor: 'var(--panel)',
        flexShrink: 0,
        zIndex: 10,
        boxShadow: '0 -1px 4px rgba(0,0,0,0.02)',
        width: '100%',
      }}
      aria-label="Main Navigation"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 580,
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                height: '100%',
                padding: '4px 0',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 11.5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
            >
              {/* Active Pill / Highlight effect */}
              {isActive && !tab.isNearby && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    width: 44,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'var(--hover)',
                    zIndex: 0,
                  }}
                />
              )}

              <div
                style={{
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 1,
                  transform: isActive && !tab.isNearby ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {tab.icon}

                {/* Badge */}
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -9,
                      backgroundColor: 'var(--vanish)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 17,
                      height: 17,
                      padding: '0 4px',
                      borderRadius: 9,
                      display: 'grid',
                      placeItems: 'center',
                      border: '1.5px solid var(--panel)',
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span style={{ zIndex: 1, letterSpacing: -0.1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
