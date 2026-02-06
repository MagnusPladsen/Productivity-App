import Link from 'next/link';
import CursorToggle from '@/components/CursorToggle';

type NavProps = {
  repoUrl: string;
};

export default function Nav({ repoUrl }: NavProps) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-ink/10 bg-paper/90 px-5 py-4 shadow-lift backdrop-blur-md">
      <div className="text-xs font-semibold uppercase tracking-[0.35em] text-ink/70">
        Productivity Stack
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-ink/70">
        <Link href="/" className="fancy-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
          Home
        </Link>
        <Link href="/tools" className="fancy-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
          Tools
        </Link>
        <a href="https://pladsen.dev" className="fancy-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper" target="_blank" rel="noreferrer">
          Portfolio
        </a>
        <a href={repoUrl} className="fancy-link transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <CursorToggle />
      </div>
    </nav>
  );
}
