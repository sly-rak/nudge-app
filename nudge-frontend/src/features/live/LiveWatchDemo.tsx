import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Send, Volume2, VolumeX } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import { useAuth } from '../../context/AuthContext.js';

interface LiveWatchDemoProps {
  onClose: () => void;
}

interface LiveComment {
  id: string;
  name: string;
  text: string;
  isMe?: boolean;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

const DEMO_COMMENTS = [
  { name: 'Chidi', text: 'That warm-up drill looks intense 🔥' },
  { name: 'Mum', text: 'Take care of your knees Tola! Drink water ❤️' },
  { name: 'Sade', text: 'Colors on this stream are gorgeous ✨' },
  { name: 'Dami', text: 'Who is starting up front Saturday?' },
  { name: 'Amaka', text: 'Saturday rematch is going to be crazy ⚽' },
  { name: 'Seyi', text: 'Bring home the trophy bro 🏆' },
];

const REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '⚽'];

export const LiveWatchDemo: React.FC<LiveWatchDemoProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [viewers, setViewers] = useState(38);
  const [comments, setComments] = useState<LiveComment[]>([
    { id: 'c1', name: 'Chidi', text: 'Audio and video super clear 🚀' },
    { id: 'c2', name: 'Dami', text: 'Let us see the dribbling skills!' },
  ]);
  const [commentInput, setCommentInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Animated canvas visual for Tola's stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const startTime = Date.now();

    const render = () => {
      const W = (canvas.width = canvas.parentElement?.clientWidth || 360);
      const H = (canvas.height = canvas.parentElement?.clientHeight || 640);
      const t = (Date.now() - startTime) / 1000;

      // Deep green/teal stadium gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0F2027');
      grad.addColorStop(0.5, '#203A43');
      grad.addColorStop(1, '#2C5364');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Pitch circles
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(15, 107, 88, 0.18)`;
        ctx.arc(
          W / 2 + Math.cos(t * 0.7 + i * 1.5) * (W * 0.25),
          H * 0.4 + Math.sin(t * 0.6 + i * 2.0) * (H * 0.15),
          W * 0.24,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Center glowing pulse
      ctx.fillStyle = 'rgba(235, 193, 94, 0.9)';
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.4, W * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Football icon / Tola monogram
      ctx.fillStyle = '#111814';
      ctx.font = `800 ${W * 0.12}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚽', W / 2, H * 0.4 + 2);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Comments and audience loop
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const nextC = DEMO_COMMENTS[idx % DEMO_COMMENTS.length];
      idx++;

      setComments((prev) => [...prev.slice(-20), { id: `c_${Date.now()}_${Math.random()}`, name: nextC.name, text: nextC.text }]);

      setViewers((v) => Math.max(20, v + Math.floor(Math.random() * 5) - 2));

      if (Math.random() < 0.75) {
        triggerReaction(REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)]);
      }
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const triggerReaction = (emoji: string) => {
    const r: FloatingReaction = {
      id: `r_${Date.now()}_${Math.random()}`,
      emoji,
      leftPercent: 68 + Math.random() * 22,
    };
    setFloatingReactions((prev) => [...prev, r]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.id !== r.id));
    }, 2500);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        name: user?.displayName || 'Me',
        text: commentInput.trim(),
        isMe: true,
      },
    ]);
    setCommentInput('');

    // Tola replies in chat after 1.5s
    setTimeout(() => {
      setComments((prev) => [
        ...prev,
        {
          id: `c_${Date.now()}`,
          name: 'Tola (Host)',
          text: `Ayy welcome to the live! Rematch this evening? 🔥`,
        },
      ]);
      triggerReaction('🔥');
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        zIndex: 2600,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        fontFamily: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* Animated Canvas */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      {/* Dark Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Reactions */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}>
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{
              position: 'absolute',
              bottom: 90,
              left: `${r.leftPercent}%`,
              fontSize: 28,
              animation: 'floatUp 2.4s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              name="Tola"
              url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
              size={36}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Tola</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Match day warm-up ⚽</div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 14,
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(239,68,68,0.7)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
            <span>LIVE</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 14,
              backgroundColor: 'rgba(0,0,0,0.4)',
              fontSize: 11,
              fontWeight: 700,
              backdropFilter: 'blur(6px)',
            }}
          >
            <Eye size={12} />
            <span>{viewers}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Area: Comments and Reactions */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '12px 18px 24px',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Comments Box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 180,
            overflowY: 'auto',
            paddingRight: 4,
            maskImage: 'linear-gradient(to bottom, transparent, black 25%)',
          }}
        >
          {comments.slice(-8).map((c) => (
            <div
              key={c.id}
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 6,
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '5px 12px',
                borderRadius: 16,
                fontSize: 13,
                width: 'fit-content',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: c.isMe ? 'var(--gold-hi)' : 'var(--accent)',
                }}
              >
                {c.name}:
              </span>
              <span style={{ color: '#fff' }}>{c.text}</span>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input & Quick Reactions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <form onSubmit={handleSendComment} style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Send a comment to Tola..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                backdropFilter: 'blur(8px)',
              }}
            />
            {commentInput.trim() && (
              <button
                type="submit"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <Send size={15} />
              </button>
            )}
          </form>

          {/* Quick Reaction Buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => triggerReaction(emoji)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 18,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
