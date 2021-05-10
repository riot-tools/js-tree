import './devtools.scss';

import { TreeExandable } from '../lib/tree-expandable';

const sample = {
    test: {
        prrrt: true,
        when: new Date(),
        high: {
            maybe: 5,
            yes: 10,
            no: {
                ifA: true,
                ifB: true,
                always: true,
                test: null,
                tast: undefined
            }
        }
    },
    tist: ['a', 'b', 'c'],
    teets: new Map([
        ['key-0', 'zero'],
        ['key-1', 'one'],
        ['key-2', 'two'],
        ['sub-object', {
            one: 1,
            two: 2,
            subMap: new Map([
                [1, '1']
            ])
        } as any],
        ['[[]][][][[][]', '$['],

    ]),
    tots: new Set([
        'pepe',
        'pipi',
        'popo',
        'pupu'
    ])
}

const mountTo = document.querySelector('div#tree');

const treeView = new TreeExandable({
    value: sample,
    mountTo
});

const events = [
    'collapse',
    'expand'
];

for (const event of events) {

    treeView.on(event, (...args) => {

        // console.info(event, args);
        // console.trace()
    });
}

window.treeView = treeView;
window.sample = sample;

treeView.expandAll();

const search = document.querySelector('#search') as HTMLInputElement;

search.addEventListener('keyup', () => {

    treeView.search(search.value);
});