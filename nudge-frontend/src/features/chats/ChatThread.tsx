import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Room } from '@nudge/shared';
import { useAuth } from '../../context/AuthContext.js';
import { usePresence } from '../../context/PresenceContext.js';
import { api } from '../../services/api.js';
import { wsClient } from '../../services/websocket.js';
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Gamepad2,
  CheckCheck,
  Clock,
  Archive,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import { StatusChip } from '../../components/StatusChip.js';

interface ChatThreadProps {
  conversation: Conversation;
  onBack?: () => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onLaunchGame: (gameKey: string, conversationId: string) => void;
  onUpdateConversation?: () => void;
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👍', '😮', '👏'];

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversation,
  onBack,
  onStartCall,
  onLaunchGame,
  onUpdateConversation,
}) => {
  const { user } = useAuth();
  const { isOnline, getStatusLabel } = usePresence();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingName, setTypingName] = useState<string | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(
    conversation.rooms && conversation.rooms.length > 0 ? conversation.rooms[0].id : undefined
  );
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState('💬');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Sync active room if conversation changes
  useEffect(() => {
    if (conversation.rooms && conversation.rooms.length > 0) {
      if (!activeRoomId || !conversation.rooms.some((r) => r.id === activeRoomId)) {
        setActiveRoomId(conversation.rooms[0].id);
      }
    } else {
      setActiveRoomId(undefined);
    }
  }, [conversation.id, conversation.rooms]);

  // Load message history (filtered by active room if rooms exist)
  useEffect(() => {
    let isMounted = true;
    api.getMessages(conversation.id, activeRoomId)
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages);
          scrollToBottom();
          api.markConversationRead(conversation.id);
        }
      })
      .catch((err) => console.error('Failed to load messages:', err));

    return () => {
      isMounted = false;
    };
  }, [conversation.id, activeRoomId]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubNew = wsClient.on('message.new', (data: { conversationId: string; roomId?: string; message: Message }) => {
      if (data.conversationId === conversation.id) {
        // If message is for another room, skip adding to current thread view
        if (activeRoomId && data.roomId && data.roomId !== activeRoomId) {
          return;
        }

        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id || (m.clientMsgId && m.clientMsgId === data.message.clientMsgId))) {
            return prev;
          }
          return [...prev, data.message];
        });
        scrollToBottom();
        api.markConversationRead(conversation.id);
      }
    });

    const unsubTyping = wsClient.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        if (data.isTyping) {
          // Look up user name if member
          const member = conversation.members?.find((m) => m.userId === data.userId);
          const name = member?.user?.displayName || (conversation as any).otherUser?.displayName || 'Someone';
          setTypingName(name);
        } else {
          setTypingName(null);
        }
      }
    });

    const unsubUpdate = wsClient.on('message.updated', () => {
      api.getMessages(conversation.id, activeRoomId).then((res) => setMessages(res.messages));
    });

    return () => {
      unsubNew();
      unsubTyping();
      unsubUpdate();
    };
  }, [conversation.id, activeRoomId, user?.id, conversation.members]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Send typing event
    wsClient.send({
      t: 'typing.start',
      d: { conversationId: conversation.id },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsClient.send({
        t: 'typing.stop',
        d: { conversationId: conversation.id },
      });
    }, 2500);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    const clientMsgId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Optimistic message update
    const optimisticMsg: Message = {
      id: clientMsgId,
      conversationId: conversation.id,
      roomId: activeRoomId,
      seq: (messages[messages.length - 1]?.seq || 0) + 1,
      senderId: user?.id || '',
      clientMsgId,
      type: 'text',
      body: text,
      createdAt: new Date().toISOString(),
      sender: user || undefined,
      reactions: [],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    // Send via WebSocket
    wsClient.send({
      t: 'message.send',
      d: {
        conversationId: conversation.id,
        roomId: activeRoomId,
        body: text,
        type: 'text',
        clientMsgId,
      },
    });
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    setActiveReactionMsgId(null);
    try {
      await api.addReaction(messageId, emoji);
      const res = await api.getMessages(conversation.id, activeRoomId);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await api.addRoom(conversation.id, {
        name: newRoomName.trim(),
        emoji: newRoomEmoji,
      });
      if (res.room) {
        conversation.rooms = [...(conversation.rooms || []), res.room];
        setActiveRoomId(res.room.id);
        setShowAddRoom(false);
        setNewRoomName('');
        onUpdateConversation?.();
      }
    } catch (err) {
      console.error('Failed to add room:', err);
    }
  };

  const handleReopenGroup = async () => {
    try {
      await api.reopenConversation(conversation.id);
      conversation.archivedAt = undefined;
      conversation.isArchived = false;
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to reopen:', err);
    }
  };

  const otherUser = (conversation as any).otherUser;

  // Expiration calculation
  const getExpirationInfo = () => {
    if (conversation.archivedAt || conversation.isArchived) {
      return { isArchived: true, text: 'This temporary group has been archived. Messages are read-only.' };
    }
    if (!conversation.endsAt) return null;
    const diff = new Date(conversation.endsAt).getTime() - Date.now();
    if (diff <= 0) {
      return { isArchived: true, text: 'This temporary group has reached its end date.' };
    }
    const hours = Math.ceil(diff / 3600000);
    if (hours < 1) return { isArchived: false, text: 'This group ends in less than an hour.' };
    if (hours <= 24) return { isArchived: false, text: `This group ends in ${hours} hour${hours > 1 ? 's' : ''}.` };
    const days = Math.ceil(diff / 86400000);
    return { isArchived: false, text: `This group ends in ${days} day${days > 1 ? 's' : ''}.` };
  };

  const expInfo = getExpirationInfo();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--panel)' }}>
      {/* Thread Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--panel)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <Avatar
            name={conversation.title || 'Chat'}
            url={conversation.avatarUrl}
            size={40}
            online={conversation.type === 'direct' && isOnline(otherUser?.id || otherUser?.userId)}
          />

          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
              {conversation.title || 'Conversation'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {typingName ? (
                <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 500 }}>
                  {typingName} is typing...
                </span>
              ) : conversation.type === 'group' ? (
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {conversation.members?.length || 0} members
                </span>
              ) : otherUser?.downFor ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <StatusChip downFor={otherUser.downFor} text={otherUser.statusText} compact />
                  <span style={{ fontSize: 11, color: isOnline(otherUser?.id || otherUser?.userId) ? 'var(--ok)' : 'var(--muted)' }}>
                    • {isOnline(otherUser?.id || otherUser?.userId) ? 'Online' : getStatusLabel(otherUser?.id || otherUser?.userId)}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 11.5, color: isOnline(otherUser?.id || otherUser?.userId) ? 'var(--ok)' : 'var(--muted)' }}>
                  {isOnline(otherUser?.id || otherUser?.userId) ? 'Online' : getStatusLabel(otherUser?.id || otherUser?.userId)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons: Calls, Games, More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => onStartCall('audio')}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Voice call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => onStartCall('video')}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Video call"
          >
            <Video size={18} />
          </button>
          <button
            onClick={() => onLaunchGame('tictactoe', conversation.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 20,
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              color: 'var(--gold)',
              fontWeight: 600,
              fontSize: 12.5,
              border: 'none',
              cursor: 'pointer',
            }}
            title="Play Tic-Tac-Toe match"
          >
            <Gamepad2 size={16} />
            <span>Play Duel</span>
          </button>
        </div>
      </div>

      {/* Group Rooms Strip (if group has rooms) */}
      {conversation.rooms && conversation.rooms.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            backgroundColor: 'var(--side)',
            borderBottom: '1px solid var(--line)',
            overflowX: 'auto',
          }}
        >
          {conversation.rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--panel)',
                  color: isActive ? 'var(--accent-ink)' : 'var(--ink)',
                  border: isActive ? 'none' : '1px solid var(--line)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{room.emoji || '💬'}</span>
                <span>#{room.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowAddRoom(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '5px 8px',
              borderRadius: 20,
              fontSize: 12,
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              border: '1px dashed var(--line)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Add Room"
          >
            <Plus size={13} />
            <span>Room</span>
          </button>
        </div>
      )}

      {/* Add Room Modal / Input */}
      {showAddRoom && (
        <form
          onSubmit={handleAddRoom}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            backgroundColor: 'var(--hover)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <input
            type="text"
            value={newRoomEmoji}
            onChange={(e) => setNewRoomEmoji(e.target.value)}
            style={{ width: 34, textAlign: 'center', fontSize: 16, background: 'none', border: '1px solid var(--line)', borderRadius: 6 }}
          />
          <input
            type="text"
            placeholder="Room name (e.g. Events, Food)"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13 }}
            autoFocus
          />
          <button type="submit" style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: 'var(--accent)', color: '#fff', fontSize: 12, border: 'none', cursor: 'pointer' }}>
            Add
          </button>
          <button type="button" onClick={() => setShowAddRoom(false)} style={{ padding: '4px 8px', borderRadius: 6, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
            Cancel
          </button>
        </form>
      )}

      {/* Temporary Group Expiration Banner */}
      {expInfo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: expInfo.isArchived ? 'rgba(107, 114, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px dashed var(--line)',
            fontSize: 12.5,
            color: expInfo.isArchived ? 'var(--muted)' : '#d97706',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {expInfo.isArchived ? <Archive size={14} /> : <Clock size={14} />}
            <span>{expInfo.text}</span>
          </div>
          {expInfo.isArchived && (
            <button
              onClick={handleReopenGroup}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--ink)',
              }}
            >
              <RotateCcw size={12} />
              <span>Reopen</span>
            </button>
          )}
        </div>
      )}

      {/* Message List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          backgroundColor: 'var(--wall)',
        }}
      >
        {messages.map((msg) => {
          const isMe = (msg.senderId || (msg as any).sender_id || msg.sender?.id) === user?.id;
          const showReactions = activeReactionMsgId === msg.id;

          if (msg.type === 'game') {
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderRadius: 16,
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  gap: 8,
                  maxWidth: 320,
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>
                  <Gamepad2 size={20} />
                  <span>Tic-Tac-Toe Duel</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)' }}>{msg.body}</div>
                <button
                  onClick={() => onLaunchGame('tictactoe', conversation.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 16px',
                    borderRadius: 20,
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12.5,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Play size={13} fill="#fff" />
                  <span>Play Move</span>
                </button>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                position: 'relative',
              }}
            >
              {/* Sender Name in group chats */}
              {!isMe && conversation.type === 'group' && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 2, paddingLeft: 4 }}>
                  {msg.sender?.displayName || 'Member'}
                </span>
              )}

              {/* Message Bubble */}
              <div
                onClick={() => setActiveReactionMsgId(showReactions ? null : msg.id)}
                style={{
                  maxWidth: '75%',
                  padding: '9px 13px',
                  borderRadius: 14,
                  backgroundColor: isMe ? 'var(--accent)' : 'var(--them)',
                  color: isMe ? 'var(--accent-ink)' : 'var(--ink)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: isMe ? 'none' : '1px solid var(--them-bd)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {msg.body}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                    marginTop: 3,
                    fontSize: 10.5,
                    opacity: isMe ? 0.85 : 0.6,
                  }}
                >
                  <span>
                    {(() => {
                      const rawDate = msg.createdAt || (msg as any).created_at || (msg as any).t;
                      const d = rawDate ? new Date(rawDate) : new Date();
                      return isNaN(d.getTime())
                        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </span>
                  {isMe && (
                    <span>
                      <CheckCheck size={13} color={isMe ? 'var(--tickr)' : 'var(--muted)'} />
                    </span>
                  )}
                </div>

                {/* Reactions badge display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -10,
                      right: isMe ? 4 : 'auto',
                      left: isMe ? 'auto' : 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      backgroundColor: 'var(--panel)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: '1px 5px',
                      fontSize: 11,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {msg.reactions.map((r, i) => (
                      <span key={i}>{r.emoji}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Reaction Popup */}
              {showReactions && (
                <div
                  style={{
                    position: 'absolute',
                    top: -34,
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'var(--panel)',
                    padding: '4px 8px',
                    borderRadius: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(msg.id, emoji)}
                      style={{ fontSize: 16, padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Animated Bot Typing Bubble */}
        {typingName && (
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '10px 14px',
              backgroundColor: 'var(--them)',
              border: '1px solid var(--them-bd)',
              borderRadius: 16,
              borderBottomLeftRadius: 4,
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--muted)', marginRight: 4 }}>{typingName}</span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'bounce 1s infinite 0s' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'bounce 1s infinite 0.2s' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'bounce 1s infinite 0.4s' }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderTop: '1px solid var(--line)',
          backgroundColor: 'var(--panel)',
        }}
      >
        <button
          type="button"
          onClick={() => onLaunchGame('tictactoe', conversation.id)}
          style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Challenge to Tic-Tac-Toe"
        >
          <Gamepad2 size={20} />
        </button>

        <input
          type="text"
          placeholder={activeRoomId ? `Message in #${conversation.rooms?.find(r => r.id === activeRoomId)?.name || 'room'}...` : 'Message...'}
          value={inputValue}
          onChange={handleInputChange}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: 20,
            backgroundColor: 'var(--hover)',
            color: 'var(--ink)',
            fontSize: 14,
            border: 'none',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={!inputValue.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: inputValue.trim() ? 'var(--accent)' : 'var(--hover)',
            color: inputValue.trim() ? 'var(--accent-ink)' : 'var(--muted)',
            display: 'grid',
            placeItems: 'center',
            border: 'none',
            cursor: inputValue.trim() ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
          }}
          title="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
