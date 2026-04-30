import { BadgeCheck, Star, ShieldAlert } from 'lucide-react';

export type BadgeStatus = 'Not Verified' | 'Verified' | 'Expert';

interface TutorBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md' | 'lg';
  /** Show only the icon pill without the label text */
  iconOnly?: boolean;
}

const CONFIG: Record<
  BadgeStatus,
  { icon: React.ReactNode; label: string; color: string; bg: string; border: string; glow: string }
> = {
  'Not Verified': {
    icon: <ShieldAlert className="shrink-0" />,
    label: 'Not Verified',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.25)',
    glow: 'rgba(107,114,128,0)',
  },
  Verified: {
    icon: <BadgeCheck className="shrink-0" />,
    label: 'Verified',
    color: '#7ab8ba',
    bg: 'rgba(122,184,186,0.12)',
    border: 'rgba(122,184,186,0.35)',
    glow: 'rgba(122,184,186,0.3)',
  },
  Expert: {
    icon: <Star className="shrink-0" />,
    label: 'Expert',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.35)',
    glow: 'rgba(139,92,246,0.35)',
  },
};

const SIZE_ICON: Record<string, string> = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

const SIZE_TEXT: Record<string, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

const SIZE_PAD: Record<string, string> = {
  sm: 'px-2 py-0.5 gap-1',
  md: 'px-2.5 py-1 gap-1.5',
  lg: 'px-3 py-1.5 gap-2',
};

export function TutorBadge({ status, size = 'md', iconOnly = false }: TutorBadgeProps) {
  const c = CONFIG[status];
  const iconClass = SIZE_ICON[size];

  const iconEl = (
    <span style={{ color: c.color }}>
      {/* clone with className */}
      {status === 'Expert' ? (
        <Star className={`${iconClass} fill-current`} />
      ) : status === 'Verified' ? (
        <BadgeCheck className={iconClass} />
      ) : (
        <ShieldAlert className={iconClass} />
      )}
    </span>
  );

  if (iconOnly) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          width: size === 'sm' ? 20 : size === 'md' ? 24 : 28,
          height: size === 'sm' ? 20 : size === 'md' ? 24 : 28,
          boxShadow: status !== 'Not Verified' ? `0 0 8px ${c.glow}` : 'none',
        }}
        title={c.label}
      >
        {iconEl}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full ${SIZE_PAD[size]} ${SIZE_TEXT[size]}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: status !== 'Not Verified' ? `0 0 10px ${c.glow}` : 'none',
      }}
    >
      {iconEl}
      {c.label}
    </span>
  );
}
