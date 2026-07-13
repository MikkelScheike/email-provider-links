import { mockConsole, restoreConsole } from './console-mock';
import { resetDnsRateLimiter } from '../src/concurrent-dns';

// Before each test, mock the console
beforeEach(() => {
  mockConsole();
  resetDnsRateLimiter();
});

// After each test, restore the console
afterEach(() => {
  restoreConsole();
});
