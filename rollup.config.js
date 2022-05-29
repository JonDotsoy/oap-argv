import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

export default [
  {
    input: ['src/argv.ts', 'src/cli-manager.ts'],
    output: [
      {
        dir: 'cjs',
        format: 'cjs'
      },
      {
        dir: 'esm',
        format: 'esm'
      },
    ],
    plugins: [typescript()]
  },
  {
    input: 'src/argv.ts',
    output: [
      {
        file: 'cjs/argv.d.ts',
        format: 'cjs'
      },
      {
        file: 'esm/argv.d.ts',
        format: 'esm'
      },
    ],
    plugins: [dts()]
  },
  {
    input: 'src/cli-manager.ts',
    output: [
      {
        file: 'cjs/cli-manager.d.ts',
        format: 'cjs'
      },
      {
        file: 'esm/cli-manager.d.ts',
        format: 'esm'
      },
    ],
    plugins: [dts()]
  },
];
