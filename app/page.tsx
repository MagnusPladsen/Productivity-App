import RefreshButton from '@/components/RefreshButton';
import Stat from '@/components/Stat';
import ToolCard from '@/components/ToolCard';
import { formatDate, formatNumber } from '@/lib/format';
import { getRepoData } from '@/lib/github';
import Image from 'next/image';

export const revalidate = 21600;

function getSectionContent(sections: { title: string; content: string }[], keywords: string[]) {
  const match = sections.find((section) =>
    keywords.some((keyword) => section.title.toLowerCase().includes(keyword))
  );
  return match?.content ?? '';
}

function toParagraphs(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .replace(/^[-*+]\s+/, '')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    );
}

type Tool = {
  name: string;
  description: string;
  tags: string[];
  url?: string;
};

const fallbackTools: Tool[] = [
  {
    name: 'Capture System',
    description: 'A dependable place to capture every task, idea, and note without friction.',
    tags: ['inbox', 'capture']
  },
  {
    name: 'Planning Cadence',
    description: 'Weekly and daily rituals that keep priorities aligned with long-term outcomes.',
    tags: ['planning', 'rhythm']
  },
  {
    name: 'Execution Suite',
    description: 'The apps and workflows that turn planning into consistent output.',
    tags: ['execution']
  },
  {
    name: 'Review Loop',
    description: 'Signals and dashboards that reveal what is working and what needs tuning.',
    tags: ['review', 'insights']
  }
];

export default async function Home() {
  const { repo, parsed } = await getRepoData();
  const tools: Tool[] = (parsed.tools.length > 0 ? parsed.tools : fallbackTools).map((tool) => ({
    ...tool,
    url: tool.url ?? undefined
  }));
  const whyContent = getSectionContent(parsed.sections, ['why', 'philosophy', 'principles']);
  const installContent = getSectionContent(parsed.sections, ['install', 'usage', 'how', 'getting started']);
  const contributingContent = getSectionContent(parsed.sections, ['contributing', 'contribute']);
  const workflowContent = getSectionContent(parsed.sections, ['workflow', 'system', 'architecture', 'stack']);
  const refreshToken = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN;

  return (
    <main className="bg-noise">
      <div className="relative px-6 pb-24 pt-16 md:px-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-16 h-64 w-64 rounded-full bg-ember/20 blur-3xl float-slow" />
          <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-glow/40 blur-3xl float-slow" />
        </div>
        <header className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="flex flex-wrap items-center justify-between gap-6 fade-rise" data-delay="1">
            <p className="eyebrow">Productivity Stack</p>
            {refreshToken ? <RefreshButton token={refreshToken} /> : null}
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6 fade-rise" data-delay="2">
              <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                {repo.owner.avatarUrl ? (
                  <Image
                    src={repo.owner.avatarUrl}
                    alt={repo.owner.login}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border border-black/10"
                  />
                ) : null}
                {repo.owner.login}
              </div>
              <h1 className="font-display text-4xl md:text-6xl leading-tight">
                {repo.name}
                <span className="block text-black/50">{parsed.valueProposition}</span>
              </h1>
              <p className="text-lg text-black/70 leading-relaxed">
                {repo.description}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={repo.htmlUrl}
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-black/90"
                >
                  View on GitHub
                </a>
                <div className="rounded-full border border-black/10 bg-white/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  Last updated {formatDate(repo.updatedAt)}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 fade-rise" data-delay="3">
              <Stat label="Stars" value={formatNumber(repo.stars)} />
              <Stat label="Forks" value={formatNumber(repo.forks)} />
              <Stat label="Open Issues" value={formatNumber(repo.openIssues)} />
              <Stat label="Repo" value={repo.fullName} />
            </div>
          </div>
        </header>

        <section className="mx-auto mt-20 max-w-6xl space-y-10 fade-rise" data-delay="4">
          <div className="section-card p-8 md:p-12">
            <p className="eyebrow">Why this stack</p>
            <h2 className="section-title mt-4">Clarity, momentum, and systems you can trust.</h2>
            <div className="mt-6 space-y-4 text-base text-black/70">
              {toParagraphs(whyContent || parsed.intro).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl fade-rise" data-delay="5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Tooling</p>
              <h2 className="section-title mt-4">The tools that keep the system alive.</h2>
            </div>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard
                key={tool.name}
                name={tool.name}
                description={tool.description}
                tags={tool.tags}
                url={tool.url}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="section-card p-8 md:p-10">
            <p className="eyebrow">How to use</p>
            <h2 className="section-title mt-4">Make the stack yours in minutes.</h2>
            <div className="mt-6 space-y-4 text-base text-black/70">
              {toParagraphs(installContent || 'Install the tools, connect the workflows, and tune the system to your weekly rhythm.').map(
                (paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                )
              )}
            </div>
          </div>
          <div className="section-card p-8 md:p-10">
            <p className="eyebrow">Contributing</p>
            <h2 className="section-title mt-4">Evolve the stack together.</h2>
            <div className="mt-6 space-y-4 text-base text-black/70">
              {toParagraphs(contributingContent || 'Open a pull request or share improvements. The stack grows as the community finds sharper workflows.').map(
                (paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                )
              )}
            </div>
          </div>
        </section>

        {workflowContent ? (
          <section className="mx-auto mt-16 max-w-6xl">
            <div className="section-card p-8 md:p-12">
              <p className="eyebrow">Stack Blueprint</p>
              <h2 className="section-title mt-4">A system you can run on autopilot.</h2>
              <div className="mt-6 space-y-4 text-base text-black/70">
                {toParagraphs(workflowContent).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <footer className="mx-auto mt-20 flex max-w-6xl flex-wrap items-center justify-between gap-6 text-sm text-black/60">
          <span>Built from live GitHub data for {repo.fullName}.</span>
          <a href={repo.htmlUrl} className="font-semibold text-black hover:text-black/70">
            Explore the repo
          </a>
        </footer>
      </div>
    </main>
  );
}
