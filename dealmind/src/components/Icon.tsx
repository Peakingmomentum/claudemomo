'use client';

import React from 'react';

type IconName =
  | 'mic' | 'send' | 'check' | 'chevron-right' | 'chevron-left'
  | 'plus' | 'spark' | 'pipeline' | 'calendar' | 'flame'
  | 'phone' | 'mail' | 'home' | 'logout'
  | 'target' | 'clock' | 'bulb' | 'bolt' | 'search'
  | 'chart-bar' | 'warning' | 'dollar' | 'building'
  | 'layers' | 'upload' | 'refresh' | 'user' | 'map-pin'
  | 'message' | 'star' | 'link' | 'menu';

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
  logout:        <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  target:        <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
  clock:         <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></>,
  bulb:          <><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 5 11.9V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2.1A7 7 0 0 1 12 2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" /></>,
  bolt:          <path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
  search:        <><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
  'chart-bar':   <path d="M3 20h18M7 20V10M12 20V4M17 20v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  warning:       <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" /><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
  dollar:        <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
  building:      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  layers:        <><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" /><path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  upload:        <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>,
  refresh:       <path d="M3 12a9 9 0 1 0 1-4.5M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  user:          <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  'map-pin':     <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  message:       <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
  star:          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
  link:          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
  menu:          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
};

export function Icon({ name, size = 20, color = 'currentColor', title }: { name: IconName; size?: number; color?: string; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color, flexShrink: 0 }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
