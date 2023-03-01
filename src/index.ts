// import

import { merge } from 'lodash';

import type MarkdownIt from 'markdown-it/lib';

import type {
  WikiRefsOptions,
  WikiAttrsOptions,
  WikiLinksOptions,
  WikiEmbedsOptions,
} from './util/types';

import { prep_file } from './lib/prep-file';
import { wikiattrs } from './lib/wikiattr';
import { wikilinks } from './lib/wikilink';
import { wikiembeds } from './lib/wikiembed';


// export

function wikirefs_plugin(md: MarkdownIt, opts?: Partial<WikiRefsOptions>): void {
  // opts
  const defaults: WikiRefsOptions = {
    resolveHtmlText: (env: any, fname: string) => fname.replace(/-/g, ' '),
    resolveHtmlHref: (env: any, fname: string) => '/' + fname.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
    resolveEmbedContent: (env: any, fname: string) => fname + ' content',
    baseUrl: '',
    cssNames: {
      // wiki
      wiki: 'wiki',
      invalid: 'invalid',
      // kinds
      attr: 'attr',
      link: 'link',
      type: 'type',
      embed: 'embed',
      reftype: 'reftype__',
      doctype: 'doctype__',
      // attr
      attrbox: 'attrbox',
      attrboxTitle: 'attrbox-title',
      // embed
      embedWrapper: 'embed-wrapper',
      embedTitle: 'embed-title',
      embedLink: 'embed-link',
      embedContent: 'embed-content',
      embedLinkIcon: 'embed-link-icon',
      linkIcon: 'link-icon',
      embedMedia: 'embed-media',
      embedAudio: 'embed-audio',
      embedDoc: 'embed-doc',
      embedImage: 'embed-image',
      embedVideo: 'embed-video',
    },
    attrs: {
      enable: true,
      render: true,
      title: 'Attributes',
    },
    links: {
      enable: true,
    },
    embeds: {
      enable: true,
      title: 'Embed Content',
      errorContent: 'Error: Content not found for ',
    }
  };
  const fullOpts: WikiRefsOptions = merge(defaults, opts);

  // by order of execution
  if (fullOpts.prepFile) {
    prep_file(md, fullOpts);
  }
  if (fullOpts.attrs && fullOpts.attrs.enable) {
    wikiattrs(md, fullOpts);
  }
  if (fullOpts.links && fullOpts.links.enable) {
    wikilinks(md, fullOpts);
  }
  if (fullOpts.embeds && fullOpts.embeds.enable) {
    wikiembeds(md, fullOpts);
  }
}

export type {
  WikiRefsOptions,
  WikiAttrsOptions,
  WikiLinksOptions,
  WikiEmbedsOptions,
};

export default wikirefs_plugin;
