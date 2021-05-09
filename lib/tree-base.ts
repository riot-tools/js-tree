import {
    createNode,
    appendChildren,
    DOMEventEmitter,
    css
} from './helpers/dom';

import {
    extractType,
    isExpandable,
    typeToString
} from './helpers/meta';

import {
    EVENTS
} from './helpers/constants';

import {
    TreeElements,
    TreeItemOptions
} from './types';


export class TreeBase extends DOMEventEmitter {

    name: string|number = null;
    value: any = null;
    type: string = null;
    parent: TreeBase = null;
    children: Set<any> = new Set();

    searchMatched: boolean = null;
    elements: TreeElements = null;

    constructor(opts: TreeItemOptions) {

        super();

        this._setup(opts);
    }

    _setup(opts: TreeItemOptions) {


        /**
         * From options, evaluate config data for this particular tree item
         */
         this.name = opts.name || 'root';
         this.value = opts.value;
         this.type = typeToString(extractType(opts.value));

         /**
          * Create the base elements and append them
          */
         this.elements = {
             container: createNode('.container.tree-view') as HTMLElement,
             name: createNode('.name.item') as HTMLElement,
             value: createNode('.value.item') as HTMLElement,
         };

         appendChildren(
             this.elements.container,
             this.elements.name,
             this.elements.value,
         );

         /**
          * Add visual feedback
          */
         this._populateElements();

         if (opts.parent) {

             this.parent = opts.parent;

             /** Add self to child */
             this.parent.elements.children.appendChild(
                 this.elements.container
             );

             const self = this;

             /** Bubble events up to parent items */
             for (const event of Object.values(EVENTS)) {
                 this.on(event, (tree) => {

                     self.parent.emit(event, tree);
                 })
             }

             this.emit(EVENTS.APPEND, this);
         }
    }

    _populateElements() {
        this.elements.name.innerText = this.name.toString();

        this._populateValue();
    }

    _populateValue() {

        let text = this.value + '';

        if (this.type === 'String') {
            text = `"${text}"`;
        }

        this.elements.value.innerText = text;
        this.elements.value.classList.add(this.type);
    }


    _removeSelf() {

        this.elements.container.remove();

        if (!this.parent) {
            return;
        }

        this.emit(EVENTS.DELETE, this);

        this.parent.children.delete(this);
    }

    _show() {
        css(this.elements.container, { display: null });
        this.searchMatched = true;
    }

    _hide() {
        css(this.elements.container, { display: 'none' });
        this.searchMatched = false;
    }

    /**
     * If name or value do not match the regexp, hide container.
     * If regex is false, show container and reset item config.
     * @param regex
     */
    _hideIfNotMatchesSearch(regex: boolean|RegExp) {


        if (!regex) {

            this._show();
            this.searchMatched = null;
            return;
        }

        if ((regex as RegExp).test(this.value) || (regex as RegExp).test(this.name as string)) {

            this._show();
            this.emit(EVENTS.SEARCH_MATCH, this);
        }
        else {

            this._hide();
        }
    }
}
