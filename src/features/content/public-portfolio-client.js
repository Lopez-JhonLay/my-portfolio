const REQUEST_TIMEOUT_MS = 10_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SECTION_KEYS = new Set(['hero', 'about', 'timeline', 'technologies', 'contact', 'media-resume']);
const SOCIAL_ICON_KEYS = new Set(['facebook', 'github', 'linkedin', 'external']);
const TECHNOLOGY_ICON_KEYS = new Set(['bigquery', 'cloudflare', 'cloudflare-workers', 'git', 'github', 'github-actions', 'google-cloud', 'javascript', 'jwt', 'material-ui', 'nestjs', 'nextjs', 'nodejs', 'postgresql', 'react', 'tailwind-css', 'typescript', 'vue']);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value, maximum) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function hasOnlyKeys(value, keys) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function parseHero(value) {
  const keys = ['name', 'role', 'heroRole', 'location', 'description'];
  if (!isRecord(value) || !hasOnlyKeys(value, keys)) throw new Error('Invalid Hero content');
  const limits = { name: 120, role: 160, heroRole: 120, location: 160, description: 2000 };
  if (Object.entries(limits).some(([key, maximum]) => !isText(value[key], maximum))) {
    throw new Error('Invalid Hero content');
  }
  return value;
}

function parseAbout(value) {
  if (!isRecord(value) || !hasOnlyKeys(value, ['paragraphs', 'facts']))
    throw new Error('Invalid About content');
  if (!Array.isArray(value.paragraphs) ||
    value.paragraphs.length < 1 || value.paragraphs.length > 12 ||
    !value.paragraphs.every((item) => isText(item, 2000)) ||
    !Array.isArray(value.facts) || value.facts.length < 1 || value.facts.length > 12 ||
    !value.facts.every((fact) => isRecord(fact) && hasOnlyKeys(fact, ['label', 'value']) &&
      isText(fact.label, 80) && isText(fact.value, 240))) {
    throw new Error('Invalid About content');
  }
  return value;
}

function parseContact(value) {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'availability', 'noteBody', 'email', 'socialLinks',
  ])) throw new Error('Invalid Contact content');
  if (!isText(value.availability, 2000) ||
    !isText(value.noteBody, 2000) || !isText(value.email, 320) ||
    !/^\S+@\S+\.\S+$/.test(value.email) || !Array.isArray(value.socialLinks) ||
    value.socialLinks.length > 12 || !value.socialLinks.every((link) =>
      isRecord(link) && hasOnlyKeys(link, ['label', 'href', 'iconKey']) &&
      isText(link.label, 80) && isHttpUrl(link.href) && SOCIAL_ICON_KEYS.has(link.iconKey))) {
    throw new Error('Invalid Contact content');
  }
  return value;
}

function parseTimeline(value) {
  if (!isRecord(value) || !hasOnlyKeys(value, ['entries']) ||
    !Array.isArray(value.entries) || value.entries.length < 1 || value.entries.length > 30 ||
    !value.entries.every((entry) => isRecord(entry) && hasOnlyKeys(entry, ['role', 'organization', 'location', 'date', 'detail']) &&
      isText(entry.role, 160) && isText(entry.organization, 160) && isText(entry.location, 160) && isText(entry.date, 160) && isText(entry.detail, 2000)))
    throw new Error('Invalid Timeline content');
  return value;
}

function parseTechnologies(value) {
  if (!isRecord(value) || !hasOnlyKeys(value, ['groups']) ||
    !Array.isArray(value.groups) || value.groups.length < 1 || value.groups.length > 20)
    throw new Error('Invalid Technologies content');
  const categories = value.groups.map((group) => {
    if (!isRecord(group) || !hasOnlyKeys(group, ['category', 'technologies']) || !isText(group.category, 120) ||
      !Array.isArray(group.technologies) || group.technologies.length < 1 || group.technologies.length > 40 ||
      !group.technologies.every((technology) => isRecord(technology) && hasOnlyKeys(technology, ['name', 'iconKey']) &&
        isText(technology.name, 120) && (technology.iconKey === undefined || TECHNOLOGY_ICON_KEYS.has(technology.iconKey))))
      throw new Error('Invalid Technologies content');
    const names = group.technologies.map(({ name }) => name.toLowerCase());
    if (new Set(names).size !== names.length) throw new Error('Invalid Technologies content');
    return group.category.toLowerCase();
  });
  if (new Set(categories).size !== categories.length) throw new Error('Invalid Technologies content');
  return value;
}

function parseMediaResume(value) {
  const validId = (id) => id === null ||
    (typeof id === 'string' && UUID_PATTERN.test(id));
  if (!isRecord(value) ||
    !hasOnlyKeys(value, ['profileImageMediaId', 'resumeMediaId']) ||
    !validId(value.profileImageMediaId) || !validId(value.resumeMediaId))
    throw new Error('Invalid Media content');
  return value;
}

const parsers = { hero: parseHero, about: parseAbout, timeline: parseTimeline, technologies: parseTechnologies, contact: parseContact, 'media-resume': parseMediaResume };

export function parsePublicContentSnapshot(value) {
  if (
    !isRecord(value) ||
    (value.status !== 'never-published' && value.status !== 'published') ||
    !Array.isArray(value.sections)
  )
    throw new Error('Invalid portfolio response');
  if (value.status === 'never-published') {
    if (!hasOnlyKeys(value, ['status', 'sections']) || value.sections.length !== 0)
      throw new Error('Invalid portfolio response');
    return { status: value.status, sections: {} };
  }
  if (
    !hasOnlyKeys(value, [
      'status',
      'snapshotRevision',
      'sections',
      'featuredProjects',
      'projectGroups',
    ]) ||
    typeof value.snapshotRevision !== 'string' ||
    !/^[1-9][0-9]*$/.test(value.snapshotRevision) ||
    !isRecord(value.featuredProjects) ||
    !Array.isArray(value.projectGroups)
  )
    throw new Error('Invalid portfolio response');
  const sections = {};
  for (const section of value.sections) {
    if (!isRecord(section) || typeof section.sectionKey !== 'string' ||
      !('document' in section)) throw new Error('Invalid portfolio response');
    if (SECTION_KEYS.has(section.sectionKey)) {
      if (section.sectionKey in sections) throw new Error('Invalid portfolio response');
      sections[section.sectionKey] = parsers[section.sectionKey](section.document);
    }
  }
  return { status: value.status, sections };
}

export async function readPublicContent(apiOrigin, signal) {
  const response = await fetch(new URL('/api/portfolio', apiOrigin), {
    headers: { Accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]) :
      AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('Published portfolio content could not be loaded.');
  return parsePublicContentSnapshot(await response.json());
}
