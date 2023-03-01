import assert from 'node:assert/strict';

import { merge } from 'lodash';
import type MarkdownIt from 'markdown-it';

import type { WikiRefsOptions } from '../../src/util/types';

import markdown from 'markdown-it';
import wikirefs_plugin from '../../src';

import type { TestCase } from '../types';


/* eslint-disable-next-line @typescript-eslint/no-unused-vars */ // env is used by markdown-it internally
let env: any;
let mockOpts: Partial<WikiRefsOptions>;

function run(contextMsg: string, tests: TestCase[]): void {
  context(contextMsg, () => {
    let i: number = 0;
    for(const test of tests) {
      const desc: string = `[${('00' + (++i)).slice(-3)}] ` + (test.descr || '');
      it(desc, () => {
        const mkdn: string = test.mkdn;
        const expdHtml: string = test.html;
        const testOpts: Partial<WikiRefsOptions> = merge(mockOpts, test.opts);
        const md: MarkdownIt = markdown().use(wikirefs_plugin, testOpts);
        const actlHtml: string = md.render(mkdn);
        assert.strictEqual(actlHtml, expdHtml);
      });
    }
  });
}

describe('configs', () => {

  beforeEach(() => {
    env = { absPath: '/tests/fixtures/file-with-wikilink.md' };
    mockOpts = { resolveDocType: () => 'doctype' };
  });

  run('\'render feature\'; disable attrbox rendering', [
    {
      descr: 'wikiattr; unprefixed',
      opts: { attrs: { render: false } },
      mkdn: 'attrtype::[[fname-a]]\n',
      html: '',
    },
    {
      descr: 'wikiattr; prefixed',
      opts: { attrs: { render: false } },
      mkdn: ':attrtype::[[fname-a]]\n',
      html: '',
    },
  ] as TestCase[]);

  run('\'doctype feature\'; \'resolveDocType\' populates doctype css class', [
    {
      descr: 'wikiattr; unprefixed',
      opts: mockOpts,
      mkdn: 'attrtype::[[fname-a]]\n',
      html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>attrtype</dt>
<dd><a class="attr wiki reftype__attrtype doctype__doctype" href="/fname-a" data-href="/fname-a">fname a</a></dd>
</dl>
</aside>
`,
    },
    {
      descr: 'wikiattr; prefixed',
      opts: mockOpts,
      mkdn: ':attrtype::[[fname-a]]\n',
      html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>attrtype</dt>
<dd><a class="attr wiki reftype__attrtype doctype__doctype" href="/fname-a" data-href="/fname-a">fname a</a></dd>
</dl>
</aside>
`,
    },
    {
      descr: 'wikilink; typed',
      opts: mockOpts,
      mkdn: ':linktype::[[fname-a]].',
      html: '<p><a class="wiki link type reftype__linktype doctype__doctype" href="/fname-a" data-href="/fname-a">fname a</a>.</p>\n',
    },
    {
      descr: 'wikilink; untyped',
      opts: mockOpts,
      mkdn: '[[fname-a]].',
      html: '<p><a class="wiki link doctype__doctype" href="/fname-a" data-href="/fname-a">fname a</a>.</p>\n',
    },
    {
      descr: 'wikiembed',
      opts: mockOpts,
      mkdn: '![[fname-a]].',
      html: 
`<p>
<p>
<div class="embed-wrapper">
<div class="embed-title">
<a class="wiki embed doctype__doctype" href="/fname-a" data-href="/fname-a">
fname a
</a>
</div>
<div class="embed-link">
<a class="embed-link-icon" href="/fname-a" data-href="/fname-a">
<i class="link-icon"></i>
</a>
</div>
<div class="embed-content">
fname-a content
</div>
</div>
</p>
.</p>
`,
    },
  ] as TestCase[]);

});
