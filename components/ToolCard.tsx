'use client';

import Link from 'next/link';

type ToolCardProps = {
  name: string;
  description: string;
  tags?: string[];
  url?: string;
  href?: string;
};

export default function ToolCard({ name, description, tags = [], url, href }: ToolCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-lg font-semibold text-ink">{name}</div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-ink/40 transition hover:text-ink"
            aria-label={`Visit ${name} website`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.72 5.72a.75.75 0 1 1-1.06-1.06l5.72-5.72H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </a>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-ink/70 leading-relaxed">{description}</p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={`${name}-${tag}`} className="chip">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  const cardClasses =
    'section-card glow-hover group block cursor-pointer p-6 transition duration-300 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    );
  }

  if (url) {
    return (
      <a href={url} className={cardClasses} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <div className="section-card p-6">{content}</div>;
}
