import Link from 'next/link';

type AlternativesListProps = {
  alternatives: Array<{ name: string; slug: string; group?: string }>;
  currentGroup: string;
};

export default function AlternativesList({ alternatives, currentGroup }: AlternativesListProps) {
  if (alternatives.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {alternatives.map((alt) => {
        const group = alt.group ?? currentGroup;
        return (
          <Link
            key={`${group}-${alt.slug}`}
            href={`/tools/${group}/${alt.slug}`}
            className="glow-hover rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 transition hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            {alt.name}
          </Link>
        );
      })}
    </div>
  );
}
