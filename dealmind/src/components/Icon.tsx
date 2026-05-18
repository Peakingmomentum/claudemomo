'use client';

import React from 'react';

type IconName =
  | 'mic' | 'send' | 'check' | 'chevron-right' | 'chevron-left'
  | 'plus' | 'spark' | 'pipeline' | 'calendar' | 'flame'
  | 'phone' | 'mail' | 'home' | 'logout';

const PATHS: Record<IconName, React.ReactNode> = {
  mic:           <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  send:          <path d="M3 11l18-8-7 18-3-7-8-3z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
  check:         <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  'chevron-right': <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
  'chevron-left':  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
  plus:          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  spark:         <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="currentColor" />,
  pipeline:      <path d="M3 7h18M3 12h18M3 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  calendar:      <><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" /></>,
  flame:         <path d="M12 3s4 4 4 8-2 6-4 6-4-2-4-6 4-8 4-8z" fill="currentColor" />,
  phone:         <path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" fill="none" />,
  mail:          <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  home:          <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" fill="none" />,
  logout:        <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
};

export function Icon({ name, size = 20, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color, flexShrink: 0 }}>
      {PATHS[name]}
    </svg>
  );
}
