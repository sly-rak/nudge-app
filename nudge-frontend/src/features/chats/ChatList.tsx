import React, { useState } from 'react';
import { Conversation } from '@nudge/shared';
import { Search, Pin, Plus } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import { StatusChip } from '../../components/StatusChip.js';

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
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((c) => {
    const title = c.title || '';
    const lastMsg = c.lastMessage?.body || '';
    return title.toLowerCase().includes(search.toLowerCase()) || lastMsg.toLowerCase().includes(search.toLowerCase());
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
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
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              color: 'var(--ink)',
              fontSize: 13.5,
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
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Find friends & players around you</span>
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
                <Avatar
                  name={conv.title || 'Chat'}
                  url={conv.avatarUrl}
                  size={44}
                  online={conv.type === 'direct'}
                />

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
          }}
          title="New Chat"
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
};
