import { deepEqual } from '@riot-tools/state-utils';
import { TreeItemOptions, TreeContainerElement, TreeEntry, TreeEntries, TreeName } from './types';

import {
    createNode,
    css,
    focusAdjacentTabbable,
    getAdjacentTabbable
} from './helpers/dom';

import {
    getKeys,
    getSize,
    getEntries,
    isExpandable,
    extractType,
    typeToString,
    arrToBoolObject
} from './helpers/meta';

import { TreeBase } from './tree-base';
import { EVENTS } from './helpers/constants';

export class TreeExandable extends TreeBase {

    expandable = true;
    expanded: boolean = false;
    mounted: boolean = false;
    originalOptions: TreeItemOptions = null;
    root: TreeExandable = null;

    filterText: string = '';

    constructor(opts: TreeItemOptions) {

        super(opts);

        this.originalOptions = opts;
        delete this.originalOptions.value;

        if (opts.root) {
            this.root = opts.root;
        }
    }

    _keydown(e) {

        const isKey = { [e.key as string]: true };

        if (isKey.Enter || e.key === ' ') {

            this.toggle();

        }

        if (isKey.ArrowRight) {

            if (this.expanded) {
                getAdjacentTabbable(e.target as HTMLElement, 1)?.focus()
            }
            else {
                this._expand();
            }
        }

        if (isKey.ArrowLeft) {

            if (!this.expanded) {
                getAdjacentTabbable(e.target as HTMLElement, -1)?.focus()
            }
            else {
                this._collapse(true);
            }
        }

        if (isKey.ArrowUp || isKey.ArrowDown) {

            // up
            let dir = -1;

            if (isKey.ArrowDown) {
                dir = 1;
            }

            focusAdjacentTabbable(
                e.target,
                this.root?.elements.container,
                dir
            )
        }

        if (
            e.key === ' ' ||
            isKey.Enter ||
            isKey.ArrowDown ||
            isKey.ArrowRight ||
            isKey.ArrowLeft ||
            isKey.ArrowUp
        ) {

            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }

    _setup(opts: TreeItemOptions) {

        super._setup(opts);

        const self = this;

        /**
         * Add and append elements related to an expandable item.
         */
        this.elements.expand = createNode('.expand.item') as HTMLElement;
        this.elements.spacer = createNode('.spacer.item') as HTMLElement;
        this.elements.children = createNode('.children') as HTMLElement;

        this.elements.container.insertBefore(
            this.elements.expand,
            this.elements.name
        );

        this.elements.container.appendChild(this.elements.children);

         /**
          * Bind click events to expand and collapse
          */
        const _toggle = () => this.toggle();

        this.elements.name.addEventListener('click', _toggle);
        this.elements.value.addEventListener('click', _toggle);
        this.elements.expand.addEventListener('click', _toggle);

        this._addChildren(opts.root || this);

        if (this.parent) {

            /**
             * Make expandables tabbable and allow enter and spacebar to trigger toogle
             */
            this.elements.container.setAttribute('tabindex', '0');
            this.elements.container.addEventListener('keydown', (e) => this._keydown(e));

            return;
        }

        if (this.mounted) {

            opts.silent || console.warn('this tree view has already been mounted');
            return;
        }

         /**
          * Mount to a point in the config, or create one
          */
        const mountPoint = opts.mountTo || '#json-tree';
        let domNode

        if (opts.mountTo && (opts.mountTo as HTMLElement).nodeName) {
            domNode = opts.mountTo;
        }
        else {
            domNode = document.querySelector(mountPoint as string);
        }


        if (!domNode) {
            domNode = createNode(mountPoint) as HTMLElement;
            document.body.appendChild(domNode);
        }

        domNode.appendChild(
            this.elements.container
        );

        this.mounted = true;
        console.info('mounted to:', domNode);

        if (typeof opts.theme === 'string') {

            this.elements.container.classList.add(opts.theme);
        }
        else {
            this.elements.container.classList.add('base-theme');
        }

        this._expand(true);
    }

    _keys() {

        return getKeys(this.value, this.type);
    }

    _size() {

        return getSize(this.value, this.type);
    }

    /**
     * Overwrites parent class to handle special case for
     * expandable types
     */
    _populateValue() {

        this.elements.value.innerText = `${this.type}[${this._size()}]`;
        this.elements.value.classList.add(this.type);
    }

    _collapse(recursive: boolean = false) {

        css(this.elements.children, { display: 'none' });
        this.elements.expand.classList.add('expand');
        this.elements.expand.classList.remove('collapse');
        this.elements.container.classList.add('collapsed');
        this.elements.container.classList.remove('expanded');

        this.expanded = false;

        if (!recursive) {

            this.emit(EVENTS.COLLAPSE, this);
            return
        }

        for (const child of this.children) {

            if (child.expandable) {
                child._collapse(recursive);
            }
        }
    }

    _expand(recursive: boolean = false) {

        css(this.elements.children, { display: null });
        this.elements.expand.classList.remove('expand');
        this.elements.expand.classList.add('collapse');
        this.elements.container.classList.add('expanded');
        this.elements.container.classList.remove('collapsed');

        this.expanded = true;

        if (!recursive) {
            this.emit(EVENTS.EXPAND, this);
            return
        }

        for (const child of this.children) {

            if (child.expandable) {
                child._expand(recursive);
            }
        }
    }

    toggle() {

        if (this.expanded) {
            this._collapse(true);
            return;
        }

        this._expand();
    }

    expandAll() {

        for (const child of this.children) {

            if (child.expandable) {

                child._expand(true);
            }
        }

        this.emit(EVENTS.EXPAND, this);

    }

    collapseAll() {

        for (const child of this.children) {

            if (child.expandable) {

                child._collapse(true);
            }
        }

        this.emit(EVENTS.COLLAPSE, this);

    }

    _addChild(name, value, root?: TreeExandable) {

        let child;

        if (isExpandable(value)) {

            child = new TreeExandable({
                name,
                value,
                parent: this,
                root
            });
        }
        else {

            child = new TreeBase({
                name,
                value,
                parent: this
            });
        }

        this.children.add(child);
    }

    /**
     * Cycles through child items and creates TreeItems from them.
     */
    _addChildren(root: TreeExandable) {

        let entries = Object.entries(this.value).sort(
            (a, b): number => {

                if (a[0] > b[0]){
                    return 1;
                }

                if (a[0] < b[0]){
                    return -1;
                }

                return 0;
            }
        );

        if (this.type === 'Map') {

            entries = [...this.value.entries()]
        }

        if (this.type === 'Set') {

            entries = Object.entries([...this.value.values()]);
        }

        for (const [name, value] of entries) {
            this._addChild(name, value, root);
        }
    }

    _removeChildren() {

        for (const child of this.children) {

            if (child.expandable) {

                child._removeChildren();
            }

            child._removeSelf();
        }
    }

    _findChild(key): TreeExandable {

        for (const child of this.children) {

            if (child.name === key) {
                return child;
            }
        }

        return null;
    }

    /**
     * Updates the previous value and rebuilds HTML elements
     * @param value Value to update
     */
    update(value) {

        // If update equals current value, don't do anything
        if (deepEqual(value, this.value)) {
            return;
        }

        const incomingType = typeToString(extractType(value));

        // Handle a type change
        if (incomingType !== this.type) {

            this._removeChildren();
            this.elements.container.remove();
            this.mounted = false;

            this._setup({
                ...this.originalOptions,
                value
            });

            return;
        }

        this.value = value;
        this._populateElements();

        const newEntries: TreeEntries = getEntries(value);
        const currentKeys: TreeName[] = this._keys();

        const newHasKey = arrToBoolObject(newEntries.map(([k]) => k));
        const currentHasKey = arrToBoolObject(currentKeys);

        const setForDelete: TreeName[] = [];
        const setForCreate: TreeEntries = [];
        const setForUpdate: TreeEntries = [];

        for (const key of currentKeys) {

            if (!newHasKey[key]) {
                setForDelete.push(key);
            }
        }

        for (const [key, val] of newEntries) {

            if (!currentHasKey[key]) {
                setForCreate.push([key, val]);
            }
            else {
                setForUpdate.push([key, val]);
            }
        }

        for (const key of setForDelete) {

            const child = this._findChild(key);

            child._removeSelf();
        }

        const root = this.root || this;

        for (const key of setForCreate) {

            this._addChild(
                key,
                value,
                root
            )
        }

        for (const [key, value] of setForUpdate) {

            const child = this._findChild(key);

            child._change({ value });

            if (child.expandable) {
                child.update(value);
            }
        }
        // let focusOn: string;
        // const focusedTree = (document.activeElement as TreeContainerElement)?._jsTree;

        // console.log(focusedTree)

        // if (focusedTree) {

        //     focusOn = focusedTree.elements.container.id;

        //     console.log(focusOn);

        // }

        // this._removeChildren();
        // this.elements.container.remove();
        // this.mounted = false;

        // this._setup({
        //     ...this.originalOptions,
        //     value
        // });

        // setTimeout(() => {

        //     if (focusOn) {

        //         const element = document.getElementById(focusOn) as TreeContainerElement;
        //         element.focus();
        //     }
        // }, 1);

    }

    /**
     * Checks to see if any children have matched search
     * @returns {boolean}
     */
    _hasSearchMatches() {

        const notMatched = [...this.children].filter((child) => child.searchMatched === false);
        return this.children.size !== notMatched.length;
    }

    /**
     * Searches for a key or value inside the tree.
     * @param term search term or regexp declaration
     */
    search(term: boolean|string|RegExp) {

        let regex = term;

        if (typeof term === 'string') {

            try {

                regex = new RegExp(term);
            }
            catch (e) {

                regex = new RegExp(
                    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                );
            }
        }

        if (!term) {
            regex = false;
        }


        for (const child of this.children) {

            if (child.expandable) {

                child.search(regex);
            }
            else {

                child._hideIfNotMatchesSearch(regex);
            }
        }

        if (!this.parent) {
            return;
        }

        if (!this._hasSearchMatches()) {

            this._hideIfNotMatchesSearch(regex as RegExp);
        }
        else {
            this._show();
        }
    }
}