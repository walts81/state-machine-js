const { join, resolve } = require('path');
const root = resolve(__dirname, './');
const src = join(root, '/src');

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  coverageProvider: 'v8',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: 'src/.*?\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@/(.*)': `${src}/$1`,
  },
  setupFilesAfterEnv: ['jest-extended/all'],
};
