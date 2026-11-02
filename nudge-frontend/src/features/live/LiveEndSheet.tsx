import React, { useState } from 'react';
import { Sparkles, Save, Trash2, Check, Radio } from 'lucide-react';
import { api } from '../../services/api.js';
import { saveReplay } from './liveStore.js';

interface LiveEndSheetProps {
  title: string;
  durationSeconds: number;
  peakViewers: number;
  recordedBlob: Blob | null;
  onDone: () => void;
}

export const LiveEndSheet: React.FC<LiveEndSheetProps> = ({
  title,
  durationSeconds,
  peakViewers,
  recordedBlob,
  onDone,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleShareToStory = async () => {
    setIsSaving(true);
    try {
      await api.createStory({
        type: 'text',
        text: `🔴 Live Replay: ${title || 'Matchday & Chats'} (${formatTimer(durationSeconds)})`,
        background: 'linear-gradient(135deg, #1A1F35, #0F6B58)',
        audience: 'public',
      });
      setSavedSuccess('Shared to your story!');
      setTimeout(() => {
        onDone();
      }, 1000);
    } catch (err) {
      console.warn('Failed to share live to story:', err);
      onDone();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsReplay = () => {
    setIsSaving(true);
    try {
      let videoUrl: string | undefined;
      if (recordedBlob) {
        videoUrl = URL.createObjectURL(recordedBlob);
      }
      saveReplay({
        id: `rep_${Date.now()}`,
        title: title || 'Live broadcast',
        timestamp: Date.now(),
        duration: durationSeconds,
        videoUrl,
      });
      setSavedSuccess('Saved to replays!');
      setTimeout(() => {
        onDone();
      }, 900);
    } catch {
      onDone();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 2700,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          backgroundColor: 'var(--panel)',
          borderRadius: 20,
          padding: '24px 22px',
          color: 'var(--ink)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 107, 88, 0.12)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Radio size={24} />
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Live Broadcast Ended</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>{title || 'Session complete'}</p>

        {/* Stats Summary Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            backgroundColor: 'var(--side)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 20,
            border: '1px solid var(--line)',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{formatTimer(durationSeconds)}</div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Duration</span>
          </div>
          <div style={{ width: 1, height: 24, backgroundColor: 'var(--line)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{peakViewers}</div>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Peak Viewers</span>
          </div>
        </div>

        {savedSuccess ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--ok)', fontWeight: 600, padding: 12 }}>
            <Check size={18} />
            <span>{savedSuccess}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Share to Story */}
            <button
              onClick={handleShareToStory}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                backgroundColor: 'var(--accent)',
                color: '#fff',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 107, 88, 0.3)',
              }}
            >
              <Sparkles size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Share to My Story</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>Visible to friends for 24 hours</div>
              </div>
            </button>

            {/* Save as Replay */}
            <button
              onClick={handleSaveAsReplay}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 14,
                backgroundColor: 'var(--side)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <Save size={20} color="var(--gold)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Save as Replay</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Private to you under Replays</div>
              </div>
            </button>

            {/* Discard */}
            <button
              onClick={onDone}
              disabled={isSaving}
              style={{
                padding: '10px',
                borderRadius: 12,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              Discard Recording
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
