# Productivity-App

Marketing site that renders live data from the `MagnusPladsen/Productivity-Stack` repo.

## Quick start

1. Install deps:

```bash
npm install
```

2. Add env vars (optional but recommended):

```bash
GITHUB_TOKEN=your_github_token
REVALIDATE_SECRET=some_random_value
NEXT_PUBLIC_REVALIDATE_TOKEN=some_random_value
```

3. Run locally:

```bash
npm run dev
```

## Notes
- `GITHUB_TOKEN` increases GitHub API rate limits.
- `REVALIDATE_SECRET` protects the on-demand refresh endpoint.
- `NEXT_PUBLIC_REVALIDATE_TOKEN` is used by the refresh button in the UI.
