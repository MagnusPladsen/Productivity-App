'use client';

import { useState, useTransition } from 'react';

type RefreshButtonProps = {
  token?: string;
};

export default function RefreshButton({ token }: RefreshButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
          const text = await response.text();
          throw new Error(text || 'Failed to refresh');
        }

        setMessage('Refreshed. New data will appear shortly.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to refresh');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleRefresh}
        className="rounded-full border border-black/10 bg-black text-white px-5 py-2 text-sm font-semibold shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black/90 disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? 'Refreshing…' : 'Refresh data'}
      </button>
      {message ? <p className="text-xs text-black/60">{message}</p> : null}
    </div>
  );
}
