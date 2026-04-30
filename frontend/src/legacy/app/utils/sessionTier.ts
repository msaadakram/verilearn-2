import type { SessionTier } from '../services/auth';

export interface SessionTierMeta {
  label: SessionTier;
  icon: 'star' | 'gem';
  color: string;
  bg: string;
  border: string;
  glow: string;
  description: string;
}

export function getSessionTier(successfulSessions = 0): SessionTier {
  const count = Number(successfulSessions) || 0;

  if (count >= 30) {
    return 'Diamond';
  }

  if (count >= 10) {
    return 'Gold';
  }

  return 'Bronze';
}

export const SESSION_TIER_META: Record<SessionTier, SessionTierMeta> = {
  Bronze: {
    label: 'Bronze',
    icon: 'star',
    color: '#cd7f32',
    bg: 'rgba(205,127,50,0.12)',
    border: 'rgba(205,127,50,0.28)',
    glow: 'rgba(205,127,50,0.18)',
    description: 'Up-and-coming tutor with up to 9 successful live sessions.',
  },
  Gold: {
    label: 'Gold',
    icon: 'star',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.28)',
    glow: 'rgba(245,158,11,0.22)',
    description: 'Trusted tutor with 10–29 successful live sessions.',
  },
  Diamond: {
    label: 'Diamond',
    icon: 'gem',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.28)',
    glow: 'rgba(56,189,248,0.24)',
    description: 'Elite tutor with 30+ successful live sessions.',
  },
};
