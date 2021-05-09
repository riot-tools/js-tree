import type { TreeExandable } from './tree-expandable';

export interface TreeItemOptions {
    name?: string|number;
    value?: any;
    mountTo?: string,
    theme?: string,
    parent?: TreeExandable
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
