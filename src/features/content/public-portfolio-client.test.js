import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePublicContentSnapshot } from './public-portfolio-client.js';

const hero = {
  browserTitle: 'Portfolio', name: 'Jhon', brand: 'JL', role: 'Developer',
  heroRole: 'Developer', location: 'Pasay', sectionTag: 'Open File', title: 'Web',
  description: 'Description', resumeButtonLabel: 'Download', scrollCue: 'Descend',
  navigation: [
    ['Home', '/#home'], ['About', '/#about'], ['Projects', '/#projects'],
    ['Experience', '/#experience'], ['Skills', '/#skills'], ['Contact', '/#contact'],
  ].map(([label, href]) => ({ label, href })),
};

test('uses only validated published content sections', () => {
  const result = parsePublicContentSnapshot({
    status: 'published', snapshotRevision: '2', featuredProjects: {}, projectGroups: [],
    sections: [{ sectionKey: 'hero', document: hero }, { sectionKey: 'timeline', document: {} }],
  });
  assert.deepEqual(result, { status: 'published', sections: { hero } });
});

test('rejects unsafe or malformed published content', () => {
  assert.throws(() => parsePublicContentSnapshot({
    status: 'published', snapshotRevision: '2', featuredProjects: {}, projectGroups: [],
    sections: [{ sectionKey: 'hero', document: { ...hero, navigation: [] } }],
  }));
});

test('returns no replacements before first publication', () => {
  assert.deepEqual(parsePublicContentSnapshot({ status: 'never-published', sections: [] }), {
    status: 'never-published', sections: {},
  });
});
