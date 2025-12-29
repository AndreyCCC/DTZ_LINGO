import React, { useEffect, useRef } from 'react';

type DottedGlowBackgroundProps = {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  glowColor?: string;
  opacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
};

export default function DottedGlowBackground({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(88, 204, 2, 0.1)",
  glowColor = "rgba(88, 204, 2, 0.2)",
  opacity = 1,
  speedMin = 0.5,
  speedMax = 1.5,
  speedScale = 0.8,
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      // Используем window.innerWidth/Height для фиксированного позиционирования
      const width = window.innerWidth;
      const height = window.innerHeight;
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    let dots: { x: number; y: number; phase: number; speed: number }[] = [];

    const regenDots = () => {
      dots = [];
      const width = window.innerWidth;
      const height = window.innerHeight;
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          dots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: speedMin + Math.random() * (speedMax - speedMin),
          });
        }
      }
    };

    regenDots();

    const draw = (now: number) => {
      if (stopped) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      const time = (now / 1000) * speedScale;

      dots.forEach((d) => {
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const intensity = 0.1 + 0.9 * (lin * lin);

        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        
        if (intensity > 0.7) {
           ctx.fillStyle = glowColor;
        } else {
           ctx.fillStyle = color;
        }
        ctx.globalAlpha = opacity * (intensity > 0.7 ? 1 : 0.3 + intensity * 0.5); 
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [gap, radius, color, glowColor, opacity, speedMin, speedMax, speedScale]);

  return (
    <div ref={containerRef} className={className} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}