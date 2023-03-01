import type MarkdownIt from 'markdown-it/lib';
import type Token from 'markdown-it/lib/token';
import type StateCore from 'markdown-it/lib/rules_core/state_core';

import type {
  WikiRefsOptions,
  WikiAttrsOptions,
  WikiLinksOptions,
} from '../util/types';


// perform any file preparations before we do anything --
// (like flush the current file's entry in index if there is one)
export const prep_file = (
  md: MarkdownIt,
  opts: (Partial<WikiRefsOptions> | Partial<WikiAttrsOptions> | Partial<WikiLinksOptions>),
): void => {

  // insert the 'prep_file' token after all wikirefs have been tokenized.
  // this way, when 'prep_file' calls 'unshift' (see above) it will place the 
  // render rule in front of all other tokens. otherwise, it might get shuffled
  // into an index other than the first one.
  md.core.ruler.push('prep_file', prep_file);

  function prep_file(state: StateCore): void {
    if (opts.prepFile) {
      const tok: Token = new state.Token('trigger_prep_file', '', 0);
      state.tokens.unshift(tok);
    }
  }

  md.renderer.rules.trigger_prep_file = trigger_prep_file;

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  function trigger_prep_file(tokens: Token[], index: number, mdOpts: MarkdownIt.Options, env?: any): string {
    if (opts.prepFile) { opts.prepFile(env); }
    return '';
  }
};
