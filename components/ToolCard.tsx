type ToolCardProps = {
  name: string;
  description: string;
  tags?: string[];
  url?: string;
};

export default function ToolCard({ name, description, tags = [], url }: ToolCardProps) {
  const content = (
    <>
      <div className="text-lg font-semibold text-white">{name}</div>
      <p className="mt-3 text-sm text-white/70 leading-relaxed">{description}</p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={`${name}-${tag}`}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="section-card p-6 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10">
      {url ? (
        <a href={url} className="group block" target="_blank" rel="noreferrer">
          {content}
          <span className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-white/50 group-hover:text-white">
            Visit tool
          </span>
        </a>
      ) : (
        content
      )}
    </div>
  );
}
