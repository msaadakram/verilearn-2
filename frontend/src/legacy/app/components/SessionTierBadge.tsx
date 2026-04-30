import { Gem, Star } from 'lucide-react';
import type { SessionTier } from '../services/auth';
import { SESSION_TIER_META } from '../utils/sessionTier';

interface SessionTierBadgeProps {
  tier: SessionTier;
  sessions?: number;
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
}

const SIZE_ICON: Record<string, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const SIZE_PAD: Record<string, string> = {
  sm: 'px-2 py-0.5 gap-1',
  md: 'px-2.5 py-1 gap-1.5',
  lg: 'px-3 py-1.5 gap-2',
};

export function SessionTierBadge({ tier, sessions, size = 'md', iconOnly = false }: SessionTierBadgeProps) {
  const meta = SESSION_TIER_META[tier];
  const iconClass = SIZE_ICON[size];

  const iconEl = meta.icon === 'gem'
    ? <Gem className={`${iconClass} fill-current`} />
    : <Star className={`${iconClass} fill-current`} />;

  if (iconOnly) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{
          background: meta.bg,
          border: `1px solid ${meta.border}`,
          width: size === 'sm' ? 20 : size === 'md' ? 24 : 28,
          height: size === 'sm' ? 20 : size === 'md' ? 24 : 28,
          boxShadow: `0 0 10px ${meta.glow}`,
          color: meta.color,
        }}
        title={`${meta.label}${typeof sessions === 'number' ? ` · ${sessions} sessions` : ''}`}
      >
        {iconEl}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full ${SIZE_PAD[size]} text-xs font-semibold`}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.color,
        boxShadow: `0 0 10px ${meta.glow}`,
      }}
    >
      {iconEl}
      {meta.label}
      {typeof sessions === 'number' && (
        <span style={{ opacity: 0.8, fontWeight: 600 }}>{sessions}</span>
      )}
    </span>
  );
}
