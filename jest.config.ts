import { Config } from 'jest';
import { join, resolve } from 'path';
const root = resolve(__dirname, './');
const src = join(root, '/src');

const config: Config = {
  preset: 'ts-jest',
  coverageProvider: 'v8',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: 'src/.*?\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@/(.*)': `${src}/$1`,
  },
  setupFilesAfterEnv: ['jest-extended/all', './jest-setup-tests.ts'],
};

export default config;
