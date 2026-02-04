import Nav from '@/components/Nav';
import ToolCard from '@/components/ToolCard';
import { getRepoData } from '@/lib/github';

export const revalidate = 21600;

export default async function ToolsPage() {
  const { repo, parsed } = await getRepoData();
  const groups = parsed.toolGroups;
  const hasTools = groups.length > 0;

  return (
    <main className="bg-noise">
      <div className="relative px-6 pb-24 pt-10 md:px-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-16 h-64 w-64 rounded-full bg-ember/20 blur-3xl float-slow" />
          <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-glow/40 blur-3xl float-slow" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <Nav repoUrl={repo.htmlUrl} />
          <section className="section-card p-8 md:p-12">
            <p className="eyebrow">Tool Directory</p>
            <h1 className="section-title mt-4">Every tool in the Productivity Stack.</h1>
            <p className="mt-4 text-base text-white/70">
              {parsed.valueProposition || repo.description}
            </p>
          </section>

          {hasTools ? (
            groups.map((group) => (
              <section key={group.category} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Category</p>
                    <h2 className="section-title mt-2">{group.category}</h2>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                    {group.tools.length} tools
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.tools.map((tool) => (
                    <ToolCard
                      key={`${group.category}-${tool.name}`}
                      name={tool.name}
                      description={tool.description}
                      tags={tool.tags}
                      url={tool.url}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="section-card p-8 md:p-12">
              <h2 className="section-title">No tools detected yet.</h2>
              <p className="mt-4 text-base text-white/70">
                The README format may have changed. Refresh the data or check the source README to ensure tool
                sections are present.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
