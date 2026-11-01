import React from 'react';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
  online?: boolean;
}

const COLORS = [
  '#0F6B58', '#25A06C', '#DF4B2F', '#7A5CFF', '#18C8FF', '#FF3D7F', '#B45309', '#0D9488'
];

function getInitials(name: string = ''): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name[0] || 'U').toUpperCase();
}

function getColor(name: string = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export const Avatar: React.FC<AvatarProps> = ({ url, name = 'User', size = 42, online }) => {
  const initials = getInitials(name);
  const bgColor = getColor(name);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {url ? (
        <img
          src={url}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: bgColor,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: size * 0.4,
            userSelect: 'none',
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.max(10, size * 0.28),
            height: Math.max(10, size * 0.28),
            borderRadius: '50%',
            backgroundColor: 'var(--ok)',
            border: '2px solid var(--panel)',
          }}
        />
      )}
    </div>
  );
};
