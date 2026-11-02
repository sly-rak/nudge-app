import React, { useState, useEffect, useRef } from 'react';
import { Eye, Mic, MicOff, Video as VideoIcon, VideoOff, RefreshCw, Send, X, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface LiveHostProps {
  stream: MediaStream;
  title: string;
  initialFacingMode: 'user' | 'environment';
  initialCam: boolean;
  initialMic: boolean;
  simulatedViewers: boolean;
  onEndBroadcast: (summary: {
    title: string;
    durationSeconds: number;
    peakViewers: number;
    recordedBlob: Blob | null;
  }) => void;
}

interface LiveComment {
  id: string;
  name: string;
  text: string;
  isHost?: boolean;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  leftPercent: number;
}

const BOT_COMMENTS = [
  { name: 'Tola', text: 'Looking sharp bro! 🔥' },
  { name: 'Chidi', text: 'Audio and video are super crisp 💻' },
  { name: 'Mum', text: 'God bless you my dear! Have you eaten? ❤️' },
  { name: 'Amaka', text: 'Watching from the library break 😄📚' },
  { name: 'Sade', text: 'Lighting is magical right now ✨' },
  { name: 'Seyi', text: 'Third Mainland traffic is clear today 🚗' },
  { name: 'Dami', text: 'Great frame rate, 1080p looking clean' },
  { name: 'Tola', text: 'Are we still playing Connect 4 after this? 🎮' },
  { name: 'Chidi', text: 'PR got merged! 🚀' },
  { name: 'Amaka', text: 'Haha loving the energy 🎉' },
];

const REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '😮'];

export const LiveHost: React.FC<LiveHostProps> = ({
  stream,
  title,
  initialFacingMode,
  initialCam,
  initialMic,
  simulatedViewers,
  onEndBroadcast,
}) => {
  const { user } = useAuth();
  const [seconds, setSeconds] = useState(0);
  const [viewersCount, setViewersCount] = useState(simulatedViewers ? 4 : 1);
  const [peakViewers, setPeakViewers] = useState(simulatedViewers ? 4 : 1);
  const [isCamOn, setIsCamOn] = useState(initialCam);
  const [isMicOn, setIsMicOn] = useState(initialMic);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Setup video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Setup MediaRecorder for replay recording
  useEffect(() => {
    try {
      const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      const supportedType = types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));

      if (supportedType) {
        const recorder = new MediaRecorder(stream, { mimeType: supportedType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      }
    } catch (err) {
      console.warn('Could not initialize MediaRecorder:', err);
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, [stream]);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bot audience simulation (comments, reactions & fluctuating viewer count)
  useEffect(() => {
    if (!simulatedViewers) return;

    let botIndex = 0;
    const commentInterval = setInterval(() => {
      const nextComment = BOT_COMMENTS[botIndex % BOT_COMMENTS.length];
      botIndex++;

      setComments((prev) => [...prev.slice(-25), { id: `c_${Date.now()}_${Math.random()}`, name: nextComment.name, text: nextComment.text }]);

      // Randomly adjust viewers
      setViewersCount((v) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = Math.max(3, v + delta);
        setPeakViewers((p) => Math.max(p, next));
        return next;
      });

      // Random reaction float
      if (Math.random() < 0.7) {
        triggerReaction(REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)]);
      }
    }, 2800);

    return () => clearInterval(commentInterval);
  }, [simulatedViewers]);

  // Auto-scroll comments to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const triggerReaction = (emoji: string) => {
    const reaction: FloatingReaction = {
      id: `r_${Date.now()}_${Math.random()}`,
      emoji,
      leftPercent: 70 + Math.random() * 20, // 70% to 90%
    };
    setFloatingReactions((prev) => [...prev, reaction]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2500);
  };

  const toggleCam = () => {
    const vTrack = stream.getVideoTracks()[0];
    if (vTrack) vTrack.enabled = !isCamOn;
    setIsCamOn(!isCamOn);
  };

  const toggleMic = () => {
    stream.getAudioTracks().forEach((t) => (t.enabled = !isMicOn));
    setIsMicOn(!isMicOn);
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        name: `${user?.displayName || 'Host'} (You)`,
        text: commentInput.trim(),
        isHost: true,
      },
    ]);
    setCommentInput('');
  };

  const finishEnding = () => {
    setShowConfirmEnd(false);

    let recordedBlob: Blob | null = null;
    if (recordedChunksRef.current.length > 0) {
      recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    }

    // Stop streams
    stream.getTracks().forEach((t) => t.stop());

    onEndBroadcast({
      title: title || 'Live broadcast',
      durationSeconds: seconds,
      peakViewers,
      recordedBlob,
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
      {/* Background Video Stream */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {isCamOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#111814',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <VideoOff size={40} />
            <span>Camera is off</span>
          </div>
        )}
      </div>

      {/* Dark gradient shading for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, transparent 22%, transparent 55%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Animated Reactions */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}>
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{
              position: 'absolute',
              bottom: 110,
              left: `${r.leftPercent}%`,
              fontSize: 28,
              animation: 'floatUp 2.4s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
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
          {/* Glowing Red LIVE Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.5,
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.7)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#fff',
                animation: 'pulse 1.2s infinite',
              }}
            />
            <span>LIVE</span>
          </div>

          {/* Timer */}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              backgroundColor: 'rgba(0,0,0,0.45)',
              padding: '4px 8px',
              borderRadius: 8,
              backdropFilter: 'blur(8px)',
            }}
          >
            {formatTimer(seconds)}
          </span>

          {/* Viewers Pill */}
          <button
            onClick={() => setShowViewersModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Eye size={14} />
            <span>{viewersCount}</span>
          </button>
        </div>

        {/* End Button */}
        <button
          onClick={() => setShowConfirmEnd(true)}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
          }}
        >
          End
        </button>
      </div>

      {/* Broadcast Title Display if set */}
      {title && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '0 20px',
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </div>
      )}

      {/* Bottom Area: Comments Stream & Controls */}
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
        {/* Comments Box (Scrolling list of max 5 visible) */}
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
                  color: c.isHost ? 'var(--gold-hi)' : 'var(--accent)',
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
              placeholder="Comment as host..."
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

          {/* Quick Reaction Pills */}
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

        {/* Host Live Action Toggles: Mic, Cam, Flip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          <button
            onClick={toggleMic}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: isMicOn ? 'rgba(0,0,0,0.5)' : '#ef4444',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
            title="Mute mic"
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleCam}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: isCamOn ? 'rgba(0,0,0,0.5)' : '#ef4444',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
            title="Mute camera"
          >
            {isCamOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={flipCamera}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
            title="Switch camera"
          >
            <RefreshCw size={19} />
          </button>
        </div>
      </div>

      {/* Confirmation End Modal */}
      {showConfirmEnd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 3000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: 'var(--panel)',
              borderRadius: 16,
              padding: 20,
              color: 'var(--ink)',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>End live broadcast?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.4 }}>
              Your viewers will be disconnected and the LIVE indicator will be removed.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirmEnd(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  backgroundColor: 'var(--side)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Keep Going
              </button>
              <button
                onClick={finishEnding}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                End Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {showViewersModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 3000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              backgroundColor: 'var(--panel)',
              borderRadius: 16,
              padding: 20,
              color: 'var(--ink)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Viewers ({viewersCount})</h3>
              <button
                onClick={() => setShowViewersModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
              {['Tola', 'Chidi', 'Mum', 'Amaka', 'Sade'].slice(0, viewersCount).map((name) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {name[0]}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowViewersModal(false)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '9px',
                borderRadius: 10,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
