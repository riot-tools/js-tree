import type { TreeExandable } from '../tree-expandable';
import type { TreeBase } from '../tree-base';

export class DevTreeEvent extends Event {
	tree: TreeBase|TreeExandable = null;
}

export class DOMEventEmitter extends EventTarget {

	handlers = new Map();

	recordListener(event: string, listener: EventListener) {

		let listeners = this.handlers.get(event);

		if (!listeners) {
			listeners = new Set();
			this.handlers.set(event, listeners);
		}

		listeners.add(listener);
	}

	unrecordListener(event: string, listener: EventListener) {

		let listeners = this.handlers.get(event);
		listeners.delete(listener);
	}

	on(event: string, listener: EventListener, options?: any) {

		const listeners = this.handlers.get(event) || new Set();
		listeners.add(listener);
		this.handlers.set(event, listeners);

		return this.addEventListener(event, listener, options);
	}

	off(event: string, listener: EventListener, options?: any) {

		const listeners = this.handlers.get(event)
		listeners.delete(listener);
		this.handlers.set(event, listeners);

		return this.removeEventListener(event, listener, options);
	}

	once(event: string, listener: EventListener, options?: any) {

		const _listener = (e: Event) => {

			listener(e);
			this.off(event, _listener, options);
		};

		this.on(event, listener, options);
	}

	emit(event, data) {

		const _event = new DevTreeEvent(event);
		_event.tree = data;

		this.dispatchEvent(_event);
	}

	removeAllListeners() {

		for (const listeners of this.handlers.values()) {

			for (const listener of listeners) {

				listeners.delete(listener);
			}
		}
	}
};

const MATCH = '[_a-zA-Z]+[_a-zA-Z0-9-]*';
const QUOTE = '(["\'])((?:(?=(\\\\?))\\7.)*?)\\5';
const QUERY = '^(' + MATCH + ')|^#(-?' + MATCH + ')|^\\.(-?' + MATCH + ')|^\\[(-?' + MATCH + ')(?:=' + QUOTE + ')?\\]|^' + QUOTE.replace('5', '8').replace('7', '10') + '|^\\s*([<+-]+)\\s*|^\\s*(\\s+|>)\\s*';

export function createNode(selector): Text|HTMLElement {
	let reducable = selector;
	let root: any = document.createElement('div');
	let node: any = root;
	let match;

	while (match = reducable && reducable.match(QUERY)) {
		// element
		if (match[1]) {
			let temp = document.createElement(match[1]);

			if (node.parentNode) {
				node.parentNode.replaceChild(temp, node);

				node = temp;
			} else if (root === node) {
				root = node = temp;
			} else {
				node = node.appendChild(temp);
			}
		}

		// id
		if (match[2]) {
			node.id = match[2];
		}

		// class
		if (match[3]) {
			node.classList.add(match[3]);
		}

		// attribute
		if (match[4]) {
			node.setAttribute(match[4], match[6] || '');
		}

		// text
		if (match[8]) {
			let temp = document.createTextNode(match[9]);

			if (node.parentNode) {
				node.parentNode.replaceChild(temp, node);

				node = temp as Text;
			} else if (root === node) {
				root = node = temp;
			} else {
				node = node.appendChild(temp);
			}

			node = temp;
		}

		// traversing
		if (match[11]) {
			let index = -1;
			let char;

			while (char = match[11][++index]) {
				if (char === '<') {
					node = node.parentNode;
				} else if (char === '+') {
					node = node.nextElementSibling || node;
				} else if (char === '-') {
					node = node.previousElementSibling || node;
				}
			}

			node = node.appendChild(document.createElement('div'));
		}

		// nesting
		if (match[12]) {
			node = node.appendChild(document.createElement('div'));
		}

		reducable = reducable.slice(match[0].length);
	}

	return root;
};


export const css = (el: HTMLElement, styles: object = {}) => {

    for (const key in styles) {

        el.style[key] = styles[key];
    }
};

export const preventDefault = (fn) => (e) => {

    e.preventDefault();
    fn(e);
};


export const appendChildren = (
    ...elements: HTMLElement[]
) => {

    const parent = elements.shift();

    for (const child of elements) {

        parent.appendChild(child);
    }
};

export const isFocused = (el: HTMLElement): boolean => document.activeElement === el;

export const tabbables = (root: HTMLElement): NodeList => root.querySelectorAll('[tabindex]');

export const getAdjacentTabbable = (el: HTMLElement, pos: number = 1): HTMLElement => {

	let adjacent: HTMLElement;

	if (isFocused(el)) {

		if (pos === -1) {

			adjacent = el.parentElement.closest('[tabindex]');
		}

		if (pos === 1) {

			adjacent = tabbables(el)[0] as HTMLElement
		}
	}


	if (!adjacent) {
		const _tabs = Array.from(tabbables(el.parentElement)) as HTMLElement[];

		const idx = _tabs.indexOf(el);

		adjacent = _tabs[idx + pos];
	}

	return adjacent;
};

export const visibleTabbables = (root: HTMLElement): HTMLElement[] => (

	Array.from(
		root.querySelectorAll([
			'.expanded > .children > .collapsed',
			'.expanded > .children > .expanded'
		].join(','))
	)
);

export const focusAdjacentTabbable = (root: HTMLElement, base: HTMLElement|undefined, dir: number): void => {

	const visibles = visibleTabbables(base);
	const idx = visibles.indexOf(root);

	visibles[idx + dir]?.focus();
}