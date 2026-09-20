'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  colorType: 'primary' | 'accent' | 'spore';
}

interface ConstellationBackgroundProps {
  className?: string;
  /** Max distance between stars to draw constellation line (default 115px) */
  connectionDistance?: number;
  /** Mouse repulsion radius (default 140px) */
  repulsionRadius?: number;
}

export function ConstellationBackground({
  className = '',
  connectionDistance = 115,
  repulsionRadius = 140,
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let width = 0;
    let height = 0;

    // Check system preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resizeCanvas() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx?.scale(dpr, dpr);
      initStars();
    }

    function initStars() {
      // Density: ~1 star per 15,000 px^2, bounded between 40 and 110 stars
      const count = Math.min(110, Math.max(40, Math.floor((width * height) / 15000)));
      stars = [];

      for (let i = 0; i < count; i++) {
        // Slow natural cosmic drift
        const baseVx = prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.35;
        const baseVy = prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.35;

        // Color distribution: 75% primary, 18% lavender accent, 7% spore green
        const rand = Math.random();
        const colorType: Star['colorType'] =
          rand < 0.75 ? 'primary' : rand < 0.93 ? 'accent' : 'spore';

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: baseVx,
          vy: baseVy,
          baseVx,
          baseVy,
          radius: Math.random() * 1.6 + 1.3, // 1.3px to 2.9px
          baseAlpha: Math.random() * 0.35 + 0.55,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          colorType,
        });
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: null, y: null };
    }

    function render() {
      if (!ctx) return;

      const dark = isDarkRef.current ?? document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const mouseX = mouse.x;
      const mouseY = mouse.y;

      // 1. Update positions & apply mouse repulsion
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Twinkle phase
        star.phase += star.twinkleSpeed;

        // Mouse repulsion physics
        if (mouseX !== null && mouseY !== null && !prefersReducedMotion) {
          const dx = star.x - mouseX;
          const dy = star.y - mouseY;
          const dist = Math.hypot(dx, dy);

          if (dist < repulsionRadius && dist > 0) {
            // Repel force inversely proportional to distance
            const force = ((repulsionRadius - dist) / repulsionRadius) * 2.8;
            const nx = dx / dist;
            const ny = dy / dist;

            star.vx += nx * force * 0.28;
            star.vy += ny * force * 0.28;
          }
        }

        // Dampen velocity back to base drift smoothly
        star.vx = star.vx * 0.95 + star.baseVx * 0.05;
        star.vy = star.vy * 0.95 + star.baseVy * 0.05;

        star.x += star.vx;
        star.y += star.vy;

        // Wrap around screen boundaries with margin
        const margin = 20;
        if (star.x < -margin) star.x = width + margin;
        else if (star.x > width + margin) star.x = -margin;
        if (star.y < -margin) star.y = height + margin;
        else if (star.y > height + margin) star.y = -margin;
      }

      // 2. Draw Constellation lines between nearby stars
      const starLen = stars.length;
      for (let i = 0; i < starLen; i++) {
        const s1 = stars[i];
        for (let j = i + 1; j < starLen; j++) {
          const s2 = stars[j];
          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDistance) {
            const lineFactor = 1 - dist / connectionDistance;
            // Opacity: subtle violet/lavender in dark, crisp delicate lavender in light
            const lineAlpha = dark
              ? lineFactor * 0.2
              : lineFactor * 0.22;

            ctx.strokeStyle = dark
              ? `rgba(185, 151, 255, ${lineAlpha})`
              : `rgba(124, 58, 237, ${lineAlpha})`;
            ctx.lineWidth = dark ? 0.85 : 1.0;

            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }

        // Draw line from nearby star to mouse cursor if close
        if (mouseX !== null && mouseY !== null && !prefersReducedMotion) {
          const dx = s1.x - mouseX;
          const dy = s1.y - mouseY;
          const dist = Math.hypot(dx, dy);

          if (dist < repulsionRadius * 0.9) {
            const mouseLineFactor = 1 - dist / (repulsionRadius * 0.9);
            const mouseLineAlpha = dark
              ? mouseLineFactor * 0.22
              : mouseLineFactor * 0.25;

            ctx.strokeStyle = dark
              ? `rgba(0, 245, 117, ${mouseLineAlpha})` // Signal green trace in dark mode
              : `rgba(124, 58, 237, ${mouseLineAlpha})`; // Lavender trace in light mode
            ctx.lineWidth = dark ? 0.75 : 0.95;

            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
          }
        }
      }

      // 3. Draw Stars
      for (let i = 0; i < starLen; i++) {
        const star = stars[i];
        const twinkle = 0.75 + 0.25 * Math.sin(star.phase);
        const currentAlpha = star.baseAlpha * twinkle;

        let fillStyle: string;
        if (dark) {
          // Dark Mode palette (Doppler Midnight Vault)
          if (star.colorType === 'spore') {
            fillStyle = `rgba(0, 245, 117, ${currentAlpha * 0.95})`; // Signal green
          } else if (star.colorType === 'accent') {
            fillStyle = `rgba(185, 151, 255, ${currentAlpha * 0.9})`; // Lavender spark
          } else {
            fillStyle = `rgba(241, 240, 236, ${currentAlpha * 0.85})`; // Bone white
          }
        } else {
          // Light Mode palette (Daylight Vault — rich, distinct lavender & violet tones)
          if (star.colorType === 'spore') {
            fillStyle = `rgba(0, 135, 68, ${currentAlpha * 0.85})`; // Rich emerald green
          } else if (star.colorType === 'accent') {
            fillStyle = `rgba(107, 19, 245, ${currentAlpha * 0.9})`; // Deep neon violet
          } else {
            fillStyle = `rgba(124, 58, 237, ${currentAlpha * 0.82})`; // Bold lavender spark
          }
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();

        // Subtle glow halo for larger accent stars
        if (star.radius > 1.9) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = dark
            ? (star.colorType === 'spore'
                ? `rgba(0, 245, 117, ${currentAlpha * 0.15})`
                : `rgba(185, 151, 255, ${currentAlpha * 0.15})`)
            : (star.colorType === 'spore'
                ? `rgba(0, 135, 68, ${currentAlpha * 0.14})`
                : `rgba(124, 58, 237, ${currentAlpha * 0.18})`);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    // Visibility change handler: pause loop when tab is backgrounded
    function handleVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionDistance, repulsionRadius]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-opacity duration-700 ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
