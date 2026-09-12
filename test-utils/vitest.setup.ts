import { mockConsole, restoreConsole } from './console-mock';
import { resetDnsRateLimiter } from '../src/concurrent-dns';

beforeEach(() => {
  vi.clearAllMocks();
  mockConsole();
  resetDnsRateLimiter();
});

afterEach(() => {
  restoreConsole();
});
