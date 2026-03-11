import { slugify } from "@/lib/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the text after a `# ` heading on the first matching line. */
function extractHeading(lines: string[]): string {
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/);
    if (m) return m[1].trim();
  }
  return "";
}

/** Return the index range (start inclusive, end exclusive) of a `## Section`. */
function sectionRange(
  lines: string[],
  heading: string
): [start: number, end: number] | null {
  const pattern = new RegExp(`^##\\s+${escapeRegex(heading)}\\s*$`, "i");
  const start = lines.findIndex((l) => pattern.test(l));
  if (start === -1) return null;

  let end = start + 1;
  while (end < lines.length && !/^##\s/.test(lines[end])) {
    end++;
  }
  return [start + 1, end];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip the `.md` extension and return the base name. */
function stripMd(filename: string): string {
  return filename.replace(/\.md$/i, "");
}

// ---------------------------------------------------------------------------
// parseToolMarkdown
// ---------------------------------------------------------------------------

export function parseToolMarkdown(
  markdown: string,
  slug: string,
  group: string
): ToolDetail {
  const lines = markdown.split("\n");

  // --- name ---
  const name = extractHeading(lines);

  // --- description (first blockquote) ---
  let description = "";
  for (const line of lines) {
    const bq = line.match(/^>\s*(.+)/);
    if (bq) {
      description = bq[1].trim();
      break;
    }
  }

  // --- platforms ---
  let platforms: string[] = [];
  for (const line of lines) {
    const pm = line.match(/\*\*Platforms:\*\*\s*(.+)/i);
    if (pm) {
      platforms = pm[1].split(",").map((p) => p.trim()).filter(Boolean);
      break;
    }
  }

  // --- links ---
  const links: ToolDetail["links"] = [];
  const linksRange = sectionRange(lines, "Links");
  if (linksRange) {
    for (let i = linksRange[0]; i < linksRange[1]; i++) {
      const lm = lines[i].match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) {
        links.push({ label: lm[1], url: lm[2] });
      }
    }
  }

  // --- install sections ---
  const installSections: ToolDetail["installSections"] = [];
  const installRange = sectionRange(lines, "Install");
  if (installRange) {
    let currentSection: ToolDetail["installSections"][number] | null = null;

    for (let i = installRange[0]; i < installRange[1]; i++) {
      const line = lines[i];

      // ### OS heading
      const h3 = line.match(/^###\s+(.+)/);
      if (h3) {
        if (currentSection) installSections.push(currentSection);
        currentSection = { label: h3[1].trim(), blocks: [] };
        continue;
      }

      // Bold label like **Ubuntu/Debian:**
      const boldLabel = line.match(/^\*\*([^*]+):\*\*\s*$/);

      // Code fence opening
      const fenceOpen = line.match(/^```(\w*)/);
      if (fenceOpen && currentSection) {
        const lang = fenceOpen[1] || "bash";
        const blockLabel = boldLabel
          ? undefined
          : (() => {
              // Look back for a bold label on the previous non-empty line
              for (let j = i - 1; j >= (installRange[0]); j--) {
                const prev = lines[j].trim();
                if (!prev) continue;
                const bl = prev.match(/^\*\*([^*]+):\*\*$/);
                if (bl) return bl[1].trim();
                break;
              }
              return undefined;
            })();

        // Collect code until closing fence
        const codeLines: string[] = [];
        i++;
        while (i < installRange[1] && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        currentSection.blocks.push({
          ...(blockLabel ? { label: blockLabel } : {}),
          code: codeLines.join("\n"),
          lang,
        });
        continue;
      }
    }
    if (currentSection) installSections.push(currentSection);
  }

  // --- alternatives ---
  const alternatives: ToolDetail["alternatives"] = [];
  const altRange = sectionRange(lines, "Alternatives");
  if (altRange) {
    for (let i = altRange[0]; i < altRange[1]; i++) {
      const am = lines[i].match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!am) continue;
      const altName = am[1];
      const href = am[2];

      // Cross-group: ../other-group/tool.md
      const crossGroup = href.match(/^\.\.\/([^/]+)\/([^/]+)\.md$/);
      if (crossGroup) {
        alternatives.push({
          name: altName,
          slug: stripMd(crossGroup[2]),
          group: crossGroup[1],
        });
        continue;
      }

      // Same-group: tool.md or ./tool.md
      const sameGroup = href.match(/^(?:\.\/)?([^/]+)\.md$/);
      if (sameGroup) {
        alternatives.push({
          name: altName,
          slug: stripMd(sameGroup[1]),
        });
        continue;
      }

      // Fallback
      alternatives.push({
        name: altName,
        slug: slugify(altName),
      });
    }
  }

  return {
    name,
    slug,
    group,
    description,
    platforms,
    links,
    installSections,
    alternatives,
  };
}

// ---------------------------------------------------------------------------
// parseGroupReadme
// ---------------------------------------------------------------------------

export function parseGroupReadme(
  markdown: string,
  groupSlug: string
): GroupDetail {
  const lines = markdown.split("\n");

  const name = extractHeading(lines);

  // description: first non-heading, non-table, non-empty line
  let description = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("|")) continue;
    if (trimmed.startsWith(">")) {
      description = trimmed.replace(/^>\s*/, "");
      break;
    }
    description = trimmed;
    break;
  }

  // Parse markdown table rows
  const tools: GroupToolEntry[] = [];
  let inTable = false;
  let headerSkipped = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (inTable) break; // table ended
      continue;
    }

    if (!inTable) {
      inTable = true;
      headerSkipped = false;
      continue; // skip header row
    }

    if (!headerSkipped) {
      // skip separator row (|---|---|...)
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        headerSkipped = true;
        continue;
      }
    }

    // Parse data row
    const cells = trimmed
      .split("|")
      .slice(1, -1) // remove leading/trailing empty from split
      .map((c) => c.trim());

    if (cells.length < 4) continue;

    const [toolCell, platformsCell, openSourceCell, descCell] = cells;

    // Extract name and slug from [Name](file.md)
    const linkMatch = toolCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const toolName = linkMatch ? linkMatch[1] : toolCell;
    const toolSlug = linkMatch ? stripMd(linkMatch[2]) : slugify(toolCell);

    tools.push({
      name: toolName,
      slug: toolSlug,
      platforms: platformsCell,
      openSource: openSourceCell,
      description: descCell,
    });
  }

  return {
    name,
    slug: groupSlug,
    description,
    tools,
  };
}
