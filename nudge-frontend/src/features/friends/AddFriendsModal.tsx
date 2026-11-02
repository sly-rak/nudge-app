import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { X, Search, Users, MessageSquare, Clock, Plus, Check } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface AddFriendsModalProps {
  onClose: () => void;
  onFriendAdded?: () => void;
  onConversationCreated?: (convId: string) => void;
}

const DEFAULT_ROOM_OPTIONS = [
  { name: 'General', emoji: '💬', selected: true },
  { name: 'School', emoji: '📚', selected: false },
  { name: 'Events', emoji: '🎉', selected: false },
  { name: 'Photos', emoji: '📸', selected: false },
  { name: 'Money', emoji: '💸', selected: false },
  { name: 'Games', emoji: '🎮', selected: false },
];

export const AddFriendsModal: React.FC<AddFriendsModalProps> = ({
  onClose,
  onFriendAdded,
  onConversationCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');

  // Direct chat search & contacts
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Group creation state
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [expirationKey, setExpirationKey] = useState<'none' | '1h' | '24h' | '7d' | '30d' | 'custom'>('none');
  const [customDate, setCustomDate] = useState('');
  const [roomsList, setRoomsList] = useState(DEFAULT_ROOM_OPTIONS);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Load demo friends and bots
  useEffect(() => {
    setLoadingContacts(true);
    api.searchUsers('')
      .then((res) => {
        setContacts(res.users);
      })
      .catch((err) => console.error('Failed to load contacts:', err))
      .finally(() => setLoadingContacts(false));
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    try {
      const res = await api.searchUsers(q);
      setContacts(res.users);
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    try {
      const res = await api.createConversation({
        type: 'direct',
        targetUserId,
      });
      if (res.conversationId) {
        onConversationCreated?.(res.conversationId);
        onFriendAdded?.();
        onClose();
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleRoomSelection = (index: number) => {
    setRoomsList((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    setCreatingGroup(true);

    let endsAt: string | null = null;
    const now = Date.now();
    if (expirationKey === '1h') endsAt = new Date(now + 3600000).toISOString();
    else if (expirationKey === '24h') endsAt = new Date(now + 24 * 3600000).toISOString();
    else if (expirationKey === '7d') endsAt = new Date(now + 7 * 24 * 3600000).toISOString();
    else if (expirationKey === '30d') endsAt = new Date(now + 30 * 24 * 3600000).toISOString();
    else if (expirationKey === 'custom' && customDate) endsAt = new Date(customDate).toISOString();

    const selectedRooms = roomsList
      .filter((r) => r.selected)
      .map((r) => ({ name: r.name, emoji: r.emoji }));

    try {
      const res = await api.createConversation({
        type: 'group',
        title: groupTitle.trim(),
        memberIds: Array.from(selectedMemberIds),
        endsAt,
        rooms: selectedRooms.length > 0 ? selectedRooms : [{ name: 'General', emoji: '💬' }],
      });

      if (res.conversationId) {
        onConversationCreated?.(res.conversationId);
        onFriendAdded?.();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreatingGroup(false);
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
          maxWidth: 460,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
              {activeTab === 'direct' ? 'New Message' : 'Create Group'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle (Direct Chat vs Group) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', backgroundColor: 'var(--side)' }}>
          <button
            onClick={() => setActiveTab('direct')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeTab === 'direct' ? 700 : 500,
              color: activeTab === 'direct' ? 'var(--accent)' : 'var(--muted)',
              borderBottom: activeTab === 'direct' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={16} />
            <span>Direct Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('group')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              border: 'none',
              background: 'none',
              fontSize: 13,
              fontWeight: activeTab === 'group' ? 700 : 500,
              color: activeTab === 'group' ? 'var(--accent)' : 'var(--muted)',
              borderBottom: activeTab === 'group' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            <Users size={16} />
            <span>New Group</span>
          </button>
        </div>

        {/* TAB 1: DIRECT CHAT */}
        {activeTab === 'direct' ? (
          <>
            {/* Search Bar */}
            <div style={{ padding: '12px 18px 8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px',
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: 'var(--hover)',
                  border: '1px solid var(--line)',
                }}
              >
                <Search size={16} color="var(--muted)" />
                <input
                  type="text"
                  placeholder="Search contacts, bots & friends..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ flex: 1, background: 'none', color: 'var(--ink)', fontSize: 13.5, border: 'none', outline: 'none' }}
                  autoFocus
                />
              </div>
            </div>

            {/* Contacts & Bots List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loadingContacts ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>
                  No contacts found.
                </div>
              ) : (
                contacts.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartDirectChat(u.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: 'var(--side)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.displayName || u.username} url={u.avatarUrl} size={38} online />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>
                            {u.displayName}
                          </span>
                          {u.isBot && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 5px',
                                borderRadius: 4,
                                backgroundColor: 'rgba(15, 107, 88, 0.15)',
                                color: 'var(--accent)',
                                fontWeight: 700,
                              }}
                            >
                              BOT
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {u.bio || `@${u.username}`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: '5px 12px',
                        borderRadius: 16,
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-ink)',
                        fontSize: 12,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* TAB 2: NEW GROUP WITH ROOMS & EXPIRATION */
          <form onSubmit={handleCreateGroup} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Group Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Lagos Devs, ABUAD Crew, Beach Trip 🏖️"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--hover)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  fontSize: 14,
                  outline: 'none',
                }}
                required
              />
            </div>

            {/* Expiration Settings */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                <Clock size={13} />
                <span>Temporary Group Expiration</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[
                  { key: 'none', label: 'Permanent' },
                  { key: '1h', label: '1 Hour' },
                  { key: '24h', label: '24 Hours' },
                  { key: '7d', label: '7 Days' },
                  { key: '30d', label: '30 Days' },
                  { key: 'custom', label: 'Custom Date' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setExpirationKey(opt.key as any)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: expirationKey === opt.key ? 700 : 500,
                      backgroundColor: expirationKey === opt.key ? 'var(--accent)' : 'var(--side)',
                      color: expirationKey === opt.key ? 'var(--accent-ink)' : 'var(--ink)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {expirationKey === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    marginTop: 8,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--hover)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    fontSize: 13,
                  }}
                  required
                />
              )}
            </div>

            {/* Rooms inside group */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                Rooms inside Group (Separate discussions)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {roomsList.map((room, idx) => (
                  <button
                    key={room.name}
                    type="button"
                    onClick={() => toggleRoomSelection(idx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: room.selected ? 700 : 500,
                      backgroundColor: room.selected ? 'rgba(15, 107, 88, 0.15)' : 'var(--side)',
                      color: room.selected ? 'var(--accent)' : 'var(--muted)',
                      border: room.selected ? '1px solid var(--accent)' : '1px solid var(--line)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{room.emoji}</span>
                    <span>#{room.name}</span>
                    {room.selected && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Members Checklist */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                Select Members ({selectedMemberIds.size} selected)
              </label>
              <div
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '4px 6px',
                  backgroundColor: 'var(--side)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {contacts.map((u) => {
                  const isSelected = selectedMemberIds.has(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMemberSelection(u.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 8,
                        backgroundColor: isSelected ? 'var(--hover)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={u.displayName || u.username} url={u.avatarUrl} size={30} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                            {u.displayName}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {u.isBot ? '🤖 Bot' : `@${u.username}`}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: isSelected ? 'none' : '1px solid var(--line)',
                          backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                        }}
                      >
                        {isSelected && <Check size={13} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingGroup || !groupTitle.trim()}
              style={{
                marginTop: 6,
                padding: '11px',
                borderRadius: 10,
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-ink)',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: creatingGroup || !groupTitle.trim() ? 'default' : 'pointer',
                opacity: creatingGroup || !groupTitle.trim() ? 0.6 : 1,
              }}
            >
              {creatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
