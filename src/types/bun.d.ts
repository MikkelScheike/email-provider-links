declare module 'bun:test' {
  export const test: typeof import('@jest/globals').test;
  export const expect: typeof import('@jest/globals').expect;
  export const mock: typeof import('@jest/globals').jest.fn;
}
