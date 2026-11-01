import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { DownForStatus } from '@nudge/shared';
import { X, Check, Shield, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface ProfileSettingsModalProps {
  onClose: () => void;
}

const DOWN_FOR_OPTIONS: { key: DownForStatus; label: string; desc: string }[] = [
  { key: 'talk', label: 'Down to talk', desc: 'Available for deep chats & voice notes' },
  { key: 'play', label: 'Down to play', desc: 'Ready for game duels & challenges' },
  { key: 'hang', label: 'Down to hang', desc: 'Up for meeting up or chilling' },
  { key: 'heads_down', label: 'Heads down', desc: 'Focusing, notifications muted' },
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ onClose }) => {
  const { user, updateStatus, logout } = useAuth();
  const [selectedDownFor, setSelectedDownFor] = useState<DownForStatus>(user?.status?.downFor || 'talk');
  const [statusText, setStatusText] = useState(user?.status?.text || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveStatus = async () => {
    setIsSaving(true);
    try {
      await updateStatus({
        downFor: selectedDownFor,
        text: statusText,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsSaving(false);
    }
  };

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
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--panel)',
          borderRadius: 16,
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Profile & Settings</h3>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* User Profile Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={user?.displayName} url={user?.avatarUrl} size={64} />
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{user?.displayName}</h4>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>@{user?.username}</div>
              <div style={{ fontSize: 12, color: 'var(--ink)', opacity: 0.8, marginTop: 4 }}>{user?.bio}</div>
            </div>
          </div>

          {/* "Down For..." Status Chip Picker */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
              "DOWN FOR..." STATUS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
              {DOWN_FOR_OPTIONS.map((opt) => {
                const isSelected = selectedDownFor === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedDownFor(opt.key)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? 'rgba(15, 107, 88, 0.12)' : 'var(--hover)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                      textAlign: 'left',
                      color: isSelected ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: 12.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} color="var(--accent)" />}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Add optional note (e.g. coffee catchup, VI)"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--hover)',
                color: 'var(--ink)',
                fontSize: 13,
                border: '1px solid var(--line)',
              }}
            />
          </div>

          {/* Privacy & Safety Settings */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
              PRIVACY & SAFETY
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} color="var(--muted)" />
                  <span>Read Receipts</span>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={16} color="var(--muted)" />
                  <span>Typing Indicators</span>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--side)',
          }}
        >
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--vanish)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <button
            onClick={handleSaveStatus}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
