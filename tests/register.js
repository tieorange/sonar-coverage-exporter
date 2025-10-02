const { transformSync } = require('esbuild');
const fs = require('node:fs');

const DEFAULT_OPTIONS = {
  loader: 'ts',
  target: 'es2020',
  format: 'cjs',
  sourcemap: 'inline',
};

require.extensions['.ts'] = function registerEsbuild(module, filename) {
  if (filename.endsWith('.d.ts')) {
    module._compile('', filename);
    return;
  }

  const source = fs.readFileSync(filename, 'utf8');
  const { code } = transformSync(source, {
    ...DEFAULT_OPTIONS,
    sourcefile: filename,
  });

  module._compile(code, filename);
};
