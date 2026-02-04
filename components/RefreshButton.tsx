'use client';

import { useEffect, useState, useTransition } from 'react';

type RefreshButtonProps = {
  token?: string;
};

export default function RefreshButton({ token }: RefreshButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

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
        setMessage('Refreshed. New data will appear shortly.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to refresh');
      }
    });
  };

  const isCoolingDown = cooldownUntil !== null && secondsLeft > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        className="rounded-full border border-white/20 bg-white/10 text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 disabled:opacity-60"
        disabled={isPending || isCoolingDown}
      >
        {isPending ? 'Refreshing…' : isCoolingDown ? `Wait ${secondsLeft}s` : 'Refresh data'}
      </button>
      {message ? <p className="text-xs text-white/60">{message}</p> : null}
    </div>
  );
}
