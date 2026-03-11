import Link from 'next/link';

type ToolCardProps = {
  name: string;
  description: string;
  tags?: string[];
  url?: string;
  href?: string;
  stars?: string;
};

export default function ToolCard({ name, description, tags = [], url, href, stars }: ToolCardProps) {
  const externalIcon = url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="shrink-0 text-ink/40 transition hover:text-ink"
      aria-label={`Visit ${name} website`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.72 5.72a.75.75 0 1 1-1.06-1.06l5.72-5.72H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    </a>
  ) : null;

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-ink">{name}</span>
          {stars ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
              </svg>
              {stars}
            </span>
          ) : null}
        </div>
        {externalIcon}
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
