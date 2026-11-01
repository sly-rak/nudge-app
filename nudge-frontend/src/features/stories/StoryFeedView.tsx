import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../../components/Avatar.js';
import { StoriesTray } from './StoriesTray.js';
import { Heart, MessageCircle, Share2, Bookmark, Image, Send, Trash2, UserPlus, Sparkles } from 'lucide-react';

interface StoryFeedViewProps {
  onOpenStoryViewer: (feedIndex: number, feeds: any[]) => void;
  onOpenCreateStory: () => void;
  onSelectUserChat?: (username: string) => void;
}

interface Post {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
  };
  text: string;
  image?: string;
  gradientArt?: { from: string; to: string; emoji: string };
  timestamp: string;
  likes: number;
  hasLiked?: boolean;
  hasSaved?: boolean;
  comments: { id: string; authorName: string; text: string; time: string }[];
}

const INITIAL_POSTS: Post[] = [
  {
    id: 'p0',
    author: {
      username: 'dayo',
      displayName: 'Dayo Ade',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Building things and learning every day.',
    },
    text: 'Day one of building my own chat app with Neon PostgreSQL & Fastify. Let us see how far this goes! 🚀',
    timestamp: '2h ago',
    likes: 12,
    hasLiked: false,
    comments: [
      { id: 'c1', authorName: 'Tola', text: 'Let me test the FIFA bot first 😄', time: '1h ago' },
      { id: 'c2', authorName: 'Chidi', text: 'Clean architecture, ship it!', time: '45m ago' },
    ],
  },
  {
    id: 'p1',
    author: {
      username: 'tola',
      displayName: 'Tola',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'FIFA champion (self-declared).',
    },
    text: 'Saturday FIFA rematch is ON. Come ready to lose ⚽🎮😤',
    timestamp: '3h ago',
    likes: 19,
    hasLiked: true,
    comments: [
      { id: 'c3', authorName: 'Chidi', text: 'He has been saying this all week 😂', time: '2h ago' },
    ],
  },
  {
    id: 'p2',
    author: {
      username: 'sade',
      displayName: 'Sade',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
      bio: 'Photographer chasing golden hour.',
    },
    text: 'Golden hour from the Lekki bridge never gets old. Lagos magic.',
    gradientArt: { from: '#FF5E62', to: '#FF9966', emoji: '🌇' },
    timestamp: '4h ago',
    likes: 54,
    hasLiked: false,
    comments: [],
  },
  {
    id: 'p3',
    author: {
      username: 'chidi',
      displayName: 'Chidi',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'Backend dev. Deploy day.',
    },
    text: 'Shipped the login fix. Small win, but Neon connection pooling is silky smooth now! Tests passing, finally ✅',
    timestamp: '5h ago',
    likes: 38,
    hasLiked: false,
    comments: [
      { id: 'c4', authorName: 'Dami', text: 'Congrats! Drinks on you 😄', time: '4h ago' },
    ],
  },
  {
    id: 'p4',
    author: {
      username: 'amaka',
      displayName: 'Amaka',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      bio: 'Final year student. Library survivor.',
    },
    text: 'Library is packed today. Exam season has officially begun 📚✨ Past questions to the rescue!',
    timestamp: '7h ago',
    likes: 27,
    hasLiked: false,
    comments: [],
  },
  {
    id: 'p5',
    author: {
      username: 'emeka',
      displayName: 'Emeka',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      bio: 'Hot takes about food.',
    },
    text: 'Hot take: Jollof rice always tastes better when someone else cooks it. Facts or fiction?',
    timestamp: '9h ago',
    likes: 74,
    hasLiked: false,
    comments: [
      { id: 'c5', authorName: 'Funmi', text: 'Absolute facts.', time: '8h ago' },
    ],
  },
];

const SUGGESTIONS = [
  { username: 'kemi', displayName: 'Kemi', bio: 'Birthday girl all year round 🎂' },
  { username: 'jide', displayName: 'Jide', bio: 'Gym at 6am. No excuses. 🏋️‍♂️' },
  { username: 'femi', displayName: 'Uncle Femi', bio: 'Retired banker. Proud uncle.' },
];

export const StoryFeedView: React.FC<StoryFeedViewProps> = ({
  onOpenStoryViewer,
  onOpenCreateStory,
  onSelectUserChat,
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [postDraft, setPostDraft] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'following'>('all');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, hasSaved: !p.hasSaved } : p))
    );
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: `c_${Date.now()}`,
                authorName: user?.displayName || 'Me',
                text,
                time: 'Just now',
              },
            ],
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postDraft.trim()) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: {
        username: user?.username || 'me',
        displayName: user?.displayName || 'Dayo Ade',
        avatarUrl: user?.avatarUrl,
        bio: user?.bio || 'Building things on Nudge.',
      },
      text: postDraft.trim(),
      timestamp: 'Just now',
      likes: 0,
      hasLiked: false,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setPostDraft('');
  };

  const toggleFollow = (username: string) => {
    setFollowedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--panel)',
        overflowY: 'auto',
      }}
    >
      {/* 24h Story Bar at Top */}
      <StoriesTray
        onOpenStoryViewer={(idx, feeds) => onOpenStoryViewer(idx, feeds)}
        onOpenCreateStory={onOpenCreateStory}
      />

      {/* Main Feed Container */}
      <div style={{ maxWidth: 580, width: '100%', margin: '0 auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Post Composer */}
        <form
          onSubmit={handleCreatePost}
          style={{
            backgroundColor: 'var(--side)',
            borderRadius: 16,
            padding: '14px 16px',
            border: '1px solid var(--line)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={user?.displayName || 'Me'} url={user?.avatarUrl} size={42} />
            <div style={{ flex: 1 }}>
              <textarea
                placeholder="What is happening? Share an update or thought..."
                value={postDraft}
                onChange={(e) => setPostDraft(e.target.value)}
                maxLength={280}
                rows={2}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--ink)',
                  fontSize: 14,
                  resize: 'none',
                  lineHeight: 1.4,
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {280 - postDraft.length}
                </span>

                <button
                  type="submit"
                  disabled={!postDraft.trim()}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: 'none',
                    cursor: postDraft.trim() ? 'pointer' : 'default',
                    opacity: postDraft.trim() ? 1 : 0.5,
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Filter Segment (For You vs Following) */}
        <div style={{ display: 'flex', backgroundColor: 'var(--side)', borderRadius: 12, padding: 3, border: '1px solid var(--line)' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: filterMode === 'all' ? 700 : 500,
              backgroundColor: filterMode === 'all' ? 'var(--panel)' : 'transparent',
              color: filterMode === 'all' ? 'var(--ink)' : 'var(--muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: filterMode === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            For you
          </button>
          <button
            onClick={() => setFilterMode('following')}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: filterMode === 'following' ? 700 : 500,
              backgroundColor: filterMode === 'following' ? 'var(--panel)' : 'transparent',
              color: filterMode === 'following' ? 'var(--ink)' : 'var(--muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: filterMode === 'following' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Following
          </button>
        </div>

        {/* Post Items */}
        {posts.map((post, idx) => {
          const isCommentsOpen = !!expandedComments[post.id];

          return (
            <React.Fragment key={post.id}>
              <div
                style={{
                  backgroundColor: 'var(--panel)',
                  borderRadius: 16,
                  padding: '16px 18px',
                  border: '1px solid var(--line)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    onClick={() => onSelectUserChat?.(post.author.username)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  >
                    <Avatar name={post.author.displayName} url={post.author.avatarUrl} size={42} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                        {post.author.displayName}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        @{post.author.username} · {post.timestamp}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Body */}
                <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.45 }}>
                  {post.text}
                </div>

                {/* Gradient Art Card if available */}
                {post.gradientArt && (
                  <div
                    style={{
                      height: 180,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${post.gradientArt.from}, ${post.gradientArt.to})`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 48,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span>{post.gradientArt.emoji}</span>
                  </div>
                )}

                {/* Post Actions: Like, Comment, Share, Save */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'none',
                        border: 'none',
                        color: post.hasLiked ? '#ef4444' : 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <Heart size={18} fill={post.hasLiked ? '#ef4444' : 'none'} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() =>
                        setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>{post.comments.length}</span>
                    </button>

                    <button
                      onClick={() => navigator.clipboard?.writeText(post.text)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                      title="Share post"
                    >
                      <Share2 size={17} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSave(post.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: post.hasSaved ? 'var(--accent)' : 'var(--muted)',
                      cursor: 'pointer',
                    }}
                    title="Bookmark"
                  >
                    <Bookmark size={18} fill={post.hasSaved ? 'var(--accent)' : 'none'} />
                  </button>
                </div>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <div style={{ marginTop: 6, borderTop: '1px dashed var(--line)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {post.comments.map((c) => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                        <b style={{ color: 'var(--ink)' }}>{c.authorName}:</b>
                        <span style={{ color: 'var(--ink)', opacity: 0.85 }}>{c.text}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{c.time}</span>
                      </div>
                    ))}

                    <form onSubmit={(e) => handleAddComment(post.id, e)} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        style={{
                          flex: 1,
                          padding: '7px 12px',
                          borderRadius: 20,
                          backgroundColor: 'var(--hover)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        style={{
                          padding: '0 14px',
                          borderRadius: 20,
                          backgroundColor: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Reply
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* People to follow card after second post */}
              {idx === 1 && (
                <div
                  style={{
                    backgroundColor: 'var(--side)',
                    borderRadius: 16,
                    padding: '14px 16px',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    <Sparkles size={14} color="var(--gold)" />
                    <span>People to follow</span>
                  </div>

                  {SUGGESTIONS.map((sug) => {
                    const isFollowed = followedUsers.has(sug.username);
                    return (
                      <div
                        key={sug.username}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={sug.displayName} size={36} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                              {sug.displayName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sug.bio}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleFollow(sug.username)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: isFollowed ? 'var(--hover)' : 'var(--accent)',
                            color: isFollowed ? 'var(--ink)' : 'var(--accent-ink)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {isFollowed ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
