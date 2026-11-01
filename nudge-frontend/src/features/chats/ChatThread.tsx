import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '@nudge/shared';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { wsClient } from '../../services/websocket.js';
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Smile,
  Gamepad2,
  Check,
  CheckCheck,
  MoreVertical,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import { StatusChip } from '../../components/StatusChip.js';

interface ChatThreadProps {
  conversation: Conversation;
  onBack?: () => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onLaunchGame: (gameKey: string, conversationId: string) => void;
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👍', '😮', '👏'];

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversation,
  onBack,
  onStartCall,
  onLaunchGame,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load message history
  useEffect(() => {
    let isMounted = true;
    api.getMessages(conversation.id)
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages);
          scrollToBottom();
          // Mark read
          api.markConversationRead(conversation.id);
        }
      })
      .catch((err) => console.error('Failed to load messages:', err));

    return () => {
      isMounted = false;
    };
  }, [conversation.id]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubNew = wsClient.on('message.new', (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversation.id) {
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
        setTypingUser(data.isTyping ? 'Someone' : null);
      }
    });

    const unsubUpdate = wsClient.on('message.updated', () => {
      api.getMessages(conversation.id).then((res) => setMessages(res.messages));
    });

    return () => {
      unsubNew();
      unsubTyping();
      unsubUpdate();
    };
  }, [conversation.id, user?.id]);

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
      const res = await api.getMessages(conversation.id);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const otherUser = (conversation as any).otherUser;

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
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <Avatar
            name={conversation.title || 'Chat'}
            url={conversation.avatarUrl}
            size={40}
            online={conversation.type === 'direct'}
          />

          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
              {conversation.title || 'Conversation'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {typingUser ? (
                <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 500 }}>typing...</span>
              ) : otherUser?.downFor ? (
                <StatusChip downFor={otherUser.downFor} text={otherUser.statusText} compact />
              ) : (
                <span style={{ fontSize: 11.5, color: 'var(--ok)' }}>Active now</span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons: Calls, Games, More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => onStartCall('audio')}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}
            title="Voice call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => onStartCall('video')}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}
            title="Video call"
          >
            <Video size={18} />
          </button>
          <button
            onClick={() => onLaunchGame('tictactoe', conversation.id)}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--gold)' }}
            title="Play Tic-Tac-Toe match"
          >
            <Gamepad2 size={19} />
          </button>
        </div>
      </div>

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
          const isMe = msg.senderId === user?.id;
          const showReactions = activeReactionMsgId === msg.id;

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
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      style={{ fontSize: 16, padding: '2px 4px', transition: 'transform 0.1s' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
          style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--gold)' }}
          title="Challenge to Tic-Tac-Toe"
        >
          <Gamepad2 size={20} />
        </button>

        <input
          type="text"
          placeholder="Message..."
          value={inputValue}
          onChange={handleInputChange}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: 20,
            backgroundColor: 'var(--hover)',
            color: 'var(--ink)',
            fontSize: 14,
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
