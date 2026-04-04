import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline';

import * as wikirefs from 'wikirefs';

import type { WikiLinksOptions } from '../util/types';


export const wikilinks = (md: MarkdownIt, opts: WikiLinksOptions): void => {

  // rulers
  md.inline.ruler.after('link', 'wikilink', wikilink);
  // render
  md.renderer.rules.metadata_wikilink = metadata_wikilink;
  md.renderer.rules.wikilink_open     = wikilink_open;
  md.renderer.rules.wikilink_body     = wikilink_body;
  md.renderer.rules.wikilink_close    = wikilink_close;

  // rulers

  function wikilink(state: StateInline, silent: boolean): boolean {
    const srcText: string = state.src.substring(state.pos);

    // process match info
    const match: RegExpExecArray | null = wikirefs.RGX.WIKI.LINK.exec(srcText);
    if ((match == null) || (match.length < 1) || (match.index !== 0)) {
      return false;
    }
    // uncomment in case of skip wikiembeds
    // const embedChar: string = state.src.substring(state.pos - 1, state.pos);
    // if (embedChar === '!') {
    //   return false;
    // }
    const matchText      : string        = match[0];
    const linkTypeText   : string | null = match[1] ? match[1].trim() : match[1];
    const filenameText   : string        = match[2];
    const headerText     : string | undefined = match[3];
    const labelText      : string | null = match[4] ?? null;

    // handle early kick-out if we've hit a stop-char early //
    //  untyped
    if (!linkTypeText && srcText[0] !== '[') {
      return false;
    }
    //  typed
    if (linkTypeText && srcText[0] !== ':') {
      return false;
    }

    // "Don't run any pairs in validation mode":
    // 'silent' is used when this rule is being checked against 
    // in another rule to see whether or not the other rule should 
    // kick out for this (or some other) one. return 'true' to 
    // signify that the kick out should happen
    if (silent) {
      return false;
    }

    let token: Token;

    // open //
    token = state.push('wikilink_open', 'wikilink', 0);
    token.attrSet('filename', filenameText);
    if (linkTypeText !== null && linkTypeText !== undefined && linkTypeText.length !== 0) {
      token.attrSet('linktype', linkTypeText);
    }
    if (headerText !== undefined && headerText.length > 0) {
      token.attrSet('header', headerText);
    }

    // body //
    token = state.push('wikilink_body', '', 0);
    token.attrSet('filename', filenameText);
    token.attrSet('matchText', matchText);
    if (headerText !== undefined && headerText.length > 0) {
      token.attrSet('header', headerText);
    }
    if (labelText) { token.attrSet('label', labelText); }

    // close //
    token = state.push('wikilink_close', 'wikilink', 0);

    // metadata
    if (opts.addLink) {
      token = state.push('metadata_wikilink', 'wikilink', 0);
      token.attrSet('linktype', linkTypeText);
      token.attrSet('filename', filenameText);
      if (headerText !== undefined && headerText.length > 0) {
        token.attrSet('header', headerText);
      }
    }

    // continue; increment position
    state.pos += matchText.length;

    return true;
  }

  // render

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function metadata_wikilink(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    const token: Token | null = tokens[index];
    if (token === null) { return 'token error'; }
    // don't let 'linktype' be 'null' -- untyped wikilinks have empty strings for 'linktype'
    const linktype: string | null = token.attrGet('linktype') ? token.attrGet('linktype') : '';
    const filename: string | null = token.attrGet('filename');
    const header: string | null = token.attrGet('header');
    if ((linktype !== null) && (filename !== null) && opts.addLink) {
      opts.addLink(env, linktype, filename, header ?? undefined);
    }
    return '';
  }

  // render

  // typed
  // 
  // <a class="wiki link type linktype doctype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>
  // 
  // untyped
  // 
  // <a class="wiki link doctype" href="/tests/fixtures/fname-a" data-href="/tests/fixtures/fname-a">title a</a>

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikilink_open(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    const invalidOpen: string = `<a class="${opts.cssNames.wiki} ${opts.cssNames.link} ${opts.cssNames.invalid}">`;
    if (token === null) { return invalidOpen; }
    const filename: string | null = token.attrGet('filename');
    const linktype: string | null = token.attrGet('linktype');
    const header: string | null = token.attrGet('header');
    if (filename === null) { return invalidOpen; }
    let htmlHref: string | undefined = opts.resolveHtmlHref(env, filename);
    const doctype: string | undefined  = opts.resolveDocType ? opts.resolveDocType(env, filename)  : '';
    // render
    // invalid
    if (htmlHref === undefined) {
      return invalidOpen;
    // valid
    } else {
      if (header !== null && header.length > 0) {
        htmlHref = htmlHref + '#' + wikirefs.slugify(header);
      }
      // build css string
      const cssClassArray: string[] = [];
      // wikilink
      cssClassArray.push(opts.cssNames.wiki);
      cssClassArray.push(opts.cssNames.link);
      // linktype
      if (linktype !== null && linktype !== undefined && linktype.length !== 0) {
        cssClassArray.push(opts.cssNames.type);
        const linkTypeSlug: string = linktype.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        cssClassArray.push(opts.cssNames.reftype + linkTypeSlug);
      }
      // doctype
      if (doctype) {
        const docTypeSlug: string = doctype.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        cssClassArray.push(opts.cssNames.doctype + docTypeSlug);
      }
      const css: string = cssClassArray.join(' ');
      return `<a class="${css}" href="${opts.baseUrl + htmlHref}" data-href="${opts.baseUrl + htmlHref}">`;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikilink_body(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    if (token === null) { return 'token error'; }
    const filename : string | null = token.attrGet('filename');
    const labelText: string | null = token.attrGet('label');
    const matchText: string | null = token.attrGet('matchText');
    if (filename === null) { return 'filename error'; }
    const htmlHref: string | undefined = opts.resolveHtmlHref(env, filename);
    const htmlText: string | undefined = opts.resolveHtmlText(env, filename);
    // render
    // invalid
    if (!htmlHref && matchText) {
      token.content = matchText;
    // valid
    } else {            // html text, order of precedence
      for (const content of [labelText, htmlText, filename]) {
        if ((typeof content === 'string') && content.length > 0) {
          token.content = content;
          break;
        }
      }
    }
    return token.content;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikilink_close(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return '</a>';
  }
};
