import React, { useState } from 'react';
import { Conversation } from '@nudge/shared';
import { Search, Pin, Plus, Clock, Archive, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import { StatusChip } from '../../components/StatusChip.js';
import { usePresence } from '../../context/PresenceContext.js';

interface ChatListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelectConversation: (conv: Conversation) => void;
  onOpenNearby: () => void;
  onNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  onOpenNearby,
  onNewChat,
}) => {
  const { isOnline } = usePresence();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const getExpirationBadge = (endsAt?: string) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return { text: 'Expired', isUrgent: true };
    const hours = Math.ceil(diff / 3600000);
    if (hours < 1) return { text: '<1h left', isUrgent: true };
    if (hours <= 24) return { text: `${hours}h left`, isUrgent: true };
    const days = Math.ceil(diff / 86400000);
    return { text: `${days}d left`, isUrgent: false };
  };

  const activeConversations = conversations.filter((c) => !c.isArchived && !c.archivedAt);
  const archivedConversations = conversations.filter((c) => c.isArchived || c.archivedAt);

  const filteredConversations = activeConversations.filter((c) => {
    const title = c.title || '';
    const lastMsg = c.lastMessage?.body || '';
    return title.toLowerCase().includes(search.toLowerCase()) || lastMsg.toLowerCase().includes(search.toLowerCase());
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--side)' }}>
      {/* Search and Nearby Bar */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            height: 38,
            borderRadius: 12,
            backgroundColor: 'var(--hover)',
            border: '1px solid transparent',
          }}
        >
          <Search size={16} color="var(--muted)" />
          <input
            type="search"
            placeholder="Search chats, groups & bots"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              color: 'var(--ink)',
              fontSize: 13.5,
              border: 'none',
              outline: 'none',
            }}
          />
          <span
            style={{
              fontSize: 10,
              padding: '2px 5px',
              borderRadius: 4,
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            Ctrl K
          </span>
        </div>

        {/* Nearby Pill Button (Siri-style animated orb) */}
        <button
          onClick={onOpenNearby}
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr auto',
            gap: 10,
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: 14,
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            textAlign: 'left',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 14px rgba(122,92,255,0.4)',
              background: 'conic-gradient(from 0deg, #FF3D7F, #7A5CFF, #18C8FF, #2EE6A6, #FFB02E, #FF3D7F)',
              animation: 'spin 6s linear infinite',
            }}
          />
          <div>
            <b style={{ display: 'block', fontSize: 13.5, color: 'var(--ink)' }}>Nearby</b>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Find friends, groups & players</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Radar</span>
        </button>
      </div>

      {/* Conversations List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
        {filteredConversations.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No conversations found.
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedId;
            const otherUser = (conv as any).otherUser;
            const expBadge = getExpirationBadge(conv.endsAt);

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--hover)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  marginBottom: 2,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar
                    name={conv.title || 'Chat'}
                    url={conv.avatarUrl}
                    size={44}
                    online={conv.type === 'direct' && isOnline(otherUser?.id || (otherUser as any)?.userId)}
                  />
                  {conv.type === 'group' && (
                    <div
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        backgroundColor: 'var(--panel)',
                        borderRadius: '50%',
                        padding: 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Users size={11} color="var(--accent)" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: conv.unreadCount ? 700 : 600,
                          fontSize: 14,
                          color: 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {conv.title || 'Conversation'}
                      </span>
                      {conv.isPinned && <Pin size={12} color="var(--accent)" />}
                      {expBadge && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 6,
                            backgroundColor: expBadge.isUrgent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: expBadge.isUrgent ? '#ef4444' : '#d97706',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          <Clock size={10} />
                          {expBadge.text}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                      {formatTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: conv.unreadCount ? 'var(--ink)' : 'var(--muted)',
                        fontWeight: conv.unreadCount ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.lastMessage?.body || 'Start chatting...'}
                    </div>

                    {!!conv.unreadCount && conv.unreadCount > 0 && (
                      <span
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 10,
                          flexShrink: 0,
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {otherUser?.downFor && (
                    <div style={{ marginTop: 4 }}>
                      <StatusChip downFor={otherUser.downFor} text={otherUser.statusText} compact />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Archived Groups Accordion */}
        {archivedConversations.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 10,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Archive size={14} />
                <span>Archived Groups ({archivedConversations.length})</span>
              </div>
              {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {showArchived && (
              <div style={{ marginTop: 4 }}>
                {archivedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      opacity: 0.75,
                      backgroundColor: conv.id === selectedId ? 'var(--hover)' : 'transparent',
                      marginBottom: 2,
                    }}
                  >
                    <Avatar name={conv.title || 'Archived'} url={conv.avatarUrl} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                          {conv.title}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Archived</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage?.body || 'Archived group'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onNewChat}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 46,
            height: 46,
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-ink)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 8px 20px rgba(15, 107, 88, 0.35)',
            border: 'none',
            cursor: 'pointer',
          }}
          title="New Chat or Group"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
};
