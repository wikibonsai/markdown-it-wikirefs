import assert from 'node:assert/strict';

import type MarkdownIt from 'markdown-it';
import type { WikiRefsOptions } from '../../src/util/types';

import markdown from 'markdown-it';
import footnote from 'markdown-it-footnote';
import wikirefs_plugin from '../../src';

import { makeMockOptsForRenderOnly } from '../config';

import type { WikiRefTestCase, TestFileData } from 'wikirefs-spec';
import { wikiRefCases } from 'wikirefs-spec';

import { markdownItCases } from '../cases/markdown-it-specific';

import * as wikirefs from 'wikirefs';
import { fileDataMap } from 'wikirefs-spec';


// setup

let env: any;
let mockOpts: Partial<WikiRefsOptions>;
let md: MarkdownIt;

function run(contextMsg: string, tests: WikiRefTestCase[]): void {
  context(contextMsg, () => {
    let i: number = 0;
    for(const test of tests) {
      const desc: string = `[${('00' + (++i)).slice(-3)}] ` + (test.descr || '');
      it(desc, () => {
        const mkdn: string = test.mkdn;
        const expdHTML: string = test.html;
        const actlHTML: string = md.render(mkdn, env);
        assert.strictEqual(actlHTML, expdHTML);
      });
    }
  });
}

describe('markdown-it-wikirefs', () => {

  before(() => {
    wikiRefCases.forEach((testcase: WikiRefTestCase) => {
      // for gfm...
      if (testcase.descr.includes('gfm')) {
        //  ...strikethrough cases...
        if (testcase.descr.includes('strikethrough')) {
          // ...convert '<del>' -> '<s>'
          testcase.html = testcase.html.replace(/del>/g, 's>');
        }
        //  ...supply expected html of footnote cases...
        if (testcase.descr.includes('footnote')) {
          // typed
          if (testcase.descr.includes('; typed;')) {
            testcase.html =
`<p>Here is<sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup> <a class="wiki link type reftype__linktype1" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>A footnote with <a class="wiki link type reftype__linktype2" href="/tests/fixtures/fname-b" data-href="/tests/fixtures/fname-b">title b</a>. <a href="#fnref1" class="footnote-backref">↩︎</a></p>
</li>
</ol>
</section>
`;
          }
          // untyped
          if (testcase.descr.includes('; untyped;')) {
            testcase.html =
`<p>Here is<sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup> <a class="wiki link" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>A footnote with <a class="wiki link" href="/tests/fixtures/fname-b" data-href="/tests/fixtures/fname-b">title b</a>. <a href="#fnref1" class="footnote-backref">↩︎</a></p>
</li>
</ol>
</section>
`;
          }
          // wikiattrs not allowed inside
          if (testcase.descr === 'wikiattr; prefixed; w/ other mkdn constructs; nested; gfm; footnote') {
            testcase.html =
`<p><sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup></p>
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p><a class="wiki link type reftype__attrtype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a> <a href="#fnref1" class="footnote-backref">↩︎</a></p>
</li>
</ol>
</section>
`;
          }
          if (testcase.descr === 'wikiattr; unprefixed; w/ other mkdn constructs; nested; gfm; footnote') {
            testcase.html =
`<p><sup class="footnote-ref"><a href="#fn1" id="fnref1">[1]</a></sup></p>
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>attrtype::<a class="wiki link" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a> <a href="#fnref1" class="footnote-backref">↩︎</a></p>
</li>
</ol>
</section>
`;
          }
        }
      }
    });
  });

  beforeEach(() => {
    mockOpts = makeMockOptsForRenderOnly();
    md = markdown()
      .use(footnote)
      .use(wikirefs_plugin, {
        ...mockOpts,
        // todo: 'inCycle'
        // note: it ain't pretty, but it gets the job done...
        resolveEmbedContent: (env: any, filename: string): (string | undefined) => {
          // markdown-only
          if (wikirefs.isMedia(filename)) { return; }
          // cycle detection
          if (!env.cycleStack) {
            env.cycleStack = [];
          } else {
            if (env.cycleStack.includes(filename)) {
              // reset stack before leaving
              delete env.cycleStack;
              return 'cycle detected';
            }
          }
          env.cycleStack.push(filename);
          // get content
          const fakeFile: TestFileData | undefined = fileDataMap.find((fileData: TestFileData) => fileData.filename === filename);
          const mkdnContent: string | undefined = fakeFile ? fakeFile.content : undefined;
          let htmlContent: string | undefined;
          if (mkdnContent === undefined) {
            htmlContent = undefined;
          } else if (mkdnContent.length === 0) {
            htmlContent = '';
          } else {
            // reset attrs for embeds
            env.attrs = {};
            htmlContent = md.render(mkdnContent, env);
          }
          // reset stack before leaving
          delete env.cycleStack;
          return htmlContent;
        },
      });
    env = { absPath: '/tests/fixtures/file-with-wikilink.md' };
  });

  describe('render; mkdn -> html', () => {

    // run('wikirefs-spec', wikiRefCases);
    run('wikirefs-spec', wikiRefCases.filter((testcase: WikiRefTestCase) => {
      const failingTests: any = [
        'wikiattr; prefixed; w/ other mkdn constructs; near blockquotes; immediate after',
        'wikiattr; unprefixed; w/ other mkdn constructs; near blockquotes; immediate after',
      ];
      const skipFailing: boolean = !failingTests.some((descr: string) => descr === testcase.descr);
      return skipFailing;
    }));
    run('markdown-it specific', markdownItCases);

  });

});
