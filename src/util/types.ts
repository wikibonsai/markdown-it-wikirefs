import type MarkdownIt from 'markdown-it/lib';


export interface OptCssNames {
  // ref (all); 'a' html tag
  wiki: string;
  invalid: string;
  // kind
  attr: string;
  link: string;
  type: string;
  embed: string;
  reftype: string;
  doctype: string;
  // attr
  attrbox: string;
  attrboxTitle: string;
  // embed
  embedWrapper: string;
  embedTitle: string;
  embedLink: string;
  linkIcon: string;
  embedContent: string;
  embedLinkIcon: string;
  // media kind
  embedMedia: string;
  embedAudio: string;
  embedDoc: string;
  embedImage: string;
  embedVideo: string;
}

export interface OptAttr {
  enable: boolean;
  render: boolean;
  title: string;
}

export interface OptLink {
  enable: boolean;
}

export interface OptEmbed {
  enable: boolean;
  title: string;
  errorContent: string;
}

export interface WikiRefsOptions extends MarkdownIt.Options {
  prepFile?: (env: any) => void;
  // render functions    // function declaration expectations below...
  resolveHtmlText: (env: any, fname: string) => string | undefined;
  resolveHtmlHref: (env: any, fname: string) => string | undefined;
  resolveDocType?: (env: any, fname: string) => string | undefined;
  // embed-only
  resolveEmbedContent: (env: any, fname: string) => string | undefined;
  // metadata functions
  addAttr?: (env: any, attrtype: string, fname: string) => void;
  addLink?: (env: any, linktype: string, fname: string) => void;
  addEmbed?: (env: any, fname: string) => void;
  // render opts
  baseUrl: string;
  cssNames: OptCssNames;
  // wiki kind options
  attrs: OptAttr;
  links: OptLink;
  embeds: OptEmbed;
}

export interface WikiAttrsOptions extends MarkdownIt.Options {
  prepFile?: (env: any) => void;
  // render functions    // function declaration expectations below...
  resolveHtmlText: (env: any, fname: string) => string | undefined;
  resolveHtmlHref: (env: any, fname: string) => string | undefined;
  resolveDocType?: (env: any, fname: string) => string | undefined;
  // metadata functions
  addAttr?: (env: any, attrtype: string, fname: string) => void;
  // render opts
  baseUrl: string;
  cssNames: OptCssNames;
  // wiki kind options
  attrs: OptAttr;
}

export interface WikiLinksOptions extends MarkdownIt.Options {
  prepFile?: (env: any) => void;
  // render functions    // function declaration expectations below...
  resolveHtmlText: (env: any, fname: string) => string | undefined;
  resolveHtmlHref: (env: any, fname: string) => string | undefined;
  resolveDocType?: (env: any, fname: string) => string | undefined;
  // metadata functions
  addLink?: (env: any, linktype: string, fname: string) => void;
  // render opts
  baseUrl: string;
  cssNames: OptCssNames;
  // wiki kind options
  links: OptLink;
}

export interface WikiEmbedsOptions extends MarkdownIt.Options {
  prepFile?: (env: any) => void;
  // render functions    // function declaration expectations below...
  resolveHtmlText: (env: any, fname: string) => string | undefined;
  resolveHtmlHref: (env: any, fname: string) => string | undefined;
  resolveDocType?: (env: any, fname: string) => string | undefined;
  resolveEmbedContent: (env: any, fname: string) => string | undefined;
  // metadata functions
  addEmbed?: (env: any, fname: string) => void;
  // render opts
  baseUrl: string;
  cssNames: OptCssNames;
  // wiki kind options
  embeds: OptEmbed;
}

export interface AttrWikiData {
  type: 'wiki';
  filename: string;
}
