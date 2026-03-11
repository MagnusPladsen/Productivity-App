# Repo Sync & Detail Pages Design

## Context

The target repo (`MagnusPladsen/Productivity-Stack`) has changed from a single flat README to a directory-based structure:

- Each category is a folder (`terminals/`, `ai-tools/`, `editors/`, etc.)
- Each folder has a `README.md` with a table of tools (name, platforms, open source, description)
- Each tool has its own `.md` file with rich detail (description, platforms, links, install commands, alternatives)

The current app only fetches and parses the root README, missing all per-tool content. We need to update the data layer, add group and tool detail pages, and improve the refresh UX.

## Approach

Fetch all content at request time via the GitHub API with ISR caching (Approach A). Batch-fetch the repo tree to discover groups/tools, then fetch individual files in parallel. Cached for 6 hours with manual revalidation.

**Rate limiting note:** A `GITHUB_TOKEN` env var is effectively required for this approach. Without it, the unauthenticated limit is 60 requests/hour which won't cover the batch fetches on a cold cache. The existing optional token support in `buildHeaders()` handles this already.

## 1. Data Layer

### Fetching (`lib/github.ts`)

- Fetch repo tree via `GET /repos/.../git/trees/main?recursive=1` to discover all directories and `.md` files
- Parse the tree to identify groups (directories containing a `README.md`) and tools (other `.md` files in those directories)
- Batch-fetch all markdown files in parallel using the contents API (with `Accept: application/vnd.github.raw`)
- Same ISR strategy: 6-hour revalidation, `repo-data` tag
- The `/api/revalidate` route remains unchanged — it already revalidates the `repo-data` tag which covers all new data

### New Types

```typescript
type ToolDetail = {
  name: string;
  slug: string;
  group: string;
  description: string;
  platforms: string[];
  links: Array<{ label: string; url: string }>;
  installSections: Array<{ label: string; blocks: Array<{ label?: string; code: string; lang: string }> }>;
  alternatives: Array<{ name: string; slug: string }>;
};

type GroupDetail = {
  name: string;
  slug: string;
  description: string;
  tools: Array<{
    name: string;
    slug: string;
    platforms: string;
    openSource: string;
    description: string;
  }>;
};

type RepoData = {
  repo: RepoStats;
  readme: string;
  parsed: ParsedReadme;
  contributors: Array<{ login: string; avatarUrl: string; htmlUrl: string; contributions: number }>;
  groups: GroupDetail[];
  toolDetails: Record<string, ToolDetail>; // keyed by "group/tool-slug"
  fetchedAt: number; // timestamp for relative time display
};
```

## 2. Routing & Pages

### New Routes

- **`/groups/[group]`** — Group page. Shows group description from group README, then tool table rendered as cards linking to detail pages.
- **`/tools/[group]/[tool]`** — Tool detail page. Renders full tool markdown: description quote, platforms, links, install commands per OS, alternatives as cross-links.

### Updated Routes

- **`/`** (home) — Tool cards link to `/tools/[group]/[tool]`. Categories link to `/groups/[group]`.
- **`/tools`** — Tool cards link to detail pages. Category headings link to group pages.

### Navigation

- Breadcrumbs on group and tool pages: `Home > Category > Tool`
- Existing Nav component unchanged

### Error Handling

- Invalid group or tool slugs return `notFound()` from `next/navigation` (Next.js 404 page)
- Each dynamic route validates that the requested slug exists in the fetched data before rendering

### SEO

- Both dynamic routes export `generateMetadata()` for per-page titles and descriptions
- `/groups/[group]` title: `"{Group Name} | Productivity Stack"`
- `/tools/[group]/[tool]` title: `"{Tool Name} - {Group Name} | Productivity Stack"`

### Slug Strategy

- Slugs are derived from the markdown file names (e.g., `kitty.md` -> `kitty`, `claude-code-terminal.md` -> `claude-code-terminal`)
- Group slugs are the directory names (e.g., `terminals`, `ai-tools`)
- A shared `slugify()` utility is extracted to `lib/format.ts` (currently local to `app/tools/page.tsx`)

## 3. Refresh Button & Relative Time

### RefreshButton Updates

- Display relative time next to the button: "Updated 3 minutes ago", "Updated just now", etc.
- `fetchedAt` timestamp passed as prop from server render time
- Client-side interval (every 30 seconds) updates the relative text without page reload
- After successful refresh, timestamp resets to "Updated just now"
- Existing 60-second cooldown retained

### Relative Time Logic

Simple utility function in `lib/format.ts`:
- < 60 seconds: "just now"
- < 60 minutes: "X minutes ago"
- < 24 hours: "X hours ago"
- Otherwise: "X days ago"

No external dependencies.

## 4. Tool Markdown Parser

### New File: `lib/tool-parser.ts`

Parses individual tool markdown files with this structure:

```markdown
# Tool Name
> One-line description

**Platforms:** macOS, Linux

## Links
- [Official Website](url)
- [GitHub Repository](url)

## Install
### macOS
(code blocks)
### Linux
**Distro:**
(code blocks)

## Alternatives
- [Tool A](relative-link.md)
```

**Parsed fields:**
- `name` — from `# heading`
- `description` — from `> blockquote`
- `platforms` — from `**Platforms:**` line, split by comma
- `links` — from `## Links` section, array of `{label, url}`
- `installSections` — from `## Install`, grouped by OS heading, each with label + code blocks
- `alternatives` — from `## Alternatives`, array of `{name, slug}`. Resolved from relative `.md` links by stripping the `.md` extension to get the slug. Links like `iterm2.md` resolve to `{name: "iTerm2", slug: "iterm2"}` within the same group. Cross-group links (e.g., `../editors/vim.md`) resolve by extracting the group directory and file slug.

### Group README Parser

Extracts the table from group `README.md` files into:
```typescript
{ name: string; slug: string; platforms: string; openSource: string; description: string }
```

## 5. Component Updates

### New Components

- **`Breadcrumbs`** — Server component. Renders breadcrumb trail for group/tool pages.
- **`InstallBlock`** — Client component (`'use client'`). Renders install section with clickable OS tabs and code blocks. Needs interactivity for tab switching.
- **`AlternativesList`** — Server component. Renders alternative tools as cross-links.
- **`PlatformBadges`** — Server component. Renders platform tags (macOS, Linux, Windows).
- **`ExternalLinks`** — Server component. Renders official website/repo links.

### Updated Components

- **`ToolCard`** — Add `href` prop for internal detail page link (via `next/link`). The existing `url` prop remains for the external link badge/icon. When `href` is set, the entire card is clickable and navigates internally. The `url` prop renders as a small external link icon that opens in a new tab (stops propagation so it doesn't trigger the card link).
- **`RefreshButton`** — Add `fetchedAt` prop, show relative time, auto-update interval.

## Files Changed/Created

### New Files
- `lib/tool-parser.ts` — Tool markdown + group README parsers
- `app/groups/[group]/page.tsx` — Group detail page
- `app/tools/[group]/[tool]/page.tsx` — Tool detail page
- `components/Breadcrumbs.tsx` — Breadcrumb navigation
- `components/InstallBlock.tsx` — Install section renderer
- `components/AlternativesList.tsx` — Alternatives cross-links
- `components/PlatformBadges.tsx` — Platform tag badges
- `components/ExternalLinks.tsx` — External link list

### Modified Files
- `lib/github.ts` — New tree fetching, batch file fetching, updated types
- `lib/readme.ts` — Minor updates to work with new data structure
- `lib/format.ts` — Add `relativeTime()` utility
- `app/page.tsx` — Tool cards link to detail pages, categories link to groups, pass fetchedAt
- `app/tools/page.tsx` — Same linking updates, pass fetchedAt
- `components/ToolCard.tsx` — Add href prop, wrap in Link
- `components/RefreshButton.tsx` — Show relative time, auto-update interval
