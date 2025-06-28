import { jest } from '@jest/globals';

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

export function mockConsole() {
  // Mock all console methods
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
}

export function restoreConsole() {
  // Restore original console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
}

export function getConsoleMocks() {
  return {
    log: console.log as jest.Mock,
    warn: console.warn as jest.Mock,
    error: console.error as jest.Mock,
    info: console.info as jest.Mock,
    debug: console.debug as jest.Mock
  };
}
