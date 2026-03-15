// note:
// other tests use the ESM build (index.js).
// This spec verifies the CJS build is consumable (here via ESM import).
// True require() consumption is tested by test/require-check.cjs (run as CJS).

import assert from 'node:assert/strict';
import type MarkdownIt from 'markdown-it';
import markdown from 'markdown-it';
import wikirefs_plugin from '../../dist/index.cjs.js';

// setup

let md: MarkdownIt;

describe('cjs build', () => {

  beforeEach(() => {
    md = markdown().use(wikirefs_plugin);
  });

  it('is consumable (ESM import of CJS build) and renders wiki links', () => {
    assert.strictEqual(
      md.render('[[fname-a]]'),
      '<p><a class="wiki link" href="/fname-a" data-href="/fname-a">fname a</a></p>\n'
    );
  });

});
