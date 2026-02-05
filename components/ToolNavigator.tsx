'use client';

import { useEffect, useMemo, useState } from 'react';

export type NavItem = {
  id: string;
  label: string;
  kind: 'category' | 'tool';
  category: string;
};

type ToolNavigatorProps = {
  items: NavItem[];
};

export default function ToolNavigator({ items }: ToolNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(trimmed) || item.category.toLowerCase().includes(trimmed)
    ).slice(0, 10);
  }, [items, query]);

  const handleJump = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div
          id="tool-navigator"
          role="dialog"
          aria-label="Navigate tools"
          className="w-[90vw] max-w-sm rounded-[26px] border border-ink/10 bg-paper/95 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">Go to</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-xs text-ink/70 transition hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Close
            </button>
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories or tools"
              className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-ink/40 focus:outline-none"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={filtered.length > 0}
              aria-controls="tool-navigator-results"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTop}
              className="rounded-full border border-ink/15 bg-paper px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70 transition hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Back to top
            </button>
            <span className="text-xs text-ink/50">{filtered.length} results</span>
          </div>
          <div id="tool-navigator-results" className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink/60">
                No matches found.
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => handleJump(item.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-paper px-4 py-3 text-left text-sm text-ink/80 transition hover:border-ink/30 hover:bg-paper/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50">
                    {item.kind === 'category' ? 'Category' : item.category}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`mt-4 flex items-center gap-2 rounded-full border border-ink/20 bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-paper shadow-2xl shadow-black/20 transition hover:border-ink/40 hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-expanded={isOpen}
        aria-controls="tool-navigator"
      >
        Go to
        <span className="text-base">⌘</span>
      </button>
    </div>
  );
}
