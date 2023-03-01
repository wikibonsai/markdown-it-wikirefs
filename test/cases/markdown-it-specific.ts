/*
 * note: periods are added to the end of test wikilinks to illustrate that they
 * really are 'link' elements.
 */

import type { TestCase } from '../types';


export const markdownItCases: TestCase[] = [
  // stop char; wikilink
  {
    descr: 'markdown-it-specific; wikilink; typed; w/ stop chars; kebab-case',
    mkdn: ':link-type::[[fname-a]].',
    html: '<p><a class="wiki link type reftype__link-type" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
  },
  {
    descr: 'markdown-it-specific; wikilink; typed; w/ stop chars; kebab-case; multi',
    mkdn: ':link-type-again::[[fname-a]].',
    html: '<p><a class="wiki link type reftype__link-type-again" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
  },
  {
    descr: 'markdown-it-specific; wikilink; typed; w/ stop chars; snake_case',
    mkdn: ':link_type::[[fname-a]].',
    html: '<p><a class="wiki link type reftype__link_type" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
  },
  {
    descr: 'markdown-it-specific; wikilink; typed; w/ stop chars; & (rm\'d because slugify)',
    mkdn: ':link&type::[[fname-a]].',
    html: '<p><a class="wiki link type reftype__linktype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>.</p>\n',
  },
  {
    descr: 'markdown-it-specific; wikilink; typed; labelled w/ [single brackets]',
    mkdn: ':link-type::[[fname-a|[bracketted] label txt]].',
    html: '<p><a class="wiki link type reftype__link-type" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">[bracketted] label txt</a>.</p>\n',
  },
  // stop char; wikiattr
  {
    descr: 'markdown-it-specific; wikiattr; prefixed; w/ stop chars; kebab-case; single',
    mkdn: ':link-type::[[fname-a]]\n',
    html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>link-type</dt>
<dd><a class="attr wiki reftype__link-type" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></dd>
</dl>
</aside>
`,
  },
  {
    descr: 'markdown-it-specific; wikiattr; prefixed; w/ stop chars; kebab-case; multi',
    mkdn: ':link-type-again::[[fname-a]]\n',
    html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>link-type-again</dt>
<dd><a class="attr wiki reftype__link-type-again" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></dd>
</dl>
</aside>
`,
  },
  {
    descr: 'markdown-it-specific; wikiattr; prefixed; w/ stop chars; snake_case',
    mkdn: ':link_type::[[fname-a]]\n',
    html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>link_type</dt>
<dd><a class="attr wiki reftype__link_type" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></dd>
</dl>
</aside>
`,
  },
  // todo: maybe come back to this...
  {
    descr: 'markdown-it-specific; wikiattr; prefixed; w/ stop chars; &',
    error: true,
    mkdn: ':link&type::[[fname-a]]\n',
    html:
`<aside class="attrbox">
<span class="attrbox-title">Attributes</span>
<dl>
<dt>link&type</dt>
<dd><a class="attr wiki reftype__linktype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></dd>
</dl>
</aside>
`,
  },
  // bugs
  {
    descr: 'markdown-it-specific; found bugs; [[wikilink]] on later line; empty attr value',
    mkdn: ': linktype ::\n\n[[wikilink]]\n',
    html: '<p>: linktype ::</p>\n<p><a class="wiki link invalid">[[wikilink]]</a></p>\n',
  },
  {
    descr: 'markdown-it-specific; found bugs; [[wikilink]] on later line; empty string attr value',
    mkdn: ': linktype :: \'\'\n\n[[wikilink]]\n',
    html: '<p>: linktype :: \'\'</p>\n<p><a class="wiki link invalid">[[wikilink]]</a></p>\n',
  },
  {
    descr: 'markdown-it-specific; found bugs; typed wikilink between newlines and other chars',
    mkdn: 'some text\n:something::[[fname-a]] and...\n',
    html: '<p>some text\n<a class="wiki link type reftype__something" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a> and...</p>\n',
  },
];
