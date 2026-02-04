import Nav from '@/components/Nav';
import ToolCard from '@/components/ToolCard';
import { getRepoData } from '@/lib/github';
import RefreshButton from '@/components/RefreshButton';
import ToolNavigator, { type NavItem } from '@/components/ToolNavigator';

export const revalidate = 21600;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default async function ToolsPage() {
  const { repo, parsed } = await getRepoData();
  const groups = parsed.toolGroups;
  const hasTools = groups.length > 0;
  const refreshToken = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN;
  const categories = groups.map((group) => ({
    name: group.category,
    id: slugify(group.category)
  }));
  const navItems: NavItem[] = groups.flatMap((group) => {
    const categoryId = slugify(group.category);
    const categoryItem: NavItem = {
      id: categoryId,
      label: group.category,
      kind: 'category',
      category: group.category
    };
    const toolItems: NavItem[] = group.tools.map((tool) => ({
      id: slugify(`${group.category}-${tool.name}`),
      label: tool.name,
      kind: 'tool',
      category: group.category
    }));
    return [categoryItem, ...toolItems];
  });

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
            {refreshToken ? (
              <div className="mt-6">
                <RefreshButton token={refreshToken} />
              </div>
            ) : null}
          </section>

          {hasTools ? (
            <>
              <section className="section-card p-6">
                <p className="eyebrow">Jump to</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      href={`#${category.id}`}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:bg-white/15"
                    >
                      {category.name}
                    </a>
                  ))}
                </div>
              </section>

              {groups.map((group) => (
                <section
                  key={group.category}
                  id={slugify(group.category)}
                  className="space-y-6 scroll-mt-24"
                >
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
                    <div
                      key={`${group.category}-${tool.name}`}
                      id={slugify(`${group.category}-${tool.name}`)}
                      className="scroll-mt-24"
                    >
                      <ToolCard name={tool.name} description={tool.description} tags={tool.tags} url={tool.url} />
                    </div>
                  ))}
                </div>
              </section>
              ))}
            </>
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
      {hasTools ? <ToolNavigator items={navItems} /> : null}
    </main>
  );
}
