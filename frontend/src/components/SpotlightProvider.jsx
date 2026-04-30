'use client';

/**
 * SpotlightProvider — Tracks cursor position and sets CSS custom properties
 * for the glassmorphism spotlight glow effect across all glass cards.
 */

import { useEffect, useCallback } from 'react';

export default function SpotlightProvider({ children }) {
  const handlePointerMove = useCallback((e) => {
    const { clientX, clientY } = e;
    document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);
  }, []);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    return () => document.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  return <>{children}</>;
}
