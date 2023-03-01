import type MarkdownIt from 'markdown-it/lib';
import type Token from 'markdown-it/lib/token';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

import * as wikirefs from 'wikirefs';

import type { AttrWikiData, WikiAttrsOptions } from '../util/types';


export const wikiattrs = (md: MarkdownIt, opts: WikiAttrsOptions): void => {

  // rulers
  // '.getRules('attrs')' is really testing for markdown-it-'caml'
  // 'attrs' is added as an extra dummy 'alt' specifically for this purpose
  // (directly accessing the 'caml' rule would be ideal, but markdown-it
  //  doesn't seem to have a mechanism for that and not sure how to
  //  attach a 'name' property to sinon fakes)
  const attrRules: any = md.block.ruler.getRules('attrs');
  if (opts.attrs.render && attrRules.length === 0) {
    // the 'attrbox' rule is the midpoint between the parse and render rules.
    md.core.ruler.after('inline', 'wiki_attrbox', wiki_attrbox);
  }
  // should execute just after 'markdown-it-caml': 
  // [ ..., 'hr', 'caml', 'wikiattr', 'list', ... ]
  md.block.ruler.before('list', 'wikiattr', block, { alt: ['paragraph', 'attrs' ] });  // in case bugs show up: [ 'paragraph', 'reference', 'blockquote', 'list' ]
  // render
  md.renderer.rules.metadata_wikiattr = metadata_wikiattr;
  md.renderer.rules.wikiattr_open     = wikiattr_open;
  md.renderer.rules.wikiattr_key      = wikiattr_key;
  md.renderer.rules.wikiattr_val      = wikiattr_val;
  md.renderer.rules.wikiattr_close    = wikiattr_close;

  // rulers

  function block(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
    // from: https://github.com/markdown-it/markdown-it/blob/df4607f1d4d4be7fdc32e71c04109aea8cc373fa/lib/rules_block/list.js#L132
    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    // 'bMarks' = beginning of line markers
    // 'eMarks' = end of line markers
    let pos: number = state.bMarks[startLine];
    let max: number = state.eMarks[startLine];

    // return false cases //

    // 'wikiattrs' must be at the top-most-level
    // !('list' | 'blockquote' | 'reference' | 'footnote')
    if ((state.parentType !== 'root') && (state.parentType !== 'paragraph')) {
      return false;
    }
    const thisChunk: string = state.src.substring(pos, max);
    const lineOneMatch: RegExpExecArray | null = wikirefs.RGX.ATTR_LINE.TYPE.exec(thisChunk);
    // no match
    if (lineOneMatch === null) {
      return false;
    }
    // is in a list item
    // note: this is only necessary for unprefixed wikiattrs
    // todo: keep an eye on this...might cause problems...
    if ((lineOneMatch[0].indexOf('- ') === 0)
    || (lineOneMatch[0].indexOf('* ') === 0)
    || (lineOneMatch[0].indexOf('+ ') === 0)
    ) {
      return false;
    }

    // "Don't run any pairs in validation mode":
    // 'silent' is used when this rule is being checked against 
    // in another rule to see whether or not the other rule should 
    // kick out for this (or some other) one. return 'true' to 
    // signify that the kick out should happen
    if (silent) {
      return true;
    }

    // handle match and return true //

    let iterLine: number = 0;
    let m: RegExpExecArray | null;
    const curFilenames: string[] = [];

    const attrTypeText  : string = lineOneMatch[1].trim();
    const filenamesText : string = lineOneMatch[2];

    // links
    //   - comma-separated list; '2' would be the first wikilink's filename
    if ((filenamesText !== null) && (filenamesText !== undefined)) {
      iterLine += 1;
      const gottaCatchEmAll: RegExp = new RegExp(`${wikirefs.RGX.WIKI.BASE.source}`, 'ig');
      // loop through all matches from 'g'lobal regex
      // do-while: https://stackoverflow.com/a/6323598
      do {
        m = gottaCatchEmAll.exec(lineOneMatch[0]);
        if (m !== null) {
          // m[0]: full match;
          // m[1]: filename;
          curFilenames.push(m[1]);
        }
      } while (m);
    //   - markdown-style list
    } else {
      // loop through each markdown-style list item
      // do-while: https://stackoverflow.com/a/6323598
      do {
        // increment
        iterLine += 1;
        pos = state.bMarks[startLine + iterLine];
        max = state.eMarks[startLine + iterLine];
        const thisSubChunk: string = state.src.substring(pos, max);
        m = wikirefs.RGX.ATTR_LINE.LIST_ITEM.exec(thisSubChunk);
        if (m !== null) {
          // m[0]: full match;
          // m[1]: bullet type;
          // m[2]: wikistring;
          // m[3]: filename;
          curFilenames.push(m[3]);
        }
      } while (m);
    }

    // set 'state.env.attrs' to trigger tokens -- if valid.
    if (curFilenames.length === 0) {
      return false;
    } else {
      // init
      if (!state.env.attrs) { state.env.attrs = {}; }
      if (!state.env.attrs[attrTypeText]) { state.env.attrs[attrTypeText] = []; }
      // prep renderables
      for (const fname of curFilenames) {
        state.env.attrs[attrTypeText].push({
          type: 'wiki',
          filename: fname,
        } as AttrWikiData);
      }
      // metadata
      if (opts.addAttr) {
        const tok: Token = new state.Token('metadata_wikiattr', '', 0);
        state.tokens.push(tok);
        tok.attrSet('key', attrTypeText);
        // note: tokens technically should only accept 'string' or 'null'...but an array of strings works so nicely here...
        tok.attrSet('vals', state.env.attrs[attrTypeText].map((item: any) => item.filename));
      }

      // continue; increment position
      state.line += iterLine;

      return true;
    }
  }

  function wiki_attrbox(state: StateCore): void {
    if (!state.env.attrs || (Object.keys(state.env.attrs).length === 0)) {
      return;
    }
    const tokens: Token[] = [];

    // open //

    const tokOpen = new state.Token('wikiattr_open', '', 0);
    // tokOpen.map = [startLine, iterLine];
    tokens.push(tokOpen);

    // body //

    for (const attrtype in state.env.attrs) {
      // key / attrtype
      const tokType = new state.Token('wikiattr_key', '', 0);
      tokType.attrSet('key', attrtype);
      tokens.push(tokType);
      // values / items
      for (const item of state.env.attrs[attrtype]) {
        const tokItem: Token = new state.Token('wikiattr_val', '', 1);
        if (item.type === 'wiki') {
          const filename: string | undefined = item.filename;
          if (!filename) { continue; }
          tokItem.attrSet('key', attrtype);
          tokItem.attrSet('val', filename);
        }
        tokens.push(tokItem);
      }
    }

    // close //

    const tokClose = new state.Token('wikiattr_close', '', 0);
    tokens.push(tokClose);

    // add infobox to **front** of token stream
    if (tokens) { state.tokens = tokens.concat(state.tokens); }
  }

  // tokens

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function metadata_wikiattr(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    const token: Token = tokens[index];
    const attrtype: string | null = token.attrGet('key');
    // @ts-expect-error: forcing array -- technically not supposed to, but it works so nicely here (see note above)
    const filenames: string[] | null = token.attrGet('vals');
    if (attrtype && filenames && opts.addAttr) {
      for (const filename of filenames) {
        opts.addAttr(env, attrtype, filename);
      }
    }
    return '';
  }

  // render

  // example render output:
  // 
  // <aside class="attrbox">
  //  <span class="attrbox-title">Attributes</span>
  //    <dl>
  //      <dt>attrtype</dt>
  //        <dd><a class="attr wiki attrtype doctype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a></dd>
  //        <dd><a class="attr wiki attrtype doctype" href="/tests/fixtures/fname-b" data-href="/tests/fixtures/fname-b">title b</a></dd>
  //        <dd><a class="attr wiki attrtype doctype" href="/tests/fixtures/fname-c" data-href="/tests/fixtures/fname-c">title c</a></dd>
  //        ...
  //    </dl>
  // </aside>

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiattr_open(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return `<aside class="${opts.cssNames.attrbox}">\n<span class="${opts.cssNames.attrboxTitle}">${opts.attrs.title}</span>\n<dl>\n`;
  }

  // attr : key : attrtype
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiattr_key(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    const token: Token = tokens[index];
    const attrtype: string | null = token.attrGet('key');
    return attrtype ? `<dt>${attrtype}</dt>\n` : '<dt>attrtype error</dt>\n';
  }

  // attr : val(s) : item(s)
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiattr_val(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token = tokens[index];
    if (token === null) { return '<dd>token error</dd>\n'; }
    const filename: string | null = token.attrGet('val');
    if (filename === null) { return '<dd>filename error</dd>\n'; }
    const htmlHref: string | undefined = opts.resolveHtmlHref(env, filename);
    const htmlText: string | undefined = opts.resolveHtmlText(env, filename) ? opts.resolveHtmlText(env, filename) : filename;
    const doctype : string | undefined = opts.resolveDocType                 ? opts.resolveDocType(env, filename)  : '';
    // render
    // invalid
    if (htmlHref === undefined) {
      const wikitext: string = (filename !== null) ? filename : 'error';
      return `<dd><a class="${opts.cssNames.attr} ${opts.cssNames.wiki} ${opts.cssNames.invalid}">[[${wikitext}]]</a></dd>\n`;
    // valid
    } else {
      const attrtype: string | null = token.attrGet('key');
      // css
      const cssClassArray: string[] = [];
      // 'attr'
      if ((attrtype !== null) && (attrtype !== undefined)) {
        cssClassArray.push(opts.cssNames.attr);
      }
      // 'wiki'
      cssClassArray.push(opts.cssNames.wiki);
      if ((attrtype !== null) && (attrtype !== undefined)) {
        const attrTypeSlug: string = attrtype.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        cssClassArray.push(opts.cssNames.reftype + attrTypeSlug);
      }
      // '<doctype>'
      if ((doctype !== null) && (doctype !== undefined) && (doctype.length !== 0)) {
        const docTypeSlug: string = doctype.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        cssClassArray.push(opts.cssNames.doctype + docTypeSlug);
      }
      const css: string = cssClassArray.join(' ');
      return `<dd><a class="${css}" href="${opts.baseUrl + htmlHref}" data-href="${opts.baseUrl + htmlHref}">${htmlText}</a></dd>\n`;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiattr_close(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    delete env.cur_attr_type;
    return '</dl>\n</aside>\n';
  }
};
