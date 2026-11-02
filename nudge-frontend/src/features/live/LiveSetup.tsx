import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Mic, MicOff, Video as VideoIcon, VideoOff, Play, History, Radio } from 'lucide-react';
import { getSavedReplays, LiveReplay } from './liveStore.js';

interface LiveSetupProps {
  onClose: () => void;
  onStartBroadcast: (config: {
    stream: MediaStream;
    title: string;
    facingMode: 'user' | 'environment';
    isCamOn: boolean;
    isMicOn: boolean;
    notifyFriends: boolean;
    simulatedViewers: boolean;
  }) => void;
  onOpenReplays: () => void;
}

export const LiveSetup: React.FC<LiveSetupProps> = ({ onClose, onStartBroadcast, onOpenReplays }) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [title, setTitle] = useState('');
  const [notifyFriends, setNotifyFriends] = useState(true);
  const [simulatedViewers, setSimulatedViewers] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [replaysCount, setReplaysCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setReplaysCount(getSavedReplays().length);
  }, []);

  // Request camera stream
  useEffect(() => {
    let active = true;

    async function initCamera() {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }

      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by your browser.');
        return;
      }

      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 720 },
            height: { ideal: 1280 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }

        s.getVideoTracks()[0].enabled = isCamOn;
        s.getAudioTracks().forEach((t) => (t.enabled = isMicOn));

        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err: any) {
        console.warn('Camera error in LiveSetup:', err);
        const name = err?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setCameraError('Camera access was blocked. Please enable camera permissions in your browser.');
        } else if (name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
        } else {
          setCameraError('Camera is unavailable or in use by another application.');
        }
      }
    }

    initCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  const toggleCam = () => {
    if (stream) {
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) vTrack.enabled = !isCamOn;
    }
    setIsCamOn(!isCamOn);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMicOn));
    }
    setIsMicOn(!isMicOn);
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleGoLive = () => {
    if (!stream) return;
    onStartBroadcast({
      stream,
      title: title.trim(),
      facingMode,
      isCamOn,
      isMicOn,
      notifyFriends,
      simulatedViewers,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
        fontFamily: 'inherit',
      }}
    >
      {/* Background Video Stream */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {stream && !cameraError && isCamOn ? (
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
              backgroundColor: '#121815',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 24,
              textAlign: 'center',
            }}
          >
            {cameraError ? (
              <>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'grid', placeItems: 'center', color: '#ef4444' }}>
                  <VideoOff size={28} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Camera Unavailable</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 300, margin: 0, lineHeight: 1.4 }}>
                  {cameraError}
                </p>
                <button
                  onClick={() => setFacingMode((prev) => prev)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 20,
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                >
                  Retry Camera
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)' }}>
                <VideoOff size={36} />
                <span>Camera is turned off</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dark gradient vignette over video */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 25%, transparent 60%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.4)',
            color: '#fff',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 16 }}>
          <Radio size={18} color="#ef4444" />
          <span>Go Live</span>
        </div>

        <button
          onClick={onOpenReplays}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.4)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <History size={14} />
          <span>Replays ({replaysCount})</span>
        </button>
      </div>

      {/* Side Quick Toggles: Flip, Cam, Mic */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 80,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          onClick={flipCamera}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.45)',
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

        <button
          onClick={toggleCam}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: isCamOn ? 'rgba(0,0,0,0.45)' : '#ef4444',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
          title="Toggle camera"
        >
          {isCamOn ? <VideoIcon size={19} /> : <VideoOff size={19} />}
        </button>

        <button
          onClick={toggleMic}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: isMicOn ? 'rgba(0,0,0,0.45)' : '#ef4444',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
          title="Toggle mic"
        >
          {isMicOn ? <Mic size={19} /> : <MicOff size={19} />}
        </button>
      </div>

      {/* Bottom Setup & Start Bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 20px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a broadcast title (optional)..."
          maxLength={60}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 14,
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            backdropFilter: 'blur(8px)',
          }}
        />

        {/* Options Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, cursor: 'pointer' }}>
            <span>Notify friends when I start</span>
            <input
              type="checkbox"
              checked={notifyFriends}
              onChange={(e) => setNotifyFriends(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, cursor: 'pointer' }}>
            <span>Add simulated viewers & comments (demo)</span>
            <input
              type="checkbox"
              checked={simulatedViewers}
              onChange={(e) => setSimulatedViewers(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
            />
          </label>
        </div>

        {/* Big Go Live Button */}
        <button
          onClick={handleGoLive}
          disabled={!stream}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 24,
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: stream ? 'pointer' : 'default',
            opacity: stream ? 1 : 0.6,
            boxShadow: '0 8px 24px rgba(15, 107, 88, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Radio size={20} />
          <span>Go Live</span>
        </button>
      </div>
    </div>
  );
};
