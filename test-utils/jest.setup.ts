import { mockConsole, restoreConsole } from './console-mock';

// Before each test, mock the console
beforeEach(() => {
  mockConsole();
});

// After each test, restore the console
afterEach(() => {
  restoreConsole();
});
