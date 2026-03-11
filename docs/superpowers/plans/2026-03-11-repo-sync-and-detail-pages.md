# Repo Sync & Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Productivity App to fetch and display the directory-based Productivity-Stack repo, adding group pages and tool detail pages with full content.

**Architecture:** Server-side data fetching via GitHub API with ISR caching. New parsers for tool markdown and group README tables. Two new dynamic routes (`/groups/[group]`, `/tools/[group]/[tool]`) with breadcrumb navigation. Refresh button shows relative time since last update.

**Tech Stack:** Next.js 15 (App Router, Server Components), React 19, TypeScript, Tailwind CSS, GitHub REST API

**Spec:** `docs/superpowers/specs/2026-03-11-repo-sync-and-detail-pages-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `lib/tool-parser.ts` | Parse individual tool `.md` files and group `README.md` tables into structured types |
| `app/groups/[group]/page.tsx` | Group detail page — shows group description + tool cards |
| `app/tools/[group]/[tool]/page.tsx` | Tool detail page — full tool content with install, links, alternatives |
| `components/Breadcrumbs.tsx` | Breadcrumb trail server component |
| `components/InstallBlock.tsx` | Client component with OS tabs for install commands |
| `components/AlternativesList.tsx` | Server component rendering cross-linked alternatives |
| `components/PlatformBadges.tsx` | Server component rendering platform tags |
| `components/ExternalLinks.tsx` | Server component rendering official links |

### Modified Files
| File | Changes |
|------|---------|
| `lib/github.ts` | Add tree fetching, batch file fetching, new types (`ToolDetail`, `GroupDetail`), update `RepoData` |
| `lib/format.ts` | Add `relativeTime()` and shared `slugify()` |
| `components/RefreshButton.tsx` | Add `fetchedAt` prop, relative time display with auto-update |
| `components/ToolCard.tsx` | Add `href` prop for internal linking via `next/link` |
| `app/page.tsx` | Link tool cards to detail pages, categories to group pages, pass `fetchedAt` |
| `app/tools/page.tsx` | Same linking updates, pass `fetchedAt`, use shared `slugify` |
| `app/api/revalidate/route.ts` | Add revalidation for new `/groups` and `/tools` paths |

---

## Chunk 1: Data Layer & Parsers

### Task 1: Add shared utilities to `lib/format.ts`

**Files:**
- Modify: `lib/format.ts`

- [ ] **Step 1: Add `slugify()` function**

```typescript
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

- [ ] **Step 2: Add `relativeTime()` function**

```typescript
export function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
```

- [ ] **Step 3: Verify the app builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add lib/format.ts
git commit -m "feat: add slugify and relativeTime utilities"
```

---

### Task 2: Create tool markdown parser (`lib/tool-parser.ts`)

**Files:**
- Create: `lib/tool-parser.ts`

- [ ] **Step 1: Define the types**

```typescript
export type ToolDetail = {
  name: string;
  slug: string;
  group: string;
  description: string;
  platforms: string[];
  links: Array<{ label: string; url: string }>;
  installSections: Array<{
    label: string;
    blocks: Array<{ label?: string; code: string; lang: string }>;
  }>;
  alternatives: Array<{ name: string; slug: string; group?: string }>;
};

export type GroupToolEntry = {
  name: string;
  slug: string;
  platforms: string;
  openSource: string;
  description: string;
};

export type GroupDetail = {
  name: string;
  slug: string;
  description: string;
  tools: GroupToolEntry[];
};
```

- [ ] **Step 2: Write `parseToolMarkdown()` function**

This function takes raw markdown content, the tool's slug, and its group slug, and returns a `ToolDetail`.

```typescript
export function parseToolMarkdown(markdown: string, slug: string, group: string): ToolDetail {
  const lines = markdown.split('\n');
  let name = slug;
  let description = '';
  const platforms: string[] = [];
  const links: Array<{ label: string; url: string }> = [];
  const installSections: ToolDetail['installSections'] = [];
  const alternatives: ToolDetail['alternatives'] = [];

  // Parse name from first # heading
  const nameMatch = lines.find((l) => /^#\s+/.test(l));
  if (nameMatch) {
    name = nameMatch.replace(/^#\s+/, '').trim();
  }

  // Parse description from first > blockquote
  const descLine = lines.find((l) => l.startsWith('>'));
  if (descLine) {
    description = descLine.replace(/^>\s*/, '').trim();
  }

  // Parse platforms from **Platforms:** line
  const platformLine = lines.find((l) => /^\*\*Platforms?:\*\*/.test(l));
  if (platformLine) {
    const raw = platformLine.replace(/^\*\*Platforms?:\*\*\s*/, '');
    platforms.push(...raw.split(',').map((p) => p.trim()).filter(Boolean));
  }

  // Split into sections by ## headings
  const sections = splitBySections(lines);

  // Parse ## Links section
  const linksSection = sections.find((s) => /^links$/i.test(s.title));
  if (linksSection) {
    for (const line of linksSection.lines) {
      const match = line.match(/^\s*[-*]\s+\[(.+?)\]\((.+?)\)/);
      if (match) {
        links.push({ label: match[1], url: match[2] });
      }
    }
  }

  // Parse ## Install section
  const installSection = sections.find((s) => /^install$/i.test(s.title));
  if (installSection) {
    parseInstallSection(installSection.lines, installSections);
  }

  // Parse ## Alternatives section
  const altSection = sections.find((s) => /^alternatives$/i.test(s.title));
  if (altSection) {
    for (const line of altSection.lines) {
      const match = line.match(/^\s*[-*]\s+\[(.+?)\]\((.+?)\)/);
      if (match) {
        const altName = match[1];
        const href = match[2];
        const resolved = resolveAlternativeLink(href, group);
        alternatives.push({ name: altName, ...resolved });
      }
    }
  }

  return { name, slug, group, description, platforms, links, installSections, alternatives };
}
```

- [ ] **Step 3: Write helper functions**

```typescript
type Section = { title: string; lines: string[] };

function splitBySections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[1].trim(), lines: [] };
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function parseInstallSection(
  lines: string[],
  out: ToolDetail['installSections']
): void {
  let currentOS: { label: string; blocks: Array<{ label?: string; code: string; lang: string }> } | null = null;
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let blockLabel: string | undefined;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (currentOS) {
          currentOS.blocks.push({ label: blockLabel, code: codeLines.join('\n'), lang: codeLang });
        }
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
        blockLabel = undefined;
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim() || 'bash';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      if (currentOS) out.push(currentOS);
      currentOS = { label: h3Match[1].trim(), blocks: [] };
      continue;
    }

    const boldMatch = line.match(/^\*\*(.+?):\*\*$/);
    if (boldMatch) {
      blockLabel = boldMatch[1].trim();
    }
  }

  if (inCodeBlock && currentOS) {
    currentOS.blocks.push({ label: blockLabel, code: codeLines.join('\n'), lang: codeLang });
  }
  if (currentOS) out.push(currentOS);
}

function resolveAlternativeLink(href: string, currentGroup: string): { slug: string; group?: string } {
  // Cross-group: ../editors/vim.md
  const crossMatch = href.match(/^\.\.\/([^/]+)\/([^/]+)\.md$/);
  if (crossMatch) {
    return { slug: crossMatch[2], group: crossMatch[1] };
  }
  // Same-group: tool.md
  return { slug: href.replace(/\.md$/, '') };
}
```

- [ ] **Step 4: Write `parseGroupReadme()` function**

```typescript
export function parseGroupReadme(markdown: string, groupSlug: string): GroupDetail {
  const lines = markdown.split('\n');

  // Name from # heading
  const nameMatch = lines.find((l) => /^#\s+/.test(l));
  const name = nameMatch ? nameMatch.replace(/^#\s+/, '').trim() : groupSlug;

  // Description: first non-empty, non-heading, non-table line
  const description = lines
    .filter((l) => l.trim() && !/^#/.test(l) && !l.includes('|'))
    .map((l) => l.trim())
    .find(Boolean) ?? '';

  // Parse table
  const tableStart = lines.findIndex((l) => l.includes('|') && /tool|name/i.test(l));
  const tools: GroupToolEntry[] = [];

  if (tableStart >= 0) {
    const headerCells = lines[tableStart].split('|').map((c) => c.trim()).filter(Boolean);
    const nameIdx = headerCells.findIndex((c) => /tool|name/i.test(c));
    const platformIdx = headerCells.findIndex((c) => /platform/i.test(c));
    const osIdx = headerCells.findIndex((c) => /open\s*source/i.test(c));
    const descIdx = headerCells.findIndex((c) => /desc/i.test(c));

    // Skip header + separator rows
    for (let i = tableStart + 2; i < lines.length; i++) {
      const row = lines[i];
      if (!row.includes('|')) break;
      const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
      if (!cells.length) continue;

      const rawName = cells[nameIdx >= 0 ? nameIdx : 0] ?? '';
      // Extract name and slug from markdown link [Name](file.md)
      const linkMatch = rawName.match(/\[(.+?)\]\((.+?)\)/);
      const toolName = linkMatch ? linkMatch[1] : rawName;
      const toolSlug = linkMatch ? linkMatch[2].replace(/\.md$/, '') : slugify(rawName);

      tools.push({
        name: toolName,
        slug: toolSlug,
        platforms: cells[platformIdx >= 0 ? platformIdx : 1] ?? '',
        openSource: cells[osIdx >= 0 ? osIdx : 2] ?? '',
        description: cells[descIdx >= 0 ? descIdx : 3] ?? '',
      });
    }
  }

  return { name, slug: groupSlug, description, tools };
}
```

Note: Import `slugify` from `@/lib/format` at the top of the file:
```typescript
import { slugify } from '@/lib/format';
```

- [ ] **Step 5: Verify the app builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add lib/tool-parser.ts
git commit -m "feat: add tool markdown and group README parsers"
```

---

### Task 3: Update GitHub data fetching (`lib/github.ts`)

**Files:**
- Modify: `lib/github.ts`

- [ ] **Step 1: Add imports and update types**

Add at the top of the file:
```typescript
import { parseToolMarkdown, parseGroupReadme, type ToolDetail, type GroupDetail } from './tool-parser';
```

Update the `RepoData` type to:
```typescript
export type RepoData = {
  repo: RepoStats;
  readme: string;
  parsed: ParsedReadme;
  contributors: Array<{ login: string; avatarUrl: string; htmlUrl: string; contributions: number }>;
  groups: GroupDetail[];
  toolDetails: Record<string, ToolDetail>;
  fetchedAt: number;
};
```

Re-export the new types:
```typescript
export type { ToolDetail, GroupDetail } from './tool-parser';
```

- [ ] **Step 2: Add `fetchRepoTree()` function**

```typescript
type TreeEntry = { path: string; type: string };

async function fetchRepoTree(headers: Record<string, string>): Promise<TreeEntry[]> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/main?recursive=1`,
    {
      headers,
      next: { revalidate: REVALIDATE_SECONDS, tags: ['repo-data'] },
    }
  );
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.tree) ? data.tree : [];
}
```

- [ ] **Step 3: Add `fetchFileContent()` function**

```typescript
async function fetchFileContent(path: string, headers: Record<string, string>): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      headers: { ...headers, Accept: 'application/vnd.github.raw' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['repo-data'] },
    }
  );
  if (!response.ok) return null;
  return response.text();
}
```

- [ ] **Step 4: Add `fetchGroupsAndTools()` function**

```typescript
async function fetchGroupsAndTools(
  headers: Record<string, string>
): Promise<{ groups: GroupDetail[]; toolDetails: Record<string, ToolDetail> }> {
  const tree = await fetchRepoTree(headers);

  // Find directories that contain a README.md (these are groups)
  // Exclude root-level files and special files like CONTRIBUTING.md
  const groupDirs = new Set<string>();
  const toolFiles: Array<{ path: string; dir: string }> = [];

  for (const entry of tree) {
    if (entry.type !== 'blob') continue;
    const parts = entry.path.split('/');
    if (parts.length === 2 && parts[1] === 'README.md') {
      groupDirs.add(parts[0]);
    }
  }

  for (const entry of tree) {
    if (entry.type !== 'blob') continue;
    const parts = entry.path.split('/');
    if (parts.length === 2 && parts[1] !== 'README.md' && parts[1].endsWith('.md')) {
      if (groupDirs.has(parts[0])) {
        toolFiles.push({ path: entry.path, dir: parts[0] });
      }
    }
  }

  // Fetch all group READMEs and tool files in parallel
  const groupFetches = Array.from(groupDirs).map(async (dir) => {
    const content = await fetchFileContent(`${dir}/README.md`, headers);
    if (!content) return null;
    return parseGroupReadme(content, dir);
  });

  const toolFetches = toolFiles.map(async ({ path, dir }) => {
    const content = await fetchFileContent(path, headers);
    if (!content) return null;
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    return parseToolMarkdown(content, slug, dir);
  });

  const [groupResults, toolResults] = await Promise.all([
    Promise.all(groupFetches),
    Promise.all(toolFetches),
  ]);

  const groups = groupResults.filter((g): g is GroupDetail => g !== null);
  const toolDetails: Record<string, ToolDetail> = {};
  for (const tool of toolResults) {
    if (tool) {
      toolDetails[`${tool.group}/${tool.slug}`] = tool;
    }
  }

  // Sort groups by the order they appear in the root README (Table of Contents)
  // Groups not in root README go at the end
  return { groups, toolDetails };
}
```

- [ ] **Step 5: Update `getRepoData()` to include groups, tools, and fetchedAt**

Add after the existing `parsed` assignment and before the return statement:
```typescript
const { groups, toolDetails } = await fetchGroupsAndTools(headers);
```

Update the return object to include:
```typescript
return {
  repo: { /* existing */ },
  readme,
  parsed,
  contributors,
  groups,
  toolDetails,
  fetchedAt: Date.now(),
};
```

- [ ] **Step 6: Add helper functions for fetching single group/tool**

```typescript
export async function getGroupBySlug(slug: string): Promise<GroupDetail | null> {
  const { groups } = await getRepoData();
  return groups.find((g) => g.slug === slug) ?? null;
}

export async function getToolBySlug(groupSlug: string, toolSlug: string): Promise<ToolDetail | null> {
  const { toolDetails } = await getRepoData();
  return toolDetails[`${groupSlug}/${toolSlug}`] ?? null;
}
```

- [ ] **Step 7: Verify the app builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -30`
Expected: Build succeeds (pages may show different data now)

- [ ] **Step 8: Commit**

```bash
git add lib/github.ts
git commit -m "feat: fetch repo tree and parse groups/tools from GitHub API"
```

---

## Chunk 2: Components

### Task 4: Update `RefreshButton` with relative time

**Files:**
- Modify: `components/RefreshButton.tsx`

- [ ] **Step 1: Add `fetchedAt` prop and relative time state**

Update the props type:
```typescript
type RefreshButtonProps = {
  token?: string;
  fetchedAt?: number;
};
```

Add state and effect for relative time inside the component, after existing state declarations:
```typescript
const [timeLabel, setTimeLabel] = useState('');

useEffect(() => {
  if (!fetchedAt) return;
  const update = () => setTimeLabel(relativeTime(fetchedAt));
  update();
  const interval = setInterval(update, 30_000);
  return () => clearInterval(interval);
}, [fetchedAt]);
```

Import `relativeTime` at the top:
```typescript
import { relativeTime } from '@/lib/format';
```

Update the `handleRefresh` success case — after `setCooldownUntil(Date.now() + 60_000);` add:
```typescript
setTimeLabel('just now');
```

- [ ] **Step 2: Update the JSX to show relative time**

Replace the outer `<div>` return with:
```tsx
return (
  <div className="flex flex-wrap items-center gap-3">
    <button
      type="button"
      onClick={handleRefresh}
      className="glow-hover rounded-full border border-ink/20 bg-ink px-5 py-2 text-sm font-semibold text-paper shadow-lift transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
      disabled={isPending || isCoolingDown}
    >
      {isPending ? 'Refreshing\u2026' : isCoolingDown ? `Wait ${secondsLeft}s` : 'Refresh data'}
    </button>
    {timeLabel ? (
      <span className="text-xs text-ink/50">Updated {timeLabel}</span>
    ) : null}
    {message ? <p className="text-xs text-ink/60">{message}</p> : null}
  </div>
);
```

- [ ] **Step 3: Verify the app builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -20`
Expected: Build succeeds (`fetchedAt` is optional, so existing pages still compile).

- [ ] **Step 4: Commit**

```bash
git add components/RefreshButton.tsx
git commit -m "feat: show relative time on refresh button"
```

---

### Task 5: Update `ToolCard` with internal link support

**Files:**
- Modify: `components/ToolCard.tsx`

- [ ] **Step 1: Update the component**

Replace the entire file:
```tsx
import Link from 'next/link';

type ToolCardProps = {
  name: string;
  description: string;
  tags?: string[];
  url?: string;
  href?: string;
};

export default function ToolCard({ name, description, tags = [], url, href }: ToolCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-lg font-semibold text-ink">{name}</div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-ink/40 transition hover:text-ink"
            aria-label={`Visit ${name} website`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.25-.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V6.31l-5.72 5.72a.75.75 0 1 1-1.06-1.06l5.72-5.72H12.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </a>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-ink/70 leading-relaxed">{description}</p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={`${name}-${tag}`} className="chip">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  const cardClasses =
    'section-card glow-hover group block cursor-pointer p-6 transition duration-300 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    );
  }

  if (url) {
    return (
      <a href={url} className={cardClasses} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <div className="section-card p-6">{content}</div>;
}
```

- [ ] **Step 2: Verify the app builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add components/ToolCard.tsx
git commit -m "feat: add internal link support to ToolCard"
```

---

### Task 6: Create new shared components

**Files:**
- Create: `components/Breadcrumbs.tsx`
- Create: `components/PlatformBadges.tsx`
- Create: `components/ExternalLinks.tsx`
- Create: `components/AlternativesList.tsx`
- Create: `components/InstallBlock.tsx`

- [ ] **Step 1: Create `Breadcrumbs.tsx`**

```tsx
import Link from 'next/link';

type Crumb = { label: string; href?: string };

type BreadcrumbsProps = {
  items: Crumb[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
      {items.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-2">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {crumb.href ? (
            <Link href={crumb.href} className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-ink/70">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Create `PlatformBadges.tsx`**

```tsx
type PlatformBadgesProps = {
  platforms: string[];
};

export default function PlatformBadges({ platforms }: PlatformBadgesProps) {
  if (platforms.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <span key={platform} className="chip">
          {platform}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `ExternalLinks.tsx`**

```tsx
type ExternalLinksProps = {
  links: Array<{ label: string; url: string }>;
};

export default function ExternalLinks({ links }: ExternalLinksProps) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="glow-hover inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 transition hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          {link.label}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
            <path fillRule="evenodd" d="M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
          </svg>
        </a>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `AlternativesList.tsx`**

```tsx
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
```

- [ ] **Step 5: Create `InstallBlock.tsx`**

```tsx
'use client';

import { useState } from 'react';

type InstallBlockProps = {
  sections: Array<{
    label: string;
    blocks: Array<{ label?: string; code: string; lang: string }>;
  }>;
};

export default function InstallBlock({ sections }: InstallBlockProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (sections.length === 0) return null;

  const active = sections[activeIndex];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {sections.map((section, i) => (
          <button
            key={section.label}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
              i === activeIndex
                ? 'bg-ink text-paper shadow-lift'
                : 'border border-ink/20 bg-paper text-ink/70 hover:border-ink/40 hover:text-ink'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {active.blocks.map((block) => (
          <div key={`${block.lang}-${block.label ?? ''}-${block.code.slice(0, 40)}`}>
            {block.label ? (
              <p className="mb-2 text-xs font-semibold text-ink/60">{block.label}</p>
            ) : null}
            <pre className="overflow-x-auto rounded-2xl border border-ink/15 bg-clay px-6 py-4 text-sm text-ink/90">
              <code>{block.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify the app builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add components/Breadcrumbs.tsx components/PlatformBadges.tsx components/ExternalLinks.tsx components/AlternativesList.tsx components/InstallBlock.tsx
git commit -m "feat: add Breadcrumbs, PlatformBadges, ExternalLinks, AlternativesList, InstallBlock components"
```

---

## Chunk 3: Pages & Integration

### Task 7: Create group detail page

**Files:**
- Create: `app/groups/[group]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Verify the page builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/groups/\[group\]/page.tsx
git commit -m "feat: add group detail page"
```

---

### Task 8: Create tool detail page

**Files:**
- Create: `app/tools/[group]/[tool]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
              <h1 className="section-title mt-4">{tool.name}</h1>
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
```

- [ ] **Step 2: Verify the page builds**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add app/tools/\[group\]/\[tool\]/page.tsx
git commit -m "feat: add tool detail page"
```

---

### Task 9: Update existing pages with links and `fetchedAt`

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/tools/page.tsx`
- Modify: `app/api/revalidate/route.ts`

- [ ] **Step 1: Update `app/page.tsx`**

In the `Home()` function, update the destructure:
```typescript
const { repo, parsed, contributors, groups, toolDetails, fetchedAt } = await getRepoData();
```

Update tools mapping to add `href` — find the tool's group from `groups` data:
```typescript
const tools: Tool[] = (parsed.tools.length > 0 ? parsed.tools : fallbackTools).map((tool) => {
  const group = groups.find((g) => g.tools.some((t) => t.name === tool.name));
  const toolSlug = group?.tools.find((t) => t.name === tool.name)?.slug;
  return {
    ...tool,
    url: tool.url ?? undefined,
    href: group && toolSlug ? `/tools/${group.slug}/${toolSlug}` : undefined,
  };
});
```

Update the `Tool` type to include `href`:
```typescript
type Tool = {
  name: string;
  description: string;
  tags: string[];
  url?: string;
  href?: string;
};
```

Update `ToolCard` usage in the featured tools grid to pass `href`:
```tsx
<ToolCard
  key={tool.name}
  name={tool.name}
  description={tool.description}
  tags={tool.tags}
  url={tool.url}
  href={tool.href}
/>
```

Update category chips to link to group pages — replace the categories `<span>` with:
```tsx
<Link
  key={category}
  href={`/groups/${groups.find((g) => g.name === category)?.slug ?? slugify(category)}`}
  className="chip transition hover:bg-ink/10"
>
  {category}
</Link>
```

Note: Import `slugify` at the top of the file:
```typescript
import { slugify } from '@/lib/format';
```

The lookup uses `g.name` (the group's display name parsed from its README heading) which should match the category names from the root README. If no match is found, it falls back to `slugify(category)` which produces the directory-style slug.

Update `RefreshButton` usage to pass `fetchedAt`:
```tsx
{refreshToken ? <RefreshButton token={refreshToken} fetchedAt={fetchedAt} /> : null}
```

- [ ] **Step 2: Update `app/tools/page.tsx`**

Update the destructure:
```typescript
const { repo, parsed, groups: repoGroups, toolDetails, fetchedAt } = await getRepoData();
```

Remove the local `slugify` function (now imported from `@/lib/format`):
```typescript
import { slugify } from '@/lib/format';
```

Update `ToolCard` usage in the tools grid to pass `href`. Look up the actual slug from `repoGroups`:
```tsx
{group.tools.map((tool) => {
  const repoGroup = repoGroups.find((g) => g.name === group.category);
  const repoTool = repoGroup?.tools.find((t) => t.name === tool.name);
  const toolHref = repoGroup && repoTool ? `/tools/${repoGroup.slug}/${repoTool.slug}` : undefined;
  return (
    <div
      key={`${group.category}-${tool.name}`}
      id={slugify(`${group.category}-${tool.name}`)}
      className="scroll-mt-24"
    >
      <ToolCard name={tool.name} description={tool.description} tags={tool.tags} url={tool.url} href={toolHref} />
    </div>
  );
})}
```

Update category headings to link to group pages:
```tsx
<Link href={`/groups/${slugify(group.category)}`} className="transition hover:opacity-80">
  <h2 className="section-title mt-2">{group.category}</h2>
</Link>
```

Update `RefreshButton` to pass `fetchedAt`:
```tsx
{refreshToken ? <RefreshButton token={refreshToken} fetchedAt={fetchedAt} /> : null}
```

- [ ] **Step 3: Update `app/api/revalidate/route.ts`**

Add revalidation for the new routes. After the existing `revalidatePath` calls, add:
```typescript
revalidatePath('/groups/[group]', 'page');
revalidatePath('/tools/[group]/[tool]', 'page');
```

- [ ] **Step 4: Verify the full app builds and runs**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -30`
Expected: Build succeeds with all pages generated

- [ ] **Step 5: Test locally**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next dev`
Manual checks:
- Visit `/` — verify tool cards are clickable and link to detail pages
- Visit `/tools` — verify category headings link to group pages, tool cards link to detail pages
- Visit `/groups/terminals` — verify group page renders with tool cards
- Visit `/tools/terminals/kitty` — verify full tool detail with install, links, alternatives
- Visit `/groups/nonexistent` — verify 404
- Visit `/tools/terminals/nonexistent` — verify 404
- Verify refresh button shows "Updated X minutes ago"

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/tools/page.tsx app/api/revalidate/route.ts
git commit -m "feat: wire up links to group and tool detail pages, add fetchedAt to refresh button"
```

---

### Task 10: Final cleanup and verification

- [ ] **Step 1: Run type check**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx tsc --noEmit 2>&1 | tail -30`
Expected: No type errors

- [ ] **Step 2: Run lint**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npm run lint 2>&1 | tail -20`
Expected: No lint errors (fix any that appear)

- [ ] **Step 3: Run production build**

Run: `cd /Users/magnuspladsen/git/Productivity-App && npx next build 2>&1 | tail -30`
Expected: Build succeeds

- [ ] **Step 4: Commit any lint/type fixes**

```bash
git add -u
git commit -m "fix: resolve lint and type errors"
```
