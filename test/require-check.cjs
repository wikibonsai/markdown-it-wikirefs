'use strict';

// Run as CommonJS to verify the CJS build is consumable via require().
// Invoked by test script after mocha (e.g. "nyc mocha && node test/require-check.cjs").

const path = require('path');
const MarkdownIt = require('markdown-it');
const wikirefs_plugin = require(path.join(__dirname, '..', 'dist', 'index.cjs.js'));

const md = MarkdownIt().use(wikirefs_plugin);
const out = md.render('[[fname-a]]');
const expected = '<p><a class="wiki link" href="/fname-a" data-href="/fname-a">fname a</a></p>\n';

if (out !== expected) {
  console.error('require-check.cjs: expected\n', expected, '\ngot\n', out);
  process.exit(1);
}
