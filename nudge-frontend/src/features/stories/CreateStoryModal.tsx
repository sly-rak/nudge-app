import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { X, Send, Plus, Trash2, HelpCircle, BarChart2, Type } from 'lucide-react';

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

const GRADIENTS = [
  'linear-gradient(135deg, #0F6B58, #18C8FF)',
  'linear-gradient(135deg, #FF3D7F, #7A5CFF)',
  'linear-gradient(135deg, #FFB02E, #DF4B2F)',
  'linear-gradient(135deg, #1A1F35, #0F6B58)',
  'linear-gradient(135deg, #2D1B69, #1D2A44)',
  '#0F6B58',
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onStoryCreated }) => {
  const [storyType, setStoryType] = useState<'text' | 'poll' | 'qa'>('text');
  const [text, setText] = useState('');
  const [background, setBackground] = useState(GRADIENTS[0]);
  const [audience, setAudience] = useState<'public' | 'friends' | 'close'>('friends');
  const [isPosting, setIsPosting] = useState(false);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  // QA state
  const [qaQuestion, setQaQuestion] = useState('Ask me anything 💬');

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
    }
  };

  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updatePollOption = (idx: number, val: string) => {
    setPollOptions((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    try {
      if (storyType === 'text') {
        if (!text.trim()) return;
        await api.createStory({
          type: 'text',
          text: text.trim(),
          background,
          audience,
        });
      } else if (storyType === 'poll') {
        if (!pollQuestion.trim()) return;
        const opts = pollOptions.filter((o) => o.trim().length > 0).map((t) => ({ t: t.trim(), v: [] }));
        await api.createStory({
          type: 'poll',
          text: pollQuestion.trim(),
          background,
          audience,
          data: {
            poll: {
              q: pollQuestion.trim(),
              opts,
            },
          },
        });
      } else if (storyType === 'qa') {
        if (!qaQuestion.trim()) return;
        await api.createStory({
          type: 'qa',
          text: qaQuestion.trim(),
          background,
          audience,
          data: {
            qa: {
              q: qaQuestion.trim(),
              answers: [],
            },
          },
        });
      }

      onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create story:', err);
    } finally {
      setIsPosting(false);
    }
  };

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
          height: 640,
          borderRadius: 20,
          background,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 20,
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {/* Story Type Selector Tabs */}
            <div style={{ display: 'flex', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 20 }}>
              <button
                type="button"
                onClick={() => setStoryType('text')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: storyType === 'text' ? 700 : 500,
                  backgroundColor: storyType === 'text' ? '#fff' : 'transparent',
                  color: storyType === 'text' ? '#0F6B58' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Type size={13} />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setStoryType('poll')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: storyType === 'poll' ? 700 : 500,
                  backgroundColor: storyType === 'poll' ? '#fff' : 'transparent',
                  color: storyType === 'poll' ? '#0F6B58' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <BarChart2 size={13} />
                <span>Poll</span>
              </button>
              <button
                type="button"
                onClick={() => setStoryType('qa')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: storyType === 'qa' ? 700 : 500,
                  backgroundColor: storyType === 'qa' ? '#fff' : 'transparent',
                  color: storyType === 'qa' ? '#0F6B58' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <HelpCircle size={13} />
                <span>Question</span>
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.35)',
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

          {/* Audience selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Audience:</span>
            {(['friends', 'public', 'close'] as const).map((aud) => (
              <button
                key={aud}
                type="button"
                onClick={() => setAudience(aud)}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 12,
                  backgroundColor: audience === aud ? 'rgba(255,255,255,0.3)' : 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  fontWeight: audience === aud ? 700 : 500,
                }}
              >
                {aud === 'friends' ? 'Friends' : aud === 'public' ? 'Everyone' : 'Close Friends'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body based on story type */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '20px 0' }}>
          {storyType === 'text' && (
            <textarea
              placeholder="What's happening? Type your story..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              style={{
                background: 'none',
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: 600,
                textAlign: 'center',
                resize: 'none',
                border: 'none',
                outline: 'none',
                width: '100%',
                height: 180,
                lineHeight: 1.4,
              }}
              autoFocus
            />
          )}

          {storyType === 'poll' && (
            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                maxLength={90}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '8px 4px',
                  outline: 'none',
                }}
                autoFocus
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => updatePollOption(idx, e.target.value)}
                      maxLength={40}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePollOption(idx)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '6px',
                    borderRadius: 8,
                    background: 'none',
                    border: '1px dashed rgba(255,255,255,0.4)',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>Add option</span>
                </button>
              )}
            </div>
          )}

          {storyType === 'qa' && (
            <div
              style={{
                backgroundColor: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <HelpCircle size={28} color="#FFB02E" style={{ margin: '0 auto' }} />
              <input
                type="text"
                placeholder="Ask me anything..."
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                maxLength={90}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '8px 4px',
                  outline: 'none',
                }}
                autoFocus
              />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                Friends can reply directly to your question via private message.
              </span>
            </div>
          )}
        </div>

        {/* Bottom Bar: Gradients & Submit */}
        <div>
          {/* Gradient selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            {GRADIENTS.map((g, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setBackground(g)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: g,
                  border: background === g ? '2px solid #FFFFFF' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPosting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              color: '#0F6B58',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              border: 'none',
              cursor: isPosting ? 'default' : 'pointer',
            }}
          >
            <Send size={16} />
            <span>{isPosting ? 'Sharing...' : 'Share to Story'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
