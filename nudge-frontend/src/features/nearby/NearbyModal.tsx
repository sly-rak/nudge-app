import React from 'react';
import { X, Radio, MessageSquare, Hand } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface NearbyModalProps {
  onClose: () => void;
  onSelectPeer: (peerName: string) => void;
}

const NEARBY_PEERS = [
  { name: 'Tobi Balogun', distance: '120m', downFor: 'hang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { name: 'Amara Okafor', distance: '350m', downFor: 'talk', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  { name: 'Chidi Nwosu', distance: '800m', downFor: 'play', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
];

export const NearbyModal: React.FC<NearbyModalProps> = ({ onClose, onSelectPeer }) => {
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
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'var(--sir-bg)',
          color: 'var(--sir-ink)',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          border: '1px solid var(--sir-line)',
        }}
      >
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
          }}
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Nearby Radar</h3>
        <p style={{ fontSize: 12, color: 'var(--sir-mut)', marginBottom: 24, textAlign: 'center' }}>
          Discovering friends & players in your vicinity
        </p>

        {/* Siri-style Glowing Radar Orb */}
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            display: 'grid',
            placeItems: 'center',
            marginBottom: 32,
          }}
        >
          {/* Animated radar rings */}
          <div className="radar-ring" style={{ width: 140, height: 140 }} />
          <div className="radar-ring" style={{ width: 140, height: 140, animationDelay: '1s' }} />
          <div className="radar-ring" style={{ width: 140, height: 140, animationDelay: '2s' }} />

          {/* Central orb */}
          <div
            style={{
              width: 76,
              height: 76,
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sir-mut)', letterSpacing: 0.5, marginBottom: 2 }}>
            PEOPLE NEARBY
          </div>

          {NEARBY_PEERS.map((peer, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: 'var(--sir-card)',
                border: '1px solid var(--sir-line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={peer.name} url={peer.avatar} size={38} online />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--sir-ink)' }}>{peer.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--sir-mut)' }}>{peer.distance} away • Down to {peer.downFor}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectPeer(peer.name);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 10px',
                  borderRadius: 14,
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Hand size={13} />
                <span>Nudge</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
