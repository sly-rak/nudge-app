import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface StoryViewerModalProps {
  feed: any;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ feed, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const stories = feed.stories || [];
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory) {
      api.viewStory(currentStory.id);
    }
  }, [currentStory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  if (!currentStory) return null;

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
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100%',
          maxHeight: 740,
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
          background: currentStory.background || 'linear-gradient(135deg, #0F6B58, #18C8FF)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Progress bars */}
        <div style={{ display: 'flex', gap: 4, width: '100%', marginBottom: 12 }}>
          {stories.map((_: any, idx: number) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: idx === currentIndex ? '100%' : idx < currentIndex ? '100%' : '0%',
                  backgroundColor: '#FFFFFF',
                  transition: idx === currentIndex ? 'width 5s linear' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={feed.displayName} url={feed.avatarUrl} size={36} />
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{feed.displayName}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>24h Story</div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
          }}
        >
          <p
            style={{
              color: '#FFFFFF',
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.4,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {currentStory.text}
          </p>
        </div>

        {/* Story Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              opacity: currentIndex === 0 ? 0.3 : 1,
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => {
              if (currentIndex < stories.length - 1) {
                setCurrentIndex((i) => i + 1);
              } else {
                onClose();
              }
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
