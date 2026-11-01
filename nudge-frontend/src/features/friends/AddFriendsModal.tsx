import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface AddFriendsModalProps {
  onClose: () => void;
  onFriendAdded?: () => void;
}

export const AddFriendsModal: React.FC<AddFriendsModalProps> = ({ onClose, onFriendAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchUsers(q);
      setResults(res.users);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (targetId: string) => {
    try {
      await api.sendFriendRequest(targetId);
      setAddedIds((prev) => new Set(prev).add(targetId));
      if (onFriendAdded) onFriendAdded();
    } catch (err) {
      console.error('Failed to add friend:', err);
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
          maxWidth: 420,
          backgroundColor: 'var(--panel)',
          borderRadius: 16,
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Add Friends</h3>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '14px 18px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 12px',
              height: 40,
              borderRadius: 10,
              backgroundColor: 'var(--hover)',
              border: '1px solid var(--line)',
            }}
          >
            <Search size={16} color="var(--muted)" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ flex: 1, background: 'none', color: 'var(--ink)', fontSize: 13.5 }}
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 18px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>
              {searchQuery ? 'No users found matching that name.' : 'Search for friends to talk, play, and share stories with.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map((u) => {
                const isAdded = addedIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: 'var(--side)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.displayName} url={u.avatarUrl} size={38} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{u.displayName}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>@{u.username}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddFriend(u.id)}
                      disabled={isAdded}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 10px',
                        borderRadius: 8,
                        backgroundColor: isAdded ? 'var(--hover)' : 'var(--accent)',
                        color: isAdded ? 'var(--muted)' : 'var(--accent-ink)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {isAdded ? <Check size={14} /> : <UserPlus size={14} />}
                      <span>{isAdded ? 'Sent' : 'Add'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
