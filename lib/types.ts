import type { TreeExandable } from './tree-expandable';
import type { TreeBase } from './tree-base';

export interface TreeChangeOptions {
    name?: string|number;
    value?: any;
}

export interface TreeItemOptions extends TreeChangeOptions {
    mountTo?: string|HTMLElement;
    theme?: string;
    parent?: TreeExandable;
    root?: TreeExandable;
    silent?: boolean;
};

export type TreeElements = {
    [key: string]: HTMLElement,
    container: TreeContainerElement;
    name: HTMLElement;
    value: HTMLElement;
    expand?: HTMLElement;
    spacer?: HTMLElement;
    children?: HTMLElement;
};

export interface TreeContainerElement extends HTMLElement {
    _jsTree: TreeExandable|TreeBase;
};

export type AllowedObject = {
    [key: string]: AllowedTypes
};

export type ExpandibleType = (

    AllowedTypes[] |
    AllowedObject |
    Set<AllowedTypes> |
    Map<String|Number, AllowedTypes>
)

export type AllowedTypes = (
    ExpandibleType |
    Number |
    String |
    Date |
    boolean |
    null |
    undefined
)

export type TreeEntry = [
    string,
    any
]

export type TreeEntries = TreeEntry[]

export type TreeName = string|number;