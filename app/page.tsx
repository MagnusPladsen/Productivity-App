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

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string };

function cleanInline(text: string) {
  return text
    .replace(/`(.+?)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const fence = line.slice(0, 3);
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ kind: 'code', text: codeLines.join('\n') });
      continue;
    }

    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ kind: 'quote', text: cleanInline(quoteLines.join(' ')) });
      continue;
    }

    if (/^([-*+]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^([-*+]|\d+\.)\s+/.test(lines[i].trim())) {
        items.push(cleanInline(lines[i].trim().replace(/^([-*+]|\d+\.)\s+/, '')));
        i += 1;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('```')) {
      if (
        /^([-*+]|\d+\.)\s+/.test(lines[i].trim()) ||
        lines[i].trim().startsWith('>') ||
        lines[i].trim().startsWith('#')
      ) {
        break;
      }
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ kind: 'p', text: cleanInline(paragraphLines.join(' ')) });
      continue;
    }

    i += 1;
  }

  return blocks;
}

function renderBlocks(markdown: string) {
  return parseBlocks(markdown).map((block, index) => {
    if (block.kind === 'p') {
      return <p key={`p-${index}`}>{block.text}</p>;
    }
    if (block.kind === 'ul') {
      return (
        <ul key={`ul-${index}`} className="list-disc space-y-2 pl-5">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }
    if (block.kind === 'quote') {
      return (
        <blockquote
          key={`quote-${index}`}
          className="rounded-2xl border border-black/10 bg-white/60 px-6 py-4 text-sm text-black/70"
        >
          {block.text}
        </blockquote>
      );
    }
    return (
      <pre
        key={`code-${index}`}
        className="overflow-x-auto rounded-2xl border border-black/10 bg-black/90 px-6 py-4 text-xs text-white/90"
      >
        <code>{block.text}</code>
      </pre>
    );
  });
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
  const allTags = tools.flatMap((tool) => tool.tags);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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
              {renderBlocks(whyContent || parsed.intro)}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-6xl fade-rise" data-delay="5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Tooling</p>
              <h2 className="section-title mt-4">The tools that keep the system alive.</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-black/60">
              <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-semibold">
                {tools.length} tools
              </span>
              <span className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-semibold">
                {Object.keys(tagCounts).length || '0'} categories
              </span>
              {topTags.map(([tag]) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/10 bg-black/5 px-4 py-2 font-semibold"
                >
                  {tag}
                </span>
              ))}
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
              {renderBlocks(
                installContent ||
                  'Install the tools, connect the workflows, and tune the system to your weekly rhythm.'
              )}
            </div>
          </div>
          <div className="section-card p-8 md:p-10">
            <p className="eyebrow">Contributing</p>
            <h2 className="section-title mt-4">Evolve the stack together.</h2>
            <div className="mt-6 space-y-4 text-base text-black/70">
              {renderBlocks(
                contributingContent ||
                  'Open a pull request or share improvements. The stack grows as the community finds sharper workflows.'
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
                {renderBlocks(workflowContent)}
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
