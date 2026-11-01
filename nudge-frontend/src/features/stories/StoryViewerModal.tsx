import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { X, ChevronLeft, ChevronRight, Send, CheckCircle2, Heart } from 'lucide-react';
import { Avatar } from '../../components/Avatar.js';

interface StoryViewerModalProps {
  feed: any;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ feed, onClose }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pollData, setPollData] = useState<any>(null);
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaSubmitted, setQaSubmitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const stories = feed.stories || [];
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (currentStory) {
      api.viewStory(currentStory.id);
      setPollData(currentStory.data?.poll || null);
      setQaSubmitted(false);
      setQaAnswer('');
    }
  }, [currentStory]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        onClose();
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose, isPaused]);

  if (!currentStory) return null;

  const handleVote = async (optionIndex: number) => {
    try {
      const res = await api.votePoll(currentStory.id, optionIndex);
      if (res.poll) {
        setPollData(res.poll);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleSendQaAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaAnswer.trim()) return;

    try {
      await api.answerQA(currentStory.id, qaAnswer.trim());
      setQaSubmitted(true);
      setQaAnswer('');
    } catch (err) {
      console.error('Failed to submit QA answer:', err);
    }
  };

  // Poll calculation
  const totalVotes = pollData?.opts?.reduce((sum: number, o: any) => sum + (o.v?.length || 0), 0) || 0;
  const hasUserVoted = pollData?.opts?.some((o: any) => o.v?.includes(user?.id));

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
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100%',
          maxHeight: 740,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
          background: currentStory.background || 'linear-gradient(135deg, #0F6B58, #18C8FF)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 18,
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
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
                  transition: idx === currentIndex && !isPaused ? 'width 6s linear' : 'none',
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
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                {currentStory.type === 'poll' ? 'Interactive Poll' : currentStory.type === 'qa' ? 'Q&A Story' : '24h Story'}
              </div>
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
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Story Body */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 16,
          }}
        >
          {/* POLL STORY */}
          {pollData ? (
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)',
                borderRadius: 18,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>
                {pollData.q}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {pollData.opts.map((opt: any, idx: number) => {
                  const votesCount = opt.v?.length || 0;
                  const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                  const isUserPick = opt.v?.includes(user?.id);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleVote(idx)}
                      disabled={hasUserVoted}
                      style={{
                        position: 'relative',
                        padding: '10px 14px',
                        borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        border: isUserPick ? '2px solid #2EE6A6' : '1px solid rgba(255,255,255,0.25)',
                        color: '#fff',
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: hasUserVoted ? 'default' : 'pointer',
                        overflow: 'hidden',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {/* Percent Fill bar */}
                      {hasUserVoted && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${percent}%`,
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            zIndex: 1,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      )}
                      <span style={{ position: 'relative', zIndex: 2 }}>{opt.t}</span>
                      {hasUserVoted && (
                        <span style={{ position: 'relative', zIndex: 2, fontWeight: 700, fontSize: 12 }}>
                          {percent}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {totalVotes} vote{totalVotes === 1 ? '' : 's'}
              </div>
            </div>
          ) : currentStory.type === 'qa' || currentStory.data?.qa ? (
            /* Q&A STORY */
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)',
                borderRadius: 18,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
                {currentStory.data?.qa?.q || currentStory.text || 'Ask me anything'}
              </div>

              {qaSubmitted ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#2EE6A6', padding: '12px 0' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Sent privately to {feed.displayName}!</span>
                </div>
              ) : (
                <form onSubmit={handleSendQaAnswer} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Type an answer..."
                    value={qaAnswer}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    onChange={(e) => setQaAnswer(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!qaAnswer.trim()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      color: '#0F6B58',
                      border: 'none',
                      cursor: qaAnswer.trim() ? 'pointer' : 'default',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* TEXT / PHOTO STORY */
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
          )}
        </div>

        {/* Bottom Story Navigation Controls */}
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
              border: 'none',
              cursor: currentIndex === 0 ? 'default' : 'pointer',
              opacity: currentIndex === 0 ? 0.3 : 1,
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {['❤️', '🔥', '😂', '👏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {}}
                style={{
                  fontSize: 18,
                  padding: '4px 6px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

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
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
