# markdown-it-wikirefs

[![A WikiBonsai Project](https://img.shields.io/badge/%F0%9F%8E%8B-A%20WikiBonsai%20Project-brightgreen)](https://github.com/wikibonsai/wikibonsai)
[![NPM package](https://img.shields.io/npm/v/markdown-it-wikirefs)](https://npmjs.org/package/markdown-it-wikirefs)

A markdown-it plugin to process [[[wikirefs]]](https://github.com/wikibonsai/wikirefs)

Note that this plugin only parses the input -- it is up to you to assign appropriate linking information and/or index relationships (between files).

🕸 Weave a semantic web in your [🎋 WikiBonsai](https://github.com/wikibonsai/wikibonsai) digital garden.

## Install

Install with [npm](https://docs.npmjs.com/cli/v9/commands/npm-install):

```
$ npm install markdown-it-wikirefs
```

## Use

```js
import markdownIt from 'markdown-it';
import wikirefs_plugin from 'markdown-it-wikirefs';

const md = markdownIt();
const options = {
  resolveHtmlHref: (env: any, fname: string) => {
    const extname: string = wikirefs.isMedia(fname) ? path.extname(fname) : '';
    fname = fname.replace(extname, '');
    return '/' + fname.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + extname;
  },
  resolveHtmlText: (env: any, fname: string) => fname.replace(/-/g, ' '),
  resolveEmbedContent: (env: any, fname: string) => fname + ' content',
};
md.use(wikirefs_plugin, options);
md.render('[[wikilink]]');
```

Require style imports work as well:

```js
const wikirefs_plugin = require('markdown-it-wikirefs');

// if you encounter issues, try:
const wikirefs_plugin = require('markdown-it-wikirefs').default;

```

## Syntax

For syntax specifications, see the [wikirefs](https://github.com/wikibonsai/wikirefs) repo.

## Option recommendations

For render output:
- `resolveHtmlText`
- `resolveHtmlHref`
- `resolveEmbedContent`

For `wikiembeds` -- note:
- [`path.extname(filename)`](https://nodejs.org/api/path.html#pathextnamepath) is used to identify the file extension which determines how the embed should be formatted.
- Check for self-references and cycles when defining [`opts.resolveEmbedContent()`]().

For metadata population:
- `addAttr`
- `addLink`
- `addEmbed`
- `prepFile` (useful for clearing a cache for the current markdown file per render)

## Options

### `addAttr: (env: any, attrtype: string, fname: string) => void`

### `addLink: (env: any, linktype: string, fname: string) => void`

### `addEmbed: (env: any, fname: string) => void`

### `attrs`

These are options wikiattrs-specific options. If `markdown-it-wikirefs` is being used in conjunction with `markdown-it-caml`, `attrs` options may be set in `markdown-it-caml` and will apply to `markdown-it-wikirefs` as well.

#### `attrs.enable`

A boolean property that toggles parsing and rendering wikiattrs on/off.

#### `attrs.render`

A boolean property that toggles rendering wikiattrs on/off. This is useful in the scenario where wikiattrs are used for metadata and not for display purposes; like a yaml-stand-in.

#### `attrs.title`

A string to be rendered in the wikiattrs' attrbox.

### `baseUrl`

A base url that is applied to all urls internally.

### `cssNames`

CSS classnames may be overridden here.

#### `cssNames.attr`

Classname for wikiattrs. Default is `attr`.

#### `cssNames.link`

Classname for wikilinks. Default is `link`.

#### `cssNames.type`

Classname for typed wikilinks. Default is `type`.

#### `cssNames.wiki`

Classname for valid wikirefs. Default is `wiki`.

#### `cssNames.invalid`

Classname for invalid wikirefs. Default is `invalid`.


#### `cssNames.reftype`

Classname for wikiref type. Default is `reftype__` and combined with the slugified form of the user-defined reftype.

#### `cssNames.doctype`

Classname for document type. Default is `doctype__` and combined with the slugified form of the user-defined doctype.

#### `cssNames.attrbox`

Classname for the wikiattr attrbox. Default is `attrbox`.

#### `cssNames.attrboxTitle`

Classname for the wikiattr attrbox title. Default is `attrbox-title`.

### `links`

These are options wikilinks-specific options.

#### `links.enable`

A boolean property that toggles parsing/rendering wikilinks on/off.

### `prepFile: (env: any) => void`

### `resolveDocType: (env: any, fname: string) => string | undefined`

A function which takes in markdown-it's `env` var and the `fname` extracted from a wikilink `[[fname]]`. It should return a string which is the name of the file's document type or `undefined` if no document type exists. (Relevant file data should be stored in `env`, but if not `fname` can be used to search for the file instead.)

### `resolveEmbedContent: (env: any, fname: string) => string | undefined`

A function which takes in markdown-it's `env` var and the `fname` extracted from a wikilink `[[fname]]`. It should return the content of an embedded markdown file. Be sure to handle self references and cycles with care when re-using the markdown-it instance to re-render content (e.g. `md.render(content)`).

### `resolveHtmlHref: (env: any, fname: string) => string | undefined`

A function which takes in markdown-it's `env` var and the `fname` extracted from a wikilink `[[fname]]`. It should return the url of the wikilink-ed file or `undefined` if no such file exists. If no such file exists, the wikilink will render as disabled and marked as invalid. (Relevant file data should be stored in `env`, but if not `fname` can be used to search for the file instead.)

It is recommended to override the default, but there is a default returns: `'/' + fname.trim().toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')`.

### `resolveHtmlText: (env: any, fname: string) => string | undefined`

A function which takes in markdown-it's `env` var and the `fname` extracted from a wikilink `[[fname]]`. It should return a string representing the text to populate the a tag's innertext of the wikilink-ed file -- this is often its title -- or `undefined` if no such file exists. If no such file exists, the filename will be used to populate innertext instead. Be sure to apply any text formatting such as lower-casing here. (Relevant file data should be stored in `env`, but if not `fname` can be used to search for the file instead.)

It is recommended to override the default, but there is a default which returns: `fname.replace('-', ' ')`.
