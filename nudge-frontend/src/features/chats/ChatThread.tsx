import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Room, GM, GORDER, normalizeGameKey } from '@nudge/shared';
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
  Lock,
  Sliders,
  Palette,
  UserPlus,
  Users,
  Shield,
  Edit3,
  Check,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import { StatusChip } from '../../components/StatusChip.js';

const REMO = ['💬', '📚', '🎉', '📸', '💰', '🎮', '🍔', '⚽', '🎵', '💻', '🚗', '🙏'];

const ACC_PRESETS = [
  '#0F6B58', // Spruce Green
  '#3B4CF2', // Classic Blue
  '#E63946', // Crimson
  '#F77F00', // Amber
  '#7209B7', // Purple
  '#3A86FF', // Sky
  '#06D6A0', // Teal
  '#1B1B1F', // Midnight
];

const WP_SOLIDS = ['#f5f5f7', '#1c1917', '#0f172a'];
const WP_GRADS = [
  'linear-gradient(160deg, #667eea, #764ba2)',
  'linear-gradient(160deg, #f093fb, #f5576c)',
  'linear-gradient(160deg, #4facfe, #00f2fe)',
];
const WP_PATS = [
  { id: 'dots', name: 'Dots', css: 'radial-gradient(circle, var(--line) 1px, transparent 1px) 0 0/16px 16px' },
  { id: 'grid', name: 'Grid', css: 'linear-gradient(to right, var(--line) 1px, transparent 1px) 0 0/20px 20px, linear-gradient(to bottom, var(--line) 1px, transparent 1px) 0 0/20px 20px' },
  { id: 'diamonds', name: 'Diamonds', css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, var(--hover) 10px, var(--hover) 20px)' },
];
const SOUND_PRESETS = ['chime', 'bell', 'pop', 'marimba', 'drop', 'silent'];

function untilShort(ms: number) {
  const d = ms - Date.now();
  if (d <= 0) return 'Ended';
  if (d < 60000) return '<1m';
  if (d < 3600000) return Math.ceil(d / 60000) + 'm';
  if (d < 48 * 3600000) return Math.ceil(d / 3600000) + 'h';
  return Math.ceil(d / 86400000) + 'd';
}

function untilLong(ms: number) {
  const d = ms - Date.now();
  if (d <= 0) return 'ended';
  if (d < 60000) return 'less than a minute';
  const hours = Math.ceil(d / 3600000);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const days = Math.ceil(d / 86400000);
  return `${days} day${days > 1 ? 's' : ''}`;
}

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

  // Batch 2: Group Rooms, Admin Permissions, Temp Groups & Customization
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [showRoomEditModal, setShowRoomEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showCustSheet, setShowCustSheet] = useState(false);

  // Drafts & unreads per room
  const [roomDrafts, setRoomDrafts] = useState<Record<string, string>>({});
  const [roomUnreads, setRoomUnreads] = useState<Record<string, number>>({});

  // Appearance / Custom Theme Look
  const [customLook, setCustomLook] = useState<{
    accent?: string;
    wallpaper?: { type: string; value: string };
    tone?: string;
    dim?: number;
    isShared?: boolean;
  }>({
    accent: conversation.customTheme?.accent || '',
    wallpaper: conversation.customTheme?.wallpaper || { type: 'none', value: '' },
    tone: conversation.customTheme?.tone || 'chime',
    dim: conversation.customTheme?.dim || 0,
    isShared: Boolean(conversation.customTheme?.isShared),
  });

  // Group Details & Permissions state
  const [groupTitleEdit, setGroupTitleEdit] = useState(conversation.title || '');
  const [groupPerms, setGroupPerms] = useState<{ info?: boolean; send?: boolean; add?: boolean }>(
    conversation.permissions || { info: false, send: false, add: false }
  );
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [selectedAddMemberIds, setSelectedAddMemberIds] = useState<Set<string>>(new Set());

  // Room Edit Form State
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomEmoji, setEditRoomEmoji] = useState('💬');
  const [editRoomAdminOnly, setEditRoomAdminOnly] = useState(false);

  // Temporary Group Expiration State
  const [expiryOption, setExpiryOption] = useState<'none' | '1h' | '24h' | '7d' | '30d' | 'custom'>('none');
  const [expiryCustomDate, setExpiryCustomDate] = useState('');
  const [showGamePickerModal, setShowGamePickerModal] = useState(false);
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
          setRoomUnreads((prev) => ({
            ...prev,
            [data.roomId!]: (prev[data.roomId!] || 0) + 1,
          }));
          playTone(customLook.tone || 'chime');
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

  // Batch 2: Helper Functions & Permission Checks
  const currentMember = conversation.members?.find((m) => m.userId === user?.id || (m as any).id === user?.id);
  const isOwner = currentMember?.role === 'owner';
  const isAdmin = isOwner || currentMember?.role === 'admin';
  const canAdd = isAdmin || !groupPerms.add;
  const canEditInfo = isAdmin || !groupPerms.info;

  const getRoomLock = () => {
    if (conversation.archivedAt || conversation.isArchived) {
      return 'This group has ended and is archived. Messages are kept.';
    }
    if (conversation.type === 'group' && groupPerms.send && !isAdmin) {
      return 'Only admins can send messages in this group.';
    }
    const curR = conversation.rooms?.find((r) => r.id === (activeRoomId || 'general'));
    if (curR) {
      if (curR.archived) {
        return 'This room is archived and read-only.';
      }
      if (curR.adminOnly && !isAdmin) {
        return `Only admins can post in #${curR.name}.`;
      }
    }
    return '';
  };
  const lockMessage = getRoomLock();

  const handleSwitchRoom = (roomId: string) => {
    if (activeRoomId === roomId) return;
    if (activeRoomId) {
      setRoomDrafts((prev) => ({ ...prev, [activeRoomId]: inputValue }));
    }
    setActiveRoomId(roomId);
    setInputValue(roomDrafts[roomId] || '');
    setRoomUnreads((prev) => ({ ...prev, [roomId]: 0 }));
    api.getMessages(conversation.id, roomId).then((res: any) => {
      setMessages(res.messages || []);
      scrollToBottom();
    });
  };

  const handleSaveRoom = async () => {
    if (!editRoomName.trim()) return;
    const cleanName = editRoomName.trim().replace(/^#/, '');
    try {
      if (editingRoom) {
        const res = await api.updateRoom(conversation.id, editingRoom.id, {
          name: cleanName,
          emoji: editRoomEmoji,
          adminOnly: editRoomAdminOnly,
        });
        if (res.room) {
          conversation.rooms = (conversation.rooms || []).map((r) =>
            r.id === res.room.id ? res.room : r
          );
        }
      } else {
        const res = await api.addRoom(conversation.id, {
          name: cleanName,
          emoji: editRoomEmoji,
          adminOnly: editRoomAdminOnly,
        });
        if (res.room) {
          conversation.rooms = [...(conversation.rooms || []), res.room];
          setActiveRoomId(res.room.id);
        }
      }
      setShowRoomEditModal(false);
      setEditingRoom(null);
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to save room:', err);
    }
  };

  const handleArchiveRoom = async (room: Room) => {
    try {
      await api.updateRoom(conversation.id, room.id, { archived: !room.archived });
      conversation.rooms = (conversation.rooms || []).map((r) =>
        r.id === room.id ? { ...r, archived: !r.archived } : r
      );
      if (activeRoomId === room.id) {
        const openRooms = (conversation.rooms || []).filter((r) => !r.archived);
        if (openRooms.length > 0) setActiveRoomId(openRooms[0].id);
      }
      setShowRoomEditModal(false);
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to archive room:', err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Delete this room and its messages permanently?')) return;
    try {
      await api.deleteRoom(conversation.id, roomId);
      conversation.rooms = (conversation.rooms || []).filter((r) => r.id !== roomId);
      if (activeRoomId === roomId) {
        const fallback = conversation.rooms[0]?.id;
        setActiveRoomId(fallback);
      }
      setShowRoomEditModal(false);
      setShowRoomsModal(false);
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  };

  const handleMoveRoom = (roomId: string, dir: 'up' | 'down') => {
    if (!conversation.rooms) return;
    const idx = conversation.rooms.findIndex((r) => r.id === roomId);
    if (idx < 0) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= conversation.rooms.length) return;
    const next = [...conversation.rooms];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    conversation.rooms = next;
    onUpdateConversation?.();
  };

  const handleSaveGroupTitle = async () => {
    if (!groupTitleEdit.trim() || groupTitleEdit === conversation.title) return;
    try {
      await api.updateGroup(conversation.id, { title: groupTitleEdit.trim() });
      conversation.title = groupTitleEdit.trim();
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to rename group:', err);
    }
  };

  const handleTogglePerm = async (key: 'info' | 'send' | 'add') => {
    if (!isAdmin) return;
    const nextPerms = { ...groupPerms, [key]: !groupPerms[key] };
    setGroupPerms(nextPerms);
    try {
      await api.updateGroupPermissions(conversation.id, nextPerms);
      conversation.permissions = nextPerms;
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to update group permissions:', err);
    }
  };

  const handlePromoteDemote = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await api.updateMemberRole(conversation.id, targetUserId, newRole);
      if (conversation.members) {
        conversation.members = conversation.members.map((m) =>
          m.userId === targetUserId ? { ...m, role: newRole as any } : m
        );
      }
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to change member role:', err);
    }
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!window.confirm(`Remove ${name}? They will no longer see new messages in this group.`)) return;
    try {
      await api.removeMember(conversation.id, targetUserId);
      if (conversation.members) {
        conversation.members = conversation.members.filter((m) => m.userId !== targetUserId);
      }
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const openAddMembersModal = async () => {
    try {
      const res = await api.searchUsers('');
      const existingMemberIds = new Set(conversation.members?.map((m) => m.userId) || []);
      const candidates = res.users.filter((u) => !existingMemberIds.has(u.id));
      setAvailableContacts(candidates);
      setSelectedAddMemberIds(new Set());
      setShowAddMemberModal(true);
    } catch (err) {
      console.error('Failed to load contacts to add:', err);
    }
  };

  const handleAddSelectedMembers = async () => {
    if (selectedAddMemberIds.size === 0) return;
    try {
      for (const uid of Array.from(selectedAddMemberIds)) {
        await api.addMember(conversation.id, uid, 'member');
      }
      setShowAddMemberModal(false);
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to add members:', err);
    }
  };

  const handleSaveExpiry = async () => {
    let endsAt: string | null = null;
    const now = Date.now();
    if (expiryOption === '1h') endsAt = new Date(now + 3600000).toISOString();
    else if (expiryOption === '24h') endsAt = new Date(now + 24 * 3600000).toISOString();
    else if (expiryOption === '7d') endsAt = new Date(now + 7 * 24 * 3600000).toISOString();
    else if (expiryOption === '30d') endsAt = new Date(now + 30 * 24 * 3600000).toISOString();
    else if (expiryOption === 'custom' && expiryCustomDate) endsAt = new Date(expiryCustomDate).toISOString();

    try {
      await api.updateExpiration(conversation.id, endsAt);
      conversation.endsAt = endsAt || undefined;
      conversation.archivedAt = undefined;
      conversation.isArchived = false;
      setShowExpiryModal(false);
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to update expiration:', err);
    }
  };

  const handleArchiveGroupNow = async () => {
    try {
      await api.archiveConversation(conversation.id);
      conversation.archivedAt = new Date().toISOString();
      conversation.isArchived = true;
      setShowExpiryModal(false);
      onUpdateConversation?.();
    } catch (err) {
      console.error('Failed to archive group:', err);
    }
  };

  const handleUpdateLook = async (partial: Partial<typeof customLook>) => {
    const nextLook = { ...customLook, ...partial };
    setCustomLook(nextLook);
    try {
      await api.updateChatTheme(conversation.id, {
        customTheme: nextLook,
        isShared: nextLook.isShared,
      });
      conversation.customTheme = nextLook;
    } catch (err) {
      console.error('Failed to update theme:', err);
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

          <div
            onClick={() => {
              if (conversation.type === 'group') setShowGroupModal(true);
            }}
            style={{
              cursor: conversation.type === 'group' ? 'pointer' : 'default',
            }}
          >
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
                  {conversation.members?.length || 0} members · tap for info
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

        {/* Action icons: In-Chat Search, Vanish Mode, Calls, Games, Customize, More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Palette button for Customize Chat Look */}
          <button
            onClick={() => setShowCustSheet(true)}
            style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Customize chat appearance"
          >
            <Palette size={18} />
          </button>

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
            onClick={() => setShowGamePickerModal(true)}
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
                  onClick={() => {
                    setShowHMore(false);
                    setShowCustSheet(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Palette size={15} color="var(--accent)" />
                  <span>Customize chat</span>
                </button>
                {conversation.type === 'group' && (
                  <>
                    <button
                      onClick={() => {
                        setShowHMore(false);
                        setShowGroupModal(true);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Users size={15} color="var(--accent)" />
                      <span>Group settings & members</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHMore(false);
                        setShowRoomsModal(true);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Sliders size={15} color="var(--accent)" />
                      <span>Manage rooms</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowHMore(false);
                        setShowExpiryModal(true);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, color: 'var(--ink)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Clock size={15} color="var(--muted)" />
                      <span>Group expiration</span>
                    </button>
                  </>
                )}
                <div style={{ height: 1, backgroundColor: 'var(--line)', margin: '4px 0' }} />
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

      {/* Temporary Group Header Banner (#tmpbar) */}
      {conversation.type === 'group' && (conversation.endsAt || conversation.archivedAt) && (
        <div
          className={`tmpbar${conversation.archivedAt ? ' ar' : conversation.endsAt && new Date(conversation.endsAt).getTime() - nowTime < 86400000 ? ' warn' : ''}`}
        >
          <Clock size={15} />
          <span>
            {conversation.archivedAt
              ? `Archived · ended ${new Date(conversation.archivedAt).toLocaleDateString()}. Messages are kept.`
              : `Temporary group · ends in ${untilLong(new Date(conversation.endsAt!).getTime())}`}
          </span>
          {isAdmin && (
            <button
              type="button"
              className="plink"
              onClick={() => setShowExpiryModal(true)}
            >
              {conversation.archivedAt ? 'Reopen' : 'Change'}
            </button>
          )}
        </div>
      )}

      {/* Sub-Rooms Horizontal Pill Bar (#roomsbar) */}
      {conversation.type === 'group' && conversation.rooms && conversation.rooms.length > 0 && (
        <div className="rooms" id="roomsbar">
          <div className="rmrow" role="tablist">
            {conversation.rooms
              .filter((r) => !r.archived || r.id === activeRoomId)
              .map((r) => {
                const isSelected = r.id === (activeRoomId || 'general');
                const unreadCount = roomUnreads[r.id] || 0;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="rmc"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleSwitchRoom(r.id)}
                  >
                    <span>{r.archived ? '🗄️' : r.emoji || '💬'}</span>
                    <span>#{r.name}</span>
                    {r.adminOnly && <Lock size={11} />}
                    {unreadCount > 0 && !isSelected && (
                      <i className="rb">{unreadCount}</i>
                    )}
                  </button>
                );
              })}
            {isAdmin && conversation.rooms.length < 12 && (
              <button
                type="button"
                className="rmc add"
                onClick={() => {
                  setEditingRoom(null);
                  setEditRoomName('');
                  setEditRoomEmoji('💬');
                  setEditRoomAdminOnly(false);
                  setShowRoomEditModal(true);
                }}
                title="Create a room"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="rmmg"
            onClick={() => setShowRoomsModal(true)}
            title={isAdmin ? 'Manage rooms' : 'All rooms'}
          >
            <Sliders size={18} />
          </button>
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

                {/* In-Chat Duel Card (.gcard & .gbtn) */}
                {(msg.type === 'game' || msg.mediaMetadata?.game) && (() => {
                  const m = msg.mediaMetadata?.game || (msg as any).game;
                  const gid = normalizeGameKey(m?.gid || 'ttt');
                  const g = GM[gid] || { n: 'Game', e: '🎮', d: '' };
                  const isSender = (msg.senderId || (msg as any).sender_id) === user?.id;
                  const isGrp = conversation.type === 'group';
                  const oppDisplayName = isGrp ? 'everyone' : (conversation.title || 'Friend');

                  let statusText = 'Game match';
                  if (m?.st === 'invite') {
                    statusText = isSender ? (isGrp ? 'Waiting for players' : `Waiting for ${oppDisplayName}`) : (isGrp ? 'Group challenge' : `${oppDisplayName} challenged you`);
                  } else if (m?.st === 'declined') {
                    statusText = 'Declined';
                  } else if (m?.st === 'cancelled') {
                    statusText = 'Cancelled';
                  } else if (m?.st === 'done') {
                    statusText = m.res === 'win' ? 'You won' : m.res === 'loss' ? `${oppDisplayName} won` : 'Draw';
                  } else if (m?.st === 'playing') {
                    statusText = m.turn === 'me' ? 'Your turn' : `${oppDisplayName} is thinking…`;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 210 }}>
                      <div className="gcard">
                        <span className="gic" style={{ fontSize: 22 }}>{g.e}</span>
                        <span className="gtx">
                          <b style={{ color: isMe ? '#fff' : 'var(--ink)' }}>{g.n}</b>
                          <small style={{ color: isMe ? 'rgba(255,255,255,0.75)' : 'var(--muted)' }}>{statusText}</small>
                        </span>
                      </div>
                      <div className="gbtn">
                        {m?.st === 'invite' && (
                          isSender ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.respondGameInvite(msg.id, 'cancel');
                                } catch (err) {
                                  console.error('Cancel game invite error:', err);
                                }
                              }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="pri"
                                onClick={async () => {
                                  try {
                                    await api.respondGameInvite(msg.id, 'accept');
                                    onLaunchGame(gid, conversation.id);
                                  } catch (err) {
                                    console.error('Accept game invite error:', err);
                                  }
                                }}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await api.respondGameInvite(msg.id, 'decline');
                                  } catch (err) {
                                    console.error('Decline game invite error:', err);
                                  }
                                }}
                              >
                                Decline
                              </button>
                            </>
                          )
                        )}
                        {m?.st === 'playing' && (
                          <button
                            type="button"
                            className="pri"
                            onClick={() => onLaunchGame(gid, conversation.id)}
                          >
                            {m.turn === 'me' ? 'Play' : 'Open'}
                          </button>
                        )}
                        {m?.st === 'done' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onLaunchGame(gid, conversation.id)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="pri"
                              onClick={async () => {
                                try {
                                  await api.sendGameInvite(conversation.id, gid);
                                  playTone('pop');
                                } catch (err) {
                                  console.error('Rematch error:', err);
                                }
                              }}
                            >
                              Rematch
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Text Message Content with highlighted search matching */}
                {msg.type !== 'voice' && msg.type !== 'game' && !msg.mediaMetadata?.game && (
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
              setShowGamePickerModal(true);
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

      {/* Composer Bottom Bar or Room Lock Banner */}
      {lockMessage ? (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--hover)',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Lock size={15} color="var(--muted)" />
          <span>{lockMessage}</span>
        </div>
      ) : (
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
      )}

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

      {/* ===== BATCH 2: CHAT CUSTOMIZATION SHEET ===== */}
      {showCustSheet && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            backgroundColor: 'var(--panel)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 520,
            margin: '0 auto',
            boxShadow: 'var(--shadow)',
          }}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
            <button
              onClick={() => setShowCustSheet(false)}
              style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Customize chat</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {/* Live Chat Bubble Preview Box (#cpv) */}
            <div
              className="cpv"
              style={{
                backgroundColor: customLook.wallpaper?.type === 'solid' ? customLook.wallpaper.value : 'var(--wall)',
                backgroundImage: customLook.wallpaper?.type === 'grad'
                  ? customLook.wallpaper.value
                  : customLook.wallpaper?.type === 'pat'
                  ? customLook.wallpaper.value
                  : customLook.wallpaper?.type === 'img'
                  ? `url(${customLook.wallpaper.value})`
                  : undefined,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!!customLook.dim && customLook.dim > 0 && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${customLook.dim / 100})`, pointerEvents: 'none' }} />
              )}
              <div className="cb them" style={{ position: 'relative', zIndex: 2 }}>
                <span>Are you coming tonight?</span>
              </div>
              <div
                className="cb me"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  backgroundColor: customLook.accent || 'var(--accent)',
                  color: '#fff',
                }}
              >
                <span>Yes, see you at 8 ✨</span>
              </div>
              <div className="cb them" style={{ position: 'relative', zIndex: 2 }}>
                <span>Perfect 🙌</span>
              </div>
            </div>

            {/* Accent Color Section */}
            <div className="cs">
              <h3>Accent color</h3>
              <p className="note2">Sets the primary accent for buttons and your outgoing messages.</p>
              <div className="swr">
                {ACC_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className="swt"
                    aria-pressed={customLook.accent === hex}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleUpdateLook({ accent: hex })}
                  />
                ))}
                <label className="swt cust" title="Custom color">
                  <input
                    type="color"
                    value={customLook.accent || '#0F6B58'}
                    onChange={(e) => handleUpdateLook({ accent: e.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Wallpaper Section */}
            <div className="cs">
              <h3>Wallpaper</h3>
              <p className="note2">Choose a solid color, vibrant gradient, or subtle pattern.</p>
              <div className="wpg">
                <button
                  type="button"
                  className="wpt"
                  aria-pressed={customLook.wallpaper?.type === 'none'}
                  onClick={() => handleUpdateLook({ wallpaper: { type: 'none', value: '' } })}
                >
                  <span>Default</span>
                </button>
                {WP_SOLIDS.map((solid) => (
                  <button
                    key={solid}
                    type="button"
                    className="wpt"
                    aria-pressed={customLook.wallpaper?.type === 'solid' && customLook.wallpaper.value === solid}
                    style={{ backgroundColor: solid }}
                    onClick={() => handleUpdateLook({ wallpaper: { type: 'solid', value: solid } })}
                  />
                ))}
                {WP_GRADS.map((grad, i) => (
                  <button
                    key={i}
                    type="button"
                    className="wpt"
                    aria-pressed={customLook.wallpaper?.type === 'grad' && customLook.wallpaper.value === grad}
                    style={{ background: grad }}
                    onClick={() => handleUpdateLook({ wallpaper: { type: 'grad', value: grad } })}
                  />
                ))}
                {WP_PATS.map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    className="wpt"
                    aria-pressed={customLook.wallpaper?.type === 'pat' && customLook.wallpaper.value === pat.css}
                    style={{ background: pat.css }}
                    onClick={() => handleUpdateLook({ wallpaper: { type: 'pat', value: pat.css } })}
                  >
                    <span>{pat.name}</span>
                  </button>
                ))}
              </div>

              {/* Dim Slider */}
              <label className="slr">
                <span>Dim wallpaper: <b>{customLook.dim || 0}%</b></span>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={customLook.dim || 0}
                  onChange={(e) => handleUpdateLook({ dim: parseInt(e.target.value, 10) })}
                />
              </label>
            </div>

            {/* Notification Sounds Section */}
            <div className="cs">
              <h3>Notification Sound</h3>
              <p className="note2">Native WebAudio tone synthesizers. Tap to test tone.</p>
              <div className="optr">
                {SOUND_PRESETS.map((snd) => (
                  <button
                    key={snd}
                    type="button"
                    aria-pressed={customLook.tone === snd}
                    onClick={() => {
                      playTone(snd);
                      handleUpdateLook({ tone: snd });
                    }}
                  >
                    <Volume2 size={13} />
                    <span>{snd.charAt(0).toUpperCase() + snd.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Group Theme Sharing */}
            {conversation.type === 'group' && (
              <div className="cs">
                <h3>Group theme {isAdmin && <span className="admb">Admin</span>}</h3>
                {isAdmin ? (
                  <>
                    <p className="note2">As an admin you can share your current look with everyone in this group.</p>
                    <div className="optr">
                      <button
                        type="button"
                        onClick={() => handleUpdateLook({ isShared: !customLook.isShared })}
                        style={{ backgroundColor: customLook.isShared ? 'var(--accent)' : 'var(--panel)', color: customLook.isShared ? '#fff' : 'var(--ink)' }}
                      >
                        {customLook.isShared ? 'Group theme is active (tap to turn off)' : 'Use my look for the group'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="note2">Only group admins can set a shared group theme.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== BATCH 2: GROUP ADMINISTRATION MODAL ===== */}
      {showGroupModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            backgroundColor: 'rgba(0,0,0,0.65)',
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
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              padding: '18px 20px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Group Settings</h2>
              <button
                onClick={() => setShowGroupModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Group Name Field */}
            {canEditInfo ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                  Group name
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={groupTitleEdit}
                    onChange={(e) => setGroupTitleEdit(e.target.value)}
                    onBlur={handleSaveGroupTitle}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: 'var(--hover)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveGroupTitle}
                    style={{ padding: '0 12px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <b style={{ fontSize: 16, color: 'var(--ink)' }}>{conversation.title}</b>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
                {conversation.members?.length || 0} members {isAdmin ? '' : '· Only admins manage members'}
              </span>
              {canAdd && (
                <button
                  type="button"
                  onClick={openAddMembersModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    backgroundColor: 'var(--hover)',
                    border: '1px solid var(--line)',
                    color: 'var(--accent)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <UserPlus size={13} />
                  <span>Add members</span>
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="gml">
              {conversation.members?.map((m) => {
                const isTargetAdmin = m.role === 'admin' || m.role === 'owner';
                const isMe = m.userId === user?.id;
                const displayName = (m as any).displayName || (m as any).user?.displayName || (m as any).username || 'Member';
                return (
                  <div key={m.userId} className="gmr">
                    <Avatar name={displayName} url={(m as any).avatarUrl} size={32} />
                    <div className="gmn">
                      <b>{displayName} {isMe ? '(You)' : ''}</b>
                      {isTargetAdmin && <small>Admin</small>}
                    </div>
                    {isAdmin && !isMe && (
                      <div className="gma">
                        <button
                          type="button"
                          className="gms"
                          onClick={() => handlePromoteDemote(m.userId, m.role)}
                        >
                          {isTargetAdmin ? 'Remove admin' : 'Make admin'}
                        </button>
                        <button
                          type="button"
                          className="gms dng2"
                          onClick={() => handleRemoveMember(m.userId, displayName)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Permissions Section (3 Toggles) */}
            <h3 className="gh3">Group Permissions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <label className="strw">
                <span className="stx">
                  <b>Only admins edit group info</b>
                  <small>Group name, avatar and shared look</small>
                </span>
                <input
                  type="checkbox"
                  className="stsw"
                  checked={Boolean(groupPerms.info)}
                  disabled={!isAdmin}
                  onChange={() => handleTogglePerm('info')}
                />
              </label>

              <label className="strw">
                <span className="stx">
                  <b>Only admins can send messages</b>
                  <small>All other members can read only</small>
                </span>
                <input
                  type="checkbox"
                  className="stsw"
                  checked={Boolean(groupPerms.send)}
                  disabled={!isAdmin}
                  onChange={() => handleTogglePerm('send')}
                />
              </label>

              <label className="strw">
                <span className="stx">
                  <b>Only admins can add members</b>
                  <small>Members cannot invite friends</small>
                </span>
                <input
                  type="checkbox"
                  className="stsw"
                  checked={Boolean(groupPerms.add)}
                  disabled={!isAdmin}
                  onChange={() => handleTogglePerm('add')}
                />
              </label>
            </div>
            {!isAdmin && (
              <p className="note2">You are not an admin, so permissions are read-only.</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                style={{ padding: '8px 18px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BATCH 2: ADD MEMBER MODAL ===== */}
      {showAddMemberModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              padding: '18px 20px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Add Members</h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {availableContacts.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                All your contacts are already in this group.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', margin: '10px 0 16px' }}>
                {availableContacts.map((c) => {
                  const isSelected = selectedAddMemberIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedAddMemberIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return next;
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'var(--hover)' : 'var(--side)',
                        border: '1px solid var(--line)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={c.displayName || c.username} url={c.avatarUrl} size={34} />
                        <div>
                          <b style={{ display: 'block', fontSize: 13, color: 'var(--ink)' }}>{c.displayName}</b>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>@{c.username}</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                style={{ padding: '7px 14px', borderRadius: 8, background: 'none', border: '1px solid var(--line)', color: 'var(--ink)', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSelectedMembers}
                disabled={selectedAddMemberIds.size === 0}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: selectedAddMemberIds.size === 0 ? 0.45 : 1,
                }}
              >
                Add {selectedAddMemberIds.size > 0 ? `(${selectedAddMemberIds.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BATCH 2: ROOMS MANAGEMENT MODAL ===== */}
      {showRoomsModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: 'var(--panel)',
              borderRadius: 16,
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              padding: '18px 20px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Rooms in {conversation.title}</h2>
              <button
                onClick={() => setShowRoomsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <p className="note2">
              Rooms keep topics apart inside one group. Everyone stays in the same group.
              {isAdmin ? '' : ' Only admins can create or edit rooms.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0 16px', maxHeight: '50vh', overflowY: 'auto' }}>
              {(conversation.rooms || []).map((r, i) => {
                const unread = roomUnreads[r.id] || 0;
                return (
                  <div key={r.id} className="rmr">
                    <span className="rme2">{r.archived ? '🗄️' : r.emoji || '💬'}</span>
                    <span className="rmn">
                      <b>#{r.name}</b>
                      <small>
                        {r.id === 'general' ? 'Pinned · ' : ''}
                        {r.adminOnly ? 'Only admins can post' : 'Everyone can post'}
                        {unread > 0 ? ` · ${unread} unread` : ''}
                      </small>
                    </span>
                    {isAdmin && !r.archived && r.id !== 'general' && (
                      <>
                        <button
                          type="button"
                          className="icon"
                          disabled={i <= 1}
                          onClick={() => handleMoveRoom(r.id, 'up')}
                          style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: i <= 1 ? 0.3 : 1 }}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon"
                          disabled={i >= (conversation.rooms?.length || 1) - 1}
                          onClick={() => handleMoveRoom(r.id, 'down')}
                          style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: i >= (conversation.rooms?.length || 1) - 1 ? 0.3 : 1 }}
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          className="outb"
                          onClick={() => {
                            setEditingRoom(r);
                            setEditRoomName(r.name);
                            setEditRoomEmoji(r.emoji || '💬');
                            setEditRoomAdminOnly(Boolean(r.adminOnly));
                            setShowRoomEditModal(true);
                          }}
                          style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--hover)', color: 'var(--ink)', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                      </>
                    )}
                    {r.archived ? (
                      <>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleArchiveRoom(r)}
                            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--hover)', color: 'var(--accent)', cursor: 'pointer' }}
                          >
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setShowRoomsModal(false);
                            handleSwitchRoom(r.id);
                          }}
                          style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer' }}
                        >
                          View
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoomsModal(false);
                          handleSwitchRoom(r.id);
                        }}
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer' }}
                      >
                        Open
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowRoomsModal(false)}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 13 }}
              >
                Close
              </button>
              {isAdmin && (conversation.rooms?.length || 0) < 12 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoom(null);
                    setEditRoomName('');
                    setEditRoomEmoji('💬');
                    setEditRoomAdminOnly(false);
                    setShowRoomEditModal(true);
                  }}
                  style={{ padding: '7px 16px', borderRadius: 8, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  New room
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== BATCH 2: ROOM EDIT MODAL ===== */}
      {showRoomEditModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 125,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                {editingRoom ? 'Edit room' : 'New room'}
              </h3>
              <button
                onClick={() => setShowRoomEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
                Name
              </label>
              <input
                type="text"
                maxLength={24}
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                placeholder="e.g. Study group, Beach plans"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--hover)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  fontSize: 14,
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
                Icon
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {REMO.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditRoomEmoji(emoji)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      fontSize: 18,
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: editRoomEmoji === emoji ? 'var(--hover)' : 'var(--side)',
                      border: editRoomEmoji === emoji ? '2px solid var(--accent)' : '1px solid var(--line)',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <label className="strw" style={{ marginTop: 12 }}>
              <span className="stx">
                <b>Only admins can post</b>
                <small>Members can read messages</small>
              </span>
              <input
                type="checkbox"
                className="stsw"
                checked={editRoomAdminOnly}
                onChange={(e) => setEditRoomAdminOnly(e.target.checked)}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
              {editingRoom && editingRoom.id !== 'general' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleArchiveRoom(editingRoom)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}
                  >
                    {editingRoom.archived ? 'Restore' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(editingRoom.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
              ) : <div />}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowRoomEditModal(false)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoom}
                  disabled={!editRoomName.trim()}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: !editRoomName.trim() ? 0.45 : 1,
                  }}
                >
                  {editingRoom ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BATCH 2: GROUP EXPIRATION MODAL ===== */}
      {showExpiryModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            backgroundColor: 'rgba(0,0,0,0.65)',
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
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                {conversation.archivedAt ? 'Reopen group' : 'Group expiration'}
              </h3>
              <button
                onClick={() => setShowExpiryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <p className="note2">
              {conversation.archivedAt
                ? `This group ended ${new Date(conversation.archivedAt).toLocaleDateString()}. Choose how long it stays open.`
                : conversation.endsAt
                ? `Ends ${new Date(conversation.endsAt).toLocaleDateString()} (${untilLong(new Date(conversation.endsAt).getTime())} left).`
                : 'This group never expires.'}
            </p>

            <div className="clab">Expires in</div>
            <div className="optr" style={{ marginBottom: 12 }}>
              {[
                { k: 'none', l: 'No expiration' },
                { k: '1h', l: '1 hour' },
                { k: '24h', l: '24 hours' },
                { k: '7d', l: '7 days' },
                { k: '30d', l: '30 days' },
                { k: 'custom', l: 'Custom date' },
              ].map((opt) => (
                <button
                  key={opt.k}
                  type="button"
                  aria-pressed={expiryOption === opt.k}
                  onClick={() => setExpiryOption(opt.k as any)}
                >
                  {opt.l}
                </button>
              ))}
            </div>

            {expiryOption === 'custom' && (
              <input
                type="date"
                className="din"
                value={expiryCustomDate}
                onChange={(e) => setExpiryCustomDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
              />
            )}
            <p className="note2" style={{ marginTop: 8 }}>
              When it ends the group is archived, not deleted. Messages and media stay readable.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
              {!conversation.archivedAt ? (
                <button
                  type="button"
                  onClick={handleArchiveGroupNow}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}
                >
                  Archive now
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowExpiryModal(false)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveExpiry}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {conversation.archivedAt ? 'Reopen' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Picker Modal (Standalone Lines 4443-4449) */}
      {showGamePickerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setShowGamePickerModal(false)}
        >
          <div
            className="mdlg"
            style={{
              backgroundColor: 'var(--panel)',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 420,
              border: '1px solid var(--line)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  Challenge {conversation.title || 'Friend'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                  Pick a game. The invite appears in the chat.
                </p>
              </div>
              <button
                onClick={() => setShowGamePickerModal(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--hover)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gpick">
              {GORDER.filter((k) => conversation.type !== 'group' || GM[k].par).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={async () => {
                    setShowGamePickerModal(false);
                    try {
                      await api.sendGameInvite(conversation.id, k);
                      playTone('pop');
                    } catch (err) {
                      console.error('Failed to send challenge:', err);
                    }
                  }}
                >
                  <span className="gic" style={{ fontSize: 20 }}>{GM[k].e}</span>
                  <span>
                    <b>{GM[k].n}</b>
                    <small>{GM[k].d}</small>
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowGamePickerModal(false)}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
