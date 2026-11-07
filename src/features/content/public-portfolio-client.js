const REQUEST_TIMEOUT_MS = 10_000;
const SECTION_KEYS = new Set(['hero', 'about', 'contact']);
const NAVIGATION_DESTINATIONS = [
  '/#home',
  '/#about',
  '/#projects',
  '/#experience',
  '/#skills',
  '/#contact',
];
const SOCIAL_ICON_KEYS = new Set(['facebook', 'github', 'linkedin', 'external']);

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
  const keys = [
    'browserTitle', 'name', 'brand', 'role', 'heroRole', 'location', 'navigation',
    'sectionTag', 'title', 'description', 'resumeButtonLabel', 'scrollCue',
  ];
  if (!isRecord(value) || !hasOnlyKeys(value, keys)) throw new Error('Invalid Hero content');
  const limits = { browserTitle: 120, name: 120, brand: 12, role: 160, heroRole: 120,
    location: 160, sectionTag: 80, title: 160, description: 2000,
    resumeButtonLabel: 80, scrollCue: 80 };
  if (Object.entries(limits).some(([key, maximum]) => !isText(value[key], maximum))) {
    throw new Error('Invalid Hero content');
  }
  if (!Array.isArray(value.navigation) || value.navigation.length !== 6) {
    throw new Error('Invalid Hero navigation');
  }
  const destinations = value.navigation.map((item) => {
    if (!isRecord(item) || !hasOnlyKeys(item, ['label', 'href']) ||
      !isText(item.label, 80) || !NAVIGATION_DESTINATIONS.includes(item.href)) {
      throw new Error('Invalid Hero navigation');
    }
    return item.href;
  });
  if (new Set(destinations).size !== 6) throw new Error('Invalid Hero navigation');
  return value;
}

function parseAbout(value) {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'eyebrow', 'title', 'lead', 'paragraphs', 'facts', 'stamp', 'photoCaptionPrefix',
  ])) throw new Error('Invalid About content');
  if (!isText(value.eyebrow, 80) || !isText(value.title, 160) ||
    !isText(value.lead, 2000) || !isText(value.stamp, 80) ||
    !isText(value.photoCaptionPrefix, 160) || !Array.isArray(value.paragraphs) ||
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
    'eyebrow', 'title', 'availability', 'noteTitle', 'noteBody', 'email',
    'socialLinks', 'footerPrimary', 'footerSecondary',
  ])) throw new Error('Invalid Contact content');
  if (!isText(value.eyebrow, 80) || !isText(value.title, 160) ||
    !isText(value.availability, 2000) || !isText(value.noteTitle, 160) ||
    !isText(value.noteBody, 2000) || !isText(value.email, 320) ||
    !/^\S+@\S+\.\S+$/.test(value.email) || !isText(value.footerPrimary, 240) ||
    !isText(value.footerSecondary, 240) || !Array.isArray(value.socialLinks) ||
    value.socialLinks.length > 12 || !value.socialLinks.every((link) =>
      isRecord(link) && hasOnlyKeys(link, ['label', 'href', 'iconKey']) &&
      isText(link.label, 80) && isHttpUrl(link.href) && SOCIAL_ICON_KEYS.has(link.iconKey))) {
    throw new Error('Invalid Contact content');
  }
  return value;
}

const parsers = { hero: parseHero, about: parseAbout, contact: parseContact };

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
