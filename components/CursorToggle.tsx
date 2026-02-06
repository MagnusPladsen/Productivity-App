'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cursor-enabled';

export default function CursorToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
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

  return (
    <button type="button" className="cursor-toggle" onClick={toggle}>
      Cursor {enabled ? 'On' : 'Off'}
    </button>
  );
}
