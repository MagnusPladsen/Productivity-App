import { notFound } from 'next/navigation';
import { getRepoData } from '@/lib/github';
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Breadcrumbs from '@/components/Breadcrumbs';
import PlatformBadges from '@/components/PlatformBadges';
import ExternalLinks from '@/components/ExternalLinks';
import InstallBlock from '@/components/InstallBlock';
import AlternativesList from '@/components/AlternativesList';
import RefreshButton from '@/components/RefreshButton';

type Props = { params: Promise<{ group: string; tool: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group: groupSlug, tool: toolSlug } = await params;
  const { toolDetails, groups } = await getRepoData();
  const tool = toolDetails[`${groupSlug}/${toolSlug}`];
  const group = groups.find((g) => g.slug === groupSlug);
  if (!tool) return { title: 'Not Found' };
  return {
    title: `${tool.name} - ${group?.name ?? groupSlug} | Productivity Stack`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: Props) {
  const { group: groupSlug, tool: toolSlug } = await params;
  const { repo, toolDetails, groups, fetchedAt } = await getRepoData();
  const tool = toolDetails[`${groupSlug}/${toolSlug}`];
  const group = groups.find((g) => g.slug === groupSlug);

  if (!tool) notFound();

  const refreshToken = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN;

  return (
    <main className="page-shell">
      <div className="relative px-6 pb-24 pt-10 md:px-12 grain-layer">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-12 h-72 w-72 rounded-full bg-ember/25 blur-3xl float-slow" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sea/25 blur-3xl swirl-slow" />
        </div>

        <div className="mx-auto flex max-w-4xl flex-col gap-10">
          <Nav repoUrl={repo.htmlUrl} />

          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Tools', href: '/tools' },
              { label: group?.name ?? groupSlug, href: `/groups/${groupSlug}` },
              { label: tool.name },
            ]}
          />

          <section className="section-card p-8 md:p-12 grid-stamp space-y-6">
            <div>
              <p className="eyebrow">{group?.name ?? groupSlug}</p>
              <div className="flex items-center gap-3 mt-4">
                <h1 className="section-title">{tool.name}</h1>
                {tool.stars ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                    </svg>
                    {tool.stars}
                  </span>
                ) : null}
              </div>
              {tool.description ? (
                <p className="mt-4 text-lg text-ink/70 leading-relaxed">{tool.description}</p>
              ) : null}
            </div>

            <PlatformBadges platforms={tool.platforms} />
            <ExternalLinks links={tool.links} />

            {refreshToken ? (
              <RefreshButton token={refreshToken} fetchedAt={fetchedAt} />
            ) : null}
          </section>

          {tool.installSections.length > 0 ? (
            <section className="section-card p-8 md:p-12 space-y-6">
              <div>
                <p className="eyebrow">Install</p>
                <h2 className="section-title mt-4">Get started</h2>
              </div>
              <InstallBlock sections={tool.installSections} />
            </section>
          ) : null}

          {tool.usageSection ? (
            <section className="section-card p-8 md:p-12 space-y-6">
              <div>
                <p className="eyebrow">Usage</p>
                <h2 className="section-title mt-4">How to use</h2>
              </div>
              <div className="prose prose-invert max-w-none text-ink/80 text-sm leading-relaxed whitespace-pre-wrap">
                {tool.usageSection}
              </div>
            </section>
          ) : null}

          {tool.pricingSection ? (
            <section className="section-card p-8 md:p-12 space-y-6">
              <div>
                <p className="eyebrow">Pricing</p>
                <h2 className="section-title mt-4">Plans &amp; pricing</h2>
              </div>
              <div className="prose prose-invert max-w-none text-ink/80 text-sm leading-relaxed whitespace-pre-wrap">
                {tool.pricingSection}
              </div>
            </section>
          ) : null}

          {tool.alternatives.length > 0 ? (
            <section className="section-card p-8 md:p-12 space-y-6">
              <div>
                <p className="eyebrow">Alternatives</p>
                <h2 className="section-title mt-4">Similar tools</h2>
              </div>
              <AlternativesList alternatives={tool.alternatives} currentGroup={groupSlug} />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
