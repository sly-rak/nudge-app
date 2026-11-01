import React from 'react';
import { DownForStatus } from '@nudge/shared';

interface StatusChipProps {
  downFor?: DownForStatus;
  text?: string;
  compact?: boolean;
}

const CONFIG: Record<DownForStatus, { label: string; bg: string; color: string; border: string }> = {
  talk: { label: 'Down to talk', bg: 'rgba(37, 160, 108, 0.12)', color: 'var(--ok)', border: 'rgba(37, 160, 108, 0.3)' },
  play: { label: 'Down to play', bg: 'rgba(235, 193, 94, 0.15)', color: 'var(--gold)', border: 'rgba(235, 193, 94, 0.35)' },
  hang: { label: 'Down to hang', bg: 'rgba(122, 92, 255, 0.12)', color: '#7A5CFF', border: 'rgba(122, 92, 255, 0.3)' },
  heads_down: { label: 'Heads down', bg: 'rgba(223, 75, 47, 0.12)', color: 'var(--vanish)', border: 'rgba(223, 75, 47, 0.3)' },
};

export const StatusChip: React.FC<StatusChipProps> = ({ downFor = 'talk', text, compact }) => {
  const cfg = CONFIG[downFor] || CONFIG.talk;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: compact ? '2px 6px' : '3px 8px',
        borderRadius: 12,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: compact ? 11 : 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
      title={text ? `${cfg.label}: ${text}` : cfg.label}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: cfg.color,
          flexShrink: 0,
        }}
      />
      <span>{compact ? cfg.label.replace('Down to ', '') : cfg.label}</span>
      {text && !compact && (
        <span style={{ color: 'var(--ink)', opacity: 0.8, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          • {text}
        </span>
      )}
    </div>
  );
};
