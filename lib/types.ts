import type { TreeExandable } from './tree-expandable';

export interface TreeItemOptions {
    name?: string|number;
    value?: any;
    mountTo?: string|HTMLElement;
    theme?: string;
    parent?: TreeExandable;
    root?: TreeExandable;
};

export type TreeElements = {
    [key: string]: HTMLElement,
    container: HTMLElement;
    name: HTMLElement;
    value: HTMLElement;
    expand?: HTMLElement;
    spacer?: HTMLElement;
    children?: HTMLElement;
};
