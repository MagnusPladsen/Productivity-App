'use client';

import { useEffect, useState } from 'react';

type CategoryLink = {
  id: string;
  name: string;
};

type CategoryIndexProps = {
  categories: CategoryLink[];
  className?: string;
  title?: string;
  variant?: 'stack' | 'wrap';
};

export default function CategoryIndex({
  categories,
  className,
  title = 'Index',
  variant = 'stack'
}: CategoryIndexProps) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? '');

  useEffect(() => {
    if (categories.length === 0) return;
    const elements = categories
      .map((category) => document.getElementById(category.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: [0, 0.2, 0.5, 1]
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <div className={className}>
      <p className="eyebrow">{title}</p>
      <div className={`mt-4 ${variant === 'wrap' ? 'flex flex-wrap gap-3' : 'flex flex-col gap-2'}`}>
        {categories.map((category) => {
          const isActive = category.id === activeId;
          const activeClass =
            variant === 'wrap'
              ? 'border-ink/40 bg-paper text-ink shadow-lift'
              : 'border-ink/40 bg-paper shadow-lift';
          return (
            <a
              key={category.id}
              href={`#${category.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={`chip glow-hover cursor-pointer transition hover:border-ink/30 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                isActive ? activeClass : ''
              }`}
            >
              {category.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}
