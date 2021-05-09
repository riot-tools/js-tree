export type { TreeBase } from './tree-base';
export type { TreeItemOptions, TreeElements } from './types';

export { TreeExandable } from './tree-expandable';
export { EVENTS } from './helpers/constants';

import { TreeExandable } from './tree-expandable';

export default (opts) => new TreeExandable(opts);

