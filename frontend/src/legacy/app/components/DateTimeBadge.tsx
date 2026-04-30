"use client";
import React, { useEffect, useState } from 'react';

type Props = {
  icon?: React.ReactNode;
  className?: string;
};

export default function DateTimeBadge({ icon, className = '' }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000); // update every 30s
    return () => clearInterval(t);
  }, []);

  const day = now.toLocaleDateString(undefined, { weekday: 'short' });
  const date = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs border border-white/20 text-white/70 backdrop-blur-sm ${className}`}
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      {icon && <span className="inline mr-1.5 align-middle">{icon}</span>}
      <span className="font-medium">{day}</span>
      <span className="mx-1">·</span>
      <span>{date}</span>
      <span className="mx-1">·</span>
      <span className="ml-0">{time}</span>
    </div>
  );
}
