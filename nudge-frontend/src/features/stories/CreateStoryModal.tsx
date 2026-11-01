import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { X, Send } from 'lucide-react';

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: () => void;
}

const GRADIENTS = [
  'linear-gradient(135deg, #0F6B58, #18C8FF)',
  'linear-gradient(135deg, #FF3D7F, #7A5CFF)',
  'linear-gradient(135deg, #FFB02E, #DF4B2F)',
  'linear-gradient(135deg, #121C18, #25A06C)',
  '#0F6B58',
  '#7A5CFF',
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onStoryCreated }) => {
  const [text, setText] = useState('');
  const [background, setBackground] = useState(GRADIENTS[0]);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsPosting(true);
    try {
      await api.createStory({
        type: 'text',
        text: text.trim(),
        background,
        audience: 'friends',
      });
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
        backgroundColor: 'rgba(0,0,0,0.8)',
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
          maxWidth: 400,
          height: 600,
          borderRadius: 16,
          background,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 18,
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Create Story (24h)</span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', display: 'grid', placeItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

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

        <div>
          {/* Gradient selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            {GRADIENTS.map((g, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setBackground(g)}
                style={{
                  width: 28,
                  height: 28,
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
            disabled={!text.trim() || isPosting}
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
              opacity: !text.trim() ? 0.6 : 1,
            }}
          >
            <Send size={16} />
            <span>{isPosting ? 'Posting...' : 'Share to Story'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
