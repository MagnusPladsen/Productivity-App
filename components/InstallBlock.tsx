'use client';

import { useState } from 'react';

type InstallBlockProps = {
  sections: Array<{
    label: string;
    blocks: Array<{ label?: string; code: string; lang: string }>;
  }>;
};

export default function InstallBlock({ sections }: InstallBlockProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (sections.length === 0) return null;

  const active = sections[activeIndex];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {sections.map((section, i) => (
          <button
            key={section.label}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
              i === activeIndex
                ? 'bg-ink text-paper shadow-lift'
                : 'border border-ink/20 bg-paper text-ink/70 hover:border-ink/40 hover:text-ink'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {active.blocks.map((block) => (
          <div key={`${block.lang}-${block.label ?? ''}-${block.code.slice(0, 40)}`}>
            {block.label ? (
              <p className="mb-2 text-xs font-semibold text-ink/60">{block.label}</p>
            ) : null}
            <pre className="overflow-x-auto rounded-2xl border border-ink/15 bg-clay px-6 py-4 text-sm text-ink/90">
              <code>{block.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
