import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [{
    dir: 'lib',
    format: 'esm',
    entryFileNames: 'index.mjs'
  }, {
    dir: 'lib',
    format: 'cjs',
    entryFileNames: 'index.js'
  }],
  plugins: [
    typescript(),
    terser(),
  ]
};