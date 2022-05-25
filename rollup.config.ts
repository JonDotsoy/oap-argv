import ts from "@rollup/plugin-typescript"

const config: import('rollup').RollupOptions[] = [
  {
    input: [
      'src/argv.ts'
    ],
    output: [
      {
        dir: 'cjs',
        format: 'cjs',
      },
    ],
    plugins: [ts()],
  },
  {
    input: [
      'src/argv.ts',
      'src/cli-manager.ts',
    ],
    output: [
      {
        dir: 'esm',
        format: 'esm',
      },
    ],
    plugins: [ts()],
  }
];

export default config;
