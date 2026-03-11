import Link from 'next/link';

type Crumb = { label: string; href?: string };

type BreadcrumbsProps = {
  items: Crumb[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
      {items.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {crumb.href ? (
            <Link href={crumb.href} className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-ink/70">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
