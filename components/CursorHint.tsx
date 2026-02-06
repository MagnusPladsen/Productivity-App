'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cursor-enabled';
const HINT_KEY = 'cursor-hint-dismissed';

export default function CursorHint() {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(HINT_KEY) === 'true';
    if (!dismissed) {
      setVisible(true);
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const isEnabled = stored !== 'off';
    setEnabled(isEnabled);
    document.documentElement.setAttribute('data-cursor', isEnabled ? 'on' : 'off');

    const handleExternal = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
      if (!detail) return;
      setEnabled(detail.enabled);
      document.documentElement.setAttribute('data-cursor', detail.enabled ? 'on' : 'off');
    };

    window.addEventListener('cursor-toggle', handleExternal);
    return () => window.removeEventListener('cursor-toggle', handleExternal);
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    document.documentElement.setAttribute('data-cursor', next ? 'on' : 'off');
    window.dispatchEvent(new CustomEvent('cursor-toggle', { detail: { enabled: next } }));
  };

  const dismiss = () => {
    setVisible(false);
    window.localStorage.setItem(HINT_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <div className="cursor-hint">
      <div className="cursor-hint-card">
        <div className="text-sm font-semibold text-ink">Custom cursor enabled.</div>
        <div className="mt-1 text-xs text-ink/60">Toggle it off if you prefer the default pointer.</div>
        <div className="cursor-hint-actions">
          <button type="button" className="cursor-toggle" onClick={toggle}>
            Cursor {enabled ? 'On' : 'Off'}
          </button>
          <button type="button" className="cursor-toggle" onClick={dismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
