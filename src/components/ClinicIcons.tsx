import React from 'react';

export function HeroCategoryIcon({
  iconKey,
  className = 'w-7 h-7',
}: {
  iconKey: 'facial' | 'hair' | 'body' | 'breast' | 'reconstructive';
  className?: string;
}) {
  switch (iconKey) {
    case 'facial':
      return (
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
          <path d="M18 5C12.5 5 9 9.5 9 16c0 5.5 3.5 11.5 9 14 5.5-2.5 9-8.5 9-14 0-6.5-3.5-11-9-11Z" />
          <path d="M9 14c-1.5 0-2.5 1-2.5 2.5S7.5 19 9 19M27 14c1.5 0 2.5 1 2.5 2.5S28.5 19 27 19" />
          <path d="M14 15.5h2.5M19.5 15.5H22M18 15.5v4.5M15.5 23.5c1.5 1 3.5 1 5 0" strokeLinecap="round" />
        </svg>
      );
    case 'hair':
      return (
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
          <path d="M6 25c4-2 8-2 12 0s8 2 12 0" strokeLinecap="round" />
          <path d="M12 24c0-6 2-11 4-15M18 24c0-7 1.5-12 3.5-17M24 24c0-5 1.5-10 3-13" strokeLinecap="round" />
          <circle cx="12" cy="27" r="1.5" />
          <circle cx="18" cy="28" r="1.5" />
          <circle cx="24" cy="27" r="1.5" />
        </svg>
      );
    case 'body':
      return (
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
          <path d="M11 6c1.5 4.5 3 8 3 12s-2 7.5-3.5 12M25 6c-1.5 4.5-3 8-3 12s2 7.5 3.5 12" strokeLinecap="round" />
          <path d="M8 18h3.5m0 0-1.5-1.5M11.5 18 10 19.5M28 18h-3.5m0 0 1.5-1.5M24.5 18l1.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="21" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'breast':
      return (
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
          <path d="M11 7c-1 4-2 8-2 13 0 5 3.5 8 7 8 1.2 0 2-.5 2-.5s.8.5 2 .5c3.5 0 7-3 7-8 0-5-1-9-2-13" strokeLinecap="round" />
          <path d="M11 19c1.5 3.5 5.5 4 7 1.5 1.5 2.5 5.5 2 7-1.5" strokeLinecap="round" />
          <circle cx="14.5" cy="18.5" r="0.8" fill="currentColor" />
          <circle cx="21.5" cy="18.5" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'reconstructive':
      return (
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
          <path d="M14 7v3c0 2-5 3-7 6v13h22V16c-2-3-7-4-7-6V7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 13v16M13 19c2 1 8 1 10 0" strokeDasharray="2 2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function TrustStripIcon({
  iconKey,
  className = 'w-9 h-9',
}: {
  iconKey: 'surgeon' | 'shield' | 'plan' | 'lotus';
  className?: string;
}) {
  switch (iconKey) {
    case 'surgeon':
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.35" className={className} aria-hidden="true">
          <circle cx="20" cy="13" r="5" />
          <path d="M10 32c0-5.5 4.5-9.5 10-9.5s10 4 10 9.5" strokeLinecap="round" />
          <circle cx="11" cy="16" r="3.2" />
          <path d="M5 30c0-3.8 2.6-6.8 6.2-7.3" strokeLinecap="round" />
          <circle cx="29" cy="16" r="3.2" />
          <path d="M35 30c0-3.8-2.6-6.8-6.2-7.3" strokeLinecap="round" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.35" className={className} aria-hidden="true">
          <path d="M20 6 9 10.5v9.2c0 7.6 4.7 13.8 11 16.3 6.3-2.5 11-8.7 11-16.3v-9.2L20 6Z" strokeLinejoin="round" />
          <path d="m15.5 20.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'plan':
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.35" className={className} aria-hidden="true">
          <rect x="12" y="8" width="16" height="25" rx="1.5" />
          <path d="M7 16h5v17H7zM28 16h5v17h-5zM6 33h28" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12.5v4M18 14.5h4M16 21h8M16 25h8M18 33v-4h4v4" strokeLinecap="round" />
        </svg>
      );
    case 'lotus':
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.35" className={className} aria-hidden="true">
          <path d="M20 10c-3.5 4.5-5 9.5-5 14 0 3 2.2 5 5 5s5-2 5-5c0-4.5-1.5-9.5-5-14Z" strokeLinejoin="round" />
          <path d="M15 16c-4.5 1.5-8 5.5-8 9.5 0 2.5 3.5 4 8.5 3.5M25 16c4.5 1.5 8 5.5 8 9.5 0 2.5-3.5 4-8.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 31.5c3.5 1.5 16.5 1.5 20 0" strokeLinecap="round" />
        </svg>
      );
  }
}
