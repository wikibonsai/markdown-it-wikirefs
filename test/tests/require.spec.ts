// note:
// other tests use esm 'import' style imports.
// this test verifies 'require' style imports works too.

import assert from 'node:assert/strict';
import type MarkdownIt from 'markdown-it';
import markdown from 'markdown-it';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const wikirefs_plugin = require('../../dist/index.cjs.js');

// setup

let md: MarkdownIt;

describe('import', () => {

  beforeEach(() => {
    md = markdown().use(wikirefs_plugin);
  });

  it('require style', () => {
    assert.strictEqual(
      md.render('[[fname-a]]'),
      '<p><a class="wiki link" href="/fname-a" data-href="/fname-a">fname a</a></p>\n'
    );
  });

});
