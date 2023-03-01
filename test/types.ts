import { WikiRefsOptions } from '../src/util/types';


export interface TestCase {
  descr: string,               // test description
  error?: boolean,             // test reflects an error state
  opts?: Partial<WikiRefsOptions>, // plugin options
  mkdn: string,                // markdown input
  html: string,                // html output
}
