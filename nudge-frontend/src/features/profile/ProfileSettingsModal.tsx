import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { DownForStatus } from '@nudge/shared';
import { X, Check, Shield, Bell, Moon, Sun, LogOut, Flame, MessageSquare, Gamepad2, Users, Sparkles } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface ProfileSettingsModalProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

const DOWN_FOR_OPTIONS: { key: DownForStatus; label: string; desc: string; emoji: string }[] = [
  { key: 'talk', label: 'Down to talk', desc: 'Available for deep chats & voice notes', emoji: '💬' },
  { key: 'play', label: 'Down to play', desc: 'Ready for game duels & challenges', emoji: '🎮' },
  { key: 'hang', label: 'Down to hang', desc: 'Up for meeting up or chilling', emoji: '☕' },
  { key: 'heads_down', label: 'Heads down', desc: 'Focusing, notifications muted', emoji: '🎧' },
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ onClose, isEmbedded = false }) => {
  const { user, updateStatus, logout, demoAccounts, switchUser } = useAuth();
  const [selectedDownFor, setSelectedDownFor] = useState<DownForStatus>(user?.status?.downFor || 'talk');
  const [statusText, setStatusText] = useState(user?.status?.text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nudge_theme') as 'light' | 'dark') || 'light';
  });

  const handleSaveStatus = async () => {
    setIsSaving(true);
    try {
      await updateStatus({
        downFor: selectedDownFor,
        text: statusText,
      });
      onClose?.();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('nudge_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const content = (
    <div
      style={{
        width: '100%',
        maxWidth: isEmbedded ? 560 : 440,
        backgroundColor: 'var(--panel)',
        borderRadius: isEmbedded ? 0 : 16,
        boxShadow: isEmbedded ? 'none' : 'var(--shadow)',
        border: isEmbedded ? 'none' : '1px solid var(--line)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: isEmbedded ? '100%' : 'auto',
        maxHeight: isEmbedded ? '100%' : '90vh',
        overflowY: 'auto',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Profile & Settings</h3>
        {onClose && !isEmbedded && (
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* User Profile Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user?.displayName} url={user?.avatarUrl} size={64} />
          <div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{user?.displayName}</h4>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>@{user?.username}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink)', opacity: 0.85, marginTop: 4 }}>{user?.bio}</div>
          </div>
        </div>

        {/* Live Activity Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'var(--side)', border: '1px solid var(--line)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--accent)', fontWeight: 700, fontSize: 18 }}>
              <Flame size={18} />
              <span>5 days</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Daily Streak</span>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'var(--side)', border: '1px solid var(--line)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--gold)', fontWeight: 700, fontSize: 18 }}>
              <Gamepad2 size={18} />
              <span>14</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Games Played</span>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'var(--side)', border: '1px solid var(--line)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--ok)', fontWeight: 700, fontSize: 18 }}>
              <Users size={18} />
              <span>12</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Friends</span>
          </div>
        </div>

        {/* "Down For..." Status Chip Picker */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 8 }}>
            "DOWN FOR..." STATUS
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {DOWN_FOR_OPTIONS.map((opt) => {
              const isSelected = selectedDownFor === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedDownFor(opt.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 3,
                    padding: '10px 12px',
                    borderRadius: 12,
                    backgroundColor: isSelected ? 'rgba(15, 107, 88, 0.15)' : 'var(--side)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--line)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: isSelected ? 'var(--accent)' : 'var(--ink)' }}>
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="Custom status text (e.g. Ready for FIFA rematch!)..."
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: 'var(--hover)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
          </div>

          <button
            onClick={handleSaveStatus}
            disabled={isSaving}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isSaving ? 'Saving...' : 'Update Status'}
          </button>
        </div>

        {/* Preferences & Theme */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.5, marginBottom: 10 }}>
            PREFERENCES
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 12,
                backgroundColor: 'var(--side)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>Color Theme</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </button>
          </div>
        </div>

        {/* Switch Demo Accounts */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={14} color="var(--gold)" />
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: 0.5 }}>
              SWITCH ACCOUNT (TEST BOTS & CONTACTS)
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => switchUser(acc.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 8px',
                  borderRadius: 8,
                  backgroundColor: acc.id === user?.id ? 'var(--hover)' : 'var(--side)',
                  border: acc.id === user?.id ? '2px solid var(--accent)' : '1px solid var(--line)',
                  color: 'var(--ink)',
                  fontSize: 12,
                  fontWeight: acc.id === user?.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <Avatar name={acc.displayName} url={acc.avatarUrl} size={22} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {acc.displayName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginBottom: 8 }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              borderRadius: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', backgroundColor: 'var(--panel)' }}>
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {content}
    </div>
  );
};
