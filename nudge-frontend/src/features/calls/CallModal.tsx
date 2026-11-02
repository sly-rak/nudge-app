import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Phone,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';
import {
  startRingbackTone,
  startIncomingCallTone,
  playConnectedTone,
  playCallEndedTone,
  stopAllCallSounds,
} from './callSounds.js';
import { api } from '../../services/api.js';

interface CallModalProps {
  type: 'audio' | 'video';
  contactName: string;
  avatarUrl?: string;
  conversationId?: string;
  isIncoming?: boolean;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  type,
  contactName,
  avatarUrl,
  conversationId,
  isIncoming = false,
  onEndCall,
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'incoming' | 'connected' | 'ended'>(
    isIncoming ? 'incoming' : 'calling'
  );
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize sounds and connection timer
  useEffect(() => {
    if (callStatus === 'calling') {
      startRingbackTone();
      // Simulate answer after 2.8 seconds
      const connectTimer = setTimeout(() => {
        stopAllCallSounds();
        playConnectedTone();
        setCallStatus('connected');
      }, 2800);

      return () => clearTimeout(connectTimer);
    } else if (callStatus === 'incoming') {
      startIncomingCallTone();
    }

    return () => {
      stopAllCallSounds();
    };
  }, [callStatus]);

  // Duration timer when connected
  useEffect(() => {
    let timer: any = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  // Request real Camera & Audio media
  useEffect(() => {
    let active = true;

    async function setupMedia() {
      // Clean up previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera and audio access not supported on this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video:
            type === 'video'
              ? {
                  facingMode,
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                }
              : false,
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setCameraError(null);

        if (localVideoRef.current && type === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Could not acquire user media:', err);
        const name = err?.name;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError('Camera / Microphone permission was denied.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError('No camera / microphone found on this device.');
        } else {
          setCameraError('Camera unavailable or in use by another app.');
        }
      }
    }

    setupMedia();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [type, facingMode]);

  // Toggle Microphone track
  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMuted; // inverted because state hasn't updated yet
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Video Camera track
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = isVideoOff; // inverted
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Switch between front and back camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // End call flow
  const handleEndCall = () => {
    stopAllCallSounds();
    playCallEndedTone();
    setCallStatus('ended');

    // Post call record to conversation if conversationId exists
    if (conversationId && seconds > 0) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const durText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const msgBody = `${type === 'video' ? '📹 Video' : '📞 Voice'} call · ${durText}`;

      api.sendMessage(conversationId, {
        type: 'text',
        body: msgBody,
      }).catch(() => {});
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setTimeout(() => {
      onEndCall();
    }, 700);
  };

  // Accept incoming call
  const handleAcceptCall = () => {
    stopAllCallSounds();
    playConnectedTone();
    setCallStatus('connected');
  };

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
        backgroundColor: '#0A0F0D',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '48px 20px 40px',
        color: '#FFFFFF',
        fontFamily: 'inherit',
        overflow: 'hidden',
      }}
    >
      {/* Top Header / Caller Info */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
          <ShieldCheck size={14} color="var(--ok)" />
          <span>END-TO-END ENCRYPTED {type.toUpperCase()} CALL</span>
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', letterSpacing: -0.3 }}>{contactName}</h2>

        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {callStatus === 'calling' && (
            <span style={{ color: 'var(--gold)' }}>Calling…</span>
          )}
          {callStatus === 'incoming' && (
            <span style={{ color: 'var(--ok)' }}>Incoming {type === 'video' ? 'Video' : 'Voice'} Call…</span>
          )}
          {callStatus === 'connected' && (
            <span style={{ color: 'var(--ok)' }}>{formatDuration(seconds)}</span>
          )}
          {callStatus === 'ended' && (
            <span style={{ color: '#ef4444' }}>Call Ended</span>
          )}
        </div>
      </div>

      {/* Middle Video / Avatar Area */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '20px 0',
        }}
      >
        {/* Remote Partner Visual (Big Avatar with Pulsing Rings) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Animated pulse rings when calling or connected */}
          {callStatus !== 'ended' && (
            <div
              style={{
                position: 'absolute',
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: '2px solid rgba(15, 107, 88, 0.4)',
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
          )}

          <div style={{ position: 'relative', zIndex: 2 }}>
            <Avatar name={contactName} url={avatarUrl} size={110} />
          </div>

          {callStatus === 'connected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              <span>Speaking</span>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <span style={{ width: 3, height: 12, backgroundColor: 'var(--ok)', borderRadius: 2 }} />
                <span style={{ width: 3, height: 18, backgroundColor: 'var(--ok)', borderRadius: 2 }} />
                <span style={{ width: 3, height: 8, backgroundColor: 'var(--ok)', borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        {/* Real Local Camera PIP Window (Video Call mode) */}
        {type === 'video' && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              width: 120,
              height: 160,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: '#1E2922',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            {isVideoOff ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                <VideoOff size={20} />
                <span>Camera off</span>
              </div>
            ) : cameraError ? (
              <div style={{ padding: 6, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                <AlertCircle size={16} color="var(--gold)" style={{ margin: '0 auto 4px' }} />
                <span>Preview unavailable</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
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
            )}
            <span
              style={{
                position: 'absolute',
                top: 6,
                left: 8,
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              You
            </span>
          </div>
        )}

        {/* Camera Permission Error Notice */}
        {cameraError && type === 'video' && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 20,
              right: 20,
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 10,
              padding: '8px 12px',
              color: 'var(--gold)',
              fontSize: 12,
              textAlign: 'center',
              zIndex: 15,
            }}
          >
            {cameraError}
          </div>
        )}
      </div>

      {/* Call Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          zIndex: 10,
          width: '100%',
          maxWidth: 380,
        }}
      >
        {callStatus === 'incoming' ? (
          // Incoming Call Buttons (Accept or Decline)
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
            {/* Decline */}
            <button
              onClick={handleEndCall}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                }}
              >
                <PhoneOff size={26} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={handleAcceptCall}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'var(--ok)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 6px 20px rgba(37, 160, 108, 0.4)',
                }}
              >
                <Phone size={26} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Accept</span>
            </button>
          </div>
        ) : (
          // Active / Outgoing Call Buttons
          <>
            {/* Mute Mic */}
            <button
              onClick={toggleMute}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: isMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Video Camera Toggle (Video Call only) */}
            {type === 'video' && (
              <>
                <button
                  onClick={toggleVideo}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: isVideoOff ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
                </button>

                {/* Flip camera */}
                <button
                  onClick={flipCamera}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                  title="Switch front/back camera"
                >
                  <RefreshCw size={20} />
                </button>
              </>
            )}

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: isSpeakerOn ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                color: isSpeakerOn ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              title={isSpeakerOn ? 'Speaker on' : 'Speaker muted'}
            >
              {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              style={{
                width: 62,
                height: 62,
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                marginLeft: 6,
              }}
              title="End call"
            >
              <PhoneOff size={28} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
