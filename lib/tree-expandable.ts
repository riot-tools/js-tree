import { TreeItemOptions } from './types';

import {
    createNode,
    css,
} from './helpers/dom';

import { isExpandable } from './helpers/meta';

import { TreeBase } from './tree-base';
import { EVENTS } from './helpers/constants';

export class TreeExandable extends TreeBase {

    expandable = true;
    expanded: boolean = false;
    mounted: boolean = false;
    originalOptions: TreeItemOptions = null;

    filterText: string = '';

    constructor(opts: TreeItemOptions) {

        super(opts);

        this.originalOptions = opts;
        delete this.originalOptions.value;
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

        this._addChildren();

        if (this.parent) {

            /**
             * Make expandables tabbable and allow enter and spacebar to trigger toogle
             */
            this.elements.container.setAttribute('tabindex', '0');
            this.elements.container.addEventListener('keydown', (e) => {

                const isKey = { [e.key]: true };

                if (isKey.Enter || e.key === ' ') {

                    _toggle();

                }

                if (isKey.ArrowDown || isKey.ArrowRight) {

                    self._expand();
                }

                if (isKey.ArrowUp || isKey.ArrowLeft) {

                    self._collapse(true);
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
            });

            return;
        }

        if (this.mounted) {
            console.warn('this tree view has already been mounted');
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
        console.info('mounted:', this.mounted, 'to:', domNode);

        if (typeof opts.theme === 'string') {

            this.elements.container.classList.add(opts.theme);
        }
        else {
            this.elements.container.classList.add('base-theme');
        }

        this._expand(true);
    }

    /**
     * Overwrites parent class to handle special case for
     * expandable types
     */
    _populateValue() {

        let size = this.value.size;

        if (this.type === 'Array') {

            size = this.value.length;
        }

        if (this.type === 'Object') {

            size = Object.keys(this.value).length;
        }

        this.elements.value.innerText = `${this.type}[${size}]`;
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

    /**
     * Cycles through child items and creates TreeItems from them.
     */
    _addChildren() {

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

        for (const [key, value] of entries) {

            let child;

            if (isExpandable(value)) {

                child = new TreeExandable({
                    name: key,
                    value,
                    parent: this
                });
            }
            else {

                child = new TreeBase({
                    name: key,
                    value,
                    parent: this
                });
            }

            this.children.add(child);
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

    /**
     * Updates the previous value and rebuilds HTML elements
     * @param value Value to update
     */
    update(value) {

        this._removeChildren();
        this.elements.container.remove();
        this.mounted = false;

        this._setup({
            ...this.originalOptions,
            value
        });
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