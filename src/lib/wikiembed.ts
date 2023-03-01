import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline';

import path from 'path';

import * as wikirefs from 'wikirefs';

import type { WikiEmbedsOptions } from '../util/types';


export const wikiembeds = (md: MarkdownIt, opts: WikiEmbedsOptions): void => {

  // rulers
  md.inline.ruler.before('wikilink', 'wikiembed', mixed);
  // render
  md.renderer.rules.metadata_wikiembed              = metadata_wikiembed;
  md.renderer.rules.wikiembed_open                  = wikiembed_open;
  md.renderer.rules.wikiembed_close                 = wikiembed_close;
  // body
  md.renderer.rules.wikiembed_content_body_media    = wikiembed_content_body_media;
  // markdown
  // title
  md.renderer.rules.wikiembed_title_open            = wikiembed_title_open;
  md.renderer.rules.wikiembed_title_body            = wikiembed_title_body;
  md.renderer.rules.wikiembed_title_close           = wikiembed_title_close;
  // link
  md.renderer.rules.wikiembed_link_open             = wikiembed_link_open;
  md.renderer.rules.wikiembed_link_body             = wikiembed_link_body;
  md.renderer.rules.wikiembed_link_close            = wikiembed_link_close;
  // content
  md.renderer.rules.wikiembed_content_open          = wikiembed_content_open;
  md.renderer.rules.wikiembed_content_body_md       = wikiembed_content_body_md;
  md.renderer.rules.wikiembed_content_close         = wikiembed_content_close;

  // rulers

  // parsed as 'inline', but renders as a pseudo-'block'
  function mixed(state: StateInline, silent: boolean): boolean {
    const srcText: string = state.src.substring(state.pos);

    // process match info
    const match: RegExpExecArray | null = wikirefs.RGX.WIKI.EMBED.exec(srcText);
    if ((match == null) || (match.length < 1) || (match.index !== 0)) {
      return false;
    }
    const matchText      : string        = match[0];
    const filenameText   : string        = match[1];

    // "Don't run any pairs in validation mode":
    // 'silent' is used when this rule is being checked against 
    // in another rule to see whether or not the other rule should 
    // kick out for this (or some other) one. return 'true' to 
    // signify that the kick out should happen
    if (silent) {
      return false;
    }

    let token: Token;

    // open embed //
    token = state.push('wikiembed_open', 'wikiembed', 0);
    token.attrSet('filename', filenameText);

    // body
    if (wikirefs.isMedia(filenameText)) {
      token = state.push('wikiembed_content_body_media', 'wikiembed', 0);
      token.attrSet('filename', filenameText);
    // process as markdown (may contain invalid media extensions)
    } else {
      // title //
      token = state.push('wikiembed_title_open', 'wikiembed', 0);
      token = state.push('wikiembed_title_body', 'wikiembed', 0);
      token.attrSet('filename', filenameText);
      token = state.push('wikiembed_title_close', 'wikiembed', 0);
      // link //
      token = state.push('wikiembed_link_open', 'wikiembed', 0);
      token.attrSet('filename', filenameText);
      token = state.push('wikiembed_link_body', 'wikiembed', 0);
      token.attrSet('filename', filenameText);
      token = state.push('wikiembed_link_close', 'wikiembed', 0);
      // content //
      token = state.push('wikiembed_content_open', 'wikiembed', 0);
      token = state.push('wikiembed_content_body_md', 'wikiembed', 0);
      token.attrSet('filename', filenameText);
      token = state.push('wikiembed_content_close', 'wikiembed', 0);
    }

    // close embed //
    token = state.push('wikiembed_close', 'wikiembed', 0);
    token.attrSet('filename', filenameText);

    // metadata
    if (opts.addEmbed) {
      token = state.push('metadata_wikiembed', 'wikiembed', 0);
      token.attrSet('filename', filenameText);
    }

    // continue; increment position
    state.pos += matchText.length;

    return true;
  }

  // render

  // markdown embeds:
  // 
  // <p>
  // <div class="embed-wrapper">
  //   <div class="embed-title">
  //     <a class="wiki embed doctype" href="/tests/fixtures/embed-doc" data-href="/tests/fixtures/embed-doc">
  //       embedded document
  //     </a>
  //   </div>
  //   <div class="embed-link">
  //     <a class="embed-link-icon" href="/tests/fixtures/embed-doc" data-href="/tests/fixtures/embed-doc">
  //       <i class="link-icon"></i>
  //     </a>
  //   </div>
  //   <div class="embed-content">
  //     <p>Here is some content.</p>
  //   </div>
  // </div>
  // </p>

  // media embeds (audio, img, video):

  // audio:
  // 
  // <p>
  //  <span class="embed-media" src="audio.mp3" alt="audio.mp3">
  //    <audio class="embed-audio" controls type="audio/mp3" src="/tests/fixtures/audio.mp3"></audio>
  //  </span>
  // </p>

  // image:
  // 
  // <p>
  //  <span class="embed-media" src="image.png" alt="image.png">
  //    <img class="embed-image" src="/tests/fixtures/image.png">
  //  </span>
  // </p>

  // video:
  // 
  // <p>
  //  <span class="embed-media" src="video.mp4" alt="video.mp4">
  //    <video class="embed-audio" controls type="video/mp4" src="/tests/fixtures/video.mp4"></video>
  //  </span>
  // </p>

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function metadata_wikiembed(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    const token: Token | null = tokens[index];
    if (token === null) { return 'token error'; }
    // don't let 'linktype' be 'null' -- untyped wikiembeds have empty strings for 'linktype'
    const filename: string | null = token.attrGet('filename');
    if ((filename !== null) && opts.addEmbed) {
      opts.addEmbed(env, filename);
    }
    return '';
  }

  // embed

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_open(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    const filename : string | null = token.attrGet('filename');
    if (filename === null) { return 'filename error'; }
    // render
    if (wikirefs.isMedia(filename)) {
      return '\n<p>\n';
    } else {
      return `\n<p>\n<div class="${opts.cssNames.embedWrapper}">\n`;
    }
  }

  // title

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_title_open(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return `<div class="${opts.cssNames.embedTitle}">\n`;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_title_body(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    if (token === null) { return 'token error'; }
    const filename : string | null = token.attrGet('filename');
    if (filename === null) { return 'filename error'; }
    const htmlHref: string | undefined = opts.resolveHtmlHref(env, filename);
    const htmlText: string | undefined = opts.resolveHtmlText(env, filename) ? opts.resolveHtmlText(env, filename) : filename;
    const doctype: string | undefined  = opts.resolveDocType                 ? opts.resolveDocType(env, filename)  : '';
    // render
    if (htmlHref === undefined) {
      return `<a class="${opts.cssNames.wiki} ${opts.cssNames.embed} ${opts.cssNames.invalid}">\n${htmlText}\n</a>\n`;
    } else {
      // build css string
      const cssClassArray: string[] = [];
      cssClassArray.push(opts.cssNames.wiki);
      cssClassArray.push(opts.cssNames.embed);
      // '<doctype>'
      if ((doctype !== null) && (doctype !== undefined) && (doctype.length !== 0)) {
        const docTypeSlug: string = doctype.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        cssClassArray.push(opts.cssNames.doctype + docTypeSlug);
      }
      const css: string = cssClassArray.join(' ');
      return `<a class="${css}" href="${opts.baseUrl + htmlHref}" data-href="${opts.baseUrl + htmlHref}">\n${htmlText}\n</a>\n`;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_title_close(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return '</div>\n';
  }

  // link

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_link_open(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    const invalidOpen: string = `<div class="${opts.cssNames.embedLink}">\n<a class="${opts.cssNames.embedLinkIcon} ${opts.cssNames.invalid}">\n`;
    if (token === null) { return invalidOpen; }
    const filename: string | null = token.attrGet('filename');
    if (filename === null) { return invalidOpen; }
    // render
    const htmlHref: string | undefined = opts.resolveHtmlHref(env, filename);
    // invalid
    if (htmlHref === undefined) {
      return invalidOpen;
    // valid
    } else {
      return `<div class="${opts.cssNames.embedLink}">\n<a class="${opts.cssNames.embedLinkIcon}" href="${opts.baseUrl + htmlHref}" data-href="${opts.baseUrl + htmlHref}">\n`;
    }
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_link_body(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    const token: Token | null = tokens[index];
    // error
    if (token === null) { return 'token error'; }
    return `<i class="${opts.cssNames.linkIcon}"></i>\n`;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_link_close(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return '</a>\n</div>\n';
  }

  // content

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_content_open(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return `<div class="${opts.cssNames.embedContent}">\n`;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_content_body_md(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    if (token === null) { return 'token error'; }
    const filename : string | null = token.attrGet('filename');
    if (filename === null) { return opts.embeds.errorContent + '\'' + filename + '\''; }
    const htmlContent: string | undefined = opts.resolveEmbedContent(env, filename);
    // render
    token.content = htmlContent ? htmlContent : opts.embeds.errorContent + '\'' + filename + '\'';
    return token.content + '\n';
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_content_body_media(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    if (token === null) { return 'token error'; }
    const filename: string | null = token.attrGet('filename');
    if (filename === null) { return 'filename error'; }
    const filenameSlug: string = filename.trim().toLowerCase().replace(/ /g, '-');//.replace(/[^\w-]+/g, '');
    const htmlHref: string | undefined = opts.resolveHtmlHref(env, filename);
    const mediaExt: string = path.extname(filename).toLowerCase();
    const mime: string = path.extname(filename).replace('.', '').toLowerCase();
    // render
    if (wikirefs.CONST.EXTS.AUD.has(mediaExt)) {
      token.content = `<span class="${opts.cssNames.embedMedia}" src="${filenameSlug}" alt="${filenameSlug}">\n`;
      token.content += htmlHref ?
        `<audio class="${opts.cssNames.embedAudio}" controls type="audio/${mime}" src="${htmlHref}"></audio>\n`
        :
        `<audio class="${opts.cssNames.embedAudio}" controls type="audio/${mime}"></audio>\n`;
    } else if (wikirefs.CONST.EXTS.IMG.has(mediaExt)) {
      token.content = `<span class="${opts.cssNames.embedMedia}" src="${filenameSlug}" alt="${filenameSlug}">\n`;
      token.content += htmlHref ?
        `<img class="${opts.cssNames.embedImage}" src="${htmlHref}">\n`
        :
        `<img class="${opts.cssNames.embedImage}">\n`;
    } else if (wikirefs.CONST.EXTS.VID.has(mediaExt)) {
      token.content = `<span class="${opts.cssNames.embedMedia}" src="${filenameSlug}" alt="${filenameSlug}">\n`;
      token.content += htmlHref ?
        `<video class="${opts.cssNames.embedVideo}" controls type="video/${mime}" src="${htmlHref}"></video>\n`
        :
        `<video class="${opts.cssNames.embedVideo}" controls type="video/${mime}"></video>\n`;
    } else {
      // note: this is probably not technically possible (due to 'wikirefs.wikirefs.isMedia()' check)
      token.content = `<span class="${opts.cssNames.embedMedia} ${opts.cssNames.invalid}">\n`;
      token.content += 'media error\n';
    }
    return token.content;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_content_close(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    return '</div>\n';
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function wikiembed_close(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    // load
    const token: Token | null = tokens[index];
    const filename : string | null = token.attrGet('filename');
    if (filename === null) { return 'filename error'; }
    // render
    if (wikirefs.isMedia(filename)) {
      return '</span>\n</p>\n';
    } else {
      return '</div>\n</p>\n';
    }
  }
};
