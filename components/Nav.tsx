import Link from 'next/link';

type NavProps = {
  repoUrl: string;
};

export default function Nav({ repoUrl }: NavProps) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
        Productivity Stack
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-white/70">
        <Link href="/" className="transition hover:text-white">
          Home
        </Link>
        <Link href="/tools" className="transition hover:text-white">
          Tools
        </Link>
        <a href={repoUrl} className="transition hover:text-white" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </nav>
  );
}
