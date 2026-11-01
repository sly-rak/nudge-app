import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface CallModalProps {
  type: 'audio' | 'video';
  contactName: string;
  avatarUrl?: string;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ type, contactName, avatarUrl, onEndCall }) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 17, 14, 0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 24px',
        color: '#FFFFFF',
      }}
    >
      {/* Top info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Avatar name={contactName} url={avatarUrl} size={90} />
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{contactName}</h2>
        <span style={{ fontSize: 14, color: 'var(--ok)', fontWeight: 500 }}>
          {formatDuration(seconds)}
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          {type === 'video' ? 'Video Call' : 'Voice Call'} (Encrypted)
        </span>
      </div>

      {/* Middle Video Mock / Waveform */}
      {type === 'video' && !isVideoOff && (
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            height: 220,
            borderRadius: 16,
            backgroundColor: '#16201C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>HD Camera Stream</span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: isMuted ? 'var(--vanish)' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {type === 'video' && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: isVideoOff ? 'var(--vanish)' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
          </button>
        )}

        <button
          onClick={onEndCall}
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            backgroundColor: 'var(--vanish)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 6px 20px rgba(223, 75, 47, 0.4)',
          }}
          title="End Call"
        >
          <PhoneOff size={26} />
        </button>
      </div>
    </div>
  );
};
