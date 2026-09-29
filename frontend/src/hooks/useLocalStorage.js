'use client';

/**
 * useLocalStorage — Custom hook for persisting state in localStorage.
 * Useful for saving user preferences like sidebar collapsed state,
 * filter selections, dark mode toggle, etc.
 * 
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Default value if nothing stored
 * @returns {[value, setValue]} - Stateful value and setter
 */

import { useState, useEffect, useCallback } from 'react';

export default function useLocalStorage(key, initialValue) {
  // Initialize state from localStorage or fallback
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  // Sync to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`[useLocalStorage] Error writing key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Wrapped setter that also handles function updates
  const setValue = useCallback((value) => {
    setStoredValue(prev => value instanceof Function ? value(prev) : value);
  }, []);

  // Remove method
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
