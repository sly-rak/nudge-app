import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Room } from '@nudge/shared';
import { useAuth } from '../../context/AuthContext.js';
import { usePresence } from '../../context/PresenceContext.js';
import { api } from '../../services/api.js';
import { wsClient } from '../../services/websocket.js';
import { playTone } from '../../services/soundEffects.js';
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
  Pause,
  RotateCcw,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Mic,
  Square,
  Smile,
  Paperclip,
  MoreVertical,
  Pin,
  Star,
  Trash2,
  Copy,
  CornerUpLeft,
  FileText,
  Image as ImageIcon,
  Film,
  Link as LinkIcon,
  Volume2,
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

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤗', '🤔', '😐', '😏', '😴', '😎', '🤓', '🥳', '😭', '😡', '😱', '🤯'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '👋', '✌️', '🤞', '👌', '🤙', '☝️', '✍️', '🫶'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💖', '✨', '🔥', '💯'] },
  { name: 'Fun', emojis: ['🎉', '🎊', '🎂', '🎁', '🍕', '🍔', '🍟', '🍿', '🍻', '☕', '⚽', '🏀', '🎮', '🎧', '🎵', '🚀', '🌍', '🌙', '☀️', '🌈'] },
];

const STANDALONE_GIFS = [
  { c: 'LOL', e: '😂', bg: '#fef08a' },
  { c: 'Ship it', e: '🚀', bg: '#bae6fd' },
  { c: 'Wow', e: '😮', bg: '#fbcfe8' },
  { c: 'Party', e: '🥳', bg: '#fed7aa' },
  { c: 'No way', e: '🙅', bg: '#fecdd3' },
  { c: 'Thanks', e: '🙏', bg: '#d9f99d' },
  { c: 'Love it', e: '😍', bg: '#fce7f3' },
  { c: 'Facepalm', e: '🤦', bg: '#e2e8f0' },
  { c: 'On fire', e: '🔥', bg: '#ffedd5' },
  { c: 'Good vibes', e: '😎', bg: '#cffafe' },
  { c: 'Sleepy', e: '😴', bg: '#e0e7ff' },
  { c: 'Dance', e: '💃', bg: '#fdf4ff' },
];

const STANDALONE_STICKERS = [
  '😂', '😍', '🥳', '😭', '🤯', '😎', '🙌', '💪', '🔥', '🎉', '❤️', '👍', '🤔', '🙈', '👻', '🐶'
];

export const ChatThread: React.FC<ChatThreadProps> = ({
  conversation,
  onBack,
  onStartCall,
  onLaunchGame,
  onUpdateConversation,
}) => {
  const { user } = useAuth();
  const { isOnline, getStatusLabel } = usePresence();

  // Core messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingName, setTypingName] = useState<string | null>(null);

  // Active sub-room
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(
    conversation.rooms && conversation.rooms.length > 0 ? conversation.rooms[0].id : undefined
  );
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState('💬');

  // Ghost / Vanish Mode
  const [isGhostMode, setIsGhostMode] = useState<boolean>(
    Boolean(conversation.disappearingSeconds && conversation.disappearingSeconds > 0)
  );
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // In-Chat Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Quote Reply
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    message: Message;
    x: number;
    y: number;
  } | null>(null);

  // Pinned message
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(conversation.pinnedMessageId || null);

  // Modals & Panels
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
  const [showHMore, setShowHMore] = useState(false);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [starredMessages, setStarredMessages] = useState<Message[]>([]);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [mediaTab, setMediaTab] = useState<'photos' | 'docs' | 'links' | 'voice'>('photos');
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Real Voice Note Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Voice Note Playback
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Recurring 1s ticker for ghost mode self-destruct & Aired time calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter out expired vanishing messages
  useEffect(() => {
    setMessages((prev) =>
      prev.filter((m) => {
        if (!m.expiresAt) return true;
        return new Date(m.expiresAt).getTime() > nowTime;
      })
    );
  }, [nowTime]);

  // Sync active room if conversation changes
  useEffect(() => {
    if (conversation.rooms && conversation.rooms.length > 0) {
      if (!activeRoomId || !conversation.rooms.some((r) => r.id === activeRoomId)) {
        setActiveRoomId(conversation.rooms[0].id);
      }
    } else {
      setActiveRoomId(undefined);
    }
    setPinnedMessageId(conversation.pinnedMessageId || null);
  }, [conversation.id, conversation.rooms]);

  // Load message history
  useEffect(() => {
    let isMounted = true;
    api.getMessages(conversation.id, activeRoomId)
      .then((res: any) => {
        if (isMounted) {
          setMessages(res.messages || []);
          if (res.disappearSeconds !== undefined) {
            setIsGhostMode(res.disappearSeconds > 0);
          }
          if (res.pinnedMessageId !== undefined) {
            setPinnedMessageId(res.pinnedMessageId);
          }
          scrollToBottom();
          api.markConversationRead(conversation.id);
        }
      })
      .catch((err) => console.error('Failed to load messages:', err));

    return () => {
      isMounted = false;
    };
  }, [conversation.id, activeRoomId]);

  // Real-time events
  useEffect(() => {
    const unsubNew = wsClient.on('message.new', (data: { conversationId: string; roomId?: string; message: Message }) => {
      if (data.conversationId === conversation.id) {
        if (activeRoomId && data.roomId && data.roomId !== activeRoomId) {
          return;
        }

        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id || (m.clientMsgId && m.clientMsgId === data.message.clientMsgId))) {
            return prev;
          }
          return [...prev, data.message];
        });

        // Synthesize incoming chime if received from someone else
        if (data.message.senderId !== user?.id) {
          playTone('chime');
        }

        scrollToBottom();
        api.markConversationRead(conversation.id);
      }
    });

    const unsubTyping = wsClient.on('typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversation.id && data.userId !== user?.id) {
        if (data.isTyping) {
          const member = conversation.members?.find((m) => m.userId === data.userId);
          const name = member?.user?.displayName || (conversation as any).otherUser?.displayName || 'Someone';
          setTypingName(name);
        } else {
          setTypingName(null);
        }
      }
    });

    const unsubUpdate = wsClient.on('message.updated', () => {
      api.getMessages(conversation.id, activeRoomId).then((res: any) => setMessages(res.messages || []));
    });

    const unsubConvUpdate = wsClient.on('conversation.updated', (data: any) => {
      if (data.conversationId === conversation.id) {
        if (data.disappearSeconds !== undefined) {
          setIsGhostMode(data.disappearSeconds > 0);
        }
        if (data.pinnedMessageId !== undefined) {
          setPinnedMessageId(data.pinnedMessageId);
        }
      }
    });

    const unsubDelete = wsClient.on('message.deleted', (data: any) => {
      if (data.conversationId === conversation.id) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    });

    const unsubClear = wsClient.on('conversation.cleared', (data: any) => {
      if (data.conversationId === conversation.id) {
        setMessages([]);
      }
    });

    return () => {
      unsubNew();
      unsubTyping();
      unsubUpdate();
      unsubConvUpdate();
      unsubDelete();
      unsubClear();
    };
  }, [conversation.id, activeRoomId, user?.id, conversation.members]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const jumpToMessage = (msgId: string) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background-color 0.4s';
      const orig = el.style.backgroundColor;
      el.style.backgroundColor = 'rgba(15, 107, 88, 0.2)';
      setTimeout(() => {
        el.style.backgroundColor = orig;
      }, 1500);
    }
  };

  // Search matches
  const matchingMessageIds = searchQuery.trim()
    ? messages
        .filter((m) => m.body.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((m) => m.id)
    : [];

  const handleNextMatch = () => {
    if (!matchingMessageIds.length) return;
    const nextIdx = (currentMatchIndex + 1) % matchingMessageIds.length;
    setCurrentMatchIndex(nextIdx);
    jumpToMessage(matchingMessageIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (!matchingMessageIds.length) return;
    const prevIdx = (currentMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    jumpToMessage(matchingMessageIds[prevIdx]);
  };

  // Toggle Vanish / Ghost Mode
  const handleToggleGhostMode = async () => {
    const nextSeconds = isGhostMode ? 0 : 10;
    try {
      const res = await api.setVanishMode(conversation.id, nextSeconds);
      setIsGhostMode(res.disappearSeconds > 0);
      playTone('pop');
    } catch (e) {
      console.error('Failed to toggle vanish mode:', e);
    }
  };

  // Input change with typing events
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

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

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    const clientMsgId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const vanishSeconds = isGhostMode ? 10 : undefined;
    const expiresAt = vanishSeconds ? new Date(Date.now() + vanishSeconds * 1000).toISOString() : undefined;

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
      replyToId: replyingTo?.id,
      replyTo: replyingTo || undefined,
      expiresAt,
      vanishSeconds,
      createdAt: new Date().toISOString(),
      sender: user || undefined,
      reactions: [],
      status: 'sent',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyingTo(null);
    scrollToBottom();
    playTone('pop');

    try {
      await api.sendMessage(conversation.id, {
        body: text,
        type: 'text',
        replyToId: replyingTo?.id,
        clientMsgId,
        roomId: activeRoomId,
        vanishSeconds,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Send Attachment / Media
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachMenu(false);
    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const type = isImage ? 'image' : isVideo ? 'video' : 'file';

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const mediaMetadata = {
        name: file.name,
        size: file.size,
        mime: file.type,
        url: dataUrl,
      };

      playTone('pop');
      try {
        await api.sendMessage(conversation.id, {
          body: isImage ? 'Shared an image' : isVideo ? 'Shared a video' : `Shared file: ${file.name}`,
          type,
          mediaUrl: dataUrl,
          mediaMetadata,
          roomId: activeRoomId,
        });
      } catch (err) {
        console.error('Failed to send file:', err);
      }
    };

    reader.readAsDataURL(file);
  };

  // Real Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      setLiveWaveform([]);

      // Setup audio analysis for live waveform bars
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        const norm = Math.max(15, Math.min(100, Math.round((avg / 255) * 100)));
        setLiveWaveform((prev) => [...prev.slice(-32), norm]);
      }, 140);
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable:', err);
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setRecordingSeconds(0);
    setLiveWaveform([]);
  };

  const finishRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const seconds = Math.max(1, recordingSeconds);
    const finalWave = liveWaveform.length > 0 ? liveWaveform : [30, 60, 45, 80, 50, 70, 40];

    mediaRecorderRef.current.onstop = async () => {
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      const reader = new FileReader();
      reader.onload = async () => {
        const audioUrl = reader.result as string;
        playTone('pop');
        try {
          await api.sendMessage(conversation.id, {
            body: 'Voice message',
            type: 'voice',
            mediaUrl: audioUrl,
            mediaMetadata: {
              dur: seconds,
              wave: finalWave,
              url: audioUrl,
            },
            roomId: activeRoomId,
          });
        } catch (err) {
          console.error('Failed to send voice message:', err);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Voice Note Playback
  const togglePlayVoice = (msg: Message) => {
    if (playingVoiceId === msg.id) {
      activeAudioRef.current?.pause();
      setPlayingVoiceId(null);
      setVoiceProgress(0);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audioUrl = msg.mediaMetadata?.url || msg.mediaUrl;
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    activeAudioRef.current = audio;
    setPlayingVoiceId(msg.id);

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setVoiceProgress(audio.currentTime / audio.duration);
      }
    };

    audio.onended = () => {
      setPlayingVoiceId(null);
      setVoiceProgress(0);
    };

    audio.play().catch(() => {});
  };

  const cyclePlaybackSpeed = () => {
    const next = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(next);
    if (activeAudioRef.current) {
      activeAudioRef.current.playbackRate = next;
    }
  };

  // Reactions & Context Menu
  const handleReaction = async (messageId: string, emoji: string) => {
    setContextMenu(null);
    try {
      await api.addReaction(messageId, emoji);
      const res: any = await api.getMessages(conversation.id, activeRoomId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleStarMessage = async (msg: Message) => {
    setContextMenu(null);
    try {
      const res = await api.starMessage(conversation.id, msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isStarred: res.isStarred } : m))
      );
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  };

  const handlePinMessage = async (msg: Message) => {
    setContextMenu(null);
    try {
      const res = await api.pinMessage(conversation.id, msg.id);
      setPinnedMessageId(res.pinnedMessageId);
      setMessages((prev) =>
        prev.map((m) => ({ ...m, isPinned: m.id === res.pinnedMessageId }))
      );
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    setContextMenu(null);
    try {
      await api.deleteMessage(conversation.id, msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  // Starred messages view
  const openStarredModal = async () => {
    setShowHMore(false);
    try {
      const res = await api.getStarredMessages(conversation.id);
      setStarredMessages(res.messages || []);
      setShowStarredModal(true);
    } catch (err) {
      console.error('Failed to fetch starred:', err);
    }
  };

  // Shared media gallery
  const openMediaGallery = async () => {
    setShowHMore(false);
    try {
      const res = await api.getMediaGallery(conversation.id);
      setGalleryItems(res.items || []);
      setShowMediaGallery(true);
    } catch (err) {
      console.error('Failed to fetch media gallery:', err);
    }
  };

  // Clear chat
  const handleClearChat = async () => {
    setShowHMore(false);
    if (!window.confirm('Clear all messages in this conversation?')) return;
    try {
      await api.clearChat(conversation.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // Add Room
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

  // Aired status calculation
  const getAiredStatus = () => {
    if (messages.length === 0) return null;
    const lastMsg = messages[messages.length - 1];
    const isMe = (lastMsg.senderId || (lastMsg as any).sender_id || lastMsg.sender?.id) === user?.id;
    if (!isMe || lastMsg.type === 'system') return null;

    const msgTime = new Date(lastMsg.createdAt).getTime();
    const diffMinutes = Math.floor((nowTime - msgTime) / 60000);
    if (diffMinutes >= 2) {
      const agoText = diffMinutes >= 60 ? `${Math.floor(diffMinutes / 60)}h ago` : `${diffMinutes}m ago`;
      return agoText;
    }
    return null;
  };

  const airedStatus = getAiredStatus();
  const pinnedMessage = messages.find((m) => m.id === pinnedMessageId);

  return (
    <div
      onClick={() => {
        if (contextMenu) setContextMenu(null);
        if (showAttachMenu) setShowAttachMenu(false);
        if (showHMore) setShowHMore(false);
      }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--panel)', position: 'relative' }}
    >
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

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

        {/* Action icons: In-Chat Search, Vanish Mode, Calls, Games, More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* In-chat search trigger */}
          <button
            onClick={() => {
              setShowSearch((prev) => !prev);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: showSearch ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Search in chat"
          >
            <Search size={18} />
          </button>

          {/* Vanish / Ghost Mode Button with Standalone Ghost SVG */}
          <button
            onClick={handleToggleGhostMode}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: isGhostMode ? 'var(--vanish)' : 'var(--muted)',
              backgroundColor: isGhostMode ? 'rgba(223, 75, 47, 0.12)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isGhostMode ? 'Vanish mode is ON (10s)' : 'Turn on Vanish mode (10s)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a7 7 0 0 0-7 7v11l2.5-2 2.25 2L12 19l2.25 2 2.25-2 2.5 2V10a7 7 0 0 0-7-7z" />
              <circle cx="9.5" cy="10.5" r="1" fill="currentColor" />
              <circle cx="14.5" cy="10.5" r="1" fill="currentColor" />
            </svg>
          </button>

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
              padding: '6px 11px',
              borderRadius: 20,
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              color: 'var(--gold)',
              fontWeight: 600,
              fontSize: 12,
              border: 'none',
              cursor: 'pointer',
            }}
            title="Play Duel"
          >
            <Gamepad2 size={15} />
            <span>Play Duel</span>
          </button>

          {/* More Header Options Popover Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHMore((prev) => !prev);
              }}
              style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              title="More options"
            >
              <MoreVertical size={18} />
            </button>

            {showHMore && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 210,
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  padding: 6,
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <button
                  onClick={openMediaGallery}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Film size={15} color="var(--accent)" />
                  <span>Media, links & files</span>
                </button>
                <button
                  onClick={openStarredModal}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Star size={15} color="#eab308" />
                  <span>Starred messages</span>
                </button>
                <button
                  onClick={() => {
                    setShowHMore(false);
                    setShowSearch(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Search size={15} color="var(--muted)" />
                  <span>Search in chat</span>
                </button>
                <div style={{ height: 1, backgroundColor: 'var(--line)', margin: '4px 0' }} />
                <button
                  onClick={handleClearChat}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--vanish)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Trash2 size={15} />
                  <span>Clear messages</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vanish Mode Banner */}
      {isGhostMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            backgroundColor: 'rgba(223, 75, 47, 0.1)',
            color: 'var(--vanish)',
            fontSize: 12.5,
            fontWeight: 500,
            borderBottom: '1px solid rgba(223, 75, 47, 0.2)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a7 7 0 0 0-7 7v11l2.5-2 2.25 2L12 19l2.25 2 2.25-2 2.5 2V10a7 7 0 0 0-7-7z" />
          </svg>
          <span>Vanish mode is on. New messages disappear 10 seconds after they are sent.</span>
        </div>
      )}

      {/* In-Chat Full-Text Search Bar (#sbar) */}
      {showSearch && (
        <div className="sbar2">
          <input
            ref={searchInputRef}
            id="sin"
            type="search"
            placeholder="Search in chat..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentMatchIndex(0);
            }}
            autoFocus
          />
          <span className="scount">
            {searchQuery ? (matchingMessageIds.length ? `${currentMatchIndex + 1} of ${matchingMessageIds.length}` : 'No results') : ''}
          </span>
          <button className="icon" onClick={handlePrevMatch} title="Previous match" style={{ cursor: 'pointer' }}>
            <ChevronUp size={18} />
          </button>
          <button className="icon" onClick={handleNextMatch} title="Next match" style={{ cursor: 'pointer' }}>
            <ChevronDown size={18} />
          </button>
          <button
            className="icon"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            title="Close search"
            style={{ cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Pinned Message Bar (#pinbar) */}
      {pinnedMessage && (
        <div
          className="pinbar"
          onClick={() => jumpToMessage(pinnedMessage.id)}
          style={{ cursor: 'pointer' }}
        >
          <Pin size={14} color="var(--accent)" />
          <div className="pb">
            <b>Pinned message</b>
            <span>{pinnedMessage.body || 'Attachment'}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePinMessage(pinnedMessage);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={14} />
          </button>
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
          const isHighlighted = matchingMessageIds[currentMatchIndex] === msg.id;

          // Ghost countdown seconds
          let remainingSeconds: number | null = null;
          if (msg.expiresAt) {
            remainingSeconds = Math.max(0, Math.ceil((new Date(msg.expiresAt).getTime() - nowTime) / 1000));
          }

          return (
            <div
              key={msg.id}
              ref={(el) => (messageRefs.current[msg.id] = el)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ message: msg, x: e.clientX, y: e.clientY });
              }}
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
                className={msg.expiresAt ? 'vanish-bubble' : ''}
                style={{
                  maxWidth: '78%',
                  padding: '9px 13px',
                  borderRadius: 14,
                  backgroundColor: isMe ? 'var(--accent)' : 'var(--them)',
                  color: isMe ? 'var(--accent-ink)' : 'var(--ink)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: msg.expiresAt ? undefined : isMe ? 'none' : '1px solid var(--them-bd)',
                  position: 'relative',
                  outline: isHighlighted ? '2px solid #f59e0b' : 'none',
                }}
              >
                {/* Quoted Reply Preview */}
                {msg.replyTo && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (msg.replyTo?.id) jumpToMessage(msg.replyTo.id);
                    }}
                    style={{
                      borderLeft: '3px solid var(--gold-hi)',
                      backgroundColor: 'rgba(0,0,0,0.08)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      marginBottom: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <b style={{ display: 'block', fontSize: 11, color: isMe ? '#fff' : 'var(--accent)' }}>
                      {msg.replyTo.sender?.displayName || 'User'}
                    </b>
                    <span style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {msg.replyTo.body}
                    </span>
                  </div>
                )}

                {/* Voice Note Bubble Player */}
                {msg.type === 'voice' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, padding: '4px 0' }}>
                    <button
                      onClick={() => togglePlayVoice(msg)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {playingVoiceId === msg.id ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="vwave">
                        {(msg.mediaMetadata?.wave || [25, 40, 60, 35, 75, 90, 45, 30, 70, 85, 40, 20]).map((h, i) => {
                          const waveCount = (msg.mediaMetadata?.wave || []).length || 12;
                          const activeIdx = Math.floor(voiceProgress * waveCount);
                          const isBarActive = playingVoiceId === msg.id && i <= activeIdx;
                          return (
                            <i
                              key={i}
                              className={isBarActive ? 'on' : ''}
                              style={{ height: `${h}%` }}
                            />
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, opacity: 0.8 }}>
                        <span>{msg.mediaMetadata?.dur ? `${msg.mediaMetadata.dur}s` : 'Voice note'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cyclePlaybackSpeed();
                          }}
                          style={{ fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', color: 'inherit' }}
                        >
                          {playbackSpeed}x
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image or Video preview */}
                {(msg.type === 'image' || msg.type === 'video') && msg.mediaUrl && (
                  <div
                    onClick={() => setLightboxUrl(msg.mediaUrl || null)}
                    style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 6, cursor: 'pointer' }}
                  >
                    {msg.type === 'image' ? (
                      <img src={msg.mediaUrl} alt="Attachment" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />
                    ) : (
                      <video src={msg.mediaUrl} style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} controls />
                    )}
                  </div>
                )}

                {/* Document file attachment */}
                {msg.type === 'file' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 4 }}>
                    <FileText size={24} color="var(--accent)" />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                      <b>{msg.mediaMetadata?.name || 'Document'}</b>
                      <span style={{ display: 'block', fontSize: 11, opacity: 0.7 }}>
                        {msg.mediaMetadata?.size ? `${Math.round(msg.mediaMetadata.size / 1024)} KB` : 'File'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Text Message Content with highlighted search matching */}
                {msg.type !== 'voice' && (
                  <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {searchQuery && msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                      (() => {
                        const parts = msg.body.split(new RegExp(`(${searchQuery})`, 'gi'));
                        return parts.map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark key={i} className={`match ${isHighlighted ? 'cur' : ''}`}>
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        );
                      })()
                    ) : (
                      msg.body
                    )}
                  </div>
                )}

                {/* Time & Delivery Checkmark & Vanish Pill */}
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
                  {msg.isStarred && <Star size={11} fill="#eab308" color="#eab308" />}
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
                  {remainingSeconds !== null && (
                    <span className="vanish-pill">⏱️ {remainingSeconds}s</span>
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
            </div>
          );
        })}

        {/* Aired status pill */}
        {airedStatus && (
          <div className="aired" title="Read with no reply for >2m">
            <Clock size={12} />
            <span>Aired — {airedStatus}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Right-Click / Long-Press Context Menu (#mcx) */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.min(window.innerHeight - 280, Math.max(10, contextMenu.y - 120)),
            left: Math.min(window.innerWidth - 220, Math.max(10, contextMenu.x - 100)),
            zIndex: 100,
            width: 210,
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Reaction Emoji Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(contextMenu.message.id, emoji)}
                style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setReplyingTo(contextMenu.message);
              setContextMenu(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <CornerUpLeft size={15} color="var(--accent)" />
            <span>Reply</span>
          </button>
          <button
            onClick={() => handleCopyText(contextMenu.message.body)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Copy size={15} color="var(--muted)" />
            <span>Copy text</span>
          </button>
          <button
            onClick={() => handleStarMessage(contextMenu.message)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Star size={15} color={contextMenu.message.isStarred ? '#eab308' : 'var(--muted)'} />
            <span>{contextMenu.message.isStarred ? 'Unstar' : 'Star message'}</span>
          </button>
          <button
            onClick={() => handlePinMessage(contextMenu.message)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Pin size={15} color="var(--muted)" />
            <span>{pinnedMessageId === contextMenu.message.id ? 'Unpin message' : 'Pin message'}</span>
          </button>
          <div style={{ height: 1, backgroundColor: 'var(--line)', margin: '4px 0' }} />
          <button
            onClick={() => handleDeleteMessage(contextMenu.message)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, fontSize: 13, color: 'var(--vanish)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Quote Reply Banner above composer */}
      {replyingTo && (
        <div style={{ padding: '0 14px' }}>
          <div className="cbar">
            <div className="cb2">
              <b>{replyingTo.sender?.displayName || 'User'}</b>
              <span>{replyingTo.body || 'Attachment'}</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Composer Panel: Emoji, GIFs, Stickers */}
      {showEmojiPanel && (
        <div className="panel" style={{ position: 'relative', height: 260 }}>
          <div className="ptabs">
            <button
              type="button"
              aria-selected={activePanelTab === 'emoji'}
              onClick={() => setActivePanelTab('emoji')}
            >
              Emoji
            </button>
            <button
              type="button"
              aria-selected={activePanelTab === 'gif'}
              onClick={() => setActivePanelTab('gif')}
            >
              GIFs
            </button>
            <button
              type="button"
              aria-selected={activePanelTab === 'sticker'}
              onClick={() => setActivePanelTab('sticker')}
            >
              Stickers
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {activePanelTab === 'emoji' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.name}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                      {cat.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 2 }}>
                      {cat.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setInputValue((prev) => prev + emoji)}
                          style={{ height: 36, fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanelTab === 'gif' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {STANDALONE_GIFS.map((g) => (
                  <button
                    key={g.c}
                    onClick={() => {
                      setInputValue((prev) => `${prev} [GIF: ${g.c}]`);
                      setShowEmojiPanel(false);
                    }}
                    style={{
                      height: 70,
                      borderRadius: 12,
                      backgroundColor: g.bg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{g.e}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{g.c}</span>
                  </button>
                ))}
              </div>
            )}

            {activePanelTab === 'sticker' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {STANDALONE_STICKERS.map((stk, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputValue((prev) => `${prev} ${stk}`);
                      setShowEmojiPanel(false);
                    }}
                    style={{ height: 50, fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
                  >
                    {stk}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachment Popover (.amenu: Media, Doc, GIF, Game, Sticker) */}
      {showAttachMenu && (
        <div className="amenu">
          <button
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="ai2" style={{ backgroundColor: '#7A5CFF' }}>
              <ImageIcon size={16} />
            </div>
            <span>Photos & Videos</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="ai2" style={{ backgroundColor: '#E8772E' }}>
              <FileText size={16} />
            </div>
            <span>Document</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setShowEmojiPanel(true);
              setActivePanelTab('gif');
            }}
          >
            <div className="ai2" style={{ backgroundColor: '#E5336A' }}>
              <Film size={16} />
            </div>
            <span>GIFs</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              onLaunchGame('tictactoe', conversation.id);
            }}
          >
            <div className="ai2" style={{ backgroundColor: '#0E8A8F' }}>
              <Gamepad2 size={16} />
            </div>
            <span>Play Duel</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setShowEmojiPanel(true);
              setActivePanelTab('sticker');
            }}
          >
            <div className="ai2" style={{ backgroundColor: '#2FA36B' }}>
              <Smile size={16} />
            </div>
            <span>Sticker</span>
          </button>
        </div>
      )}

      {/* Composer Bottom Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderTop: '1px solid var(--line)',
          backgroundColor: 'var(--panel)',
          position: 'relative',
        }}
      >
        {isRecording ? (
          /* Live Voice Recording Bar */
          <div className="rec">
            <button
              onClick={cancelRecording}
              style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Cancel recording"
            >
              <X size={18} />
            </button>
            <i className="rdot" />
            <span className="rtimer">
              {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <div className="rwave">
              {liveWaveform.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <button
              onClick={finishRecording}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Send voice message"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          /* Normal Message Input Controls */
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachMenu((prev) => !prev);
              }}
              style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Attach media or files"
            >
              <Paperclip size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPanel((prev) => !prev)}
              style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: showEmojiPanel ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              title="Emoji, GIFs & stickers"
            >
              <Smile size={18} />
            </button>

            <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex' }}>
              <input
                type="text"
                placeholder={activeRoomId ? `Message in #${conversation.rooms?.find((r) => r.id === activeRoomId)?.name || 'room'}...` : 'Message...'}
                value={inputValue}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: 20,
                  backgroundColor: 'var(--hover)',
                  color: 'var(--ink)',
                  fontSize: 14,
                  border: 'none',
                  outline: 'none',
                }}
              />
            </form>

            {inputValue.trim() ? (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                title="Send"
              >
                <Send size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--hover)',
                  color: 'var(--accent)',
                  display: 'grid',
                  placeItems: 'center',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Record voice message"
              >
                <Mic size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Lightbox Modal (#lb) */}
      {lightboxUrl && (
        <div className="lb" onClick={() => setLightboxUrl(null)}>
          <div className="lbt">
            <span>Attachment Preview</span>
            <button className="icon" onClick={() => setLightboxUrl(null)}>
              <X size={20} color="#fff" />
            </button>
          </div>
          <div className="lbc">
            <img src={lightboxUrl} alt="Preview" />
          </div>
        </div>
      )}

      {/* Starred Messages Modal */}
      {showStarredModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowStarredModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--panel)',
              borderRadius: 16,
              padding: 20,
              boxShadow: 'var(--shadow)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Starred Messages</h3>
              <button onClick={() => setShowStarredModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {starredMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: 13 }}>
                  No starred messages in this conversation.
                </div>
              ) : (
                starredMessages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setShowStarredModal(false);
                      jumpToMessage(m.id);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      backgroundColor: 'var(--hover)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
                      <span>{m.sender?.displayName || 'User'}</span>
                      <span style={{ color: 'var(--muted)' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{m.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4-Tab Shared Media Gallery Modal (#media) */}
      {showMediaGallery && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowMediaGallery(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: 'var(--panel)',
              borderRadius: 16,
              padding: 20,
              boxShadow: 'var(--shadow)',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Media, Links & Files</h3>
              <button onClick={() => setShowMediaGallery(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', gap: 8 }}>
              {(['photos', 'docs', 'links', 'voice'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMediaTab(tab)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: mediaTab === tab ? 'var(--accent)' : 'var(--muted)',
                    borderBottom: mediaTab === tab ? '2px solid var(--accent)' : 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {tab === 'photos' ? 'Photos & Videos' : tab === 'docs' ? 'Docs' : tab === 'links' ? 'Links' : 'Voice'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mediaTab === 'photos' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {galleryItems
                    .filter((it) => it.type === 'image' || it.type === 'video' || it.type === 'gif')
                    .map((it) => (
                      <div
                        key={it.id}
                        onClick={() => {
                          setLightboxUrl(it.mediaUrl || it.mediaMetadata?.url);
                        }}
                        style={{ height: 110, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', backgroundColor: '#000' }}
                      >
                        <img src={it.mediaUrl || it.mediaMetadata?.url} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                </div>
              )}

              {mediaTab === 'docs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {galleryItems
                    .filter((it) => it.type === 'file')
                    .map((it) => (
                      <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--hover)' }}>
                        <FileText size={22} color="var(--accent)" />
                        <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                          <b>{it.mediaMetadata?.name || it.body}</b>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(it.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {mediaTab === 'links' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {galleryItems
                    .filter((it) => it.body.match(/https?:\/\/[^\s]+/))
                    .map((it) => {
                      const url = it.body.match(/https?:\/\/[^\s]+/)?.[0];
                      return (
                        <a
                          key={it.id}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--hover)', textDecoration: 'none', color: 'inherit' }}
                        >
                          <LinkIcon size={18} color="var(--accent)" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ display: 'block', fontSize: 13, color: 'var(--ink)' }}>{url}</b>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(it.createdAt).toLocaleDateString()}</span>
                          </div>
                        </a>
                      );
                    })}
                </div>
              )}

              {mediaTab === 'voice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {galleryItems
                    .filter((it) => it.type === 'voice')
                    .map((it) => (
                      <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--hover)' }}>
                        <Volume2 size={20} color="var(--accent)" />
                        <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                          <b>Voice note ({it.mediaMetadata?.dur ? `${it.mediaMetadata.dur}s` : 'audio'})</b>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                            {new Date(it.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
