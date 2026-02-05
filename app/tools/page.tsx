import Nav from '@/components/Nav';
import ToolCard from '@/components/ToolCard';
import { getRepoData } from '@/lib/github';
import RefreshButton from '@/components/RefreshButton';
import ToolNavigator, { type NavItem } from '@/components/ToolNavigator';
import CategoryIndex from '@/components/CategoryIndex';

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
    <main className="page-shell">
      <div className="relative px-6 pb-24 pt-10 md:px-12 grain-layer">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-12 h-72 w-72 rounded-full bg-ember/25 blur-3xl float-slow" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sea/25 blur-3xl swirl-slow" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <Nav repoUrl={repo.htmlUrl} />
          <section className="section-card p-8 md:p-12 grid-stamp">
            <p className="eyebrow">Tool Directory</p>
            <h1 className="section-title mt-4">Every tool in the Productivity Stack.</h1>
            <p className="mt-4 text-base text-ink/70">
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
              <section className="section-card p-6 paper-panel lg:hidden">
                <CategoryIndex categories={categories} title="Jump to" variant="wrap" />
              </section>

              <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
                <aside className="hidden lg:block">
                  <div className="section-card p-6 paper-panel lg:sticky lg:top-24">
                    <CategoryIndex categories={categories} />
                  </div>
                </aside>
                <div className="space-y-12">
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
                        <div className="stamp bg-paper/80">{group.tools.length} tools</div>
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
                </div>
              </div>
            </>
          ) : (
            <section className="section-card p-8 md:p-12">
              <h2 className="section-title">No tools detected yet.</h2>
              <p className="mt-4 text-base text-ink/70">
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
