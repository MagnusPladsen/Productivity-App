import { notFound } from 'next/navigation';
import { getRepoData } from '@/lib/github';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Breadcrumbs from '@/components/Breadcrumbs';
import ToolCard from '@/components/ToolCard';
import RefreshButton from '@/components/RefreshButton';

type Props = { params: Promise<{ group: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group: groupSlug } = await params;
  const { groups } = await getRepoData();
  const group = groups.find((g) => g.slug === groupSlug);
  if (!group) return { title: 'Not Found' };
  return { title: `${group.name} | Productivity Stack` };
}

export default async function GroupPage({ params }: Props) {
  const { group: groupSlug } = await params;
  const { repo, groups, fetchedAt } = await getRepoData();
  const group = groups.find((g) => g.slug === groupSlug);

  if (!group) notFound();

  const refreshToken = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN;

  return (
    <main className="page-shell">
      <div className="relative px-6 pb-24 pt-10 md:px-12 grain-layer">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-12 h-72 w-72 rounded-full bg-ember/25 blur-3xl float-slow" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sea/25 blur-3xl swirl-slow" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <Nav repoUrl={repo.htmlUrl} />

          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Tools', href: '/tools' },
              { label: group.name },
            ]}
          />

          <section className="section-card p-8 md:p-12 grid-stamp">
            <p className="eyebrow">Category</p>
            <h1 className="section-title mt-4">{group.name}</h1>
            {group.description ? (
              <p className="mt-4 text-base text-ink/70">{group.description}</p>
            ) : null}
            <div className="mt-4 stamp bg-paper/80">{group.tools.length} tools</div>
            {refreshToken ? (
              <div className="mt-6">
                <RefreshButton token={refreshToken} fetchedAt={fetchedAt} />
              </div>
            ) : null}
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {group.tools.map((tool) => (
              <ToolCard
                key={tool.slug}
                name={tool.name}
                description={tool.description}
                tags={[tool.platforms, tool.openSource === 'Yes' ? 'Open Source' : ''].filter(Boolean)}
                href={`/tools/${group.slug}/${tool.slug}`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
