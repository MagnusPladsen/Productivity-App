'use client';

import { useEffect, useRef } from 'react';

export default function PointerGlow() {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const root = document.documentElement;
    const layer = layerRef.current;
    const orb = orbRef.current;
    const core = coreRef.current;
    const icon = iconRef.current;
    if (!layer || !orb || !core || !icon) return;

    let rafId = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const update = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      root.style.setProperty('--cursor-x', `${(currentX / window.innerWidth) * 100}%`);
      root.style.setProperty('--cursor-y', `${(currentY / window.innerHeight) * 100}%`);

      const orbOffset = 80;
      const coreOffset = 14;
      const iconOffset = 11;
      orb.style.transform = `translate3d(${currentX - orbOffset}px, ${currentY - orbOffset}px, 0)`;
      core.style.transform = `translate3d(${currentX - coreOffset}px, ${currentY - coreOffset}px, 0)`;
      icon.style.transform = `translate3d(${currentX - iconOffset}px, ${currentY - iconOffset}px, 0)`;

      rafId = requestAnimationFrame(update);
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!layer.classList.contains('is-active')) {
        layer.classList.add('is-active');
      }
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    const handleLeave = () => {
      layer.classList.remove('is-active');
      targetX = window.innerWidth / 2;
      targetY = window.innerHeight / 2;
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerleave', handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={layerRef} className="cursor-layer" aria-hidden="true">
      <div ref={orbRef} className="cursor-orb" />
      <div ref={coreRef} className="cursor-core" />
      <div ref={iconRef} className="cursor-icon" />
    </div>
  );
}
