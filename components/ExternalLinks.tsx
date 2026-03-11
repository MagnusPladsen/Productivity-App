type ExternalLinksProps = {
  links: Array<{ label: string; url: string }>;
};

export default function ExternalLinks({ links }: ExternalLinksProps) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="glow-hover inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 transition hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {link.label}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
            <path fillRule="evenodd" d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
          </svg>
        </a>
      ))}
    </div>
  );
}
