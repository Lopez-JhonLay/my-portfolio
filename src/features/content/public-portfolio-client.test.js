import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePublicContentSnapshot } from './public-portfolio-client.js';

const hero = {
  name: 'Jhon', role: 'Developer', heroRole: 'Developer', location: 'Pasay',
  description: 'Description',
};

test('uses only validated published content sections', () => {
  const result = parsePublicContentSnapshot({
    status: 'published', snapshotRevision: '2', featuredProjects: {}, projectGroups: [],
    sections: [{ sectionKey: 'hero', document: hero }, { sectionKey: 'projects-presentation', document: {} }],
  });
  assert.deepEqual(result, { status: 'published', sections: { hero } });
});

test('rejects unsafe or malformed published content', () => {
  assert.throws(() => parsePublicContentSnapshot({
    status: 'published', snapshotRevision: '2', featuredProjects: {}, projectGroups: [],
    sections: [{ sectionKey: 'hero', document: { ...hero, name: '' } }],
  }));

  assert.throws(() => parsePublicContentSnapshot({
    status: 'published', snapshotRevision: '2', featuredProjects: {}, projectGroups: [],
    sections: [{
      sectionKey: 'media-resume',
      document: { profileImageMediaId: '11111111-1111-1111-1111-111111111111', resumeMediaId: null },
    }],
  }));
});

test('returns no replacements before first publication', () => {
  assert.deepEqual(parsePublicContentSnapshot({ status: 'never-published', sections: [] }), {
    status: 'never-published', sections: {},
  });
});
