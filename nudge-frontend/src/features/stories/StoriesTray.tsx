import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Plus, Radio } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface StoriesTrayProps {
  onOpenStoryViewer: (feedIndex: number, feeds: any[]) => void;
  onOpenCreateStory: () => void;
  onOpenLiveSetup?: () => void;
  onOpenWatchDemo?: () => void;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({
  onOpenStoryViewer,
  onOpenCreateStory,
  onOpenLiveSetup,
  onOpenWatchDemo,
}) => {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState<any[]>([]);

  const loadFeeds = () => {
    api.getStoriesFeed()
      .then((res) => setFeeds(res.feeds || []))
      .catch((err) => console.error('Failed to load stories feed:', err));
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  return (
    <div
      className="stories-tray-scroll"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 16px',
        overflowX: 'auto',
        overflowY: 'hidden',
        borderBottom: '1px solid var(--line)',
        backgroundColor: 'var(--side)',
        flexShrink: 0,
        height: 98,
        minHeight: 98,
        boxSizing: 'border-box',
      }}
    >
      {/* Add Story Button for current user */}
      <div
        onClick={onOpenCreateStory}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          cursor: 'pointer',
          flexShrink: 0,
          width: 66,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Avatar name={user?.displayName || 'Me'} url={user?.avatarUrl} size={48} />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 17,
              height: 17,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              border: '2px solid var(--side)',
            }}
          >
            <Plus size={11} strokeWidth={3} />
          </div>
        </div>
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--ink)',
            fontWeight: 500,
            maxWidth: 66,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          Your story
        </span>
      </div>

      {/* Go Live Button */}
      {onOpenLiveSetup && (
        <div
          onClick={onOpenLiveSetup}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
            flexShrink: 0,
            width: 66,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '2px dashed #ef4444',
              color: '#ef4444',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Radio size={20} />
          </div>
          <span
            style={{
              fontSize: 11.5,
              color: '#ef4444',
              fontWeight: 700,
              maxWidth: 66,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            Go live
          </span>
        </div>
      )}

      {/* Tola's Demo Live Stream with glowing LIVE badge */}
      {onOpenWatchDemo && (
        <div
          onClick={onOpenWatchDemo}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            cursor: 'pointer',
            flexShrink: 0,
            width: 66,
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                padding: 2,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
              }}
            >
              <div style={{ borderRadius: '50%', padding: 2, backgroundColor: 'var(--panel)' }}>
                <Avatar name="Tola" url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" size={44} />
              </div>
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: 8.5,
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 6,
                letterSpacing: 0.5,
                border: '1.5px solid var(--side)',
              }}
            >
              LIVE
            </span>
          </div>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--ink)',
              fontWeight: 600,
              maxWidth: 66,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            Tola
          </span>
        </div>
      )}

      {/* Friends Stories */}
      {feeds.map((feed, idx) => {
        const hasUnviewed = !feed.allViewed;

        return (
          <div
            key={feed.authorId}
            onClick={() => onOpenStoryViewer(idx, feeds)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              cursor: 'pointer',
              flexShrink: 0,
              width: 66,
            }}
          >
            <div
              style={{
                padding: 2,
                borderRadius: '50%',
                background: hasUnviewed
                  ? 'conic-gradient(from 0deg, #FF3D7F, #7A5CFF, #18C8FF, #2EE6A6, #FFB02E, #FF3D7F)'
                  : 'var(--line)',
              }}
            >
              <div style={{ borderRadius: '50%', padding: 2, backgroundColor: 'var(--panel)' }}>
                <Avatar name={feed.displayName} url={feed.avatarUrl} size={44} />
              </div>
            </div>
            <span
              style={{
                fontSize: 11.5,
                color: 'var(--ink)',
                fontWeight: 500,
                maxWidth: 66,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {feed.displayName.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
};
