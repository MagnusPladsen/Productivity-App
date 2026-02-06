type ToolCardProps = {
  name: string;
  description: string;
  tags?: string[];
  url?: string;
};

export default function ToolCard({ name, description, tags = [], url }: ToolCardProps) {
  const content = (
    <>
      <div className="text-lg font-semibold text-ink">{name}</div>
      <p className="mt-3 text-sm text-ink/70 leading-relaxed">{description}</p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={`${name}-${tag}`}
              className="chip"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        className="section-card glow-hover group block cursor-pointer p-6 transition duration-300 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        target="_blank"
        rel="noreferrer"
      >
        {content}
        <span className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/60 group-hover:text-ink">
          Visit tool
        </span>
      </a>
    );
  }

  return (
    <div className="section-card p-6">
      {content}
    </div>
  );
}
