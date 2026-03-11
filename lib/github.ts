import { parseReadme, type ParsedReadme } from './readme';
import { parseToolMarkdown, parseGroupReadme, type ToolDetail, type GroupDetail } from './tool-parser';

const OWNER = 'MagnusPladsen';
const REPO = 'Productivity-Stack';
const REVALIDATE_SECONDS = 60 * 60 * 6;

export type RepoStats = {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string;
  htmlUrl: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
};

export type RepoData = {
  repo: RepoStats;
  readme: string;
  parsed: ParsedReadme;
  contributors: Array<{ login: string; avatarUrl: string; htmlUrl: string; contributions: number }>;
  groups: GroupDetail[];
  toolDetails: Record<string, ToolDetail>;
  fetchedAt: number;
};

export type { ToolDetail, GroupDetail } from './tool-parser';

function buildHeaders() {
  const headers: Record<string, string> = {
    'User-Agent': 'productivity-stack-site'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

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

async function fetchGroupsAndTools(
  headers: Record<string, string>
): Promise<{ groups: GroupDetail[]; toolDetails: Record<string, ToolDetail> }> {
  const tree = await fetchRepoTree(headers);

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

  return { groups, toolDetails };
}

export async function getRepoData(): Promise<RepoData> {
  const headers = buildHeaders();

  const repoResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS, tags: ['repo-data'] }
  });

  if (!repoResponse.ok) {
    throw new Error(`Failed to load repo metadata: ${repoResponse.status}`);
  }

  const repoJson = await repoResponse.json();

  const readmeResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/readme`, {
    headers: {
      ...headers,
      Accept: 'application/vnd.github.raw'
    },
    next: { revalidate: REVALIDATE_SECONDS, tags: ['repo-data'] }
  });

  if (!readmeResponse.ok) {
    throw new Error(`Failed to load README: ${readmeResponse.status}`);
  }

  const contributorsResponse = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contributors?per_page=12`,
    {
      headers,
      next: { revalidate: REVALIDATE_SECONDS, tags: ['repo-data'] }
    }
  );

  const contributorsJson = contributorsResponse.ok ? await contributorsResponse.json() : [];
  const contributors = Array.isArray(contributorsJson)
    ? contributorsJson.map((contributor) => ({
        login: contributor.login,
        avatarUrl: contributor.avatar_url,
        htmlUrl: contributor.html_url,
        contributions: contributor.contributions ?? 0
      }))
    : [];

  const readme = await readmeResponse.text();
  const fallbackValueProp = repoJson.description || 'A focused stack of tools to keep your momentum high.';

  const parsed = parseReadme(readme, fallbackValueProp);
  const { groups, toolDetails } = await fetchGroupsAndTools(headers);

  return {
    repo: {
      name: repoJson.name,
      fullName: repoJson.full_name,
      description: repoJson.description || fallbackValueProp,
      stars: repoJson.stargazers_count,
      forks: repoJson.forks_count,
      openIssues: repoJson.open_issues_count,
      updatedAt: repoJson.updated_at,
      htmlUrl: repoJson.html_url,
      owner: {
        login: repoJson.owner?.login ?? OWNER,
        avatarUrl: repoJson.owner?.avatar_url ?? ''
      }
    },
    readme,
    parsed,
    contributors,
    groups,
    toolDetails,
    fetchedAt: Date.now(),
  };
}


export { REVALIDATE_SECONDS };
