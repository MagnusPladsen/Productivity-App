'use client';

import { useEffect, useState, useTransition } from 'react';
import { relativeTime } from '@/lib/format';

type RefreshButtonProps = {
  token?: string;
  fetchedAt?: number;
};

export default function RefreshButton({ token, fetchedAt }: RefreshButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [timeLabel, setTimeLabel] = useState('');

  useEffect(() => {
    if (!fetchedAt) return;
    const update = () => setTimeLabel(relativeTime(fetchedAt));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [fetchedAt]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleRefresh = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          if (response.status === 429) {
            const retryAfter = typeof payload.retryAfter === 'number' ? payload.retryAfter : 60;
            setCooldownUntil(Date.now() + retryAfter * 1000);
            setMessage(payload.message || `Please wait ${retryAfter}s before refreshing again.`);
            return;
          }
          throw new Error(payload.message || 'Failed to refresh');
        }

        setCooldownUntil(Date.now() + 60_000);
        setTimeLabel('just now');
        setMessage('Refreshed. New data will appear shortly.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to refresh');
      }
    });
  };

  const isCoolingDown = cooldownUntil !== null && secondsLeft > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleRefresh}
        className="glow-hover rounded-full border border-ink/20 bg-ink px-5 py-2 text-sm font-semibold text-paper shadow-lift transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
        disabled={isPending || isCoolingDown}
      >
        {isPending ? 'Refreshing\u2026' : isCoolingDown ? `Wait ${secondsLeft}s` : 'Refresh data'}
      </button>
      {timeLabel ? (
        <span className="text-xs text-ink/50">Updated {timeLabel}</span>
      ) : null}
      {message ? <p className="text-xs text-ink/60">{message}</p> : null}
    </div>
  );
}
