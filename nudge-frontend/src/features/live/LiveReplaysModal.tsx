import React, { useState, useEffect } from 'react';
import { X, Play, Trash2, Clock, Film } from 'lucide-react';
import { getSavedReplays, deleteReplay, LiveReplay } from './liveStore.js';

interface LiveReplaysModalProps {
  onClose: () => void;
}

export const LiveReplaysModal: React.FC<LiveReplaysModalProps> = ({ onClose }) => {
  const [replays, setReplays] = useState<LiveReplay[]>([]);
  const [activePlayUrl, setActivePlayUrl] = useState<string | null>(null);

  useEffect(() => {
    setReplays(getSavedReplays());
  }, []);

  const handleDelete = (id: string) => {
    deleteReplay(id);
    setReplays(getSavedReplays());
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 2800,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: 'var(--panel)',
          borderRadius: 20,
          padding: '20px 22px',
          color: 'var(--ink)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Film size={20} color="var(--accent)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Saved Live Replays</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {replays.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            <Film size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No saved replays yet.</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.8 }}>When you finish a live stream, choose "Save as replay".</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {replays.map((rep) => (
              <div
                key={rep.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  backgroundColor: 'var(--side)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{rep.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    <Clock size={11} />
                    <span>{formatTimer(rep.duration)}</span>
                    <span>•</span>
                    <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {rep.videoUrl && (
                    <button
                      onClick={() => setActivePlayUrl(rep.videoUrl!)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 16,
                        backgroundColor: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Play size={12} fill="#fff" />
                      <span>Play</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(rep.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                    title="Delete replay"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Modal if playing */}
        {activePlayUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              zIndex: 3000,
              display: 'grid',
              placeItems: 'center',
              padding: 20,
            }}
          >
            <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <video src={activePlayUrl} controls autoPlay playsInline style={{ width: '100%', borderRadius: 14 }} />
              <button
                onClick={() => setActivePlayUrl(null)}
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Player
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
