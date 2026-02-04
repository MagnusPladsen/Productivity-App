import { parseReadme, type ParsedReadme } from './readme';

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
};

function buildHeaders() {
  const headers: Record<string, string> = {
    'User-Agent': 'productivity-stack-site'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
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
    contributors
  };
}

export { REVALIDATE_SECONDS };
