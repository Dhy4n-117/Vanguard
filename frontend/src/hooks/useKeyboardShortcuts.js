'use client';

/**
 * useKeyboardShortcuts — Reusable hook for registering global keyboard shortcuts.
 *
 * Accepts an array of shortcut descriptors and attaches a single keydown listener.
 * Automatically prevents default browser behaviour for matched combos and cleans
 * up on unmount or when the shortcut list changes.
 *
 * @param {Array<{
 *   key: string,
 *   ctrl?: boolean,
 *   shift?: boolean,
 *   alt?: boolean,
 *   meta?: boolean,
 *   action: () => void,
 *   description?: string
 * }>} shortcuts — Shortcut descriptors
 */

import { useEffect, useCallback, useRef } from 'react';

export default function useKeyboardShortcuts(shortcuts) {
  // Keep a stable ref so the listener always sees the latest shortcuts
  // without re-attaching on every render.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e) => {
    // Skip when user is typing in an input / textarea / contentEditable
    const tag = e.target.tagName;
    const isEditable =
      tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

    const list = shortcutsRef.current;
    if (!list || list.length === 0) return;

    for (const shortcut of list) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
      const shiftMatch = !!shortcut.shift === e.shiftKey;
      const altMatch = !!shortcut.alt === e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // Allow the '?' help shortcut even in inputs — everything else
        // should be blocked when inside an editable field.
        if (isEditable && shortcut.key !== '?') continue;

        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
