import React from 'react';
import { X, Radio, MessageSquare, Hand, Sparkles } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface NearbyModalProps {
  onClose?: () => void;
  onSelectPeer: (peerName: string) => void;
  isEmbedded?: boolean;
}

const NEARBY_PEERS = [
  { name: 'Tola', distance: '120m', downFor: 'play', bio: 'Ready for FIFA rematch ⚽', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { name: 'Amara Okafor', distance: '350m', downFor: 'talk', bio: 'Catching up on designs ☕', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  { name: 'Chidi', distance: '450m', downFor: 'heads_down', bio: 'Shipping code 🚀', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { name: 'Sade', distance: '800m', downFor: 'hang', bio: 'Chasing sunset at Lekki 🌇', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150' },
];

export const NearbyModal: React.FC<NearbyModalProps> = ({ onClose, onSelectPeer, isEmbedded = false }) => {
  const content = (
    <div
      style={{
        width: '100%',
        maxWidth: isEmbedded ? 560 : 420,
        backgroundColor: 'var(--sir-bg)',
        color: 'var(--sir-ink)',
        borderRadius: isEmbedded ? 0 : 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 24px',
        position: 'relative',
        boxShadow: isEmbedded ? 'none' : '0 25px 60px rgba(0,0,0,0.6)',
        border: isEmbedded ? 'none' : '1px solid var(--sir-line)',
        height: isEmbedded ? '100%' : 'auto',
        overflowY: 'auto',
        margin: '0 auto',
      }}
    >
      {onClose && !isEmbedded && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Sparkles size={18} color="var(--gold)" />
        <h3 style={{ fontSize: 20, fontWeight: 700 }}>Nearby Radar</h3>
      </div>
      <p style={{ fontSize: 13, color: 'var(--sir-mut)', marginBottom: 28, textAlign: 'center' }}>
        Discovering friends, groups & players within 1 km
      </p>

      {/* Siri-style Glowing Radar Orb */}
      <div
        style={{
          position: 'relative',
          width: 150,
          height: 150,
          display: 'grid',
          placeItems: 'center',
          marginBottom: 36,
        }}
      >
        <div className="radar-ring" style={{ width: 150, height: 150 }} />
        <div className="radar-ring" style={{ width: 150, height: 150, animationDelay: '1s' }} />
        <div className="radar-ring" style={{ width: 150, height: 150, animationDelay: '2s' }} />

        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 35px rgba(63, 187, 157, 0.6), 0 0 70px rgba(122, 92, 255, 0.4)',
            background: 'conic-gradient(from 0deg, #FF3D7F, #7A5CFF, #18C8FF, #2EE6A6, #FFB02E, #FF3D7F)',
            animation: 'spin 5s linear infinite',
          }}
        />
      </div>

      {/* Nearby Peers List */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sir-mut)', letterSpacing: 0.8, marginBottom: 2 }}>
          PEOPLE IN RANGE (4)
        </div>

        {NEARBY_PEERS.map((peer, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: 'var(--sir-card)',
              border: '1px solid var(--sir-line)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={peer.name} url={peer.avatar} size={42} online />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--sir-ink)' }}>{peer.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--sir-mut)' }}>
                  {peer.distance} away · Down to {peer.downFor}
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{peer.bio}</div>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectPeer(peer.name);
                onClose?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 14px',
                borderRadius: 16,
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-ink)',
                fontSize: 12.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Hand size={14} />
              <span>Nudge</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div style={{ flex: 1, height: '100%', overflowY: 'auto', backgroundColor: 'var(--sir-bg)' }}>
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {content}
    </div>
  );
};
