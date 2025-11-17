'use client';

import { useState, useEffect } from 'react';
import { isDemoMode, disableDemoMode } from '@/lib/demo';

export default function DemoBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(isDemoMode());
  }, []);

  if (!showBanner) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <span style={styles.icon}>🎭</span>
        <span style={styles.text}>Demo Mode Active</span>
        <button
          onClick={() => {
            disableDemoMode();
            setShowBanner(false);
          }}
          style={styles.closeButton}
          aria-label="Exit demo mode"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    color: 'white',
    zIndex: 9999,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  icon: {
    fontSize: '1rem',
  },
  text: {
    flex: '1',
    textAlign: 'center' as const,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    lineHeight: 1,
  },
};
