'use client';

/**
 * MatrixRain — Cyberpunk easter egg canvas overlay.
 * Triggered by pressing Ctrl+Shift+M. Shows a Matrix-style rain animation
 * for 5 seconds, then auto-dismisses. Click to dismiss early.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01VANGUARD';

export default function MatrixRain() {
  const [active, setActive] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Listen for Ctrl+Shift+M
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setActive(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), 5000);
    return () => clearTimeout(timer);
  }, [active]);

  // Canvas animation
  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#06b6d4';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Random green/cyan coloring
        ctx.fillStyle = Math.random() > 0.5 ? '#06b6d4' : '#10b981';
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      onClick={() => setActive(false)}
      className="fixed inset-0 z-[9999] cursor-pointer"
      style={{ opacity: 0.85 }}
    />
  );
}
