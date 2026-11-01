import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Plus } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface StoriesTrayProps {
  onOpenStoryViewer: (feedIndex: number, feeds: any[]) => void;
  onOpenCreateStory: () => void;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({ onOpenStoryViewer, onOpenCreateStory }) => {
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        overflowX: 'auto',
        borderBottom: '1px solid var(--line)',
        backgroundColor: 'var(--side)',
      }}
    >
      {/* Add Story Button for current user */}
      <div
        onClick={onOpenCreateStory}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative' }}>
          <Avatar name={user?.displayName || 'Me'} url={user?.avatarUrl} size={50} />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              border: '2px solid var(--panel)',
            }}
          >
            <Plus size={12} strokeWidth={3} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 500, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Your story
        </span>
      </div>

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
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: 2.5,
                borderRadius: '50%',
                background: hasUnviewed
                  ? 'conic-gradient(from 0deg, #FF3D7F, #7A5CFF, #18C8FF, #2EE6A6, #FFB02E, #FF3D7F)'
                  : 'var(--line)',
              }}
            >
              <div style={{ borderRadius: '50%', padding: 2, backgroundColor: 'var(--panel)' }}>
                <Avatar name={feed.displayName} url={feed.avatarUrl} size={46} />
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink)', fontWeight: 500, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {feed.displayName.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
};
