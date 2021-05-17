import type {
    AllowedTypes, ExpandibleType, TreeName
} from '../types';

export const defineProperties = (target: object, props: object, opts: any = {}) => {

    const mapped = Object.entries(props).map(([name, value]) => {

        return [
            name, {
                enumerable: false,
                writable: false,
                configurable: true,
                value,
                ...(opts[name] || opts?.default)
            }
        ];
    });

    Object.defineProperties(target, Object.fromEntries(mapped));
};

export const defineProperty = (target: object, name: string, value: any, opts: any = {}) => {

    Object.defineProperty(target, name, {
        value,
        enumerable: false,
        writable: false,
        configurable: true,
        ...opts
    })
}

export const isNil = (val) => (
    val === null ||
    val === undefined
);

export const assert = (condition: any, msg: string) => {

    if (!condition) {
        throw Error(msg);
    }
};

export const is = (target: any, constructor: any) => (
    !isNil(target) && (
        target === constructor ||
        target.constructor === constructor
    )
);

export const isExpandable = (target: any) => (
    is(target, Object) ||
    is(target, Array) ||
    is(target, Set) ||
    is(target, Map)
);

export const eq = (target: any, ...checks: any[]) => {

    while (checks.length) {

        const check = checks.pop();

        if (target === check) {
            return true;
        }
    }

    return false;
};

export const random = () => Math.random().toString(36).substr(2, 9);

export const tryMany = (...fns) => {

    while(fns.length) {
        const fn = fns.shift();

        try {

            fn();
            break;
        }
        catch(_) {}
    }
};


export const allowedTypes = [
    Array,
    Object,
    Set,
    Map,
    Number,
    String,
    Date,
    Boolean,
    null,
    undefined
];


export const extractType = (value: AllowedTypes) => {

    if (isNil(value)) {
        return value
    }

    assert(
        allowedTypes.includes(value.constructor as any),
        `type ${value.constructor.name} is not allowed`
    );

    return value.constructor;
};

export const typeToString = (value: any): string => {

    if (isNil(value)) {

        return value + '';
    }

    return value.name;
}

export const pick = (value: Object, ...keys: string[]) => (

    Object.fromEntries(keys.map((k) => [k, value[k]]))
);

export const traceValue = (value, ...keys) => {

    return new Proxy(value, {
        get: function (target, prop, receiver) {

            if (keys.includes(prop)) {

                console.log(target);

                const e = new Error();
                const info = `${target.constructor.name} prop "${String(prop)}" called by:`;
                const trace = e.stack
                    .replace(/Error/, '').trim()
                    .replace(/\s{4}/g, '\n')
                    .replace(/at\s/g, '> ')
                    .replace(/.+\s/, '')
                    .trim();

                console.log(`%c TRACE:\n${info}\n ${trace}`, 'color: #1ac');

            }
            return Reflect.get(target, prop, receiver);
        },
    });
}

export const getKeys = (value: ExpandibleType, type: string = null) => {

    type = type || typeToString(extractType(value))

    if (
        type === 'Array' ||
        type === 'Object'
    ) {

        return Object.keys(value);
    }

    if (type === 'Set') {

        return Object.keys([...(value as Set<any>).values()]);
    }

    if (type === 'Map') {

        return [...(value as Map<any, any>).keys()];
    }
};

export const getEntries = (value: ExpandibleType, type: string = null) => {

    type = type || typeToString(extractType(value))

    if (
        type === 'Array' ||
        type === 'Object'
    ) {

        return Object.entries(value);
    }

    if (type === 'Set') {

        return Object.entries([...(value as Set<any>).values()]);
    }

    if (type === 'Map') {

        return [...(value as Map<any, any>).entries()];
    }
};

export const getSize = (value: ExpandibleType, type: string) => {

    type = type || typeToString(extractType(value))

    if (type === 'Array') {

        return (value as Array<any>).length;
    }

    if (type === 'Object') {

        return Object.keys(value).length;
    }

    return (value as Set<any>).size;
};

export const arrToBoolObject = (arr: TreeName[]): { [key: string]: boolean } => (
    Object.fromEntries(
        arr.map(key => [key, true])
    )
)