// import { resolve } from 'path';

// import copy from 'rollup-plugin-copy';

import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import scss from 'rollup-plugin-scss';
import del from 'rollup-plugin-delete';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import resolve from '@rollup/plugin-node-resolve';

import pkg from './package.json';
import tsconfig from './tsconfig.json';

export default [
    {
        input: 'lib/index.ts',
        plugins: [

            del({ targets: 'dist/*' }),

            resolve({
                resolveOnly: ['@riot-tools/state-utils']
            }),

            typescript({
                typescript: require('typescript'),
                tsconfig: 'tsconfig.json',
                tsconfigOverride: tsconfig
            }),

            generatePackageJson({
                baseContents: (pkg) => ({
                    ...pkg,
                    name: pkg.name,
                    scripts: undefined,
                    dependencies: {},
                    devDependencies: {}
                }),
            }),

            terser(),
        ],
        output: [
            {
                name: 'ModernJsTree',
                file: pkg.main,
                format: 'umd',
                sourcemap: true,
                inlineDynamicImports: true,
            },
            {
                file: pkg.module,
                format: 'es',
                sourcemap: true
            }
        ],
    },
    {
        input: 'lib/style.ts',
        plugins: [

            scss({
                output: 'dist/style.css',
                include: ['lib/*.scss'],
                sass: require('sass')
            }),
        ]
    }
];