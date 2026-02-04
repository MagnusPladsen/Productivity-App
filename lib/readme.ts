export type ReadmeSection = {
  title: string;
  content: string;
};

export type ParsedReadme = {
  intro: string;
  valueProposition: string;
  sections: ReadmeSection[];
  tools: Array<{ name: string; description: string; tags: string[]; url?: string }>;
};

const headingRegex = /^(#{1,6})\s+(.+)$/;

function splitIntoSections(markdown: string): ReadmeSection[] {
  const lines = markdown.split('\n');
  const sections: ReadmeSection[] = [];
  let current: ReadmeSection | null = null;

  for (const line of lines) {
    const headingMatch = line.match(headingRegex);
    if (headingMatch) {
      if (current) {
        current.content = current.content.trim();
        sections.push(current);
      }
      current = { title: headingMatch[2].trim(), content: '' };
      continue;
    }

    if (!current) {
      current = { title: 'Intro', content: '' };
    }

    current.content += `${line}\n`;
  }

  if (current) {
    current.content = current.content.trim();
    sections.push(current);
  }

  return sections;
}

function extractValueProp(intro: string): string {
  const cleaned = intro.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return '';
  }
  const sentenceMatch = cleaned.match(/(.+?)(\.|\!|\?|$)/);
  return sentenceMatch ? sentenceMatch[1].trim() : cleaned;
}

function normalizeTag(tag: string) {
  return tag.replace(/^#/, '').trim();
}

function dedupeTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean)));
}

function parseTagsFromText(text: string): { text: string; tags: string[]; url?: string } {
  let cleaned = text;
  const tags: string[] = [];
  let url: string | undefined;

  const urlMatch = cleaned.match(/\[(.+?)\]\((https?:\/\/[^)]+)\)/);
  if (urlMatch) {
    url = urlMatch[2];
    cleaned = cleaned.replace(urlMatch[0], urlMatch[1]).trim();
  }

  const tagMatch = cleaned.match(/\((?:tags?|categories?)\s*:\s*([^)]+)\)/i);
  if (tagMatch) {
    const parsed = tagMatch[1]
      .split(',')
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);
    tags.push(...parsed);
    cleaned = cleaned.replace(tagMatch[0], '').trim();
  }

  const hashTags = cleaned.match(/(^|\s)#([a-z0-9-]+)/gi);
  if (hashTags) {
    for (const tag of hashTags) {
      const parsed = normalizeTag(tag);
      if (parsed) tags.push(parsed);
    }
    cleaned = cleaned.replace(/(^|\s)#[a-z0-9-]+/gi, '').trim();
  }

  return { text: cleaned, tags: dedupeTags(tags), url };
}

function parseToolLine(line: string): { name: string; description: string; tags: string[]; url?: string } | null {
  const cleaned = line.replace(/^([-*+]|\d+\.)\s+/, '').trim();
  if (!cleaned) return null;

  const boldMatch = cleaned.match(/\*\*(.+?)\*\*/);
  if (boldMatch) {
    const name = boldMatch[1].trim();
    const descriptionRaw = cleaned.replace(boldMatch[0], '').replace(/^[:\-–—]\s*/, '').trim();
    const parsed = parseTagsFromText(descriptionRaw);
    return { name, description: parsed.text || 'Part of the core stack.', tags: parsed.tags, url: parsed.url };
  }

  const linkMatch = cleaned.match(/\[(.+?)\]\((.+?)\)/);
  if (linkMatch) {
    const name = linkMatch[1].trim();
    const descriptionRaw = cleaned.replace(linkMatch[0], '').replace(/^[:\-–—]\s*/, '').trim();
    const parsed = parseTagsFromText(descriptionRaw);
    return { name, description: parsed.text || 'Part of the core stack.', tags: parsed.tags, url: linkMatch[2] };
  }

  const separatorMatch = cleaned.match(/^(.*?)(?:\s*[-–—:]\s*)(.+)$/);
  if (separatorMatch) {
    const parsed = parseTagsFromText(separatorMatch[2].trim());
    return { name: separatorMatch[1].trim(), description: parsed.text, tags: parsed.tags, url: parsed.url };
  }

  const parsed = parseTagsFromText(cleaned);
  return { name: parsed.text, description: 'Part of the core stack.', tags: parsed.tags, url: parsed.url };
}

function isSeparatorRow(cells: string[]) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseToolTable(content: string): Array<{ name: string; description: string; tags: string[]; url?: string }> {
  const rows = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|'));

  if (rows.length < 2) return [];

  const headerCells = rows[0].split('|').map((cell) => cell.trim()).filter(Boolean);
  const separatorCells = rows[1].split('|').map((cell) => cell.trim()).filter(Boolean);

  if (!headerCells.length || !separatorCells.length || !isSeparatorRow(separatorCells)) {
    return [];
  }

  const nameIndex = headerCells.findIndex((cell) => /tool|name/i.test(cell));
  const descIndex = headerCells.findIndex((cell) => /desc|summary|why/i.test(cell));
  const tagIndex = headerCells.findIndex((cell) => /tag|category|type/i.test(cell));
  const urlIndex = headerCells.findIndex((cell) => /url|link|site/i.test(cell));

  return rows.slice(2).flatMap((row) => {
    const cells = row.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (!cells.length) return [];
    const name = cells[nameIndex >= 0 ? nameIndex : 0] ?? '';
    const description = cells[descIndex >= 0 ? descIndex : 1] ?? '';
    const tagsCell = cells[tagIndex] ?? '';
    const urlCell = cells[urlIndex] ?? '';
    const tags = dedupeTags(
      tagsCell
      .split(/[,/]/)
    );
    if (!name) return [];
    return [
      {
        name,
        description: description || 'Part of the core stack.',
        tags,
        url: urlCell || undefined
      }
    ];
  });
}

export function parseReadme(markdown: string, fallbackValueProp: string): ParsedReadme {
  const sections = splitIntoSections(markdown);
  const introSection = sections.find((section) => section.title.toLowerCase() === 'intro') || sections[0];
  const intro = introSection?.content ?? '';
  const valueProposition = extractValueProp(intro) || fallbackValueProp;

  const toolsSection = sections.find((section) =>
    /tools|stack|tooling|apps/i.test(section.title)
  );

  const tools: Array<{ name: string; description: string; tags: string[]; url?: string }> = [];
  if (toolsSection) {
    const lines = toolsSection.content.split('\n');
    for (const line of lines) {
      if (!/^([-*+]|\d+\.)\s+/.test(line.trim())) continue;
      const parsed = parseToolLine(line.trim());
      if (parsed) tools.push(parsed);
    }

    if (tools.length === 0) {
      tools.push(...parseToolTable(toolsSection.content));
    }
  }

  return {
    intro,
    valueProposition,
    sections,
    tools
  };
}
