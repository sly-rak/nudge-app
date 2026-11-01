import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Gamepad2, Moon, Sun, UserPlus, Users, Sparkles } from 'lucide-react';
import { Avatar } from './Avatar.js';

interface HeaderProps {
  onOpenGames: () => void;
  onOpenAddFriends: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGames, onOpenAddFriends, onOpenProfile }) => {
  const { user, demoAccounts, switchUser } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nudge_theme') as 'light' | 'dark') || 'light';
  });
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('nudge_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--line)',
        backgroundColor: 'var(--side)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Nudge Logo */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-ink)',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.5 5h8A3.5 3.5 0 0 1 18 8.5v4a3.5 3.5 0 0 1-3.5 3.5H11l-3.6 3v-3h-.9A3.5 3.5 0 0 1 3 12.5v-4A3.5 3.5 0 0 1 6.5 5z" />
            <circle cx="19" cy="5" r="2.6" fill="var(--gold-hi)" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Nudge
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Demo Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              borderRadius: 20,
              backgroundColor: 'var(--hover)',
              border: '1px solid var(--line)',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--ink)',
            }}
            title="Switch demo account to test multi-user messaging!"
          >
            <Avatar name={user?.displayName || 'User'} url={user?.avatarUrl} size={22} />
            <span>{user?.displayName?.split(' ')[0] || 'Demo'}</span>
            <Sparkles size={13} color="var(--gold)" />
          </button>

          {showSwitchDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: 220,
                backgroundColor: 'var(--panel)',
                borderRadius: 12,
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--line)',
                zIndex: 100,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', padding: '4px 8px' }}>
                SWITCH DEMO ACCOUNT
              </div>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    switchUser(acc.id);
                    setShowSwitchDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 8,
                    backgroundColor: acc.id === user?.id ? 'var(--hover)' : 'transparent',
                    textAlign: 'left',
                    color: 'var(--ink)',
                    fontSize: 13,
                  }}
                >
                  <Avatar name={acc.displayName} url={acc.avatarUrl} size={26} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {acc.displayName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>@{acc.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Games Center */}
        <button
          onClick={onOpenGames}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)',
            transition: 'background 0.15s',
          }}
          title="Games Center"
        >
          <Gamepad2 size={20} />
        </button>

        {/* Add Friends */}
        <button
          onClick={onOpenAddFriends}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)',
          }}
          title="Add Friends"
        >
          <UserPlus size={19} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--muted)',
          }}
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
};
