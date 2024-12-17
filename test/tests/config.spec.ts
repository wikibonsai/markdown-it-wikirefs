import assert from 'node:assert/strict';

import { merge } from 'lodash';
import type MarkdownIt from 'markdown-it';

import type { WikiRefsOptions } from '../../src/util/types';

import markdown from 'markdown-it';
import wikirefs_plugin from '../../src';

import type { TestCase } from '../types';
import { makeMockOptsForRenderOnly } from '../config';


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

  describe('wiki construct toggling', () => {

    beforeEach(() => {
      env = { absPath: '/tests/fixtures/file-with-wikilink.md' };
      mockOpts = makeMockOptsForRenderOnly();
    });

    const wikiattrOpts = {
      attrs: { enable: true },
      links: { enable: false },
      embeds: { enable: false },
    };
    const wikilinkOpts = {
      attrs: { enable: false },
      links: { enable: true },
      embeds: { enable: false },
    };
    const wikiembedOpts = {
      attrs: { enable: false },
      links: { enable: false },
      embeds: { enable: true },
    };

    run('wikiattrs', [
      {
        descr: 'wikiattr; prefixed',
        opts: merge(mockOpts, wikiattrOpts),
        mkdn: ':attrtype::[[fname-a]]\n',
        html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>attrtype</dt>
<dd><a class="attr wiki reftype__attrtype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></dd>
</dl>
</aside>
`,
      },
      {
        descr: 'wikilink; typed',
        opts: merge(mockOpts, wikiattrOpts),
        mkdn: ':linktype::[[fname-a]].',
        html: '<p>:linktype::[[fname-a]].</p>\n',
      },
      {
        descr: 'wikilink; untyped',
        opts: merge(mockOpts, wikiattrOpts),
        mkdn: '[[fname-a]].',
        html: '<p>[[fname-a]].</p>\n',
      },
      {
        descr: 'wikiembed; mkdn',
        opts: merge(mockOpts, wikiattrOpts),
        mkdn: '![[fname-a]].',
        html: '<p>![[fname-a]].</p>\n',
      },
    ] as TestCase[]);

    run('wikilinks', [
      {
        descr: 'wikiattr; prefixed',
        opts: merge(mockOpts, wikilinkOpts),
        mkdn: ':attrtype::[[fname-a]]\n',
        html: '<p><a class="wiki link type reftype__attrtype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></p>\n',
      },
      {
        descr: 'wikilink; typed',
        opts: merge(mockOpts, wikilinkOpts),
        mkdn: ':linktype::[[fname-a]].',
        html: '<p><a class="wiki link type reftype__linktype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
      },
      {
        descr: 'wikilink; untyped',
        opts: merge(mockOpts, wikilinkOpts),
        mkdn: '[[fname-a]].',
        html: '<p><a class="wiki link" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
      },
      {
        descr: 'wikiembed; mkdn',
        opts: merge(mockOpts, wikilinkOpts),
        mkdn: '![[fname-a]].',
        html: '<p>!<a class="wiki link" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
      },
    ] as TestCase[]);

    run('wikiembeds', [
      {
        descr: 'wikiattr; prefixed',
        opts: merge(mockOpts, wikiembedOpts),
        mkdn: ':attrtype::[[fname-a]]\n',
        html: '<p>:attrtype::[[fname-a]]</p>\n',
      },
      {
        descr: 'wikilink; typed',
        opts: merge(mockOpts, wikiembedOpts),
        mkdn: ':linktype::[[fname-a]].',
        html: '<p>:linktype::[[fname-a]].</p>\n',
      },
      {
        descr: 'wikilink; untyped',
        opts: merge(mockOpts, wikiembedOpts),
        mkdn: '[[fname-a]].',
        html: '<p>[[fname-a]].</p>\n',
      },
      {
        descr: 'wikiembed; mkdn',
        opts: merge(mockOpts, wikiembedOpts),
        mkdn: '![[fname-a]].',
        html:
`<p>
<p>
<div class="embed-wrapper">
<div class="embed-title">
<a class="wiki embed" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">
title a
</a>
</div>
<div class="embed-link">
<a class="embed-link-icon" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">
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

  describe('doctypes', () => {

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
        descr: 'wikiembed; mkdn',
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
      {
        descr: 'wikiembed; no doctype for media; audio',
        opts: mockOpts,
        mkdn: '![[audio.mp3]].',
        html:
`<p>
<p>
<span class="embed-media" src="audio.mp3" alt="audio.mp3">
<audio class="embed-audio" controls type="audio/mp3" src="/audio.mp3"></audio>
</span>
</p>
.</p>
`,
      },
      {
        descr: 'wikiembed; no doctype for media; img',
        opts: mockOpts,
        mkdn: '![[img.png]].',
        html:
`<p>
<p>
<span class="embed-media" src="img.png" alt="img.png">
<img class="embed-image" src="/img.png">
</span>
</p>
.</p>
`,
      },
      {
        descr: 'wikiembed; no doctype for media; video',
        opts: mockOpts,
        mkdn: '![[video.mp4]].',
        html: 
`<p>
<p>
<span class="embed-media" src="video.mp4" alt="video.mp4">
<video class="embed-video" controls type="video/mp4" src="/video.mp4"></video>
</span>
</p>
.</p>
`,
      },
    ] as TestCase[]);

  });

});
